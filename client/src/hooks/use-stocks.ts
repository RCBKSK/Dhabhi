import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Stock, DashboardStats } from "@shared/schema";

export function useStocks(searchQuery: string = "") {
  const queryClient = useQueryClient();

  // Get all stocks
  const {
    data: allStocks = [],
    isLoading: isLoadingAll,
    refetch: refetchAll,
  } = useQuery<Stock[]>({
    queryKey: ["/api/stocks"],
  });

  // Get upper signals
  const {
    data: upperSignals = [],
    isLoading: isLoadingUpper,
    refetch: refetchUpper,
  } = useQuery<Stock[]>({
    queryKey: ["/api/stocks/upper"],
  });

  // Get lower signals
  const {
    data: lowerSignals = [],
    isLoading: isLoadingLower,
    refetch: refetchLower,
  } = useQuery<Stock[]>({
    queryKey: ["/api/stocks/lower"],
  });

  // Get favorite stocks
  const {
    data: favoriteStocks = [],
    isLoading: isLoadingFavorites,
    refetch: refetchFavorites,
  } = useQuery<Stock[]>({
    queryKey: ["/api/stocks/favorites"],
  });

  // Get dashboard stats
  const {
    data: dashboardStats,
    isLoading: isLoadingStats,
    refetch: refetchStats,
  } = useQuery<DashboardStats>({
    queryKey: ["/api/stats"],
  });

  // Search stocks
  const {
    data: searchResults = [],
    isLoading: isSearching,
  } = useQuery<Stock[]>({
    queryKey: ["/api/stocks/search", { q: searchQuery }],
    enabled: searchQuery.length > 0,
  });

  // Toggle favorite mutation
  const toggleFavoriteMutation = useMutation({
    mutationFn: async ({ stockId, userId }: { stockId: number; userId?: number }) => {
      const response = await apiRequest("PATCH", `/api/stocks/${stockId}/favorite`, {
        body: JSON.stringify({ userId }),
        headers: { "Content-Type": "application/json" },
      });
      return response.json();
    },
    onSuccess: () => {
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ["/api/stocks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stocks/upper"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stocks/lower"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stocks/favorites"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
  });

  // Bulk add favorites mutation
  const addBulkFavoritesMutation = useMutation({
    mutationFn: async ({ stockIds, userId }: { stockIds: number[]; userId: number }) => {
      const response = await apiRequest("POST", "/api/stocks/favorites/bulk", {
        body: JSON.stringify({ stockIds, userId }),
        headers: { "Content-Type": "application/json" },
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stocks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stocks/upper"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stocks/lower"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stocks/favorites"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
  });

  // Bulk remove favorites mutation
  const removeBulkFavoritesMutation = useMutation({
    mutationFn: async ({ stockIds, userId }: { stockIds: number[]; userId: number }) => {
      const response = await apiRequest("DELETE", "/api/stocks/favorites/bulk", {
        body: JSON.stringify({ stockIds, userId }),
        headers: { "Content-Type": "application/json" },
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stocks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stocks/upper"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stocks/lower"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stocks/favorites"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
  });

  const isLoading = isLoadingAll || isLoadingUpper || isLoadingLower || isLoadingFavorites || isLoadingStats;

  const refetch = () => {
    refetchAll();
    refetchUpper();
    refetchLower();
    refetchFavorites();
    refetchStats();
  };

  const toggleFavorite = async (stockId: number, userId?: number) => {
    await toggleFavoriteMutation.mutateAsync({ stockId, userId });
  };

  const addBulkFavorites = async (stockIds: number[], userId: number) => {
    await addBulkFavoritesMutation.mutateAsync({ stockIds, userId });
  };

  const removeBulkFavorites = async (stockIds: number[], userId: number) => {
    await removeBulkFavoritesMutation.mutateAsync({ stockIds, userId });
  };

  return {
    allStocks: searchQuery ? searchResults : allStocks,
    upperSignals,
    lowerSignals,
    favoriteStocks,
    dashboardStats,
    isLoading,
    isSearching,
    refetch,
    toggleFavorite,
    addBulkFavorites,
    removeBulkFavorites,
    isToggling: toggleFavoriteMutation.isPending,
    isBulkOperating: addBulkFavoritesMutation.isPending || removeBulkFavoritesMutation.isPending,
  };
}
