import { toast } from './toast';
import { getTestMode } from './testMode';
import api from './api';

// SSE mesaj tip tanımlamaları
export enum SSEMessageType {
  MESSAGE = 'message',
  BROADCAST = 'broadcast',
  PING = 'ping',
  CONNECTION = 'connection',
  SUBSCRIPTION = 'subscription',
  ERROR = 'error'
}

// SSE mesaj veri tipi
export interface SSEMessage<T = any> {
  type: SSEMessageType;
  data?: T;
  topic?: string;
  client_id?: string;
  timestamp?: string;
  message?: string;
  event?: string;
  error?: string;
}

// SSE servis yapılandırması
export interface SSEConfig {
  baseUrl?: string;
  reconnectDelay?: number;
  maxReconnectAttempts?: number;
  debug?: boolean;
  autoConnect?: boolean;
  withCredentials?: boolean;
  onConnect?: (clientId: string) => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
  onMessage?: (message: SSEMessage) => void;
}

// SSE servisi için kanca tiplerini tanımla
export type SSEHookState = {
  isConnected: boolean;
  isConnecting: boolean;
  lastMessage: SSEMessage | null;
  clientId: string;
  reconnectAttempt: number;
  error: Error | null;
  activeTopics: string[];
};

export class SSEService {
  private eventSource: EventSource | null = null;
  private config: Required<SSEConfig>;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private reconnectAttempt = 0;
  private subscriptions: Map<string, Set<(data: any) => void>> = new Map();
  private topicSubscriptions: Set<string> = new Set();
  private clientId: string;
  private sseUrl: string;
  private forceClosed = false;
  
  // SSE durumu
  private _state: SSEHookState = {
    isConnected: false,
    isConnecting: false,
    lastMessage: null,
    clientId: '',
    reconnectAttempt: 0,
    error: null,
    activeTopics: []
  };
  
  // Durum değişikliği için dinleyiciler
  private stateListeners: Set<(state: SSEHookState) => void> = new Set();
  
  constructor(config: SSEConfig = {}) {
    // Varsayılan yapılandırma değerleri
    const defaultConfig: Required<SSEConfig> = {
      baseUrl: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/sse` : 'http://localhost:8000/api/sse',
      reconnectDelay: 3000,
      maxReconnectAttempts: 10,
      debug: false,
      autoConnect: true,
      withCredentials: false,
      onConnect: () => {},
      onDisconnect: () => {},
      onError: () => {},
      onMessage: () => {}
    };
    
    this.config = { ...defaultConfig, ...config };
    this.clientId = this.generateClientId();
    this.sseUrl = `${this.config.baseUrl}/${this.clientId}`;
    
    this._state.clientId = this.clientId;
    
    // Test modunda otomatik bağlanmayı atla
    if (this.config.autoConnect && !getTestMode()) {
      this.connect();
    }
    
    // Test modunda, isConnected'ı true olarak ayarla
    if (getTestMode()) {
      this.updateState({ isConnected: true });
      this.log('Test modu aktif: SSE bağlantısı simüle ediliyor');
    }
  }
  
  // Durum bilgilerini al
  get state(): SSEHookState {
    return this._state;
  }
  
  // Bağlantı durumunu al
  get isConnected(): boolean {
    if (getTestMode()) return true;
    return this._state.isConnected;
  }
  
  // Bağlantı kurma durumunu al
  get isConnecting(): boolean {
    if (getTestMode()) return false;
    return this._state.isConnecting;
  }
  
  // SSE bağlantısını başlat
  public connect(): void {
    if (getTestMode()) {
      this.updateState({ isConnected: true, isConnecting: false });
      return;
    }
    
    // Zaten bağlı veya bağlanıyor ise tekrar bağlanma
    if (this.eventSource && this.eventSource.readyState !== EventSource.CLOSED) {
      return;
    }
    
    // Zorlayarak kapatılmış ise bağlanma
    if (this.forceClosed) {
      return;
    }
    
    try {
      this.log(`SSE bağlantısı deneniyor: ${this.sseUrl}`);
      this.updateState({ isConnecting: true });
      
      this.eventSource = new EventSource(this.sseUrl, { 
        withCredentials: this.config.withCredentials 
      });
      
      // SSE olaylarını dinle
      this.eventSource.onopen = this.handleOpen.bind(this);
      this.eventSource.onerror = this.handleError.bind(this);
      this.eventSource.onmessage = this.handleMessage.bind(this);
      
      // Özel olay tiplerini dinle
      this.eventSource.addEventListener('ping', this.handlePing.bind(this));
      this.eventSource.addEventListener('broadcast', this.handleBroadcast.bind(this));
      this.eventSource.addEventListener('subscription', this.handleSubscription.bind(this));
      this.eventSource.addEventListener('error', this.handleErrorEvent.bind(this));
    } catch (error) {
      this.handleError(error as Event);
    }
  }
  
  // SSE bağlantısını kapat
  public disconnect(force = false): void {
    this.forceClosed = force;
    
    // Zamanlayıcıları temizle
    this.clearTimers();
    
    // EventSource bağlantısını kapat
    if (this.eventSource) {
      try {
        this.eventSource.close();
      } catch (error) {
        this.log('SSE kapatılırken hata:', error);
      }
      this.eventSource = null;
    }
    
    this.updateState({
      isConnected: false,
      isConnecting: false
    });
    
    if (force) {
      this.log('SSE bağlantısı manuel olarak kapatıldı');
    }
    
    // Yapılandırma callback'ini çağır
    this.config.onDisconnect();
  }
  
  // Bağlantıyı tekrar kur
  public reconnect(): void {
    this.forceClosed = false;
    this.disconnect();
    this.connect();
  }
  
  // Konuya abone ol
  public subscribe<T = any>(topic: string, callback: (data: T) => void): () => void {
    if (!this.subscriptions.has(topic)) {
      this.subscriptions.set(topic, new Set());
      
      // Sunucuya abone olma isteği gönder
      if (this.isConnected && !getTestMode()) {
        this.subscribeToTopic(topic);
      }
    }
    
    // Callback'i kaydet
    const callbacks = this.subscriptions.get(topic)!;
    callbacks.add(callback as (data: any) => void);
    
    this.log(`"${topic}" konusuna abone olundu`);
    
    // Aboneliği iptal etme işlevi
    return () => {
      const callbacks = this.subscriptions.get(topic);
      if (callbacks) {
        callbacks.delete(callback as (data: any) => void);
        
        // Konuya abone olan kimse kalmadıysa, konuyu kaldır
        if (callbacks.size === 0) {
          this.subscriptions.delete(topic);
          
          // Sunucuya aboneliği iptal etme isteği gönder
          if (this.isConnected && !getTestMode()) {
            this.unsubscribeFromTopic(topic);
          }
          
          this.log(`"${topic}" konusundan abonelik iptal edildi`);
        }
      }
    };
  }
  
  // Konuya sunucu tarafında abone ol
  private async subscribeToTopic(topic: string): Promise<boolean> {
    try {
      if (this.topicSubscriptions.has(topic)) {
        return true; // Zaten abone olunmuş
      }
      
      await api.post(`/sse/subscribe/${this.clientId}/${topic}`);
      this.topicSubscriptions.add(topic);
      
      // Aktif konuları güncelle
      this.updateState({
        activeTopics: Array.from(this.topicSubscriptions)
      });
      
      this.log(`"${topic}" konusuna sunucuda abone olundu`);
      return true;
    } catch (error) {
      this.log(`"${topic}" konusuna sunucuda abone olunurken hata:`, error);
      return false;
    }
  }
  
  // Konudan sunucu tarafında aboneliği kaldır
  private async unsubscribeFromTopic(topic: string): Promise<boolean> {
    try {
      if (!this.topicSubscriptions.has(topic)) {
        return true; // Zaten abone olunmamış
      }
      
      await api.delete(`/sse/subscribe/${this.clientId}/${topic}`);
      this.topicSubscriptions.delete(topic);
      
      // Aktif konuları güncelle
      this.updateState({
        activeTopics: Array.from(this.topicSubscriptions)
      });
      
      this.log(`"${topic}" konusundan sunucuda abonelik kaldırıldı`);
      return true;
    } catch (error) {
      this.log(`"${topic}" konusundan sunucuda abonelik kaldırılırken hata:`, error);
      return false;
    }
  }
  
  // Konuya mesaj yayınla
  public async publishToTopic<T = any>(topic: string, data: T): Promise<boolean> {
    try {
      if (getTestMode()) {
        this.log(`Test modu: "${topic}" konusuna mesaj yayınlandı`, data);
        return true;
      }
      
      await api.post(`/sse/publish/${topic}`, { data });
      this.log(`"${topic}" konusuna mesaj yayınlandı`, data);
      return true;
    } catch (error) {
      this.log(`"${topic}" konusuna mesaj yayınlanırken hata:`, error);
      return false;
    }
  }
  
  // Tüm bağlı istemcilere yayın yap
  public async broadcast<T = any>(data: T): Promise<boolean> {
    try {
      if (getTestMode()) {
        this.log(`Test modu: Tüm istemcilere yayın yapıldı`, data);
        return true;
      }
      
      await api.post('/sse/broadcast', { data });
      this.log('Tüm istemcilere yayın yapıldı', data);
      return true;
    } catch (error) {
      this.log('Tüm istemcilere yayın yapılırken hata:', error);
      return false;
    }
  }
  
  // Konudaki tüm abonelikleri iptal et
  public unsubscribeAll(topic?: string): void {
    if (topic) {
      if (this.subscriptions.has(topic)) {
        this.subscriptions.delete(topic);
        
        // Sunucuya aboneliği iptal etme isteği gönder
        if (this.isConnected && !getTestMode()) {
          this.unsubscribeFromTopic(topic);
        }
        
        this.log(`"${topic}" konusundaki tüm abonelikler iptal edildi`);
      }
    } else {
      // Tüm konulardaki abonelikleri iptal et
      this.subscriptions.forEach((_, topic) => {
        if (this.isConnected && !getTestMode()) {
          this.unsubscribeFromTopic(topic);
        }
      });
      
      this.subscriptions.clear();
      this.log('Tüm abonelikler iptal edildi');
    }
  }
  
  // Durum değişikliklerini dinle
  public onStateChange(callback: (state: SSEHookState) => void): () => void {
    this.stateListeners.add(callback);
    
    // İlk çağrıda mevcut durumu ilet
    callback(this._state);
    
    // Aboneliği iptal etme işlevi
    return () => {
      this.stateListeners.delete(callback);
    };
  }
  
  // Açılma olayını işle
  private handleOpen(event: Event): void {
    this.log('SSE bağlantısı başarılı');
    
    this.updateState({
      isConnected: true,
      isConnecting: false,
      reconnectAttempt: 0,
      error: null
    });
    
    // Kaydedilmiş abonelikleri yeniden kaydet
    this.resubscribeAll();
    
    // Yapılandırma callback'ini çağır
    this.config.onConnect(this.clientId);
  }
  
  // Hata olayını işle
  private handleError(event: Event): void {
    // Kullanıcı tarafından kapatılmış ise yeniden bağlanma
    if (this.forceClosed) {
      return;
    }
    
    this.log('SSE bağlantı hatası:', event);
    
    const error = event instanceof ErrorEvent ? new Error(event.message) : new Error('SSE error');
    
    this.updateState({
      error,
      isConnecting: false,
      isConnected: false
    });
    
    // Otomatik yeniden bağlanma
    this.scheduleReconnect();
    
    // Yapılandırma callback'ini çağır
    this.config.onError(event);
  }
  
  // Hata mesajı olayını işle
  private handleErrorEvent(event: MessageEvent): void {
    try {
      const errorData = JSON.parse(event.data);
      this.log('SSE hata mesajı:', errorData);
      
      if (errorData.error) {
        toast.error(`SSE Hatası: ${errorData.error}`);
      }
    } catch (error) {
      this.log('SSE hata mesajı işlenirken hata:', error);
    }
  }
  
  // Ping olayını işle
  private handlePing(event: MessageEvent): void {
    this.log('SSE ping alındı');
    
    // Son aktiviteyi güncelle
    this.updateState({
      isConnected: true
    });
  }
  
  // Yayın olayını işle
  private handleBroadcast(event: MessageEvent): void {
    try {
      const message = JSON.parse(event.data);
      this.log('SSE yayın mesajı alındı:', message);
      
      this.updateState({
        lastMessage: {
          type: SSEMessageType.BROADCAST,
          data: message.data,
          timestamp: message.timestamp,
          client_id: message.client_id
        }
      });
      
      // Yapılandırma callback'ini çağır
      this.config.onMessage({
        type: SSEMessageType.BROADCAST,
        data: message.data,
        timestamp: message.timestamp,
        client_id: message.client_id
      });
    } catch (error) {
      this.log('SSE yayın mesajı işlenirken hata:', error);
    }
  }
  
  // Abonelik olayını işle
  private handleSubscription(event: MessageEvent): void {
    try {
      const message = JSON.parse(event.data);
      this.log('SSE abonelik mesajı alındı:', message);
      
      if (message.topic && message.action) {
        if (message.action === 'subscribe') {
          this.topicSubscriptions.add(message.topic);
        } else if (message.action === 'unsubscribe') {
          this.topicSubscriptions.delete(message.topic);
        }
        
        // Aktif konuları güncelle
        this.updateState({
          activeTopics: Array.from(this.topicSubscriptions)
        });
      }
    } catch (error) {
      this.log('SSE abonelik mesajı işlenirken hata:', error);
    }
  }
  
  // Mesaj olayını işle
  private handleMessage(event: MessageEvent): void {
    try {
      const message = JSON.parse(event.data);
      this.log('SSE mesajı alındı:', message);
      
      // Mesaj tipini belirle
      const type = message.type || SSEMessageType.MESSAGE;
      
      // Mesaj nesnesini oluştur
      const sseMessage: SSEMessage = {
        type,
        data: message.data,
        topic: message.topic,
        client_id: message.client_id,
        timestamp: message.timestamp,
        message: message.message
      };
      
      this.updateState({
        lastMessage: sseMessage
      });
      
      // Mesaj bir konuya aitse, konu abonelerine gönder
      if (message.topic && this.subscriptions.has(message.topic)) {
        const callbacks = this.subscriptions.get(message.topic)!;
        callbacks.forEach(callback => {
          try {
            callback(message.data);
          } catch (error) {
            this.log(`Abone callback hatası (${message.topic}):`, error);
          }
        });
      }
      
      // Yapılandırma callback'ini çağır
      this.config.onMessage(sseMessage);
    } catch (error) {
      this.log('SSE mesajı işlenirken hata:', error);
    }
  }
  
  // Yeniden bağlanmayı planla
  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    
    this.reconnectAttempt++;
    
    if (this.reconnectAttempt <= this.config.maxReconnectAttempts) {
      const delay = this.config.reconnectDelay * Math.min(this.reconnectAttempt, 10);
      this.log(`SSE yeniden bağlanma denemesi ${this.reconnectAttempt}/${this.config.maxReconnectAttempts} - ${delay}ms sonra`);
      
      this.updateState({
        reconnectAttempt: this.reconnectAttempt
      });
      
      this.reconnectTimer = setTimeout(() => {
        this.connect();
      }, delay);
    } else {
      this.log('Maksimum yeniden bağlanma denemesi aşıldı, bağlantı kesildi');
      toast.error('SSE bağlantısı kurulamadı. Lütfen sayfayı yenileyin.');
    }
  }
  
  // Zamanlayıcıları temizle
  private clearTimers(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
  
  // Tüm abonelikleri yeniden yap
  private async resubscribeAll(): Promise<void> {
    if (!this.isConnected) return;
    
    const topics = Array.from(this.subscriptions.keys());
    
    for (const topic of topics) {
      await this.subscribeToTopic(topic);
    }
    
    if (topics.length > 0) {
      this.log(`${topics.length} konu için abonelikler yenilendi`);
    }
  }
  
  // Durum güncellemesi
  private updateState(partialState: Partial<SSEHookState>): void {
    this._state = { ...this._state, ...partialState };
    
    // Durum dinleyicilerini bilgilendir
    this.stateListeners.forEach(listener => {
      try {
        listener(this._state);
      } catch (error) {
        this.log('Durum dinleyicisi hatası:', error);
      }
    });
  }
  
  // İstemci ID'si oluştur
  private generateClientId(): string {
    return Math.random().toString(36).substring(2, 15);
  }
  
  // Log
  private log(message: string, ...args: any[]): void {
    if (this.config.debug) {
      console.log(`[SSE] ${message}`, ...args);
    }
  }
}

// Varsayılan SSE servisi örneği
const defaultSSEService = new SSEService({
  debug: true,
  autoConnect: false
});

export default defaultSSEService; 