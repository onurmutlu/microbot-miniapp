/**
 * OfflineManager: Çevrimdışı mod için veri senkronizasyon ve yönetim sistemi
 * 
 * CacheManager ile entegre çalışarak, çevrimdışıyken yapılan işlemleri kaydeder
 * ve tekrar çevrimiçi olunduğunda bu işlemleri senkronize eder.
 */

import cacheManager from './cacheManager';

// İstek türlerini tanımla
export enum RequestType {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
  PATCH = 'PATCH'
}

// Bekleyen istek bilgisi için tip
export interface PendingRequest {
  id: string;
  timestamp: number;
  url: string;
  method: RequestType;
  body?: any;
  headers?: Record<string, string>;
  priority: 'low' | 'normal' | 'high' | 'critical';
  retries: number;
  maxRetries: number;
  syncOnReconnect: boolean;
  metadata?: Record<string, any>;
}

// İşlemdeki istekler için durum
export interface RequestStatus {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  attempts: number;
  lastAttempt: number | null;
  error?: any;
}

// Offline yönetici için ayarlar
interface OfflineManagerConfig {
  queueStorageKey: string;
  maxQueueSize: number;
  maxRetries: number;
  defaultPriority: 'low' | 'normal' | 'high' | 'critical';
  retryDelayMs: number;
  autoSync: boolean;
  debug: boolean;
  // API sunucusu ile ilgili ayarlar
  apiHealthCheck: {
    enabled: boolean;        // Sunucu sağlık kontrolünü etkinleştir/devre dışı bırak
    endpoint: string;        // Kontrol edilecek endpoint
    intervalMs: number;      // Kontrol aralığı
    timeoutMs: number;       // İstek zaman aşımı
    maxFailedAttempts: number; // Sunucunun çevrimdışı sayılması için gereken ardışık başarısız deneme sayısı
  }
}

class OfflineManager {
  private pendingRequests: PendingRequest[] = [];
  private requestStatuses: Map<string, RequestStatus> = new Map();
  private isOnline: boolean = navigator.onLine;
  private isSyncing: boolean = false;
  private syncTimer: number | null = null;
  private listeners: Map<string, Set<Function>> = new Map();
  private healthCheckTimer: number | null = null;
  private failedHealthChecks: number = 0;
  private isServerAvailable: boolean = true; // Sunucunun ulaşılabilir olup olmadığı
  
  private config: OfflineManagerConfig = {
    queueStorageKey: 'offline_request_queue',
    maxQueueSize: 100,
    maxRetries: 3,
    defaultPriority: 'normal',
    retryDelayMs: 5000,
    autoSync: true,
    debug: false,
    apiHealthCheck: {
      enabled: true,
      endpoint: '/health',
      intervalMs: 30000,       // 30 saniye
      timeoutMs: 5000,         // 5 saniye
      maxFailedAttempts: 3     // 3 başarısız deneme sonrası sunucu çevrimdışı kabul edilir
    }
  };
  
  constructor(config?: Partial<OfflineManagerConfig>) {
    // Yapılandırmayı güncelle
    if (config) {
      this.config = { 
        ...this.config, 
        ...config,
        apiHealthCheck: {
          ...this.config.apiHealthCheck,
          ...(config.apiHealthCheck || {})
        }
      };
    }
    
    // Bağlantı durumu değişikliklerini dinle
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline);
      window.addEventListener('offline', this.handleOffline);
    }
    
    // LocalStorage'dan bekleyen istekleri yükle
    this.loadPendingRequests();
    
    // API sunucu sağlık kontrolünü başlat
    if (this.config.apiHealthCheck.enabled) {
      this.startApiHealthCheck();
    }
    
    this.log('OfflineManager başlatıldı');
  }
  
  /**
   * Uygulamanın çevrimiçi olup olmadığını kontrol eder
   * Hem cihaz ağ durumunu hem de API sunucusunun durumunu dikkate alır
   */
  isNetworkOnline(): boolean {
    return this.isOnline && this.isServerAvailable;
  }
  
  /**
   * Sadece cihazın ağ bağlantısı durumunu kontrol eder
   */
  isDeviceOnline(): boolean {
    return this.isOnline;
  }
  
  /**
   * API sunucusunun durumunu döndürür
   */
  isApiServerAvailable(): boolean {
    return this.isServerAvailable;
  }
  
  /**
   * API sunucusu sağlık kontrolü yapmaya başlar
   */
  private startApiHealthCheck(): void {
    this.stopApiHealthCheck(); // Önceki zamanlayıcıyı temizle
    
    // İlk kontrolü hemen yap
    this.checkApiHealth();
    
    // Düzenli aralıklarla kontrol et
    this.healthCheckTimer = window.setInterval(() => {
      this.checkApiHealth();
    }, this.config.apiHealthCheck.intervalMs);
  }
  
  /**
   * API sağlık kontrolünü durdurur
   */
  private stopApiHealthCheck(): void {
    if (this.healthCheckTimer !== null) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
    }
  }
  
  /**
   * API sunucusunun durumunu kontrol eder
   */
  private async checkApiHealth(): Promise<boolean> {
    if (!this.isOnline) {
      // Cihaz çevrimdışıysa API kontrolü yapmaya gerek yok
      this.isServerAvailable = false;
      return false;
    }
    
    try {
      // API sunucusunu kontrol et - baseURL'i URL'den çıkar
      const baseUrl = this.getBaseUrl();
      const endpoint = this.config.apiHealthCheck.endpoint;
      const url = `${baseUrl}${endpoint}`;
      
      this.log(`API sağlık kontrolü yapılıyor: ${url}`);
      
      // AbortController ile timeout belirle
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.apiHealthCheck.timeoutMs);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: controller.signal,
        cache: 'no-store'
      });
      
      // Timeout kontrol zamanını temizle
      clearTimeout(timeoutId);
      
      // Başarılı yanıt kontrolü
      if (response.ok) {
        this.failedHealthChecks = 0;
        
        // Eğer sunucu durumu değiştiyse
        if (!this.isServerAvailable) {
          this.isServerAvailable = true;
          this.emit('serverAvailable');
          this.log('API sunucusu tekrar kullanılabilir durumda');
          
          // Sunucu tekrar çalışır durumda, bekleyen istekleri senkronize et
          if (this.config.autoSync && this.pendingRequests.length > 0) {
            setTimeout(() => {
              this.syncPendingRequests();
            }, 2000); // Sunucu bağlantısının stabil olması için biraz bekle
          }
        }
        
        return true;
      } else {
        this.handleApiHealthCheckFailure(`HTTP Hata: ${response.status}`);
        return false;
      }
    } catch (error) {
      this.handleApiHealthCheckFailure(
        error instanceof Error ? error.message : 'Bilinmeyen bir hata oluştu'
      );
      return false;
    }
  }
  
  /**
   * API sağlık kontrolü başarısız olduğunda çağrılır
   */
  private handleApiHealthCheckFailure(error: string): void {
    this.failedHealthChecks++;
    this.log(`API sağlık kontrolü başarısız (${this.failedHealthChecks}/${this.config.apiHealthCheck.maxFailedAttempts}): ${error}`);
    
    // Maksimum başarısız deneme sayısını aştıysa sunucuyu çevrimdışı say
    if (this.failedHealthChecks >= this.config.apiHealthCheck.maxFailedAttempts) {
      if (this.isServerAvailable) {
        this.isServerAvailable = false;
        this.emit('serverUnavailable');
        this.log('API sunucusu ulaşılamaz durumda, çevrimdışı moda geçiliyor');
      }
    }
  }
  
  /**
   * İstek URL'inden base URL'i çıkarır
   */
  private getBaseUrl(): string {
    // Eğer bekleyen istek varsa, onun URL'inden base URL'i çıkar
    if (this.pendingRequests.length > 0) {
      const url = new URL(this.pendingRequests[0].url);
      return `${url.protocol}//${url.host}`;
    }
    
    // Yoksa sayfanın URL'inden kur
    return window.location.origin;
  }
  
  /**
   * Bekleyen istek kuyruğunda kaç istek olduğunu döndürür
   */
  getPendingCount(): number {
    return this.pendingRequests.length;
  }
  
  /**
   * Bekleyen tüm isteklerin durumunu döndürür
   */
  getRequestStatuses(): RequestStatus[] {
    return Array.from(this.requestStatuses.values());
  }
  
  /**
   * Bekleyen bir istek oluşturur
   */
  enqueueRequest(
    url: string,
    method: RequestType,
    options: {
      body?: any;
      headers?: Record<string, string>;
      priority?: 'low' | 'normal' | 'high' | 'critical';
      maxRetries?: number;
      syncOnReconnect?: boolean;
      metadata?: Record<string, any>;
    } = {}
  ): string {
    // Kuyruk boyutunu kontrol et
    if (this.pendingRequests.length >= this.config.maxQueueSize) {
      this.log('Kuyruk dolu, düşük öncelikli istekler kaldırılıyor');
      this.cleanupLowPriorityRequests();
    }
    
    // Yine de dolu ise hata fırlat
    if (this.pendingRequests.length >= this.config.maxQueueSize) {
      throw new Error('İstek kuyruğu dolu, lütfen daha sonra tekrar deneyin');
    }
    
    // ID oluştur
    const id = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const request: PendingRequest = {
      id,
      timestamp: Date.now(),
      url,
      method,
      body: options.body,
      headers: options.headers,
      priority: options.priority || this.config.defaultPriority,
      retries: 0,
      maxRetries: options.maxRetries !== undefined ? options.maxRetries : this.config.maxRetries,
      syncOnReconnect: options.syncOnReconnect !== undefined ? options.syncOnReconnect : true,
      metadata: options.metadata
    };
    
    // İsteği kuyruğa ekle
    this.pendingRequests.push(request);
    this.updateRequestStatus(id, { status: 'pending', attempts: 0, lastAttempt: null });
    
    // LocalStorage'a kaydet
    this.savePendingRequests();
    
    // Olay dinleyicilere bildir
    this.emit('requestQueued', { request });
    
    this.log(`İstek kuyruğa eklendi: ${id} - ${method} ${url}`);
    
    // Çevrimiçiyse ve otomatik senkronizasyon etkinse hemen senkronize et
    if (this.isNetworkOnline() && this.config.autoSync) {
      this.syncPendingRequests();
    }
    
    return id;
  }
  
  /**
   * İsteği hemen yapan ancak başarısız olursa kuyruğa ekleyen yardımcı metod
   */
  async immediateOrQueue<T = any>(
    url: string,
    method: RequestType,
    options: {
      body?: any;
      headers?: Record<string, string>;
      priority?: 'low' | 'normal' | 'high' | 'critical'; 
      parseResponse?: (response: Response) => Promise<T>;
      fallbackValue?: T;
    } = {}
  ): Promise<T> {
    // Eğer çevrimiçi değilse, hemen kuyruğa ekle ve fallback değeri döndür
    if (!this.isNetworkOnline()) {
      const requestId = this.enqueueRequest(url, method, {
        body: options.body,
        headers: options.headers,
        priority: options.priority
      });
      
      if (options.fallbackValue !== undefined) {
        return options.fallbackValue;
      }
      
      throw new Error(`Çevrimdışı: İstek kuyruğa eklendi (${requestId})`);
    }
    
    // Çevrimiçiyse, isteği hemen yapmayı dene
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
      
      // Yanıtı işle
      if (options.parseResponse) {
        return await options.parseResponse(response);
      } else {
        return await response.json() as T;
      }
    } catch (error) {
      // İstek başarısız oldu, kuyruğa ekle ve fallback değeri döndür (varsa)
      this.log(`Anlık istek başarısız, kuyruğa ekleniyor: ${method} ${url}`, error);
      
      const requestId = this.enqueueRequest(url, method, {
        body: options.body,
        headers: options.headers,
        priority: options.priority || 'high' // Anlık istekler daha yüksek öncelikli
      });
      
      if (options.fallbackValue !== undefined) {
        return options.fallbackValue;
      }
      
      throw new Error(`İstek başarısız, kuyruğa eklendi (${requestId}): ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Belli bir isteği kuyruktan kaldırır
   */
  removeRequest(id: string): boolean {
    const initialLength = this.pendingRequests.length;
    
    this.pendingRequests = this.pendingRequests.filter(request => request.id !== id);
    this.requestStatuses.delete(id);
    
    // Değişiklik olduysa kaydet
    if (initialLength !== this.pendingRequests.length) {
      this.savePendingRequests();
      this.emit('requestRemoved', { id });
      this.log(`İstek kuyruktan kaldırıldı: ${id}`);
      return true;
    }
    
    return false;
  }
  
  /**
   * Bekleyen tüm istekleri temizler
   */
  clearPendingRequests(): void {
    if (this.pendingRequests.length === 0) return;
    
    this.pendingRequests = [];
    this.requestStatuses.clear();
    this.savePendingRequests();
    
    this.emit('queueCleared');
    this.log('Tüm bekleyen istekler temizlendi');
  }
  
  /**
   * Bekleyen istekleri senkronize etmeye çalışır
   */
  async syncPendingRequests(): Promise<{ success: number; failed: number }> {
    if (!this.isNetworkOnline()) {
      this.log('Çevrimdışı - senkronizasyon atlanıyor');
      return { success: 0, failed: 0 };
    }
    
    if (this.isSyncing) {
      this.log('Senkronizasyon zaten devam ediyor');
      return { success: 0, failed: 0 };
    }
    
    // Senkronize edilecek istekler yoksa
    if (this.pendingRequests.length === 0) {
      this.log('Senkronize edilecek bekleyen istek yok');
      return { success: 0, failed: 0 };
    }
    
    this.isSyncing = true;
    this.emit('syncStarted', { requestCount: this.pendingRequests.length });
    this.log(`${this.pendingRequests.length} istek senkronize ediliyor`);
    
    const results = { success: 0, failed: 0 };
    
    try {
      // Öncelik sırasına göre sırala
      const priorityOrder = { 'critical': 3, 'high': 2, 'normal': 1, 'low': 0 };
      
      const prioritizedRequests = [...this.pendingRequests].sort((a, b) => {
        // Önce önceliğe göre (yüksek → düşük)
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        
        // Sonra zaman damgasına göre (eski → yeni)
        return a.timestamp - b.timestamp;
      });
      
      // Her bir isteği sırayla işle
      for (const request of prioritizedRequests) {
        // Senkronizasyon sırasında çevrimdışına geçildiyse dur
        if (!this.isNetworkOnline()) {
          this.log('Senkronizasyon sırasında çevrimdışına geçildi, işlem durduruluyor');
          break;
        }
        
        this.updateRequestStatus(request.id, { 
          status: 'processing',
          attempts: request.retries + 1,
          lastAttempt: Date.now()
        });
        
        this.emit('requestProcessing', { request });
        
        try {
          // AbortController ile timeout belirle
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 saniye timeout
          
          // Fetch API ile isteği gönder
          const response = await fetch(request.url, {
            method: request.method,
            headers: request.headers,
            body: request.body ? JSON.stringify(request.body) : undefined,
            cache: 'no-cache',
            credentials: 'same-origin',
            signal: controller.signal
          });
          
          // Timeout kontrol zamanını temizle
          clearTimeout(timeoutId);
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          // Başarılı istekleri kuyruktan kaldır
          this.removeRequest(request.id);
          this.emit('requestSynced', { request, result: 'success' });
          results.success++;
          
          this.log(`İstek başarıyla senkronize edildi: ${request.id}`);
        } catch (error) {
          request.retries++;
          
          // Maksimum yeniden deneme sayısını aştı mı kontrol et
          if (request.retries >= request.maxRetries) {
            this.updateRequestStatus(request.id, { 
              status: 'failed', 
              error: error instanceof Error ? error.message : String(error)
            });
            
            // Başarısız istekleri de kuyruktan kaldır
            this.removeRequest(request.id);
            this.emit('requestSynced', { request, result: 'failed', error });
            results.failed++;
            
            this.log(`İstek senkronizasyonu başarısız oldu (maksimum deneme): ${request.id}`, error);
          } else {
            this.updateRequestStatus(request.id, { 
              status: 'pending',
              error: error instanceof Error ? error.message : String(error)
            });
            
            this.emit('requestRetryScheduled', { request, error });
            this.log(`İstek tekrar denenecek (${request.retries}/${request.maxRetries}): ${request.id}`, error);
          }
          
          // Eğer bir istekte hata alındıysa, API sağlık kontrolü yap
          if (this.config.apiHealthCheck.enabled) {
            setTimeout(() => this.checkApiHealth(), 1000);
          }
        }
      }
      
      // Bekleyen istekleri güncelle
      this.savePendingRequests();
    } catch (error) {
      this.log('Senkronizasyon sırasında hata oluştu', error);
    } finally {
      this.isSyncing = false;
      this.emit('syncCompleted', results);
      this.log(`Senkronizasyon tamamlandı: ${results.success} başarılı, ${results.failed} başarısız`);
    }
    
    return results;
  }
  
  /**
   * Düşük öncelikli istekleri temizler
   */
  private cleanupLowPriorityRequests(): number {
    const initialCount = this.pendingRequests.length;
    
    // Önce 'low' öncelikli olanları kaldır
    this.pendingRequests = this.pendingRequests.filter(request => {
      if (request.priority === 'low') {
        this.requestStatuses.delete(request.id);
        return false;
      }
      return true;
    });
    
    // Hala çok fazla istek varsa, 'normal' öncelikli olanları da kaldırmaya başla
    if (this.pendingRequests.length >= this.config.maxQueueSize * 0.9) {
      this.pendingRequests = this.pendingRequests.filter(request => {
        if (request.priority === 'normal') {
          this.requestStatuses.delete(request.id);
          return false;
        }
        return true;
      });
    }
    
    const removedCount = initialCount - this.pendingRequests.length;
    
    if (removedCount > 0) {
      this.savePendingRequests();
      this.log(`${removedCount} düşük öncelikli istek kaldırıldı`);
    }
    
    return removedCount;
  }
  
  /**
   * Olay dinleyici ekler
   */
  on(event: string, callback: Function): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    
    this.listeners.get(event)!.add(callback);
    
    // Dinlemeyi durdurmak için fonksiyon döndür
    return () => {
      const eventListeners = this.listeners.get(event);
      if (eventListeners) {
        eventListeners.delete(callback);
      }
    };
  }
  
  /**
   * Olay yayınlar
   */
  private emit(event: string, data?: any): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`OfflineManager olay işleyicisinde hata: ${event}`, error);
        }
      });
    }
  }
  
  /**
   * İstek durumunu günceller
   */
  private updateRequestStatus(id: string, update: Partial<RequestStatus>): void {
    const current = this.requestStatuses.get(id) || {
      id,
      status: 'pending',
      attempts: 0,
      lastAttempt: null
    };
    
    this.requestStatuses.set(id, { ...current, ...update });
  }
  
  /**
   * Bekleyen istekleri localStorage'a kaydeder
   */
  private savePendingRequests(): void {
    try {
      localStorage.setItem(this.config.queueStorageKey, JSON.stringify(this.pendingRequests));
    } catch (error) {
      console.error('Bekleyen istekler kaydedilirken hata oluştu:', error);
    }
  }
  
  /**
   * localStorage'dan bekleyen istekleri yükler
   */
  private loadPendingRequests(): void {
    try {
      const savedRequests = localStorage.getItem(this.config.queueStorageKey);
      
      if (savedRequests) {
        this.pendingRequests = JSON.parse(savedRequests);
        
        // İstek durumlarını oluştur
        this.pendingRequests.forEach(request => {
          this.updateRequestStatus(request.id, { 
            status: 'pending',
            attempts: request.retries,
            lastAttempt: null
          });
        });
        
        this.log(`${this.pendingRequests.length} bekleyen istek yüklendi`);
      }
    } catch (error) {
      console.error('Bekleyen istekler yüklenirken hata oluştu:', error);
      this.pendingRequests = [];
    }
  }
  
  /**
   * Çevrimiçine geçince tetiklenir
   */
  private handleOnline = (): void => {
    this.isOnline = true;
    this.log('Çevrimiçi moda geçildi');
    
    this.emit('online');
    
    // API sağlık kontrolü yap
    if (this.config.apiHealthCheck.enabled) {
      this.checkApiHealth();
    }
    
    // Otomatik senkronizasyon etkinse senkronize et
    if (this.config.autoSync && this.pendingRequests.length > 0 && this.isServerAvailable) {
      this.log('Çevrimiçine geçildi, bekleyen istekler senkronize ediliyor');
      
      // Biraz bekleyip senkronize et (ağ bağlantısının stabil olmasını sağlar)
      setTimeout(() => {
        this.syncPendingRequests();
      }, 2000);
    }
  };
  
  /**
   * Çevrimdışına geçince tetiklenir
   */
  private handleOffline = (): void => {
    this.isOnline = false;
    this.log('Çevrimdışı moda geçildi');
    
    this.emit('offline');
    
    // Senkronizasyon işlemi varsa iptal et
    if (this.isSyncing) {
      this.isSyncing = false;
      this.log('Senkronizasyon işlemi çevrimdışı olunduğu için iptal edildi');
    }
  };
  
  /**
   * API sağlık durumunu manuel olarak kontrol eder 
   * (kullanıcı aksiyon tetiklemesi için)
   */
  async checkServerAvailability(): Promise<boolean> {
    return await this.checkApiHealth();
  }
  
  /**
   * Kaynakları temizler
   */
  dispose(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleOnline);
      window.removeEventListener('offline', this.handleOffline);
    }
    
    if (this.syncTimer !== null) {
      clearTimeout(this.syncTimer);
      this.syncTimer = null;
    }
    
    this.stopApiHealthCheck();
    
    this.listeners.clear();
    this.log('OfflineManager kaynakları temizlendi');
  }
  
  /**
   * Debug log
   */
  private log(message: string, ...args: any[]): void {
    if (this.config.debug) {
      console.log(`[OfflineManager] ${message}`, ...args);
    }
  }
}

// Singleton örneği - daha akıllı ve dayanıklı
export const offlineManager = new OfflineManager({
  debug: true, // Geliştirme aşamasında debug etkin
  autoSync: true,
  maxRetries: 5,
  apiHealthCheck: {
    enabled: true,
    endpoint: '/health',  // Sağlık kontrol endpoint'i
    intervalMs: 60000,    // 1 dakika
    timeoutMs: 5000,      // 5 saniye timeout süresi
    maxFailedAttempts: 2  // 2 başarısız deneme sonrası sunucu çevrimdışı
  }
});

export default offlineManager; 