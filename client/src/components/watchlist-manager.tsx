import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Plus, Edit, Trash2, List, Settings, Clock, TrendingUp, TrendingDown } from "lucide-react";
import { type Watchlist, type Stock } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

interface WatchlistManagerProps {
  isOpen: boolean;
  onClose: () => void;
  userId: number;
}

interface CreateWatchlistData {
  userId: number;
  name: string;
  description: string;
  filters: string;
  scanInterval: number;
  isActive: boolean;
}

export default function WatchlistManager({ isOpen, onClose, userId }: WatchlistManagerProps) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('list');
  const [editingWatchlist, setEditingWatchlist] = useState<Watchlist | null>(null);
  const [newWatchlist, setNewWatchlist] = useState<CreateWatchlistData>({
    userId,
    name: '',
    description: '',
    filters: '{}',
    scanInterval: 60,
    isActive: true,
  });

  const { data: watchlists, isLoading } = useQuery<Watchlist[]>({
    queryKey: ['/api/watchlists', { userId }],
    enabled: isOpen,
  });

  const createWatchlistMutation = useMutation({
    mutationFn: (data: CreateWatchlistData) => apiRequest('/api/watchlists', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/watchlists'] });
      setNewWatchlist({
        userId,
        name: '',
        description: '',
        filters: '{}',
        scanInterval: 60,
        isActive: true,
      });
      setActiveTab('list');
    },
  });

  const handleCreateWatchlist = () => {
    createWatchlistMutation.mutate(newWatchlist);
  };

  const WatchlistCard = ({ watchlist }: { watchlist: Watchlist }) => {
    const { data: stocks } = useQuery<Stock[]>({
      queryKey: ['/api/watchlists', watchlist.id, 'stocks'],
      enabled: isOpen,
    });

    return (
      <Card className="mb-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <List className="h-4 w-4" />
                {watchlist.name}
                {watchlist.isActive && (
                  <Badge variant="outline" className="bg-green-50">
                    Active
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>{watchlist.description}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline">
                <Edit className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="outline">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>Scan: {watchlist.scanInterval}s</span>
              </div>
              <div className="flex items-center gap-1">
                <List className="h-4 w-4" />
                <span>Stocks: {stocks?.length || 0}</span>
              </div>
            </div>
          </div>
          
          {stocks && stocks.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {stocks.slice(0, 6).map((stock) => (
                <div key={stock.id} className="flex items-center justify-between p-2 bg-muted rounded">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{stock.symbol}</span>
                    {stock.trend === 'BULLISH' ? (
                      <TrendingUp className="h-3 w-3 text-green-600" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-600" />
                    )}
                  </div>
                  <Badge variant={stock.signalType === 'UPPER' ? 'default' : 'destructive'} className="text-xs">
                    {stock.signalType}
                  </Badge>
                </div>
              ))}
              {stocks.length > 6 && (
                <div className="text-sm text-muted-foreground col-span-2 text-center">
                  +{stocks.length - 6} more stocks
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <List className="h-5 w-5" />
            Watchlist Manager
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="list">My Watchlists</TabsTrigger>
            <TabsTrigger value="create">Create New</TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Your Watchlists</h3>
              <Button 
                size="sm" 
                onClick={() => setActiveTab('create')}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Create New
              </Button>
            </div>

            {isLoading ? (
              <div className="text-center py-8">
                <div className="text-muted-foreground">Loading watchlists...</div>
              </div>
            ) : watchlists && watchlists.length > 0 ? (
              <div className="space-y-4">
                {watchlists.map((watchlist) => (
                  <WatchlistCard key={watchlist.id} watchlist={watchlist} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-muted-foreground">No watchlists created yet.</div>
                <Button 
                  className="mt-4" 
                  onClick={() => setActiveTab('create')}
                >
                  Create Your First Watchlist
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="create" className="space-y-4">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Watchlist Name</Label>
                  <Input
                    id="name"
                    value={newWatchlist.name}
                    onChange={(e) => setNewWatchlist({ ...newWatchlist, name: e.target.value })}
                    placeholder="e.g., Midcap FVG Watch"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="scanInterval">Scan Interval (seconds)</Label>
                  <Input
                    id="scanInterval"
                    type="number"
                    value={newWatchlist.scanInterval}
                    onChange={(e) => setNewWatchlist({ ...newWatchlist, scanInterval: parseInt(e.target.value) })}
                    min="30"
                    max="300"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={newWatchlist.description}
                  onChange={(e) => setNewWatchlist({ ...newWatchlist, description: e.target.value })}
                  placeholder="Describe the purpose of this watchlist..."
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={newWatchlist.isActive}
                  onCheckedChange={(checked) => setNewWatchlist({ ...newWatchlist, isActive: checked })}
                />
                <Label htmlFor="isActive">Active scanning</Label>
              </div>

              <Separator />

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Filter Settings
                  </CardTitle>
                  <CardDescription>
                    Configure custom filters for this watchlist
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    <strong>Available Filters:</strong>
                    <ul className="mt-2 space-y-1 ml-4">
                      <li>• Timeframe matching (2+ timeframes)</li>
                      <li>• Distance threshold (0.2% - 1.0%)</li>
                      <li>• Trend direction (BULLISH/BEARISH)</li>
                      <li>• Signal type (UPPER/LOWER)</li>
                      <li>• Minimum signal strength</li>
                      <li>• Include/exclude FVG signals</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <div className="flex items-center gap-3">
                <Button 
                  onClick={handleCreateWatchlist}
                  disabled={createWatchlistMutation.isPending || !newWatchlist.name.trim()}
                  className="flex-1"
                >
                  {createWatchlistMutation.isPending ? 'Creating...' : 'Create Watchlist'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setActiveTab('list')}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}