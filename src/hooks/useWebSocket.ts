import { useState, useEffect, useCallback } from 'react';
import { websocketService, WebSocketStatus, WebSocketMessage } from '../services/websocket';
import { getTestMode } from '../utils/testMode';

export const useWebSocket = () => {
  const [status, setStatus] = useState<WebSocketStatus>(getTestMode() ? 'connected' : websocketService.getStatus());
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);

  useEffect(() => {
    // Test modunda ise hiçbir şey yapma
    if (getTestMode()) {
      return;
    }

    const unsubscribe = websocketService.onStatusChange((newStatus) => {
      setStatus(newStatus);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const sendMessage = useCallback((type: string, data?: any) => {
    if (getTestMode()) {
      console.log('Test modu: WebSocket mesajı gönderildi', { type, data });
      return;
    }
    websocketService.send({ type, data });
  }, []);

  const subscribe = useCallback((type: string, handler: (message: WebSocketMessage) => void) => {
    if (getTestMode()) {
      console.log('Test modu: WebSocket aboneliği eklendi', { type });
      return () => {};
    }
    
    websocketService.subscribe(type, (message) => {
      setLastMessage(message);
      handler(message);
    });
    
    return () => {
      // Unsubscribe fonksiyonu
      if (!getTestMode()) {
        websocketService.unsubscribe(type, handler);
      }
    };
  }, []);

  return {
    status,
    lastMessage,
    isConnected: getTestMode() ? true : status === 'connected',
    sendMessage,
    subscribe
  };
}; 