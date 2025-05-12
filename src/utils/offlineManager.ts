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
}

class OfflineManager {
  private pendingRequests: PendingRequest[] = [];
  private requestStatuses: Map<string, RequestStatus> = new Map();
  private isOnline: boolean = navigator.onLine;
  private isSyncing: boolean = false;
  private syncTimer: number | null = null;
  private listeners: Map<string, Set<Function>> = new Map();
  
  private config: OfflineManagerConfig = {
    queueStorageKey: 'offline_request_queue',
    maxQueueSize: 100,
    maxRetries: 3,
    defaultPriority: 'normal',
    retryDelayMs: 5000,
    autoSync: true,
    debug: false
  };
  
  constructor(config?: Partial<OfflineManagerConfig>) {
    // Yapılandırmayı güncelle
    if (config) {
      this.config = { ...this.config, ...config };
    }
    
    // Bağlantı durumu değişikliklerini dinle
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline);
      window.addEventListener('offline', this.handleOffline);
    }
    
    // LocalStorage'dan bekleyen istekleri yükle
    this.loadPendingRequests();
    
    this.log('OfflineManager başlatıldı');
  }
  
  /**
   * Uygulamanın çevrimiçi olup olmadığını kontrol eder
   */
  isNetworkOnline(): boolean {
    return this.isOnline;
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
    if (this.isOnline && this.config.autoSync) {
      this.syncPendingRequests();
    }
    
    return id;
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
    if (!this.isOnline) {
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
        if (!this.isOnline) {
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
          // Fetch API ile isteği gönder
          const response = await fetch(request.url, {
            method: request.method,
            headers: request.headers,
            body: request.body ? JSON.stringify(request.body) : undefined,
            cache: 'no-cache',
            credentials: 'same-origin'
          });
          
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
    
    // Otomatik senkronizasyon etkinse senkronize et
    if (this.config.autoSync && this.pendingRequests.length > 0) {
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

// Singleton örneği
export const offlineManager = new OfflineManager({
  debug: false,
  autoSync: true,
  maxRetries: 5
});

export default offlineManager; 