/**
 * CacheManager: Offline mod için gelişmiş önbellek yönetim sistemi
 * API çağrıları, SSE mesajları ve WebSocket mesajları için önbellek mekanizması sağlar
 */

// Önbelleğe alınabilecek veri türü tanımlaması
export type CacheableData = {
  key: string;
  data: any;
  timestamp: number;
  expiry?: number; // Milisaniye cinsinden son kullanma süresi, yoksa süresiz
  tags?: string[]; // Etiketlere göre arama ve temizleme için
  priority?: 'low' | 'normal' | 'high' | 'critical'; // Öncelik seviyesi
  readonly?: boolean; // Salt okunur önbellek öğesi mi? (Sistem tarafından yönetilen veriler için)
  metadata?: Record<string, any>; // Ek veriler
};

// Önbellek ayarları
interface CacheSettings {
  enabled: boolean;
  maxSize: number; // Maksimum önbellek öğe sayısı
  defaultExpiry: number; // ms cinsinden varsayılan süre
  cleanupInterval: number; // ms cinsinden temizleme aralığı 
  diskMode: boolean; // localStorage veya IndexedDB kullanımı
  encryptionEnabled: boolean; // Hassas verileri şifrelemek için
  debug: boolean; // Debug modunda detaylı log bilgisi
}

// Önbellek istatistikleri
interface CacheStats {
  totalItems: number;
  hitCount: number;
  missCount: number;
  totalSize: number; // Byte cinsinden
  oldestItemAge: number; // ms cinsinden
  newestItemAge: number; // ms cinsinden
  averageAccessTime: number; // ms cinsinden
  lastCleanupTime: number | null;
}

class CacheManager {
  private cache: Map<string, CacheableData> = new Map();
  private hitCount = 0;
  private missCount = 0;
  private cleanupTimer: NodeJS.Timeout | null = null;
  private lastCleanupTime: number | null = null;
  private accessTimes: number[] = [];
  private storagePrefix = 'app_cache_';
  
  private settings: CacheSettings = {
    enabled: true,
    maxSize: 500,
    defaultExpiry: 24 * 60 * 60 * 1000, // 24 saat
    cleanupInterval: 5 * 60 * 1000, // 5 dakika
    diskMode: true,
    encryptionEnabled: false,
    debug: false
  };
  
  constructor(settings?: Partial<CacheSettings>) {
    // Ayarları güncelle
    if (settings) {
      this.settings = { ...this.settings, ...settings };
    }
    
    // LocalStorage'dan mevcut önbellek verilerini yükle
    this.loadFromStorage();
    
    // Periyodik temizleme zamanlayıcısını başlat
    this.startCleanupTimer();
    
    // Çevrimdışı/çevrimiçi durum değişikliklerini dinle
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline);
      window.addEventListener('offline', this.handleOffline);
    }
  }
  
  // API önbelleği için özel anahtar oluşturma
  private createApiCacheKey(endpoint: string, params?: Record<string, any>, method: string = 'GET'): string {
    const normalizedEndpoint = endpoint.trim().replace(/^\/+|\/+$/g, '');
    
    if (!params || Object.keys(params).length === 0) {
      return `api:${method}:${normalizedEndpoint}`;
    }
    
    // Parametreleri sırala ve anahtar olarak kullan
    const sortedParams = Object.keys(params).sort().map(key => {
      return `${key}=${JSON.stringify(params[key])}`;
    }).join('&');
    
    return `api:${method}:${normalizedEndpoint}:${sortedParams}`;
  }
  
  // Önbelleğe veri ekleme
  set(key: string, data: any, options: {
    expiry?: number,
    tags?: string[],
    priority?: 'low' | 'normal' | 'high' | 'critical',
    readonly?: boolean,
    metadata?: Record<string, any>
  } = {}): boolean {
    if (!this.settings.enabled) return false;
    
    // Önbellek boyutunu kontrol et
    if (this.cache.size >= this.settings.maxSize) {
      this.cleanup(true); // Yer açmak için zorla temizle
      
      // Hala yer yoksa, düşük öncelikli öğeleri temizle
      if (this.cache.size >= this.settings.maxSize) {
        this.evictItems(1);
      }
    }
    
    const timestamp = Date.now();
    const expiry = options.expiry !== undefined ? timestamp + options.expiry : 
                  (options.expiry === 0 ? 0 : timestamp + this.settings.defaultExpiry);
    
    const cacheItem: CacheableData = {
      key,
      data,
      timestamp,
      expiry: expiry === 0 ? undefined : expiry,
      tags: options.tags || [],
      priority: options.priority || 'normal',
      readonly: options.readonly || false,
      metadata: options.metadata || {}
    };
    
    this.cache.set(key, cacheItem);
    
    // Disk modunda ise localStorage'a kaydet
    if (this.settings.diskMode) {
      this.saveToStorage(key, cacheItem);
    }
    
    if (this.settings.debug) {
      console.log(`[CacheManager] Önbelleğe kaydedildi: ${key}, süre: ${expiry ? new Date(expiry).toLocaleString() : 'süresiz'}`);
    }
    
    return true;
  }
  
  // API önbelleğine veri ekleme (özel yapılandırma ile)
  setApiCache(endpoint: string, data: any, params?: Record<string, any>, options: {
    method?: string,
    expiry?: number,
    tags?: string[],
    priority?: 'low' | 'normal' | 'high' | 'critical',
    metadata?: Record<string, any>
  } = {}): boolean {
    const key = this.createApiCacheKey(endpoint, params, options.method || 'GET');
    
    // API önbellekleri için varsayılan etiketler
    const tags = [...(options.tags || []), 'api'];
    
    // Endpoint yolundan etiketler çıkar
    const pathTags = endpoint.split('/').filter(Boolean);
    if (pathTags.length > 0) {
      tags.push(...pathTags);
    }
    
    return this.set(key, data, {
      expiry: options.expiry,
      tags,
      priority: options.priority || 'normal',
      metadata: {
        endpoint,
        params,
        method: options.method || 'GET',
        ...(options.metadata || {})
      }
    });
  }
  
  // Önbellekten veri alma
  get<T = any>(key: string): T | null {
    if (!this.settings.enabled) return null;
    
    const startTime = performance.now();
    const item = this.cache.get(key);
    
    if (!item) {
      this.missCount++;
      
      if (this.settings.debug) {
        console.log(`[CacheManager] Önbellekte bulunamadı: ${key}`);
      }
      
      return null;
    }
    
    // Süre dolmuş mu kontrol et
    if (item.expiry && item.expiry < Date.now()) {
      if (this.settings.debug) {
        console.log(`[CacheManager] Önbellek süresi doldu: ${key}`);
      }
      
      this.cache.delete(key);
      this.removeFromStorage(key);
      this.missCount++;
      return null;
    }
    
    this.hitCount++;
    
    // Performans ölçümü
    const endTime = performance.now();
    this.accessTimes.push(endTime - startTime);
    
    // Son 100 ölçümü tut
    if (this.accessTimes.length > 100) {
      this.accessTimes.shift();
    }
    
    if (this.settings.debug) {
      console.log(`[CacheManager] Önbellekten alındı: ${key}`);
    }
    
    return item.data as T;
  }
  
  // API önbelleğinden veri alma
  getApiCache<T = any>(endpoint: string, params?: Record<string, any>, method: string = 'GET'): T | null {
    const key = this.createApiCacheKey(endpoint, params, method);
    return this.get<T>(key);
  }
  
  // Belirli bir anahtarı önbellekten silme
  remove(key: string): boolean {
    if (!this.settings.enabled) return false;
    
    const item = this.cache.get(key);
    if (!item) return false;
    
    // Salt okunur öğeleri silmeyi engelle
    if (item.readonly) {
      if (this.settings.debug) {
        console.warn(`[CacheManager] Salt okunur öğe silinemez: ${key}`);
      }
      return false;
    }
    
    this.cache.delete(key);
    this.removeFromStorage(key);
    
    if (this.settings.debug) {
      console.log(`[CacheManager] Önbellekten silindi: ${key}`);
    }
    
    return true;
  }
  
  // API önbelleğinden veri silme
  removeApiCache(endpoint: string, params?: Record<string, any>, method: string = 'GET'): boolean {
    const key = this.createApiCacheKey(endpoint, params, method);
    return this.remove(key);
  }
  
  // Belirli etiketlere sahip öğeleri sil
  removeByTags(tags: string[]): number {
    if (!this.settings.enabled || tags.length === 0) return 0;
    
    const keysToRemove: string[] = [];
    
    this.cache.forEach((item, key) => {
      // Salt okunur öğeleri atla
      if (item.readonly) return;
      
      // Etiketlerden herhangi biri eşleşiyorsa sil
      if (item.tags && item.tags.some(tag => tags.includes(tag))) {
        keysToRemove.push(key);
      }
    });
    
    // Toplu silme işlemi
    keysToRemove.forEach(key => {
      this.cache.delete(key);
      this.removeFromStorage(key);
    });
    
    if (this.settings.debug) {
      console.log(`[CacheManager] ${keysToRemove.length} öğe etiketlere göre silindi: ${tags.join(', ')}`);
    }
    
    return keysToRemove.length;
  }
  
  // API önbelleğinden belirli bir endpointle ilgili tüm verileri silme
  removeApiCacheByEndpoint(endpoint: string): number {
    // Endpoint yolunu etiketlere çevir
    const pathTags = endpoint.split('/').filter(Boolean);
    
    // API etiketini ekle
    return this.removeByTags(['api', ...pathTags]);
  }
  
  // Önbelleği tamamen temizle
  clear(): boolean {
    if (!this.settings.enabled) return false;
    
    // Salt okunur olmayan öğeleri temizle
    const countBefore = this.cache.size;
    const keysToRemove: string[] = [];
    
    this.cache.forEach((item, key) => {
      if (!item.readonly) {
        keysToRemove.push(key);
      }
    });
    
    // Toplu silme işlemi
    keysToRemove.forEach(key => {
      this.cache.delete(key);
      this.removeFromStorage(key);
    });
    
    if (this.settings.debug) {
      console.log(`[CacheManager] Önbellek temizlendi: ${keysToRemove.length}/${countBefore} öğe silindi (salt okunurlar korundu)`);
    }
    
    return true;
  }
  
  // Süresi dolan öğeleri temizle
  cleanup(forceCleanup: boolean = false): number {
    if (!this.settings.enabled) return 0;
    
    const now = Date.now();
    
    // Düzenli temizlik değilse ve zorunlu değilse atla
    if (!forceCleanup && this.lastCleanupTime && (now - this.lastCleanupTime < this.settings.cleanupInterval)) {
      return 0;
    }
    
    const keysToRemove: string[] = [];
    
    this.cache.forEach((item, key) => {
      // Süresi dolan öğeleri belirle
      if (item.expiry && item.expiry < now) {
        keysToRemove.push(key);
      }
    });
    
    // Toplu silme işlemi
    keysToRemove.forEach(key => {
      this.cache.delete(key);
      this.removeFromStorage(key);
    });
    
    this.lastCleanupTime = now;
    
    if (this.settings.debug) {
      console.log(`[CacheManager] Önbellek temizliği tamamlandı: ${keysToRemove.length} öğe silindi`);
    }
    
    return keysToRemove.length;
  }
  
  // Önbellekteki düşük öncelikli öğeleri temizle (yer açmak için)
  private evictItems(percentageToRemove: number = 0.2): number {
    if (!this.settings.enabled) return 0;
    
    // Kaç öğe silineceğini hesapla
    const targetRemovalCount = Math.ceil(this.cache.size * percentageToRemove);
    
    // Öncelik sırasına göre sıralama yapabilmek için liste oluştur
    const items: { key: string, item: CacheableData }[] = [];
    
    this.cache.forEach((item, key) => {
      // Salt okunur öğeleri atla
      if (!item.readonly) {
        items.push({ key, item });
      }
    });
    
    // Önceliğe göre sırala (low < normal < high < critical)
    const priorityOrder = { 'low': 0, 'normal': 1, 'high': 2, 'critical': 3 };
    
    items.sort((a, b) => {
      // Önce önceliğe göre
      const priorityDiff = priorityOrder[a.item.priority || 'normal'] - priorityOrder[b.item.priority || 'normal'];
      if (priorityDiff !== 0) return priorityDiff;
      
      // Sonra yaşa göre (eski öğeler önce)
      return b.item.timestamp - a.item.timestamp;
    });
    
    // Silinecek öğeleri belirle (düşük öncelikli ve eski olanlar)
    const keysToRemove = items.slice(0, targetRemovalCount).map(item => item.key);
    
    // Toplu silme işlemi
    keysToRemove.forEach(key => {
      this.cache.delete(key);
      this.removeFromStorage(key);
    });
    
    if (this.settings.debug) {
      console.log(`[CacheManager] Yer açmak için çıkarıldı: ${keysToRemove.length} öğe`);
    }
    
    return keysToRemove.length;
  }
  
  // Önbellek istatistiklerini al
  getStats(): CacheStats {
    const now = Date.now();
    let oldestTimestamp = now;
    let newestTimestamp = 0;
    let totalSize = 0;
    
    // Her öğeyi denetle
    this.cache.forEach(item => {
      if (item.timestamp < oldestTimestamp) {
        oldestTimestamp = item.timestamp;
      }
      
      if (item.timestamp > newestTimestamp) {
        newestTimestamp = item.timestamp;
      }
      
      // Veri boyutunu hesapla (yaklaşık)
      totalSize += JSON.stringify(item).length;
    });
    
    return {
      totalItems: this.cache.size,
      hitCount: this.hitCount,
      missCount: this.missCount,
      totalSize,
      oldestItemAge: oldestTimestamp === now ? 0 : now - oldestTimestamp,
      newestItemAge: newestTimestamp === 0 ? 0 : now - newestTimestamp,
      averageAccessTime: this.accessTimes.length ? 
        this.accessTimes.reduce((a, b) => a + b, 0) / this.accessTimes.length : 0,
      lastCleanupTime: this.lastCleanupTime
    };
  }
  
  // Önbellek ayarlarını güncelle
  updateSettings(settings: Partial<CacheSettings>): CacheSettings {
    const oldEnabled = this.settings.enabled;
    const oldCleanupInterval = this.settings.cleanupInterval;
    
    this.settings = { ...this.settings, ...settings };
    
    // Etkinleştirme durumu değiştiyse
    if (oldEnabled !== this.settings.enabled) {
      if (this.settings.enabled) {
        // Önbelleklemeyi etkinleştirdiğimizde temizleme zamanlayıcısını başlat
        this.startCleanupTimer();
      } else {
        // Önbelleklemeyi devre dışı bıraktığımızda temizleme zamanlayıcısını durdur
        this.stopCleanupTimer();
      }
    }
    
    // Temizleme aralığı değiştiyse zamanlayıcıyı yeniden başlat
    if (oldCleanupInterval !== this.settings.cleanupInterval && this.settings.enabled) {
      this.stopCleanupTimer();
      this.startCleanupTimer();
    }
    
    return this.settings;
  }
  
  // Periyodik temizleme zamanlayıcısını başlat
  private startCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.settings.cleanupInterval);
  }
  
  // Temizleme zamanlayıcısını durdur
  private stopCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }
  
  // localStorage'a önbellek öğesi kaydet
  private saveToStorage(key: string, item: CacheableData): void {
    try {
      localStorage.setItem(`${this.storagePrefix}${key}`, JSON.stringify(item));
    } catch (error) {
      console.error('[CacheManager] LocalStorage kaydetme hatası:', error);
      
      // LocalStorage doluysa, yer açmayı dene
      if (error instanceof DOMException && (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
        // Düşük öncelikli öğeleri temizle
        this.removeByTags(['low']);
        
        // Tekrar kaydetmeyi dene
        try {
          localStorage.setItem(`${this.storagePrefix}${key}`, JSON.stringify(item));
        } catch (retryError) {
          console.error('[CacheManager] LocalStorage yeniden kaydetme başarısız:', retryError);
        }
      }
    }
  }
  
  // localStorage'dan önbellek öğesini sil
  private removeFromStorage(key: string): void {
    try {
      localStorage.removeItem(`${this.storagePrefix}${key}`);
    } catch (error) {
      console.error('[CacheManager] LocalStorage silme hatası:', error);
    }
  }
  
  // localStorage'dan önbellek verilerini yükle
  private loadFromStorage(): void {
    try {
      const keys = Object.keys(localStorage);
      const prefix = this.storagePrefix;
      
      // Sadece bizim önbellek öğelerimizi bul
      for (const storageKey of keys) {
        if (storageKey.startsWith(prefix)) {
          try {
            const value = localStorage.getItem(storageKey);
            if (value) {
              const item = JSON.parse(value) as CacheableData;
              
              // Süre kontrolü yap
              if (item.expiry && item.expiry < Date.now()) {
                this.removeFromStorage(item.key);
              } else {
                this.cache.set(item.key, item);
              }
            }
          } catch (error) {
            console.error(`[CacheManager] LocalStorage öğesi yükleme hatası: ${storageKey}`, error);
          }
        }
      }
      
      if (this.settings.debug) {
        console.log(`[CacheManager] LocalStorage'dan ${this.cache.size} öğe yüklendi`);
      }
    } catch (error) {
      console.error('[CacheManager] LocalStorage yükleme hatası:', error);
    }
  }
  
  // Çevrimiçi olunca tetiklenir
  private handleOnline = (): void => {
    if (this.settings.debug) {
      console.log('[CacheManager] Çevrimiçi moda geçildi');
    }
    
    // Çevrimiçi olunca ek işlemler yapılabilir
    // Örneğin bekleyen istekleri gönderme vb.
  };
  
  // Çevrimdışı olunca tetiklenir
  private handleOffline = (): void => {
    if (this.settings.debug) {
      console.log('[CacheManager] Çevrimdışı moda geçildi');
    }
    
    // Çevrimdışı olunca ek işlemler yapılabilir
    // Örneğin kritik verileri daha uzun saklamak vb.
  };
  
  // Bileşen temizleme - uygulama kapatılırken/sayfa değişirken çağrılmalı
  dispose(): void {
    this.stopCleanupTimer();
    
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleOnline);
      window.removeEventListener('offline', this.handleOffline);
    }
    
    if (this.settings.debug) {
      console.log('[CacheManager] Kaynaklar temizlendi');
    }
  }
}

// Singleton örneği
export const cacheManager = new CacheManager({
  enabled: true,
  maxSize: 1000,
  defaultExpiry: 24 * 60 * 60 * 1000, // 24 saat
  cleanupInterval: 10 * 60 * 1000, // 10 dakika
  diskMode: true,
  debug: false
});

export default cacheManager; 