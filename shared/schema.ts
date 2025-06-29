import { pgTable, text, serial, integer, boolean, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

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
  isFavorite: boolean("is_favorite").notNull().default(false),
});

export const insertStockSchema = createInsertSchema(stocks).omit({
  id: true,
});

export type InsertStock = z.infer<typeof insertStockSchema>;
export type Stock = typeof stocks.$inferSelect;

// Dashboard stats type
export type DashboardStats = {
  totalSignals: number;
  upperSignals: number;
  lowerSignals: number;
  favorites: number;
};
