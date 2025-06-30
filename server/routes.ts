import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertStockSchema, loginSchema, type TrendQuality } from "@shared/schema";
import { notificationService } from "./websocket";

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const result = loginSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid login data", errors: result.error.errors });
      }

      const { username, password } = result.data;
      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // In production, use JWT tokens
      res.json({ 
        success: true, 
        user: { 
          id: user.id, 
          username: user.username, 
          role: user.role 
        },
        message: "Login successful"
      });
    } catch (error) {
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/auth/logout", async (req, res) => {
    // In production, invalidate JWT token
    res.json({ success: true, message: "Logged out successfully" });
  });

  // Get all stocks (filtered by proximity to BOS/CHOCH)
  app.get("/api/stocks", async (req, res) => {
    try {
      const proximityPoints = parseInt(req.query.proximity as string) || 5;
      const stocks = await storage.getStocksNearBOSCHOCH(proximityPoints);
      res.json(stocks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stocks" });
    }
  });

  // Update stock prices with real NSE data
  app.post("/api/stocks/update-prices", async (req, res) => {
    try {
      await storage.updateStockPrices();
      res.json({ success: true, message: "Real US stock data updated" });
    } catch (error) {
      res.status(500).json({ message: "Failed to update stock data" });
    }
  });

  // Get upper signals
  app.get("/api/stocks/upper", async (req, res) => {
    try {
      const stocks = await storage.getUpperSignals();
      res.json(stocks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch upper signals" });
    }
  });

  // Get lower signals
  app.get("/api/stocks/lower", async (req, res) => {
    try {
      const stocks = await storage.getLowerSignals();
      res.json(stocks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch lower signals" });
    }
  });

  // Get favorite stocks
  app.get("/api/stocks/favorites", async (req, res) => {
    try {
      const stocks = await storage.getFavoriteStocks();
      res.json(stocks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch favorite stocks" });
    }
  });

  // Get dashboard stats
  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Toggle favorite status
  app.patch("/api/stocks/:id/favorite", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const stock = await storage.toggleFavorite(id);
      
      if (!stock) {
        return res.status(404).json({ message: "Stock not found" });
      }
      
      res.json(stock);
    } catch (error) {
      res.status(500).json({ message: "Failed to toggle favorite" });
    }
  });

  // Search stocks
  app.get("/api/stocks/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.json([]);
      }
      
      const allStocks = await storage.getAllStocks();
      const filtered = allStocks.filter(stock => 
        stock.symbol.toLowerCase().includes(query.toLowerCase())
      );
      
      res.json(filtered);
    } catch (error) {
      res.status(500).json({ message: "Failed to search stocks" });
    }
  });

  // Notification routes
  app.get("/api/notifications", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const notifications = notificationService.getRecentNotifications(limit);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.get("/api/notifications/unread-count", async (req, res) => {
    try {
      const count = notificationService.getUnreadCount();
      res.json({ count });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch unread count" });
    }
  });

  app.patch("/api/notifications/:id/read", async (req, res) => {
    try {
      const id = req.params.id;
      notificationService.markNotificationAsRead(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  // Deep trend analysis
  app.get("/api/trends/analysis", async (req, res) => {
    try {
      const stocks = await storage.getAllStocks();
      const trendAnalysis: TrendQuality[] = stocks.map(stock => {
        let trends = {};
        let alignmentScore = 0;
        
        if (stock.trendAnalysis) {
          try {
            trends = JSON.parse(stock.trendAnalysis);
            const trendValues = Object.values(trends);
            const bullishCount = trendValues.filter(t => t === 'BULLISH').length;
            const bearishCount = trendValues.filter(t => t === 'BEARISH').length;
            const totalCount = trendValues.length;
            
            alignmentScore = Math.max(bullishCount, bearishCount) / totalCount;
          } catch (e) {
            trends = {};
          }
        }

        return {
          symbol: stock.symbol,
          timeframes: trends,
          alignmentScore,
          confidence: alignmentScore > 0.7 ? "HIGH" : alignmentScore > 0.5 ? "MEDIUM" : "LOW",
          signalStrength: Math.round(alignmentScore * 5)
        };
      });

      res.json(trendAnalysis);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch trend analysis" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
