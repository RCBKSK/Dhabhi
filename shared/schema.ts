import { pgTable, text, serial, integer, boolean, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table for authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("user"), // 'admin' | 'user'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const stocks = pgTable("stocks", {
  id: serial("id").primaryKey(),
  symbol: text("symbol").notNull().unique(),
  price: real("price").notNull(),
  change: real("change").notNull(),
  changePercent: real("change_percent").notNull(),
  bosLevel: real("bos_level").notNull(),
  distance: real("distance").notNull(),
  target: real("target").notNull(),
  risk: real("risk").notNull(),
  trend: text("trend").notNull(), // 'BULLISH' | 'BEARISH'
  signalType: text("signal_type").notNull(), // 'UPPER' | 'LOWER'
  timeframes: text("timeframes").array().notNull(),
  trendAnalysis: text("trend_analysis"),
  proximityZone: text("proximity_zone"), // 'NEAR_UPPER_BOS' | 'NEAR_LOWER_BOS' | 'NEUTRAL'
  swingTarget: real("swing_target"),
  lastScanned: timestamp("last_scanned").defaultNow(),
  isFavorite: boolean("is_favorite").notNull().default(false),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
});

// Junction table for user favorites
export const userFavorites = pgTable("user_favorites", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  stockId: integer("stock_id").notNull().references(() => stocks.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Phase 3: Watchlists
export const watchlists = pgTable("watchlists", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  description: text("description"),
  filters: text("filters"), // JSON string of filters
  scanInterval: integer("scan_interval").default(60), // seconds
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const watchlistStocks = pgTable("watchlist_stocks", {
  id: serial("id").primaryKey(),
  watchlistId: integer("watchlist_id").notNull().references(() => watchlists.id),
  stockId: integer("stock_id").notNull().references(() => stocks.id),
  addedAt: timestamp("added_at").defaultNow().notNull(),
});

// Phase 3: Backtest results
export const backtestResults = pgTable("backtest_results", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  stockSymbol: text("stock_symbol").notNull(),
  entryPrice: real("entry_price").notNull(),
  exitPrice: real("exit_price"),
  stopLoss: real("stop_loss").notNull(),
  takeProfit: real("take_profit").notNull(),
  entryDate: timestamp("entry_date").notNull(),
  exitDate: timestamp("exit_date"),
  result: text("result"), // 'WIN' | 'LOSS' | 'PENDING'
  pnl: real("pnl"),
  riskReward: real("risk_reward"),
  strategy: text("strategy"), // 'BOS_ENTRY' | 'FVG_TOUCH' | 'CHOCH_BREAK'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Phase 3: Scan profiles
export const scanProfiles = pgTable("scan_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  timeframes: text("timeframes").array().notNull(),
  distanceThreshold: real("distance_threshold").default(0.005),
  minimumSignalScore: integer("minimum_signal_score").default(1),
  includeFVG: boolean("include_fvg").default(true),
  includeCHOCH: boolean("include_choch").default(true),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertStockSchema = createInsertSchema(stocks).omit({
  id: true,
  lastUpdated: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertStock = z.infer<typeof insertStockSchema>;
export type Stock = typeof stocks.$inferSelect;

// Login schema
export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export const bulkFavoritesSchema = z.object({
  stockIds: z.array(z.number()).min(1, "At least one stock must be selected"),
  userId: z.number(),
});

// Phase 3: New schemas
export const insertWatchlistSchema = createInsertSchema(watchlists).omit({
  id: true,
  createdAt: true,
});

export const insertBacktestResultSchema = createInsertSchema(backtestResults).omit({
  id: true,
  createdAt: true,
});

export const insertScanProfileSchema = createInsertSchema(scanProfiles).omit({
  id: true,
  createdAt: true,
});

export const backtestConfigSchema = z.object({
  symbols: z.array(z.string()).min(1, "At least one symbol required"),
  startDate: z.string(),
  endDate: z.string(),
  riskReward: z.number().min(1).max(5).default(2),
  strategy: z.enum(["BOS_ENTRY", "FVG_TOUCH", "CHOCH_BREAK"]),
  stopLossATR: z.number().min(1).max(5).default(2),
});

export const exportConfigSchema = z.object({
  format: z.enum(["CSV", "EXCEL"]),
  includeFilters: z.boolean().default(true),
  autoDownload: z.boolean().default(false),
});

// Dashboard stats type
export type DashboardStats = {
  totalSignals: number;
  upperSignals: number;
  lowerSignals: number;
  favorites: number;
  lastScanTime?: Date;
  nextScanIn?: number;
};

export type TrendAnalysis = {
  [timeframe: string]: "BULLISH" | "BEARISH" | "NEUTRAL";
};

export type ProximityZone = "NEAR_UPPER_BOS" | "NEAR_LOWER_BOS" | "NEUTRAL";

export type NotificationType = "BOS_ENTRY" | "BOS_BREAK" | "FVG_MITIGATED" | "TREND_CHANGE" | "PRICE_ALERT";

export type NotificationSettings = {
  bosEntry: boolean;
  bosBreak: boolean;
  fvgMitigated: boolean;
  trendChange: boolean;
  priceAlerts: boolean;
  favoriteStocksOnly: boolean;
};

export type Notification = {
  id: string;
  stockSymbol: string;
  type: NotificationType;
  message: string;
  timestamp: Date;
  read: boolean;
  priority: "LOW" | "MEDIUM" | "HIGH";
};

export type TrendQuality = {
  symbol: string;
  timeframes: { [tf: string]: "BULLISH" | "BEARISH" | "NEUTRAL" };
  alignmentScore: number; // 0-1 score based on timeframe alignment
  confidence: "LOW" | "MEDIUM" | "HIGH";
  signalStrength: number; // 1-5 rating
};

// Phase 3: New types
export type BacktestResult = typeof backtestResults.$inferSelect;
export type InsertBacktestResult = z.infer<typeof insertBacktestResultSchema>;

export type Watchlist = typeof watchlists.$inferSelect;
export type InsertWatchlist = z.infer<typeof insertWatchlistSchema>;

export type WatchlistStock = typeof watchlistStocks.$inferSelect;
export type ScanProfile = typeof scanProfiles.$inferSelect;
export type InsertScanProfile = z.infer<typeof insertScanProfileSchema>;

export type BacktestStats = {
  totalTrades: number;
  winRate: number;
  avgProfitLoss: number;
  maxDrawdown: number;
  strikeZoneAccuracy: number;
  bestStrategy: string;
  worstStrategy: string;
  profitFactor: number;
};

export type SectorAnalysis = {
  sector: string;
  trend: "BULLISH" | "BEARISH" | "MIXED";
  bullishCount: number;
  bearishCount: number;
  totalStocks: number;
  avgSignalStrength: number;
  topPerformers: string[];
};

export type ExportData = {
  symbol: string;
  price: number;
  change: number;
  trend: string;
  signalType: string;
  distance: number;
  bosProximity: number;
  signalStrength: number;
  timeframes: string[];
  lastAlertTime: string;
};
