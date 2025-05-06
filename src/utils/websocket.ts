import { toast } from './toast';
import { getTestMode } from './testMode';

// Mesaj tip tanımlamaları
export enum WebSocketMessageType {
  MESSAGE = 'message',
  PING = 'ping',
  PONG = 'pong',
  BROADCAST = 'broadcast',
  CONNECTION = 'connection',
  SUBSCRIPTION = 'subscription',
  ERROR = 'error'
}

// Mesaj veri tipi
export interface WebSocketMessage<T = any> {
  type: WebSocketMessageType;
  data?: T;
  topic?: string;
  client_id?: string;
  timestamp?: string;
  message?: string;
  error?: string;
}

// Abonelik bilgisi tipi
export interface Subscription {
  topic: string;
  callback: (data: any) => void;
}

// WebSocket servis yapılandırması
export interface WebSocketConfig {
  url?: string;
  reconnectDelay?: number;
  maxReconnectAttempts?: number;
  pingInterval?: number;
  debug?: boolean;
  autoConnect?: boolean;
  onOpen?: (event: Event) => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (event: Event) => void;
  onMessage?: (message: WebSocketMessage) => void;
}

// WebSocket servisi için kanca tiplerini tanımla
export type WebSocketHookState = {
  isConnected: boolean;
  isConnecting: boolean;
  lastMessage: WebSocketMessage | null;
  reconnectAttempt: number;
  error: Error | null;
};

export class WebSocketService {
  private ws: WebSocket | null = null;
  private config: Required<WebSocketConfig>;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private pingTimer: NodeJS.Timeout | null = null;
  private reconnectAttempt = 0;
  private lastPong = 0;
  private subscriptions: Map<string, Set<(data: any) => void>> = new Map();
  private clientId: string;
  private wsUrl: string;
  private forceClosed = false;
  
  // WebSocket durumu
  private _state: WebSocketHookState = {
    isConnected: false,
    isConnecting: false,
    lastMessage: null,
    reconnectAttempt: 0,
    error: null
  };
  
  // Durum değişikliği için dinleyiciler
  private stateListeners: Set<(state: WebSocketHookState) => void> = new Set();
  
  constructor(config: WebSocketConfig = {}) {
    // Varsayılan yapılandırma değerleri
    const defaultConfig: Required<WebSocketConfig> = {
      url: import.meta.env.VITE_API_URL ? `ws://${import.meta.env.VITE_API_URL.replace(/^https?:\/\//, '')}/ws` : 'ws://localhost:8000/api/ws',
      reconnectDelay: 3000,
      maxReconnectAttempts: 10,
      pingInterval: 20000,
      debug: false,
      autoConnect: true,
      onOpen: () => {},
      onClose: () => {},
      onError: () => {},
      onMessage: () => {}
    };
    
    this.config = { ...defaultConfig, ...config };
    this.clientId = this.generateClientId();
    this.wsUrl = `${this.config.url}/${this.clientId}`;
    
    // Test modunda otomatik bağlanmayı atla
    if (this.config.autoConnect && !getTestMode()) {
      this.connect();
    }
    
    // Test modunda, isConnected'ı true olarak ayarla
    if (getTestMode()) {
      this.updateState({ isConnected: true });
      this.log('Test modu aktif: WebSocket bağlantısı simüle ediliyor');
    }
  }
  
  // Durum bilgilerini al
  get state(): WebSocketHookState {
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
  
  // WebSocket bağlantısını başlat
  public connect(): void {
    if (getTestMode()) {
      this.updateState({ isConnected: true, isConnecting: false });
      return;
    }
    
    // Zaten bağlı veya bağlanıyor ise tekrar bağlanma
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }
    
    // Zorlayarak kapatılmış ise bağlanma
    if (this.forceClosed) {
      return;
    }
    
    try {
      this.log(`WebSocket bağlantısı deneniyor: ${this.wsUrl}`);
      this.updateState({ isConnecting: true });
      
      this.ws = new WebSocket(this.wsUrl);
      
      // WebSocket olaylarını dinle
      this.ws.onopen = this.handleOpen.bind(this);
      this.ws.onclose = this.handleClose.bind(this);
      this.ws.onerror = this.handleError.bind(this);
      this.ws.onmessage = this.handleMessage.bind(this);
    } catch (error) {
      this.handleError(error as Event);
    }
  }
  
  // WebSocket bağlantısını kapat
  public disconnect(force = false): void {
    this.forceClosed = force;
    
    // Zamanlayıcıları temizle
    this.clearTimers();
    
    // WebSocket bağlantısını kapat
    if (this.ws) {
      try {
        this.ws.close(1000, 'Client disconnected');
      } catch (error) {
        this.log('WebSocket kapatılırken hata:', error);
      }
      this.ws = null;
    }
    
    this.updateState({
      isConnected: false,
      isConnecting: false
    });
    
    if (force) {
      this.log('WebSocket bağlantısı manuel olarak kapatıldı');
    }
  }
  
  // Bağlantıyı tekrar kur
  public reconnect(): void {
    this.forceClosed = false;
    this.disconnect();
    this.connect();
  }
  
  // Mesaj gönder
  public send<T = any>(type: WebSocketMessageType, data?: T, topic?: string): boolean {
    if (getTestMode()) {
      this.log(`Test modu: Mesaj gönderildi (${type})`, data);
      return true;
    }
    
    if (!this.isConnected) {
      this.log('WebSocket bağlı değil, mesaj gönderilemiyor');
      return false;
    }
    
    try {
      const message: WebSocketMessage<T> = {
        type,
        timestamp: new Date().toISOString(),
        client_id: this.clientId
      };
      
      if (data !== undefined) {
        message.data = data;
      }
      
      if (topic) {
        message.topic = topic;
      }
      
      this.ws?.send(JSON.stringify(message));
      this.log(`Mesaj gönderildi (${type})`, data);
      return true;
    } catch (error) {
      this.log('Mesaj gönderilirken hata:', error);
      return false;
    }
  }
  
  // Yayın mesajı gönder (tüm bağlı istemcilere)
  public broadcast<T = any>(data: T): boolean {
    return this.send(WebSocketMessageType.BROADCAST, data);
  }
  
  // Belirli bir konuya mesaj gönder
  public sendToTopic<T = any>(topic: string, data: T): boolean {
    return this.send(WebSocketMessageType.MESSAGE, data, topic);
  }
  
  // Konuya abone ol
  public subscribe<T = any>(topic: string, callback: (data: T) => void): () => void {
    if (!this.subscriptions.has(topic)) {
      this.subscriptions.set(topic, new Set());
      
      // Sunucuya abone olma isteği gönder
      if (this.isConnected && !getTestMode()) {
        this.send(WebSocketMessageType.SUBSCRIPTION, { action: 'subscribe', topic });
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
            this.send(WebSocketMessageType.SUBSCRIPTION, { action: 'unsubscribe', topic });
          }
          
          this.log(`"${topic}" konusundan abonelik iptal edildi`);
        }
      }
    };
  }
  
  // Konudaki tüm abonelikleri iptal et
  public unsubscribeAll(topic?: string): void {
    if (topic) {
      if (this.subscriptions.has(topic)) {
        this.subscriptions.delete(topic);
        
        // Sunucuya aboneliği iptal etme isteği gönder
        if (this.isConnected && !getTestMode()) {
          this.send(WebSocketMessageType.SUBSCRIPTION, { action: 'unsubscribe', topic });
        }
        
        this.log(`"${topic}" konusundaki tüm abonelikler iptal edildi`);
      }
    } else {
      // Tüm konulardaki abonelikleri iptal et
      this.subscriptions.forEach((_, topic) => {
        if (this.isConnected && !getTestMode()) {
          this.send(WebSocketMessageType.SUBSCRIPTION, { action: 'unsubscribe', topic });
        }
      });
      
      this.subscriptions.clear();
      this.log('Tüm abonelikler iptal edildi');
    }
  }
  
  // Durum değişikliklerini dinle
  public onStateChange(callback: (state: WebSocketHookState) => void): () => void {
    this.stateListeners.add(callback);
    
    // İlk çağrıda mevcut durumu ilet
    callback(this._state);
    
    // Aboneliği iptal etme işlevi
    return () => {
      this.stateListeners.delete(callback);
    };
  }
  
  // Ping gönder
  private sendPing(): void {
    if (this.isConnected) {
      this.send(WebSocketMessageType.PING);
    }
  }
  
  // Açılma olayını işle
  private handleOpen(event: Event): void {
    this.log('WebSocket bağlantısı başarılı');
    
    this.updateState({
      isConnected: true,
      isConnecting: false,
      reconnectAttempt: 0,
      error: null
    });
    
    // Ping zamanlayıcısını başlat
    this.startPingTimer();
    
    // Kaydedilmiş abonelikleri yeniden kaydet
    this.resubscribeAll();
    
    // Yapılandırma callback'ini çağır
    this.config.onOpen(event);
  }
  
  // Kapanma olayını işle
  private handleClose(event: CloseEvent): void {
    this.log(`WebSocket bağlantısı kapandı: ${event.code} ${event.reason}`);
    
    this.updateState({
      isConnected: false,
      isConnecting: false
    });
    
    // Zamanlayıcıları temizle
    this.clearTimers();
    
    // Zorla kapatılmadıysa yeniden bağlan
    if (!this.forceClosed && !getTestMode()) {
      this.scheduleReconnect();
    }
    
    // Yapılandırma callback'ini çağır
    this.config.onClose(event);
  }
  
  // Hata olayını işle
  private handleError(event: Event): void {
    this.log('WebSocket bağlantı hatası:', event);
    
    const error = event instanceof ErrorEvent ? new Error(event.message) : new Error('WebSocket error');
    
    this.updateState({
      error,
      isConnecting: false
    });
    
    // Yapılandırma callback'ini çağır
    this.config.onError(event);
  }
  
  // Mesaj olayını işle
  private handleMessage(event: MessageEvent): void {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);
      this.log(`Mesaj alındı (${message.type})`, message);
      
      this.updateState({
        lastMessage: message
      });
      
      // Mesaj türüne göre işle
      switch (message.type) {
        case WebSocketMessageType.PONG:
          this.lastPong = Date.now();
          break;
          
        case WebSocketMessageType.PING:
          // Ping'e yanıt olarak pong gönder
          this.send(WebSocketMessageType.PONG);
          break;
          
        case WebSocketMessageType.MESSAGE:
        case WebSocketMessageType.BROADCAST:
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
          break;
          
        case WebSocketMessageType.ERROR:
          this.log('Sunucu hatası:', message.error);
          if (message.error) {
            toast.error(`WebSocket Hatası: ${message.error}`);
          }
          break;
      }
      
      // Yapılandırma callback'ini çağır
      this.config.onMessage(message);
    } catch (error) {
      this.log('Mesaj işlenirken hata:', error);
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
      this.log(`WebSocket yeniden bağlanma denemesi ${this.reconnectAttempt}/${this.config.maxReconnectAttempts} - ${delay}ms sonra`);
      
      this.updateState({
        reconnectAttempt: this.reconnectAttempt
      });
      
      this.reconnectTimer = setTimeout(() => {
        this.connect();
      }, delay);
    } else {
      this.log('Maksimum yeniden bağlanma denemesi aşıldı, bağlantı kesildi');
      toast.error('WebSocket bağlantısı kurulamadı. Lütfen sayfayı yenileyin.');
    }
  }
  
  // Ping zamanlayıcısını başlat
  private startPingTimer(): void {
    this.clearPingTimer();
    
    this.pingTimer = setInterval(() => {
      this.sendPing();
      
      // Son pong'dan bu yana çok zaman geçtiyse bağlantıyı yeniden kur
      const pongTimeout = this.config.pingInterval * 2.5;
      if (this.lastPong && Date.now() - this.lastPong > pongTimeout) {
        this.log('Pong zaman aşımı, bağlantı yeniden kuruluyor');
        this.reconnect();
      }
    }, this.config.pingInterval);
  }
  
  // Ping zamanlayıcısını temizle
  private clearPingTimer(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }
  
  // Tüm zamanlayıcıları temizle
  private clearTimers(): void {
    this.clearPingTimer();
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
  
  // Tüm abonelikleri yeniden yap
  private resubscribeAll(): void {
    if (!this.isConnected) return;
    
    this.subscriptions.forEach((_, topic) => {
      this.send(WebSocketMessageType.SUBSCRIPTION, { action: 'subscribe', topic });
    });
    
    if (this.subscriptions.size > 0) {
      this.log(`${this.subscriptions.size} konu için abonelikler yenilendi`);
    }
  }
  
  // Durum güncellemesi
  private updateState(partialState: Partial<WebSocketHookState>): void {
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
      console.log(`[WebSocket] ${message}`, ...args);
    }
  }
}

// Varsayılan WebSocket servisi örneği
const defaultWebSocketService = new WebSocketService({
  debug: true,
  autoConnect: false
});

export default defaultWebSocketService; 