import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Star, StarOff, RefreshCw, TrendingUp, TrendingDown, Activity, Eye, Download } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

interface TimeframeData {
  timeframe: string;
  analysis: {
    currentStructure: 'Bullish' | 'Bearish' | 'Bullish (CHoCH)' | 'Bearish (CHoCH)' | 'Neutral';
    lastBOSCHOCH: any;
    activeFVGs: any[];
    structureConfidence: number;
  };
  hasValidSignal: boolean;
  proximityToStructure: number;
}

interface StockSMCResult {
  symbol: string;
  companyName: string;
  currentPrice: number;
  timeframes: TimeframeData[];
  matchingTimeframes: number;
  overallStructure: 'Bullish' | 'Bearish' | 'Bullish (CHoCH)' | 'Bearish (CHoCH)' | 'Neutral';
  latestBOSCHOCH: string;
  totalFVGZones: number;
  avgProximity: number;
  structureConfidence: number;
  lastUpdated: string;
}

interface BatchSMCAnalysisResult {
  stocks: StockSMCResult[];
  metadata: {
    totalStocksAnalyzed: number;
    stocksWithValidSignals: number;
    timeframesAnalyzed: string[];
    analysisTimestamp: string;
    minTimeframeMatches: number;
  };
  refreshInterval: number;
  lastRefresh: string;
}

const REFRESH_INTERVAL = 120000; // 2 minutes

export default function SMCDashboard() {
  const [selectedStock, setSelectedStock] = useState<StockSMCResult | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<'timeframes' | 'structure' | 'confidence'>('timeframes');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Load favorites from localStorage on mount
  useEffect(() => {
    const savedFavorites = localStorage.getItem('smc-favorites');
    if (savedFavorites) {
      try {
        setFavorites(new Set(JSON.parse(savedFavorites)));
      } catch (error) {
        console.error('Error loading favorites:', error);
      }
    }
  }, []);

  // Save favorites to localStorage
  const saveFavorites = (newFavorites: Set<string>) => {
    setFavorites(newFavorites);
    localStorage.setItem('smc-favorites', JSON.stringify(Array.from(newFavorites)));
  };

  const {
    data: dashboardData,
    error,
    isLoading,
    refetch
  } = useQuery<BatchSMCAnalysisResult>({
    queryKey: ['/api/market-structure/dashboard'],
    refetchInterval: REFRESH_INTERVAL,
    refetchIntervalInBackground: true,
    staleTime: 60000 // Consider data stale after 1 minute
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      toast({
        title: "Dashboard Refreshed",
        description: "Market structure data has been updated successfully."
      });
    } catch (error) {
      toast({
        title: "Refresh Failed",
        description: "Failed to refresh dashboard data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const toggleFavorite = (symbol: string) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(symbol)) {
      newFavorites.delete(symbol);
    } else {
      newFavorites.add(symbol);
    }
    saveFavorites(newFavorites);
  };

  const getStructureColor = (structure: string) => {
    switch (structure) {
      case 'Bullish': return 'bg-green-500 text-white';
      case 'Bearish': return 'bg-red-500 text-white';
      case 'Bullish (CHoCH)': return 'bg-orange-500 text-white';
      case 'Bearish (CHoCH)': return 'bg-orange-600 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getStructureIcon = (structure: string) => {
    switch (structure) {
      case 'Bullish':
      case 'Bullish (CHoCH)':
        return <TrendingUp className="w-4 h-4" />;
      case 'Bearish':
      case 'Bearish (CHoCH)':
        return <TrendingDown className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const sortedStocks = dashboardData?.stocks?.slice().sort((a, b) => {
    switch (sortBy) {
      case 'timeframes':
        return b.matchingTimeframes - a.matchingTimeframes;
      case 'structure':
        return a.overallStructure.localeCompare(b.overallStructure);
      case 'confidence':
        return b.structureConfidence - a.structureConfidence;
      default:
        return 0;
    }
  }) || [];

  const exportToCSV = () => {
    if (!dashboardData?.stocks) return;
    
    const headers = ['Symbol', 'Company', 'Price', 'Structure', 'Timeframes', 'Confidence', 'FVG Zones', 'Latest BOS/CHOCH'];
    const csvData = dashboardData.stocks.map(stock => [
      stock.symbol,
      stock.companyName,
      stock.currentPrice,
      stock.overallStructure,
      stock.matchingTimeframes,
      Math.round(stock.structureConfidence),
      stock.totalFVGZones,
      stock.latestBOSCHOCH
    ]);
    
    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `smc-analysis-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800">
          <CardHeader>
            <CardTitle className="text-red-800 dark:text-red-200">Error Loading Dashboard</CardTitle>
            <CardDescription className="text-red-600 dark:text-red-300">
              Failed to load SMC analysis data. Please try refreshing.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleRefresh} className="mt-4">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">SMC Dashboard</h1>
          <p className="text-muted-foreground">
            Real-time Smart Money Concept analysis across multiple timeframes
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            onClick={exportToCSV}
            variant="outline"
            size="sm"
            disabled={!dashboardData?.stocks?.length}
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {dashboardData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Analyzed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.metadata.totalStocksAnalyzed}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Valid Signals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {dashboardData.metadata.stocksWithValidSignals}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Timeframes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.metadata.timeframesAnalyzed.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Last Updated</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm font-medium">
                {new Date(dashboardData.lastRefresh).toLocaleTimeString()}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Sorting Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Market Structure Analysis</span>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-normal text-muted-foreground">Sort by:</span>
              <Button
                variant={sortBy === 'timeframes' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSortBy('timeframes')}
              >
                Timeframes
              </Button>
              <Button
                variant={sortBy === 'structure' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSortBy('structure')}
              >
                Structure
              </Button>
              <Button
                variant={sortBy === 'confidence' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSortBy('confidence')}
              >
                Confidence
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Symbol</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Structure</TableHead>
                  <TableHead>Timeframes</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>FVG Zones</TableHead>
                  <TableHead>Latest Event</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedStocks.map((stock) => (
                  <TableRow key={stock.symbol} className="hover:bg-muted/50">
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleFavorite(stock.symbol)}
                        className="p-1"
                      >
                        {favorites.has(stock.symbol) ? (
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        ) : (
                          <StarOff className="w-4 h-4 text-muted-foreground" />
                        )}
                      </Button>
                    </TableCell>
                    <TableCell className="font-medium">{stock.symbol}</TableCell>
                    <TableCell className="max-w-48 truncate">{stock.companyName}</TableCell>
                    <TableCell>₹{stock.currentPrice.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge className={getStructureColor(stock.overallStructure)}>
                        <span className="flex items-center gap-1">
                          {getStructureIcon(stock.overallStructure)}
                          {stock.overallStructure}
                        </span>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {stock.matchingTimeframes}/6
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={stock.structureConfidence > 80 ? "default" : 
                                stock.structureConfidence > 60 ? "secondary" : "outline"}
                      >
                        {Math.round(stock.structureConfidence)}%
                      </Badge>
                    </TableCell>
                    <TableCell>{stock.totalFVGZones}</TableCell>
                    <TableCell className="max-w-32 truncate text-sm text-muted-foreground">
                      {stock.latestBOSCHOCH}
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setSelectedStock(stock)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              {stock.symbol} - {stock.companyName}
                              <Badge className={getStructureColor(stock.overallStructure)}>
                                {stock.overallStructure}
                              </Badge>
                            </DialogTitle>
                            <DialogDescription>
                              Detailed timeframe analysis for {stock.symbol}
                            </DialogDescription>
                          </DialogHeader>
                          
                          {selectedStock && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="space-y-1">
                                  <div className="text-sm text-muted-foreground">Current Price</div>
                                  <div className="text-lg font-semibold">₹{selectedStock.currentPrice.toFixed(2)}</div>
                                </div>
                                <div className="space-y-1">
                                  <div className="text-sm text-muted-foreground">Matching Timeframes</div>
                                  <div className="text-lg font-semibold">{selectedStock.matchingTimeframes}/6</div>
                                </div>
                                <div className="space-y-1">
                                  <div className="text-sm text-muted-foreground">Structure Confidence</div>
                                  <div className="text-lg font-semibold">{Math.round(selectedStock.structureConfidence)}%</div>
                                </div>
                                <div className="space-y-1">
                                  <div className="text-sm text-muted-foreground">Total FVG Zones</div>
                                  <div className="text-lg font-semibold">{selectedStock.totalFVGZones}</div>
                                </div>
                              </div>
                              
                              <div>
                                <h4 className="text-lg font-semibold mb-3">Timeframe Analysis</h4>
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Timeframe</TableHead>
                                      <TableHead>Structure</TableHead>
                                      <TableHead>Valid Signal</TableHead>
                                      <TableHead>Confidence</TableHead>
                                      <TableHead>FVG Count</TableHead>
                                      <TableHead>Proximity</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {selectedStock.timeframes.map((tf) => (
                                      <TableRow key={tf.timeframe}>
                                        <TableCell className="font-medium">{tf.timeframe}</TableCell>
                                        <TableCell>
                                          <Badge 
                                            className={getStructureColor(tf.analysis.currentStructure)}
                                            variant="outline"
                                          >
                                            {tf.analysis.currentStructure}
                                          </Badge>
                                        </TableCell>
                                        <TableCell>
                                          <Badge variant={tf.hasValidSignal ? "default" : "secondary"}>
                                            {tf.hasValidSignal ? "Yes" : "No"}
                                          </Badge>
                                        </TableCell>
                                        <TableCell>{Math.round(tf.analysis.structureConfidence)}%</TableCell>
                                        <TableCell>{tf.analysis.activeFVGs.length}</TableCell>
                                        <TableCell>{tf.proximityToStructure.toFixed(2)}%</TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          
          {dashboardData && sortedStocks.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No stocks found with valid SMC signals. Try refreshing or check back later.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}