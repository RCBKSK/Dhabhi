import type { InsertStock } from "@shared/schema";

// NSE stock symbols for monitoring (top 50 liquid stocks)
export const NSE_SYMBOLS = [
  "RELIANCE", "TCS", "HDFCBANK", "INFY", "HINDUNILVR", "ICICIBANK", "KOTAKBANK",
  "BHARTIARTL", "ITC", "SBIN", "BAJFINANCE", "LICI", "LT", "HCLTECH", "AXISBANK",
  "ASIANPAINT", "MARUTI", "SUNPHARMA", "TITAN", "ULTRACEMCO", "NESTLEIND", "WIPRO",
  "ADANIPORTS", "NTPC", "POWERGRID", "TATAMOTORS", "JSWSTEEL", "BAJAJFINSV",
  "TECHM", "GRASIM", "COALINDIA", "DRREDDY", "DIVISLAB", "HINDALCO", "TATASTEEL",
  "BRITANNIA", "CIPLA", "INDUSINDBK", "EICHERMOT", "APOLLOHOSP", "HEROMOTOCO",
  "ONGC", "BPCL", "ADANIENSOL", "TATACONSUM", "BAJAJ-AUTO", "PIDILITIND",
  "GODREJCP", "SIEMENS", "IOC"
];

interface NSEQuote {
  symbol: string;
  companyName: string;
  lastPrice: number;
  change: number;
  pChange: number;
  totalTradedVolume: number;
  totalTradedValue: number;
  lastUpdateTime: string;
}

interface SMCAnalysis {
  bosLevel: number;
  chochLevel: number;
  trend: "BULLISH" | "BEARISH";
  signalType: "UPPER" | "LOWER";
  timeframes: string[];
  target: number;
  risk: number;
  fvgLevels: number[];
  liquidityZones: number[];
  hasValidSignal: boolean;
}

class StockDataService {
  private cache: Map<string, NSEQuote> = new Map();
  private lastUpdate: Date = new Date(0);
  private updateInterval = 60000; // 1 minute cache

  async fetchNSEData(symbols: string[]): Promise<Map<string, NSEQuote>> {
    // In production, this would call actual NSE API or financial data provider
    // For now, simulate realistic NSE data with proper price movements
    const quotes = new Map<string, NSEQuote>();
    
    for (const symbol of symbols) {
      const cached = this.cache.get(symbol);
      const basePrice = this.getBasePrice(symbol);
      
      // Simulate realistic price movements
      const volatility = this.getVolatility(symbol);
      const priceChange = (Math.random() - 0.5) * volatility * 2;
      const currentPrice = cached ? 
        Math.max(cached.lastPrice + priceChange, basePrice * 0.95) : 
        basePrice + priceChange;
      
      const change = cached ? currentPrice - cached.lastPrice : priceChange;
      const pChange = (change / currentPrice) * 100;
      
      quotes.set(symbol, {
        symbol,
        companyName: this.getCompanyName(symbol),
        lastPrice: Math.round(currentPrice * 100) / 100,
        change: Math.round(change * 100) / 100,
        pChange: Math.round(pChange * 100) / 100,
        totalTradedVolume: Math.floor(Math.random() * 10000000) + 1000000,
        totalTradedValue: Math.floor(Math.random() * 50000000000) + 10000000000,
        lastUpdateTime: new Date().toISOString()
      });
    }
    
    this.cache = quotes;
    this.lastUpdate = new Date();
    return quotes;
  }

  private getBasePrice(symbol: string): number {
    const prices: { [key: string]: number } = {
      "RELIANCE": 2485, "TCS": 3847, "HDFCBANK": 1642, "INFY": 1789,
      "HINDUNILVR": 2645, "ICICIBANK": 1078, "KOTAKBANK": 1734,
      "BHARTIARTL": 1525, "ITC": 456, "SBIN": 824, "BAJFINANCE": 6847,
      "LT": 3456, "HCLTECH": 1567, "AXISBANK": 1145, "ASIANPAINT": 2890,
      "MARUTI": 10567, "SUNPHARMA": 1234, "TITAN": 3234, "ULTRACEMCO": 10234,
      "NESTLEIND": 2345, "WIPRO": 567, "ADANIPORTS": 789, "NTPC": 234,
      "POWERGRID": 287, "TATAMOTORS": 635, "JSWSTEEL": 876, "BAJAJFINSV": 1567
    };
    return prices[symbol] || 1000;
  }

  private getVolatility(symbol: string): number {
    // Different stocks have different volatilities
    const highVol = ["TATAMOTORS", "JSWSTEEL", "TATASTEEL", "ADANIPORTS"];
    const lowVol = ["NESTLEIND", "HINDUNILVR", "ITC", "POWERGRID"];
    
    if (highVol.includes(symbol)) return 50;
    if (lowVol.includes(symbol)) return 10;
    return 25; // medium volatility
  }

  private getCompanyName(symbol: string): string {
    const names: { [key: string]: string } = {
      "RELIANCE": "Reliance Industries Ltd",
      "TCS": "Tata Consultancy Services Ltd",
      "HDFCBANK": "HDFC Bank Ltd",
      "INFY": "Infosys Ltd",
      "TATAMOTORS": "Tata Motors Ltd",
      "WIPRO": "Wipro Ltd",
      "BAJFINANCE": "Bajaj Finance Ltd",
      "ICICIBANK": "ICICI Bank Ltd",
      "SBIN": "State Bank of India",
      "KOTAKBANK": "Kotak Mahindra Bank Ltd"
    };
    return names[symbol] || `${symbol} Ltd`;
  }

  performSMCAnalysis(quote: NSEQuote, historicalData?: number[]): SMCAnalysis {
    const price = quote.lastPrice;
    
    // Simulate SMC analysis with realistic levels
    const atr = price * 0.02; // 2% ATR approximation
    const swingRange = atr * 3;
    
    // Generate BOS/CHOCH levels based on price action
    const bosLevel = this.calculateBOSLevel(price, quote.change > 0);
    const chochLevel = bosLevel + (quote.change > 0 ? atr : -atr);
    
    // Determine trend and signal type
    const trend: "BULLISH" | "BEARISH" = quote.change > 0 ? "BULLISH" : "BEARISH";
    const distance = Math.abs(price - bosLevel);
    
    // Only show stocks within 6 points of BOS/CHOCH
    const hasValidSignal = distance <= 6;
    
    if (!hasValidSignal) {
      return {
        bosLevel,
        chochLevel,
        trend,
        signalType: trend === "BULLISH" ? "UPPER" : "LOWER",
        timeframes: [],
        target: price + (trend === "BULLISH" ? swingRange : -swingRange),
        risk: price + (trend === "BULLISH" ? -atr : atr),
        fvgLevels: [],
        liquidityZones: [],
        hasValidSignal: false
      };
    }

    // Generate timeframes where BOS/CHOCH exists (minimum 2 required)
    const timeframes = this.generateValidTimeframes(price, bosLevel);
    
    // Fair Value Gap levels
    const fvgLevels = this.calculateFVGLevels(price, atr);
    
    // Liquidity zones
    const liquidityZones = this.calculateLiquidityZones(price, swingRange);
    
    return {
      bosLevel,
      chochLevel,
      trend,
      signalType: trend === "BULLISH" ? "UPPER" : "LOWER",
      timeframes,
      target: price + (trend === "BULLISH" ? swingRange : -swingRange),
      risk: price + (trend === "BULLISH" ? -atr * 2 : atr * 2),
      fvgLevels,
      liquidityZones,
      hasValidSignal: timeframes.length >= 2
    };
  }

  private calculateBOSLevel(price: number, isBullish: boolean): number {
    const offset = price * 0.003; // 0.3% offset
    return isBullish ? price + offset : price - offset;
  }

  private generateValidTimeframes(price: number, bosLevel: number): string[] {
    const allTimeframes = ["5m", "15m", "30m", "45m", "1h", "2h", "4h"];
    const validTimeframes: string[] = [];
    
    // Simulate timeframe analysis - closer to BOS level means more timeframes
    const distance = Math.abs(price - bosLevel);
    const maxTimeframes = Math.max(2, 7 - Math.floor(distance));
    
    for (let i = 0; i < Math.min(maxTimeframes, allTimeframes.length); i++) {
      if (Math.random() > 0.3) { // 70% chance for each timeframe
        validTimeframes.push(allTimeframes[i]);
      }
    }
    
    // Ensure at least 2 timeframes for valid signals
    if (validTimeframes.length < 2 && distance <= 6) {
      validTimeframes.push("5m", "30m");
    }
    
    return validTimeframes;
  }

  private calculateFVGLevels(price: number, atr: number): number[] {
    // Generate 2-3 Fair Value Gap levels
    const gaps: number[] = [];
    const gapSize = atr * 0.5;
    
    gaps.push(price + gapSize);
    gaps.push(price - gapSize);
    
    if (Math.random() > 0.5) {
      gaps.push(price + gapSize * 2);
    }
    
    return gaps.map(level => Math.round(level * 100) / 100);
  }

  private calculateLiquidityZones(price: number, range: number): number[] {
    // Generate liquidity zones above and below current price
    return [
      Math.round((price + range) * 100) / 100,
      Math.round((price - range) * 100) / 100,
      Math.round((price + range * 1.5) * 100) / 100,
      Math.round((price - range * 1.5) * 100) / 100
    ];
  }

  async getAnalyzedStocks(symbols: string[] = NSE_SYMBOLS.slice(0, 20)): Promise<InsertStock[]> {
    const quotes = await this.fetchNSEData(symbols);
    const analyzedStocks: InsertStock[] = [];
    
    const quotesArray = Array.from(quotes.entries());
    for (const [symbol, quote] of quotesArray) {
      const analysis = this.performSMCAnalysis(quote);
      
      // Only include stocks with valid SMC signals
      if (analysis.hasValidSignal) {
        analyzedStocks.push({
          symbol: quote.symbol,
          price: quote.lastPrice,
          change: quote.change,
          changePercent: quote.pChange,
          bosLevel: analysis.bosLevel,
          distance: Math.abs(quote.lastPrice - analysis.bosLevel),
          target: analysis.target,
          risk: analysis.risk,
          trend: analysis.trend,
          signalType: analysis.signalType,
          timeframes: analysis.timeframes,
          isFavorite: false
        });
      }
    }
    
    return analyzedStocks;
  }

  shouldUpdateCache(): boolean {
    return Date.now() - this.lastUpdate.getTime() > this.updateInterval;
  }
}

export const stockDataService = new StockDataService();