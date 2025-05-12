import { useState, useEffect, useRef, useCallback } from 'react';
import WebSocketClient, { WebSocketMessageType } from '../services/WebSocketClient';
import { useUser } from './useUser';
import { getTestMode } from '../utils/testMode';

type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error';

interface UseWebSocketResult {
  isConnected: boolean;
  isConnecting: boolean;
  connectionState: ConnectionState;
  error: Error | null;
  lastMessage: any;
  reconnect: () => void;
  connect: () => void;
  disconnect: () => void;
  send: (type: WebSocketMessageType | string, data?: any, topic?: string) => boolean;
  subscribe: (topic: string, callback: (data: any) => void) => () => void;
  connectionStats: {
    reconnectAttempts: number;
    lastReconnectTime: number | null;
    uptime: number | null;
    latency: number | null;
  };
  retryConnection: (forceImmediate?: boolean) => void;
  clearError: () => void;
}

/**
 * WebSocket bağlantısını yönetmek için hook
 */
export const useWebSocketConnection = (): UseWebSocketResult => {
  const [isConnected, setIsConnected] = useState<boolean>(getTestMode() ? true : WebSocketClient.isConnected);
  const [isConnecting, setIsConnecting] = useState<boolean>(getTestMode() ? false : WebSocketClient.isConnecting);
  const [connectionState, setConnectionState] = useState<ConnectionState>(getTestMode() ? 'connected' : 'disconnected');
  const [error, setError] = useState<Error | null>(null);
  const [lastMessage, setLastMessage] = useState<any>(null);
  const [connectionAttempts, setConnectionAttempts] = useState<number>(0);
  const [lastReconnectTime, setLastReconnectTime] = useState<number | null>(null);
  const [connectionStartTime, setConnectionStartTime] = useState<number | null>(null);
  const [latency, setLatency] = useState<number | null>(null);
  
  const maxRetries = useRef<number>(5);
  const retryTimeout = useRef<NodeJS.Timeout | null>(null);
  const backoffFactor = useRef<number>(1.5);
  const isComponentMounted = useRef<boolean>(true);
  
  const { user } = useUser();
  
  // WebSocket durum değişikliklerini dinle
  useEffect(() => {
    if (getTestMode()) return; // Test modunda dinleyicileri atla
    
    const handleStateChange = (state: any) => {
      if (!isComponentMounted.current) return;
      
      setIsConnected(state.isConnected);
      setIsConnecting(state.isConnecting);
      
      // Bağlantı durumunu güncelle
      if (state.isConnected) {
        setConnectionState('connected');
        setConnectionStartTime(Date.now());
        setConnectionAttempts(0);
        setError(null);
      } else if (state.isConnecting) {
        setConnectionState('connecting');
      } else if (state.error) {
        setConnectionState('error');
        setError(state.error);
      } else {
        setConnectionState('disconnected');
      }
      
      // Bağlantı tekrar denemesi zamanını kaydet
      if (state.lastReconnectTime) {
        setLastReconnectTime(state.lastReconnectTime);
      }
      
      // Son latency bilgisini kaydet
      if (state.connectionStats?.lastLatency) {
        setLatency(state.connectionStats.lastLatency);
      }
      
      // Son mesajı güncelle
      if (state.lastMessage) {
        setLastMessage(state.lastMessage);
      }
    };
    
    // WebSocket durum değişiklik aboneliği
    const unsubscribe = WebSocketClient.onStateChange(handleStateChange);
    
    // İlk durumu al
    handleStateChange(WebSocketClient.state);
    
    return () => {
      unsubscribe();
    };
  }, []);
  
  // Bağlantıyı yeniden dene - akıllı backoff ile
  const retryConnection = useCallback((forceImmediate = false) => {
    if (getTestMode()) return;
    
    // Zaten bağlı ise işlem yapma
    if (isConnected) return;
    
    // Tekrar deneme sayısını artır
    const newAttempts = connectionAttempts + 1;
    setConnectionAttempts(newAttempts);
    
    // Mevcut zamanlayıcıyı temizle
    if (retryTimeout.current) {
      clearTimeout(retryTimeout.current);
      retryTimeout.current = null;
    }
    
    // Maksimum deneme sayısını kontrol et
    if (newAttempts > maxRetries.current) {
      setError(new Error(`Maksimum bağlantı deneme sayısına ulaşıldı (${maxRetries.current})`));
      setConnectionState('error');
      return;
    }
    
    // Hemen bağlanma isteği varsa, beklemeden bağlan
    if (forceImmediate) {
      WebSocketClient.connect();
      setConnectionState('connecting');
      return;
    }
    
    // Üstel backoff ile bekleme süresi hesapla (1s, 2s, 4s, 8s, ...)
    const delay = Math.min(1000 * Math.pow(backoffFactor.current, newAttempts - 1), 30000);
    
    console.log(`WebSocket bağlantısı ${delay}ms sonra tekrar denenecek (${newAttempts}/${maxRetries.current})`);
    setConnectionState('reconnecting');
    
    // Yeni zamanlayıcı oluştur
    retryTimeout.current = setTimeout(() => {
      if (!isComponentMounted.current) return;
      
      WebSocketClient.connect();
    }, delay);
  }, [isConnected, connectionAttempts]);
  
  // Kullanıcı değiştiğinde bağlantıyı yeniden kur
  useEffect(() => {
    if (getTestMode()) return;
    
    // Kullanıcı yoksa ve bağlantı varsa kapat
    if (!user && isConnected) {
      WebSocketClient.disconnect();
    }
    
    // Kullanıcı varsa ve bağlantı yoksa bağlan
    if (user && !isConnected && !isConnecting) {
      WebSocketClient.connect();
    }
  }, [user, isConnected, isConnecting]);
  
  // Hata durumunu temizle
  const clearError = useCallback(() => {
    setError(null);
    
    // Hata sonrasında otomatik tekrar bağlan
    if (connectionState === 'error') {
      setConnectionAttempts(0);
      WebSocketClient.connect();
    }
  }, [connectionState]);
  
  // Komponent temizlendiğinde bağlantı denemelerini durdur
  useEffect(() => {
    return () => {
      isComponentMounted.current = false;
      
      if (retryTimeout.current) {
        clearTimeout(retryTimeout.current);
      }
    };
  }, []);
  
  // WebSocket istemcisini bağla ve bağlantıyı kapat
  const connect = useCallback(() => {
    if (getTestMode()) return;
    
    setConnectionAttempts(0);
    WebSocketClient.connect();
  }, []);
  
  const disconnect = useCallback(() => {
    if (getTestMode()) return;
    
    if (retryTimeout.current) {
      clearTimeout(retryTimeout.current);
      retryTimeout.current = null;
    }
    
    WebSocketClient.disconnect(true);
  }, []);
  
  // Bağlantıyı yeniden kur
  const reconnect = useCallback(() => {
    if (getTestMode()) return;
    
    setConnectionAttempts(0);
    WebSocketClient.reconnect();
  }, []);
  
  // Mesaj gönder
  const send = useCallback((type: WebSocketMessageType | string, data?: any, topic?: string) => {
    // String tip varsa, enum değerine dönüştür
    let messageType: WebSocketMessageType;
    if (typeof type === 'string') {
      // String tipini enum tipine dönüştür
      switch (type) {
        case 'message':
          messageType = WebSocketMessageType.MESSAGE;
          break;
        case 'broadcast':
          messageType = WebSocketMessageType.BROADCAST;
          break;
        case 'ping':
          messageType = WebSocketMessageType.PING;
          break;
        case 'pong':
          messageType = WebSocketMessageType.PONG;
          break;
        case 'connection':
          messageType = WebSocketMessageType.CONNECTION;
          break;
        case 'subscription':
          messageType = WebSocketMessageType.SUBSCRIPTION;
          break;
        case 'error':
          messageType = WebSocketMessageType.ERROR;
          break;
        case 'reconnect':
          messageType = WebSocketMessageType.RECONNECT;
          break;
        case 'status':
          messageType = WebSocketMessageType.STATUS;
          break;
        default:
          messageType = WebSocketMessageType.MESSAGE;
      }
    } else {
      messageType = type;
    }
    
    return WebSocketClient.send(messageType, data, topic);
  }, []);
  
  // Konuya abone ol
  const subscribe = useCallback((topic: string, callback: (data: any) => void) => {
    return WebSocketClient.subscribe(topic, callback);
  }, []);
  
  // Çalışma süresi hesapla
  const calculateUptime = (): number | null => {
    if (!connectionStartTime) return null;
    return Date.now() - connectionStartTime;
  };
  
  // Sonuç döndür
  return {
    isConnected,
    isConnecting,
    connectionState,
    error,
    lastMessage,
    reconnect,
    connect,
    disconnect,
    send,
    subscribe,
    connectionStats: {
      reconnectAttempts: connectionAttempts,
      lastReconnectTime,
      uptime: calculateUptime(),
      latency
    },
    retryConnection,
    clearError
  };
}; 