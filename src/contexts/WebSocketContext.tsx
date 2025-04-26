import React, { createContext, useContext, useCallback } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import { showError, showInfo } from '../utils/toast';

interface WebSocketContextType {
  isConnected: boolean;
  error: Error | null;
  sendMessage: (type: string, data: any) => void;
  disconnect: () => void;
  reconnect: () => void;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const handleMessage = useCallback((message: any) => {
    // Mesaj işleme mantığı burada olacak
    console.log('WebSocket mesajı alındı:', message);
  }, []);

  const handleError = useCallback((error: Error) => {
    console.error('WebSocket hatası:', error);
    showError('WebSocket bağlantı hatası');
  }, []);

  const { isConnected, error, sendMessage, disconnect, reconnect } = useWebSocket({
    url: `${import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws'}`,
    onMessage: handleMessage,
    onError: handleError,
    reconnectInterval: 5000,
    maxReconnectAttempts: 5
  });

  const contextValue = {
    isConnected,
    error,
    sendMessage: (type: string, data: any) => sendMessage({ type, data }),
    disconnect,
    reconnect
  };

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocketContext = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocketContext must be used within a WebSocketProvider');
  }
  return context;
}; 