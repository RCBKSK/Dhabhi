import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import type { Notification, NotificationSettings, NotificationType } from '@shared/schema';

interface ClientConnection {
  ws: WebSocket;
  userId?: number;
  notifications: NotificationSettings;
}

class NotificationService {
  private wss: WebSocketServer | null = null;
  private clients = new Map<string, ClientConnection>();
  private notifications: Notification[] = [];

  init(server: Server) {
    this.wss = new WebSocketServer({ 
      server,
      path: '/ws'
    });
    
    this.wss.on('connection', (ws: WebSocket) => {
      const clientId = this.generateClientId();
      
      this.clients.set(clientId, {
        ws,
        notifications: {
          bosEntry: true,
          bosBreak: true,
          fvgMitigated: false,
          trendChange: true,
          priceAlerts: true,
          favoriteStocksOnly: false
        }
      });

      ws.on('message', (data: string) => {
        try {
          const message = JSON.parse(data);
          this.handleClientMessage(clientId, message);
        } catch (error) {
          console.error('WebSocket message parse error:', error);
        }
      });

      ws.on('close', () => {
        this.clients.delete(clientId);
      });

      // Send initial connection confirmation
      ws.send(JSON.stringify({
        type: 'connection',
        status: 'connected',
        clientId
      }));
    });
  }

  private generateClientId(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  private handleClientMessage(clientId: string, message: any) {
    const client = this.clients.get(clientId);
    if (!client) return;

    switch (message.type) {
      case 'updateSettings':
        client.notifications = { ...client.notifications, ...message.settings };
        break;
      case 'setUserId':
        client.userId = message.userId;
        break;
      case 'markAsRead':
        this.markNotificationAsRead(message.notificationId);
        break;
    }
  }

  createNotification(
    stockSymbol: string,
    type: NotificationType,
    message: string,
    priority: "LOW" | "MEDIUM" | "HIGH" = "MEDIUM"
  ): Notification {
    const notification: Notification = {
      id: this.generateClientId(),
      stockSymbol,
      type,
      message,
      timestamp: new Date(),
      read: false,
      priority
    };

    this.notifications.unshift(notification);
    
    // Keep only last 100 notifications
    if (this.notifications.length > 100) {
      this.notifications = this.notifications.slice(0, 100);
    }

    this.broadcastNotification(notification);
    return notification;
  }

  private broadcastNotification(notification: Notification) {
    this.clients.forEach((client) => {
      if (this.shouldSendToClient(client, notification)) {
        client.ws.send(JSON.stringify({
          type: 'notification',
          data: notification
        }));
      }
    });
  }

  private shouldSendToClient(client: ClientConnection, notification: Notification): boolean {
    const settings = client.notifications;
    
    // Check notification type settings
    switch (notification.type) {
      case 'BOS_ENTRY':
        return settings.bosEntry;
      case 'BOS_BREAK':
        return settings.bosBreak;
      case 'FVG_MITIGATED':
        return settings.fvgMitigated;
      case 'TREND_CHANGE':
        return settings.trendChange;
      case 'PRICE_ALERT':
        return settings.priceAlerts;
      default:
        return true;
    }
  }

  markNotificationAsRead(notificationId: string) {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
    }
  }

  getRecentNotifications(limit: number = 20): Notification[] {
    return this.notifications.slice(0, limit);
  }

  getUnreadCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  // Check for notification triggers based on stock data changes
  checkForAlerts(previousStock: any, currentStock: any, favoriteStocks: string[]) {
    if (!previousStock || !currentStock) return;

    const isFavorite = favoriteStocks.includes(currentStock.symbol);
    
    // BOS Entry notification
    if (previousStock.distance > 3 && currentStock.distance <= 2) {
      this.createNotification(
        currentStock.symbol,
        'BOS_ENTRY',
        `${currentStock.symbol} entering BOS/CHOCH zone at ₹${currentStock.price.toFixed(2)}`,
        'HIGH'
      );
    }

    // BOS Break notification
    if (previousStock.proximityZone !== 'NEUTRAL' && currentStock.proximityZone === 'NEUTRAL') {
      this.createNotification(
        currentStock.symbol,
        'BOS_BREAK',
        `${currentStock.symbol} broke BOS level - price at ₹${currentStock.price.toFixed(2)}`,
        'HIGH'
      );
    }

    // Trend change notification (simplified check)
    if (previousStock.trend !== currentStock.trend) {
      this.createNotification(
        currentStock.symbol,
        'TREND_CHANGE',
        `${currentStock.symbol} trend changed from ${previousStock.trend} to ${currentStock.trend}`,
        'MEDIUM'
      );
    }
  }
}

export const notificationService = new NotificationService();