import { useState, useEffect } from 'react';
import { sseClient } from '../services/SSEClient';
import { toast } from 'react-toastify';

interface SSEIntegrationOptions {
  enableNotifications?: boolean;
  enableTelegramIntegration?: boolean;
  autoConnect?: boolean;
  channels?: string[];
  onMessage?: (data: any) => void;
  onStatusChange?: (status: 'open' | 'close' | 'error') => void;
}

/**
 * SSE entegrasyonu için React hook
 * @param options Hook seçenekleri
 * @returns SSE durum ve kontrolleri
 */
export function useSSEIntegration(options: SSEIntegrationOptions = {}) {
  const {
    enableNotifications = true,
    enableTelegramIntegration = true,
    autoConnect = true,
    channels = [],
    onMessage,
    onStatusChange
  } = options;

  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [subscribedChannels, setSubscribedChannels] = useState<string[]>([]);
  const [lastMessage, setLastMessage] = useState<any>(null);

  // Bağlantı durumunu kontrol et
  useEffect(() => {
    const handleOpenConnection = () => {
      setIsConnected(true);
      setError(null);
      
      if (enableNotifications) {
        toast.success('SSE bağlantısı kuruldu');
      }
      
      if (onStatusChange) {
        onStatusChange('open');
      }
    };
    
    const handleCloseConnection = () => {
      setIsConnected(false);
      
      if (enableNotifications) {
        toast.warning('SSE bağlantısı kapatıldı');
      }
      
      if (onStatusChange) {
        onStatusChange('close');
      }
    };
    
    const handleErrorConnection = (errorData: any) => {
      setIsConnected(false);
      setError(errorData?.message || 'Bağlantı hatası');
      
      if (enableNotifications) {
        toast.error(`SSE bağlantı hatası: ${errorData?.message || 'Bilinmeyen hata'}`);
      }
      
      if (onStatusChange) {
        onStatusChange('error');
      }
    };
    
    // Bağlantı durumu değişikliklerini dinle
    const unsubscribeOpen = sseClient.onConnectionState('open', handleOpenConnection);
    const unsubscribeClose = sseClient.onConnectionState('close', handleCloseConnection);
    const unsubscribeError = sseClient.onConnectionState('error', handleErrorConnection);
    
    // Otomatik bağlanma
    if (autoConnect) {
      connect();
    }
    
    // Temizleme
    return () => {
      unsubscribeOpen();
      unsubscribeClose();
      unsubscribeError();
    };
  }, [enableNotifications, autoConnect, onStatusChange]);
  
  // Kanalları abone ol
  useEffect(() => {
    const unsubscribers: (() => void)[] = [];
    const newSubscribedChannels: string[] = [];
    
    // Her kanal için abone ol
    channels.forEach(channel => {
      // Telegram kanal bildirimleri
      if (enableTelegramIntegration) {
        const unsubscribe = sseClient.onTelegramNotification(channel, (data) => {
          setLastMessage({
            type: 'telegram',
            channel,
            data,
            timestamp: new Date()
          });
          
          if (onMessage) {
            onMessage({
              type: 'telegram',
              channel,
              data,
              timestamp: new Date()
            });
          }
        });
        
        unsubscribers.push(unsubscribe);
        newSubscribedChannels.push(`telegram_${channel}`);
      }
      
      // Normal kanal aboneliği
      const unsubscribe = sseClient.onTopic(channel, (data) => {
        setLastMessage({
          type: 'topic',
          channel,
          data,
          timestamp: new Date()
        });
        
        if (onMessage) {
          onMessage({
            type: 'topic',
            channel,
            data,
            timestamp: new Date()
          });
        }
      });
      
      unsubscribers.push(unsubscribe);
      newSubscribedChannels.push(channel);
    });
    
    // Abone olunan kanalları güncelle
    setSubscribedChannels(newSubscribedChannels);
    
    // Temizleme
    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [channels, enableTelegramIntegration, onMessage]);
  
  // SSE bağlantısını başlat
  const connect = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await sseClient.connect();
      setIsLoading(false);
    } catch (err: any) {
      setIsLoading(false);
      setError(err.message || 'Bağlantı hatası');
      if (enableNotifications) {
        toast.error(`SSE bağlantı hatası: ${err.message || 'Bilinmeyen hata'}`);
      }
    }
  };
  
  // SSE bağlantısını kapat
  const disconnect = () => {
    sseClient.disconnect();
  };
  
  // Konu aboneliği ekle
  const subscribeTopic = async (topic: string) => {
    try {
      const success = await sseClient.subscribeTopic(topic);
      
      if (success) {
        setSubscribedChannels(prev => [...prev, topic]);
        
        // Konu mesajlarını dinlemeye başla
        const unsubscribe = sseClient.onTopic(topic, (data) => {
          setLastMessage({
            type: 'topic',
            channel: topic,
            data,
            timestamp: new Date()
          });
          
          if (onMessage) {
            onMessage({
              type: 'topic',
              channel: topic,
              data,
              timestamp: new Date()
            });
          }
        });
        
        if (enableNotifications) {
          toast.success(`${topic} konusuna abone olundu`);
        }
        
        return { success, unsubscribe };
      } else {
        if (enableNotifications) {
          toast.error(`${topic} konusuna abone olunamadı`);
        }
        return { success: false };
      }
    } catch (err: any) {
      if (enableNotifications) {
        toast.error(`Abonelik hatası: ${err.message || 'Bilinmeyen hata'}`);
      }
      return { success: false, error: err.message };
    }
  };
  
  // Telegram bildirimi gönder
  const sendTelegramNotification = async (channelId: string, data: any, options?: any) => {
    try {
      await sseClient.sendTelegramNotification(channelId, data, options);
      return { success: true };
    } catch (err: any) {
      if (enableNotifications) {
        toast.error(`Bildirim gönderme hatası: ${err.message || 'Bilinmeyen hata'}`);
      }
      return { success: false, error: err.message };
    }
  };
  
  // Konuya mesaj yayınla
  const publishToTopic = async (topic: string, data: any, options?: any) => {
    try {
      await sseClient.publishToTopic(topic, data, options);
      return { success: true };
    } catch (err: any) {
      if (enableNotifications) {
        toast.error(`Mesaj yayınlama hatası: ${err.message || 'Bilinmeyen hata'}`);
      }
      return { success: false, error: err.message };
    }
  };
  
  return {
    isConnected,
    isLoading,
    error,
    subscribedChannels,
    lastMessage,
    connect,
    disconnect,
    subscribeTopic,
    sendTelegramNotification,
    publishToTopic
  };
}

export default useSSEIntegration; 