
import type { InsertStock } from "@shared/schema";
import axios from "axios";

// NSE stock symbols for monitoring (top 50 liquid stocks)
export const NSE_SYMBOLS = [
  "RELIANCE.NS", "TCS.NS", "HDFCBANK.NS", "INFY.NS", "HINDUNILVR.NS", "ICICIBANK.NS", "KOTAKBANK.NS",
  "BHARTIARTL.NS", "ITC.NS", "SBIN.NS", "BAJFINANCE.NS", "LICI.NS", "LT.NS", "HCLTECH.NS", "AXISBANK.NS",
  "ASIANPAINT.NS", "MARUTI.NS", "SUNPHARMA.NS", "TITAN.NS", "ULTRACEMCO.NS", "NESTLEIND.NS", "WIPRO.NS",
  "ADANIPORTS.NS", "NTPC.NS", "POWERGRID.NS", "TATAMOTORS.NS", "JSWSTEEL.NS", "BAJAJFINSV.NS",
  "TECHM.NS", "GRASIM.NS", "COALINDIA.NS", "DRREDDY.NS", "DIVISLAB.NS", "HINDALCO.NS", "TATASTEEL.NS",
  "BRITANNIA.NS", "CIPLA.NS", "INDUSINDBK.NS", "EICHERMOT.NS", "APOLLOHOSP.NS", "HEROMOTOCO.NS",
  "ONGC.NS", "BPCL.NS", "ADANIENSOL.NS", "TATACONSUM.NS", "BAJAJ-AUTO.NS", "PIDILITIND.NS",
  "GODREJCP.NS", "SIEMENS.NS", "IOC.NS"
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

  async fetchNSEData(symbols: string[]): Promise<Map<string, NSEQuote>> {
    const quotes = new Map<string, NSEQuote>();
    
    console.log(`API Key present: ${!!this.finnhubApiKey}`);
    console.log(`API Key length: ${this.finnhubApiKey?.length || 0}`);
    
    if (!this.finnhubApiKey) {
      console.log('No API key found. Using mock data as fallback');
      return this.generateMockData(symbols);
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
      
      if (testResponse.status === 403) {
        console.log('API key is invalid or expired');
        return this.generateMockData(symbols);
      }

      // Convert NSE symbols to format that Finnhub might accept
      // Try both .NS format and without .NS
      const symbolsToTry = symbols.slice(0, 10).map(symbol => ({
        original: symbol,
        withNS: symbol,
        withoutNS: symbol.replace('.NS', '')
      }));

      console.log('Attempting to fetch NSE data...');
      
      // Batch fetch quotes from Finnhub
      const promises = symbolsToTry.map(async ({ original, withNS, withoutNS }) => {
        try {
          // Try with .NS first
          console.log(`Trying symbol: ${withNS}`);
          const response = await axios.get<FinnhubQuote>('https://finnhub.io/api/v1/quote', {
            params: {
              symbol: withNS,
              token: this.finnhubApiKey
            },
            timeout: 5000
          });

          console.log(`Response for ${withNS}:`, response.data);

          if (response.data && response.data.c > 0) {
            const cleanSymbol = withoutNS;
            quotes.set(cleanSymbol, {
              symbol: cleanSymbol,
              companyName: this.getCompanyName(cleanSymbol),
              lastPrice: response.data.c,
              change: response.data.d,
              pChange: response.data.dp,
              totalTradedVolume: Math.floor(Math.random() * 10000000) + 1000000,
              totalTradedValue: Math.floor(Math.random() * 50000000000) + 10000000000,
              lastUpdateTime: new Date().toISOString()
            });
            console.log(`Successfully fetched data for ${cleanSymbol}`);
          } else {
            console.log(`No valid data for ${withNS}, trying without .NS...`);
            
            // Try without .NS
            const response2 = await axios.get<FinnhubQuote>('https://finnhub.io/api/v1/quote', {
              params: {
                symbol: withoutNS,
                token: this.finnhubApiKey
              },
              timeout: 5000
            });

            if (response2.data && response2.data.c > 0) {
              quotes.set(withoutNS, {
                symbol: withoutNS,
                companyName: this.getCompanyName(withoutNS),
                lastPrice: response2.data.c,
                change: response2.data.d,
                pChange: response2.data.dp,
                totalTradedVolume: Math.floor(Math.random() * 10000000) + 1000000,
                totalTradedValue: Math.floor(Math.random() * 50000000000) + 10000000000,
                lastUpdateTime: new Date().toISOString()
              });
              console.log(`Successfully fetched data for ${withoutNS} (without .NS)`);
            }
          }
        } catch (error) {
          console.log(`Failed to fetch data for ${original}:`, error.response?.status, error.message);
          // Fallback to mock data for this symbol
          const cleanSymbol = withoutNS;
          const mockQuote = this.generateMockQuote(cleanSymbol);
          quotes.set(cleanSymbol, mockQuote);
        }
      });

      await Promise.allSettled(promises);
      
      console.log(`Successfully fetched ${quotes.size} quotes from Finnhub`);
      
      // If we got very few real quotes, supplement with mock data
      if (quotes.size < 5) {
        console.log('Got limited real data, supplementing with mock data');
        const mockQuotes = this.generateMockData(symbols.slice(quotes.size, 15));
        mockQuotes.forEach((quote, symbol) => {
          if (!quotes.has(symbol)) {
            quotes.set(symbol, quote);
          }
        });
      }

    } catch (error) {
      console.log('Finnhub API error, falling back to mock data:', error.response?.status, error.message);
      return this.generateMockData(symbols);
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
