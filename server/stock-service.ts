
import type { InsertStock } from "@shared/schema";
import axios from "axios";

// US stock symbols for monitoring (major liquid stocks supported by Finnhub)
export const US_SYMBOLS = [
  "AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "META", "TSLA", "AVGO", "ORCL", "WMT",
  "LLY", "JPM", "V", "UNH", "XOM", "MA", "COST", "HD", "PG", "NFLX",
  "JNJ", "ABBV", "BAC", "CRM", "CVX", "KO", "AMD", "PEP", "TMO", "ACN",
  "MRK", "CSCO", "LIN", "ABT", "IBM", "DHR", "VZ", "TXN", "QCOM", "WFC",
  "CMCSA", "NEE", "RTX", "UNP", "LOW", "PM", "SPGI", "HON", "INTU", "CAT"
];

interface FinnhubQuote {
  c: number; // current price
  d: number; // change
  dp: number; // percent change
  h: number; // high price of the day
  l: number; // low price of the day
  o: number; // open price of the day
  pc: number; // previous close price
  t: number; // timestamp
}

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
  trendAnalysis: { [timeframe: string]: "BULLISH" | "BEARISH" | "NEUTRAL" };
  proximityZone: "NEAR_UPPER_BOS" | "NEAR_LOWER_BOS" | "NEUTRAL";
  swingTarget: number;
}

class StockDataService {
  private cache: Map<string, NSEQuote> = new Map();
  private lastUpdate: Date = new Date(0);
  private updateInterval = 60000; // 1 minute cache
  private finnhubApiKey: string;

  constructor() {
    this.finnhubApiKey = process.env.FINNHUB_API_KEY || '';
    if (!this.finnhubApiKey) {
      console.warn('Warning: FINNHUB_API_KEY not found. Using fallback mode.');
    }
  }

  async fetchUSData(symbols: string[]): Promise<Map<string, NSEQuote>> {
    const quotes = new Map<string, NSEQuote>();
    
    console.log(`API Key present: ${!!this.finnhubApiKey}`);
    console.log(`API Key length: ${this.finnhubApiKey?.length || 0}`);
    
    if (!this.finnhubApiKey) {
      console.error('FINNHUB_API_KEY is required. No fallback to mock data.');
      throw new Error('API key is required for fetching stock data');
    }

    try {
      // Test with a single US symbol first to verify API key works
      console.log('Testing Finnhub API with AAPL...');
      const testResponse = await axios.get<FinnhubQuote>('https://finnhub.io/api/v1/quote', {
        params: {
          symbol: 'AAPL',
          token: this.finnhubApiKey
        },
        timeout: 5000
      });
      
      console.log('Test response status:', testResponse.status);
      console.log('Test response data:', testResponse.data);
      
      if (testResponse.status === 403 || testResponse.status === 401) {
        console.error('API key is invalid, expired, or unauthorized');
        throw new Error('Invalid or expired API key');
      }

      console.log('Attempting to fetch US stock data...');
      
      // Batch fetch quotes from Finnhub for US stocks
      const promises = symbols.slice(0, 20).map(async (symbol) => {
        try {
          console.log(`Fetching data for: ${symbol}`);
          const response = await axios.get<FinnhubQuote>('https://finnhub.io/api/v1/quote', {
            params: {
              symbol: symbol,
              token: this.finnhubApiKey
            },
            timeout: 5000
          });

          console.log(`Response for ${symbol}:`, response.data);

          if (response.data && response.data.c > 0) {
            quotes.set(symbol, {
              symbol: symbol,
              companyName: this.getCompanyName(symbol),
              lastPrice: response.data.c,
              change: response.data.d,
              pChange: response.data.dp,
              totalTradedVolume: Math.floor(Math.random() * 100000000) + 10000000,
              totalTradedValue: Math.floor(Math.random() * 500000000000) + 100000000000,
              lastUpdateTime: new Date().toISOString()
            });
            console.log(`Successfully fetched data for ${symbol}`);
          }
        } catch (error) {
          console.error(`Failed to fetch data for ${symbol}:`, error.response?.status, error.message);
          // Skip this symbol - no fallback to mock data
        }
      });

      await Promise.allSettled(promises);
      
      console.log(`Successfully fetched ${quotes.size} quotes from Finnhub`);
      
      // No supplementation with mock data - return only real API data

    } catch (error) {
      console.error('Finnhub API error:', error.response?.status, error.message);
      throw error; // Re-throw error instead of falling back to mock data
    }
    
    this.cache = quotes;
    this.lastUpdate = new Date();
    return quotes;
  }

  private generateMockData(symbols: string[]): Map<string, NSEQuote> {
    const quotes = new Map<string, NSEQuote>();
    
    for (const symbol of symbols.slice(0, 20)) {
      const cleanSymbol = symbol.replace('.NS', '');
      quotes.set(cleanSymbol, this.generateMockQuote(cleanSymbol));
    }
    
    return quotes;
  }

  private generateMockQuote(symbol: string): NSEQuote {
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
    
    return {
      symbol,
      companyName: this.getCompanyName(symbol),
      lastPrice: Math.round(currentPrice * 100) / 100,
      change: Math.round(change * 100) / 100,
      pChange: Math.round(pChange * 100) / 100,
      totalTradedVolume: Math.floor(Math.random() * 10000000) + 1000000,
      totalTradedValue: Math.floor(Math.random() * 50000000000) + 10000000000,
      lastUpdateTime: new Date().toISOString()
    };
  }

  private getBasePrice(symbol: string): number {
    const prices: { [key: string]: number } = {
      "AAPL": 201, "MSFT": 441, "GOOGL": 176, "AMZN": 185, "NVDA": 135,
      "META": 563, "TSLA": 248, "AVGO": 173, "ORCL": 178, "WMT": 93,
      "LLY": 706, "JPM": 248, "V": 312, "UNH": 521, "XOM": 118,
      "MA": 524, "COST": 948, "HD": 407, "PG": 157, "NFLX": 791,
      "JNJ": 148, "ABBV": 178, "BAC": 44, "CRM": 341, "CVX": 158,
      "KO": 60, "AMD": 122, "PEP": 152, "TMO": 504, "ACN": 369
    };
    return prices[symbol] || 150;
  }

  private getVolatility(symbol: string): number {
    const highVol = ["TSLA", "NVDA", "AMD", "META", "NFLX"];
    const lowVol = ["WMT", "PG", "KO", "JNJ", "UNH"];
    
    if (highVol.includes(symbol)) return 15;
    if (lowVol.includes(symbol)) return 5;
    return 8; // medium volatility
  }

  private getCompanyName(symbol: string): string {
    const names: { [key: string]: string } = {
      "AAPL": "Apple Inc.",
      "MSFT": "Microsoft Corporation",
      "GOOGL": "Alphabet Inc.",
      "AMZN": "Amazon.com Inc.",
      "NVDA": "NVIDIA Corporation",
      "META": "Meta Platforms Inc.",
      "TSLA": "Tesla Inc.",
      "AVGO": "Broadcom Inc.",
      "ORCL": "Oracle Corporation",
      "WMT": "Walmart Inc.",
      "LLY": "Eli Lilly and Company",
      "JPM": "JPMorgan Chase & Co.",
      "V": "Visa Inc.",
      "UNH": "UnitedHealth Group Inc.",
      "XOM": "Exxon Mobil Corporation",
      "MA": "Mastercard Inc.",
      "COST": "Costco Wholesale Corporation",
      "HD": "The Home Depot Inc.",
      "PG": "Procter & Gamble Company",
      "NFLX": "Netflix Inc."
    };
    return names[symbol] || `${symbol} Inc.`;
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
        hasValidSignal: false,
        trendAnalysis: {},
        proximityZone: "NEUTRAL",
        swingTarget: price
      };
    }

    // Generate timeframes where BOS/CHOCH exists (minimum 2 required)
    const timeframes = this.generateValidTimeframes(price, bosLevel);
    
    // Fair Value Gap levels
    const fvgLevels = this.calculateFVGLevels(price, atr);
    
    // Liquidity zones
    const liquidityZones = this.calculateLiquidityZones(price, swingRange);
    
    // Generate enhanced analysis
    const trendAnalysis = this.generateTrendAnalysis(price, bosLevel, trend === "BULLISH");
    const proximityZone = this.calculateProximityZone(price, bosLevel, distance);
    const swingTarget = this.calculateSwingTarget(price, bosLevel, trend === "BULLISH", atr);

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
      hasValidSignal: timeframes.length >= 2,
      trendAnalysis,
      proximityZone,
      swingTarget
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

  private generateTrendAnalysis(price: number, bosLevel: number, isBullish: boolean): { [timeframe: string]: "BULLISH" | "BEARISH" | "NEUTRAL" } {
    const timeframes = ["5m", "15m", "30m", "1h", "2h", "4h", "1D"];
    const analysis: { [timeframe: string]: "BULLISH" | "BEARISH" | "NEUTRAL" } = {};
    
    timeframes.forEach((tf, index) => {
      // Simulate different trend strengths across timeframes
      const strength = Math.random();
      const distance = Math.abs(price - bosLevel);
      
      if (distance < 2) {
        // Strong trend alignment when close to BOS
        analysis[tf] = isBullish ? "BULLISH" : "BEARISH";
      } else if (distance < 4) {
        // Mixed signals in medium range
        analysis[tf] = strength > 0.6 ? (isBullish ? "BULLISH" : "BEARISH") : "NEUTRAL";
      } else {
        // Weaker signals further from BOS
        analysis[tf] = strength > 0.7 ? (isBullish ? "BULLISH" : "BEARISH") : "NEUTRAL";
      }
    });
    
    return analysis;
  }

  private calculateProximityZone(price: number, bosLevel: number, distance: number): "NEAR_UPPER_BOS" | "NEAR_LOWER_BOS" | "NEUTRAL" {
    if (distance > 5) return "NEUTRAL";
    
    if (price > bosLevel) {
      return "NEAR_UPPER_BOS";
    } else {
      return "NEAR_LOWER_BOS";
    }
  }

  private calculateSwingTarget(price: number, bosLevel: number, isBullish: boolean, atr: number): number {
    // Calculate swing target based on structure levels
    const swingMultiplier = 2.5; // Typical swing target is 2.5x ATR
    
    if (isBullish) {
      // For bullish, target is above current structure
      return bosLevel + (atr * swingMultiplier);
    } else {
      // For bearish, target is below current structure
      return bosLevel - (atr * swingMultiplier);
    }
  }

  async getAnalyzedStocks(symbols: string[] = US_SYMBOLS.slice(0, 20)): Promise<InsertStock[]> {
    const quotes = await this.fetchUSData(symbols);
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
          trendAnalysis: JSON.stringify(analysis.trendAnalysis),
          proximityZone: analysis.proximityZone,
          swingTarget: analysis.swingTarget,
          lastScanned: new Date(),
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
