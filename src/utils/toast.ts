import { toast, ToastOptions } from 'react-toastify';

// Varsayılan toast seçenekleri
const defaultOptions: ToastOptions = {
  position: "top-right",
  autoClose: 3000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true
};

// Toast yardımcı fonksiyonları
export const showSuccess = (message: string, options: ToastOptions = {}) => {
  toast.success(message, { ...defaultOptions, ...options });
};

export const showError = (message: string, options: ToastOptions = {}) => {
  toast.error(message, { ...defaultOptions, ...options });
};

export const showInfo = (message: string, options: ToastOptions = {}) => {
  toast.info(message, { ...defaultOptions, ...options });
};

export const showWarning = (message: string, options: ToastOptions = {}) => {
  toast.warning(message, { ...defaultOptions, ...options });
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

// Dışa aktarılan toast nesnesi
export const toastHelpers = {
  success: showSuccess,
  error: showError,
  info: showInfo,
  warning: showWarning,
  handleApiError
};

export { toast }; 