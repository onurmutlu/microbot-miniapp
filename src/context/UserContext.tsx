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
  lastActivity: Date | null;
  updateLastActivity: () => void;
}

export const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [lastActivity, setLastActivity] = useState<Date | null>(null);

  // Kullanıcı verilerini localStorage'dan yükle
  useEffect(() => {
    const savedUser = localStorage.getItem('telegram_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
        setLastActivity(new Date());
      } catch (e) {
        localStorage.removeItem('telegram_user');
      }
    }
  }, []);

  // Kullanıcı verisini ayarla ve kaydet
  const handleSetUser = (newUser: TelegramUser | null) => {
    setUser(newUser);
    if (newUser) {
      localStorage.setItem('telegram_user', JSON.stringify(newUser));
      setLastActivity(new Date());
    } else {
      localStorage.removeItem('telegram_user');
      setLastActivity(null);
    }
  };

  // Kullanıcı oturumunu kapat
  const clearUser = () => {
    setUser(null);
    setLastActivity(null);
    localStorage.removeItem('telegram_user');
    localStorage.removeItem('access_token');
    localStorage.removeItem('auth_state');
    
    // Kullanıcıya özel verileri temizle
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('user_settings_')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
  };
  
  // Etkinlik zamanını güncelle
  const updateLastActivity = () => {
    setLastActivity(new Date());
  };

  // Kullanıcı etkinliğini takip et
  useEffect(() => {
    if (!user) return;
    
    const trackActivity = () => updateLastActivity();
    
    // Kullanıcı etkinliklerini dinle
    window.addEventListener('click', trackActivity);
    window.addEventListener('keypress', trackActivity);
    window.addEventListener('scroll', trackActivity);
    window.addEventListener('mousemove', trackActivity);
    
    return () => {
      window.removeEventListener('click', trackActivity);
      window.removeEventListener('keypress', trackActivity);
      window.removeEventListener('scroll', trackActivity);
      window.removeEventListener('mousemove', trackActivity);
    };
  }, [user]);

  const value = {
    user,
    setUser: handleSetUser,
    clearUser,
    isAuthenticated: !!user,
    lastActivity,
    updateLastActivity
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}; 