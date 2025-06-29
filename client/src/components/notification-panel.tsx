import { useState } from "react";
import { Bell, X, Check, AlertTriangle, Info, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useWebSocket } from "@/hooks/use-websocket";
import type { Notification } from "@shared/schema";

export default function NotificationPanel() {
  const { notifications, unreadCount, markAsRead, isConnected } = useWebSocket();
  const [showAll, setShowAll] = useState(false);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'BOS_ENTRY':
        return <TrendingUp className="h-4 w-4 text-blue-400" />;
      case 'BOS_BREAK':
        return <AlertTriangle className="h-4 w-4 text-red-400" />;
      case 'TREND_CHANGE':
        return <TrendingUp className="h-4 w-4 text-yellow-400" />;
      default:
        return <Info className="h-4 w-4 text-slate-400" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return 'border-l-red-500 bg-red-500/5';
      case 'MEDIUM':
        return 'border-l-yellow-500 bg-yellow-500/5';
      default:
        return 'border-l-blue-500 bg-blue-500/5';
    }
  };

  const formatTime = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const displayNotifications = showAll ? notifications : notifications.slice(0, 5);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5 text-slate-400" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white text-xs">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
          <div className={`absolute bottom-0 right-0 h-2 w-2 rounded-full ${
            isConnected ? 'bg-green-400' : 'bg-red-400'
          }`} />
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-96 p-0 bg-slate-800 border-slate-700" align="end">
        <Card className="border-0 shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Bell className="h-4 w-4" />
                <span>Live Alerts</span>
                <div className={`h-2 w-2 rounded-full ${
                  isConnected ? 'bg-green-400' : 'bg-red-400'
                }`} />
              </div>
              {unreadCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {unreadCount} new
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          
          <CardContent className="p-0">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-slate-400">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No notifications yet</p>
                <p className="text-xs">Alerts will appear here when triggered</p>
              </div>
            ) : (
              <ScrollArea className="h-96">
                <div className="space-y-1 p-2">
                  {displayNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 rounded-lg border-l-4 ${getPriorityColor(notification.priority)} ${
                        !notification.read ? 'bg-slate-700/50' : 'bg-slate-800/50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-2 flex-1">
                          {getNotificationIcon(notification.type)}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-white text-sm">
                                {notification.stockSymbol}
                              </span>
                              <span className="text-xs text-slate-400">
                                {formatTime(notification.timestamp)}
                              </span>
                              {!notification.read && (
                                <div className="h-2 w-2 bg-blue-400 rounded-full" />
                              )}
                            </div>
                            <p className="text-sm text-slate-300 mt-1">
                              {notification.message}
                            </p>
                          </div>
                        </div>
                        
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 hover:bg-slate-600"
                            onClick={() => markAsRead(notification.id)}
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
            
            {notifications.length > 5 && (
              <div className="p-3 border-t border-slate-700">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-blue-400 hover:text-blue-300"
                  onClick={() => setShowAll(!showAll)}
                >
                  {showAll ? 'Show Less' : `Show All (${notifications.length})`}
                </Button>
              </div>
            )}
            
            {notifications.length > 0 && (
              <div className="p-3 border-t border-slate-700 text-center">
                <p className="text-xs text-slate-500">
                  Live alerts for BOS/CHOCH entries, breaks, and trend changes
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
}