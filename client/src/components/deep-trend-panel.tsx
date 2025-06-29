import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, Star } from "lucide-react";
import type { TrendQuality } from "@shared/schema";

export default function DeepTrendPanel() {
  const { data: trendAnalysis, isLoading } = useQuery<TrendQuality[]>({
    queryKey: ['/api/trends/analysis'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Deep Trend Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="h-4 bg-slate-600 rounded w-16"></div>
                <div className="h-4 bg-slate-600 rounded flex-1"></div>
                <div className="h-6 bg-slate-600 rounded w-12"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!trendAnalysis?.length) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Deep Trend Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-400">No trend data available</p>
        </CardContent>
      </Card>
    );
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'BULLISH':
        return <TrendingUp className="h-4 w-4 text-green-400" />;
      case 'BEARISH':
        return <TrendingDown className="h-4 w-4 text-red-400" />;
      default:
        return <Minus className="h-4 w-4 text-slate-400" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'BULLISH':
        return 'bg-green-500/20 text-green-400';
      case 'BEARISH':
        return 'bg-red-500/20 text-red-400';
      default:
        return 'bg-slate-600/20 text-slate-400';
    }
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'HIGH':
        return 'bg-green-500 text-white';
      case 'MEDIUM':
        return 'bg-yellow-500 text-black';
      default:
        return 'bg-red-500 text-white';
    }
  };

  const getSignalStrengthStars = (strength: number) => {
    return [...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={`h-3 w-3 ${
          i < strength ? 'text-yellow-400 fill-current' : 'text-slate-600'
        }`}
      />
    ));
  };

  const timeframes = ['5m', '15m', '30m', '1h', '2h', '4h', '1D'];

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center space-x-2">
          <TrendingUp className="h-5 w-5" />
          <span>Deep Trend Analysis</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Header Row */}
          <div className="grid grid-cols-12 gap-2 text-xs text-slate-400 font-medium border-b border-slate-600 pb-2">
            <div className="col-span-2">Symbol</div>
            {timeframes.map(tf => (
              <div key={tf} className="text-center">{tf}</div>
            ))}
            <div className="text-center">Score</div>
            <div className="text-center">Confidence</div>
            <div className="text-center">Strength</div>
          </div>

          {/* Data Rows */}
          {trendAnalysis.map((analysis) => (
            <div key={analysis.symbol} className="grid grid-cols-12 gap-2 items-center py-2 hover:bg-slate-700/50 rounded px-2">
              <div className="col-span-2">
                <span className="text-white font-medium">{analysis.symbol}</span>
              </div>
              
              {/* Timeframe trend indicators */}
              {timeframes.map(tf => (
                <div key={tf} className="flex justify-center">
                  {analysis.timeframes[tf] ? (
                    <div className={`px-1 py-0.5 rounded text-xs ${getTrendColor(analysis.timeframes[tf])}`}>
                      {getTrendIcon(analysis.timeframes[tf])}
                    </div>
                  ) : (
                    <div className="text-slate-600">-</div>
                  )}
                </div>
              ))}
              
              {/* Alignment Score */}
              <div className="text-center">
                <span className="text-white font-medium">
                  {Math.round(analysis.alignmentScore * 100)}%
                </span>
              </div>
              
              {/* Confidence Badge */}
              <div className="flex justify-center">
                <Badge className={`text-xs px-2 py-1 ${getConfidenceColor(analysis.confidence)}`}>
                  {analysis.confidence}
                </Badge>
              </div>
              
              {/* Signal Strength Stars */}
              <div className="flex justify-center space-x-0.5">
                {getSignalStrengthStars(analysis.signalStrength)}
              </div>
            </div>
          ))}
        </div>

        {/* Summary Stats */}
        <div className="mt-6 pt-4 border-t border-slate-600">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-slate-400 text-xs">High Confidence</p>
              <p className="text-white font-bold">
                {trendAnalysis.filter(t => t.confidence === 'HIGH').length}
              </p>
            </div>
            <div>
              <p className="text-slate-400 text-xs">Avg Alignment</p>
              <p className="text-white font-bold">
                {Math.round(trendAnalysis.reduce((acc, t) => acc + t.alignmentScore, 0) / trendAnalysis.length * 100)}%
              </p>
            </div>
            <div>
              <p className="text-slate-400 text-xs">Strong Signals</p>
              <p className="text-white font-bold">
                {trendAnalysis.filter(t => t.signalStrength >= 4).length}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}