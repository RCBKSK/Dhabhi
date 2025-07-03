
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Star, Plus, Minus, Check } from "lucide-react";
import type { Stock } from "@shared/schema";

interface BulkFavoritesSelectorProps {
  stocks: Stock[];
  onAddBulkFavorites: (stockIds: number[]) => Promise<void>;
  onRemoveBulkFavorites: (stockIds: number[]) => Promise<void>;
  isLoading: boolean;
}

export default function BulkFavoritesSelector({
  stocks,
  onAddBulkFavorites,
  onRemoveBulkFavorites,
  isLoading,
}: BulkFavoritesSelectorProps) {
  const [selectedStocks, setSelectedStocks] = useState<Set<number>>(new Set());
  const [isOpen, setIsOpen] = useState(false);

  const handleStockToggle = (stockId: number) => {
    const newSelected = new Set(selectedStocks);
    if (newSelected.has(stockId)) {
      newSelected.delete(stockId);
    } else {
      newSelected.add(stockId);
    }
    setSelectedStocks(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedStocks.size === stocks.length) {
      setSelectedStocks(new Set());
    } else {
      setSelectedStocks(new Set(stocks.map(stock => stock.id)));
    }
  };

  const handleAddSelected = async () => {
    if (selectedStocks.size > 0) {
      await onAddBulkFavorites(Array.from(selectedStocks));
      setSelectedStocks(new Set());
      setIsOpen(false);
    }
  };

  const handleRemoveSelected = async () => {
    if (selectedStocks.size > 0) {
      await onRemoveBulkFavorites(Array.from(selectedStocks));
      setSelectedStocks(new Set());
      setIsOpen(false);
    }
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        className="mb-4 border-slate-600 hover:bg-slate-700"
      >
        <Star className="h-4 w-4 mr-2" />
        Bulk Favorites
      </Button>
    );
  }

  return (
    <Card className="bg-slate-800 border-slate-700 mb-6">
      <CardHeader className="border-b border-slate-700 p-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-white flex items-center">
            <Star className="text-yellow-500 mr-2 h-5 w-5" />
            Bulk Select Favorites
          </CardTitle>
          <Button
            onClick={() => setIsOpen(false)}
            variant="ghost"
            size="sm"
            className="text-slate-400 hover:text-white"
          >
            ✕
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="select-all"
              checked={selectedStocks.size === stocks.length && stocks.length > 0}
              onCheckedChange={handleSelectAll}
            />
            <label htmlFor="select-all" className="text-sm text-slate-300">
              Select All ({selectedStocks.size}/{stocks.length})
            </label>
          </div>
          <div className="flex space-x-2">
            <Button
              onClick={handleAddSelected}
              disabled={selectedStocks.size === 0 || isLoading}
              size="sm"
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add ({selectedStocks.size})
            </Button>
            <Button
              onClick={handleRemoveSelected}
              disabled={selectedStocks.size === 0 || isLoading}
              size="sm"
              variant="destructive"
            >
              <Minus className="h-4 w-4 mr-1" />
              Remove ({selectedStocks.size})
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
          {stocks.map((stock) => (
            <div
              key={stock.id}
              className={`bg-slate-700 border rounded-lg p-3 cursor-pointer transition-colors ${
                selectedStocks.has(stock.id)
                  ? "border-blue-500 bg-blue-500/10"
                  : "border-slate-600 hover:bg-slate-650"
              }`}
              onClick={() => handleStockToggle(stock.id)}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={selectedStocks.has(stock.id)}
                    readOnly
                  />
                  <h4 className="font-semibold text-white text-sm">{stock.symbol}</h4>
                </div>
                <Badge
                  className={`text-xs px-2 py-1 ${
                    stock.signalType === "UPPER"
                      ? "bg-green-500/20 text-green-400 border-green-500/30"
                      : "bg-red-500/20 text-red-400 border-red-500/30"
                  }`}
                >
                  {stock.signalType}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-white font-medium text-sm">₹{stock.price.toFixed(2)}</p>
                <p
                  className={`text-xs ${
                    stock.signalType === "UPPER" ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {stock.distance.toFixed(2)}pts
                </p>
              </div>
            </div>
          ))}
        </div>

        {stocks.length === 0 && (
          <div className="text-center py-8 text-slate-400">
            <Star className="h-12 w-12 mx-auto mb-4 text-slate-600" />
            <p>No stocks available for selection</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
