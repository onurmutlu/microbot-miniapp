import { toast, ToastOptions, ToastPosition } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Toast tipleri için varsayılan ayarlar
const defaultOptions: ToastOptions = {
  position: 'bottom-center' as ToastPosition,
  autoClose: 3000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
};

// Bildirim fonksiyonları
export const showSuccess = (message: string) => {
  toast.success(message, defaultOptions);
};

export const showError = (message: string) => {
  toast.error(message, defaultOptions);
};

export const showInfo = (message: string) => {
  toast.info(message, defaultOptions);
};

export const showWarning = (message: string) => {
  toast.warning(message, defaultOptions);
};

// API hatalarını işlemek için yardımcı fonksiyon
export const handleApiError = (error: any, fallbackMessage = 'Bir hata oluştu') => {
  console.error(error);
  
  if (error.response?.data?.message) {
    showError(error.response.data.message);
  } else if (error.message) {
    showError(error.message);
  } else {
    showError(fallbackMessage);
  }
};

export const useToast = () => {
  const showSuccess = (message: string) => {
    toast.success(message);
  };

  const showError = (message: string) => {
    toast.error(message);
  };

  const showInfo = (message: string) => {
    toast.info(message);
  };

  const showWarning = (message: string) => {
    toast.warning(message);
  };

  return {
    showSuccess,
    showError,
    showInfo,
    showWarning,
  };
}; 