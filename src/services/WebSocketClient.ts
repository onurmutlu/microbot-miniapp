import { getTestMode } from '../utils/testMode';
import { ReconnectStrategy } from '../types/system';

// Mesaj tip tanımlamaları
export enum WebSocketMessageType {
  MESSAGE = 'message',
  PING = 'ping',
  PONG = 'pong',
  BROADCAST = 'broadcast',
  CONNECTION = 'connection',
  SUBSCRIPTION = 'subscription',
  ERROR = 'error',
  RECONNECT = 'reconnect',
  STATUS = 'status'
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
  reconnectStrategy?: ReconnectStrategy;
}

// WebSocket servisi için durum bilgisi
export type WebSocketState = {
  isConnected: boolean;
  isConnecting: boolean;
  lastMessage: WebSocketMessage | null;
  reconnectAttempt: number;
  error: Error | null;
  reconnectStrategy: ReconnectStrategy;
  lastReconnectTime: number | null;
  connectionStats: {
    connectedSince: number | null;
    disconnectionCount: number;
    totalReconnects: number;
    lastLatency: number | null;
    avgLatency: number | null;
  };
};

// Bağlantı performans ölçümleri için tip
export interface ConnectionPerformance {
  latency: number; // ms cinsinden
  timestamp: number;
  successful: boolean;
}

export class WebSocketClient {
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
  
  // Performans ölçümleri için
  private latencyMeasurements: ConnectionPerformance[] = [];
  private pingStartTime = 0;
  private connectionStartTime = 0;
  
  // WebSocket durumu
  private _state: WebSocketState = {
    isConnected: false,
    isConnecting: false,
    lastMessage: null,
    reconnectAttempt: 0,
    error: null,
    reconnectStrategy: ReconnectStrategy.EXPONENTIAL,
    lastReconnectTime: null,
    connectionStats: {
      connectedSince: null,
      disconnectionCount: 0,
      totalReconnects: 0,
      lastLatency: null,
      avgLatency: null
    }
  };
  
  // Durum değişikliği için dinleyiciler
  private stateListeners: Set<(state: WebSocketState) => void> = new Set();
  
  // Test modu için simülasyon görevleri
  private testModeTimers: NodeJS.Timeout[] = [];
  private mockReconnectManager = {
    connection_succeeded: true,
    resetRetryCount: () => {},
    reconnect_delay: 3000,
    next_attempt_time: 0
  };
  
  // ReconnectManager - SSE servisi ile uyumlu olması için
  public reconnectManager = {
    connection_succeeded: false,
    resetRetryCount: () => { this.reconnectAttempt = 0; },
    reconnect_delay: 3000,
    next_attempt_time: 0
  };
  
  constructor(config: WebSocketConfig = {}) {
    // Varsayılan yapılandırma değerleri
    const defaultConfig: Required<WebSocketConfig> = {
      url: import.meta.env.VITE_API_URL ? 
        `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${import.meta.env.VITE_API_URL.replace(/^https?:\/\//, '').replace(/\/api$/, '')}/api/ws` : 
        `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://localhost:8000/api/ws`,
      reconnectDelay: 3000,
      maxReconnectAttempts: 10,
      pingInterval: 20000,
      debug: false,
      autoConnect: true,
      onOpen: () => {},
      onClose: () => {},
      onError: () => {},
      onMessage: () => {},
      reconnectStrategy: ReconnectStrategy.EXPONENTIAL
    };
    
    this.config = { ...defaultConfig, ...config };
    this.clientId = this.generateClientId();
    
    // WebSocket URL'ini protokole göre düzenle
    let wsUrl = this.config.url;
    
    // URL protokol içermiyorsa, uygun protokolü ekleyelim
    if (!wsUrl.startsWith('ws://') && !wsUrl.startsWith('wss://')) {
      const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
      wsUrl = `${protocol}://${wsUrl}`;
    }
    
    // /api/api gibi çift API yolu olmaması için kontrol
    wsUrl = wsUrl.replace(/\/api\/api\//, '/api/');
    
    // HTTPS sayfada ws:// protokolü kullanılmışsa wss:// ile değiştirelim
    if (window.location.protocol === 'https:' && wsUrl.startsWith('ws://')) {
      console.warn('HTTPS sayfada güvensiz WebSocket (ws://) kullanılamaz. wss:// protokolüne geçiliyor.');
      wsUrl = wsUrl.replace('ws://', 'wss://');
    }
    
    this.wsUrl = `${wsUrl}/${this.clientId}`;
    
    // Yeniden bağlanma stratejisini ayarla
    this._state.reconnectStrategy = this.config.reconnectStrategy;
    
    // Test modunda otomatik bağlanmayı atla
    if (this.config.autoConnect && !getTestMode()) {
      this.connect();
    }
    
    // Test modunda, isConnected'ı true olarak ayarla
    if (getTestMode()) {
      this.updateState({ 
        isConnected: true,
        connectionStats: {
          ...this._state.connectionStats,
          connectedSince: Date.now()
        }
      });
      this.log('Test modu aktif: WebSocket bağlantısı simüle ediliyor');
      
      // Test modu için periyodik mesajlar
      this.setupTestModeSimulation();
    }
  }
  
  // Test modu simülasyonu kurulum
  private setupTestModeSimulation(): void {
    if (!getTestMode()) return;
    
    // Tüm eski zamanlayıcıları temizle
    this.clearTestModeTimers();
    
    // Her 30 saniyede bir rastgele ping mesajı
    const pingTimer = setInterval(() => {
      const mockPingMessage: WebSocketMessage = {
        type: WebSocketMessageType.PING,
        timestamp: new Date().toISOString(),
        client_id: this.clientId
      };
      
      // Test pong mesajını işle
      setTimeout(() => {
        const mockPongMessage: WebSocketMessage = {
          type: WebSocketMessageType.PONG,
          timestamp: new Date().toISOString(),
          client_id: this.clientId,
          data: {
            latency: Math.floor(Math.random() * 100) + 10
          }
        };
        
        this.updateState({
          lastMessage: mockPongMessage,
          connectionStats: {
            ...this._state.connectionStats,
            lastLatency: mockPongMessage.data.latency,
            avgLatency: this._state.connectionStats.avgLatency ? 
              (this._state.connectionStats.avgLatency * 0.7 + mockPongMessage.data.latency * 0.3) : 
              mockPongMessage.data.latency
          }
        });
        
        // Abone olan dinleyicileri bilgilendir
        this.notifySubscribers(mockPongMessage);
        
      }, Math.floor(Math.random() * 100) + 20);
      
    }, 30000);
    
    // Her 2 dakikada bir durum mesajı
    const statusTimer = setInterval(() => {
      const mockStatusMessage: WebSocketMessage = {
        type: WebSocketMessageType.STATUS,
        timestamp: new Date().toISOString(),
        client_id: this.clientId,
        data: {
          client_count: Math.floor(Math.random() * 50) + 1,
          server_uptime: Math.floor(Math.random() * 86400) + 3600,
          server_status: 'healthy'
        }
      };
      
      this.updateState({
        lastMessage: mockStatusMessage
      });
      
      // Abone olan dinleyicileri bilgilendir
      this.notifySubscribers(mockStatusMessage);
      
    }, 120000);
    
    // Zamanlayıcıları kaydet
    this.testModeTimers.push(pingTimer, statusTimer);
    
    this.log('Test modu: WebSocket simülasyonu başlatıldı');
  }
  
  // Test modu zamanlayıcılarını temizle
  private clearTestModeTimers(): void {
    this.testModeTimers.forEach(timer => clearInterval(timer));
    this.testModeTimers = [];
  }
  
  // Test modu için aboneleri bilgilendir
  private notifySubscribers(message: WebSocketMessage): void {
    if (message.topic && this.subscriptions.has(message.topic)) {
      const callbacks = this.subscriptions.get(message.topic)!;
      callbacks.forEach(callback => {
        try {
          callback(message.data);
        } catch (error) {
          this.log(`Test modu: Abone callback hatası (${message.topic}):`, error);
        }
      });
    }
    
    // Kullanıcı callback'ini çağır
    this.config.onMessage(message);
  }
  
  // Durum bilgilerini al
  get state(): WebSocketState {
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
  
  // Yeniden bağlanma stratejisini güncelle
  public setReconnectStrategy(strategy: ReconnectStrategy): void {
    this.config.reconnectStrategy = strategy;
    this.updateState({ reconnectStrategy: strategy });
    this.log(`Yeniden bağlanma stratejisi değiştirildi: ${strategy}`);
  }
  
  // Performans ölçümlerini al
  public getPerformanceMetrics(): {
    latencies: ConnectionPerformance[];
    avgLatency: number;
    minLatency: number;
    maxLatency: number;
    successRate: number;
  } {
    const latencies = this.latencyMeasurements.map(m => m.latency);
    const successfulConnections = this.latencyMeasurements.filter(m => m.successful).length;
    
    return {
      latencies: this.latencyMeasurements,
      avgLatency: latencies.length ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0,
      minLatency: latencies.length ? Math.min(...latencies) : 0,
      maxLatency: latencies.length ? Math.max(...latencies) : 0,
      successRate: this.latencyMeasurements.length ? successfulConnections / this.latencyMeasurements.length : 1
    };
  }
  
  // WebSocket URL'ini protokol güvenliği için tekrar kontrol et ve alternatifler dene
  private getWebSocketUrl(): string {
    // Ana WSS URL
    let wsUrl = this.wsUrl;
    
    // Alternatif path'ler
    const wsPaths = [
      wsUrl,
      wsUrl.replace('/api/ws', '/ws'),
      wsUrl.replace('/api/ws', '/socket'),
      wsUrl.replace('/api/ws', '/api/socket')
    ];
    
    return wsPaths[this.reconnectAttempt % wsPaths.length];
  }
  
  // Bağlantı kur fonksiyonunu güncelle
  public connect(): void {
    if (getTestMode()) {
      // ReconnectManager durumunu güncelle
      if (this.reconnectManager) {
        this.reconnectManager.connection_succeeded = true;
        this.reconnectManager.next_attempt_time = 0;
      }
      
      this.updateState({ 
        isConnected: true, 
        isConnecting: false,
        connectionStats: {
          ...this._state.connectionStats,
          connectedSince: Date.now()
        }
      });
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
      const wsUrl = this.getWebSocketUrl();
      this.log(`WebSocket bağlantısı deneniyor: ${wsUrl}`);
      this.updateState({ isConnecting: true });
      
      this.connectionStartTime = Date.now();
      this.ws = new WebSocket(wsUrl);
      
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
    
    // Test modunda bağlantı kesme simülasyonu
    if (getTestMode()) {
      this.clearTestModeTimers();
      
      if (force) {
        this.updateState({
          isConnected: false,
          isConnecting: false,
          connectionStats: {
            ...this._state.connectionStats,
            connectedSince: null,
            disconnectionCount: this._state.connectionStats.disconnectionCount + 1
          }
        });
        this.log('Test modu: WebSocket bağlantısı manuel olarak kapatıldı (simülasyon)');
      }
      return;
    }
    
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
      isConnecting: false,
      connectionStats: {
        ...this._state.connectionStats,
        connectedSince: null,
        disconnectionCount: this._state.connectionStats.disconnectionCount + 1
      }
    });
    
    if (force) {
      this.log('WebSocket bağlantısı manuel olarak kapatıldı');
    }
  }
  
  // Bağlantıyı tekrar kur
  public reconnect(): void {
    if (getTestMode()) {
      this.log('Test modu: Yeniden bağlantı simüle ediliyor');
      
      // Test modunda başarılı bağlantı simülasyonu
      setTimeout(() => {
        this.updateState({
          isConnected: true,
          isConnecting: false,
          reconnectAttempt: 0,
          error: null,
          connectionStats: {
            ...this._state.connectionStats,
            connectedSince: Date.now(),
            totalReconnects: this._state.connectionStats.totalReconnects + 1
          }
        });
      }, 500);
      
      return;
    }
    
    this.disconnect();
    this.reconnectAttempt = 0; // Sayacı sıfırla
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
  public onStateChange(callback: (state: WebSocketState) => void): () => void {
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
      this.pingStartTime = Date.now();
      this.send(WebSocketMessageType.PING);
    }
  }
  
  // Açılma olayını işle
  private handleOpen(event: Event): void {
    const connectionTime = Date.now() - this.connectionStartTime;
    this.log(`WebSocket bağlantısı başarılı (${connectionTime}ms)`);
    
    // Bağlantı performansını kaydet
    this.recordConnectionPerformance(connectionTime, true);
    
    // ReconnectManager durumunu güncelle - BackEnd'e gönderilecek
    if (this.reconnectManager) {
      this.reconnectManager.connection_succeeded = true;
      this.reconnectManager.next_attempt_time = 0;
    }
    
    this.updateState({
      isConnected: true,
      isConnecting: false,
      reconnectAttempt: 0,
      error: null,
      lastReconnectTime: this.reconnectAttempt > 0 ? Date.now() : null,
      connectionStats: {
        ...this._state.connectionStats,
        connectedSince: Date.now(),
        totalReconnects: this._state.reconnectAttempt > 0 ? 
          this._state.connectionStats.totalReconnects + 1 : 
          this._state.connectionStats.totalReconnects
      }
    });
    
    // Ping zamanlayıcısını başlat
    this.startPingTimer();
    
    // Kaydedilmiş abonelikleri yeniden kaydet
    this.resubscribeAll();
    
    // Sunucuya bağlantı durumu bilgisini gönder
    this.send(WebSocketMessageType.CONNECTION, {
      status: 'connected',
      reconnect_attempt: this.reconnectAttempt,
      reconnect_manager: this.reconnectManager, // Reconnect manager durumunu gönder
      client_info: {
        user_agent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform
      }
    });
    
    // Yapılandırma callback'ini çağır
    this.config.onOpen(event);
  }
  
  // Kapanma olayını işle
  private handleClose(event: CloseEvent): void {
    // WebSocket kapandığında
    this.updateState({
      isConnected: false,
      isConnecting: false,
      connectionStats: {
        ...this._state.connectionStats,
        connectedSince: null,
        disconnectionCount: this._state.connectionStats.disconnectionCount + 1
      }
    });
    
    // Zamanlayıcıları temizle
    this.clearTimers();
    
    // Test modunda bağlantı kesinti simülasyonu yapma
    if (getTestMode()) {
      this.log('Test modu: WebSocket bağlantısı kesildi (simülasyon)');
      return;
    }
    
    if (!this.forceClosed) {
      // Kullanıcı tarafından kapatılmadıysa otomatik yeniden bağlan
      this.log(`Bağlantı kesildi (${event.code}): ${event.reason || 'Bilinmeyen neden'}`);
      this.scheduleReconnect();
    } else {
      this.log('Bağlantı manuel olarak kapatıldı, yeniden bağlanma devre dışı.');
      this.forceClosed = false;
    }
    
    // Kullanıcı callback'ini çağır
    this.config.onClose(event);
  }
  
  // Hata olayını işle
  private handleError(event: Event): void {
    // WebSocket hatası oluştuğunda
    const errorMessage = event instanceof ErrorEvent ? event.message : 'WebSocket bağlantı hatası';
    
    // Hata durumunu güncelle
    this.updateState({
      error: new Error(errorMessage)
    });
    
    // Test modunda hata oluştuğunda
    if (getTestMode()) {
      this.log('Test modu: WebSocket bağlantı hatası (simülasyon)', errorMessage);
      return;
    }
    
    // Hatayı logla
    this.log('WebSocket hatası:', errorMessage);
    
    // Kullanıcı callback'ini çağır
    this.config.onError(event);
  }
  
  // Mesaj olayını işle
  private handleMessage(event: MessageEvent): void {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);
      if (this.config.debug) {
        this.log(`Mesaj alındı (${message.type})`, message);
      }
      
      this.updateState({
        lastMessage: message
      });
      
      // Mesaj türüne göre işle
      switch (message.type) {
        case WebSocketMessageType.PONG:
          this.lastPong = Date.now();
          // Ping-pong latency ölçümü
          if (this.pingStartTime > 0) {
            const latency = this.lastPong - this.pingStartTime;
            this.updateState({
              connectionStats: {
                ...this._state.connectionStats,
                lastLatency: latency,
                avgLatency: this._state.connectionStats.avgLatency ? 
                  (this._state.connectionStats.avgLatency * 0.7 + latency * 0.3) : latency
              }
            });
            this.pingStartTime = 0;
          }
          break;
          
        case WebSocketMessageType.PING:
          // Ping'e yanıt olarak pong gönder
          this.send(WebSocketMessageType.PONG, {
            client_id: this.clientId,
            reconnect_manager: this.reconnectManager
          });
          break;
          
        case WebSocketMessageType.STATUS:
          // Sunucudan gelen durum mesajlarını işle
          if (message.data?.client_count !== undefined && this.config.debug) {
            // Bağlı istemci sayısı güncellemesi (sadece debug modunda)
            this.log(`Sunucuda ${message.data.client_count} aktif bağlantı var`);
          }
          break;
          
        case WebSocketMessageType.RECONNECT:
          // Sunucudan gelen yeniden bağlanma isteği
          if (message.data?.reason) {
            this.log(`Sunucu yeniden bağlanma istiyor: ${message.data.reason}`);
            this.reconnect();
          }
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
          // Toast bildirimleri devre dışı bırakıldı
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
      // Yeniden bağlanma stratejisine göre gecikme hesapla
      const delay = this.calculateReconnectDelay();
      
      // ReconnectManager durumunu güncelle
      if (this.reconnectManager) {
        this.reconnectManager.connection_succeeded = false;
        this.reconnectManager.reconnect_delay = delay;
        this.reconnectManager.next_attempt_time = Date.now() + delay;
      }
      
      this.log(`WebSocket yeniden bağlanma denemesi ${this.reconnectAttempt}/${this.config.maxReconnectAttempts} - ${delay}ms sonra`);
      
      this.updateState({
        reconnectAttempt: this.reconnectAttempt
      });
      
      // Yeniden bağlanma sürecini göstermek için UI bildirim
      this.notifyReconnecting(delay, this.reconnectAttempt);
      
      this.reconnectTimer = setTimeout(() => {
        this.connect();
      }, delay);
    } else {
      this.handleMaxReconnectExceeded();
    }
  }
  
  // Yeniden bağlanma stratejisine göre gecikme hesapla
  private calculateReconnectDelay(): number {
    const baseDelay = this.config.reconnectDelay;
    
    switch (this._state.reconnectStrategy) {
      case ReconnectStrategy.LINEAR:
        // Doğrusal artış: baseDelay * attemptNumber
        return baseDelay * this.reconnectAttempt;
        
      case ReconnectStrategy.EXPONENTIAL:
        // Üstel artış: baseDelay * 2^(attemptNumber-1)
        return baseDelay * Math.pow(2, Math.min(this.reconnectAttempt - 1, 6));
        
      case ReconnectStrategy.FIBONACCI:
        // Fibonacci dizisi: Her yeni gecikme, önceki iki gecikmenin toplamı
        return this.getFibonacciDelay(this.reconnectAttempt) * baseDelay;
        
      case ReconnectStrategy.RANDOM:
        // Rastgele gecikme: baseDelay ile baseDelay*2 arası
        const min = baseDelay;
        const max = baseDelay * 2;
        return Math.floor(Math.random() * (max - min + 1)) + min;
        
      default:
        return baseDelay;
    }
  }
  
  // Fibonacci serisindeki n. elemanı hesapla
  private getFibonacciDelay(n: number): number {
    if (n <= 0) return 0;
    if (n === 1) return 1;
    
    let a = 0, b = 1;
    for (let i = 2; i <= n; i++) {
      const temp = a + b;
      a = b;
      b = temp;
    }
    return b;
  }
  
  // Yeniden bağlanma durumunu bildir
  private notifyReconnecting(delay: number, attempt: number): void {
    // Toast bildirimleri devre dışı bırakıldı
    // Sadece konsola logla
    const delaySeconds = Math.round(delay / 1000);
    this.log(`WebSocket bağlantısı kesik. ${delaySeconds} saniye içinde yeniden bağlanılacak. (Deneme ${attempt}/${this.config.maxReconnectAttempts})`);
  }
  
  // Maksimum yeniden bağlanma denemesi aşıldığında çağrılır
  private handleMaxReconnectExceeded(): void {
    this.log('Maksimum yeniden bağlanma denemesi aşıldı, bağlantı kesildi');
    // Toast bildirimi devre dışı bırakıldı
    // toast.error('WebSocket bağlantısı kurulamadı. Lütfen sayfayı yenileyin.');
  }
  
  // Bağlantı performansını kaydet
  private recordConnectionPerformance(latency: number, successful: boolean): void {
    this.latencyMeasurements.push({
      latency,
      timestamp: Date.now(),
      successful
    });
    
    // Sadece son 50 ölçümü tut
    if (this.latencyMeasurements.length > 50) {
      this.latencyMeasurements.shift();
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
  private updateState(partialState: Partial<WebSocketState>): void {
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

// Singleton WebSocket istemci örneği
export const webSocketClient = new WebSocketClient({
  debug: true,
  autoConnect: false,
  reconnectStrategy: ReconnectStrategy.EXPONENTIAL
});

export default webSocketClient;