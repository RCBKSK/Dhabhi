import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertStockSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all stocks
  app.get("/api/stocks", async (req, res) => {
    try {
      const stocks = await storage.getAllStocks();
      res.json(stocks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stocks" });
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

  const httpServer = createServer(app);
  return httpServer;
}
