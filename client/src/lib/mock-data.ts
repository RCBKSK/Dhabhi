// This file provides mock data types and utilities for the stock market dashboard
// The actual data is served from the backend storage layer

export const TIMEFRAMES = ["5m", "15m", "30m", "45m", "1h", "2h", "4h", "1D"] as const;
export const PROXIMITY_OPTIONS = ["±5 points", "±10 points", "±15 points"] as const;
export const TRENDS = ["BULLISH", "BEARISH"] as const;
export const SIGNAL_TYPES = ["UPPER", "LOWER"] as const;

export type Timeframe = typeof TIMEFRAMES[number];
export type ProximityOption = typeof PROXIMITY_OPTIONS[number];
export type Trend = typeof TRENDS[number];
export type SignalType = typeof SIGNAL_TYPES[number];

// Default filter states
export const DEFAULT_TIMEFRAMES: Timeframe[] = ["5m", "30m", "1h"];
export const DEFAULT_PROXIMITY: ProximityOption = "±5 points";

// Utility functions for data formatting
export const formatPrice = (price: number): string => {
  return `₹${price.toFixed(2)}`;
};

export const formatChange = (change: number, changePercent: number): string => {
  const sign = change >= 0 ? "+" : "";
  return `${sign}${change.toFixed(2)} (${changePercent.toFixed(1)}%)`;
};

export const formatDistance = (distance: number): string => {
  return `${distance.toFixed(2)} points`;
};

// Color utilities for trend visualization
export const getTrendColor = (trend: Trend): string => {
  return trend === "BULLISH" ? "text-green-400" : "text-red-400";
};

export const getTrendBgColor = (trend: Trend): string => {
  return trend === "BULLISH" 
    ? "bg-green-500/20 text-green-400 border-green-500/30"
    : "bg-red-500/20 text-red-400 border-red-500/30";
};

export const getChangeColor = (change: number): string => {
  return change >= 0 ? "text-green-400" : "text-red-400";
};

// Auto-refresh intervals
export const REFRESH_INTERVALS = {
  AUTO: 120000, // 2 minutes
  MANUAL: 0,
} as const;

// API endpoints (for reference)
export const API_ENDPOINTS = {
  STOCKS: "/api/stocks",
  UPPER_SIGNALS: "/api/stocks/upper",
  LOWER_SIGNALS: "/api/stocks/lower",
  FAVORITES: "/api/stocks/favorites",
  STATS: "/api/stats",
  SEARCH: "/api/stocks/search",
  TOGGLE_FAVORITE: (id: number) => `/api/stocks/${id}/favorite`,
} as const;
