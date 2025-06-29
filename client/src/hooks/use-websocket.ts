import { useEffect, useRef, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { Notification, NotificationSettings } from '@shared/schema';

interface WebSocketHook {
  isConnected: boolean;
  notifications: Notification[];
  unreadCount: number;
  updateSettings: (settings: Partial<NotificationSettings>) => void;
  markAsRead: (notificationId: string) => void;
}

export function useWebSocket(): WebSocketHook {
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const connectWebSocket = () => {
      try {
        wsRef.current = new WebSocket(wsUrl);
        
        wsRef.current.onopen = () => {
          setIsConnected(true);
          console.log('WebSocket connected');
        };
        
        wsRef.current.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            if (data.type === 'notification') {
              const notification = data.data as Notification;
              
              setNotifications(prev => [notification, ...prev.slice(0, 19)]);
              setUnreadCount(prev => prev + 1);
              
              // Show toast notification
              toast({
                title: notification.stockSymbol,
                description: notification.message,
                variant: notification.priority === 'HIGH' ? 'destructive' : 'default',
              });
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };
        
        wsRef.current.onclose = () => {
          setIsConnected(false);
          console.log('WebSocket disconnected');
          
          // Attempt to reconnect after 3 seconds
          setTimeout(connectWebSocket, 3000);
        };
        
        wsRef.current.onerror = (error) => {
          console.error('WebSocket error:', error);
        };
      } catch (error) {
        console.error('Failed to create WebSocket connection:', error);
        setTimeout(connectWebSocket, 3000);
      }
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [toast]);

  const updateSettings = (settings: Partial<NotificationSettings>) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'updateSettings',
        settings
      }));
    }
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
    
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'markAsRead',
        notificationId
      }));
    }
  };

  return {
    isConnected,
    notifications,
    unreadCount,
    updateSettings,
    markAsRead
  };
}