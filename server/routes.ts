import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertStockSchema, loginSchema, type TrendQuality, backtestConfigSchema, exportConfigSchema } from "@shared/schema";
import { notificationService } from "./websocket";
import { stockDataService } from "./stock-service";
import { BacktestEngine } from "./backtest-engine";
import { sectorAnalyzer } from "./sector-analysis";
import { ExportService } from "./export-service";

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

  // Fyers API authentication routes
  app.get("/api/fyers/auth-url", async (req, res) => {
    try {
      const authUrl = stockDataService.getAuthUrl();
      res.json({ authUrl });
    } catch (error) {
      res.status(500).json({ message: "Failed to generate auth URL" });
    }
  });

  app.post("/api/fyers/authenticate", async (req, res) => {
    try {
      const { authCode } = req.body;
      if (!authCode) {
        return res.status(400).json({ message: "Auth code is required" });
      }
      
      const success = await stockDataService.authenticateWithCode(authCode);
      if (success) {
        // Force refresh stock data after successful authentication
        await storage.updateStockPrices();
        res.json({ success: true, message: "Authentication successful. Live data is now enabled." });
      } else {
        res.status(400).json({ message: "Authentication failed" });
      }
    } catch (error) {
      res.status(500).json({ message: "Authentication error" });
    }
  });

  // Get all stocks (filtered by proximity to BOS/CHOCH)
  app.get("/api/stocks", async (req, res) => {
    try {
      const proximityPoints = parseInt(req.query.proximity as string) || 15;
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
      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      const stocks = await storage.getFavoriteStocks(userId);
      res.json(stocks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch favorite stocks" });
    }
  });

  // Search stocks
  app.get("/api/stocks/search", async (req, res) => {
    try {
      const query = (req.query.q as string) || "";
      
      if (!query.trim()) {
        return res.json([]);
      }
      
      const allStocks = await storage.getAllStocks();
      const filteredStocks = allStocks.filter(stock => 
        stock.symbol.toLowerCase().includes(query.toLowerCase())
      );
      
      res.json(filteredStocks.slice(0, 10)); // Limit to 10 results
    } catch (error) {
      console.error('Search error:', error);
      res.status(500).json({ message: "Failed to search stocks" });
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
      const { userId } = req.body;
      const stock = await storage.toggleFavorite(id, userId);
      
      if (!stock) {
        return res.status(404).json({ message: "Stock not found" });
      }
      
      res.json(stock);
    } catch (error) {
      res.status(500).json({ message: "Failed to toggle favorite" });
    }
  });

  // Add multiple stocks to favorites
  app.post("/api/stocks/favorites/bulk", async (req, res) => {
    try {
      const { stockIds, userId } = req.body;
      
      if (!stockIds || !Array.isArray(stockIds) || stockIds.length === 0) {
        return res.status(400).json({ message: "Stock IDs array is required" });
      }
      
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      
      const success = await storage.addBulkFavorites(stockIds, userId);
      
      if (success) {
        res.json({ success: true, message: `Added ${stockIds.length} stocks to favorites` });
      } else {
        res.status(500).json({ message: "Failed to add stocks to favorites" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to add bulk favorites" });
    }
  });

  // Remove multiple stocks from favorites
  app.delete("/api/stocks/favorites/bulk", async (req, res) => {
    try {
      const { stockIds, userId } = req.body;
      
      if (!stockIds || !Array.isArray(stockIds) || stockIds.length === 0) {
        return res.status(400).json({ message: "Stock IDs array is required" });
      }
      
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      
      const success = await storage.removeBulkFavorites(stockIds, userId);
      
      if (success) {
        res.json({ success: true, message: `Removed ${stockIds.length} stocks from favorites` });
      } else {
        res.status(500).json({ message: "Failed to remove stocks from favorites" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to remove bulk favorites" });
    }
  });

  // Search stocks
  app.get("/api/stocks/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      console.log('Search request - query:', query);
      
      // Prevent caching of search results
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
      
      if (!query || query.length < 1) {
        console.log('Empty query, returning empty array');
        return res.json([]);
      }
      
      // First, force a data refresh to get latest stocks including indices
      await storage.updateStockPrices();
      
      // Search through all stocks (both with and without signals)
      const allStocks = await storage.getAllStocks();
      const stocksNearBOS = await storage.getStocksNearBOSCHOCH(20); // Get more stocks for search
      
      console.log('Search data - allStocks count:', allStocks.length);
      console.log('Search data - stocksNearBOS count:', stocksNearBOS.length);
      
      // Combine both datasets for comprehensive search
      const combinedStocks = new Map();
      
      // Add all stocks
      allStocks.forEach(stock => {
        combinedStocks.set(stock.symbol, stock);
      });
      
      // Add/update with BOS stocks
      stocksNearBOS.forEach(stock => {
        combinedStocks.set(stock.symbol, stock);
      });
      
      const searchQuery = query.toLowerCase();
      console.log('Searching for:', searchQuery);
      console.log('Available symbols:', Array.from(combinedStocks.keys()).slice(0, 10)); // Show first 10
      
      const filtered = Array.from(combinedStocks.values()).filter(stock => {
        const symbol = stock.symbol.toLowerCase();
        const searchTerm = searchQuery.toLowerCase();
        
        // Direct match or contains match
        if (symbol.includes(searchTerm) || symbol.replace(/[-_]/g, '').includes(searchTerm.replace(/[-_]/g, ''))) {
          return true;
        }
        
        // Special handling for indices with multiple search terms
        if (symbol === 'nifty' && (searchTerm.includes('nifty') || searchTerm.includes('nif'))) {
          return true;
        }
        if (symbol === 'banknifty' && (searchTerm.includes('bank') || searchTerm.includes('nifty') || searchTerm.includes('banknifty'))) {
          return true;
        }
        if (symbol === 'sensex' && (searchTerm.includes('sensex') || searchTerm.includes('sens') || searchTerm.includes('bse'))) {
          return true;
        }
        
        // Handle partial matches for common stock name patterns
        if (symbol === 'bhartiartl' && (searchTerm.includes('bharti') || searchTerm.includes('airtel') || searchTerm.includes('bhart'))) {
          return true;
        }
        
        return false;
      });
      
      console.log('Search results count:', filtered.length);
      console.log('Search results:', filtered.map(s => s.symbol));
      
      // Limit results to prevent too many matches
      const results = filtered.slice(0, 20);
      res.json(results);
    } catch (error) {
      console.error('Search error:', error);
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

  // Phase 3: Backtest Engine Routes
  app.post("/api/backtest/run", async (req, res) => {
    try {
      const result = backtestConfigSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid backtest configuration", errors: result.error.errors });
      }

      const config = result.data;
      const allStocks = await storage.getAllStocks();
      
      const backtestEngine = new BacktestEngine(config);
      const stats = await backtestEngine.runBacktest(allStocks);
      const trades = backtestEngine.getTrades();

      res.json({ stats, trades });
    } catch (error) {
      console.error("Backtest error:", error);
      res.status(500).json({ message: "Failed to run backtest" });
    }
  });

  // Phase 3: Sector Analysis Routes
  app.get("/api/sectors/analysis", async (req, res) => {
    try {
      const stocks = await storage.getAllStocks();
      const sectorAnalysis = sectorAnalyzer.analyzeSectors(stocks);
      res.json(sectorAnalysis);
    } catch (error) {
      console.error("Sector analysis error:", error);
      res.status(500).json({ message: "Failed to analyze sectors" });
    }
  });

  app.get("/api/sectors/heatmap", async (req, res) => {
    try {
      const stocks = await storage.getAllStocks();
      const sectorAnalysis = sectorAnalyzer.analyzeSectors(stocks);
      const heatmapData = sectorAnalyzer.generateHeatmapData(sectorAnalysis);
      res.json(heatmapData);
    } catch (error) {
      console.error("Heatmap generation error:", error);
      res.status(500).json({ message: "Failed to generate heatmap" });
    }
  });

  // Phase 3: Export Routes
  app.post("/api/export/signals", async (req, res) => {
    try {
      const result = exportConfigSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid export configuration", errors: result.error.errors });
      }

      const config = result.data;
      const stocks = await storage.getAllStocks();
      const exportData = ExportService.generateExportData(stocks);

      if (config.format === 'CSV') {
        const csvData = ExportService.generateCSV(exportData);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="signals.csv"');
        res.send(csvData);
      } else if (config.format === 'EXCEL') {
        const excelData = ExportService.generateExcelData(exportData);
        res.json(excelData);
      }
    } catch (error) {
      console.error("Export error:", error);
      res.status(500).json({ message: "Failed to export data" });
    }
  });

  const httpServer = createServer(app);
  notificationService.init(httpServer);
  
  return httpServer;
}
