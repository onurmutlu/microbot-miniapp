import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import Telegram from '@twa-dev/sdk'
import { getTestMode } from './testMode'
import { logService } from '../services/logService';

// API_BASE_URL'yi düzelterek direkt domain kullanıyoruz
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://microbot-api.siyahkare.com';
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000; // ms

// Global Telegram tipi tanımlaması
declare global {
  interface Window {
    Telegram?: {
      WebApp?: any;
    };
  }
}

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

// Default axios config ile API instance oluştur
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 saniye
  headers: {
    'Content-Type': 'application/json'
  },
  // HttpOnly cookie desteği için credentials ekle
  withCredentials: true
})

// Çift /api yolunu kontrol edip düzeltir
const normalizeApiPath = (path: string): string => {
  // Eğer path /api ile başlıyorsa ve baseUrl zaten /api ile bitiyorsa
  // çift /api oluşmasını önle
  if (path.startsWith('/api/') && API_BASE_URL.endsWith('/api')) {
    // /api/ ön ekini kaldır
    return path.substring(4);
  }
  
  // Çift /api yolunu düzelt
  return path.replace(/^\/api\/api\//, '/api/');
};

// Tam URL oluştur
const getFullUrl = (path: string): string => {
  // Path zaten http:// veya https:// ile başlıyorsa tam URL'dir
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  // Path / ile başlamıyorsa ekle
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  
  // API path'ini normalize et ve baseUrl ile birleştir
  return `${API_BASE_URL}${normalizeApiPath(normalizedPath)}`;
};

// İstek interceptor'ı
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Token eklemek için kontrol
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    if (getTestMode()) {
      config.headers['X-Test-Mode'] = 'true'
    }
    
    // Debugging için istek URL'sini logla
    console.log(`[API] ${config.method?.toUpperCase() || 'REQUEST'} ${getFullUrl(config.url || '')}`);
    
    // Log servisine isteği logla
    const requestId = Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
    config.headers['X-Request-ID'] = requestId;
    
    logService.info('HTTP', `${config.method?.toUpperCase() || 'REQUEST'} ${getFullUrl(config.url || '')}`, {
      requestId,
      url: getFullUrl(config.url || ''),
      method: config.method?.toUpperCase(),
      headers: config.headers,
      data: config.data,
      params: config.params
    });
    
    // Yeniden deneme sayacı ekle (yoksa)
    if (config.retryAttempt === undefined) {
      config.retryAttempt = 0;
    }
    
    return config
  },
  (error) => {
    console.error('İstek Hatası:', error)
    logService.error('HTTP', 'İstek Hatası', { error: error.message });
    return Promise.reject(error)
  }
)

// Yanıt interceptor'ı
api.interceptors.response.use(
  (response) => {
    // Yanıtı logla
    const requestId = response.config.headers['X-Request-ID'];
    const url = response.config.url || '';
    const method = response.config.method?.toUpperCase() || '';
    
    // API yanıtlarını logla
    logService.debug('HTTP', `${method} ${url} ${response.status}`, {
      requestId,
      status: response.status,
      statusText: response.statusText,
      data: response.data,
      duration: response.headers['x-response-time'] || 'unknown',
      url,
      method
    });
    
    // MiniApp için özel success: false kontrolleri
    if (response.data && response.data.success === false) {
      console.warn('[API] Başarısız yanıt:', response.data.message || 'Bilinmeyen hata');
      const error = new Error(response.data.message || 'İşlem başarısız') as ExtendedAxiosError;
      error.standardizedError = {
        success: false,
        message: response.data.message || 'İşlem başarısız',
        data: response.data.data || null
      };
      return Promise.reject(error);
    }
    
    return response;
  },
  async (error: ExtendedAxiosError) => {
    // Konfigürasyon nesnesini al veya oluştur
    const config = error.config || {} as InternalAxiosRequestConfig;
    
    // Hata detaylarını logla
    const requestId = config.headers?.['X-Request-ID'] || 'unknown';
    const url = config.url || '';
    const method = config.method?.toUpperCase() || '';
    
    logService.error('HTTP', `${method} ${url} ${error.response?.status || 'NETWORK_ERROR'}`, {
      requestId,
      url,
      method,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      errorMessage: error.message
    });
    
    // 401 Unauthorized hatası kontrolü ve işleme
    if (error.response?.status === 401) {
      console.error('[API] 401 Unauthorized hatası:', error.response?.data);
      
      // Token geçersiz veya süresi dolmuş
      const currentToken = localStorage.getItem('access_token');
      if (currentToken) {
        console.log('[API] Token mevcut ama 401 hatası alındı, token yenileme deneniyor');
        
        try {
          // Güncellenmiş token yenileme endpoint'ini kullan
          const refreshResponse = await api.post('/api/auth/refresh-token', {
            token: currentToken // Hem body'de hem de cookie'de token gönder
          }, { 
            headers: { 'X-Refresh-Token': 'true' },
            withCredentials: true // Cookie için credentials ekle
          });
          
          // Yeni token kontrolü
          if (refreshResponse.data?.token || refreshResponse.data?.data?.token) {
            const newToken = refreshResponse.data?.token || refreshResponse.data?.data?.token;
            console.log('[API] Token yenilemesi başarılı, yeni token alındı');
            localStorage.setItem('access_token', newToken);
            
            // Orijinal isteği yeni token ile tekrarla
            config.headers = config.headers || {};
            config.headers.Authorization = `Bearer ${newToken}`;
            
            // İsteği tekrarla
            return axios(config);
          }
        } catch (refreshError) {
          console.error('[API] Token yenileme başarısız:', refreshError);
        }
        
        // Token yenileme başarısız olursa MiniApp kontrolü yap
        // İnit Data yeniden kontrol et
        if (window.Telegram?.WebApp?.initData) {
          console.log('[API] MiniApp oturumu algılandı, yeni kimlik doğrulama deneniyor');
          
          try {
            // Yeni MiniApp endpoint'ini kullan
            const authResponse = await api.post('/api/v1/miniapp/auth', {
              initData: window.Telegram.WebApp.initData,
              initDataUnsafe: window.Telegram.WebApp.initDataUnsafe,
              user: window.Telegram.WebApp.initDataUnsafe?.user
            }, { 
              headers: { 'X-Retry-Auth': 'true' },
              withCredentials: true // Cookie için credentials ekle
            });
            
            if (authResponse.data?.token || authResponse.data?.data?.token) {
              // Yeni token al ve kaydet
              const newToken = authResponse.data?.token || authResponse.data?.data?.token;
              console.log('[API] MiniApp doğrulaması başarılı, yeni token alındı');
              localStorage.setItem('access_token', newToken);
              
              // Orijinal isteği yeni token ile tekrarla
              config.headers = config.headers || {};
              config.headers.Authorization = `Bearer ${newToken}`;
              
              // İsteği tekrarla
              return axios(config);
            }
          } catch (retryError) {
            console.error('[API] MiniApp doğrulaması başarısız:', retryError);
          }
        }
        
        // Yeniden doğrulama başarısız olduysa, offline mode'u etkinleştir
        if (window.Telegram?.WebApp?.initData) {
          console.log('[API] MiniApp offline modu etkinleştiriliyor');
          localStorage.setItem('offline_mode', 'true');
          
          // Kullanıcı bilgisini al
          const userData = window.Telegram.WebApp.initDataUnsafe?.user;
          if (userData) {
            const offlineToken = `offline-${Date.now()}`;
            localStorage.setItem('access_token', offlineToken);
            localStorage.setItem('telegram_user', JSON.stringify(userData));
            
            // Events
            window.dispatchEvent(new StorageEvent('storage', {
              key: 'access_token',
              newValue: offlineToken
            }));
            
            // Orijinal isteği token ile tekrarla
            config.headers = config.headers || {};
            config.headers.Authorization = `Bearer ${offlineToken}`;
            config.headers['X-Offline-Mode'] = 'true';
            
            // İsteği tekrarla (offline mod için)
            if (!config.url?.includes('/auth/')) {
              return axios(config);
            }
          }
        } else {
          // MiniApp değilse veya doğrudan login sayfasına yönlendir
          console.log('[API] Oturum geçersiz, login sayfasına yönlendirilecek');
          
          // LocalStorage'den token'ı temizle
          localStorage.removeItem('access_token');
          
          // Sayfa yeniden yüklenmeden kullanıcıyı login sayfasına yönlendir
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
        }
      }
    }
    
    // Test modunda mock API yanıtları
    if (getTestMode()) {
      console.warn('Test modu: API istekleri simüle ediliyor')
      
      // URL'yi al
      const url = config.url || '';
      
      // Message templates API için mock yanıt
      if (url.includes('/message-templates')) {
        console.log('Test modu: Message templates mock yanıtı döndürülüyor');
        
        // GET isteği için mock şablonlar listesi
        if (config.method?.toLowerCase() === 'get') {
          return Promise.resolve({
            data: [
              {
                id: '1',
                title: 'Karşılama Mesajı',
                content: 'Merhaba, [isim]! Grubumuza hoş geldiniz. Burada size yardımcı olmaktan mutluluk duyarız.',
                is_active: true,
                category: 'bilgi'
              },
              {
                id: '2',
                title: 'Bilgilendirme Mesajı',
                content: 'Değerli üyemiz, [tarih] tarihinde bir etkinliğimiz olacaktır. Katılımınızı bekliyoruz.',
                is_active: true,
                category: 'duyuru'
              },
              {
                id: '3',
                title: 'İndirim Duyurusu',
                content: 'Özel fırsatımızdan yararlanmak için [kod] kodunu kullanabilirsiniz. Bu indirim [tarih] tarihine kadar geçerlidir.',
                is_active: false,
                category: 'promosyon'
              }
            ]
          });
        }
        
        // POST isteği için yeni şablon ekleme yanıtı
        if (config.method?.toLowerCase() === 'post') {
          const newTemplate = {
            id: Math.random().toString(36).substring(2, 9),
            ...JSON.parse(config.data || '{}'),
            is_active: true
          };
          
          return Promise.resolve({
            data: newTemplate
          });
        }
        
        // PUT isteği için şablon güncelleme yanıtı
        if (config.method?.toLowerCase() === 'put') {
          return Promise.resolve({
            data: {
              ...JSON.parse(config.data || '{}'),
              is_active: true
            }
          });
        }
        
        // DELETE isteği için başarılı yanıt
        if (config.method?.toLowerCase() === 'delete') {
          return Promise.resolve({
            data: { success: true }
          });
        }
      }
      
      // Dashboard API için mock yanıt
      if (url.includes('/dashboard/stats')) {
        console.log('Test modu: Dashboard stats mock yanıtı döndürülüyor');
        
        return Promise.resolve({
          data: {
            active_users: 125,
            active_handlers: 3,
            active_schedulers: 5,
            messages_sent_today: 542,
            active_groups: 18,
            total_templates: 24
          }
        });
      }
      
      // SSE ping için mock yanıt
      if (url.includes('/sse/ping/')) {
        console.log('Test modu: SSE ping mock yanıtı döndürülüyor');
        return Promise.resolve({
          data: {
            success: true,
            message: 'Ping başarılı',
            timestamp: new Date().toISOString()
          }
        });
      }
      
      // MiniApp doğrulama için mock yanıt
      if (url.includes('/miniapp/auth') || url.includes('/validate-token')) {
        console.log('Test modu: MiniApp auth mock yanıtı döndürülüyor');
        return Promise.resolve({
          data: {
            success: true,
            message: 'Doğrulama başarılı',
            data: {
              token: 'test-token-' + Date.now(),
              user: window.Telegram?.WebApp?.initDataUnsafe?.user || {
                id: 'test-user-' + Date.now(),
                username: 'test_user',
                first_name: 'Test',
                last_name: 'User'
              }
            }
          }
        });
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
          
          // MiniApp için özel hata kontrolleri
          if (errorData.success === false) {
            standardError.success = false;
            standardError.message = errorData.message || 'Bilinmeyen hata';
            standardError.data = errorData.data || null;
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

// Yeni MiniApp doğrulama endpoint'leri
export const validateMiniAppToken = async (): Promise<StandardResponse<any>> => {
  try {
    const token = localStorage.getItem('access_token');
    
    // Mini App token doğrulama
    const response = await api.post('/api/v1/miniapp/validate-token', {
      token // Body'de token gönder (cookie zaten gönderilecek)
    }, {
      withCredentials: true // Cookie için credentials ekle
    });
    
    return standardizeResponse(response);
  } catch (error) {
    if (error instanceof AxiosError && 'standardizedError' in error && error.standardizedError) {
      return error.standardizedError as StandardResponse<any>;
    }
    return { 
      success: false, 
      message: 'Token doğrulanamadı', 
      data: null 
    };
  }
}

// MiniApp authentication
export const miniAppAuth = async (): Promise<boolean> => {
  try {
    // Telegram initData'yı kullanarak authentication
    // Telegram SDK veya window.Telegram.WebApp'dan initData'yı al
    let initData = null;
    let userData = null;
    
    // Önce window.Telegram.WebApp'ı kontrol et
    if (window.Telegram?.WebApp?.initData) {
      console.log('[API] miniAppAuth - window.Telegram.WebApp.initData kullanılıyor');
      initData = window.Telegram.WebApp.initData;
      userData = window.Telegram.WebApp.initDataUnsafe?.user || {};
    } 
    // Sonra Telegram SDK'yı kontrol et
    else if (Telegram?.initData) {
      console.log('[API] miniAppAuth - Telegram SDK initData kullanılıyor');
      initData = Telegram.initData;
    }
    
    if (initData) {
      console.log('[API] miniAppAuth - initData var, kimlik doğrulama isteği gönderiliyor');
      console.log('[API] miniAppAuth - URL:', `${api.defaults.baseURL}/api/v1/miniapp/auth`);
      
      // Yeni endpoint ile auth isteği gönder
      const response = await api.post('/api/v1/miniapp/auth', {
        initData,
        initDataUnsafe: window.Telegram?.WebApp?.initDataUnsafe || {},
        user: userData
      }, {
        timeout: 10000, // 10 saniye
        headers: {
          'X-Debug-Info': 'MiniAppAuth-Function'
        },
        withCredentials: true // Cookie için credentials ekle
      });
      
      // Token kontrolü (direct veya data içinde olabilir)
      const token = response.data?.token || response.data?.data?.token;
      if (token) {
        console.log('[API] miniAppAuth - Kimlik doğrulama başarılı, token alındı');
        localStorage.setItem('access_token', token);
        return true;
      } else {
        console.error('[API] miniAppAuth - Token alınamadı:', response.data);
      }
    } else {
      console.error('[API] miniAppAuth - initData bulunamadı');
    }
    return false;
  } catch (error) {
    console.error('[API] MiniApp Authentication hatası:', error);
    return false;
  }
}

// API fonksiyonlarını standardize yanıt formatıyla sar
export const wrappedGet = async <T = any>(url: string, config?: any): Promise<StandardResponse<T>> => {
  try {
    // HttpOnly cookie desteği
    const defaultConfig = { withCredentials: true };
    const mergedConfig = config ? { ...defaultConfig, ...config } : defaultConfig;
    
    const response = await api.get<T>(getFullUrl(url), mergedConfig);
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
    // HttpOnly cookie desteği
    const defaultConfig = { withCredentials: true };
    const mergedConfig = config ? { ...defaultConfig, ...config } : defaultConfig;
    
    const response = await api.post<T>(getFullUrl(url), data, mergedConfig);
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
    // HttpOnly cookie desteği
    const defaultConfig = { withCredentials: true };
    const mergedConfig = config ? { ...defaultConfig, ...config } : defaultConfig;
    
    const response = await api.put<T>(getFullUrl(url), data, mergedConfig);
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
    // HttpOnly cookie desteği
    const defaultConfig = { withCredentials: true };
    const mergedConfig = config ? { ...defaultConfig, ...config } : defaultConfig;
    
    const response = await api.delete<T>(getFullUrl(url), mergedConfig);
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