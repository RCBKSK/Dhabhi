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
  isFavorite: boolean("is_favorite").notNull().default(false),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
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

// Dashboard stats type
export type DashboardStats = {
  totalSignals: number;
  upperSignals: number;
  lowerSignals: number;
  favorites: number;
};
