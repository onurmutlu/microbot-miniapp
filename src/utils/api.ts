import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import Telegram from '@twa-dev/sdk'
import { toast } from 'react-toastify'
import { getTestMode } from './testMode'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000; // ms

// TypeScript için genişletilmiş tip tanımlamaları
declare module 'axios' {
  export interface InternalAxiosRequestConfig {
    retryAttempt?: number;
  }
  
  export interface AxiosError {
    standardizedError?: StandardResponse;
  }
}

// API yanıtlarını standardize eden yanıt tipi
export interface StandardResponse<T = any> {
  success: boolean;
  message: string;
  data: T | null;
  status?: number;
}

// Genişletilmiş API hata tipi
interface ExtendedAxiosError extends AxiosError {
  standardizedError?: StandardResponse;
  code?: string;
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// İstek interceptor'ı
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    if (getTestMode()) {
      config.headers['X-Test-Mode'] = 'true'
    }
    
    // Yeniden deneme sayacı ekle (yoksa)
    if (config.retryAttempt === undefined) {
      config.retryAttempt = 0;
    }
    
    return config
  },
  (error) => {
    console.error('İstek Hatası:', error)
    return Promise.reject(error)
  }
)

// Yanıt interceptor'ı
api.interceptors.response.use(
  (response) => response,
  async (error: ExtendedAxiosError) => {
    // Konfigürasyon nesnesini al veya oluştur
    const config = error.config || {} as InternalAxiosRequestConfig;
    
    // Test modunda 401 hatası için özel işlem
    if (getTestMode() && error.response?.status === 401) {
      console.warn('Test modu: 401 Unauthorized hatası ele alınıyor')
      return Promise.reject(error)
    }

    // 401 hatası durumunda Telegram init data ile otomatik login
    if (error.response?.status === 401) {
      try {
        localStorage.removeItem('access_token')
        const initData = Telegram.initData

        if (!initData) {
          toast.error('Oturum süresi doldu. Lütfen tekrar giriş yapın.')
          return Promise.reject(error)
        }

        const response = await axios.post(`${API_BASE_URL}/auth/telegram`, { initData })
        if (response.data.token) {
          localStorage.setItem('access_token', response.data.token)
          const originalRequest = error.config
          if (originalRequest && originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${response.data.token}`
            return axios(originalRequest)
          }
        }
      } catch (loginError) {
        console.error('Telegram login hatası:', loginError)
        toast.error('Oturum süresi doldu. Lütfen tekrar giriş yapın.')
      }
    }

    // Ağ hatası veya timeout durumunda yeniden deneme
    if (!error.response && (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK') && 
        config.retryAttempt !== undefined && config.retryAttempt < MAX_RETRY_ATTEMPTS) {
      config.retryAttempt++;
      
      console.log(`Ağ hatası: İstek yeniden deneniyor (${config.retryAttempt}/${MAX_RETRY_ATTEMPTS})`, config.url);
      
      // Üstel geri çekilme (exponential backoff) ile yeniden deneme süresi
      const delay = RETRY_DELAY * Math.pow(2, config.retryAttempt - 1);
      
      return new Promise(resolve => {
        setTimeout(() => {
          resolve(api(config));
        }, delay);
      });
    }

    // Standardize API hataları - her zaman { success: false, message: string, data?: any } formatında yanıt döndür
    if (error.response) {
      console.error('API Hatası:', error.response.status, error.response.data);
      
      // API'den gelen yanıtı standardize et
      const standardError: StandardResponse = {
        success: false,
        message: 'Bir hata oluştu',
        data: null,
        status: error.response.status
      };
      
      // API'den gelen hata mesajını kullan (varsa)
      if (error.response.data) {
        if (typeof error.response.data === 'string') {
          standardError.message = error.response.data;
        } else if (typeof error.response.data === 'object' && error.response.data !== null) {
          const errorData = error.response.data as Record<string, any>;
          if (errorData.message) {
            standardError.message = errorData.message;
            standardError.data = errorData.data || null;
          } else if (errorData.error) {
            standardError.message = errorData.error;
          }
        }
      }
      
      error.standardizedError = standardError;
    } else if (error.request) {
      console.error('Bağlantı Hatası:', error.request);
      error.standardizedError = {
        success: false,
        message: 'Sunucuya bağlanılamadı',
        data: null
      };
    } else {
      console.error('İstek Hatası:', error.message);
      error.standardizedError = {
        success: false,
        message: error.message || 'Bilinmeyen bir hata oluştu',
        data: null
      };
    }

    return Promise.reject(error)
  }
)

// API yanıtlarını standardize eden yardımcı fonksiyon
export const standardizeResponse = <T = any>(response: AxiosResponse): StandardResponse<T> => {
  // Eğer yanıt zaten standardize edilmiş formatta ise doğrudan döndür
  if (response.data && (response.data.success !== undefined)) {
    return response.data as StandardResponse<T>;
  }
  
  // Standardize format: { success: true, message: string, data: any }
  return {
    success: true,
    message: 'İşlem başarılı',
    data: response.data as T
  };
};

// Yardımcı fonksiyonlar
export const initAuth = async (): Promise<boolean> => {
  try {
    // Telegram initData'yı kullanarak authentication
    const initData = Telegram.initData
    if (initData) {
      const response = await axios.post(`${api.defaults.baseURL}/auth/telegram`, {
        initData
      })
      if (response.data.token) {
        localStorage.setItem('access_token', response.data.token)
        return true
      }
    }
    return false
  } catch (error) {
    console.error('Authentication hatası:', error)
    return false
  }
}

// API fonksiyonlarını standardize yanıt formatıyla sar
export const wrappedGet = async <T = any>(url: string, config?: any): Promise<StandardResponse<T>> => {
  try {
    const response = await api.get<T>(url, config);
    return standardizeResponse<T>(response);
  } catch (error) {
    if (error instanceof AxiosError && 'standardizedError' in error && error.standardizedError) {
      return error.standardizedError as StandardResponse<T>;
    }
    return { 
      success: false, 
      message: 'İstek işlenirken bir hata oluştu', 
      data: null 
    };
  }
};

export const wrappedPost = async <T = any>(url: string, data?: any, config?: any): Promise<StandardResponse<T>> => {
  try {
    const response = await api.post<T>(url, data, config);
    return standardizeResponse<T>(response);
  } catch (error) {
    if (error instanceof AxiosError && 'standardizedError' in error && error.standardizedError) {
      return error.standardizedError as StandardResponse<T>;
    }
    return { 
      success: false, 
      message: 'İstek işlenirken bir hata oluştu', 
      data: null 
    };
  }
};

export const wrappedPut = async <T = any>(url: string, data?: any, config?: any): Promise<StandardResponse<T>> => {
  try {
    const response = await api.put<T>(url, data, config);
    return standardizeResponse<T>(response);
  } catch (error) {
    if (error instanceof AxiosError && 'standardizedError' in error && error.standardizedError) {
      return error.standardizedError as StandardResponse<T>;
    }
    return { 
      success: false, 
      message: 'İstek işlenirken bir hata oluştu', 
      data: null 
    };
  }
};

export const wrappedDelete = async <T = any>(url: string, config?: any): Promise<StandardResponse<T>> => {
  try {
    const response = await api.delete<T>(url, config);
    return standardizeResponse<T>(response);
  } catch (error) {
    if (error instanceof AxiosError && 'standardizedError' in error && error.standardizedError) {
      return error.standardizedError as StandardResponse<T>;
    }
    return { 
      success: false, 
      message: 'İstek işlenirken bir hata oluştu', 
      data: null 
    };
  }
};

// Telegram API fonksiyonları
export const joinGroup = async (session_id: string, group_link: string) => {
  return wrappedPost('/telegram/join-group', { session_id, group_link });
}

export const listJoinedGroups = async (session_id: string) => {
  return wrappedGet(`/telegram/list-joined-groups?session_id=${session_id}`);
}

export const fetchJoinedGroups = async (session_id: string) => {
  return wrappedPost('/telegram/fetch-joined-groups', { session_id });
}

export const fetchGroupMembers = async (session_id: string, group_id: string) => {
  return wrappedPost('/telegram/fetch-group-members', { session_id, group_id });
}

export const toggleGroup = async (session_id: string, group_id: string, is_active: boolean) => {
  return wrappedPost('/telegram/toggle-group', { session_id, group_id, is_active });
}

export const removeGroup = async (session_id: string, group_id: string) => {
  return wrappedDelete(`/telegram/remove-group?session_id=${session_id}&group_id=${group_id}`);
}

export const listMembers = async (session_id: string, group_id: string) => {
  return wrappedGet(`/telegram/list-members?session_id=${session_id}&group_id=${group_id}`);
}

export const sendDM = async (session_id: number, user_ids: number[], message: string) => {
  return wrappedPost('/telegram/send-dm', { session_id, user_ids, message });
}

export default api; 