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
export function isMiniApp(): boolean {
  // Telegram WebApp global nesnesi var mı?
  const webAppAvailable = typeof window !== 'undefined' && window.Telegram && !!window.Telegram.WebApp;
  
  // MiniApp içinde olduğumuzu anlamak için initData ve kullanıcı bilgisini kontrol et
  if (webAppAvailable) {
    // InitData var mı?
    const hasInitData = !!window.Telegram?.WebApp?.initData;
    
    // Kullanıcı bilgisi var mı?
    const hasUser = !!window.Telegram?.WebApp?.initDataUnsafe?.user;
    
    // Ek güvenlik kontrolü: initData format kontrolü
    const validInitData = hasInitData && 
      typeof window.Telegram?.WebApp?.initData === 'string' && 
      window.Telegram?.WebApp?.initData?.includes('auth_date');
    
    return validInitData && hasUser;
  }
  
  // Test modu/geliştirme ortamında olup olmadığını kontrol et
  if (import.meta.env.DEV || import.meta.env.VITE_TEST_MODE === 'true') {
    // Test modu ve miniapp_mode=true parametresi varsa
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('miniapp_mode') === 'true') {
      return true;
    }
    
    // localStorage'da bir test flag'i var mı?
    if (localStorage.getItem('is_miniapp_session') === 'true') {
      return true;
    }
  }
  
  return false;
}

/**
 * API URL'ini döndürür, .env dosyasından veya varsayılan değerden
 */
export function getApiUrl(): string {
  let apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  
  // URL'in protokol içerip içermediğini kontrol et
  if (!apiUrl.startsWith('http')) {
    // Eğer HTTPS sayfadaysak, HTTPS kullan
    const protocol = window.location.protocol === 'https:' ? 'https://' : 'http://';
    apiUrl = `${protocol}${apiUrl}`;
  }
  
  // HTTPS sayfada HTTP API kullanılmışsa, HTTPS'e yükselt
  if (window.location.protocol === 'https:' && apiUrl.startsWith('http://')) {
    apiUrl = apiUrl.replace('http://', 'https://');
  }
  
  // URL'in sonunda /api olup olmadığını kontrol et
  if (!apiUrl.endsWith('/api')) {
    apiUrl = apiUrl.endsWith('/') ? `${apiUrl}api` : `${apiUrl}/api`;
  }
  
  return apiUrl;
}

/**
 * WebSocket URL'ini döndürür
 */
export function getWsUrl(): string {
  // Önce özel WS URL'ini kontrol et
  let wsUrl = import.meta.env.VITE_WS_URL;
  
  // Eğer özel WS URL'i yoksa, API URL'inden türet
  if (!wsUrl) {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    
    // API URL'inin protokolünü kaldır
    const host = apiUrl.replace(/^https?:\/\//, '');
    
    // Protokolü belirle (HTTPS sayfada WSS kullan)
    const protocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
    
    // WS URL'ini oluştur
    wsUrl = `${protocol}${host}/ws`;
  } else {
    // Protokol kontrolü
    if (!wsUrl.startsWith('ws://') && !wsUrl.startsWith('wss://')) {
      const protocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
      wsUrl = `${protocol}${wsUrl}`;
    }
    
    // HTTPS sayfada WS kullanılmışsa, WSS'e yükselt
    if (window.location.protocol === 'https:' && wsUrl.startsWith('ws://')) {
      wsUrl = wsUrl.replace('ws://', 'wss://');
    }
  }
  
  return wsUrl;
}

/**
 * SSE URL'ini döndürür
 */
export function getSSEUrl(): string {
  // API URL'ini al
  const apiUrl = getApiUrl();
  
  // SSE yolunu ekle
  const sseUrl = apiUrl.endsWith('/') ? `${apiUrl}sse` : `${apiUrl}/sse`;
  
  // HTTPS kontrolü
  if (window.location.protocol === 'https:' && sseUrl.startsWith('http://')) {
    return sseUrl.replace('http://', 'https://');
  }
  
  return sseUrl;
}

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

/**
 * API URL'ini normalleştirir, çift /api gibi sorunları önler
 */
export const normalizeApiUrl = (url: string): string => {
  // HTTP/HTTPS protokolünü temizle
  let normalizedUrl = url.replace(/^https?:\/\//, '');
  
  // Sondaki /api kaldır
  normalizedUrl = normalizedUrl.replace(/\/api$/, '');
  
  // Çift /api yollarını temizle
  normalizedUrl = normalizedUrl.replace(/\/api\/api\//, '/api/');
  
  // Protokolü tekrar ekle (current page protokolüne göre)
  const protocol = window.location.protocol === 'https:' ? 'https://' : 'http://';
  
  return `${protocol}${normalizedUrl}`;
};

export const getEnv = (key: string): string => {
  const value = import.meta.env[key];
  if (!value) {
    throw new Error(`Environment değişkeni bulunamadı: ${key}`);
  }
  return value;
}; 