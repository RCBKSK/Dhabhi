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
      <div className="bg-slate-700 border border-slate-600 rounded-lg p-3 hover:bg-slate-650 transition-colors">
        {/* Header Row */}
        <div className="flex items-center justify-between mb-2">
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
                className={`h-3 w-3 ${stock.isFavorite ? "fill-current" : ""}`}
              />
            </Button>
            <h3 className="font-semibold text-white text-sm">{stock.symbol}</h3>
            <Badge
              className={`text-xs px-1.5 py-0.5 ${
                isBullish
                  ? "bg-green-500/20 text-green-400 border-green-500/30"
                  : "bg-red-500/20 text-red-400 border-red-500/30"
              }`}
            >
              {stock.trend}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDetails(true)}
            className="p-1 h-auto text-slate-400 hover:text-blue-400"
          >
            <Info className="h-3 w-3" />
          </Button>
        </div>

        {/* Price Row */}
        <div className="flex items-center justify-between mb-2">
          <div className="text-right">
            <p className="text-white font-medium text-lg">₹{stock.price.toFixed(2)}</p>
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

        {/* Proximity Zone Badge */}
        <div className="mb-2">
          <span className={`px-2 py-1 rounded text-xs font-medium ${
            stock.proximityZone === "NEAR_UPPER_BOS" 
              ? "bg-green-500/20 text-green-400 border border-green-500/30"
              : stock.proximityZone === "NEAR_LOWER_BOS"
              ? "bg-red-500/20 text-red-400 border border-red-500/30"
              : "bg-slate-500/20 text-slate-400 border border-slate-500/30"
          }`}>
            {stock.proximityZone === "NEAR_UPPER_BOS" ? "Near Upper BOS" :
             stock.proximityZone === "NEAR_LOWER_BOS" ? "Near Lower BOS" : "Neutral Zone"}
          </span>
        </div>

        {/* Trend Analysis Matrix - Compact */}
        <div className="mb-2">
          <span className="text-xs text-slate-400 block mb-1">Trend Analysis:</span>
          <div className="flex flex-wrap gap-1">
            {stock.trendAnalysis ? (() => {
              try {
                const trends = JSON.parse(stock.trendAnalysis);
                return Object.entries(trends).slice(0, 4).map(([timeframe, trend]) => (
                  <span
                    key={timeframe}
                    className={`px-1 py-0.5 rounded text-xs font-medium ${
                      trend === "BULLISH"
                        ? "bg-green-500/20 text-green-400"
                        : trend === "BEARISH"
                        ? "bg-red-500/20 text-red-400"
                        : "bg-slate-600 text-slate-300"
                    }`}
                  >
                    {timeframe}: {trend === "BULLISH" ? "↗" : trend === "BEARISH" ? "↘" : "→"}
                  </span>
                ));
              } catch {
                return <span className="text-xs text-slate-500">No trend data</span>;
              }
            })() : (
              <span className="text-xs text-slate-500">No trend data</span>
            )}
          </div>
        </div>

        {/* Key Metrics - Compact Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs">
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
              {stock.distance.toFixed(1)} points
            </p>
          </div>
          <div>
            <p className="text-slate-400">Swing Target</p>
            <p className="text-blue-400 font-medium">
              ₹{stock.swingTarget ? stock.swingTarget.toFixed(2) : stock.target.toFixed(2)}
            </p>
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

        {/* Scan Timestamp */}
        <div className="mt-2 pt-2 border-t border-slate-600">
          <p className="text-xs text-slate-500">
            Last scanned: {stock.lastScanned ? new Date(stock.lastScanned).toLocaleTimeString() : 'N/A'}
          </p>
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
