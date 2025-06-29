import { useState } from "react";
import { Filter, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface ScreenerFilters {
  sectors: string[];
  marketCap: string;
  trendDirection: string;
  confidenceLevel: string;
  signalStrength: number[];
  proximityRange: number[];
}

interface StockScreenerProps {
  filters: ScreenerFilters;
  onFiltersChange: (filters: ScreenerFilters) => void;
  activeFiltersCount: number;
}

const SECTORS = [
  "Banking & Financial",
  "Information Technology", 
  "Oil & Gas",
  "Pharmaceuticals",
  "Automobiles",
  "Metals & Mining",
  "FMCG",
  "Telecom",
  "Power & Energy",
  "Real Estate"
];

const MARKET_CAPS = [
  { value: "large", label: "Large Cap (₹20,000+ Cr)" },
  { value: "mid", label: "Mid Cap (₹5,000-20,000 Cr)" },
  { value: "small", label: "Small Cap (<₹5,000 Cr)" },
  { value: "all", label: "All Market Caps" }
];

export default function StockScreener({ filters, onFiltersChange, activeFiltersCount }: StockScreenerProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const updateFilters = (key: keyof ScreenerFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const toggleSector = (sector: string) => {
    const newSectors = filters.sectors.includes(sector)
      ? filters.sectors.filter(s => s !== sector)
      : [...filters.sectors, sector];
    updateFilters('sectors', newSectors);
  };

  const clearAllFilters = () => {
    onFiltersChange({
      sectors: [],
      marketCap: "all",
      trendDirection: "all",
      confidenceLevel: "all",
      signalStrength: [1, 5],
      proximityRange: [0, 10]
    });
  };

  const hasActiveFilters = activeFiltersCount > 0;

  return (
    <Card className="bg-slate-800 border-slate-700">
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-slate-700/50 transition-colors">
            <CardTitle className="text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Filter className="h-5 w-5" />
                <span>Stock Screener</span>
                {hasActiveFilters && (
                  <Badge variant="secondary" className="bg-blue-500 text-white">
                    {activeFiltersCount} active
                  </Badge>
                )}
              </div>
              <div className="flex items-center space-x-2">
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      clearAllFilters();
                    }}
                    className="text-slate-400 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                    Clear
                  </Button>
                )}
                <span className="text-slate-400 text-sm">
                  {isExpanded ? 'Collapse' : 'Expand'}
                </span>
              </div>
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="space-y-6">
            {/* Sector Filters */}
            <div>
              <h4 className="text-white font-medium mb-3">Sectors</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {SECTORS.map((sector) => (
                  <div key={sector} className="flex items-center space-x-2">
                    <Checkbox
                      id={sector}
                      checked={filters.sectors.includes(sector)}
                      onCheckedChange={() => toggleSector(sector)}
                      className="border-slate-500"
                    />
                    <label
                      htmlFor={sector}
                      className="text-sm text-slate-300 cursor-pointer"
                    >
                      {sector}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Market Cap Filter */}
            <div>
              <h4 className="text-white font-medium mb-3">Market Capitalization</h4>
              <Select value={filters.marketCap} onValueChange={(value) => updateFilters('marketCap', value)}>
                <SelectTrigger className="bg-slate-700 border-slate-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MARKET_CAPS.map((cap) => (
                    <SelectItem key={cap.value} value={cap.value}>
                      {cap.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Trend Direction */}
            <div>
              <h4 className="text-white font-medium mb-3">Trend Direction</h4>
              <Select value={filters.trendDirection} onValueChange={(value) => updateFilters('trendDirection', value)}>
                <SelectTrigger className="bg-slate-700 border-slate-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Trends</SelectItem>
                  <SelectItem value="bullish">Bullish Only</SelectItem>
                  <SelectItem value="bearish">Bearish Only</SelectItem>
                  <SelectItem value="trending_up">Trending Up</SelectItem>
                  <SelectItem value="trending_down">Trending Down</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Trend Confidence */}
            <div>
              <h4 className="text-white font-medium mb-3">Trend Confidence</h4>
              <Select value={filters.confidenceLevel} onValueChange={(value) => updateFilters('confidenceLevel', value)}>
                <SelectTrigger className="bg-slate-700 border-slate-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Confidence Levels</SelectItem>
                  <SelectItem value="high">High Confidence (4+ timeframes aligned)</SelectItem>
                  <SelectItem value="medium">Medium Confidence (3+ timeframes aligned)</SelectItem>
                  <SelectItem value="low">Low Confidence (2+ timeframes aligned)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Signal Strength */}
            <div>
              <h4 className="text-white font-medium mb-3">
                Signal Strength: {filters.signalStrength[0]} - {filters.signalStrength[1]} stars
              </h4>
              <Slider
                value={filters.signalStrength}
                onValueChange={(value) => updateFilters('signalStrength', value)}
                min={1}
                max={5}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>Weak</span>
                <span>Strong</span>
              </div>
            </div>

            {/* Proximity to BOS/CHOCH */}
            <div>
              <h4 className="text-white font-medium mb-3">
                Distance from BOS: {filters.proximityRange[0]} - {filters.proximityRange[1]} points
              </h4>
              <Slider
                value={filters.proximityRange}
                onValueChange={(value) => updateFilters('proximityRange', value)}
                min={0}
                max={10}
                step={0.5}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>Very Close</span>
                <span>Distant</span>
              </div>
            </div>

            {/* Active Filters Summary */}
            {hasActiveFilters && (
              <div className="pt-4 border-t border-slate-600">
                <h4 className="text-white font-medium mb-2">Active Filters</h4>
                <div className="flex flex-wrap gap-2">
                  {filters.sectors.map((sector) => (
                    <Badge key={sector} variant="secondary" className="bg-blue-500/20 text-blue-400">
                      {sector}
                      <X 
                        className="h-3 w-3 ml-1 cursor-pointer" 
                        onClick={() => toggleSector(sector)}
                      />
                    </Badge>
                  ))}
                  
                  {filters.marketCap !== "all" && (
                    <Badge variant="secondary" className="bg-green-500/20 text-green-400">
                      {MARKET_CAPS.find(m => m.value === filters.marketCap)?.label}
                    </Badge>
                  )}
                  
                  {filters.trendDirection !== "all" && (
                    <Badge variant="secondary" className="bg-purple-500/20 text-purple-400">
                      {filters.trendDirection.replace('_', ' ').toUpperCase()}
                    </Badge>
                  )}
                  
                  {filters.confidenceLevel !== "all" && (
                    <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400">
                      {filters.confidenceLevel.toUpperCase()} CONFIDENCE
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}