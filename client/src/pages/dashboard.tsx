import { useEffect, useState } from "react";
import Header from "@/components/header";
import StatsOverview from "@/components/stats-overview";
import TradingPanels from "@/components/trading-panels";
import FavoritesSection from "@/components/favorites-section";
import DeepTrendPanel from "@/components/deep-trend-panel";
import StockScreener from "@/components/stock-screener";
import { useStocks } from "@/hooks/use-stocks";

export default function Dashboard() {
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTimeframes, setSelectedTimeframes] = useState(["5m", "30m", "1h"]);
  const [proximityFilter, setProximityFilter] = useState("±5 points");
  const [screenerFilters, setScreenerFilters] = useState({
    sectors: [],
    marketCap: "all",
    trendDirection: "all",
    confidenceLevel: "all",
    signalStrength: [1, 5],
    proximityRange: [0, 10]
  });

  const {
    allStocks,
    upperSignals,
    lowerSignals,
    favoriteStocks,
    dashboardStats,
    isLoading,
    refetch,
    toggleFavorite,
  } = useStocks(searchQuery);

  // Auto-refresh functionality with real NSE data updates
  useEffect(() => {
    if (!autoRefresh) return;

    const updateData = async () => {
      try {
        // Trigger backend to fetch fresh NSE data
        await fetch('/api/stocks/update-prices', { method: 'POST' });
        refetch();
      } catch (error) {
        console.log('Update failed, retrying...');
        refetch();
      }
    };

    const interval = setInterval(updateData, 120000); // 2 minutes
    return () => clearInterval(interval);
  }, [autoRefresh, refetch]);

  const handleRefresh = () => {
    refetch();
  };

  const handleToggleFavorite = async (stockId: number) => {
    await toggleFavorite(stockId);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedTimeframes={selectedTimeframes}
        onTimeframesChange={setSelectedTimeframes}
        proximityFilter={proximityFilter}
        onProximityChange={setProximityFilter}
        autoRefresh={autoRefresh}
        onToggleAutoRefresh={setAutoRefresh}
        onRefresh={handleRefresh}
      />
      
      <main className="p-6">
        <StatsOverview stats={dashboardStats} />
        
        {/* Stock Screener */}
        <div className="mb-6">
          <StockScreener
            filters={screenerFilters}
            onFiltersChange={setScreenerFilters}
            activeFiltersCount={
              screenerFilters.sectors.length +
              (screenerFilters.marketCap !== "all" ? 1 : 0) +
              (screenerFilters.trendDirection !== "all" ? 1 : 0) +
              (screenerFilters.confidenceLevel !== "all" ? 1 : 0) +
              (screenerFilters.signalStrength[0] !== 1 || screenerFilters.signalStrength[1] !== 5 ? 1 : 0) +
              (screenerFilters.proximityRange[0] !== 0 || screenerFilters.proximityRange[1] !== 10 ? 1 : 0)
            }
          />
        </div>

        {/* Deep Trend Analysis Panel */}
        <div className="mb-6">
          <DeepTrendPanel />
        </div>
        
        <TradingPanels
          upperSignals={upperSignals}
          lowerSignals={lowerSignals}
          onToggleFavorite={handleToggleFavorite}
        />
        <FavoritesSection
          favoriteStocks={favoriteStocks}
          onToggleFavorite={handleToggleFavorite}
        />
      </main>
    </div>
  );
}
