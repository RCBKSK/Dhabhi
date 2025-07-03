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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      {/* Upper BOS/CHOCH Panel */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="border-b border-slate-700 p-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-white flex items-center">
              <ArrowUp className="text-green-500 mr-2 h-5 w-5" />
              Near Upper BOS/CHOCH - Sell
            </CardTitle>
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
              {upperSignals.length} stocks
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-4 space-y-3 max-h-96 overflow-y-auto">
          {upperSignals.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <ArrowUp className="h-12 w-12 mx-auto mb-4 text-slate-600" />
              <p>No upper signals found</p>
            </div>
          ) : (
            upperSignals.slice(0, 2).map((stock) => (
              <StockCard
                key={stock.id}
                stock={stock}
                onToggleFavorite={onToggleFavorite}
              />
            ))
          )}
        </CardContent>
      </Card>

      {/* Lower BOS/CHOCH Panel */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="border-b border-slate-700 p-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-white flex items-center">
              <ArrowDown className="text-red-500 mr-2 h-5 w-5" />
              Near Lower BOS/CHOCH - Buy
            </CardTitle>
            <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
              {lowerSignals.length} stocks
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-4 space-y-3 max-h-96 overflow-y-auto">
          {lowerSignals.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <ArrowDown className="h-12 w-12 mx-auto mb-4 text-slate-600" />
              <p>No lower signals found</p>
            </div>
          ) : (
            lowerSignals.slice(0, 2).map((stock) => (
              <StockCard
                key={stock.id}
                stock={stock}
                onToggleFavorite={onToggleFavorite}
              />
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}