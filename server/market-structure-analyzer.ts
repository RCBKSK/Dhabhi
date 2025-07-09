export interface Candle {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timestamp: Date;
}

export interface SwingPoint {
  index: number;
  price: number;
  type: 'high' | 'low';
  timestamp: Date;
}

export interface BOSCHOCHEvent {
  type: 'BOS' | 'CHOCH';
  direction: 'bullish' | 'bearish';
  price: number;
  timestamp: Date;
  brokenLevel: number;
  significance: 'minor' | 'major';
}

export interface FairValueGap {
  id: string;
  upperBound: number;
  lowerBound: number;
  sizePercentage: number;
  timestamp: Date;
  direction: 'bullish' | 'bearish';
  isMitigated: boolean;
  mitigatedAt?: Date;
}

export interface MarketStructureAnalysis {
  currentStructure: 'Bullish' | 'Bearish' | 'Bullish (CHoCH)' | 'Bearish (CHoCH)' | 'Neutral';
  lastBOSCHOCH: BOSCHOCHEvent | null;
  activeFVGs: FairValueGap[];
  recentSwingPoints: SwingPoint[];
  trendStrength: number; // 0-100 scale
  structureConfidence: number; // 0-100 scale
}

export class MarketStructureAnalyzer {
  private lookbackWindow: number;
  private minFVGSize: number; // Minimum FVG size as percentage
  private swingPoints: SwingPoint[] = [];
  private bosChochEvents: BOSCHOCHEvent[] = [];
  private fairValueGaps: FairValueGap[] = [];

  constructor(lookbackWindow: number = 20, minFVGSizePercent: number = 0.2) {
    this.lookbackWindow = lookbackWindow;
    this.minFVGSize = minFVGSizePercent;
  }

  analyzeMarketStructure(candles: Candle[]): MarketStructureAnalysis {
    if (candles.length < this.lookbackWindow + 3) {
      return this.getDefaultAnalysis();
    }

    // Clear previous analysis for fresh calculation
    this.swingPoints = [];
    this.bosChochEvents = [];
    this.fairValueGaps = [];

    // Step 1: Detect swing highs and lows
    this.detectSwingPoints(candles);

    // Step 2: Detect BOS and CHOCH events
    this.detectBOSCHOCH(candles);

    // Step 3: Detect Fair Value Gaps
    this.detectFairValueGaps(candles);

    // Step 4: Determine current market structure
    const currentStructure = this.determineMarketStructure();

    // Step 5: Calculate trend strength and confidence
    const trendStrength = this.calculateTrendStrength(candles);
    const structureConfidence = this.calculateStructureConfidence();

    return {
      currentStructure,
      lastBOSCHOCH: this.getLastBOSCHOCH(),
      activeFVGs: this.getActiveFVGs(),
      recentSwingPoints: this.getRecentSwingPoints(10),
      trendStrength,
      structureConfidence
    };
  }

  private detectSwingPoints(candles: Candle[]): void {
    // Detect swing highs
    for (let i = this.lookbackWindow; i < candles.length - this.lookbackWindow; i++) {
      const currentHigh = candles[i].high;
      let isSwingHigh = true;

      // Check lookback window for higher highs
      for (let j = i - this.lookbackWindow; j < i + this.lookbackWindow + 1; j++) {
        if (j !== i && candles[j].high > currentHigh) {
          isSwingHigh = false;
          break;
        }
      }

      if (isSwingHigh) {
        this.swingPoints.push({
          index: i,
          price: currentHigh,
          type: 'high',
          timestamp: candles[i].timestamp
        });
      }
    }

    // Detect swing lows
    for (let i = this.lookbackWindow; i < candles.length - this.lookbackWindow; i++) {
      const currentLow = candles[i].low;
      let isSwingLow = true;

      // Check lookback window for lower lows
      for (let j = i - this.lookbackWindow; j < i + this.lookbackWindow + 1; j++) {
        if (j !== i && candles[j].low < currentLow) {
          isSwingLow = false;
          break;
        }
      }

      if (isSwingLow) {
        this.swingPoints.push({
          index: i,
          price: currentLow,
          type: 'low',
          timestamp: candles[i].timestamp
        });
      }
    }

    // Sort swing points by index
    this.swingPoints.sort((a, b) => a.index - b.index);
  }

  private detectBOSCHOCH(candles: Candle[]): void {
    const swingHighs = this.swingPoints.filter(sp => sp.type === 'high');
    const swingLows = this.swingPoints.filter(sp => sp.type === 'low');

    // Track last broken levels for CHOCH detection
    let lastBullishBOS: BOSCHOCHEvent | null = null;
    let lastBearishBOS: BOSCHOCHEvent | null = null;

    // Check for BOS (Break of Structure)
    for (let i = Math.max(this.lookbackWindow, 1); i < candles.length; i++) {
      const currentCandle = candles[i];

      // Check for bullish BOS (breaking above last swing high)
      const relevantSwingHighs = swingHighs.filter(sh => sh.index < i);
      if (relevantSwingHighs.length > 0) {
        const lastSwingHigh = relevantSwingHighs[relevantSwingHighs.length - 1];
        
        if (currentCandle.high > lastSwingHigh.price) {
          const bosEvent: BOSCHOCHEvent = {
            type: 'BOS',
            direction: 'bullish',
            price: currentCandle.high,
            timestamp: currentCandle.timestamp,
            brokenLevel: lastSwingHigh.price,
            significance: this.calculateSignificance(lastSwingHigh.price, currentCandle.high)
          };
          
          this.bosChochEvents.push(bosEvent);
          lastBullishBOS = bosEvent;
        }
      }

      // Check for bearish BOS (breaking below last swing low)
      const relevantSwingLows = swingLows.filter(sl => sl.index < i);
      if (relevantSwingLows.length > 0) {
        const lastSwingLow = relevantSwingLows[relevantSwingLows.length - 1];
        
        if (currentCandle.low < lastSwingLow.price) {
          const bosEvent: BOSCHOCHEvent = {
            type: 'BOS',
            direction: 'bearish',
            price: currentCandle.low,
            timestamp: currentCandle.timestamp,
            brokenLevel: lastSwingLow.price,
            significance: this.calculateSignificance(lastSwingLow.price, currentCandle.low)
          };
          
          this.bosChochEvents.push(bosEvent);
          lastBearishBOS = bosEvent;
        }
      }

      // Check for CHOCH (Change of Character)
      // CHOCH occurs when we have a BOS in opposite direction after previous BOS
      if (lastBullishBOS && relevantSwingLows.length > 0) {
        const recentSwingLow = relevantSwingLows[relevantSwingLows.length - 1];
        
        if (currentCandle.low < recentSwingLow.price && 
            currentCandle.timestamp > lastBullishBOS.timestamp) {
          const chochEvent: BOSCHOCHEvent = {
            type: 'CHOCH',
            direction: 'bearish',
            price: currentCandle.low,
            timestamp: currentCandle.timestamp,
            brokenLevel: recentSwingLow.price,
            significance: this.calculateSignificance(recentSwingLow.price, currentCandle.low)
          };
          
          this.bosChochEvents.push(chochEvent);
          lastBullishBOS = null; // Reset after CHOCH
        }
      }

      if (lastBearishBOS && relevantSwingHighs.length > 0) {
        const recentSwingHigh = relevantSwingHighs[relevantSwingHighs.length - 1];
        
        if (currentCandle.high > recentSwingHigh.price && 
            currentCandle.timestamp > lastBearishBOS.timestamp) {
          const chochEvent: BOSCHOCHEvent = {
            type: 'CHOCH',
            direction: 'bullish',
            price: currentCandle.high,
            timestamp: currentCandle.timestamp,
            brokenLevel: recentSwingHigh.price,
            significance: this.calculateSignificance(recentSwingHigh.price, currentCandle.high)
          };
          
          this.bosChochEvents.push(chochEvent);
          lastBearishBOS = null; // Reset after CHOCH
        }
      }
    }
  }

  private detectFairValueGaps(candles: Candle[]): void {
    // FVG detection: high[2] < low[0] for bullish, low[2] > high[0] for bearish
    for (let i = 2; i < candles.length; i++) {
      const candle0 = candles[i];     // Current candle
      const candle1 = candles[i - 1]; // Previous candle
      const candle2 = candles[i - 2]; // Two candles ago

      // Bullish FVG: high[2] < low[0]
      if (candle2.high < candle0.low) {
        const gapSize = candle0.low - candle2.high;
        const sizePercentage = (gapSize / candle1.close) * 100;

        if (sizePercentage >= this.minFVGSize) {
          const fvg: FairValueGap = {
            id: `FVG_${i}_bullish_${Date.now()}`,
            upperBound: candle0.low,
            lowerBound: candle2.high,
            sizePercentage,
            timestamp: candle0.timestamp,
            direction: 'bullish',
            isMitigated: false
          };

          this.fairValueGaps.push(fvg);
        }
      }

      // Bearish FVG: low[2] > high[0]
      if (candle2.low > candle0.high) {
        const gapSize = candle2.low - candle0.high;
        const sizePercentage = (gapSize / candle1.close) * 100;

        if (sizePercentage >= this.minFVGSize) {
          const fvg: FairValueGap = {
            id: `FVG_${i}_bearish_${Date.now()}`,
            upperBound: candle2.low,
            lowerBound: candle0.high,
            sizePercentage,
            timestamp: candle0.timestamp,
            direction: 'bearish',
            isMitigated: false
          };

          this.fairValueGaps.push(fvg);
        }
      }
    }

    // Check for FVG mitigation
    this.checkFVGMitigation(candles);
  }

  private checkFVGMitigation(candles: Candle[]): void {
    for (const fvg of this.fairValueGaps) {
      if (fvg.isMitigated) continue;

      // Find candles after FVG creation
      const relevantCandles = candles.filter(c => c.timestamp > fvg.timestamp);

      for (const candle of relevantCandles) {
        let isMitigated = false;

        if (fvg.direction === 'bullish') {
          // Bullish FVG is mitigated when price comes back to fill the gap
          if (candle.low <= fvg.lowerBound) {
            isMitigated = true;
          }
        } else {
          // Bearish FVG is mitigated when price comes back to fill the gap
          if (candle.high >= fvg.upperBound) {
            isMitigated = true;
          }
        }

        if (isMitigated) {
          fvg.isMitigated = true;
          fvg.mitigatedAt = candle.timestamp;
          break;
        }
      }
    }
  }

  private determineMarketStructure(): 'Bullish' | 'Bearish' | 'Bullish (CHoCH)' | 'Bearish (CHoCH)' | 'Neutral' {
    if (this.bosChochEvents.length === 0) {
      return 'Neutral';
    }

    const lastEvent = this.bosChochEvents[this.bosChochEvents.length - 1];

    if (lastEvent.type === 'CHOCH') {
      return lastEvent.direction === 'bullish' ? 'Bullish (CHoCH)' : 'Bearish (CHoCH)';
    } else {
      return lastEvent.direction === 'bullish' ? 'Bullish' : 'Bearish';
    }
  }

  private calculateSignificance(brokenLevel: number, breakPrice: number): 'minor' | 'major' {
    const breakPercentage = Math.abs((breakPrice - brokenLevel) / brokenLevel) * 100;
    return breakPercentage >= 1.0 ? 'major' : 'minor';
  }

  private calculateTrendStrength(candles: Candle[]): number {
    if (candles.length < 20) return 50;

    const recentCandles = candles.slice(-20);
    let bullishCandles = 0;
    let totalMove = 0;

    for (const candle of recentCandles) {
      if (candle.close > candle.open) {
        bullishCandles++;
      }
      totalMove += Math.abs(candle.close - candle.open);
    }

    const bullishPercentage = (bullishCandles / recentCandles.length) * 100;
    const avgCandleSize = totalMove / recentCandles.length;
    const lastClose = recentCandles[recentCandles.length - 1].close;
    const volatilityFactor = (avgCandleSize / lastClose) * 100;

    // Combine bullish percentage with volatility for trend strength
    return Math.min(100, Math.max(0, bullishPercentage + volatilityFactor * 5));
  }

  private calculateStructureConfidence(): number {
    const recentEvents = this.bosChochEvents.slice(-5);
    if (recentEvents.length === 0) return 0;

    let confidence = 50;
    
    // Higher confidence for more recent events
    confidence += recentEvents.length * 10;
    
    // Higher confidence for major breaks
    const majorBreaks = recentEvents.filter(e => e.significance === 'major').length;
    confidence += majorBreaks * 15;

    // Higher confidence for consistent direction
    const lastDirection = recentEvents[recentEvents.length - 1].direction;
    const consistentEvents = recentEvents.filter(e => e.direction === lastDirection).length;
    confidence += (consistentEvents / recentEvents.length) * 20;

    return Math.min(100, Math.max(0, confidence));
  }

  private getLastBOSCHOCH(): BOSCHOCHEvent | null {
    return this.bosChochEvents.length > 0 ? this.bosChochEvents[this.bosChochEvents.length - 1] : null;
  }

  private getActiveFVGs(): FairValueGap[] {
    return this.fairValueGaps
      .filter(fvg => !fvg.isMitigated)
      .slice(-5) // Get last 5 active FVGs
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  private getRecentSwingPoints(count: number): SwingPoint[] {
    return this.swingPoints
      .slice(-count)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  private getDefaultAnalysis(): MarketStructureAnalysis {
    return {
      currentStructure: 'Neutral',
      lastBOSCHOCH: null,
      activeFVGs: [],
      recentSwingPoints: [],
      trendStrength: 50,
      structureConfidence: 0
    };
  }

  // Utility method to get all detected events for debugging
  getAllEvents(): { swingPoints: SwingPoint[], bosChochEvents: BOSCHOCHEvent[], fvgs: FairValueGap[] } {
    return {
      swingPoints: this.swingPoints,
      bosChochEvents: this.bosChochEvents,
      fvgs: this.fairValueGaps
    };
  }
}

// Factory function for easy instantiation
export function createMarketStructureAnalyzer(lookbackWindow: number = 20, minFVGSizePercent: number = 0.2): MarketStructureAnalyzer {
  return new MarketStructureAnalyzer(lookbackWindow, minFVGSizePercent);
}