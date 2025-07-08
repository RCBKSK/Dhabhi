import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Download, FileText, Table, CheckCircle } from "lucide-react";
import { type Stock } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  stocks: Stock[];
}

interface ExportConfig {
  format: 'CSV' | 'EXCEL';
  includeFilters: boolean;
  autoDownload: boolean;
}

export default function ExportModal({ isOpen, onClose, stocks }: ExportModalProps) {
  const [config, setConfig] = useState<ExportConfig>({
    format: 'CSV',
    includeFilters: true,
    autoDownload: false,
  });

  const [exportStatus, setExportStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const exportMutation = useMutation({
    mutationFn: (config: ExportConfig) => apiRequest(`/api/export/signals`, {
      method: 'POST',
      body: JSON.stringify(config),
    }),
    onSuccess: (data) => {
      if (config.format === 'CSV') {
        // Download CSV file
        const blob = new Blob([data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `signals_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        // Handle Excel data
        console.log('Excel data:', data);
      }
      setExportStatus('success');
      setTimeout(() => setExportStatus('idle'), 3000);
    },
    onError: (error) => {
      console.error('Export failed:', error);
      setExportStatus('error');
      setTimeout(() => setExportStatus('idle'), 3000);
    }
  });

  const handleExport = () => {
    exportMutation.mutate(config);
  };

  const getStatusIcon = () => {
    switch (exportStatus) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <Download className="h-4 w-4 text-red-600" />;
      default:
        return <Download className="h-4 w-4" />;
    }
  };

  const getStatusMessage = () => {
    switch (exportStatus) {
      case 'success':
        return 'Export completed successfully!';
      case 'error':
        return 'Export failed. Please try again.';
      default:
        return '';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Signals Data
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Data Overview</CardTitle>
              <CardDescription>
                Current signals ready for export
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="space-y-2">
                  <div className="text-2xl font-bold">{stocks.length}</div>
                  <div className="text-sm text-muted-foreground">Total Signals</div>
                </div>
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-green-600">
                    {stocks.filter(s => s.signalType === 'UPPER').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Upper Signals</div>
                </div>
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-red-600">
                    {stocks.filter(s => s.signalType === 'LOWER').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Lower Signals</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="format">Export Format</Label>
              <Select 
                value={config.format} 
                onValueChange={(value: 'CSV' | 'EXCEL') => setConfig({ ...config, format: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CSV">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      CSV Format
                    </div>
                  </SelectItem>
                  <SelectItem value="EXCEL">
                    <div className="flex items-center gap-2">
                      <Table className="h-4 w-4" />
                      Excel Format
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeFilters"
                  checked={config.includeFilters}
                  onCheckedChange={(checked) => 
                    setConfig({ ...config, includeFilters: checked as boolean })
                  }
                />
                <Label htmlFor="includeFilters" className="text-sm">
                  Include current filter settings in export
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="autoDownload"
                  checked={config.autoDownload}
                  onCheckedChange={(checked) => 
                    setConfig({ ...config, autoDownload: checked as boolean })
                  }
                />
                <Label htmlFor="autoDownload" className="text-sm">
                  Enable auto-download for future scans
                </Label>
              </div>
            </div>
          </div>

          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground">
                <strong>Export includes:</strong>
                <ul className="mt-2 space-y-1 ml-4">
                  <li>• Symbol and current price</li>
                  <li>• Trend direction and signal type</li>
                  <li>• BOS distance and proximity percentage</li>
                  <li>• Signal strength and timeframes</li>
                  <li>• Last alert timestamp</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center gap-3">
            <Button 
              onClick={handleExport}
              disabled={exportMutation.isPending || stocks.length === 0}
              className="flex-1"
            >
              <div className="flex items-center gap-2">
                {getStatusIcon()}
                {exportMutation.isPending ? 'Exporting...' : 'Export Data'}
              </div>
            </Button>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>

          {getStatusMessage() && (
            <div className={`text-center text-sm ${
              exportStatus === 'success' ? 'text-green-600' : 'text-red-600'
            }`}>
              {getStatusMessage()}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}