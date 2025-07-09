import { createMarketStructureAnalyzer, type Candle, type MarketStructureAnalysis } from "./market-structure-analyzer";
import { stockDataService } from "./stock-service";

export interface TimeframeData {
  timeframe: string;
  analysis: MarketStructureAnalysis;
  hasValidSignal: boolean;
  proximityToStructure: number; // Distance to last BOS/CHOCH level
}

export interface StockSMCResult {
  symbol: string;
  companyName: string;
  currentPrice: number;
  timeframes: TimeframeData[];
  matchingTimeframes: number;
  overallStructure: 'Bullish' | 'Bearish' | 'Bullish (CHoCH)' | 'Bearish (CHoCH)' | 'Neutral';
  latestBOSCHOCH: string;
  totalFVGZones: number;
  avgProximity: number;
  structureConfidence: number;
  lastUpdated: Date;
}

export interface BatchSMCAnalysisResult {
  stocks: StockSMCResult[];
  metadata: {
    totalStocksAnalyzed: number;
    stocksWithValidSignals: number;
    timeframesAnalyzed: string[];
    analysisTimestamp: Date;
    minTimeframeMatches: number;
  };
}

export class BatchSMCAnalyzer {
  private readonly timeframes = ['5m', '15m', '30m', '1h', '2h', '4h'];
  private readonly minTimeframeMatches = 2;

  async analyzeBatch(symbols: string[]): Promise<BatchSMCAnalysisResult> {
    const results: StockSMCResult[] = [];
    
    for (const symbol of symbols) {
      try {
        const stockResult = await this.analyzeStock(symbol);
        if (stockResult && stockResult.matchingTimeframes >= this.minTimeframeMatches) {
          results.push(stockResult);
        }
      } catch (error) {
        console.error(`Failed to analyze ${symbol}:`, error);
        // Continue with other stocks even if one fails
      }
    }

    // Sort by matching timeframes (descending), then by structure confidence
    results.sort((a, b) => {
      if (a.matchingTimeframes !== b.matchingTimeframes) {
        return b.matchingTimeframes - a.matchingTimeframes;
      }
      return b.structureConfidence - a.structureConfidence;
    });

    return {
      stocks: results,
      metadata: {
        totalStocksAnalyzed: symbols.length,
        stocksWithValidSignals: results.length,
        timeframesAnalyzed: this.timeframes,
        analysisTimestamp: new Date(),
        minTimeframeMatches: this.minTimeframeMatches
      }
    };
  }

  private async analyzeStock(symbol: string): Promise<StockSMCResult | null> {
    try {
      // Get current stock data for price and company name
      const currentPrice = await this.getCurrentPrice(symbol);
      const companyName = this.getCompanyName(symbol);
      
      const timeframeResults: TimeframeData[] = [];
      let totalFVGZones = 0;
      let validTimeframes = 0;
      let proximitySum = 0;
      let overallConfidence = 0;
      
      // Analyze each timeframe
      for (const timeframe of this.timeframes) {
        const candles = await this.generateCandleData(symbol, timeframe);
        const analyzer = createMarketStructureAnalyzer(20, 0.2);
        const analysis = analyzer.analyzeMarketStructure(candles);
        
        // Determine if this timeframe has a valid signal
        const hasValidSignal = this.hasValidStructureSignal(analysis);
        
        // Calculate proximity to structure level
        const proximityToStructure = this.calculateProximityToStructure(
          currentPrice, 
          analysis.lastBOSCHOCH
        );
        
        const timeframeData: TimeframeData = {
          timeframe,
          analysis,
          hasValidSignal,
          proximityToStructure
        };
        
        timeframeResults.push(timeframeData);
        
        if (hasValidSignal) {
          validTimeframes++;
          proximitySum += proximityToStructure;
          overallConfidence += analysis.structureConfidence;
        }
        
        totalFVGZones += analysis.activeFVGs.length;
      }

      // Only include stocks with minimum timeframe matches
      if (validTimeframes < this.minTimeframeMatches) {
        return null;
      }

      // Determine overall structure from highest confidence timeframe
      const highestConfidenceTimeframe = timeframeResults
        .filter(tf => tf.hasValidSignal)
        .sort((a, b) => b.analysis.structureConfidence - a.analysis.structureConfidence)[0];

      const overallStructure = highestConfidenceTimeframe?.analysis.currentStructure || 'Neutral';
      
      // Format latest BOS/CHOCH info
      const latestBOSCHOCH = this.formatLatestBOSCHOCH(highestConfidenceTimeframe?.analysis);

      return {
        symbol,
        companyName,
        currentPrice,
        timeframes: timeframeResults,
        matchingTimeframes: validTimeframes,
        overallStructure,
        latestBOSCHOCH,
        totalFVGZones,
        avgProximity: validTimeframes > 0 ? proximitySum / validTimeframes : 0,
        structureConfidence: validTimeframes > 0 ? overallConfidence / validTimeframes : 0,
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error(`Error analyzing stock ${symbol}:`, error);
      return null;
    }
  }

  private hasValidStructureSignal(analysis: MarketStructureAnalysis): boolean {
    return analysis.currentStructure !== 'Neutral' && 
           analysis.lastBOSCHOCH !== null &&
           analysis.structureConfidence > 50;
  }

  private calculateProximityToStructure(currentPrice: number, lastEvent: any): number {
    if (!lastEvent) return 100; // Max distance if no structure event
    
    const distance = Math.abs(currentPrice - lastEvent.price);
    return (distance / currentPrice) * 100; // Return as percentage
  }

  private formatLatestBOSCHOCH(analysis?: MarketStructureAnalysis): string {
    if (!analysis?.lastBOSCHOCH) return 'None';
    
    const event = analysis.lastBOSCHOCH;
    const timeAgo = this.getTimeAgo(event.timestamp);
    return `${event.type} ${event.direction} (${timeAgo})`;
  }

  private getTimeAgo(timestamp: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffHours > 0) return `${diffHours}h ago`;
    return `${diffMinutes}m ago`;
  }

  private async getCurrentPrice(symbol: string): Promise<number> {
    // Try to get real price from stock data service
    try {
      const quotes = await stockDataService.fetchIndianStockData([symbol]);
      const quote = quotes.get(symbol);
      if (quote) {
        return quote.lastPrice;
      }
    } catch (error) {
      console.log(`Using mock price for ${symbol} due to data fetch error`);
    }
    
    // Fallback to base price from stock service
    return this.getBasePriceForSymbol(symbol);
  }

  private getBasePriceForSymbol(symbol: string): number {
    const basePrices: { [key: string]: number } = {
      "RELIANCE": 1540, "TCS": 4100, "HDFCBANK": 1720, "BHARTIARTL": 1520,
      "ICICIBANK": 1200, "SBIN": 820, "LICI": 950, "INFY": 1850,
      "HINDUNILVR": 2380, "MARUTI": 11200, "KOTAKBANK": 1740, "BAJFINANCE": 6800,
      "LT": 3600, "HCLTECH": 1790, "AXISBANK": 1100, "ASIANPAINT": 2850,
      "WIPRO": 565, "ADANIENT": 2420, "NTPC": 355, "ULTRACEMCO": 11500,
      "ONGC": 250, "TITAN": 3400, "POWERGRID": 325, "NESTLEIND": 2200,
      "BAJAJFINSV": 1620, "COALINDIA": 410, "TECHM": 1680, "TATAMOTORS": 775,
      "SUNPHARMA": 1780, "ADANIPORTS": 760, "DIVISLAB": 6100, "JSWSTEEL": 870,
      "DRREDDY": 1370, "GRASIM": 2650, "TATASTEEL": 145, "HINDALCO": 650,
      "BRITANNIA": 4800, "CIPLA": 1550, "HEROMOTOCO": 4750, "BAJAJ-AUTO": 9200,
      "APOLLOHOSP": 7100, "INDUSINDBK": 975, "EICHERMOT": 4920, "TATACONSUM": 910,
      "BPCL": 300, "GODREJCP": 1200, "NIFTY": 25500, "BANKNIFTY": 55000, "SENSEX": 84000
    };
    return basePrices[symbol] || (500 + Math.random() * 1000);
  }

  private getCompanyName(symbol: string): string {
    const names: { [key: string]: string } = {
      "RELIANCE": "Reliance Industries Limited",
      "TCS": "Tata Consultancy Services Limited",
      "HDFCBANK": "HDFC Bank Limited",
      "BHARTIARTL": "Bharti Airtel Limited",
      "ICICIBANK": "ICICI Bank Limited",
      "SBIN": "State Bank of India",
      "LICI": "Life Insurance Corporation of India",
      "INFY": "Infosys Limited",
      "HINDUNILVR": "Hindustan Unilever Limited",
      "MARUTI": "Maruti Suzuki India Limited",
      "KOTAKBANK": "Kotak Mahindra Bank Limited",
      "BAJFINANCE": "Bajaj Finance Limited",
      "LT": "Larsen & Toubro Limited",
      "HCLTECH": "HCL Technologies Limited",
      "AXISBANK": "Axis Bank Limited",
      "ASIANPAINT": "Asian Paints Limited",
      "WIPRO": "Wipro Limited",
      "NIFTY": "Nifty 50 Index",
      "BANKNIFTY": "Nifty Bank Index",
      "SENSEX": "BSE Sensex Index"
    };
    return names[symbol] || `${symbol} Limited`;
  }

  private async generateCandleData(symbol: string, timeframe: string): Promise<Candle[]> {
    // Generate realistic candle data for the given timeframe
    const basePrice = this.getBasePriceForSymbol(symbol);
    const candles: Candle[] = [];
    const candleCount = 100; // Generate 100 candles for analysis
    
    // Timeframe to minutes mapping
    const timeframeMinutes: { [key: string]: number } = {
      '5m': 5, '15m': 15, '30m': 30, '1h': 60, '2h': 120, '4h': 240
    };
    
    const intervalMinutes = timeframeMinutes[timeframe] || 60;
    const now = new Date();
    
    let currentPrice = basePrice;
    
    for (let i = candleCount - 1; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - (i * intervalMinutes * 60 * 1000));
      
      // Generate realistic price movement
      const volatility = this.getVolatilityForSymbol(symbol, timeframe);
      const trend = Math.sin(i / 10) * 0.5; // Add some trending behavior
      const randomWalk = (Math.random() - 0.5) * volatility;
      
      const priceChange = (trend + randomWalk) * currentPrice / 100;
      const open = currentPrice;
      const close = currentPrice + priceChange;
      
      // Generate high and low based on volatility
      const rangeFactor = volatility * 0.3;
      const high = Math.max(open, close) + (Math.random() * rangeFactor * currentPrice / 100);
      const low = Math.min(open, close) - (Math.random() * rangeFactor * currentPrice / 100);
      
      candles.push({
        open: Math.round(open * 100) / 100,
        high: Math.round(high * 100) / 100,
        low: Math.round(low * 100) / 100,
        close: Math.round(close * 100) / 100,
        volume: Math.floor(10000 + Math.random() * 100000),
        timestamp
      });
      
      currentPrice = close;
    }
    
    return candles;
  }

  private getVolatilityForSymbol(symbol: string, timeframe: string): number {
    // Base volatility factors
    const baseVolatility: { [key: string]: number } = {
      "TATAMOTORS": 3.5, "ADANIENT": 4.0, "JSWSTEEL": 3.2, "TATASTEEL": 3.8,
      "ITC": 1.2, "HINDUNILVR": 1.5, "NESTLEIND": 1.0, "BRITANNIA": 1.3,
      "NIFTY": 0.8, "BANKNIFTY": 1.2, "SENSEX": 0.9
    };
    
    // Timeframe multipliers (higher timeframes = higher volatility)
    const timeframeMultiplier: { [key: string]: number } = {
      '5m': 0.5, '15m': 0.7, '30m': 0.9, '1h': 1.0, '2h': 1.3, '4h': 1.5
    };
    
    const base = baseVolatility[symbol] || 2.0;
    const multiplier = timeframeMultiplier[timeframe] || 1.0;
    
    return base * multiplier;
  }
}

// Export singleton instance
export const batchSMCAnalyzer = new BatchSMCAnalyzer();