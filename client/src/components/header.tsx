import { Search, RotateCcw, User, LogOut, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import NotificationPanel from "./notification-panel";
import FyersAuthModal from "./fyers-auth-modal";
import { useState, useRef, useEffect } from "react";
import type { Stock } from "@shared/schema";

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedTimeframes: string[];
  onTimeframesChange: (timeframes: string[]) => void;
  proximityFilter: string;
  onProximityChange: (proximity: string) => void;
  autoRefresh: boolean;
  onToggleAutoRefresh: (enabled: boolean) => void;
  onRefresh: () => void;
}

const timeframes = ["5m", "15m", "30m", "45m", "1h", "2h", "4h", "1D"];

function UserInfo() {
  const { user, logout, isLoggingOut } = useAuth();
  
  return (
    <div className="flex items-center space-x-2 bg-slate-700 px-3 py-2 rounded-lg">
      <User className="h-4 w-4 text-slate-400" />
      <span className="text-sm text-white">{user?.username}</span>
      <Button
        variant="ghost"
        size="sm"
        onClick={logout}
        disabled={isLoggingOut}
        className="p-1 h-auto hover:bg-slate-600"
      >
        <LogOut className="h-4 w-4 text-slate-400 hover:text-slate-200 transition-colors" />
      </Button>
    </div>
  );
}

export default function Header({
  searchQuery,
  onSearchChange,
  selectedTimeframes,
  onTimeframesChange,
  proximityFilter,
  onProximityChange,
  autoRefresh,
  onToggleAutoRefresh,
  onRefresh,
}: HeaderProps) {
  const [showFyersAuth, setShowFyersAuth] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Search stocks when query changes
  const { data: searchResults = [], isLoading: isSearching } = useQuery({
    queryKey: ["/api/stocks/search", searchQuery],
    queryFn: async () => {
      console.log('Frontend search query:', searchQuery);
      if (!searchQuery.trim()) return [];
      const response = await fetch(`/api/stocks/search?q=${encodeURIComponent(searchQuery)}`);
      if (!response.ok) throw new Error('Search failed');
      const data = await response.json();
      console.log('Frontend search results:', data);
      return data as Stock[];
    },
    enabled: searchQuery.length > 0,
    staleTime: 0,
  });

  // Handle clicks outside search dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Show search results when query is entered
  useEffect(() => {
    setShowSearchResults(searchQuery.length > 0);
  }, [searchQuery]);

  const handleTimeframeToggle = (timeframe: string) => {
    if (selectedTimeframes.includes(timeframe)) {
      onTimeframesChange(selectedTimeframes.filter(t => t !== timeframe));
    } else {
      onTimeframesChange([...selectedTimeframes, timeframe]);
    }
  };

  const handleSearchChange = (value: string) => {
    console.log('Search input changed:', value);
    onSearchChange(value);
    if (value.length === 0) {
      setShowSearchResults(false);
    }
  };

  const currentTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  return (
    <header className="bg-slate-800 border-b border-slate-700 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-white">NSE Stock Monitor</h1>
          <Badge variant="secondary" className="bg-blue-500/20 text-blue-400 border-blue-500/30">
            SMC Dashboard
          </Badge>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Search Input with Dropdown */}
          <div className="relative" ref={searchRef}>
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4 z-10" />
            <Input
              type="text"
              placeholder="Search stocks..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="bg-slate-700 border-slate-600 pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
            />
            
            {/* Search Results Dropdown */}
            {(showSearchResults || isSearching) && (
              <Card className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border-slate-600 z-50 max-h-64 overflow-y-auto">
                <CardContent className="p-2">
                  {isSearching ? (
                    <div className="p-3 text-center text-slate-400">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mx-auto mb-2"></div>
                      <span className="text-sm">Searching...</span>
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div className="p-3 text-center text-slate-400">
                      <span className="text-sm">No stocks found</span>
                    </div>
                  ) : (
                    searchResults.map((stock: Stock) => (
                      <div
                        key={stock.id}
                        className="p-3 hover:bg-slate-700 rounded cursor-pointer border-b border-slate-600 last:border-b-0"
                        onClick={() => {
                          setShowSearchResults(false);
                          onSearchChange("");
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-medium text-white">{stock.symbol}</span>
                            <div className="text-sm text-slate-400">
                              ₹{stock.price.toFixed(2)} • {stock.signalType} Signal
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`text-sm font-medium ${stock.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {stock.change >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                            </div>
                            <div className="text-xs text-slate-400">
                              {stock.distance.toFixed(1)}pts
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            )}
          </div>
          
          {/* Auto Refresh Status */}
          <div className="flex items-center space-x-2 bg-slate-700 px-3 py-2 rounded-lg">
            <div className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-green-500 animate-pulse' : 'bg-slate-500'}`} />
            <span className="text-sm text-slate-300">
              Auto-refresh: <span className="text-white">{autoRefresh ? '2m' : 'OFF'}</span>
            </span>
          </div>
          
          {/* User Info */}
          <UserInfo />
        </div>
      </div>
      
      {/* Filter Controls */}
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm text-slate-300">Timeframes:</label>
            <div className="flex space-x-1">
              {timeframes.map((timeframe) => (
                <Button
                  key={timeframe}
                  onClick={() => handleTimeframeToggle(timeframe)}
                  variant={selectedTimeframes.includes(timeframe) ? "default" : "secondary"}
                  size="sm"
                  className={`px-2 py-1 text-xs ${
                    selectedTimeframes.includes(timeframe)
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-slate-600 text-slate-300 hover:bg-slate-500"
                  }`}
                >
                  {timeframe}
                </Button>
              ))}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <label className="text-sm text-slate-300">Proximity:</label>
            <Select value={proximityFilter} onValueChange={onProximityChange}>
              <SelectTrigger className="w-32 bg-slate-700 border-slate-600 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="±5 points">±5 points</SelectItem>
                <SelectItem value="±10 points">±10 points</SelectItem>
                <SelectItem value="±15 points">±15 points</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Live Data Button */}
          <Button
            onClick={() => setShowFyersAuth(true)}
            variant="outline"
            size="sm"
            className="bg-orange-600 hover:bg-orange-700 text-white border-orange-500"
          >
            <Zap className="h-4 w-4 mr-2" />
            Enable Live Data
          </Button>
          
          <span className="text-sm text-slate-400">
            Last updated: <span className="text-white">{currentTime}</span>
          </span>
          <NotificationPanel />
          <Button
            onClick={onRefresh}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 text-sm font-medium transition-colors"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Refresh Now
          </Button>
        </div>
      </div>
      
      <FyersAuthModal
        isOpen={showFyersAuth}
        onClose={() => setShowFyersAuth(false)}
      />
    </header>
  );
}
