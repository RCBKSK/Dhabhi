import type { InsertStock } from "@shared/schema";
import axios from "axios";
import { FyersAuth } from "./fyers-auth";

// Indian stock symbols for monitoring (major liquid stocks from NSE)
export const INDIAN_SYMBOLS = [
  // Major Indices
  "NSE:NIFTY50-INDEX", "NSE:NIFTYBANK-INDEX", "BSE:SENSEX-INDEX",
  // Top 50 NSE stocks by market cap and liquidity
  "NSE:RELIANCE-EQ", "NSE:TCS-EQ", "NSE:HDFCBANK-EQ", "NSE:BHARTIARTL-EQ", "NSE:ICICIBANK-EQ",
  "NSE:SBIN-EQ", "NSE:LICI-EQ", "NSE:INFY-EQ", "NSE:ITC-EQ", "NSE:HINDUNILVR-EQ",
  "NSE:MARUTI-EQ", "NSE:KOTAKBANK-EQ", "NSE:BAJFINANCE-EQ", "NSE:LT-EQ", "NSE:HCLTECH-EQ",
  "NSE:AXISBANK-EQ", "NSE:ASIANPAINT-EQ", "NSE:WIPRO-EQ", "NSE:ADANIENT-EQ", "NSE:NTPC-EQ",
  "NSE:ULTRACEMCO-EQ", "NSE:ONGC-EQ", "NSE:TITAN-EQ", "NSE:POWERGRID-EQ", "NSE:NESTLEIND-EQ",
  "NSE:BAJAJFINSV-EQ", "NSE:COALINDIA-EQ", "NSE:TECHM-EQ", "NSE:TATAMOTORS-EQ", "NSE:SUNPHARMA-EQ",
  "NSE:ADANIPORTS-EQ", "NSE:DIVISLAB-EQ", "NSE:JSWSTEEL-EQ", "NSE:DRREDDY-EQ", "NSE:GRASIM-EQ",
  "NSE:TATASTEEL-EQ", "NSE:HINDALCO-EQ", "NSE:BRITANNIA-EQ", "NSE:CIPLA-EQ", "NSE:HEROMOTOCO-EQ",
  "NSE:BAJAJ-AUTO-EQ", "NSE:APOLLOHOSP-EQ", "NSE:INDUSINDBK-EQ", "NSE:EICHERMOT-EQ", "NSE:TATACONSUM-EQ",
  "NSE:BPCL-EQ", "NSE:GODREJCP-EQ", "NSE:SHRIRAMFIN-EQ", "NSE:SIEMENS-EQ", "NSE:PIDILITIND-EQ",
  // Additional popular stocks
  "NSE:VEDL-EQ", "NSE:IOC-EQ", "NSE:SAIL-EQ", "NSE:NMDC-EQ", "NSE:GAIL-EQ",
  "NSE:M&M-EQ", "NSE:HDFC-EQ", "NSE:BANKBARODA-EQ", "NSE:CANBK-EQ", "NSE:UNIONBANK-EQ",
  "NSE:TVSMOTOR-EQ", "NSE:DABUR-EQ", "NSE:COLPAL-EQ", "NSE:MARICO-EQ", "NSE:MCDOWELL-N-EQ",
  "NSE:AMBUJACEM-EQ", "NSE:ACC-EQ", "NSE:SHREECEM-EQ", "NSE:RAMCOCEM-EQ", "NSE:JBCHEPHARM-EQ",
  "NSE:LUPIN-EQ", "NSE:TORNTPHARM-EQ", "NSE:BIOCON-EQ", "NSE:CADILAHC-EQ", "NSE:AUROPHARMA-EQ",
  "NSE:MOTHERSON-EQ", "NSE:BOSCHLTD-EQ", "NSE:BALKRISIND-EQ", "NSE:ASHOKLEY-EQ", "NSE:EXIDEIND-EQ",
  "NSE:PAGEIND-EQ", "NSE:PIDILITIND-EQ", "NSE:BERGEPAINT-EQ", "NSE:AKZONOBEL-EQ", "NSE:RELAXO-EQ",
  "NSE:BATAINDIA-EQ", "NSE:VIPIND-EQ", "NSE:CENTRALBK-EQ", "NSE:PNB-EQ", "NSE:IDFCFIRSTB-EQ",
  "NSE:FEDERALBNK-EQ", "NSE:RBLBANK-EQ", "NSE:YESBANK-EQ", "NSE:IDEA-EQ", "NSE:JINDALSTEL-EQ",
  "NSE:DLF-EQ", "NSE:GODREJPROP-EQ", "NSE:OBEROIRLTY-EQ", "NSE:PRESTIGE-EQ", "NSE:BRIGADE-EQ",
  "NSE:IRCTC-EQ", "NSE:CONCOR-EQ", "NSE:APOLLOTYRE-EQ", "NSE:ESCORTS-EQ", "NSE:FORCEMOT-EQ"
];

interface FyersQuote {
  symbol: string;
  ltp: number; // last traded price
  chg: number; // change
  chp: number; // change percent
  high: number; // high price
  low: number; // low price
  open: number; // open price
  prev_close: number; // previous close
  volume: number; // volume
  value: number; // traded value
  timestamp: string;
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
  private fyersAuth: FyersAuth;
  private accessToken: string | null = null;

  constructor() {
    // Using your provided Fyers API credentials
    this.fyersAuth = new FyersAuth({
      clientId: 'X1F4L84TYK-100',
      secretKey: '6UI1UL93RN',
      redirectUri: 'https://trade.fyers.in/api-login/redirect-uri/index.html'
    });

    console.log('Fyers API initialized with live credentials');
    // We'll need to generate an access token for API calls
  }

  async fetchIndianStockData(symbols: string[]): Promise<Map<string, NSEQuote>> {
    console.log('Fetching live Indian stock data from Fyers API...');

    if (!this.accessToken) {
      console.error('No access token available. Authentication required for live data.');
      throw new Error('Authentication required. Please authenticate with Fyers API first.');
    }

    try {
      const quotes = new Map<string, NSEQuote>();

      // Batch fetch quotes from Fyers API for Indian stocks
      console.log('Fetching quotes for symbols:', symbols);

      const response = await this.fyersAuth.getQuotes(symbols, this.accessToken);
      console.log('Fyers API response:', response);

      if (response && response.s === 'ok' && response.d) {
        for (const data of response.d) {
          let cleanSymbol = data.n.replace('NSE:', '').replace('BSE:', '');
          
          // Handle different symbol types
          if (cleanSymbol.includes('-INDEX')) {
            cleanSymbol = cleanSymbol.replace('-INDEX', '');
            // Map index symbols to display names
            if (cleanSymbol === 'NIFTY50') cleanSymbol = 'NIFTY';
            if (cleanSymbol === 'NIFTYBANK') cleanSymbol = 'BANKNIFTY';
          } else {
            cleanSymbol = cleanSymbol.replace('-EQ', '');
          }

          quotes.set(cleanSymbol, {
            symbol: cleanSymbol,
            companyName: this.getIndianCompanyName(cleanSymbol),
            lastPrice: data.v.lp || 0,
            change: data.v.ch || 0,
            pChange: data.v.chp || 0,
            totalTradedVolume: data.v.volume || 0,
            totalTradedValue: data.v.value || 0,
            lastUpdateTime: new Date().toISOString()
          });
        }

        console.log(`Successfully fetched ${quotes.size} live quotes from Fyers API`);
        this.cache = quotes;
        this.lastUpdate = new Date();
        return quotes;
      } else {
        console.error('Invalid response from Fyers API:', response);
        throw new Error('Invalid response from Fyers API');
      }

    } catch (error: any) {
      console.error('Fyers API error:', error.message);
      throw new Error(`Failed to fetch live data: ${error.message}`);
    }
  }

  async authenticateWithCode(authCode: string): Promise<boolean> {
    try {
      this.accessToken = await this.fyersAuth.generateAccessToken(authCode);
      console.log('Successfully authenticated with Fyers API');
      return true;
    } catch (error: any) {
      console.error('Authentication failed:', error.message);
      return false;
    }
  }

  getAuthUrl(): string {
    return this.fyersAuth.generateAuthUrl();
  }

  // All mock data functions removed - system now requires live Fyers API data only

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

  private getIndianBasePrice(symbol: string): number {
    const prices: { [key: string]: number } = {
      // Major Indices
      "NIFTY": 24500, "BANKNIFTY": 52000, "SENSEX": 80500,
      "RELIANCE": 2850, "TCS": 4200, "HDFCBANK": 1650, "BHARTIARTL": 1550, "ICICIBANK": 1280,
      "SBIN": 820, "LICI": 950, "INFY": 1890, "ITC": 460, "HINDUNILVR": 2380,
      "MARUTI": 12500, "KOTAKBANK": 1740, "BAJFINANCE": 6800, "LT": 3650, "HCLTECH": 1450,
      "AXISBANK": 1150, "ASIANPAINT": 2950, "WIPRO": 290, "ADANIENT": 2480, "NTPC": 355,
      "ULTRACEMCO": 11200, "ONGC": 248, "TITAN": 3420, "POWERGRID": 325, "NESTLEIND": 2280,
      "BAJAJFINSV": 1680, "COALINDIA": 410, "TECHM": 1680, "TATAMOTORS": 1050, "SUNPHARMA": 1780,
      "ADANIPORTS": 1280, "DIVISLAB": 5850, "JSWSTEEL": 948, "DRREDDY": 1290, "GRASIM": 2680,
      "TATASTEEL": 148, "HINDALCO": 648, "BRITANNIA": 4980, "CIPLA": 1548, "HEROMOTOCO": 4850,
      "BAJAJ-AUTO": 9200, "APOLLOHOSP": 6890, "INDUSINDBK": 978, "EICHERMOT": 4920, "TATACONSUM": 920,
      "BPCL": 298, "GODREJCP": 1148, "SHRIRAMFIN": 2980, "SIEMENS": 6840, "PIDILITIND": 3150,
      // Additional stocks
      "VEDL": 450, "IOC": 140, "SAIL": 118, "NMDC": 180, "GAIL": 198,
      "M&M": 2850, "HDFC": 2750, "BANKBARODA": 245, "CANBK": 105, "UNIONBANK": 125,
      "TVSMOTOR": 2380, "DABUR": 640, "COLPAL": 2890, "MARICO": 630, "MCDOWELL-N": 1050,
      "AMBUJACEM": 580, "ACC": 2450, "SHREECEM": 28500, "RAMCOCEM": 950, "JBCHEPHARM": 690,
      "LUPIN": 2180, "TORNTPHARM": 3450, "BIOCON": 372, "CADILAHC": 580, "AUROPHARMA": 1280,
      "MOTHERSON": 163, "BOSCHLTD": 34500, "BALKRISIND": 2780, "ASHOKLEY": 220, "EXIDEIND": 420,
      "PAGEIND": 44500, "BERGEPAINT": 720, "AKZONOBEL": 3200, "RELAXO": 1580, "BATAINDIA": 1680,
      "VIPIND": 890, "CENTRALBK": 55, "PNB": 102, "IDFCFIRSTB": 78, "FEDERALBNK": 172,
      "RBLBANK": 258, "YESBANK": 19, "IDEA": 8, "JINDALSTEL": 870, "DLF": 820,
      "GODREJPROP": 2750, "OBEROIRLTY": 1980, "PRESTIGE": 1750, "BRIGADE": 1250, "IRCTC": 780,
      "CONCOR": 890, "APOLLOTYRE": 520, "ESCORTS": 3450, "FORCEMOT": 8900
    };
    return prices[symbol] || 1500;
  }

  private getIndianVolatility(symbol: string): number {
    const highVol = ["TATAMOTORS", "ADANIENT", "JSWSTEEL", "TATASTEEL", "HINDALCO"];
    const lowVol = ["ITC", "HINDUNILVR", "NESTLEIND", "BRITANNIA", "GODREJCP"];
    const indexVol = ["NIFTY", "BANKNIFTY", "SENSEX"];

    if (highVol.includes(symbol)) return 8;
    if (lowVol.includes(symbol)) return 3;
    if (indexVol.includes(symbol)) return 4; // indices have moderate volatility
    return 5; // medium volatility
  }

  private getIndianCompanyName(symbol: string): string {
    const names: { [key: string]: string } = {
      // Major Indices
      "NIFTY": "Nifty 50 Index",
      "BANKNIFTY": "Nifty Bank Index", 
      "SENSEX": "BSE Sensex Index",
      "RELIANCE": "Reliance Industries Limited",
      "TCS": "Tata Consultancy Services Limited",
      "HDFCBANK": "HDFC Bank Limited",
      "BHARTIARTL": "Bharti Airtel Limited",
      "ICICIBANK": "ICICI Bank Limited",
      "SBIN": "State Bank of India",
      "LICI": "Life Insurance Corporation of India",
      "INFY": "Infosys Limited",
      "ITC": "ITC Limited",
      "HINDUNILVR": "Hindustan Unilever Limited",
      "MARUTI": "Maruti Suzuki India Limited",
      "KOTAKBANK": "Kotak Mahindra Bank Limited",
      "BAJFINANCE": "Bajaj Finance Limited",
      "LT": "Larsen & Toubro Limited",
      "HCLTECH": "HCL Technologies Limited",
      "AXISBANK": "Axis Bank Limited",
      "ASIANPAINT": "Asian Paints Limited",
      "WIPRO": "Wipro Limited",
      "ADANIENT": "Adani Enterprises Limited",
      "NTPC": "NTPC Limited",
      "ULTRACEMCO": "UltraTech Cement Limited",
      "ONGC": "Oil and Natural Gas Corporation Limited",
      "TITAN": "Titan Company Limited",
      "POWERGRID": "Power Grid Corporation of India Limited",
      "NESTLEIND": "Nestle India Limited",
      "BAJAJFINSV": "Bajaj Finserv Limited",
      "COALINDIA": "Coal India Limited",
      "TECHM": "Tech Mahindra Limited",
      "TATAMOTORS": "Tata Motors Limited",
      "SUNPHARMA": "Sun Pharmaceutical Industries Limited",
      "ADANIPORTS": "Adani Ports and Special Economic Zone Limited",
      "DIVISLAB": "Divi's Laboratories Limited",
      "JSWSTEEL": "JSW Steel Limited",
      "DRREDDY": "Dr. Reddy's Laboratories Limited",
      "GRASIM": "Grasim Industries Limited",
      "TATASTEEL": "Tata Steel Limited",
      "HINDALCO": "Hindalco Industries Limited",
      "BRITANNIA": "Britannia Industries Limited",
      "CIPLA": "Cipla Limited",
      "HEROMOTOCO": "Hero MotoCorp Limited",
      "BAJAJ-AUTO": "Bajaj Auto Limited",
      "APOLLOHOSP": "Apollo Hospitals Enterprise Limited",
      "INDUSINDBK": "IndusInd Bank Limited",
      "EICHERMOT": "Eicher Motors Limited",
      "TATACONSUM": "Tata Consumer Products Limited",
      "BPCL": "Bharat Petroleum Corporation Limited",
      "GODREJCP": "Godrej Consumer Products Limited",
      "SHRIRAMFIN": "Shriram Finance Limited",
      "SIEMENS": "Siemens Limited",
      "PIDILITIND": "Pidilite Industries Limited"
    };
    return names[symbol] || `${symbol} Limited`;
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

  async getAnalyzedStocks(symbols: string[] = INDIAN_SYMBOLS.slice(0, 50)): Promise<InsertStock[]> {
    const quotes = await this.fetchIndianStockData(symbols);
    const analyzedStocks: InsertStock[] = [];

    const quotesArray = Array.from(quotes.entries());
    for (const [symbol, quote] of quotesArray) {
      const analysis = this.performSMCAnalysis(quote);

      // Check if it's an index - always include indices
      const isIndex = ['NIFTY', 'BANKNIFTY', 'SENSEX'].includes(quote.symbol);
      
      // Only include stocks with valid SMC signals OR if it's an index
      if (Math.abs(quote.lastPrice - analysis.bosLevel) <= 15 && analysis.timeframes.length >= 1) {
        analysis.hasValidSignal = true;
      }

      if (analysis.hasValidSignal || isIndex) {
        // For indices, ensure they have at least basic signal data
        if (isIndex && !analysis.hasValidSignal) {
          analysis.timeframes = ["1h"]; // Give indices at least one timeframe
          analysis.hasValidSignal = true;
        }

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

    console.log(`Processed ${analyzedStocks.length} stocks including indices:`, 
      analyzedStocks.filter(s => ['NIFTY', 'BANKNIFTY', 'SENSEX'].includes(s.symbol)).map(s => s.symbol));

    return analyzedStocks;
  }

  shouldUpdateCache(): boolean {
    return Date.now() - this.lastUpdate.getTime() > this.updateInterval;
  }
}

export const stockDataService = new StockDataService();