import { stocks, users, userFavorites, type Stock, type InsertStock, type DashboardStats, type User, type InsertUser } from "@shared/schema";
import { stockDataService } from "./stock-service";
import { eq, desc, asc, and, or, sql, count, inArray } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Stock methods
  getAllStocks(): Promise<Stock[]>;
  getStock(id: number): Promise<Stock | undefined>;
  getStockBySymbol(symbol: string): Promise<Stock | undefined>;
  createStock(stock: InsertStock): Promise<Stock>;
  updateStock(id: number, updates: Partial<InsertStock>): Promise<Stock | undefined>;
  toggleFavorite(id: number, userId?: number): Promise<Stock | undefined>;
  getUpperSignals(): Promise<Stock[]>;
  getLowerSignals(): Promise<Stock[]>;
  getFavoriteStocks(userId?: number): Promise<Stock[]>;
  getDashboardStats(): Promise<DashboardStats>;
  addBulkFavorites(stockIds: number[], userId: number): Promise<boolean>;
  removeBulkFavorites(stockIds: number[], userId: number): Promise<boolean>;

  // Real-time filtering methods
  getStocksNearBOSCHOCH(proximityPoints: number): Promise<Stock[]>;
  updateStockPrices(): Promise<void>;
}

export class MemStorage implements IStorage {
  private stocks: Map<number, Stock>;
  private users: Map<number, User>;
  private currentStockId: number;
  private currentUserId: number;

  constructor() {
    this.stocks = new Map();
    this.users = new Map();
    this.currentStockId = 1;
    this.currentUserId = 1;
    this.initializeUsers();
    this.initializeWithRealData().catch(() => {
      console.log("Using fallback initialization");
    });
  }

  private initializeUsers() {
    // Add the specified users
    const adminUser: User = {
      id: this.currentUserId++,
      username: "kunjan",
      password: "K9016078282D", // In production, this should be hashed
      role: "admin",
      createdAt: new Date()
    };

    const secondaryUser: User = {
      id: this.currentUserId++,
      username: "kantidabhi",
      password: "kantidabhi", // In production, this should be hashed
      role: "user",
      createdAt: new Date()
    };

    this.users.set(adminUser.id, adminUser);
    this.users.set(secondaryUser.id, secondaryUser);
  }

  // User methods
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = {
      ...insertUser,
      id,
      role: insertUser.role ?? "user",
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  // Enhanced stock filtering methods
  async getStocksNearBOSCHOCH(proximityPoints: number = 5): Promise<Stock[]> {
    return Array.from(this.stocks.values()).filter(stock => {
      // Only show stocks with BOS/CHOCH in 2+ timeframes
      if (stock.timeframes.length < 2) return false;

      // Check if price is within proximity to BOS level
      return Math.abs(stock.price - stock.bosLevel) <= proximityPoints;
    });
  }

  async updateStockPrices(): Promise<void> {
    if (stockDataService.shouldUpdateCache()) {
      await this.refreshWithRealData();
    }
  }

  private async initializeWithRealData() {
    try {
      console.log("Initializing with live Indian stock data from Fyers API...");
      const realStocks = await stockDataService.getAnalyzedStocks();
      console.log(`Found ${realStocks.length} stocks with valid SMC signals`);
      realStocks.forEach(stock => this.createStock(stock));
    } catch (error) {
      console.error("Failed to fetch live stock data:", error.message);
      console.error("Authentication with Fyers API required. Use 'Enable Live Data' button to authenticate.");
      // Keep empty - no fallback data
    }
  }

  // All fallback/mock data removed - system requires live Fyers API data only

  private async refreshWithRealData() {
    try {
      const realStocks = await stockDataService.getAnalyzedStocks();

      // Clear existing stocks and reload with fresh data
      this.stocks.clear();
      this.currentStockId = 1;

      realStocks.forEach(stock => this.createStock(stock));
    } catch (error) {
      console.error("Failed to refresh real data:", error.message);
      // Don't fallback - keep existing data or remain empty
    }
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
    const id = this.currentStockId++;
    const stock: Stock = { 
      ...insertStock, 
      id,
      isFavorite: insertStock.isFavorite ?? false,
      trendAnalysis: insertStock.trendAnalysis ?? null,
      proximityZone: insertStock.proximityZone ?? null,
      swingTarget: insertStock.swingTarget ?? null,
      lastScanned: insertStock.lastScanned ?? new Date(),
      lastUpdated: new Date()
    };
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

  async toggleFavorite(stockId: number, userId?: number): Promise<Stock | undefined> {
    const existing = this.stocks.get(stockId);
    if (!existing) return undefined;

    if (userId) {
      // Check if the stock is already a favorite for the user
      const isFavorite = false; // Placeholder, implement the actual check
      const updated = { ...existing, isFavorite: !isFavorite };
      this.stocks.set(stockId, updated);
      return updated;
    } else {
      const updated = { ...existing, isFavorite: !existing.isFavorite };
      this.stocks.set(stockId, updated);
      return updated;
    }
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

  async getFavoriteStocks(userId?: number): Promise<Stock[]> {
    if (userId) {
      // Placeholder, implement the actual user-specific filtering
      return Array.from(this.stocks.values()).filter(stock => stock.isFavorite);
    }
    return Array.from(this.stocks.values()).filter(stock => stock.isFavorite);
  }

  async getDashboardStats(): Promise<DashboardStats> {
    const allStocks = Array.from(this.stocks.values());

    // Calculate scan timing (2-minute intervals)
    const lastScanTime = allStocks.length > 0 
      ? allStocks.reduce((latest, stock) => 
          stock.lastScanned && stock.lastScanned > latest ? stock.lastScanned : latest, 
          new Date(0)
        )
      : new Date();

    const nextScanTime = new Date(lastScanTime.getTime() + 2 * 60 * 1000); // 2 minutes from last scan
    const nextScanIn = Math.max(0, Math.floor((nextScanTime.getTime() - Date.now()) / 1000));

    return {
      totalSignals: allStocks.length,
      upperSignals: allStocks.filter(s => s.signalType === "UPPER").length,
      lowerSignals: allStocks.filter(s => s.signalType === "LOWER").length,
      favorites: allStocks.filter(s => s.isFavorite).length,
      lastScanTime,
      nextScanIn
    };
  }

  async addBulkFavorites(stockIds: number[], userId: number): Promise<boolean> {
    // Placeholder, implement the actual bulk add logic
    return true;
  }

  async removeBulkFavorites(stockIds: number[], userId: number): Promise<boolean> {
    // Placeholder, implement the actual bulk remove logic
    return true;
  }
}

export const storage = new MemStorage();