import { Stock, SectorAnalysis } from "../shared/schema";

export class SectorAnalyzer {
  private sectorMapping: { [symbol: string]: string } = {
    // Indices
    'NIFTY': 'INDICES',
    'BANKNIFTY': 'INDICES', 
    'SENSEX': 'INDICES',
    
    // IT Sector
    'TCS': 'IT',
    'INFY': 'IT',
    'HCLTECH': 'IT',
    'WIPRO': 'IT',
    'TECHM': 'IT',
    
    // Banking & Financial Services
    'HDFCBANK': 'BANKING',
    'ICICIBANK': 'BANKING',
    'SBIN': 'BANKING',
    'KOTAKBANK': 'BANKING',
    'AXISBANK': 'BANKING',
    'BAJFINANCE': 'BANKING',
    'BAJAJFINSV': 'BANKING',
    'INDUSINDBK': 'BANKING',
    
    // Energy & Oil
    'RELIANCE': 'ENERGY',
    'ONGC': 'ENERGY',
    'BPCL': 'ENERGY',
    'NTPC': 'ENERGY',
    'POWERGRID': 'ENERGY',
    'COALINDIA': 'ENERGY',
    
    // FMCG
    'HINDUNILVR': 'FMCG',
    'ITC': 'FMCG',
    'NESTLEIND': 'FMCG',
    'BRITANNIA': 'FMCG',
    'GODREJCP': 'FMCG',
    'TATACONSUM': 'FMCG',
    
    // Auto
    'MARUTI': 'AUTO',
    'TATAMOTORS': 'AUTO',
    'BAJAJ-AUTO': 'AUTO',
    'HEROMOTOCO': 'AUTO',
    'EICHERMOT': 'AUTO',
    
    // Pharma
    'SUNPHARMA': 'PHARMA',
    'DIVISLAB': 'PHARMA',
    'DRREDDY': 'PHARMA',
    'CIPLA': 'PHARMA',
    'APOLLOHOSP': 'PHARMA',
    
    // Metals & Mining
    'JSWSTEEL': 'METALS',
    'TATASTEEL': 'METALS',
    'HINDALCO': 'METALS',
    'ADANIPORTS': 'METALS',
    
    // Construction & Infrastructure
    'LT': 'CONSTRUCTION',
    'ULTRACEMCO': 'CONSTRUCTION',
    'GRASIM': 'CONSTRUCTION',
    'ADANIENT': 'CONSTRUCTION',
    
    // Consumer Goods
    'TITAN': 'CONSUMER',
    'ASIANPAINT': 'CONSUMER',
    'BHARTIARTL': 'TELECOM',
    'LICI': 'INSURANCE',
  };

  analyzeSectors(stocks: Stock[]): SectorAnalysis[] {
    const sectorData: { [sector: string]: Stock[] } = {};
    
    // Group stocks by sector
    for (const stock of stocks) {
      const sector = this.sectorMapping[stock.symbol] || 'OTHERS';
      if (!sectorData[sector]) {
        sectorData[sector] = [];
      }
      sectorData[sector].push(stock);
    }
    
    // Calculate sector analysis
    const sectorAnalysis: SectorAnalysis[] = [];
    
    for (const [sector, sectorStocks] of Object.entries(sectorData)) {
      const bullishStocks = sectorStocks.filter(s => s.trend === 'BULLISH');
      const bearishStocks = sectorStocks.filter(s => s.trend === 'BEARISH');
      
      const bullishCount = bullishStocks.length;
      const bearishCount = bearishStocks.length;
      const totalStocks = sectorStocks.length;
      
      let trend: 'BULLISH' | 'BEARISH' | 'MIXED' = 'MIXED';
      if (bullishCount > bearishCount * 1.5) {
        trend = 'BULLISH';
      } else if (bearishCount > bullishCount * 1.5) {
        trend = 'BEARISH';
      }
      
      // Calculate average signal strength
      const avgSignalStrength = sectorStocks.reduce((sum, stock) => {
        return sum + stock.timeframes.length;
      }, 0) / totalStocks;
      
      // Get top performers (highest signal strength)
      const topPerformers = sectorStocks
        .sort((a, b) => b.timeframes.length - a.timeframes.length)
        .slice(0, 3)
        .map(s => s.symbol);
      
      sectorAnalysis.push({
        sector,
        trend,
        bullishCount,
        bearishCount,
        totalStocks,
        avgSignalStrength: Math.round(avgSignalStrength * 100) / 100,
        topPerformers,
      });
    }
    
    // Sort by total stocks (most active sectors first)
    return sectorAnalysis.sort((a, b) => b.totalStocks - a.totalStocks);
  }
  
  generateHeatmapData(sectorAnalysis: SectorAnalysis[]): { [sector: string]: number } {
    const heatmapData: { [sector: string]: number } = {};
    
    for (const analysis of sectorAnalysis) {
      // Calculate heat score (-1 to 1)
      const bullishRatio = analysis.bullishCount / analysis.totalStocks;
      const bearishRatio = analysis.bearishCount / analysis.totalStocks;
      
      let score = 0;
      if (analysis.trend === 'BULLISH') {
        score = bullishRatio;
      } else if (analysis.trend === 'BEARISH') {
        score = -bearishRatio;
      } else {
        score = (bullishRatio - bearishRatio) * 0.5;
      }
      
      heatmapData[analysis.sector] = Math.round(score * 100) / 100;
    }
    
    return heatmapData;
  }
}

export const sectorAnalyzer = new SectorAnalyzer();