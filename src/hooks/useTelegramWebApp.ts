import { useState, useEffect } from 'react';

// WebApp tiplerini tanımla
interface TelegramWebApp {
  initData: string;
  initDataUnsafe: {
    query_id?: string;
    user?: {
      id: number;
      is_bot?: boolean;
      first_name: string;
      last_name?: string;
      username?: string;
      language_code?: string;
      photo_url?: string;
    };
    auth_date: number;
    hash: string;
    start_param?: string;
  };
  colorScheme: 'light' | 'dark';
  themeParams: {
    bg_color: string;
    text_color: string;
    hint_color: string;
    link_color: string;
    button_color: string;
    button_text_color: string;
    secondary_bg_color: string;
  };
  viewportHeight: number;
  viewportStableHeight: number;
  isExpanded: boolean;
  expand: () => void;
  close: () => void;
  showConfirm: (message: string) => Promise<boolean>;
  showAlert: (message: string) => Promise<void>;
  ready: () => void;
  MainButton: {
    text: string;
    color: string;
    textColor: string;
    isVisible: boolean;
    isActive: boolean;
    isProgressVisible: boolean;
    setText: (text: string) => void;
    onClick: (callback: () => void) => void;
    show: () => void;
    hide: () => void;
    enable: () => void;
    disable: () => void;
    showProgress: (leaveActive: boolean) => void;
    hideProgress: () => void;
  };
  BackButton: {
    isVisible: boolean;
    onClick: (callback: () => void) => void;
    show: () => void;
    hide: () => void;
  };
  HapticFeedback: {
    impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
    notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
    selectionChanged: () => void;
  };
}

// Global Window tipini genişlet
declare global {
  interface Window {
    Telegram?: {
      WebApp?: any;
    };
  }
}

// Telegram WebApp hook'unun dönüş tipi
interface UseTelegramWebAppResult {
  webApp: TelegramWebApp | null;
  user: TelegramWebApp['initDataUnsafe']['user'] | null;
  themeParams: TelegramWebApp['themeParams'] | null;
  ready: boolean;
  isDarkMode: boolean;
  queryParams: URLSearchParams;
  isTelegramClient: boolean;
}

/**
 * Telegram WebApp API'sine erişim için hook
 */
export const useTelegramWebApp = (): UseTelegramWebAppResult => {
  const [webApp, setWebApp] = useState<TelegramWebApp | null>(null);
  const [ready, setReady] = useState(false);
  const [queryParams] = useState<URLSearchParams>(new URLSearchParams(window.location.search));
  const [isTelegramClient, setIsTelegramClient] = useState(false);
  
  useEffect(() => {
    // Global Telegram nesnesinin varlığını kontrol et
    if (window.Telegram?.WebApp) {
      console.log('Telegram WebApp zaten yüklü, kullanılıyor');
      setWebApp(window.Telegram.WebApp);
      window.Telegram.WebApp.ready();
      setReady(true);
      setIsTelegramClient(true);
      return;
    }
    
    console.log('Telegram WebApp yükleniyor...');
    
    // Script yüklü değilse ekle ve yüklenmesini bekle
    const telegramScript = document.createElement('script');
    telegramScript.src = 'https://telegram.org/js/telegram-web-app.js';
    telegramScript.async = true;
    
    // Script yüklendikten sonra WebApp referansını al
    telegramScript.onload = () => {
      console.log('Telegram WebApp script yüklendi, kontrol ediliyor...');
      
      if (window.Telegram?.WebApp) {
        console.log('Telegram WebApp başarıyla tanımlandı');
        setWebApp(window.Telegram.WebApp);
        window.Telegram.WebApp.ready();
        setReady(true);
        setIsTelegramClient(!!window.Telegram.WebApp.initData);
      } else {
        console.warn('Telegram WebApp yüklendi ancak window.Telegram.WebApp bulunamadı');
        setIsTelegramClient(false);
      }
    };
    
    telegramScript.onerror = (error) => {
      console.error('Telegram WebApp script yüklenemedi:', error);
      setIsTelegramClient(false);
    };
    
    document.head.appendChild(telegramScript);
    
    return () => {
      if (telegramScript.parentNode) {
        telegramScript.parentNode.removeChild(telegramScript);
      }
    };
  }, []);
  
  // URL'de tgWebAppData parametresi olup olmadığını kontrol et (Mini Apps)
  useEffect(() => {
    const tgWebAppData = queryParams.get('tgWebAppData') || queryParams.get('initData');
    if (tgWebAppData && !isTelegramClient) {
      console.log('URL üzerinden Telegram initData bulundu, kontrol ediliyor...');
      
      try {
        // URL'den gelen veriyi deşifre et
        const decodedData = decodeURIComponent(tgWebAppData);
        const parsedData = new URLSearchParams(decodedData);
        
        // Gerekli alanların varlığını kontrol et
        const user = parsedData.get('user');
        const authDate = parsedData.get('auth_date');
        const hash = parsedData.get('hash');
        
        if (user && authDate && hash) {
          // Sahte WebApp nesnesi oluştur
          const mockWebApp: TelegramWebApp = {
            initData: tgWebAppData,
            initDataUnsafe: {
              user: user ? JSON.parse(user) : undefined,
              auth_date: Number(authDate),
              hash: hash
            },
            colorScheme: 'light',
            themeParams: {
              bg_color: '#ffffff',
              text_color: '#000000',
              hint_color: '#999999',
              link_color: '#2481cc',
              button_color: '#2481cc',
              button_text_color: '#ffffff',
              secondary_bg_color: '#f0f0f0'
            },
            viewportHeight: window.innerHeight,
            viewportStableHeight: window.innerHeight,
            isExpanded: true,
            expand: () => {},
            close: () => { window.close(); },
            showConfirm: (message) => Promise.resolve(window.confirm(message)),
            showAlert: (message) => Promise.resolve(window.alert(message)),
            ready: () => {},
            MainButton: {
              text: '',
              color: '#2481cc',
              textColor: '#ffffff',
              isVisible: false,
              isActive: false,
              isProgressVisible: false,
              setText: () => {},
              onClick: () => {},
              show: () => {},
              hide: () => {},
              enable: () => {},
              disable: () => {},
              showProgress: () => {},
              hideProgress: () => {}
            },
            BackButton: {
              isVisible: false,
              onClick: () => {},
              show: () => {},
              hide: () => {}
            },
            HapticFeedback: {
              impactOccurred: () => {},
              notificationOccurred: () => {},
              selectionChanged: () => {}
            }
          };
          
          setWebApp(mockWebApp);
          setReady(true);
          setIsTelegramClient(true);
          console.log('URL parametrelerinden WebApp özellikleri oluşturuldu');
        } else {
          console.warn('URL parametrelerinde eksik WebApp verileri var');
        }
      } catch (error) {
        console.error('WebApp verileri işlenirken hata oluştu:', error);
      }
    }
  }, [queryParams, isTelegramClient]);
  
  return {
    webApp,
    user: webApp?.initDataUnsafe?.user || null,
    themeParams: webApp?.themeParams || null,
    ready,
    isDarkMode: webApp?.colorScheme === 'dark',
    queryParams,
    isTelegramClient
  };
};

export default useTelegramWebApp; 