import { useState, useEffect, useCallback, useMemo } from 'react';
import sseClient, {
  SSEMessage,
  SSEMessageType,
  SSEState
} from '../services/SSEClient';
import { getTestMode } from '../utils/testMode';

interface UseSSEOptions {
  autoConnect?: boolean;
  topics?: string[];
  onMessage?: (message: SSEMessage) => void;
  onConnect?: (clientId: string) => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
}

/**
 * SSE (Server-Sent Events) bağlantısını yönetmek için React hook
 * @param options SSE bağlantı seçenekleri
 * @returns SSE hook state ve metodları
 */
export function useSSE(options: UseSSEOptions = {}) {
  const {
    autoConnect = true,
    topics = [],
    onMessage,
    onConnect,
    onDisconnect,
    onError
  } = options;
  
  const [state, setState] = useState<SSEState>({
    isConnected: getTestMode() ? true : sseClient.isConnected,
    isConnecting: getTestMode() ? false : sseClient.isConnecting,
    lastMessage: null,
    clientId: sseClient.state.clientId,
    reconnectAttempt: 0,
    error: null,
    activeTopics: []
  });
  
  // Durum değişikliklerini izle
  useEffect(() => {
    const unsubscribe = sseClient.onStateChange((newState) => {
      setState(newState);
      
      // Duruma göre callback'leri çağır
      if (newState.isConnected && !state.isConnected) {
        onConnect?.(newState.clientId);
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
      const unsubscribeGeneral = sseClient.onStateChange((newState) => {
        if (newState.lastMessage && newState.lastMessage !== state.lastMessage) {
          onMessage(newState.lastMessage);
        }
      });
      
      listeners.push(unsubscribeGeneral);
    } else {
      // Belirli konuları dinle
      topics.forEach(topic => {
        const unsubscribeTopic = sseClient.subscribe(topic, (data) => {
          const message: SSEMessage = {
            type: SSEMessageType.MESSAGE,
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
      sseClient.connect();
    }
    
    // Component unmount olduğunda bağlantıyı kapatma
    return () => {
      // Bağlantıyı kapatma işlemi opsiyonel olabilir,
      // çünkü aynı SSE örneği başka bileşenler tarafından kullanılabilir
    };
  }, [autoConnect]);
  
  // Konuya abone olma metodu
  const subscribe = useCallback(<T = any>(topic: string, callback: (data: T) => void): () => void => {
    return sseClient.subscribe(topic, callback);
  }, []);
  
  // Konuya mesaj yayınlama metodu
  const publishToTopic = useCallback(async <T = any>(topic: string, data: T): Promise<boolean> => {
    return await sseClient.publishToTopic(topic, data);
  }, []);
  
  // Yayın mesajı gönderme metodu
  const broadcast = useCallback(async <T = any>(data: T): Promise<boolean> => {
    return await sseClient.broadcast(data);
  }, []);
  
  // Konudaki tüm abonelikleri iptal etme metodu
  const unsubscribe = useCallback((topic?: string): void => {
    sseClient.unsubscribeAll(topic);
  }, []);
  
  // Bağlantıyı aç/kapat metodları
  const connect = useCallback((): void => {
    sseClient.connect();
  }, []);
  
  const disconnect = useCallback((force = false): void => {
    sseClient.disconnect(force);
  }, []);
  
  const reconnect = useCallback((): void => {
    sseClient.reconnect();
  }, []);
  
  // Dışa aktarılan değer
  const value = useMemo(() => ({
    ...state,
    subscribe,
    publishToTopic,
    broadcast,
    unsubscribe,
    connect,
    disconnect,
    reconnect
  }), [
    state,
    subscribe,
    publishToTopic,
    broadcast,
    unsubscribe,
    connect,
    disconnect,
    reconnect
  ]);
  
  return value;
}

export default useSSE; 