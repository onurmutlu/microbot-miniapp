import { useState, useEffect, useCallback, useMemo } from 'react';
import webSocketClient, {
  WebSocketMessage,
  WebSocketMessageType,
  WebSocketState
} from '../services/WebSocketClient';
import { getTestMode } from '../utils/testMode';

interface UseWebSocketOptions {
  autoConnect?: boolean;
  topics?: string[];
  onMessage?: (message: WebSocketMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
}

/**
 * WebSocket bağlantısını yönetmek için React hook
 * @param options WebSocket bağlantı seçenekleri
 * @returns WebSocket hook state ve metodları
 */
export function useWebSocket(options: UseWebSocketOptions = {}) {
  const {
    autoConnect = true,
    topics = [],
    onMessage,
    onConnect,
    onDisconnect,
    onError
  } = options;
  
  const [state, setState] = useState<WebSocketState>({
    isConnected: getTestMode() ? true : webSocketClient.isConnected,
    isConnecting: getTestMode() ? false : webSocketClient.isConnecting,
    lastMessage: null,
    reconnectAttempt: 0,
    error: null
  });
  
  // Durum değişikliklerini izle
  useEffect(() => {
    const unsubscribe = webSocketClient.onStateChange((newState) => {
      setState(newState);
      
      // Duruma göre callback'leri çağır
      if (newState.isConnected && !state.isConnected) {
        onConnect?.();
      }
      
      if (!newState.isConnected && state.isConnected) {
        onDisconnect?.();
      }
      
      if (newState.error && !state.error) {
        onError?.(newState.error);
      }
    });
    
    // Component unmount olduğunda durum izlemeyi durdur
    return () => {
      unsubscribe();
    };
  }, [state.isConnected, state.error, onConnect, onDisconnect, onError]);
  
  // Mesajları dinle
  useEffect(() => {
    if (!onMessage) return;
    
    const listeners: (() => void)[] = [];
    
    if (topics.length === 0) {
      // Genel mesaj dinleyicisi
      const unsubscribeGeneral = webSocketClient.onStateChange((newState) => {
        if (newState.lastMessage && newState.lastMessage !== state.lastMessage) {
          onMessage(newState.lastMessage);
        }
      });
      
      listeners.push(unsubscribeGeneral);
    } else {
      // Belirli konuları dinle
      topics.forEach(topic => {
        const unsubscribeTopic = webSocketClient.subscribe(topic, (data) => {
          const message: WebSocketMessage = {
            type: WebSocketMessageType.MESSAGE,
            data,
            topic
          };
          onMessage(message);
        });
        
        listeners.push(unsubscribeTopic);
      });
    }
    
    // Component unmount olduğunda tüm dinleyicileri kaldır
    return () => {
      listeners.forEach(unsubscribe => unsubscribe());
    };
  }, [topics, onMessage, state.lastMessage]);
  
  // Otomatik bağlantı
  useEffect(() => {
    if (autoConnect && !getTestMode()) {
      webSocketClient.connect();
    }
    
    // Component unmount olduğunda bağlantıyı kapatma
    return () => {
      // Bağlantıyı kapatma işlemi opsiyonel olabilir,
      // çünkü aynı websocket örneği başka bileşenler tarafından kullanılabilir
    };
  }, [autoConnect]);
  
  // WebSocket mesajı gönderme metodu
  const send = useCallback(<T = any>(type: WebSocketMessageType, data?: T, topic?: string): boolean => {
    return webSocketClient.send(type, data, topic);
  }, []);
  
  // Belirli bir konuya mesaj gönderme metodu
  const sendToTopic = useCallback(<T = any>(topic: string, data: T): boolean => {
    return webSocketClient.sendToTopic(topic, data);
  }, []);
  
  // Yayın mesajı gönderme metodu
  const broadcast = useCallback(<T = any>(data: T): boolean => {
    return webSocketClient.broadcast(data);
  }, []);
  
  // Konuya abone olma metodu
  const subscribe = useCallback(<T = any>(topic: string, callback: (data: T) => void): () => void => {
    return webSocketClient.subscribe(topic, callback);
  }, []);
  
  // Konudaki tüm abonelikleri iptal etme metodu
  const unsubscribe = useCallback((topic?: string): void => {
    webSocketClient.unsubscribeAll(topic);
  }, []);
  
  // Bağlantıyı aç/kapat metodları
  const connect = useCallback((): void => {
    webSocketClient.connect();
  }, []);
  
  const disconnect = useCallback((force = false): void => {
    webSocketClient.disconnect(force);
  }, []);
  
  const reconnect = useCallback((): void => {
    webSocketClient.reconnect();
  }, []);
  
  // Dışa aktarılan değer
  const value = useMemo(() => ({
    ...state,
    send,
    sendToTopic,
    broadcast,
    subscribe,
    unsubscribe,
    connect,
    disconnect,
    reconnect
  }), [
    state,
    send,
    sendToTopic,
    broadcast,
    subscribe,
    unsubscribe,
    connect,
    disconnect,
    reconnect
  ]);
  
  return value;
}

export default useWebSocket; 