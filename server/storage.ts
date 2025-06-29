import { stocks, type Stock, type InsertStock, type DashboardStats } from "@shared/schema";

export interface IStorage {
  getAllStocks(): Promise<Stock[]>;
  getStock(id: number): Promise<Stock | undefined>;
  getStockBySymbol(symbol: string): Promise<Stock | undefined>;
  createStock(stock: InsertStock): Promise<Stock>;
  updateStock(id: number, updates: Partial<InsertStock>): Promise<Stock | undefined>;
  toggleFavorite(id: number): Promise<Stock | undefined>;
  getUpperSignals(): Promise<Stock[]>;
  getLowerSignals(): Promise<Stock[]>;
  getFavoriteStocks(): Promise<Stock[]>;
  getDashboardStats(): Promise<DashboardStats>;
}

export class MemStorage implements IStorage {
  private stocks: Map<number, Stock>;
  private currentId: number;

  constructor() {
    this.stocks = new Map();
    this.currentId = 1;
    this.initializeMockData();
  }

  private initializeMockData() {
    const mockStocks: InsertStock[] = [
      {
        symbol: "RELIANCE",
        price: 2485.30,
        change: 12.45,
        changePercent: 0.5,
        bosLevel: 2492.15,
        distance: 6.85,
        target: 2520.00,
        risk: 2465.00,
        trend: "BULLISH",
        signalType: "UPPER",
        timeframes: ["5m", "30m", "1h"],
        isFavorite: true,
      },
      {
        symbol: "HDFCBANK",
        price: 1642.80,
        change: 8.25,
        changePercent: 0.5,
        bosLevel: 1648.90,
        distance: 6.10,
        target: 1685.00,
        risk: 1620.00,
        trend: "BULLISH",
        signalType: "UPPER",
        timeframes: ["5m", "30m", "1h"],
        isFavorite: false,
      },
      {
        symbol: "INFY",
        price: 1789.45,
        change: 15.60,
        changePercent: 0.9,
        bosLevel: 1794.20,
        distance: 4.75,
        target: 1825.00,
        risk: 1765.00,
        trend: "BULLISH",
        signalType: "UPPER",
        timeframes: ["5m", "15m", "30m"],
        isFavorite: true,
      },
      {
        symbol: "TCS",
        price: 3847.65,
        change: 18.20,
        changePercent: 0.5,
        bosLevel: 3854.80,
        distance: 7.15,
        target: 3890.00,
        risk: 3820.00,
        trend: "BULLISH",
        signalType: "UPPER",
        timeframes: ["5m", "30m", "1h"],
        isFavorite: false,
      },
      {
        symbol: "WIPRO",
        price: 567.25,
        change: 4.35,
        changePercent: 0.8,
        bosLevel: 571.90,
        distance: 4.65,
        target: 585.00,
        risk: 550.00,
        trend: "BULLISH",
        signalType: "UPPER",
        timeframes: ["5m", "15m", "30m"],
        isFavorite: false,
      },
      {
        symbol: "TATAMOTORS",
        price: 635.15,
        change: -4.20,
        changePercent: -0.7,
        bosLevel: 630.80,
        distance: 4.35,
        target: 610.00,
        risk: 650.00,
        trend: "BEARISH",
        signalType: "LOWER",
        timeframes: ["5m", "30m", "1h"],
        isFavorite: true,
      },
      {
        symbol: "BAJFINANCE",
        price: 6847.30,
        change: -25.80,
        changePercent: -0.4,
        bosLevel: 6842.90,
        distance: 4.40,
        target: 6750.00,
        risk: 6920.00,
        trend: "BEARISH",
        signalType: "LOWER",
        timeframes: ["5m", "30m", "1h"],
        isFavorite: false,
      },
      {
        symbol: "ICICIBANK",
        price: 1078.65,
        change: -6.45,
        changePercent: -0.6,
        bosLevel: 1074.20,
        distance: 4.45,
        target: 1045.00,
        risk: 1095.00,
        trend: "BEARISH",
        signalType: "LOWER",
        timeframes: ["5m", "15m", "30m"],
        isFavorite: true,
      },
      {
        symbol: "SBIN",
        price: 824.15,
        change: -3.85,
        changePercent: -0.5,
        bosLevel: 820.30,
        distance: 3.85,
        target: 805.00,
        risk: 840.00,
        trend: "BEARISH",
        signalType: "LOWER",
        timeframes: ["5m", "30m", "1h"],
        isFavorite: false,
      },
      {
        symbol: "KOTAKBANK",
        price: 1734.50,
        change: -8.25,
        changePercent: -0.5,
        bosLevel: 1730.15,
        distance: 4.35,
        target: 1705.00,
        risk: 1755.00,
        trend: "BEARISH",
        signalType: "LOWER",
        timeframes: ["5m", "15m", "30m"],
        isFavorite: false,
      },
    ];

    mockStocks.forEach(stock => this.createStock(stock));
  }

  async getAllStocks(): Promise<Stock[]> {
    return Array.from(this.stocks.values());
  }

  async getStock(id: number): Promise<Stock | undefined> {
    return this.stocks.get(id);
  }

  async getStockBySymbol(symbol: string): Promise<Stock | undefined> {
    return Array.from(this.stocks.values()).find(
      (stock) => stock.symbol === symbol,
    );
  }

  async createStock(insertStock: InsertStock): Promise<Stock> {
    const id = this.currentId++;
    const stock: Stock = { ...insertStock, id };
    this.stocks.set(id, stock);
    return stock;
  }

  async updateStock(id: number, updates: Partial<InsertStock>): Promise<Stock | undefined> {
    const existing = this.stocks.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...updates };
    this.stocks.set(id, updated);
    return updated;
  }

  async toggleFavorite(id: number): Promise<Stock | undefined> {
    const existing = this.stocks.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, isFavorite: !existing.isFavorite };
    this.stocks.set(id, updated);
    return updated;
  }

  async getUpperSignals(): Promise<Stock[]> {
    return Array.from(this.stocks.values())
      .filter(stock => stock.signalType === "UPPER")
      .sort((a, b) => a.isFavorite === b.isFavorite ? 0 : a.isFavorite ? -1 : 1);
  }

  async getLowerSignals(): Promise<Stock[]> {
    return Array.from(this.stocks.values())
      .filter(stock => stock.signalType === "LOWER")
      .sort((a, b) => a.isFavorite === b.isFavorite ? 0 : a.isFavorite ? -1 : 1);
  }

  async getFavoriteStocks(): Promise<Stock[]> {
    return Array.from(this.stocks.values()).filter(stock => stock.isFavorite);
  }

  async getDashboardStats(): Promise<DashboardStats> {
    const allStocks = Array.from(this.stocks.values());
    return {
      totalSignals: allStocks.length,
      upperSignals: allStocks.filter(s => s.signalType === "UPPER").length,
      lowerSignals: allStocks.filter(s => s.signalType === "LOWER").length,
      favorites: allStocks.filter(s => s.isFavorite).length,
    };
  }
}

export const storage = new MemStorage();
