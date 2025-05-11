import React, { useState, useEffect } from 'react';
import { sseClient } from '../services/SSEClient';
import { toast } from 'react-toastify';
import { BellIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'info' | 'success' | 'warning' | 'error';
  channelId?: string;
  data?: any;
  read: boolean;
}

interface SSENotificationCenterProps {
  channelIds?: string[];
  maxNotifications?: number;
  showControls?: boolean;
  showUnreadBadge?: boolean;
  onNotificationClick?: (notification: Notification) => void;
}

const SSENotificationCenter: React.FC<SSENotificationCenterProps> = ({
  channelIds = [],
  maxNotifications = 50,
  showControls = true,
  showUnreadBadge = true,
  onNotificationClick
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [connectionState, setConnectionState] = useState<string>('disconnected');
  const [unreadCount, setUnreadCount] = useState<number>(0);
  
  // SSE bağlantısını yönet
  useEffect(() => {
    // Bağlantı durumu değişikliklerini dinle
    const unsubscribeOpen = sseClient.onConnectionState('open', () => {
      setConnectionState('connected');
    });
    
    const unsubscribeClose = sseClient.onConnectionState('close', () => {
      setConnectionState('disconnected');
    });
    
    const unsubscribeError = sseClient.onConnectionState('error', () => {
      setConnectionState('error');
    });
    
    // Genel bildirimler konusunu dinle
    const unsubscribeNotifications = sseClient.onTopic('notifications', (data) => {
      addNotification({
        id: data.id || `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: data.title || 'Bildirim',
        message: data.message || data.text || '',
        timestamp: data.timestamp || new Date().toISOString(),
        type: data.type || 'info',
        data: data,
        read: false
      });
      
      // Toast bildirim göster
      if (data.showToast !== false) {
        showToast(data);
      }
    });
    
    // Kanal bildirimleri için abone ol
    const channelUnsubscribers: (() => void)[] = [];
    channelIds.forEach(channelId => {
      const unsubscribe = sseClient.onTelegramNotification(channelId, (data) => {
        addNotification({
          id: data.id || `channel_${channelId}_${Date.now()}`,
          title: data.title || `Kanal: ${channelId}`,
          message: data.message || data.text || '',
          timestamp: data.timestamp || new Date().toISOString(),
          type: data.type || 'info',
          channelId: channelId,
          data: data,
          read: false
        });
        
        // Toast bildirim göster
        if (data.showToast !== false) {
          showToast(data);
        }
      });
      
      channelUnsubscribers.push(unsubscribe);
    });
    
    // Temizleme fonksiyonu
    return () => {
      unsubscribeOpen();
      unsubscribeClose();
      unsubscribeError();
      unsubscribeNotifications();
      channelUnsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [channelIds]);
  
  // Okunmamış bildirimleri say
  useEffect(() => {
    const count = notifications.filter(notification => !notification.read).length;
    setUnreadCount(count);
  }, [notifications]);
  
  // Bildirimleri yerel depolamaya kaydet/yükle
  useEffect(() => {
    // Sayfaya yüklendiğinde mevcut bildirimleri yükle
    const savedNotifications = localStorage.getItem('sse_notifications');
    if (savedNotifications) {
      try {
        const parsedNotifications = JSON.parse(savedNotifications) as Notification[];
        setNotifications(parsedNotifications.slice(0, maxNotifications));
      } catch (error) {
        console.error('Bildirimler yüklenirken hata:', error);
      }
    }
    
    // Bildirimleri kaydet (sadece state değiştiğinde)
    return () => {
      if (notifications.length > 0) {
        localStorage.setItem('sse_notifications', JSON.stringify(notifications.slice(0, maxNotifications)));
      }
    };
  }, [maxNotifications]);
  
  // Toast bildirimi göster
  const showToast = (data: any) => {
    const toastType = data.type || 'info';
    const title = data.title || 'Bildirim';
    const message = data.message || data.text || '';
    
    switch (toastType) {
      case 'success':
        toast.success(`${title}: ${message}`);
        break;
      case 'warning':
        toast.warning(`${title}: ${message}`);
        break;
      case 'error':
        toast.error(`${title}: ${message}`);
        break;
      default:
        toast.info(`${title}: ${message}`);
    }
  };
  
  // Bildirim ekle
  const addNotification = (notification: Notification) => {
    setNotifications(prev => {
      // Aynı ID'li bildirimi kontrol et
      const exists = prev.some(n => n.id === notification.id);
      if (exists) {
        // ID varsa güncelle
        return prev.map(n => 
          n.id === notification.id 
            ? { ...notification, read: n.read } 
            : n
        );
      } else {
        // Yeni bildirim ekle
        return [notification, ...prev].slice(0, maxNotifications);
      }
    });
  };
  
  // Bildirimi işaretle
  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true } 
          : notification
      )
    );
  };
  
  // Tüm bildirimleri işaretle
  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  };
  
  // Bildirimleri temizle
  const clearNotifications = () => {
    setNotifications([]);
    localStorage.removeItem('sse_notifications');
  };
  
  // Bildirimi sil
  const removeNotification = (id: string) => {
    setNotifications(prev => 
      prev.filter(notification => notification.id !== id)
    );
  };
  
  // Bildirime tıklama
  const handleNotificationClick = (notification: Notification) => {
    // Bildirimi okundu olarak işaretle
    markAsRead(notification.id);
    
    // Custom handler varsa çağır
    if (onNotificationClick) {
      onNotificationClick(notification);
    }
  };
  
  // Bildirim badge'ını render et
  const renderBadge = () => {
    if (!showUnreadBadge || unreadCount === 0) return null;
    
    return (
      <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
        {unreadCount > 9 ? '9+' : unreadCount}
      </div>
    );
  };
  
  // Bildirimi render et
  const renderNotification = (notification: Notification) => {
    let bgColor = 'bg-white';
    let borderColor = notification.read ? 'border-gray-200' : 'border-blue-300';
    
    switch (notification.type) {
      case 'success':
        bgColor = notification.read ? 'bg-green-50' : 'bg-green-100';
        borderColor = 'border-green-300';
        break;
      case 'warning':
        bgColor = notification.read ? 'bg-yellow-50' : 'bg-yellow-100';
        borderColor = 'border-yellow-300';
        break;
      case 'error':
        bgColor = notification.read ? 'bg-red-50' : 'bg-red-100';
        borderColor = 'border-red-300';
        break;
      default:
        bgColor = notification.read ? 'bg-white' : 'bg-blue-50';
    }
    
    return (
      <div 
        key={notification.id} 
        className={`${bgColor} ${borderColor} border rounded-md p-3 mb-2 cursor-pointer hover:bg-opacity-80 transition-colors`}
        onClick={() => handleNotificationClick(notification)}
      >
        <div className="flex justify-between">
          <div className="font-medium text-sm">{notification.title}</div>
          <div className="text-xs text-gray-500">
            {new Date(notification.timestamp).toLocaleTimeString()}
          </div>
        </div>
        <div className="text-sm mt-1">{notification.message}</div>
        <div className="flex justify-between mt-2">
          {notification.channelId && (
            <div className="text-xs text-gray-500">
              Kanal: {notification.channelId}
            </div>
          )}
          <button 
            className="text-xs text-gray-500 hover:text-gray-700"
            onClick={(e) => {
              e.stopPropagation();
              removeNotification(notification.id);
            }}
          >
            Kaldır
          </button>
        </div>
      </div>
    );
  };
  
  return (
    <div>
      {/* Bildirim ikonu */}
      <button
        className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
        onClick={() => setIsOpen(!isOpen)}
      >
        <BellIcon className="w-5 h-5" />
        {renderBadge()}
      </button>

      {/* Bildirim paneli */}
      {isOpen && (
        <div className="notification-panel fixed right-2 top-14 sm:right-4 sm:top-16 sm:absolute sm:right-0 sm:top-full sm:mt-2 w-full max-w-sm bg-white dark:bg-gray-800 rounded-lg shadow-xl py-2 px-2 z-[var(--z-dropdown)] border border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center pb-2 border-b border-gray-200 dark:border-gray-700">
            <div className="font-medium text-gray-800 dark:text-white">
              Bildirimler 
              {unreadCount > 0 && <span className="ml-2 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 px-1.5 py-0.5 rounded-full">{unreadCount} yeni</span>}
            </div>
            {showControls && (
              <div className="flex space-x-2">
                <button 
                  className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  onClick={() => markAllAsRead()}
                >
                  Tümünü Okundu İşaretle
                </button>
                <button 
                  className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  onClick={() => clearNotifications()}
                >
                  Temizle
                </button>
                <button 
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  onClick={() => setIsOpen(false)}
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
          
          <div className="mt-2 max-h-60 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                Bildirim bulunmuyor
              </div>
            ) : (
              notifications.map(renderNotification)
            )}
          </div>
          
          {/* Bağlantı durumu */}
          <div className="border-t border-gray-200 dark:border-gray-700 mt-2 pt-2 text-xs text-gray-500 dark:text-gray-400 flex items-center">
            <div 
              className={`w-2 h-2 rounded-full mr-2 ${
                connectionState === 'connected' 
                  ? 'bg-green-500' 
                  : connectionState === 'error' 
                    ? 'bg-red-500' 
                    : 'bg-yellow-500'
              }`}
            ></div>
            {connectionState === 'connected' 
              ? 'SSE Bağlantısı aktif' 
              : connectionState === 'error' 
                ? 'SSE Bağlantı hatası' 
                : 'SSE Bağlantısı kuruluyor...'
            }
          </div>
        </div>
      )}
    </div>
  );
};

export default SSENotificationCenter; 