import React, { createContext, useContext, useCallback, useEffect, useState } from 'react';
import { useWebSocket } from '../hooks/useWebSocket.ts';
import { showError, showInfo } from '../utils/toast';
import { isMiniApp } from '../utils/env';

interface WebSocketContextType {
  isConnected: boolean;
  sendMessage: (type: string, data: any) => void;
  subscribe: (type: string, handler: (message: any) => void) => () => void;
  lastError: Error | null;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lastError, setLastError] = useState<Error | null>(null);
  const [isOfflineMode, setIsOfflineMode] = useState<boolean>(false);
  
  // Offline mod kontrolü
  useEffect(() => {
    const checkOfflineMode = () => {
      const offlineMode = localStorage.getItem('offline_mode') === 'true';
      const isMiniAppSession = localStorage.getItem('is_miniapp_session') === 'true';
      setIsOfflineMode(offlineMode || (isMiniApp() && isMiniAppSession));
    };
    
    checkOfflineMode();
    window.addEventListener('storage', checkOfflineMode);
    
    return () => {
      window.removeEventListener('storage', checkOfflineMode);
    };
  }, []);

  const handleMessage = useCallback((message: any) => {
    // Mesaj işleme mantığı burada olacak
    console.log('WebSocket mesajı alındı:', message);
  }, []);

  const handleError = useCallback((error: Error) => {
    console.error('WebSocket hatası:', error);
    setLastError(error);
    
    // Offline modda veya MiniApp içinde çalışıyorsa toast bildirimleri gösterme
    if (!isOfflineMode && !isMiniApp()) {
      showError('WebSocket bağlantı hatası');
    }
  }, [isOfflineMode]);

  const { isConnected, sendMessage, subscribe } = useWebSocket({
    onError: handleError
  });

  const contextValue = {
    isConnected,
    sendMessage: (type: string, data: any) => sendMessage(type, data),
    subscribe,
    lastError
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