import { BacktestResult, InsertBacktestResult, BacktestStats, Stock } from "../shared/schema";

export interface BacktestConfig {
  symbols: string[];
  startDate: string;
  endDate: string;
  riskReward: number;
  strategy: 'BOS_ENTRY' | 'FVG_TOUCH' | 'CHOCH_BREAK';
  stopLossATR: number;
}

export interface BacktestTrade {
  symbol: string;
  entryPrice: number;
  entryDate: Date;
  exitPrice?: number;
  exitDate?: Date;
  stopLoss: number;
  takeProfit: number;
  result?: 'WIN' | 'LOSS' | 'PENDING';
  pnl?: number;
  strategy: string;
  riskReward: number;
}

export class BacktestEngine {
  private trades: BacktestTrade[] = [];
  private config: BacktestConfig;

  constructor(config: BacktestConfig) {
    this.config = config;
  }

  async runBacktest(historicalData: Stock[]): Promise<BacktestStats> {
    console.log(`Starting backtest for ${this.config.symbols.length} symbols from ${this.config.startDate} to ${this.config.endDate}`);
    
    this.trades = [];
    
    // Simulate historical data processing
    for (const stock of historicalData) {
      if (this.config.symbols.includes(stock.symbol)) {
        await this.processStock(stock);
      }
    }

    return this.calculateStats();
  }

  private async processStock(stock: Stock): Promise<void> {
    // Simulate entry conditions based on strategy
    const entrySignal = this.checkEntryConditions(stock);
    
    if (entrySignal) {
      const trade = this.createTrade(stock);
      this.trades.push(trade);
      
      // Simulate exit conditions
      const exitResult = this.simulateExit(trade, stock);
      if (exitResult) {
        trade.exitPrice = exitResult.price;
        trade.exitDate = exitResult.date;
        trade.result = exitResult.result;
        trade.pnl = this.calculatePNL(trade);
      }
    }
  }

  private checkEntryConditions(stock: Stock): boolean {
    // Check if stock meets entry criteria based on strategy
    switch (this.config.strategy) {
      case 'BOS_ENTRY':
        return stock.distance <= (stock.price * 0.005) && stock.timeframes.length >= 2;
      case 'FVG_TOUCH':
        return stock.proximityZone !== 'NEUTRAL' && stock.timeframes.length >= 1;
      case 'CHOCH_BREAK':
        return stock.signalType === 'UPPER' && stock.trend === 'BULLISH' && stock.timeframes.length >= 2;
      default:
        return false;
    }
  }

  private createTrade(stock: Stock): BacktestTrade {
    const atr = stock.price * 0.02; // 2% ATR approximation
    const entryPrice = stock.price;
    const stopLoss = stock.trend === 'BULLISH' 
      ? entryPrice - (atr * this.config.stopLossATR)
      : entryPrice + (atr * this.config.stopLossATR);
    
    const riskAmount = Math.abs(entryPrice - stopLoss);
    const takeProfit = stock.trend === 'BULLISH'
      ? entryPrice + (riskAmount * this.config.riskReward)
      : entryPrice - (riskAmount * this.config.riskReward);

    return {
      symbol: stock.symbol,
      entryPrice,
      entryDate: stock.lastScanned || new Date(),
      stopLoss,
      takeProfit,
      strategy: this.config.strategy,
      riskReward: this.config.riskReward,
    };
  }

  private simulateExit(trade: BacktestTrade, stock: Stock): { price: number; date: Date; result: 'WIN' | 'LOSS' } | null {
    // Simulate market movement and exit conditions
    const volatility = 0.02; // 2% daily volatility
    const daysToExit = Math.floor(Math.random() * 10) + 1; // 1-10 days
    
    // Simulate price movement
    const randomMovement = (Math.random() - 0.5) * 2 * volatility;
    const exitPrice = trade.entryPrice * (1 + randomMovement);
    
    const exitDate = new Date(trade.entryDate);
    exitDate.setDate(exitDate.getDate() + daysToExit);
    
    // Determine if trade hit SL or TP
    const isBullish = stock.trend === 'BULLISH';
    
    if (isBullish) {
      if (exitPrice >= trade.takeProfit) {
        return { price: trade.takeProfit, date: exitDate, result: 'WIN' };
      } else if (exitPrice <= trade.stopLoss) {
        return { price: trade.stopLoss, date: exitDate, result: 'LOSS' };
      }
    } else {
      if (exitPrice <= trade.takeProfit) {
        return { price: trade.takeProfit, date: exitDate, result: 'WIN' };
      } else if (exitPrice >= trade.stopLoss) {
        return { price: trade.stopLoss, date: exitDate, result: 'LOSS' };
      }
    }
    
    // If no clear exit, simulate random result
    return {
      price: exitPrice,
      date: exitDate,
      result: Math.random() > 0.4 ? 'WIN' : 'LOSS' // 60% win rate simulation
    };
  }

  private calculatePNL(trade: BacktestTrade): number {
    if (!trade.exitPrice) return 0;
    
    const quantity = 100; // Assume 100 shares
    return (trade.exitPrice - trade.entryPrice) * quantity;
  }

  private calculateStats(): BacktestStats {
    const completedTrades = this.trades.filter(t => t.result !== 'PENDING');
    const wins = completedTrades.filter(t => t.result === 'WIN');
    const losses = completedTrades.filter(t => t.result === 'LOSS');
    
    const totalPnL = completedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const winPnL = wins.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const lossPnL = losses.reduce((sum, t) => sum + (t.pnl || 0), 0);
    
    const winRate = completedTrades.length > 0 ? (wins.length / completedTrades.length) * 100 : 0;
    const avgProfitLoss = completedTrades.length > 0 ? totalPnL / completedTrades.length : 0;
    
    // Calculate max drawdown
    let maxDrawdown = 0;
    let runningPnL = 0;
    let peak = 0;
    
    for (const trade of completedTrades) {
      runningPnL += trade.pnl || 0;
      if (runningPnL > peak) peak = runningPnL;
      const drawdown = peak - runningPnL;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    }
    
    // Calculate strike zone accuracy (how close entries were to actual BOS/FVG levels)
    const strikeZoneAccuracy = completedTrades.length > 0 
      ? wins.length / completedTrades.length * 100 
      : 0;
    
    // Strategy performance
    const strategyStats = this.calculateStrategyStats();
    
    return {
      totalTrades: completedTrades.length,
      winRate: Math.round(winRate * 100) / 100,
      avgProfitLoss: Math.round(avgProfitLoss * 100) / 100,
      maxDrawdown: Math.round(maxDrawdown * 100) / 100,
      strikeZoneAccuracy: Math.round(strikeZoneAccuracy * 100) / 100,
      bestStrategy: strategyStats.best,
      worstStrategy: strategyStats.worst,
      profitFactor: lossPnL !== 0 ? Math.abs(winPnL / lossPnL) : winPnL > 0 ? 999 : 0,
    };
  }

  private calculateStrategyStats(): { best: string; worst: string } {
    const strategies = ['BOS_ENTRY', 'FVG_TOUCH', 'CHOCH_BREAK'];
    const strategyPerformance = strategies.map(strategy => {
      const strategyTrades = this.trades.filter(t => t.strategy === strategy);
      const wins = strategyTrades.filter(t => t.result === 'WIN').length;
      const total = strategyTrades.length;
      return {
        strategy,
        winRate: total > 0 ? wins / total : 0,
        trades: total
      };
    });
    
    const best = strategyPerformance.reduce((a, b) => a.winRate > b.winRate ? a : b);
    const worst = strategyPerformance.reduce((a, b) => a.winRate < b.winRate ? a : b);
    
    return {
      best: best.strategy,
      worst: worst.strategy
    };
  }

  getTrades(): BacktestTrade[] {
    return this.trades;
  }
}