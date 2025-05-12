import { getTestMode } from '../utils/testMode';
import { getSSEUrl } from '../utils/env';
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

// SSE yapılandırması
export interface SSEConfig {
  baseUrl?: string;
  reconnectDelay?: number;
  maxReconnectAttempts?: number;
  withCredentials?: boolean;
  debug?: boolean;
  autoConnect?: boolean;
}

// SSE mesaj işleyici tipi
type MessageHandler = (message: SSEMessage) => void;

// SSE durum dinleyici tipi 
type StateListener = (state: SSEState) => void;

export class SSEClient {
  private eventSource: EventSource | null = null;
  private config: SSEConfig;
  private clientId: string;
  private baseUrl: string;
  private reconnectTimer: number | null = null;
  private forceClosed = false;
  
  // Kanallara abone olan işleyiciler
  private channelHandlers: Map<string, Set<MessageHandler>> = new Map();
  
  // Genel işleyiciler
  private messageHandlers: Set<MessageHandler> = new Set();
  
  // Bağlantı durumu
  private state: SSEState = {
    isConnected: false,
    isConnecting: false,
    lastMessage: null,
    clientId: '',
    reconnectAttempt: 0,
    error: null,
    activeTopics: []
  };
  
  // Durum değişikliği dinleyicileri
  private stateListeners: Set<StateListener> = new Set();
  
  constructor(config: SSEConfig = {}) {
    // Varsayılan yapılandırma
    const defaultConfig: SSEConfig = {
      baseUrl: '',
      reconnectDelay: 3000,
      maxReconnectAttempts: 10,
      withCredentials: false,
      debug: true,
      autoConnect: true
    };
    
    this.config = { ...defaultConfig, ...config };
    
    // Client ID oluştur
    this.clientId = this.generateClientId();
    
    // Protokole göre SSE URL'ini ayarla
    let baseUrl = this.config.baseUrl || getSSEUrl();
    
    // URL protokol içermiyorsa, mevcut sayfanın protokolüne göre ekleyelim
    if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
      const protocol = window.location.protocol === 'https:' ? 'https://' : 'http://';
      baseUrl = `${protocol}${baseUrl}`;
    }
    
    // Çift /api yol kontrolü
    baseUrl = baseUrl.replace(/\/api\/api\//, '/api/');
    
    // HTTPS sayfada http:// protokolü kullanılmışsa https:// ile değiştirelim
    if (window.location.protocol === 'https:' && baseUrl.startsWith('http://')) {
      console.warn('HTTPS sayfada güvensiz SSE (http://) kullanılamaz. https:// protokolüne geçiliyor.');
      baseUrl = baseUrl.replace('http://', 'https://');
    }
    
    this.baseUrl = baseUrl;
    
    // Test modunda otomatik bağlantı yapma
    if (this.config.autoConnect && !getTestMode()) {
      this.connect();
    }
    
    // Test modunda bağlı olarak işaretle
    if (getTestMode()) {
      this.updateState({
        isConnected: true,
        isConnecting: false
      });
      
      this.log('Test modu: SSE bağlantısı simüle ediliyor');
    }
  }

  /**
   * SSE bağlantısını başlatır
   * @returns Bağlantı kurulduğunda resolve olan promise
   */
  connect() {
    // Test modunda bağlantı kurma işlemini atla
    if (getTestMode()) {
      this.updateState({
        isConnected: true,
        isConnecting: false,
        reconnectAttempt: 0
      });
      return;
    }
    
    // Zaten bağlı veya bağlanıyor ise tekrar bağlanma
    if (this.eventSource || this.state.isConnecting) {
      return;
    }
        
    // Zorlayarak kapatılmış ise bağlanma
    if (this.forceClosed) {
      return;
    }
    
    try {
      this.updateState({
        isConnecting: true
      });
      
      // SSE URL'ini protokol güvenliği için tekrar kontrol et
      let sseUrl = `${this.baseUrl}/${this.clientId}`;
      
      // HTTPS sayfada http:// protokolü kullanılmışsa https:// ile değiştirelim
      if (window.location.protocol === 'https:' && sseUrl.startsWith('http://')) {
        console.warn('HTTPS sayfada güvensiz SSE (http://) kullanılamaz. https:// protokolüne geçiliyor.');
        sseUrl = sseUrl.replace('http://', 'https://');
      }
      
      this.log(`SSE bağlantısı deneniyor: ${sseUrl}`);
      
      // EventSource oluştur
      this.eventSource = new EventSource(sseUrl, {
        withCredentials: this.config.withCredentials
      });
      
      // Olay dinleyicileri ekle
      this.eventSource.onopen = this.handleOpen.bind(this);
      this.eventSource.onerror = this.handleError.bind(this);
      this.eventSource.onmessage = this.handleMessage.bind(this);
      
      // Özel olayları dinle
      this.eventSource.addEventListener('notification', this.handleEvent.bind(this, 'notification'));
      this.eventSource.addEventListener('update', this.handleEvent.bind(this, 'update'));
      this.eventSource.addEventListener('alert', this.handleEvent.bind(this, 'alert'));
      this.eventSource.addEventListener('status', this.handleEvent.bind(this, 'status'));
      this.eventSource.addEventListener('ping', this.handleEvent.bind(this, 'ping'));
    } catch (error) {
      this.handleError(error as Event);
    }
  }

  /**
   * SSE bağlantı açıldığında çağrılır
   */
  private handleOpen(event: Event): void {
    this.log('SSE bağlantısı başarılı');
    this.updateState({
      isConnected: true,
      isConnecting: false,
      reconnectAttempt: 0,
      error: null
    });
  }

  /**
   * SSE hata olduğunda çağrılır
   */
  private handleError(event: Event): void {
    this.log('SSE bağlantı hatası:', event);
    this.updateState({
      isConnected: false,
      error: new Error('SSE bağlantı hatası')
    });
    
    // Bağlantıyı temizle
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }

  /**
   * SSE mesaj alındığında çağrılır
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const message = JSON.parse(event.data) as SSEMessage;
      // Sadece debug modunda log kaydı tut
      if (this.config.debug) {
        this.log('SSE mesajı alındı:', message);
      }
      
      // Abone olunan konulara mesajı ilet
      if (message.topic && this.channelHandlers.has(message.topic)) {
        const handlers = this.channelHandlers.get(message.topic);
        handlers?.forEach(handler => handler(message));
      }
      
      // Genel mesaj işleyicilere ilet
      this.messageHandlers.forEach(handler => handler(message));
    } catch (error) {
      console.error('SSE mesaj işleme hatası:', error);
    }
  }

  /**
   * Özel SSE olaylarını işler
   */
  private handleEvent(eventType: string, event: MessageEvent): void {
    try {
      const message = JSON.parse(event.data) as SSEMessage;
      this.log(`SSE ${eventType} olayı alındı:`, message);
      
      // Olay tipine göre abonelere ilet
      const topic = `event:${eventType}`;
      if (this.channelHandlers.has(topic)) {
        const handlers = this.channelHandlers.get(topic);
        handlers?.forEach(handler => handler(message));
      }
    } catch (error) {
      console.error(`SSE ${eventType} olayı işleme hatası:`, error);
    }
  }

  /**
   * SSE bağlantısını kapatır
   */
  disconnect() {
    // Test modunda kapatma işlemini simüle et
    if (getTestMode()) {
      this.updateState({
        isConnected: false,
        isConnecting: false
      });
      return;
    }
    
    this.forceClosed = true;
    
    // Zamanlayıcıyı temizle
    if (this.reconnectTimer !== null) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    // EventSource'u kapat
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
      
      this.updateState({
        isConnected: false,
        isConnecting: false
      });
      
      this.log('SSE bağlantısı kapatıldı');
    }
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
    return {
      isConnected: this.state.isConnected,
      lastMessage: this.state.lastMessage,
      clientId: this.state.clientId,
      connectionState: sseService.getStatus(),
      activeTopics: this.state.activeTopics
    };
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

  // Durum güncellemesi
  private updateState(newState: Partial<SSEState>): void {
    this.state = { ...this.state, ...newState };
    
    // Dinleyicilere bildir
    this.stateListeners.forEach(listener => {
      listener(this.state);
    });
  }

  // Log
  private log(message: string, ...args: any[]): void {
    if (this.config.debug) {
      console.log(`[SSE] ${message}`, ...args);
    }
  }

  // Client ID oluşturma
  private generateClientId(): string {
    return Math.random().toString(36).substring(2, 15);
  }
}

// Singleton örneği
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
export const sseClient = new SSEClient({ baseUrl: `${apiUrl}/api/sse` });

export default sseClient; 