import { useState, useEffect } from "react";
import { TrendingUp, ArrowUp, ArrowDown, Star, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { DashboardStats } from "@shared/schema";

interface StatsOverviewProps {
  stats: DashboardStats | undefined;
}

export default function StatsOverview({ stats }: StatsOverviewProps) {
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (stats?.nextScanIn) {
      setCountdown(stats.nextScanIn);
      
      const interval = setInterval(() => {
        setCountdown(prev => Math.max(0, prev - 1));
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [stats?.nextScanIn]);

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="bg-slate-800 border-slate-700">
            <CardContent className="p-4">
              <div className="animate-pulse">
                <div className="h-4 bg-slate-600 rounded mb-2"></div>
                <div className="h-8 bg-slate-600 rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Signals",
      value: stats.totalSignals,
      icon: TrendingUp,
      color: "text-blue-500",
    },
    {
      title: "Upper BOS/CHOCH",
      value: stats.upperSignals,
      icon: ArrowUp,
      color: "text-green-500",
    },
    {
      title: "Lower BOS/CHOCH",
      value: stats.lowerSignals,
      icon: ArrowDown,
      color: "text-red-500",
    },
    {
      title: "Favorites",
      value: stats.favorites,
      icon: Star,
      color: "text-yellow-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
      {statCards.map((stat, index) => (
        <Card key={index} className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">{stat.title}</p>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
              </div>
              <stat.icon className={`${stat.color} text-xl h-6 w-6`} />
            </div>
          </CardContent>
        </Card>
      ))}
      
      {/* Scan Clock Card */}
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Next Scan</p>
              <p className="text-xl font-bold text-white">
                {countdown > 0 ? formatCountdown(countdown) : "Scanning..."}
              </p>
              {stats.lastScanTime && (
                <p className="text-xs text-slate-500">
                  Last: {new Date(stats.lastScanTime).toLocaleTimeString()}
                </p>
              )}
            </div>
            <Clock className="text-blue-400 text-xl h-6 w-6" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
