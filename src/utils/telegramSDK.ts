import WebApp from '@twa-dev/sdk';

// MiniApp'in orijinal WebApp nesnesine tipli erişim
export const telegram = WebApp;

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
  is_premium?: boolean;
}

interface QueryParams {
  [key: string]: string;
}

/**
 * Telegram MiniApp'in query parametrelerini analiz eder
 */
export const getQueryParams = (): QueryParams => {
  if (!telegram) return {};
  
  // Telegram WebApp initData'sındaki start_param veya ham initData'dan parametreleri çıkar
  try {
    // URL'den query parametrelerini al
    const search = window.location.search;
    const searchParams = new URLSearchParams(search);
    
    // Tüm parametreleri nesneye dönüştür
    const params: QueryParams = {};
    for (const [key, value] of searchParams.entries()) {
      params[key] = value;
    }
    
    // Eğer Telegram'ın kendi start_param değeri varsa, onu da ekle
    if (telegram.initDataUnsafe?.start_param) {
      params.start_param = telegram.initDataUnsafe.start_param;
    }
    
    return params;
  } catch (error) {
    console.error('Query parametreleri analiz edilirken hata oluştu:', error);
    return {};
  }
};

/**
 * Belirli bir query parametresinin değerini döndürür
 */
export const getQueryParam = (name: string): string | null => {
  const params = getQueryParams();
  return params[name] || null;
};

/**
 * Admin modu olup olmadığını kontrol eder
 */
export const isAdminMode = (): boolean => {
  return getQueryParam('mode') === 'admin';
};

/**
 * Kullanıcı bilgilerini döndürür
 */
export const getUserInfo = (): TelegramUser | null => {
  if (!telegram || !telegram.initDataUnsafe?.user) {
    return null;
  }
  
  return telegram.initDataUnsafe.user;
};

/**
 * MiniApp SDK'nın doğru şekilde başlatılıp başlatılmadığını kontrol eder
 */
export const isTelegramMiniApp = (): boolean => {
  try {
    return !!telegram && !!telegram.initData;
  } catch (error) {
    return false;
  }
};

/**
 * Ana uygulama başlatma fonksiyonu
 */
export const initTelegramApp = () => {
  if (isTelegramMiniApp()) {
    // Ana tema rengini Telegram renklerine uygun ayarla
    document.documentElement.style.setProperty('--tg-theme-bg-color', telegram.backgroundColor || '#ffffff');
    document.documentElement.style.setProperty('--tg-theme-text-color', telegram.textColor || '#000000');
    document.documentElement.style.setProperty('--tg-theme-hint-color', telegram.hintColor || '#999999');
    document.documentElement.style.setProperty('--tg-theme-link-color', telegram.linkColor || '#2481cc');
    document.documentElement.style.setProperty('--tg-theme-button-color', telegram.buttonColor || '#007aff');
    document.documentElement.style.setProperty('--tg-theme-button-text-color', telegram.buttonTextColor || '#ffffff');
    
    // MainButton'ı gizle (gerekirse daha sonra gösterebiliriz)
    telegram.MainButton.hide();
    
    // BackButton'ı gizle (gerekirse daha sonra gösterebiliriz)
    telegram.BackButton.hide();
    
    // Uygulama hazır olduğunda Telegram'a bildir
    telegram.ready();
    
    return true;
  }
  
  return false;
};

/**
 * Telegram arayüzünü kapatır ve kullanıcıyı Telegram sohbetine geri döndürür
 */
export const closeTelegramApp = () => {
  if (isTelegramMiniApp()) {
    telegram.close();
  }
};

/**
 * Kullanıcıya veriyi kopyalama seçeneği sunar
 */
export const shareTelegramData = (data: string) => {
  if (isTelegramMiniApp()) {
    navigator.clipboard.writeText(data)
      .then(() => {
        // Veri başarıyla kopyalandı
        telegram.showPopup({
          title: 'Kopyalandı',
          message: 'Veri panoya kopyalandı',
          buttons: [{ type: 'ok' }]
        });
      })
      .catch(() => {
        // Veri kopyalanamadı
        telegram.showPopup({
          title: 'Hata',
          message: 'Veri kopyalanamadı',
          buttons: [{ type: 'ok' }]
        });
      });
  }
};

// Sayfa yüklendiğinde Telegram MiniApp'i başlat
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    initTelegramApp();
  });
} 