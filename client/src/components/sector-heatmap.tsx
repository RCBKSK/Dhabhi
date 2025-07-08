import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, TrendingDown, Activity, BarChart3 } from "lucide-react";
import { type SectorAnalysis } from "@shared/schema";

export default function SectorHeatmap() {
  const { data: sectorAnalysis, isLoading } = useQuery<SectorAnalysis[]>({
    queryKey: ['/api/sectors/analysis'],
    refetchInterval: 60000, // Refresh every minute
  });

  const { data: heatmapData } = useQuery<{ [sector: string]: number }>({
    queryKey: ['/api/sectors/heatmap'],
    refetchInterval: 60000,
  });

  const getHeatmapColor = (score: number) => {
    if (score > 0.3) return 'bg-green-500';
    if (score > 0.1) return 'bg-green-300';
    if (score > -0.1) return 'bg-gray-300';
    if (score > -0.3) return 'bg-red-300';
    return 'bg-red-500';
  };

  const getHeatmapTextColor = (score: number) => {
    if (Math.abs(score) > 0.3) return 'text-white';
    return 'text-gray-800';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'BULLISH':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'BEARISH':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Sector Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="text-sm text-muted-foreground">Loading sector data...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Sector Analysis & Heatmap
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="analysis" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="analysis">Sector Analysis</TabsTrigger>
            <TabsTrigger value="heatmap">Heatmap</TabsTrigger>
          </TabsList>

          <TabsContent value="analysis" className="space-y-4">
            <div className="grid gap-4">
              {sectorAnalysis?.map((sector) => (
                <Card key={sector.sector} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getTrendIcon(sector.trend)}
                      <div>
                        <h3 className="font-semibold">{sector.sector}</h3>
                        <p className="text-sm text-muted-foreground">
                          {sector.totalStocks} stocks tracked
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={sector.trend === 'BULLISH' ? 'default' : 
                                   sector.trend === 'BEARISH' ? 'destructive' : 'outline'}>
                        {sector.trend}
                      </Badge>
                      <span className="text-sm font-medium">
                        {sector.avgSignalStrength.toFixed(1)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                    <div className="flex justify-between">
                      <span>Bullish:</span>
                      <span className="font-medium text-green-600">{sector.bullishCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Bearish:</span>
                      <span className="font-medium text-red-600">{sector.bearishCount}</span>
                    </div>
                  </div>
                  
                  {sector.topPerformers.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm font-medium mb-2">Top Performers:</p>
                      <div className="flex flex-wrap gap-1">
                        {sector.topPerformers.map((symbol) => (
                          <Badge key={symbol} variant="outline" className="text-xs">
                            {symbol}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="heatmap" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {heatmapData && Object.entries(heatmapData).map(([sector, score]) => (
                <div
                  key={sector}
                  className={`p-4 rounded-lg transition-all hover:scale-105 ${getHeatmapColor(score)} ${getHeatmapTextColor(score)}`}
                >
                  <div className="font-semibold text-sm">{sector}</div>
                  <div className="text-lg font-bold">
                    {score > 0 ? '+' : ''}{(score * 100).toFixed(1)}%
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground mt-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span>Strong Bullish</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-300 rounded"></div>
                <span>Bullish</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-300 rounded"></div>
                <span>Neutral</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-300 rounded"></div>
                <span>Bearish</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 rounded"></div>
                <span>Strong Bearish</span>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}