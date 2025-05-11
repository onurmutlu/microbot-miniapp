import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { toast } from 'react-toastify';
import { getTestMode } from '../utils/testMode';

/**
 * Yeniden deneme yapmak için bir yapılandırma
 */
interface RetryConfig {
  maxRetries: number;
  retryDelay: number;
  retryStatusCodes: number[];
}

// İstek konfigürasyonunu genişlet
interface ExtendedAxiosRequestConfig extends AxiosRequestConfig {
  __retryCount?: number;
}

/**
 * API İstek ve yanıt işlemlerini yöneten servis
 */
class ApiService {
  private api: AxiosInstance;
  private token: string | null = null;
  private retryConfig: RetryConfig = {
    maxRetries: 3,
    retryDelay: 1000,
    retryStatusCodes: [408, 429, 500, 502, 503, 504]
  };
  private customErrorHandler: ((error: AxiosError) => Promise<any>) | null = null;

  constructor() {
    // API URL yapılandırmasını düzeltiyoruz
    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    const normalizedBaseURL = baseURL.endsWith('/api') 
      ? baseURL 
      : `${baseURL}/api`;
    
    this.api = axios.create({
      baseURL: normalizedBaseURL,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupDefaultInterceptors();
  }

  /**
   * Özel bir hata işleyici ayarlar
   */
  setupInterceptors(errorHandler?: (error: AxiosError) => Promise<any>) {
    if (errorHandler) {
      this.customErrorHandler = errorHandler;
    }
  }

  /**
   * Varsayılan istek ve yanıt interceptor'larını kur
   */
  private setupDefaultInterceptors() {
    // İstek interceptor'ı
    this.api.interceptors.request.use(
      (config) => {
        // Yetkilendirme token'ını ekle
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
        } else {
          // localStorage'dan token al
          const token = localStorage.getItem('access_token');
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
            this.token = token;
          }
        }
        
        // Test modu kontrolü
        if (getTestMode()) {
          config.headers['X-Test-Mode'] = 'true';
        }
        
        // Request ID - debugging için
        config.headers['X-Request-ID'] = Date.now().toString(36) + Math.random().toString(36).substring(2);
        
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Yanıt interceptor'ı
    this.api.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        // Özel hata işleyicisi varsa kullan
        if (this.customErrorHandler) {
          return this.customErrorHandler(error);
        }
        
        // Retry mekanizması
        const config = error.config as ExtendedAxiosRequestConfig | undefined;
        
        if (config && error.response?.status && 
            this.retryConfig.retryStatusCodes.includes(error.response.status) && 
            (!config.__retryCount || config.__retryCount < this.retryConfig.maxRetries)) {
            
          config.__retryCount = (config.__retryCount || 0) + 1;
          
          console.log(`Ağ hatası: İstek yeniden deneniyor (${config.__retryCount}/${this.retryConfig.maxRetries}) ${config.url}`);
          
          // Gecikme sonrası yeniden dene
          await new Promise(resolve => setTimeout(resolve, this.retryConfig.retryDelay));
          return this.api(config);
        }
        
        // Standart hata işleme
        if (error.response) {
          switch (error.response.status) {
            case 401:
              this.handleUnauthorized(error);
              break;
            case 403:
              toast.error('Bu işlem için yetkiniz yok');
              break;
            case 404:
              // 404 hatasını sadece API rotaları için göster, statik dosyalar için gösterme
              if (!error.config?.url?.includes('.')) {
                toast.error('İstenen kaynak bulunamadı');
              }
              break;
            case 400:
              const errorMsg = typeof error.response.data === 'object' && error.response.data !== null 
                ? (error.response.data as any).message || 'Geçersiz istek'
                : 'Geçersiz istek';
              toast.error(errorMsg);
              break;  
            case 422:
              const validationMsg = typeof error.response.data === 'object' && error.response.data !== null 
                ? (error.response.data as any).message || 'Doğrulama hatası'
                : 'Doğrulama hatası';
              toast.error(validationMsg);
              break;  
            case 429:
              toast.warning('Çok fazla istek gönderdiniz. Lütfen biraz bekleyin.');
              break;  
            case 500:
              toast.error('Sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin.');
              break;
            default:
              if (error.response.status >= 500) {
                toast.error('Sunucu şu anda hizmet veremiyor. Lütfen daha sonra tekrar deneyin.');
              } else {
                const message = typeof error.response.data === 'object' && error.response.data !== null 
                  ? (error.response.data as any).message || 'Bilinmeyen bir hata oluştu'
                  : 'Bilinmeyen bir hata oluştu';
                toast.error(`Hata: ${message}`);
              }
          }
        } else if (error.request) {
          // İstek yapıldı ama yanıt alınamadı
          toast.error('Sunucuya bağlanılamıyor. Lütfen internet bağlantınızı kontrol edin.');
        } else {
          // İstek yapılmadan önce bir hata oluştu
          toast.error('İstek yapılamadı: ' + (error.message || 'Bilinmeyen hata'));
        }
        
        return Promise.reject(error);
      }
    );
  }

  /**
   * Yetkilendirme hatalarını işle
   */
  private handleUnauthorized(error: AxiosError) {
    // Login ve auth routelarında 401 hatası normal karşılanabilir
    const authRoutes = ['/auth/login', '/auth/telegram', '/auth/register'];
    if (error.config?.url && authRoutes.some(route => error.config?.url?.includes(route))) {
      return;
    }
    
    this.token = null;
    localStorage.removeItem('access_token');
    localStorage.removeItem('token');
    
    // Sadece bir kez göster
    if (!window.sessionStorage.getItem('auth_error_shown')) {
      toast.error('Oturum süresi doldu. Lütfen yeniden giriş yapın.', {
        autoClose: 5000,
        onClose: () => {
          window.location.href = '/login';
        }
      });
      window.sessionStorage.setItem('auth_error_shown', 'true');
      
      // Oturumu 3 saniye sonra sonlandır
      setTimeout(() => {
        window.location.href = '/login';
      }, 3000);
    }
  }

  /**
   * Token'ı ayarla
   */
  setToken(token: string) {
    this.token = token;
    this.api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  /**
   * Token'ı temizle
   */
  clearToken() {
    this.token = null;
    delete this.api.defaults.headers.common['Authorization'];
  }

  /**
   * GET isteği gönder
   */
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.api.get<T>(url, config);
      return response.data;
    } catch (error) {
      return this.handleError<T>(error);
    }
  }

  /**
   * POST isteği gönder
   */
  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.api.post<T>(url, data, config);
      return response.data;
    } catch (error) {
      return this.handleError<T>(error);
    }
  }

  /**
   * PUT isteği gönder
   */
  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.api.put<T>(url, data, config);
      return response.data;
    } catch (error) {
      return this.handleError<T>(error);
    }
  }

  /**
   * PATCH isteği gönder
   */
  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.api.patch<T>(url, data, config);
      return response.data;
    } catch (error) {
      return this.handleError<T>(error);
    }
  }

  /**
   * DELETE isteği gönder
   */
  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.api.delete<T>(url, config);
      return response.data;
    } catch (error) {
      return this.handleError<T>(error);
    }
  }
  
  /**
   * Hata işleme
   */
  private handleError<T>(error: any): Promise<T> {
    // Test modunda ise ve url "/auth/" ile başlıyorsa, mock yanıt döndür
    if (getTestMode() && error.config?.url && error.config.url.includes('/auth/')) {
      console.log('Test modu aktif, auth hatası simüle ediliyor:', error.config.url);
      
      // Mock auth yanıtı
      if (error.config.url.includes('/auth/me')) {
        return Promise.resolve({
          id: 'test-user',
          username: 'test_user',
          first_name: 'Test',
          last_name: 'User'
        } as unknown as T);
      }
    }
    
    // Hatayı tekrar fırlat
    return Promise.reject(error);
  }
}

export const apiService = new ApiService(); 