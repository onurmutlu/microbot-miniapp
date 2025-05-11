// Telegram tipi tanımlaması
declare global {
  interface Window {
    Telegram?: {
      WebApp?: any;
    };
  }
}

/**
 * Ortam değişkenlerini yönetmek için yardımcı fonksiyonlar
 */

/**
 * Telegram MiniApp olarak mı çalıştığını kontrol eder
 */
export const isMiniApp = (): boolean => {
  return window.location.pathname.includes('/miniapp') || 
         !!window.Telegram?.WebApp;
};

/**
 * API URL'ini döndürür, .env dosyasından veya varsayılan değerden
 */
export const getApiUrl = (): string => {
  // Test modunda API URL'i için varsayılan değer
  const defaultApiUrl = '/api';
  
  // .env'den VITE_API_URL değerini al
  const apiUrl = import.meta.env.VITE_API_URL || defaultApiUrl;
  
  // MiniApp ise ve /api ile başlıyorsa, yerel test sunucusu kullanılıyor demektir
  if (isMiniApp() && apiUrl === defaultApiUrl) {
    console.warn('MiniApp modunda çalışırken VITE_API_URL tanımlanmamış. Backend ile iletişim kurulamayabilir.');
  }
  
  return apiUrl;
};

/**
 * WebSocket URL'ini döndürür
 */
export const getWebSocketUrl = (): string => {
  // Test modunda WebSocket URL'i için varsayılan değer
  const defaultWsUrl = 'ws://localhost:8000/ws';
  
  // .env'den VITE_WS_URL değerini al
  return import.meta.env.VITE_WS_URL || defaultWsUrl;
};

/**
 * SSE URL'ini döndürür
 */
export const getSSEUrl = (): string => {
  // Test modunda SSE URL'i için varsayılan değer
  const defaultSseUrl = 'http://localhost:8000/sse';
  
  // .env'den VITE_SSE_URL değerini al
  return import.meta.env.VITE_SSE_URL || defaultSseUrl;
};

/**
 * Çevresel değişkenleri kontrol eder ve gerekirse uyarılar gösterir
 */
export const checkEnv = (): void => {
  // API URL kontrolü
  if (!import.meta.env.VITE_API_URL && !import.meta.env.DEV) {
    console.warn('VITE_API_URL çevresel değişkeni tanımlanmamış. Varsayılan olarak /api kullanılacak.');
  }
  
  // WebSocket URL kontrolü
  if (!import.meta.env.VITE_WS_URL && !import.meta.env.DEV) {
    console.warn('VITE_WS_URL çevresel değişkeni tanımlanmamış. WebSocket bağlantıları çalışmayabilir.');
  }
  
  // SSE URL kontrolü
  if (!import.meta.env.VITE_SSE_URL && !import.meta.env.DEV) {
    console.warn('VITE_SSE_URL çevresel değişkeni tanımlanmamış. SSE bağlantıları çalışmayabilir.');
  }
  
  // Telegram Mini App Token kontrolü
  if (isMiniApp() && !import.meta.env.VITE_TELEGRAM_BOT_TOKEN) {
    console.warn('VITE_TELEGRAM_BOT_TOKEN çevresel değişkeni tanımlanmamış. Telegram Mini App özellikleri çalışmayabilir.');
  }
};

export const getEnv = (key: string): string => {
  const value = import.meta.env[key];
  if (!value) {
    throw new Error(`Environment değişkeni bulunamadı: ${key}`);
  }
  return value;
}; 