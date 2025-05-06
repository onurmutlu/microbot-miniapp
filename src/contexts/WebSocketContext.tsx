import React, { createContext, useContext, useCallback } from 'react';
import { useWebSocket } from '../hooks/useWebSocket.ts';
import { showError, showInfo } from '../utils/toast';

interface WebSocketContextType {
  isConnected: boolean;
  sendMessage: (type: string, data: any) => void;
  subscribe: (type: string, handler: (message: any) => void) => () => void;
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

  const { isConnected, sendMessage, subscribe } = useWebSocket();

  const contextValue = {
    isConnected,
    sendMessage: (type: string, data: any) => sendMessage(type, data),
    subscribe
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