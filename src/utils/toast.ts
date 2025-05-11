import { toast, ToastOptions, toast as toastInstance, Id } from 'react-toastify';
import { isMiniApp } from './env';

// Aktif tüm toast ID'lerini takip etmek için
let activeToasts: Id[] = [];

// Tüm bildirimleri zorla kapatma fonksiyonu
const forceCloseAllToasts = () => {
  // Önce normal dismiss deneyin
  toastInstance.dismiss();
  
  // Sonra takip edilen tüm ID'leri tek tek kapat
  activeToasts.forEach(id => {
    toastInstance.dismiss(id);
  });
  
  // ID listesini temizle
  activeToasts = [];
  
  // Bir süre sonra tekrar kapat (bazı toastlar gecikebilir)
  setTimeout(() => {
    toastInstance.dismiss();
    
    // Son bir temizlik daha yap
    setTimeout(() => {
      document.querySelectorAll('.Toastify__toast').forEach((element) => {
        (element as HTMLElement).style.display = 'none';
      });
    }, 100);
  }, 100);
};

// MiniApp için otomatik kapanma süreleri kısa tutulsun
const getAutoCloseTime = () => {
  // MiniApp içinde daha kısa süre
  if (isMiniApp()) {
    return 1800; // 1.8 saniye
  }
  
  // Normal web tarayıcısında normal süre
  return 2500; // 2.5 saniye
};

// Varsayılan toast seçenekleri
const defaultOptions: ToastOptions = {
  position: isMiniApp() ? "bottom-center" : "top-right", // MiniApp içinde alt orta
  autoClose: getAutoCloseTime(),
  hideProgressBar: isMiniApp(), // MiniApp içinde progress bar gizli
  closeOnClick: true,
  pauseOnHover: false,
  pauseOnFocusLoss: false,
  draggable: true,
  theme: "colored",
  closeButton: true,
  onClick: () => forceCloseAllToasts(),
  className: isMiniApp() ? "miniapp-toast" : "",
  style: isMiniApp() ? { 
    fontSize: '13px', 
    padding: '8px 12px',
    maxWidth: '280px',
    marginBottom: '6px'
  } : {}
};

// Toast yardımcı fonksiyonları
export const showSuccess = (message: string, options: ToastOptions = {}) => {
  forceCloseAllToasts(); // Önceki bildirimleri temizle
  const id = toast.success(message, { ...defaultOptions, ...options });
  activeToasts.push(id);
  
  // Belirli bir süre sonra otomatik kapat
  setTimeout(() => {
    toast.dismiss(id);
    activeToasts = activeToasts.filter(toastId => toastId !== id);
  }, options.autoClose || defaultOptions.autoClose as number);
  
  return id;
};

export const showError = (message: string, options: ToastOptions = {}) => {
  // Offline mod veya MiniApp içinde WebSocket hata mesajlarını gösterme
  if (message.includes('WebSocket') && 
    (localStorage.getItem('offline_mode') === 'true' || 
     localStorage.getItem('is_miniapp_session') === 'true' || 
     isMiniApp())) {
    console.log('[Toast] WebSocket hatası gösterilmedi (offline mod/MiniApp):', message);
    return '';
  }
  
  forceCloseAllToasts(); // Önceki bildirimleri temizle
  const id = toast.error(message, { ...defaultOptions, ...options });
  activeToasts.push(id);
  
  // Belirli bir süre sonra otomatik kapat
  setTimeout(() => {
    toast.dismiss(id);
    activeToasts = activeToasts.filter(toastId => toastId !== id);
  }, options.autoClose || defaultOptions.autoClose as number);
  
  return id;
};

export const showInfo = (message: string, options: ToastOptions = {}) => {
  forceCloseAllToasts(); // Önceki bildirimleri temizle
  const id = toast.info(message, { ...defaultOptions, ...options });
  activeToasts.push(id);
  
  // Belirli bir süre sonra otomatik kapat
  setTimeout(() => {
    toast.dismiss(id);
    activeToasts = activeToasts.filter(toastId => toastId !== id);
  }, options.autoClose || defaultOptions.autoClose as number);
  
  return id;
};

export const showWarning = (message: string, options: ToastOptions = {}) => {
  forceCloseAllToasts(); // Önceki bildirimleri temizle
  const id = toast.warning(message, { ...defaultOptions, ...options });
  activeToasts.push(id);
  
  // Belirli bir süre sonra otomatik kapat
  setTimeout(() => {
    toast.dismiss(id);
    activeToasts = activeToasts.filter(toastId => toastId !== id);
  }, options.autoClose || defaultOptions.autoClose as number);
  
  return id;
};

// API hatalarını işleyen fonksiyon
export const handleApiError = (error: any, fallbackMessage: string = 'Bir hata oluştu') => {
  console.error('API Hatası:', error);
  
  // Hata yanıtını çıkart
  const errorMessage = error?.response?.data?.detail || 
                     error?.response?.data?.message ||
                     error?.message ||
                     fallbackMessage;
  
  showError(errorMessage);
};

// Tüm toastları temizle
export const clearAllToasts = () => {
  forceCloseAllToasts();
};

// Toast ID ile belirli bir toast'u kapat
export const closeToast = (id: string | number) => {
  toast.dismiss(id);
  activeToasts = activeToasts.filter(toastId => toastId !== id);
};

// Dışa aktarılan toast nesnesi
export const toastHelpers = {
  success: showSuccess,
  error: showError,
  info: showInfo,
  warning: showWarning,
  handleApiError,
  clearAll: clearAllToasts,
  close: closeToast
};

// Her toast bileşeni oluşturulduğunda çağrılacak kancalar
const addCreationTimestamp = (node: HTMLElement) => {
  if (node) {
    node.setAttribute('data-created', Date.now().toString());
  }
};

// Sayfa yüklendiğinde tüm bildirimleri temizle
if (typeof window !== 'undefined') {
  window.addEventListener('load', forceCloseAllToasts);
  
  // Rota değişimlerinde bildirimleri kapat 
  window.addEventListener('popstate', forceCloseAllToasts);
  
  // Kullanıcı etkileşimlerinde bildirimleri kapat
  window.addEventListener('click', () => {
    setTimeout(forceCloseAllToasts, 500); // Süre arttırıldı
  });
  
  // Her 5 saniyede bir aktif toastları kontrol et ve 10 saniyeden uzun süredir açık olanları kapat
  const MAX_TOAST_DURATION = 10000; // 10 saniye
  setInterval(() => {
    const now = Date.now();
    document.querySelectorAll('.Toastify__toast').forEach((element) => {
      if (!element.hasAttribute('data-created')) {
        addCreationTimestamp(element as HTMLElement);
      }
      const createdAt = parseInt(element.getAttribute('data-created') || '0');
      if (createdAt && (now - createdAt > MAX_TOAST_DURATION)) {
        (element as HTMLElement).style.display = 'none';
      }
    });
  }, 5000);
  
  // Toast bileşenlerinin oluşturulmasını izle
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.addedNodes.length) {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement && node.classList.contains('Toastify__toast')) {
            addCreationTimestamp(node);
          }
        });
      }
    });
  });
  
  // Observer'ı yapılandır ve başlat
  setTimeout(() => {
    const toastContainer = document.querySelector('.Toastify');
    if (toastContainer) {
      observer.observe(toastContainer, { childList: true, subtree: true });
    }
  }, 1000);
}

export { toast }; 