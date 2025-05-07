import sseService, { SSEConnectionState, SSEMessage } from './sseService';

// SSE mesaj tipleri için enum
export enum SSEMessageType {
  MESSAGE = 'message',
  BROADCAST = 'broadcast',
  PING = 'ping',
  CONNECTION = 'connection',
  SUBSCRIPTION = 'subscription',
  ERROR = 'error'
}

// SSE durum tipi tanımı
export interface SSEState {
  isConnected: boolean;
  isConnecting: boolean;
  lastMessage: SSEMessage | null;
  clientId: string;
  reconnectAttempt: number;
  error: Error | null;
  activeTopics: string[];
}

// SSEClient seçeneklerini tanımlayan interface
interface SSEClientOptions {
  autoReconnect?: boolean;
  authToken?: string;
  [key: string]: any;
}

export class SSEClient {
  private baseUrl: string;
  private options: SSEClientOptions;
  private clientId: string;

  constructor(baseUrl: string, options: SSEClientOptions = {}) {
    this.baseUrl = baseUrl;
    this.options = options;
    // URL'den clientId'yi çıkar veya rastgele oluştur
    const urlParts = baseUrl.split('/');
    this.clientId = urlParts[urlParts.length - 1].includes('client_') 
      ? urlParts[urlParts.length - 1] 
      : 'client_' + Math.random().toString(36).substring(2, 10);
    
    // Auth token varsa
    if (options.authToken) {
      // Token ayarlanabilir, ancak sseService zaten bunu yapıyor
      console.log('Auth token kullanılıyor:', options.authToken);
    }
  }

  /**
   * SSE bağlantısını başlatır
   * @returns Bağlantı kurulduğunda resolve olan promise
   */
  connect() {
    // Mevcut sseService'i kullanacağız, sadece arayüzü rehbere uygun hale getiriyoruz
    return new Promise<void>((resolve, reject) => {
      try {
        // Bağlantı durumunu kontrol et
        const currentStatus = sseService.getStatus();
        
        if (currentStatus === 'connected') {
          resolve();
          return;
        }
        
        // Durumu dinle
        const unsubscribe = sseService.onStatusChange((status) => {
          if (status === 'connected') {
            unsubscribe();
            resolve();
          } else if (status === 'error') {
            unsubscribe();
            reject(new Error('Bağlantı hatası'));
          }
        });
        
        // Bağlantıyı başlat
        sseService.connect();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * SSE bağlantısını kapatır
   */
  disconnect() {
    sseService.disconnect();
  }

  /**
   * Belirli türdeki mesajları dinler
   * @param eventType Olay türü (message, broadcast, vb.)
   * @param handler Olay gerçekleştiğinde çağrılacak fonksiyon
   * @returns Dinlemeyi durdurmak için çağrılacak fonksiyon
   */
  on(eventType: string, handler: (data: any) => void) {
    return sseService.on(eventType, (message: SSEMessage) => {
      handler(message.data);
    });
  }

  /**
   * Belirli bir konudaki mesajları dinler
   * @param topic Dinlenecek konu
   * @param handler Mesaj alındığında çağrılacak fonksiyon
   * @returns Dinlemeyi durdurmak için çağrılacak fonksiyon
   */
  onTopic(topic: string, handler: (data: any) => void) {
    return sseService.onTopic(topic, (message: SSEMessage) => {
      handler(message.data);
    });
  }

  /**
   * Bağlantı durumu değişikliklerini dinler
   * @param state İzlenecek durum ('open', 'close', 'error')
   * @param handler Durum değiştiğinde çağrılacak fonksiyon
   * @returns Dinlemeyi durdurmak için çağrılacak fonksiyon
   */
  onConnectionState(state: 'open' | 'close' | 'error', handler: (data?: any) => void) {
    return sseService.onStatusChange((status: SSEConnectionState) => {
      if ((state === 'open' && status === 'connected') ||
          (state === 'close' && status === 'disconnected') ||
          (state === 'error' && status === 'error')) {
        handler(status === 'error' ? { errorType: 'server' } : undefined);
      }
    });
  }

  /**
   * Belirli bir konuya abone olur
   * @param topic Abone olunacak konu
   * @returns Abonelik sonucunu içeren promise
   */
  subscribeTopic(topic: string) {
    return sseService.subscribeTopic(topic);
  }

  /**
   * Bir konudan aboneliği kaldırır
   * @param topic Aboneliği kaldırılacak konu
   * @returns İşlem sonucunu içeren promise
   */
  unsubscribeTopic(topic: string) {
    return sseService.unsubscribeTopic(topic);
  }

  /**
   * Tüm istemcilere yayın yapar
   * @param data Gönderilecek veri
   * @param options Mesaj seçenekleri (öncelik, ttl, metadata)
   * @returns İşlem sonucunu içeren promise
   */
  broadcast(data: any, options?: any) {
    return sseService.broadcast(data, options);
  }

  /**
   * Belirli bir konuya mesaj yayınlar
   * @param topic Hedef konu
   * @param data Gönderilecek veri
   * @param options Mesaj seçenekleri (öncelik, ttl, metadata)
   * @returns İşlem sonucunu içeren promise
   */
  publishToTopic(topic: string, data: any, options?: any) {
    return sseService.publishToTopic(topic, data, options);
  }

  /**
   * Çoklu konulara aynı mesajı yayınlar
   * @param topics Hedef konular dizisi
   * @param data Gönderilecek veri
   * @param options Mesaj seçenekleri
   * @returns İşlem sonucunu içeren promise
   */
  publishToMultipleTopics(topics: string[], data: any, options?: any) {
    return sseService.publishToMultipleTopics(topics, data, options);
  }

  /**
   * SSE bağlantı istatistiklerini alır
   * @returns İstatistik verileri
   */
  getStats() {
    return sseService.getStats();
  }

  /**
   * SSE bağlantısının durumunu alır
   * @returns Bağlantı durumu
   */
  getConnectionState() {
    const status = sseService.getStatus();
    
    // Durum adlarını rehberdeki formata dönüştür
    if (status === 'connected') return 'open';
    if (status === 'disconnected') return 'close';
    if (status === 'error') return 'error';
    return 'connecting';
  }

  /**
   * SSE bağlantısının çevrimiçi olup olmadığını kontrol eder
   * @returns Çevrimiçi durumu
   */
  isOnline() {
    return sseService.isOnline();
  }

  /**
   * Telegram bildirimleri için özelleştirilmiş metod
   * Telegram bildirimlerini işler ve yerel bildirim sistemine iletir
   * @param channel Telegram kanal/grup ID'si
   * @param handler Bildirimleri işleyecek callback fonksiyonu
   * @returns Unsubscribe fonksiyonu
   */
  onTelegramNotification(channel: string, handler: (data: any) => void) {
    return this.onTopic(`telegram_notification_${channel}`, handler);
  }

  /**
   * Telegram oturum durumu değişikliklerini izler
   * @param handler Oturum durum değişimlerini işleyecek callback fonksiyonu
   * @returns Unsubscribe fonksiyonu
   */
  onSessionStateChange(handler: (data: any) => void) {
    return this.onTopic('telegram_session', handler);
  }

  /**
   * Telegram bildirimi gönderir
   * @param channelId Hedef kanal/grup ID'si
   * @param notification Bildirim içeriği
   * @param options Bildirim seçenekleri
   * @returns İşlem sonucunu içeren promise
   */
  sendTelegramNotification(channelId: string, notification: any, options?: any) {
    return this.publishToTopic(`telegram_notification_${channelId}`, notification, {
      priority: 'high',
      persistent: true,
      ...options
    });
  }

  /**
   * Tüm bağlı Telegram hesaplarını bilgilendirir
   * @param data Gönderilecek veri
   * @param options Mesaj seçenekleri
   * @returns İşlem sonucunu içeren promise
   */
  notifyAllTelegramAccounts(data: any, options?: any) {
    return this.broadcast({
      type: 'telegram_accounts',
      ...data
    }, {
      priority: 'normal',
      ...options
    });
  }

  /**
   * Mini App içinden ana Telegram uygulamasına bildirim gönderir
   * @param data Bildirim verisi
   * @returns İşlem sonucunu içeren promise
   */
  notifyTelegramApp(data: any) {
    return this.publishToTopic('telegram_app', data, {
      priority: 'critical'
    });
  }
}

// Singleton örneği
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
export const sseClient = new SSEClient(`${apiUrl}/api/sse`);

export default sseClient; 