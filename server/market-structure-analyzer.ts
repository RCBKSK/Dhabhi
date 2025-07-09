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
  qualityScore: number; // 0-100 based on size, proximity to structure, recency
  nearStructureEvent: boolean; // Whether created near BOS/CHOCH
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
  private bosThreshold: number; // BOS break threshold percentage
  private chochThreshold: number; // CHOCH break threshold percentage
  private minStructureDistance: number; // Minimum distance between opposite structure events
  private structureLockBars: number; // Bars to lock structure after BOS/CHOCH

  constructor(
    lookbackWindow: number = 20, 
    minFVGSizePercent: number = 0.2,
    bosThreshold: number = 0.3,
    chochThreshold: number = 0.5,
    minStructureDistance: number = 1.0,
    structureLockBars: number = 5
  ) {
    this.lookbackWindow = lookbackWindow;
    this.minFVGSize = minFVGSizePercent;
    this.bosThreshold = bosThreshold;
    this.chochThreshold = chochThreshold;
    this.minStructureDistance = minStructureDistance;
    this.structureLockBars = structureLockBars;
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
    // Calculate dynamic lookback window based on ATR
    const atr = this.calculateATR(candles, 14);
    const avgPrice = candles.slice(-20).reduce((sum, c) => sum + (c.high + c.low + c.close) / 3, 0) / 20;
    const volatilityRatio = (atr / avgPrice) * 100;
    
    // Adjust lookback based on volatility: lower volatility = tighter lookback
    const dynamicLookback = Math.max(5, Math.min(30, 
      volatilityRatio < 1 ? this.lookbackWindow / 2 : 
      volatilityRatio > 3 ? this.lookbackWindow * 1.5 : 
      this.lookbackWindow
    ));
    
    const lookback = Math.floor(dynamicLookback);

    // Detect swing highs with percentage validation
    for (let i = lookback; i < candles.length - lookback; i++) {
      const currentHigh = candles[i].high;
      let isSwingHigh = true;
      
      // Add percentage threshold for cleaner swing detection
      const swingHighThreshold = currentHigh * (1 - 0.1 / 100); // 0.1% threshold

      // Check lookback window for higher highs
      for (let j = i - lookback; j < i + lookback + 1; j++) {
        if (j !== i && candles[j].high >= swingHighThreshold) {
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

    // Detect swing lows with percentage validation
    for (let i = lookback; i < candles.length - lookback; i++) {
      const currentLow = candles[i].low;
      let isSwingLow = true;
      
      // Add percentage threshold for cleaner swing detection
      const swingLowThreshold = currentLow * (1 + 0.1 / 100); // 0.1% threshold

      // Check lookback window for lower lows
      for (let j = i - lookback; j < i + lookback + 1; j++) {
        if (j !== i && candles[j].low <= swingLowThreshold) {
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

  private calculateATR(candles: Candle[], period: number = 14): number {
    if (candles.length < period + 1) return 0;
    
    let trSum = 0;
    for (let i = 1; i < Math.min(period + 1, candles.length); i++) {
      const current = candles[i];
      const previous = candles[i - 1];
      
      const tr = Math.max(
        current.high - current.low,
        Math.abs(current.high - previous.close),
        Math.abs(current.low - previous.close)
      );
      trSum += tr;
    }
    
    return trSum / period;
  }

  private detectBOSCHOCH(candles: Candle[]): void {
    const swingHighs = this.swingPoints.filter(sp => sp.type === 'high');
    const swingLows = this.swingPoints.filter(sp => sp.type === 'low');

    // Track last broken levels and structure lock for CHOCH detection
    let lastBullishBOS: BOSCHOCHEvent | null = null;
    let lastBearishBOS: BOSCHOCHEvent | null = null;
    let lastStructureEvent: BOSCHOCHEvent | null = null;
    let structureLockUntil = 0;

    // Check for BOS (Break of Structure)
    for (let i = Math.max(this.lookbackWindow, 1); i < candles.length; i++) {
      const currentCandle = candles[i];

      // Check structure lock to prevent flipping back and forth
      if (i < structureLockUntil && lastStructureEvent) {
        continue;
      }

      // Check for bullish BOS (breaking above last swing high)
      const relevantSwingHighs = swingHighs.filter(sh => sh.index < i);
      if (relevantSwingHighs.length > 0) {
        const lastSwingHigh = relevantSwingHighs[relevantSwingHighs.length - 1];
        
        // Apply BOS threshold for noise filtering
        const bosBreakLevel = lastSwingHigh.price * (1 + this.bosThreshold / 100);
        
        // Ensure candle closes above the level (not just wicks) and meets distance requirement
        if (currentCandle.close > bosBreakLevel && 
            this.validateStructureDistance(lastSwingHigh.price, currentCandle.close, lastBearishBOS)) {
          
          const bosEvent: BOSCHOCHEvent = {
            type: 'BOS',
            direction: 'bullish',
            price: currentCandle.close,
            timestamp: currentCandle.timestamp,
            brokenLevel: lastSwingHigh.price,
            significance: this.calculateSignificance(lastSwingHigh.price, currentCandle.close)
          };
          
          this.bosChochEvents.push(bosEvent);
          lastBullishBOS = bosEvent;
          lastStructureEvent = bosEvent;
          structureLockUntil = i + this.structureLockBars;
        }
      }

      // Check for bearish BOS (breaking below last swing low)
      const relevantSwingLows = swingLows.filter(sl => sl.index < i);
      if (relevantSwingLows.length > 0) {
        const lastSwingLow = relevantSwingLows[relevantSwingLows.length - 1];
        
        // Apply BOS threshold for noise filtering
        const bosBreakLevel = lastSwingLow.price * (1 - this.bosThreshold / 100);
        
        // Ensure candle closes below the level and meets distance requirement
        if (currentCandle.close < bosBreakLevel && 
            this.validateStructureDistance(lastSwingLow.price, currentCandle.close, lastBullishBOS)) {
          
          const bosEvent: BOSCHOCHEvent = {
            type: 'BOS',
            direction: 'bearish',
            price: currentCandle.close,
            timestamp: currentCandle.timestamp,
            brokenLevel: lastSwingLow.price,
            significance: this.calculateSignificance(lastSwingLow.price, currentCandle.close)
          };
          
          this.bosChochEvents.push(bosEvent);
          lastBearishBOS = bosEvent;
          lastStructureEvent = bosEvent;
          structureLockUntil = i + this.structureLockBars;
        }
      }

      // Check for CHOCH (Change of Character) with enhanced validation
      if (lastBullishBOS && relevantSwingLows.length > 0) {
        const recentSwingLow = relevantSwingLows[relevantSwingLows.length - 1];
        
        // Apply CHOCH threshold (higher than BOS for more significant breaks)
        const chochBreakLevel = recentSwingLow.price * (1 - this.chochThreshold / 100);
        
        if (currentCandle.close < chochBreakLevel && 
            currentCandle.timestamp > lastBullishBOS.timestamp &&
            this.validateStructureDistance(recentSwingLow.price, currentCandle.close, lastBullishBOS)) {
          
          const chochEvent: BOSCHOCHEvent = {
            type: 'CHOCH',
            direction: 'bearish',
            price: currentCandle.close,
            timestamp: currentCandle.timestamp,
            brokenLevel: recentSwingLow.price,
            significance: this.calculateSignificance(recentSwingLow.price, currentCandle.close)
          };
          
          this.bosChochEvents.push(chochEvent);
          lastBullishBOS = null; // Reset after CHOCH
          lastStructureEvent = chochEvent;
          structureLockUntil = i + this.structureLockBars;
        }
      }

      if (lastBearishBOS && relevantSwingHighs.length > 0) {
        const recentSwingHigh = relevantSwingHighs[relevantSwingHighs.length - 1];
        
        // Apply CHOCH threshold
        const chochBreakLevel = recentSwingHigh.price * (1 + this.chochThreshold / 100);
        
        if (currentCandle.close > chochBreakLevel && 
            currentCandle.timestamp > lastBearishBOS.timestamp &&
            this.validateStructureDistance(recentSwingHigh.price, currentCandle.close, lastBearishBOS)) {
          
          const chochEvent: BOSCHOCHEvent = {
            type: 'CHOCH',
            direction: 'bullish',
            price: currentCandle.close,
            timestamp: currentCandle.timestamp,
            brokenLevel: recentSwingHigh.price,
            significance: this.calculateSignificance(recentSwingHigh.price, currentCandle.close)
          };
          
          this.bosChochEvents.push(chochEvent);
          lastBearishBOS = null; // Reset after CHOCH
          lastStructureEvent = chochEvent;
          structureLockUntil = i + this.structureLockBars;
        }
      }
    }
  }

  private validateStructureDistance(brokenLevel: number, currentPrice: number, lastOppositeEvent: BOSCHOCHEvent | null): boolean {
    // Ensure minimum distance from last opposite structure event
    if (!lastOppositeEvent) return true;
    
    const distanceFromLastEvent = Math.abs(currentPrice - lastOppositeEvent.price);
    const minimumDistance = brokenLevel * (this.minStructureDistance / 100);
    
    return distanceFromLastEvent >= minimumDistance;
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
          const nearStructureEvent = this.isNearStructureEvent(candle0.timestamp);
          const qualityScore = this.calculateFVGQuality(sizePercentage, nearStructureEvent, candle0.timestamp, candles.length - i);
          
          const fvg: FairValueGap = {
            id: `FVG_${i}_bullish_${Date.now()}`,
            upperBound: candle0.low,
            lowerBound: candle2.high,
            sizePercentage,
            timestamp: candle0.timestamp,
            direction: 'bullish',
            isMitigated: false,
            qualityScore,
            nearStructureEvent
          };

          this.fairValueGaps.push(fvg);
        }
      }

      // Bearish FVG: low[2] > high[0]
      if (candle2.low > candle0.high) {
        const gapSize = candle2.low - candle0.high;
        const sizePercentage = (gapSize / candle1.close) * 100;

        if (sizePercentage >= this.minFVGSize) {
          const nearStructureEvent = this.isNearStructureEvent(candle0.timestamp);
          const qualityScore = this.calculateFVGQuality(sizePercentage, nearStructureEvent, candle0.timestamp, candles.length - i);
          
          const fvg: FairValueGap = {
            id: `FVG_${i}_bearish_${Date.now()}`,
            upperBound: candle2.low,
            lowerBound: candle0.high,
            sizePercentage,
            timestamp: candle0.timestamp,
            direction: 'bearish',
            isMitigated: false,
            qualityScore,
            nearStructureEvent
          };

          this.fairValueGaps.push(fvg);
        }
      }
    }

    // Check for FVG mitigation and prune old/low-quality FVGs
    this.checkFVGMitigation(candles);
    this.pruneFVGs();
  }

  private calculateFVGQuality(sizePercentage: number, nearStructureEvent: boolean, timestamp: Date, barsFromEnd: number): number {
    let score = 0;
    
    // Size component (0-40 points)
    if (sizePercentage >= 1.0) score += 40;
    else if (sizePercentage >= 0.7) score += 30;
    else if (sizePercentage >= 0.5) score += 20;
    else if (sizePercentage >= 0.3) score += 10;
    
    // Structure proximity component (0-30 points)
    if (nearStructureEvent) score += 30;
    
    // Recency component (0-30 points) - more recent = higher score
    if (barsFromEnd <= 5) score += 30;
    else if (barsFromEnd <= 10) score += 20;
    else if (barsFromEnd <= 20) score += 10;
    
    return Math.min(100, score);
  }

  private isNearStructureEvent(fvgTimestamp: Date): boolean {
    // Check if FVG was created within 3 bars of a BOS/CHOCH event
    const recentEvents = this.bosChochEvents.filter(event => {
      const timeDiff = Math.abs(fvgTimestamp.getTime() - event.timestamp.getTime());
      return timeDiff <= 3 * 60000; // 3 minutes for demo (adjust based on timeframe)
    });
    
    return recentEvents.length > 0;
  }

  private pruneFVGs(): void {
    // Remove old FVGs (older than 50 bars) and low-quality FVGs
    const now = new Date();
    this.fairValueGaps = this.fairValueGaps.filter(fvg => {
      const age = (now.getTime() - fvg.timestamp.getTime()) / (1000 * 60); // Age in minutes
      const isOld = age > 50 * 5; // 50 bars * 5 minutes per bar (adjust for timeframe)
      const isLowQuality = fvg.qualityScore < 20;
      
      return !isOld && !isLowQuality;
    });
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
export function createMarketStructureAnalyzer(
  lookbackWindow: number = 20, 
  minFVGSizePercent: number = 0.2,
  bosThreshold: number = 0.3,
  chochThreshold: number = 0.5,
  minStructureDistance: number = 1.0,
  structureLockBars: number = 5
): MarketStructureAnalyzer {
  return new MarketStructureAnalyzer(lookbackWindow, minFVGSizePercent, bosThreshold, chochThreshold, minStructureDistance, structureLockBars);
}