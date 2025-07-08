import { Stock, ExportData } from "../shared/schema";

export class ExportService {
  static generateExportData(stocks: Stock[]): ExportData[] {
    return stocks.map(stock => ({
      symbol: stock.symbol,
      price: stock.price,
      change: stock.change,
      trend: stock.trend,
      signalType: stock.signalType,
      distance: stock.distance,
      bosProximity: (stock.distance / stock.price) * 100,
      signalStrength: stock.timeframes.length,
      timeframes: stock.timeframes,
      lastAlertTime: stock.lastScanned?.toISOString() || new Date().toISOString(),
    }));
  }

  static generateCSV(exportData: ExportData[]): string {
    const headers = [
      'Symbol',
      'Price',
      'Change',
      'Trend',
      'Signal Type',
      'Distance',
      'BOS Proximity %',
      'Signal Strength',
      'Timeframes',
      'Last Alert Time',
    ];

    const csvRows = [headers.join(',')];
    
    for (const data of exportData) {
      const row = [
        data.symbol,
        data.price.toString(),
        data.change.toString(),
        data.trend,
        data.signalType,
        data.distance.toFixed(2),
        data.bosProximity.toFixed(2),
        data.signalStrength.toString(),
        `"${data.timeframes.join(', ')}"`,
        data.lastAlertTime,
      ];
      csvRows.push(row.join(','));
    }

    return csvRows.join('\n');
  }

  static generateExcelData(exportData: ExportData[]): any[] {
    return exportData.map(data => ({
      Symbol: data.symbol,
      Price: data.price,
      Change: data.change,
      Trend: data.trend,
      'Signal Type': data.signalType,
      Distance: data.distance,
      'BOS Proximity %': data.bosProximity,
      'Signal Strength': data.signalStrength,
      Timeframes: data.timeframes.join(', '),
      'Last Alert Time': data.lastAlertTime,
    }));
  }
}