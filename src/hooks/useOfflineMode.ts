import { useState, useEffect, useCallback } from 'react';
import offlineManager, { RequestType } from '../utils/offlineManager';
import cacheManager from '../utils/cacheManager';

/**
 * Çevrimdışı mod ile ilgili bilgileri ve işlevleri sunan hook
 */
export const useOfflineMode = () => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [pendingRequestCount, setPendingRequestCount] = useState<number>(offlineManager.getPendingCount());
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncStats, setSyncStats] = useState<{ success: number; failed: number }>({ success: 0, failed: 0 });
  
  /**
   * Bağlantı durumunu ve bekleyen istek sayısını güncelleme
   */
  const updateConnectionStatus = useCallback(() => {
    setIsOnline(navigator.onLine);
    setPendingRequestCount(offlineManager.getPendingCount());
  }, []);
  
  /**
   * Çevrimdışı modda çalışabilen API isteği gönderme fonksiyonu
   */
  const fetchWithOfflineSupport = useCallback(async <T>(
    url: string,
    options: {
      method?: RequestType;
      body?: any;
      headers?: Record<string, string>;
      offlineOptions?: {
        cacheDuration?: number;
        priority?: 'low' | 'normal' | 'high' | 'critical';
        skipOfflineQueue?: boolean;
      };
    } = {}
  ): Promise<T> => {
    const method = options.method || RequestType.GET;
    const isReadOperation = method === RequestType.GET;
    const offlineOptions = options.offlineOptions || {};
    
    // Önbelleğe alma süresi (varsayılan: 1 saat)
    const cacheDuration = offlineOptions.cacheDuration !== undefined ? 
      offlineOptions.cacheDuration : 60 * 60 * 1000;
    
    // İstek URL'inden endpoint adını çıkar
    const endpoint = url.replace(/^https?:\/\/[^/]+\/api\//, '').replace(/\?.*$/, '');
    
    // GET isteği için önbelleği kontrol et
    if (isReadOperation) {
      const cachedData = cacheManager.getApiCache<T>(endpoint);
      
      // Önbellekte varsa ve çevrimdışıysa veya skipOfflineQueue ayarlanmışsa doğrudan kullan
      if (cachedData && (!navigator.onLine || offlineOptions.skipOfflineQueue)) {
        return cachedData;
      }
    }
    
    // Çevrimiçi ise normal istek gönder
    if (navigator.onLine) {
      try {
        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            ...options.headers
          },
          body: options.body ? JSON.stringify(options.body) : undefined
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json() as T;
        
        // GET isteği sonucunu önbelleğe al
        if (isReadOperation && cacheDuration > 0) {
          cacheManager.setApiCache(endpoint, data, {}, {
            expiry: cacheDuration,
            priority: offlineOptions.priority || 'normal'
          });
        }
        
        return data;
      } catch (error) {
        // Ağ hatası durumunda, çevrimdışı modda devam et
        console.error(`API isteği başarısız oldu (${url}):`, error);
        
        // GET isteği ve önbellekte varsa önbellekten al
        if (isReadOperation) {
          const cachedData = cacheManager.getApiCache<T>(endpoint);
          if (cachedData) {
            console.log(`Önbellekteki veri kullanılıyor: ${endpoint}`);
            return cachedData;
          }
        }
        
        throw error;
      }
    } else {
      // Çevrimdışı: GET istekleri için önbellekten veri al, diğerleri için kuyruğa ekle
      if (isReadOperation) {
        const cachedData = cacheManager.getApiCache<T>(endpoint);
        
        if (cachedData) {
          return cachedData;
        }
        
        throw new Error(`Çevrimdışı: ${endpoint} için önbellekte veri yok`);
      } else {
        // Kuyruğa eklenmemesi isteniyorsa hata fırlat
        if (offlineOptions.skipOfflineQueue) {
          throw new Error('Çevrimdışı: İstek kuyruğa eklenmedi');
        }
        
        // Yazma isteklerini kuyruğa ekle
        const requestId = offlineManager.enqueueRequest(url, method, {
          body: options.body,
          headers: options.headers,
          priority: offlineOptions.priority || 'normal'
        });
        
        // Kullanıcıya istek kuyruğa eklendiğini bildir
        console.log(`İstek çevrimdışı kuyruğa eklendi (${requestId}): ${method} ${url}`);
        
        // Bekleyen istek sayısını güncelle
        setPendingRequestCount(offlineManager.getPendingCount());
        
        // İsteklerin sırasıyla işleneceğini belirten bir yanıt döndür
        throw new Error(`Çevrimdışı: İstek kuyruğa eklendi (${requestId})`);
      }
    }
  }, []);
  
  /**
   * Bekleyen istekleri manuel olarak senkronize et
   */
  const syncPendingRequests = useCallback(async () => {
    if (isSyncing || !navigator.onLine) return;
    
    setIsSyncing(true);
    
    try {
      const results = await offlineManager.syncPendingRequests();
      setSyncStats(results);
      setPendingRequestCount(offlineManager.getPendingCount());
      return results;
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing]);
  
  /**
   * Bekleyen tüm istekleri temizle
   */
  const clearPendingRequests = useCallback(() => {
    offlineManager.clearPendingRequests();
    setPendingRequestCount(0);
  }, []);
  
  /**
   * Önbelleği temizle
   */
  const clearCache = useCallback(() => {
    cacheManager.clear();
  }, []);
  
  /**
   * Önbellek istatistiklerini al
   */
  const getCacheStats = useCallback(() => {
    return cacheManager.getStats();
  }, []);
  
  // Çevrimiçi/çevrimdışı olaylarını dinle
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
    };
    
    const handleOffline = () => {
      setIsOnline(false);
    };
    
    // OfflineManager olaylarını dinle
    const requestQueuedUnsubscribe = offlineManager.on('requestQueued', () => {
      setPendingRequestCount(offlineManager.getPendingCount());
    });
    
    const syncCompletedUnsubscribe = offlineManager.on('syncCompleted', (results: { success: number; failed: number }) => {
      setSyncStats(results);
      setPendingRequestCount(offlineManager.getPendingCount());
    });
    
    // Tarayıcı olaylarını dinle
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Periyodik olarak bekleyen istek sayısını güncelle
    const statusUpdateInterval = setInterval(updateConnectionStatus, 30000);
    
    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      // OfflineManager dinleyicilerini kaldır
      requestQueuedUnsubscribe();
      syncCompletedUnsubscribe();
      
      clearInterval(statusUpdateInterval);
    };
  }, [updateConnectionStatus]);
  
  return {
    isOnline,
    pendingRequestCount,
    isSyncing,
    syncStats,
    fetchWithOfflineSupport,
    syncPendingRequests,
    clearPendingRequests,
    clearCache,
    getCacheStats
  };
};

export default useOfflineMode; 