import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { useStocks } from "@/hooks/use-stocks";
import { useWebSocket } from "@/hooks/use-websocket";
import Header from "@/components/header";
import StatsOverview from "@/components/stats-overview";
import TradingPanels from "@/components/trading-panels";
import FavoritesSection from "@/components/favorites-section";
import NotificationPanel from "@/components/notification-panel";
import DeepTrendPanel from "@/components/deep-trend-panel";
import FyersAuthModal from "@/components/fyers-auth-modal";
import BulkFavoritesSelector from "@/components/bulk-favorites-selector";
import StockScreener from "@/components/stock-screener";
import SectorHeatmap from "@/components/sector-heatmap";
import { Loader2 } from "lucide-react";

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

  const { user } = useAuth();

  const {
    allStocks,
    upperSignals,
    lowerSignals,
    favoriteStocks,
    dashboardStats,
    isLoading,
    refetch,
    toggleFavorite,
    addBulkFavorites,
    removeBulkFavorites,
    isBulkOperating,
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
    try {
      await toggleFavorite(stockId, user?.id);
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
    }
  };

  const handleAddBulkFavorites = async (stockIds: number[]) => {
    if (!user?.id) return;
    try {
      await addBulkFavorites(stockIds, user.id);
    } catch (error) {
      console.error("Failed to add bulk favorites:", error);
    }
  };

  const handleRemoveBulkFavorites = async (stockIds: number[]) => {
    if (!user?.id) return;
    try {
      await removeBulkFavorites(stockIds, user.id);
    } catch (error) {
      console.error("Failed to remove bulk favorites:", error);
    }
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
        allStocks={allStocks}
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
            upperSignals={upperSignals}
            lowerSignals={lowerSignals}
            onToggleFavorite={handleToggleFavorite}
          />
        </div>

        {/* Bulk Favorites Selector */}
        <BulkFavoritesSelector
          stocks={[...upperSignals, ...lowerSignals]}
          onAddBulkFavorites={handleAddBulkFavorites}
          onRemoveBulkFavorites={handleRemoveBulkFavorites}
          isLoading={isBulkOperating}
        />

        <TradingPanels
          upperSignals={upperSignals}
          lowerSignals={lowerSignals}
          onToggleFavorite={handleToggleFavorite}
        />

        <FavoritesSection
          favoriteStocks={favoriteStocks}
          onToggleFavorite={handleToggleFavorite}
        />

        {/* Phase 3: Sector Heatmap */}
        <div className="mb-6">
          <SectorHeatmap />
        </div>

        {/* Deep Trend Analysis Panel - Moved to bottom */}
        <div className="mb-6">
          <DeepTrendPanel />
        </div>
      </main>
    </div>
  );
}