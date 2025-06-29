import { Star, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import StockDetailsModal from "./stock-details-modal";
import type { Stock } from "@shared/schema";

interface StockCardProps {
  stock: Stock;
  onToggleFavorite: (stockId: number) => void;
}

export default function StockCard({ stock, onToggleFavorite }: StockCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const isPositiveChange = stock.change > 0;
  const isBullish = stock.trend === "BULLISH";

  return (
    <>
      <div className="bg-slate-700 border border-slate-600 rounded-lg p-4 hover:bg-slate-650 transition-colors">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onToggleFavorite(stock.id)}
              className={`p-1 h-auto ${
                stock.isFavorite
                  ? "text-yellow-500 hover:text-yellow-400"
                  : "text-slate-400 hover:text-yellow-500"
              }`}
            >
              <Star
                className={`h-4 w-4 ${stock.isFavorite ? "fill-current" : ""}`}
              />
            </Button>
            <h3 className="font-semibold text-white">{stock.symbol}</h3>
            <Badge
              className={`text-xs px-2 py-1 ${
                isBullish
                  ? "bg-green-500/20 text-green-400 border-green-500/30"
                  : "bg-red-500/20 text-red-400 border-red-500/30"
              }`}
            >
              {stock.trend}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDetails(true)}
              className="p-1 h-auto text-slate-400 hover:text-blue-400"
            >
              <Info className="h-4 w-4" />
            </Button>
          </div>
          <div className="text-right">
            <p className="text-white font-medium">₹{stock.price.toFixed(2)}</p>
            <p
              className={`text-sm ${
                isPositiveChange ? "text-green-400" : "text-red-400"
              }`}
            >
              {isPositiveChange ? "+" : ""}
              {stock.change.toFixed(2)} ({stock.changePercent.toFixed(1)}%)
            </p>
          </div>
        </div>

        {/* Timeframe Indicators */}
        <div className="flex items-center space-x-1 mb-3">
          <span className="text-xs text-slate-400">Timeframes:</span>
          {["5m", "15m", "30m", "1h", "4h"].map((timeframe) => {
            const isActive = stock.timeframes.includes(timeframe);
            return (
              <span
                key={timeframe}
                className={`px-1 py-0.5 rounded text-xs ${
                  isActive
                    ? isBullish
                      ? "bg-green-500/20 text-green-400"
                      : "bg-red-500/20 text-red-400"
                    : "bg-slate-600 text-slate-300"
                }`}
              >
                {timeframe}
              </span>
            );
          })}
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-slate-400">BOS/CHOCH Level</p>
            <p className="text-white font-medium">₹{stock.bosLevel.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-slate-400">Distance</p>
            <p
              className={
                isBullish ? "text-green-400" : "text-red-400"
              }
            >
              {stock.distance.toFixed(2)} points
            </p>
          </div>
          <div>
            <p className="text-slate-400">Target</p>
            <p className="text-white font-medium">₹{stock.target.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-slate-400">Risk</p>
            <p
              className={
                isBullish ? "text-red-400" : "text-green-400"
              }
            >
              ₹{stock.risk.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      <StockDetailsModal 
        stock={stock} 
        isOpen={showDetails} 
        onClose={() => setShowDetails(false)} 
      />
    </>
  );
}
