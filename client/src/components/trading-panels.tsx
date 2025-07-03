import { ArrowUp, ArrowDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import StockCard from "@/components/stock-card";
import type { Stock } from "@shared/schema";

interface TradingPanelsProps {
  upperSignals: Stock[];
  lowerSignals: Stock[];
  onToggleFavorite: (stockId: number) => void;
}

export default function TradingPanels({
  upperSignals,
  lowerSignals,
  onToggleFavorite,
}: TradingPanelsProps) {
  return (
    <div className="mb-6">
      {/* Compact Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white">Trading Signals</h2>
        <div className="flex items-center space-x-4">
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
            {upperSignals.length} Upper
          </Badge>
          <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
            {lowerSignals.length} Lower
          </Badge>
        </div>
      </div>

      {/* Compact Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Upper Signals - Compact Cards */}
        <div className="space-y-3">
          <div className="flex items-center mb-3">
            <ArrowUp className="text-green-500 mr-2 h-5 w-5" />
            <h3 className="text-lg font-semibold text-white">Upper BOS/CHOCH - Sell</h3>
          </div>
          {upperSignals.length === 0 ? (
            <Card className="bg-slate-800 border-slate-700 p-6">
              <div className="text-center text-slate-400">
                <ArrowUp className="h-8 w-8 mx-auto mb-2 text-slate-600" />
                <p className="text-sm">No upper signals</p>
              </div>
            </Card>
          ) : (
            upperSignals.slice(0, 2).map((stock) => (
              <StockCard
                key={stock.id}
                stock={stock}
                onToggleFavorite={onToggleFavorite}
              />
            ))
          )}
        </div>

        {/* Lower Signals - Compact Cards */}
        <div className="space-y-3">
          <div className="flex items-center mb-3">
            <ArrowDown className="text-red-500 mr-2 h-5 w-5" />
            <h3 className="text-lg font-semibold text-white">Lower BOS/CHOCH - Buy</h3>
          </div>
          {lowerSignals.length === 0 ? (
            <Card className="bg-slate-800 border-slate-700 p-6">
              <div className="text-center text-slate-400">
                <ArrowDown className="h-8 w-8 mx-auto mb-2 text-slate-600" />
                <p className="text-sm">No lower signals</p>
              </div>
            </Card>
          ) : (
            lowerSignals.slice(0, 2).map((stock) => (
              <StockCard
                key={stock.id}
                stock={stock}
                onToggleFavorite={onToggleFavorite}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}