import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../utils/api';
import { showError } from '../utils/toast';

interface ActiveSession {
  id: string;
  phone: string;
  status: 'active' | 'inactive' | 'expired';
}

interface ActiveSessionContextType {
  activeSession: ActiveSession | null;
  isLoading: boolean;
  setActiveSession: (session: ActiveSession | null) => void;
  refreshActiveSession: () => Promise<void>;
}

const ActiveSessionContext = createContext<ActiveSessionContextType | undefined>(undefined);

export const ActiveSessionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshActiveSession = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/active-session');
      setActiveSession(response.data);
    } catch (error) {
      console.error('Aktif oturum bilgisi alınamadı:', error);
      setActiveSession(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshActiveSession();
  }, []);

  const value = {
    activeSession,
    isLoading,
    setActiveSession,
    refreshActiveSession
  };

  return (
    <ActiveSessionContext.Provider value={value}>
      {children}
    </ActiveSessionContext.Provider>
  );
};

export const useActiveSession = (): ActiveSessionContextType => {
  const context = useContext(ActiveSessionContext);
  if (context === undefined) {
    throw new Error('useActiveSession must be used within an ActiveSessionProvider');
  }
  return context;
};

export default useActiveSession; 