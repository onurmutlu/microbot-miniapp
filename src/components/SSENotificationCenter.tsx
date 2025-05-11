import React, { useState, useEffect } from 'react';
import { sseClient } from '../services/SSEClient';
import { toast } from 'react-toastify';

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
        <div className="flex justify-between items-start">
          <div className="font-medium">{notification.title}</div>
          <div className="flex items-center">
            <span className="text-xs text-gray-500 mr-2">
              {new Date(notification.timestamp).toLocaleTimeString()}
            </span>
            <button 
              className="text-gray-400 hover:text-red-500"
              onClick={(e) => {
                e.stopPropagation(); // Tıklama olayının üst bileşene yayılmasını engelle
                removeNotification(notification.id);
              }}
            >
              ×
            </button>
          </div>
        </div>
        <div className="text-sm mt-1">{notification.message}</div>
        {notification.channelId && (
          <div className="text-xs text-gray-500 mt-1">
            Kanal: {notification.channelId}
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div className="relative">
      {/* Bildirim butonu */}
      <button 
        className="relative p-2 rounded-full bg-white border border-gray-200 hover:bg-gray-100"
        onClick={() => setIsOpen(!isOpen)}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
        </svg>
        {renderBadge()}
      </button>
      
      {/* Bildirim paneli */}
      {isOpen && (
        <div className="fixed right-0 mt-2 w-80 bg-white border border-gray-200 rounded-md shadow-lg z-[100]" style={{top: '60px', marginRight: '10px'}}>
          <div className="p-3 border-b border-gray-200 flex justify-between items-center">
            <div className="font-medium">Bildirimler</div>
            <div className="flex space-x-2">
              {showControls && (
                <>
                  <button 
                    className="text-xs text-blue-500 hover:text-blue-700"
                    onClick={markAllAsRead}
                  >
                    Hepsini Okundu İşaretle
                  </button>
                  <button 
                    className="text-xs text-red-500 hover:text-red-700"
                    onClick={clearNotifications}
                  >
                    Temizle
                  </button>
                </>
              )}
            </div>
          </div>
          
          <div className="p-3 max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="text-center text-gray-500 py-4">
                Henüz bildirim yok
              </div>
            ) : (
              notifications.map(renderNotification)
            )}
          </div>
          
          <div className="p-2 border-t border-gray-200 flex items-center justify-between">
            <div className="text-xs text-gray-500">
              {connectionState === 'connected' ? (
                <span className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                  Bağlı
                </span>
              ) : connectionState === 'error' ? (
                <span className="flex items-center">
                  <span className="w-2 h-2 bg-red-500 rounded-full mr-1"></span>
                  Bağlantı Hatası
                </span>
              ) : (
                <span className="flex items-center">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full mr-1"></span>
                  Bağlı Değil
                </span>
              )}
            </div>
            <div className="text-xs text-gray-500">
              {unreadCount === 0 ? 'Tüm bildirimler okundu' : `${unreadCount} okunmamış bildirim`}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SSENotificationCenter; 