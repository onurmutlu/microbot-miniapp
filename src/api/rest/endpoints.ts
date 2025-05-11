import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { getTestMode } from '../../utils/testMode';
import { toast } from 'react-toastify';
import { getApiUrl } from '../../utils/env';

// Mock veri
import mockGroupInsights from '../../mocks/groupInsights';
import mockMessageOptimization from '../../mocks/messageOptimization';
import mockSystemHealth from '../../mocks/systemHealth';
import mockCacheStats from '../../mocks/cacheStats';

// API URL'i env.ts'deki fonksiyondan alınıyor
const API_URL = getApiUrl();

// API yanıt tipi için arayüz
interface ApiErrorResponse {
  message?: string;
  error?: string;
  status?: number;
  statusText?: string;
}

// API istemcisi oluştur
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // 15 saniye zaman aşımı
});

// İstek interceptor'ı - tüm isteklere token ekle
apiClient.interceptors.request.use(
  (config) => {
    // Test modunda ise ve mock veri varsa axios isteğini yapmadan önce kontrol et
    if (getTestMode() && config.url) {
      console.info(`[Test Modu] API isteği yapılıyor: ${config.method?.toUpperCase()} ${config.url}`);
    }
    
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('API istek hatası:', error);
    return Promise.reject(error);
  }
);

// Yanıt interceptor'ı - hataları işle
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const { response, request, message } = error;
    
    // Test modunda ise ve belirli istekler için mock veri dön
    if (getTestMode() && request && request.responseURL) {
      const url = request.responseURL;
      
      // Mock veri kontrolü
      if (url.includes('/v1/ai/group-insights')) {
        console.info('[Test Modu] Mock grup içgörüleri döndürülüyor');
        return Promise.resolve({ data: mockGroupInsights });
      }
      
      if (url.includes('/v1/ai/optimize-message')) {
        console.info('[Test Modu] Mock mesaj optimizasyonu döndürülüyor');
        return Promise.resolve({ data: mockMessageOptimization });
      }
      
      if (url.includes('/health')) {
        console.info('[Test Modu] Mock sistem durumu döndürülüyor');
        return Promise.resolve({ data: mockSystemHealth });
      }
      
      if (url.includes('/v1/system/cache-stats')) {
        console.info('[Test Modu] Mock önbellek istatistikleri döndürülüyor');
        return Promise.resolve({ data: mockCacheStats });
      }
    }
    
    // Gerçek hata işleme
    if (response) {
      // Sunucu yanıtı varsa
      console.error(`API Hatası: ${response.status} - ${response.statusText}`, response.data);
      
      // 401 Unauthorized hatasında kullanıcıyı çıkış yaptır
      if (response.status === 401) {
        localStorage.removeItem('access_token');
        // Sayfa yenileme yerine daha zarif bir çözüm kullanılabilir
        window.location.href = '/login';
      }
      
      // Kullanıcıya hata mesajını göster
      const errorData = response.data as ApiErrorResponse;
      const errorMessage = errorData?.message || errorData?.error || `Hata: ${response.status} ${response.statusText}`;
      toast.error(errorMessage);
    } else if (request) {
      // İstek yapıldı ama yanıt alınamadı (ağ hatası)
      console.error('Ağ hatası, sunucuya erişilemiyor.', error);
      toast.error('Sunucuya bağlanılamıyor. Lütfen internet bağlantınızı kontrol edin.');
    } else {
      // İstek oluşturulurken bir hata oluştu
      console.error('İstek oluşturma hatası:', message);
      toast.error('Bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
    }
    
    return Promise.reject(error);
  }
);

// API içerik optimize etme fonksiyonu için parametre tipi
interface OptimizeMessageParams {
  message: string;
  group_id: number;
}

export const aiService = {
  // Grup içgörülerini getir
  getGroupInsights: async (groupId: number) => {
    try {
      const response = await apiClient.get(`/v1/ai/group-insights/${groupId}`);
      return response.data;
    } catch (error) {
      console.error('Grup içgörüleri alınamadı:', error);
      // Test modunda hata durumunda mock veri dön
      if (getTestMode()) {
        return mockGroupInsights;
      }
      throw error;
    }
  },

  // Mesaj optimizasyonu
  optimizeMessage: async (message: string, groupId: number) => {
    const data: OptimizeMessageParams = {
      message,
      group_id: groupId,
    };
    
    try {
      const response = await apiClient.post('/v1/ai/optimize-message', data);
      return response.data;
    } catch (error) {
      console.error('Mesaj optimizasyonu başarısız:', error);
      // Test modunda hata durumunda mock veri dön
      if (getTestMode()) {
        return mockMessageOptimization;
      }
      throw error;
    }
  },

  // Toplu analiz
  batchAnalyze: async (messages: string[], groupId: number) => {
    try {
      const response = await apiClient.post('/v1/ai/batch-analyze', {
        messages,
        group_id: groupId,
      });
      return response.data;
    } catch (error) {
      console.error('Toplu analiz başarısız:', error);
      throw error;
    }
  }
};

export const systemService = {
  // Sistem durumunu kontrol et
  checkHealth: async () => {
    try {
      const response = await apiClient.get('/health');
      return response.data;
    } catch (error) {
      console.error('Sistem durumu kontrol edilemedi:', error);
      // Test modunda hata durumunda mock veri dön
      if (getTestMode()) {
        return mockSystemHealth;
      }
      throw error;
    }
  },
  
  // Redis önbellek istatistiklerini getir
  getCacheStats: async () => {
    try {
      const response = await apiClient.get('/v1/system/cache-stats');
      return response.data;
    } catch (error) {
      console.error('Önbellek istatistikleri alınamadı:', error);
      // Test modunda hata durumunda mock veri dön
      if (getTestMode()) {
        return mockCacheStats;
      }
      throw error;
    }
  },
  
  // Prometheus metriklerini getir
  getPrometheusMetrics: async () => {
    try {
      const response = await apiClient.get('/metrics');
      return response.data;
    } catch (error) {
      console.error('Prometheus metrikleri alınamadı:', error);
      throw error;
    }
  }
}; 