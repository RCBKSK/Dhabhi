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

      {/* Force Side by Side Layout */}
      <div className="grid grid-cols-2 gap-4">
        {/* Upper Signals Column */}
        <div className="flex flex-col min-h-0">
          <div className="flex items-center mb-3">
            <ArrowUp className="text-green-500 mr-2 h-4 w-4" />
            <h3 className="text-sm font-semibold text-white">Upper BOS/CHOCH - Sell</h3>
          </div>
          <div className="space-y-2 flex-1">
            {upperSignals.length === 0 ? (
              <Card className="bg-slate-800 border-slate-700 p-4 h-24 flex items-center justify-center">
                <div className="text-center text-slate-400">
                  <ArrowUp className="h-6 w-6 mx-auto mb-1 text-slate-600" />
                  <p className="text-xs">No upper signals</p>
                </div>
              </Card>
            ) : (
              <>
                {upperSignals.slice(0, 2).map((stock) => (
                  <StockCard
                    key={stock.id}
                    stock={stock}
                    onToggleFavorite={onToggleFavorite}
                  />
                ))}
                {upperSignals.length > 2 && (
                  <div className="text-center py-1 text-slate-400 text-xs">
                    +{upperSignals.length - 2} more signals
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Lower Signals Column */}
        <div className="flex flex-col min-h-0">
          <div className="flex items-center mb-3">
            <ArrowDown className="text-red-500 mr-2 h-4 w-4" />
            <h3 className="text-sm font-semibold text-white">Lower BOS/CHOCH - Buy</h3>
          </div>
          <div className="space-y-2 flex-1">
            {lowerSignals.length === 0 ? (
              <Card className="bg-slate-800 border-slate-700 p-4 h-24 flex items-center justify-center">
                <div className="text-center text-slate-400">
                  <ArrowDown className="h-6 w-6 mx-auto mb-1 text-slate-600" />
                  <p className="text-xs">No lower signals</p>
                </div>
              </Card>
            ) : (
              <>
                {lowerSignals.slice(0, 2).map((stock) => (
                  <StockCard
                    key={stock.id}
                    stock={stock}
                    onToggleFavorite={onToggleFavorite}
                  />
                ))}
                {lowerSignals.length > 2 && (
                  <div className="text-center py-1 text-slate-400 text-xs">
                    +{lowerSignals.length - 2} more signals
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}