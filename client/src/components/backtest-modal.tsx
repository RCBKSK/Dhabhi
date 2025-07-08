import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Activity, Target, AlertTriangle, BarChart3 } from "lucide-react";
import { type BacktestStats, type Stock } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

interface BacktestModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableStocks: Stock[];
}

interface BacktestConfig {
  symbols: string[];
  startDate: string;
  endDate: string;
  riskReward: number;
  strategy: 'BOS_ENTRY' | 'FVG_TOUCH' | 'CHOCH_BREAK';
  stopLossATR: number;
}

interface BacktestResult {
  stats: BacktestStats;
  trades: any[];
}

export default function BacktestModal({ isOpen, onClose, availableStocks }: BacktestModalProps) {
  const queryClient = useQueryClient();
  const [config, setConfig] = useState<BacktestConfig>({
    symbols: ['NIFTY', 'BANKNIFTY', 'RELIANCE', 'TCS', 'HDFCBANK'],
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    riskReward: 2,
    strategy: 'BOS_ENTRY',
    stopLossATR: 2,
  });
  
  const [results, setResults] = useState<BacktestResult | null>(null);

  const runBacktestMutation = useMutation({
    mutationFn: (config: BacktestConfig) => apiRequest(`/api/backtest/run`, {
      method: 'POST',
      body: JSON.stringify(config),
    }),
    onSuccess: (data) => {
      setResults(data);
    },
    onError: (error) => {
      console.error('Backtest failed:', error);
    }
  });

  const handleRunBacktest = () => {
    runBacktestMutation.mutate(config);
  };

  const handleSymbolsChange = (value: string) => {
    const symbols = value.split(',').map(s => s.trim()).filter(s => s.length > 0);
    setConfig({ ...config, symbols });
  };

  const StatCard = ({ title, value, icon: Icon, color, description }: any) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${color}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </CardContent>
    </Card>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Backtest Engine - SMC Strategy Analysis
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="config" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="config">Configuration</TabsTrigger>
            <TabsTrigger value="results" disabled={!results}>Results</TabsTrigger>
          </TabsList>

          <TabsContent value="config" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="symbols">Symbols (comma-separated)</Label>
                <Input
                  id="symbols"
                  value={config.symbols.join(', ')}
                  onChange={(e) => handleSymbolsChange(e.target.value)}
                  placeholder="NIFTY, BANKNIFTY, RELIANCE"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="strategy">Strategy</Label>
                <Select value={config.strategy} onValueChange={(value: any) => setConfig({ ...config, strategy: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BOS_ENTRY">BOS Entry</SelectItem>
                    <SelectItem value="FVG_TOUCH">FVG Touch</SelectItem>
                    <SelectItem value="CHOCH_BREAK">CHOCH Break</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={config.startDate}
                  onChange={(e) => setConfig({ ...config, startDate: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={config.endDate}
                  onChange={(e) => setConfig({ ...config, endDate: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="riskReward">Risk Reward Ratio</Label>
                <Select value={config.riskReward.toString()} onValueChange={(value) => setConfig({ ...config, riskReward: parseInt(value) })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1:1</SelectItem>
                    <SelectItem value="2">1:2</SelectItem>
                    <SelectItem value="3">1:3</SelectItem>
                    <SelectItem value="4">1:4</SelectItem>
                    <SelectItem value="5">1:5</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="stopLossATR">Stop Loss ATR</Label>
                <Select value={config.stopLossATR.toString()} onValueChange={(value) => setConfig({ ...config, stopLossATR: parseInt(value) })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1x ATR</SelectItem>
                    <SelectItem value="2">2x ATR</SelectItem>
                    <SelectItem value="3">3x ATR</SelectItem>
                    <SelectItem value="4">4x ATR</SelectItem>
                    <SelectItem value="5">5x ATR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button 
              onClick={handleRunBacktest} 
              disabled={runBacktestMutation.isPending}
              className="w-full"
            >
              {runBacktestMutation.isPending ? 'Running Backtest...' : 'Run Backtest'}
            </Button>
          </TabsContent>

          <TabsContent value="results" className="space-y-4">
            {results && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard
                    title="Total Trades"
                    value={results.stats.totalTrades}
                    icon={Activity}
                    color="text-blue-600"
                  />
                  <StatCard
                    title="Win Rate"
                    value={`${results.stats.winRate}%`}
                    icon={TrendingUp}
                    color="text-green-600"
                  />
                  <StatCard
                    title="Avg P&L"
                    value={`₹${results.stats.avgProfitLoss.toFixed(2)}`}
                    icon={Target}
                    color={results.stats.avgProfitLoss > 0 ? "text-green-600" : "text-red-600"}
                  />
                  <StatCard
                    title="Max Drawdown"
                    value={`₹${results.stats.maxDrawdown.toFixed(2)}`}
                    icon={TrendingDown}
                    color="text-red-600"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Strategy Performance</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Best Strategy:</span>
                          <Badge variant="outline" className="bg-green-50">
                            {results.stats.bestStrategy}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Worst Strategy:</span>
                          <Badge variant="outline" className="bg-red-50">
                            {results.stats.worstStrategy}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Profit Factor:</span>
                          <span className="font-semibold">{results.stats.profitFactor.toFixed(2)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Strike Zone Accuracy</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Accuracy:</span>
                          <span className="font-semibold">{results.stats.strikeZoneAccuracy}%</span>
                        </div>
                        <Progress value={results.stats.strikeZoneAccuracy} className="h-2" />
                        <p className="text-sm text-muted-foreground">
                          Distance from BOS/FVG levels
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Recent Trades</CardTitle>
                    <CardDescription>Last 10 trades from backtest</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {results.trades.slice(0, 10).map((trade, index) => (
                        <div key={index} className="flex justify-between items-center p-2 border rounded">
                          <div>
                            <span className="font-medium">{trade.symbol}</span>
                            <span className="text-sm text-muted-foreground ml-2">
                              {trade.strategy}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={trade.result === 'WIN' ? 'default' : 'destructive'}>
                              {trade.result}
                            </Badge>
                            <span className={`font-medium ${trade.pnl > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              ₹{trade.pnl?.toFixed(2) || '0.00'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}