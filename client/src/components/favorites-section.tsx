import { Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Stock } from "@shared/schema";

interface FavoritesSectionProps {
  favoriteStocks: Stock[];
  onToggleFavorite: (stockId: number) => void;
}

export default function FavoritesSection({
  favoriteStocks,
  onToggleFavorite,
}: FavoritesSectionProps) {
  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader className="border-b border-slate-700 p-4">
        <CardTitle className="text-lg font-semibold text-white flex items-center">
          <Star className="text-yellow-500 mr-2 h-5 w-5" />
          Favorite Stocks
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        {favoriteStocks.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <Star className="h-12 w-12 mx-auto mb-4 text-slate-600" />
            <p>No favorite stocks added</p>
            <p className="text-sm mt-2">Click the star icon on any stock to add it to favorites</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {favoriteStocks.map((stock) => (
              <div
                key={stock.id}
                className="bg-slate-700 border border-slate-600 rounded-lg p-3 hover:bg-slate-650 transition-colors cursor-pointer"
                onClick={() => onToggleFavorite(stock.id)}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-white">{stock.symbol}</h4>
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
                  <p className="text-white font-medium">₹{stock.price.toFixed(2)}</p>
                  <p
                    className={`text-sm ${
                      stock.signalType === "UPPER" ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {stock.distance.toFixed(2)}pts
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
