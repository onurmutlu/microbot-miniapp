import { toast } from 'react-toastify';
import api from '../utils/api';
import { getTestMode } from '../utils/testMode';
import { wrappedPost, wrappedGet } from '../utils/api';
import sseLocalCache from './sseLocalCache';

export interface SSEMessage {
  type: string;
  data: any;
  topic?: string;
  timestamp: string;
  id?: string;
  priority?: 'low' | 'normal' | 'high' | 'critical';
  ttl?: number; // Mesaj süresi (saniye)
  sender?: string;
  metadata?: Record<string, any>;
}

export interface SSEConnectionHistoryEntry {
  timestamp: string;
  action: 'connect' | 'disconnect' | 'reconnect' | 'error';
  reason?: string;
  duration?: number; // Önceki bağlantı süresi (ms)
}

export interface SSEStats {
  messagesReceived: number;
  connectionAttempts: number;
  lastConnectedAt: Date | null;
  lastDisconnectedAt: Date | null;
  uptime: number; // ms
  messageRate: number; // mesaj/saniye
  activeTopics: string[];
  online?: boolean;
  pendingMessages?: number;
  cachedMessages?: number;
}

export type SSEHandler = (message: SSEMessage) => void;
export type SSEConnectionStateHandler = (state: SSEConnectionState) => void;
export type SSEConnectionState = 'connecting' | 'connected' | 'disconnected' | 'error';

class SSEService {
  private eventSource: EventSource | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeoutId: NodeJS.Timeout | null = null;
  private reconnectDelay = 3000;
  private eventHandlers: Map<string, SSEHandler[]> = new Map();
  private status: SSEConnectionState = 'disconnected';
  private statusListeners: SSEConnectionStateHandler[] = [];
  private clientId: string;
  private subscriptions: Set<string> = new Set();
  
  // Yeni özellikler
  private connectionHistory: SSEConnectionHistoryEntry[] = [];
  private messagesArchive: Map<string, SSEMessage[]> = new Map(); // Konu başına arşivlenen mesajlar
  private messageFilters: Map<string, (message: SSEMessage) => boolean> = new Map(); // Mesaj filtreleri
  private pingIntervalId: NodeJS.Timeout | null = null;
  private pingTimeoutId: NodeJS.Timeout | null = null;
  private readonly PING_INTERVAL = 30000; // 30 saniye
  private readonly PING_TIMEOUT = 5000; // 5 saniye
  private connectionStartTime: Date | null = null;
  private lastPingTime: Date | null = null;
  private messagesReceived = 0;
  private connectionAttempts = 0;
  private archivedMessageLimit = 100; // Konu başına arşivlenen maksimum mesaj sayısı
  private debugMode = false;
  private online = navigator.onLine;
  private offlineMessagesQueue: Array<{ topic?: string, data: any, options?: any }> = [];
  private networkEventListenersAdded = false;
  private reconnectManager: {
    connection_succeeded: boolean;
    resetRetryCount: () => void;
    reconnect_delay: number;
    next_attempt_time: number;
  } | null = null;

  constructor() {
    this.clientId = Math.random().toString(36).substring(2, 15);
    
    // Çevrimdışı durumu izleme
    this.addNetworkEventListeners();
    
    // Test modu veya normal mod başlatma
    if (!getTestMode()) {
      if (this.online) {
        this.connect();
      } else {
        this.status = 'disconnected';
        toast.warning('Çevrimdışı modda çalışılıyor');
        this.loadCachedSubscriptions();
      }
    } else {
      this.status = 'connected';
      this.connectionStartTime = new Date();
      this.addToConnectionHistory('connect');
    }
  }

  private addNetworkEventListeners() {
    if (this.networkEventListenersAdded) return;
    
    // Çevrimiçi olduğunda
    window.addEventListener('online', this.handleOnline);
    
    // Çevrimdışı olduğunda
    window.addEventListener('offline', this.handleOffline);
    
    this.networkEventListenersAdded = true;
  }
  
  private loadCachedSubscriptions() {
    const cachedSubscriptions = sseLocalCache.getCachedSubscriptions();
    if (cachedSubscriptions.length > 0) {
      console.log('Önbellekten abonelikler yükleniyor:', cachedSubscriptions);
      cachedSubscriptions.forEach(topic => {
        this.subscriptions.add(topic);
      });
    }
  }
  
  private sendQueuedMessages() {
    if (this.offlineMessagesQueue.length === 0) return;
    
    console.log(`${this.offlineMessagesQueue.length} adet bekleyen mesaj gönderiliyor...`);
    
    // Kuyruktaki mesajları gönder
    for (const queuedMsg of this.offlineMessagesQueue) {
      if (queuedMsg.topic) {
        this.publishToTopic(queuedMsg.topic, queuedMsg.data, queuedMsg.options)
          .catch(error => console.error('Kuyruktan mesaj gönderirken hata:', error));
      } else {
        this.broadcast(queuedMsg.data, queuedMsg.options)
          .catch(error => console.error('Kuyruktan yayın yaparken hata:', error));
      }
    }
    
    // Kuyruğu temizle
    this.offlineMessagesQueue = [];
  }

  connect() {
    if (getTestMode()) {
      console.log('Test modu: SSE bağlantısı simüle ediliyor');
      this.status = 'connected';
      this.connectionStartTime = new Date();
      this.addToConnectionHistory('connect');
      this.notifyStatusListeners();
      
      // ReconnectManager'ı doğru başlat
      this.reconnectManager = {
        connection_succeeded: true,
        resetRetryCount: () => { this.reconnectAttempts = 0; },
        reconnect_delay: 3000,
        next_attempt_time: 0
      };
      
      // Test modunda otomatik mock mesajlar oluştur
      this.setupMockMessages();
      return;
    }
    
    // Çevrimdışıysa bağlanmaya çalışma
    if (!this.online) {
      console.log('Çevrimdışı durumda SSE bağlantısı kurulamıyor');
      this.setStatus('disconnected');
      return;
    }

    // Önceki bağlantıyı temizle
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    this.connectionAttempts++;
    this.setStatus('connecting');
    try {
      // API URL düzeltildi - 8000 portu ve çift /api sorununu çözdük
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const sseUrl = apiBaseUrl.endsWith('/api') 
        ? `${apiBaseUrl}/sse/${this.clientId}`
        : `${apiBaseUrl}/api/sse/${this.clientId}`;
      
      console.log('SSE bağlantısı deneniyor:', sseUrl);
      
      this.eventSource = new EventSource(sseUrl);

      this.eventSource.onopen = () => {
        this.reconnectAttempts = 0;
        this.connectionStartTime = new Date();
        this.setStatus('connected');
        this.addToConnectionHistory('connect');
        console.log('SSE bağlantısı başarılı');
        toast.success('SSE bağlantısı kuruldu');
        
        // ReconnectManager durumunu güncelle
        if (this.reconnectManager) {
          this.reconnectManager.connection_succeeded = true;
          this.reconnectManager.next_attempt_time = 0;
        } else {
          this.reconnectManager = {
            connection_succeeded: true,
            resetRetryCount: () => { this.reconnectAttempts = 0; },
            reconnect_delay: 3000,
            next_attempt_time: 0
          };
        }
        
        // Ping mekanizmasını başlat
        this.startPingInterval();
        
        // Yeniden bağlanıldığında önceki abonelikleri tekrar kur
        this.resubscribeToTopics();
      };

      this.eventSource.onmessage = (event) => {
        try {
          const message: SSEMessage = JSON.parse(event.data);
          this.processIncomingMessage(message);
        } catch (error) {
          console.error('SSE mesaj işleme hatası:', error);
          toast.error('Mesaj işlenirken hata oluştu');
        }
      };

      this.eventSource.addEventListener('error', (event) => {
        console.error('SSE bağlantı hatası:', event);
        
        // Bağlantı hatası nedenini belirle
        let errorReason = 'Bağlantı hatası';
        
        // ReadyState kontrolü
        if (this.eventSource) {
          switch (this.eventSource.readyState) {
            case EventSource.CONNECTING:
              errorReason = 'Bağlantı kurulamadı';
              break;
            case EventSource.CLOSED:
              errorReason = 'Bağlantı beklenmedik şekilde kapandı';
              break;
          }
        }
        
        this.setStatus('error');
        this.addToConnectionHistory('error', errorReason);
        
        // Tarayıcının otomatik yeniden bağlanma mekanizması çalışmıyorsa manuel olarak yeniden bağlan
        // EventSource.CLOSED (2) olması durumunda browser oto-yeniden bağlanma yapmıyor
        if (this.eventSource && this.eventSource.readyState === EventSource.CLOSED) {
          // Event source'u kapat ve temizle
          this.eventSource.close();
          this.eventSource = null;
          
          // Yeniden bağlanma işlemini başlat
          this.handleReconnect();
        }
      });

      // Özel mesaj tiplerini dinle
      ['broadcast', 'topic_message', 'ping', 'system', 'notification'].forEach(messageType => {
        this.eventSource?.addEventListener(messageType, (event) => {
          try {
            const message: SSEMessage = JSON.parse(event.data);
            this.processIncomingMessage(message);
          } catch (error) {
            console.error(`SSE ${messageType} işleme hatası:`, error);
          }
        });
      });
    } catch (error) {
      console.error('SSE bağlantı hatası:', error);
      this.setStatus('error');
      this.addToConnectionHistory('error', String(error));
      this.handleReconnect();
    }
  }

  // Test modu için mock SSE mesajları
  private setupMockMessages() {
    if (!getTestMode()) return;
    
    console.log('Test modu: Mock SSE mesajları kurulumu yapılıyor');
    
    // Her 15 saniyede bir rastgele bildirim mesajı gönder
    setInterval(() => {
      const mockMessage: SSEMessage = {
        type: 'notification',
        data: {
          title: 'Test Bildirimi',
          message: `Test mesajı ${new Date().toLocaleTimeString()}`,
          timestamp: new Date().toISOString(),
          priority: 'normal'
        },
        topic: 'notifications',
        timestamp: new Date().toISOString(),
        id: `mock-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        priority: 'normal'
      };
      
      this.processIncomingMessage(mockMessage);
    }, 15000);
    
    // Her 30 saniyede bir sistem durumu mesajı gönder
    setInterval(() => {
      const mockMessage: SSEMessage = {
        type: 'system',
        data: {
          status: 'healthy',
          uptime: Math.floor(Math.random() * 1000),
          memory_usage: Math.floor(Math.random() * 100),
          active_connections: Math.floor(Math.random() * 20),
        },
        timestamp: new Date().toISOString(),
        id: `mock-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        priority: 'low'
      };
      
      this.processIncomingMessage(mockMessage);
    }, 30000);
  }

  private startPingInterval() {
    this.stopPingInterval();
    
    this.pingIntervalId = setInterval(() => {
      if (this.status === 'connected') {
        this.lastPingTime = new Date();
        
        // Test modunda gerçek ping isteği gönderme
        if (getTestMode()) {
          console.log('Test modu: SSE ping simüle ediliyor');
          
          // Test modunda başarılı ping yanıtı simülasyonu
          const mockResponse = {
            success: true,
            timestamp: new Date().toISOString(),
            client_id: this.clientId,
            status: 'connected'
          };
          
          // Test modunda bir mesaj işlem kuyruğuna ekle
          setTimeout(() => {
            const pingMessage: SSEMessage = {
              type: 'ping',
              data: mockResponse,
              timestamp: new Date().toISOString(),
              id: `mock-ping-${Date.now()}`
            };
            
            // Mesajı işle
            this.processIncomingMessage(pingMessage);
          }, 100);
          
          // Ping timeout'ı sıfırla
          if (this.pingTimeoutId) {
            clearTimeout(this.pingTimeoutId);
            this.pingTimeoutId = null;
          }
          return;
        }
        
        // API URL düzeltmesi - çift /api sorununu çözmek için
        const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        const pingUrl = apiBaseUrl.endsWith('/api') 
          ? `${apiBaseUrl}/sse/ping/${this.clientId}`
          : `/api/sse/ping/${this.clientId}`;
        
        wrappedPost(pingUrl, { timestamp: this.lastPingTime.toISOString() })
          .then(response => {
            if (!response.success) {
              console.warn('Ping yanıtı başarısız:', response.message);
              this.handleReconnect();
            }
          })
          .catch(error => {
            console.error('Ping gönderme hatası:', error);
            this.handleReconnect();
          });
        
        // Ping timeout kontrolü
        this.pingTimeoutId = setTimeout(() => {
          // Test modunda timeout görmezden gel
          if (getTestMode()) return;
          
          console.error('Ping timeout - bağlantı kesildi');
          if (this.eventSource) {
            this.eventSource.close();
          }
          this.handleReconnect();
        }, this.PING_TIMEOUT);
      }
    }, this.PING_INTERVAL);
  }

  private stopPingInterval() {
    if (this.pingIntervalId) {
      clearInterval(this.pingIntervalId);
      this.pingIntervalId = null;
    }

    if (this.pingTimeoutId) {
      clearTimeout(this.pingTimeoutId);
      this.pingTimeoutId = null;
    }
  }

  private processIncomingMessage(message: SSEMessage) {
    // Debug modunda mesaj detaylarını göster
    if (this.debugMode) {
      console.log('SSE mesajı alındı:', message);
    }
    
    // Mesaj önbellekleme
    if (message.type !== 'ping') {
      try {
        // Mesajı önbelleğe ekle
        sseLocalCache.cacheMessage(message);
        
        // Ölçümleri güncelle
        this.messagesReceived++;
      } catch (error) {
        console.error('Mesaj önbellekleme hatası:', error);
      }
    }
    
    // Ping yanıtını işle
    if (message.type === 'ping' && this.pingTimeoutId) {
      clearTimeout(this.pingTimeoutId);
      this.pingTimeoutId = null;
      return; // Ping mesajlarını kullanıcıya iletme
    }
    
    // Mesajı konularına göre arşivle
    this.archiveMessage(message);
    
    // Mesaj filtrelerini kontrol et
    for (const [filterKey, filterFn] of this.messageFilters.entries()) {
      if (!filterFn(message)) {
        if (this.debugMode) {
          console.log(`Mesaj "${filterKey}" filtresi tarafından engellendi`);
        }
        return; // Filtreye takılan mesajları işleme
      }
    }
    
    // Tüm kayıtlı işleyicilere mesajı ilet
    // 1. Konu tabanlı işleyiciler
    if (message.topic && this.eventHandlers.has(`topic:${message.topic}`)) {
      const topicHandlers = this.eventHandlers.get(`topic:${message.topic}`) || [];
      for (const handler of topicHandlers) {
        try {
          handler(message);
        } catch (error) {
          console.error(`Konu işleyicisi hatası (${message.topic}):`, error);
        }
      }
    }
    
    // 2. Öncelik tabanlı işleyiciler
    if (message.priority && this.eventHandlers.has(`priority:${message.priority}`)) {
      const priorityHandlers = this.eventHandlers.get(`priority:${message.priority}`) || [];
      for (const handler of priorityHandlers) {
        try {
          handler(message);
        } catch (error) {
          console.error(`Öncelik işleyicisi hatası (${message.priority}):`, error);
        }
      }
    }
    
    // 3. Mesaj tipi tabanlı işleyiciler
    if (this.eventHandlers.has(message.type)) {
      const typeHandlers = this.eventHandlers.get(message.type) || [];
      for (const handler of typeHandlers) {
        try {
          handler(message);
        } catch (error) {
          console.error(`Tip işleyicisi hatası (${message.type}):`, error);
        }
      }
    }
    
    // 4. Genel mesaj işleyicileri
    if (this.eventHandlers.has('message')) {
      const messageHandlers = this.eventHandlers.get('message') || [];
      for (const handler of messageHandlers) {
        try {
          handler(message);
        } catch (error) {
          console.error('Genel mesaj işleyicisi hatası:', error);
        }
      }
    }
  }
  
  private archiveMessage(message: SSEMessage) {
    // Mesaj kritik değilse ve TTL 0 ise arşivleme
    if (message.priority !== 'critical' && message.ttl === 0) {
      return;
    }
    
    // Global mesaj arşivi
    if (!this.messagesArchive.has('global')) {
      this.messagesArchive.set('global', []);
    }
    const globalArchive = this.messagesArchive.get('global')!;
    globalArchive.unshift(message);
    if (globalArchive.length > this.archivedMessageLimit) {
      globalArchive.pop();
    }
    
    // Konu bazlı arşiv
    if (message.topic) {
      if (!this.messagesArchive.has(message.topic)) {
        this.messagesArchive.set(message.topic, []);
      }
      
      const topicArchive = this.messagesArchive.get(message.topic)!;
      topicArchive.unshift(message);
      if (topicArchive.length > this.archivedMessageLimit) {
        topicArchive.pop();
      }
    }
    
    // Tip bazlı arşiv
    if (!this.messagesArchive.has(`type:${message.type}`)) {
      this.messagesArchive.set(`type:${message.type}`, []);
    }
    
    const typeArchive = this.messagesArchive.get(`type:${message.type}`)!;
    typeArchive.unshift(message);
    if (typeArchive.length > this.archivedMessageLimit) {
      typeArchive.pop();
    }
  }

  private addToConnectionHistory(action: SSEConnectionHistoryEntry['action'], reason?: string, duration?: number) {
    const entry: SSEConnectionHistoryEntry = {
      timestamp: new Date().toISOString(),
      action,
      reason,
      duration
    };
    
    this.connectionHistory.unshift(entry);
    
    // En fazla 50 kayıt tut
    if (this.connectionHistory.length > 50) {
      this.connectionHistory.pop();
    }
  }

  private setStatus(status: SSEConnectionState) {
    this.status = status;
    
    if (status === 'disconnected' || status === 'error') {
      this.connectionStartTime = null;
      this.stopPingInterval();
      this.addToConnectionHistory(status === 'error' ? 'error' : 'disconnect');
    }
    
    this.notifyStatusListeners();
  }

  private notifyStatusListeners() {
    this.statusListeners.forEach(listener => listener(this.status));
  }

  getStatus(): SSEConnectionState {
    if (getTestMode()) {
      return 'connected';
    }
    return this.status;
  }

  onStatusChange(listener: SSEConnectionStateHandler) {
    this.statusListeners.push(listener);
    if (getTestMode()) {
      listener('connected');
    }
    return () => {
      this.statusListeners = this.statusListeners.filter(l => l !== listener);
    };
  }

  private handleReconnect() {
    // Yeniden bağlanma işlemini yönet
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }

    // Test modunda yeniden bağlanma simulasyonu
    if (getTestMode()) {
      console.log('Test modu: SSE yeniden bağlanma simüle ediliyor');
      
      // ReconnectManager nesnesi oluştur
      if (!this.reconnectManager) {
        this.reconnectManager = {
          connection_succeeded: true,
          resetRetryCount: () => {},
          reconnect_delay: 3000,
          next_attempt_time: Date.now() + 3000
        };
      } else {
        // Eğer varsa, durumunu güncelle
        this.reconnectManager.connection_succeeded = true;
      }
      
      // Belirli bir süre sonra bağlanmış olarak işaretle
      setTimeout(() => {
        this.reconnectAttempts = 0;
        this.setStatus('connected');
        this.addToConnectionHistory('reconnect', 'Test modu otomatik yeniden bağlantı');
        
        // Test modunda reconnectManager.connection_succeeded'ı true olarak ayarla
        if (this.reconnectManager) {
          this.reconnectManager.connection_succeeded = true;
          this.reconnectManager.next_attempt_time = 0;
        }
        
        console.log('Test modu: SSE yeniden bağlantı başarılı (simülasyon)');
        toast.success('SSE bağlantısı yenilendi (test modu)');
      }, 1500);
      
      return;
    }

    this.reconnectAttempts++;
    
    // Maksimum yeniden deneme sayısını kontrol et
    if (this.reconnectAttempts > this.maxReconnectAttempts) {
      console.error(`SSE maksimum yeniden bağlanma sayısına ulaşıldı (${this.maxReconnectAttempts})`);
      this.setStatus('error');
      this.addToConnectionHistory('error', 'Maksimum yeniden bağlanma denemesi aşıldı');
      toast.error('SSE sunucusuna bağlanılamıyor. Lütfen sayfayı yenileyin.');
      return;
    }
    
    // Üstel geri çekilme algoritması ile gecikme hesapla
    const delay = Math.min(1000 * (2 ** this.reconnectAttempts), 30000);
    
    console.log(`SSE yeniden bağlanma denemesi ${this.reconnectAttempts}/${this.maxReconnectAttempts} - ${delay}ms sonra`);
    
    // ReconnectManager kontrolü
    if (!this.reconnectManager) {
      this.reconnectManager = {
        connection_succeeded: false,
        resetRetryCount: () => { this.reconnectAttempts = 0; },
        reconnect_delay: delay,
        next_attempt_time: Date.now() + delay
      };
    } else {
      this.reconnectManager.connection_succeeded = false;
      this.reconnectManager.reconnect_delay = delay;
      this.reconnectManager.next_attempt_time = Date.now() + delay;
    }
    
    this.addToConnectionHistory('reconnect', `Deneme ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
    
    // Kullanıcıya bildiri göster
    if (this.reconnectAttempts === 1 || this.reconnectAttempts % 3 === 0) {
      toast.info(`SSE sunucusuna yeniden bağlanılıyor... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    }
    
    // Zamanlayıcı ile yeniden bağlan
    this.reconnectTimeoutId = setTimeout(() => {
      this.connect();
    }, delay);
  }

  on(eventType: string, handler: SSEHandler) {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }
    this.eventHandlers.get(eventType)?.push(handler);
    
    return () => this.off(eventType, handler);
  }

  off(eventType: string, handler: SSEHandler) {
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index !== -1) {
        handlers.splice(index, 1);
      }
    }
  }

  onTopic(topic: string, handler: SSEHandler) {
    return this.on(`topic:${topic}`, handler);
  }
  
  onPriority(priority: SSEMessage['priority'], handler: SSEHandler) {
    if (!priority) return () => {};
    return this.on(`priority:${priority}`, handler);
  }

  subscribeTopic(topic: string) {
    if (getTestMode()) {
      console.log(`Test modu: ${topic} konusuna abone olundu`);
      this.subscriptions.add(topic);
      return Promise.resolve(true);
    }
    
    // Çevrimdışı modda önbelleğe ekle
    if (!this.online) {
      console.log(`Çevrimdışı: ${topic} konusuna abone olundu (yerel olarak)`);
      this.subscriptions.add(topic);
      
      // Abonelikleri önbelleğe kaydet
      sseLocalCache.cacheSubscriptions(Array.from(this.subscriptions));
      
      return Promise.resolve(true);
    }

    return wrappedPost(`/api/sse/subscribe/${this.clientId}/${topic}`)
      .then(response => {
        if (response.success) {
          console.log(`${topic} konusuna abone olundu`);
          this.subscriptions.add(topic);
          
          // Abonelikleri önbelleğe kaydet
          sseLocalCache.cacheSubscriptions(Array.from(this.subscriptions));
          
          return true;
        } else {
          console.error(`${topic} konusuna abone olunamadı:`, response.message);
          return false;
        }
      })
      .catch(error => {
        console.error(`${topic} konusuna abone olma hatası:`, error);
        return false;
      });
  }

  unsubscribeTopic(topic: string) {
    if (getTestMode()) {
      console.log(`Test modu: ${topic} konusundan abonelik kaldırıldı`);
      this.subscriptions.delete(topic);
      return Promise.resolve(true);
    }
    
    // Çevrimdışı modda yerel olarak kaldır
    if (!this.online) {
      console.log(`Çevrimdışı: ${topic} konusundan abonelik kaldırıldı (yerel olarak)`);
      this.subscriptions.delete(topic);
      
      // Abonelikleri önbelleğe kaydet
      sseLocalCache.cacheSubscriptions(Array.from(this.subscriptions));
      
      return Promise.resolve(true);
    }

    return wrappedPost(`/api/sse/unsubscribe/${this.clientId}/${topic}`)
      .then(response => {
        if (response.success) {
          console.log(`${topic} konusundan abonelik kaldırıldı`);
          this.subscriptions.delete(topic);
          
          // Abonelikleri önbelleğe kaydet
          sseLocalCache.cacheSubscriptions(Array.from(this.subscriptions));
          
          return true;
        } else {
          console.error(`${topic} konusundan abonelik kaldırılamadı:`, response.message);
          return false;
        }
      })
      .catch(error => {
        console.error(`${topic} konusundan abonelik kaldırma hatası:`, error);
        return false;
      });
  }

  // Tüm konulara toplu abonelik
  async subscribeToTopics(topics: string[]) {
    if (topics.length === 0) return true;
    
    if (getTestMode()) {
      console.log(`Test modu: ${topics.join(', ')} konularına toplu abone olundu`);
      topics.forEach(topic => this.subscriptions.add(topic));
      return true;
    }
    
    // Çevrimdışı modda yerel olarak ekle
    if (!this.online) {
      console.log(`Çevrimdışı: ${topics.join(', ')} konularına toplu abone olundu (yerel olarak)`);
      topics.forEach(topic => this.subscriptions.add(topic));
      
      // Abonelikleri önbelleğe kaydet
      sseLocalCache.cacheSubscriptions(Array.from(this.subscriptions));
      
      return true;
    }
    
    try {
      const response = await wrappedPost(`/api/sse/subscribe-batch/${this.clientId}`, { topics });
      
      if (response.success) {
        console.log(`${topics.join(', ')} konularına toplu abone olundu`);
        topics.forEach(topic => this.subscriptions.add(topic));
        
        // Abonelikleri önbelleğe kaydet
        sseLocalCache.cacheSubscriptions(Array.from(this.subscriptions));
        
        return true;
      } else {
        console.error(`Toplu abonelik başarısız:`, response.message);
        return false;
      }
    } catch (error) {
      console.error(`Toplu abonelik hatası:`, error);
      return false;
    }
  }

  private async resubscribeToTopics() {
    if (this.subscriptions.size === 0) return;
    
    // Tüm abonelikleri yeniden kur
    const topics = Array.from(this.subscriptions);
    console.log('Önceki abonelikler yeniden oluşturuluyor:', topics);
    
    // Toplu abonelik
    await this.subscribeToTopics(topics);
  }

  // Sunucudaki tüm istemcilere mesaj gönder
  async broadcast(data: any, options?: {
    priority?: SSEMessage['priority'];
    ttl?: number;
    metadata?: Record<string, any>;
  }) {
    if (getTestMode()) {
      console.log('Test modu: Yayın mesajı gönderildi', data);
      return Promise.resolve({ success: true });
    }
    
    // Çevrimdışıysa mesajı kuyruğa ekle
    if (!this.online) {
      console.log('Çevrimdışı: Mesaj kuyruğa eklendi (broadcast)', data);
      this.offlineMessagesQueue.push({ data, options });
      
      // Sahteden bir mesaj oluştur ve yerel olarak işle
      const offlineMessage: SSEMessage = {
        type: 'broadcast',
        data,
        timestamp: new Date().toISOString(),
        priority: options?.priority || 'normal',
        ttl: options?.ttl,
        sender: this.clientId,
        metadata: options?.metadata,
        id: `offline-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
      };
      
      // Mesajı işle
      this.processIncomingMessage(offlineMessage);
      
      return Promise.resolve({ success: true, offline: true });
    }

    const message: Partial<SSEMessage> = {
      type: 'broadcast',
      data,
      timestamp: new Date().toISOString(),
      priority: options?.priority || 'normal',
      ttl: options?.ttl,
      sender: this.clientId,
      metadata: options?.metadata
    };

    return wrappedPost('/api/sse/broadcast', { message });
  }

  // Belirli bir konuya mesaj yayınla
  async publishToTopic(topic: string, data: any, options?: {
    priority?: SSEMessage['priority'];
    ttl?: number;
    metadata?: Record<string, any>;
  }) {
    if (getTestMode()) {
      console.log(`Test modu: ${topic} konusuna mesaj yayınlandı`, data);
      return Promise.resolve({ success: true });
    }
    
    // Çevrimdışıysa mesajı kuyruğa ekle
    if (!this.online) {
      console.log(`Çevrimdışı: Mesaj kuyruğa eklendi (${topic})`, data);
      this.offlineMessagesQueue.push({ topic, data, options });
      
      // Sahteden bir mesaj oluştur ve yerel olarak işle
      const offlineMessage: SSEMessage = {
        type: 'topic_message',
        topic,
        data,
        timestamp: new Date().toISOString(),
        priority: options?.priority || 'normal',
        ttl: options?.ttl,
        sender: this.clientId,
        metadata: options?.metadata,
        id: `offline-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
      };
      
      // Mesajı işle
      this.processIncomingMessage(offlineMessage);
      
      return Promise.resolve({ success: true, offline: true });
    }

    const message: Partial<SSEMessage> = {
      type: 'topic_message',
      topic,
      data,
      timestamp: new Date().toISOString(),
      priority: options?.priority || 'normal',
      ttl: options?.ttl,
      sender: this.clientId,
      metadata: options?.metadata
    };

    return wrappedPost(`/api/sse/publish/${topic}`, { message });
  }
  
  // Çoklu konulara aynı mesajı yayınla
  async publishToMultipleTopics(topics: string[], data: any, options?: {
    priority?: SSEMessage['priority'];
    ttl?: number;
    metadata?: Record<string, any>;
  }) {
    if (getTestMode()) {
      console.log(`Test modu: ${topics.join(', ')} konularına mesaj yayınlandı`, data);
      return Promise.resolve({ success: true });
    }
    
    // Çevrimdışıysa her konu için ayrı ayrı yayınla
    if (!this.online) {
      console.log(`Çevrimdışı: Mesaj kuyruğa eklendi (Çoklu: ${topics.join(', ')})`, data);
      
      // Her konu için ayrı mesaj oluştur
      for (const topic of topics) {
        await this.publishToTopic(topic, data, options);
      }
      
      return Promise.resolve({ success: true, offline: true });
    }
    
    const message: Partial<SSEMessage> = {
      type: 'topic_message',
      data,
      timestamp: new Date().toISOString(),
      priority: options?.priority || 'normal',
      ttl: options?.ttl,
      sender: this.clientId,
      metadata: options?.metadata
    };
    
    return wrappedPost(`/api/sse/publish-multi`, { topics, message });
  }
  
  // Mesaj filtresi ekle
  addMessageFilter(filterKey: string, filterFn: (message: SSEMessage) => boolean) {
    this.messageFilters.set(filterKey, filterFn);
    return () => this.removeMessageFilter(filterKey);
  }
  
  // Mesaj filtresi kaldır
  removeMessageFilter(filterKey: string) {
    return this.messageFilters.delete(filterKey);
  }
  
  // Arşivlenmiş mesajları al
  getArchivedMessages(key: string = 'global'): SSEMessage[] {
    return this.messagesArchive.get(key) || [];
  }
  
  // Arşivlenmiş mesajları temizle
  clearArchivedMessages(key?: string) {
    if (key) {
      this.messagesArchive.delete(key);
    } else {
      this.messagesArchive.clear();
    }
  }
  
  // Bağlantı geçmişini al
  getConnectionHistory(): SSEConnectionHistoryEntry[] {
    return [...this.connectionHistory];
  }
  
  // İstatistikleri al
  getStats(): SSEStats {
    let uptime = 0;
    if (this.connectionStartTime) {
      uptime = new Date().getTime() - this.connectionStartTime.getTime();
    }
    
    // Mesaj hızı hesapla (son 1 dakika)
    const recentMessages = this.getArchivedMessages('global')
      .filter(msg => {
        const msgTime = new Date(msg.timestamp).getTime();
        return (new Date().getTime() - msgTime) < 60000;
      });
    
    const messageRate = recentMessages.length / 60; // mesaj/saniye
    
    return {
      messagesReceived: this.messagesReceived,
      connectionAttempts: this.connectionAttempts,
      lastConnectedAt: this.connectionStartTime,
      lastDisconnectedAt: this.connectionHistory.find(h => h.action === 'disconnect' || h.action === 'error')
        ? new Date(this.connectionHistory.find(h => h.action === 'disconnect' || h.action === 'error')!.timestamp)
        : null,
      uptime,
      messageRate,
      activeTopics: Array.from(this.subscriptions),
      online: this.online,
      pendingMessages: this.offlineMessagesQueue.length,
      cachedMessages: sseLocalCache.getCachedMessages().length
    };
  }
  
  // Debug modu ayarla
  setDebugMode(enabled: boolean) {
    this.debugMode = enabled;
    console.log(`SSE debug modu ${enabled ? 'aktif' : 'devre dışı'}`);
    return this.debugMode;
  }
  
  // Arşivlenen mesaj limitini ayarla
  setArchivedMessageLimit(limit: number) {
    this.archivedMessageLimit = Math.max(1, limit);
    return this.archivedMessageLimit;
  }
  
  // Yeniden bağlanma denemesi sayısını ayarla
  setMaxReconnectAttempts(attempts: number) {
    this.maxReconnectAttempts = Math.max(1, attempts);
    return this.maxReconnectAttempts;
  }

  disconnect() {
    if (getTestMode()) {
      this.setStatus('disconnected');
      return;
    }

    if (this.eventSource) {
      try {
        this.eventSource.close();
      } catch (error) {
        console.error('EventSource kapatılırken hata:', error);
      }
      this.eventSource = null;
    }

    this.stopPingInterval();
    
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }

    const now = new Date();
    const disconnectDuration = this.connectionStartTime 
      ? now.getTime() - this.connectionStartTime.getTime() 
      : undefined;
    
    this.setStatus('disconnected');
    this.addToConnectionHistory('disconnect', 'Kullanıcı tarafından bağlantı kesildi', disconnectDuration);
    console.log('SSE bağlantısı kapatıldı');
  }

  // Çevrimdışı durumu kontrolü
  isOnline(): boolean {
    return this.online;
  }
  
  // Bekleyen çevrimdışı mesaj sayısı
  getPendingMessagesCount(): number {
    return this.offlineMessagesQueue.length;
  }
  
  // Çevrimdışı mesajları temizle
  clearOfflineMessagesQueue(): void {
    this.offlineMessagesQueue = [];
  }
  
  // Tüm yerel verileri temizle
  clearLocalData(): void {
    sseLocalCache.clearAllCache();
    this.clearOfflineMessagesQueue();
  }
  
  // Önbellek ayarlarını al
  getCacheSettings() {
    return sseLocalCache.getSettings();
  }
  
  // Önbellek ayarlarını güncelle
  updateCacheSettings(settings: any) {
    return sseLocalCache.updateSettings(settings);
  }

  /**
   * Tüm kaynakları temizle, uygulama kapanırken çağrılmalıdır
   */
  dispose() {
    // Bağlantıyı kapat
    this.disconnect();

    // Tüm zamanlayıcıları temizle
    this.stopPingInterval();
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }

    // Ağ olay dinleyicilerini kaldır
    if (this.networkEventListenersAdded) {
      window.removeEventListener('online', this.handleOnline);
      window.removeEventListener('offline', this.handleOffline);
      this.networkEventListenersAdded = false;
    }

    // Son durumu logla
    console.log('SSE servisi kapatıldı ve kaynaklar temizlendi');
  }

  /**
   * Çevrimiçi durumuna geçildiğinde çağrılır
   */
  private handleOnline = () => {
    console.log('Ağ bağlantısı kuruldu, SSE yeniden bağlanılıyor...');
    this.online = true;
    toast.success('Çevrimiçi moda geçildi');
    
    // Bağlantıyı yeniden kur
    this.reconnectAttempts = 0; // Sayacı sıfırla
    this.connect();
    
    // Çevrimdışıyken sıraya alınan mesajları gönder
    this.sendQueuedMessages();
  };

  /**
   * Çevrimdışı durumuna geçildiğinde çağrılır
   */
  private handleOffline = () => {
    console.log('Ağ bağlantısı kesildi, SSE çevrimdışı moda geçiyor...');
    this.online = false;
    toast.warning('Çevrimdışı moda geçildi');
    
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    
    this.setStatus('disconnected');
    this.addToConnectionHistory('disconnect', 'Ağ bağlantısı kesildi');
  };
}

// Singleton örneği oluştur
export const sseService = new SSEService();

export default sseService; 