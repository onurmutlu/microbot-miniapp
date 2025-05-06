// Telegram tipi tanımlaması
declare global {
  interface Window {
    Telegram?: {
      WebApp?: any;
    };
  }
}

export const isMiniApp = (): boolean => {
  return window.Telegram && window.Telegram.WebApp ? true : false;
};

export const checkEnv = (): boolean => {
  // API URL kontrolü
  const apiUrl = import.meta.env.VITE_API_URL;
  if (!apiUrl) {
    console.error('VITE_API_URL environment variable is not defined');
    return false;
  }
  
  // WebSocket URL kontrolü
  const wsUrl = import.meta.env.VITE_WS_URL;
  if (!wsUrl) {
    console.warn('VITE_WS_URL environment variable is not defined');
  }
  
  return true;
};

export const getEnv = (key: string): string => {
  const value = import.meta.env[key];
  if (!value) {
    throw new Error(`Environment değişkeni bulunamadı: ${key}`);
  }
  return value;
}; 