import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date?: number;
  hash?: string;
}

interface UserContextType {
  user: TelegramUser | null;
  setUser: (user: TelegramUser | null) => void;
  clearUser: () => void;
  isAuthenticated: boolean;
}

export const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [user, setUser] = useState<TelegramUser | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('telegram_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('telegram_user');
      }
    }
  }, []);

  const clearUser = () => {
    setUser(null);
    localStorage.removeItem('telegram_user');
    localStorage.removeItem('access_token');
  };

  const value = {
    user,
    setUser,
    clearUser,
    isAuthenticated: !!user
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}; 