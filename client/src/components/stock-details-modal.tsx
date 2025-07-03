import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { Stock } from "@shared/schema";

interface StockDetailsModalProps {
  stock: Stock | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function StockDetailsModal({ stock, isOpen, onClose }: StockDetailsModalProps) {
  if (!stock) return null;

  const isBullish = stock.trend === "BULLISH";
  const riskRewardRatio = Math.abs((stock.target - stock.price) / (stock.price - stock.risk));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center space-x-3">
            <span>{stock.symbol}</span>
            <Badge className={isBullish ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-red-500/20 text-red-400 border-red-500/30"}>
              {stock.trend}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Price & Change */}
          <div className="bg-slate-700 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-2xl font-bold">₹{stock.price.toFixed(2)}</span>
              <span className={stock.change > 0 ? "text-green-400" : "text-red-400"}>
                {stock.change > 0 ? "+" : ""}{stock.change.toFixed(2)} ({stock.changePercent.toFixed(1)}%)
              </span>
            </div>
          </div>

          {/* SMC Analysis */}
          <div className="space-y-3">
            <h3 className="font-semibold text-slate-300">Smart Money Concept Analysis</h3>
            
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-slate-400">BOS/CHOCH Level</p>
                <p className="font-medium">₹{stock.bosLevel.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-slate-400">Distance</p>
                <p className={isBullish ? "text-green-400" : "text-red-400"}>
                  {stock.distance.toFixed(2)} points
                </p>
              </div>
              <div>
                <p className="text-slate-400">Target</p>
                <p className="font-medium text-blue-400">₹{stock.target.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-slate-400">Risk Level</p>
                <p className="font-medium text-orange-400">₹{stock.risk.toFixed(2)}</p>
              </div>
            </div>

            <Separator className="bg-slate-600" />

            {/* Risk-Reward Ratio */}
            <div className="bg-slate-700 p-3 rounded">
              <p className="text-slate-400 text-sm">Risk-Reward Ratio</p>
              <p className="font-bold text-lg">
                1:{riskRewardRatio.toFixed(2)}
                <span className={riskRewardRatio >= 2 ? "text-green-400 ml-2" : "text-yellow-400 ml-2"}>
                  {riskRewardRatio >= 2 ? "Good" : "Fair"}
                </span>
              </p>
            </div>

            {/* Active Timeframes */}
            <div>
              <p className="text-slate-400 text-sm mb-2">Active Timeframes ({stock.timeframes.length})</p>
              <div className="flex flex-wrap gap-1">
                {["5m", "15m", "30m", "45m", "1h", "2h", "4h", "1D"].map((timeframe) => {
                  const isActive = stock.timeframes.includes(timeframe);
                  return (
                    <span
                      key={timeframe}
                      className={`px-2 py-1 rounded text-xs ${
                        isActive
                          ? isBullish
                            ? "bg-green-500/20 text-green-400"
                            : "bg-red-500/20 text-red-400"
                          : "bg-slate-600 text-slate-400"
                      }`}
                    >
                      {timeframe}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Trading Signal */}
            <div className="bg-slate-700 p-3 rounded">
              <p className="text-slate-400 text-sm">Signal Type</p>
              <p className="font-semibold">
                {stock.signalType === "UPPER" ? "Near Upper BOS/CHOCH - Sell" : "Near Lower BOS/CHOCH - Buy"}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Price is within {stock.distance.toFixed(1)} points of key level
              </p>
            </div>

            {/* Fair Value Gap Info */}
            <div className="text-xs text-slate-400">
              <p>• FVG levels and liquidity zones calculated automatically</p>
              <p>• Only stocks with 2+ timeframe confirmation shown</p>
              <p>• Auto-removal when price moves beyond 6-point range</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}