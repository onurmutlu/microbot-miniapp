import { SSEMessage } from './sseService';

const LOCAL_STORAGE_KEY_PREFIX = 'sse_cache_';
const MESSAGE_CACHE_KEY = `${LOCAL_STORAGE_KEY_PREFIX}messages`;
const SUBSCRIPTIONS_CACHE_KEY = `${LOCAL_STORAGE_KEY_PREFIX}subscriptions`;
const SETTINGS_CACHE_KEY = `${LOCAL_STORAGE_KEY_PREFIX}settings`;
const MAX_CACHED_MESSAGES = 500;

export interface SSECacheSettings {
  enabled: boolean;
  persistMessages: boolean;
  persistSubscriptions: boolean;
  maxCachedMessages: number;
  ttl: number; // Saniye cinsinden önbellek süresi
  lastCleanup: number; // Son temizlik zamanı (timestamp)
}

const DEFAULT_SETTINGS: SSECacheSettings = {
  enabled: true,
  persistMessages: true,
  persistSubscriptions: true,
  maxCachedMessages: MAX_CACHED_MESSAGES,
  ttl: 3600, // 1 saat
  lastCleanup: Date.now()
};

/**
 * SSE mesajlarını ve aboneliklerini yerel olarak önbelleğe almak için servis
 */
export class SSELocalCacheService {
  private settings: SSECacheSettings;
  private isInitialized = false;

  constructor() {
    this.settings = this.loadSettings();
    this.initialize();
  }

  /**
   * Servisi başlat ve gerekli temizlik işlemlerini yap
   */
  private initialize(): void {
    if (this.isInitialized) return;

    // Düzenli temizlik için zamanlayıcı
    setInterval(() => {
      this.cleanupExpiredMessages();
    }, 60000); // Her dakika kontrol et

    // İlk temizlik
    this.cleanupExpiredMessages();
    this.isInitialized = true;
  }

  /**
   * Local storage'dan önceki ayarları yükle veya varsayılanları kullan
   */
  private loadSettings(): SSECacheSettings {
    try {
      const savedSettings = localStorage.getItem(SETTINGS_CACHE_KEY);
      if (savedSettings) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) };
      }
    } catch (error) {
      console.error('SSE önbellek ayarları yüklenirken hata:', error);
    }
    return { ...DEFAULT_SETTINGS };
  }

  /**
   * Ayarları kaydet
   */
  private saveSettings(): void {
    if (!this.settings.enabled) return;
    
    try {
      localStorage.setItem(SETTINGS_CACHE_KEY, JSON.stringify(this.settings));
    } catch (error) {
      console.error('SSE önbellek ayarları kaydedilirken hata:', error);
    }
  }

  /**
   * Önbellek ayarlarını güncelle
   */
  updateSettings(settings: Partial<SSECacheSettings>): SSECacheSettings {
    this.settings = { ...this.settings, ...settings };
    this.saveSettings();
    return this.settings;
  }

  /**
   * Mevcut ayarları getir
   */
  getSettings(): SSECacheSettings {
    return { ...this.settings };
  }

  /**
   * Mesajı önbelleğe ekle
   */
  cacheMessage(message: SSEMessage): void {
    if (!this.settings.enabled || !this.settings.persistMessages) return;
    
    try {
      // Önbelleğe eklenen mesaja zaman damgası ekle
      const messageWithTimestamp = {
        ...message,
        cached_at: Date.now()
      };
      
      // Mevcut mesajları al
      const cachedMessages = this.getCachedMessages();
      
      // Mesajı önbelleğe ekle (başa)
      cachedMessages.unshift(messageWithTimestamp);
      
      // Maksimum sayıyı aşmamak için kesme işlemi
      const trimmedMessages = cachedMessages.slice(0, this.settings.maxCachedMessages);
      
      // Güncellenmiş mesajları kaydet
      localStorage.setItem(MESSAGE_CACHE_KEY, JSON.stringify(trimmedMessages));
    } catch (error) {
      console.error('SSE mesajı önbelleğe eklenirken hata:', error);
    }
  }

  /**
   * Önbellekteki tüm mesajları getir
   */
  getCachedMessages(): (SSEMessage & { cached_at?: number })[] {
    if (!this.settings.enabled || !this.settings.persistMessages) return [];
    
    try {
      const cachedData = localStorage.getItem(MESSAGE_CACHE_KEY);
      if (cachedData) {
        return JSON.parse(cachedData);
      }
    } catch (error) {
      console.error('SSE mesajları önbellekten alınırken hata:', error);
    }
    return [];
  }

  /**
   * Bir konuya ait mesajları getir
   */
  getCachedMessagesByTopic(topic: string): (SSEMessage & { cached_at?: number })[] {
    const allMessages = this.getCachedMessages();
    return allMessages.filter(msg => msg.topic === topic);
  }

  /**
   * Belirli bir tipe ait mesajları getir
   */
  getCachedMessagesByType(type: string): (SSEMessage & { cached_at?: number })[] {
    const allMessages = this.getCachedMessages();
    return allMessages.filter(msg => msg.type === type);
  }

  /**
   * Önbellekteki mesajları temizle
   */
  clearCachedMessages(): void {
    if (!this.settings.enabled || !this.settings.persistMessages) return;
    
    try {
      localStorage.removeItem(MESSAGE_CACHE_KEY);
    } catch (error) {
      console.error('Önbellekteki SSE mesajları temizlenirken hata:', error);
    }
  }

  /**
   * Süresi dolmuş mesajları temizle
   */
  cleanupExpiredMessages(): void {
    if (!this.settings.enabled || !this.settings.persistMessages) return;
    
    try {
      const now = Date.now();
      const maxAge = this.settings.ttl * 1000; // ms'ye çevir
      
      // Mevcut mesajları al
      const cachedMessages = this.getCachedMessages();
      
      // Mesaj sayısı kontrolü
      let needsCleanup = false;
      if (cachedMessages.length > this.settings.maxCachedMessages) {
        needsCleanup = true;
        console.log(`Önbellek boyut sınırı aşıldı: ${cachedMessages.length}/${this.settings.maxCachedMessages}`);
      }
      
      // Süresi dolmuş mesajları filtrele
      const validMessages = cachedMessages.filter(msg => {
        // TTL 0 ise mesaj sonsuza kadar saklanır
        if (!this.settings.ttl) return true;
        
        // cached_at yoksa şu anki zamanı kullan
        const cachedAt = msg.cached_at || now;
        const isValid = (now - cachedAt) < maxAge;
        
        if (!isValid) {
          needsCleanup = true;
        }
        
        return isValid;
      });
      
      // Değişiklik varsa veya boyut sınırı aşıldıysa güncelle
      if (needsCleanup) {
        // Maksimum sayıya kadar kes
        const trimmedMessages = validMessages.slice(0, this.settings.maxCachedMessages);
        
        // Kaç mesajın temizlendiğini logla
        const removedCount = cachedMessages.length - trimmedMessages.length;
        if (removedCount > 0) {
          console.log(`${removedCount} adet önbellekteki mesaj temizlendi. Yeni boyut: ${trimmedMessages.length}`);
        }
        
        // Güncellenmiş mesajları kaydet
        localStorage.setItem(MESSAGE_CACHE_KEY, JSON.stringify(trimmedMessages));
      }
      
      // Son temizlik zamanını güncelle
      this.settings.lastCleanup = now;
      this.saveSettings();
    } catch (error) {
      console.error('Önbellekteki süresi dolmuş SSE mesajları temizlenirken hata:', error);
    }
  }

  /**
   * Abonelikleri önbelleğe ekle
   */
  cacheSubscriptions(subscriptions: string[]): void {
    if (!this.settings.enabled || !this.settings.persistSubscriptions) return;
    
    try {
      localStorage.setItem(SUBSCRIPTIONS_CACHE_KEY, JSON.stringify(subscriptions));
    } catch (error) {
      console.error('SSE abonelikleri önbelleğe eklenirken hata:', error);
    }
  }

  /**
   * Önbellekteki abonelikleri getir
   */
  getCachedSubscriptions(): string[] {
    if (!this.settings.enabled || !this.settings.persistSubscriptions) return [];
    
    try {
      const cachedData = localStorage.getItem(SUBSCRIPTIONS_CACHE_KEY);
      if (cachedData) {
        return JSON.parse(cachedData);
      }
    } catch (error) {
      console.error('SSE abonelikleri önbellekten alınırken hata:', error);
    }
    return [];
  }

  /**
   * Önbellekteki abonelikleri temizle
   */
  clearCachedSubscriptions(): void {
    if (!this.settings.enabled || !this.settings.persistSubscriptions) return;
    
    try {
      localStorage.removeItem(SUBSCRIPTIONS_CACHE_KEY);
    } catch (error) {
      console.error('Önbellekteki SSE abonelikleri temizlenirken hata:', error);
    }
  }

  /**
   * Tüm önbelleği temizle
   */
  clearAllCache(): void {
    this.clearCachedMessages();
    this.clearCachedSubscriptions();
    
    // Ayarları da temizle
    try {
      localStorage.removeItem(SETTINGS_CACHE_KEY);
      // Varsayılan ayarlara geri dön
      this.settings = { ...DEFAULT_SETTINGS };
    } catch (error) {
      console.error('Tüm SSE önbelleği temizlenirken hata:', error);
    }
  }

  /**
   * Önbelleğe alınabilecek toplam mesaj sayısını ayarla
   */
  setMaxCachedMessages(max: number): void {
    if (max < 1) return;
    
    this.settings.maxCachedMessages = max;
    this.saveSettings();
    
    // Mevcut mesajları da kırp
    try {
      const cachedMessages = this.getCachedMessages();
      if (cachedMessages.length > max) {
        const trimmedMessages = cachedMessages.slice(0, max);
        localStorage.setItem(MESSAGE_CACHE_KEY, JSON.stringify(trimmedMessages));
      }
    } catch (error) {
      console.error('Önbellekteki mesaj sayısı ayarlanırken hata:', error);
    }
  }

  /**
   * Önbelleği etkinleştir/devre dışı bırak
   */
  setEnabled(enabled: boolean): void {
    this.settings.enabled = enabled;
    this.saveSettings();
    
    // Devre dışı bırakıldıysa ve cihaz çevrimdışıysa temizle
    if (!enabled && !navigator.onLine) {
      this.clearCachedMessages();
      this.clearCachedSubscriptions();
    }
  }
}

// Tek örnek oluştur
export const sseLocalCache = new SSELocalCacheService();

export default sseLocalCache; 