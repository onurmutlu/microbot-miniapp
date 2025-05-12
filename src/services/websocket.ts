import { toast } from 'react-toastify';
import { getTestMode } from '../utils/testMode';

export interface ConnectionMessage {
  type: 'connection';
  status: 'connected' | 'disconnected' | 'reconnecting';
  client_id?: string;
  attempt?: number;
  timestamp: string;
}

export interface SubscriptionMessage {
  type: 'subscription';
  status: 'subscribed' | 'unsubscribed';
  channel: string;
  timestamp: string;
}

export interface WebSocketMessage {
  type: string;
  content?: any;
  timestamp: string;
}

export type WebSocketHandler = (message: WebSocketMessage) => void;

export type WebSocketStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeoutId: NodeJS.Timeout | null = null;
  private messageHandlers: Map<string, WebSocketHandler[]> = new Map();
  private status: WebSocketStatus = 'disconnected';
  private statusListeners: ((status: WebSocketStatus) => void)[] = [];
  private clientId: string;
  private connectionTimeout = 5000; // 5 saniye
  private pingInterval: NodeJS.Timeout | null = null;
  private pingTimeout: NodeJS.Timeout | null = null;
  private readonly PING_INTERVAL = 30000; // 30 saniye
  private readonly PING_TIMEOUT = 5000; // 5 saniye

  constructor() {
    this.clientId = Math.random().toString(36).substring(2, 15);
    if (!getTestMode()) {
      this.connect();
    } else {
      this.status = 'connected';
    }
  }

  connect() {
    if (getTestMode()) {
      this.status = 'connected';
      return;
    }

    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    // Önceki bağlantıyı temizle
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.setStatus('connecting');
    try {
      // Protokol kontrolü yapan yardımcı fonksiyon
      function getSecureWebSocketUrl(url: string): string {
        // URL protokol içermiyorsa, mevcut sayfanın protokolüne göre ekleyelim
        if (!url.startsWith('ws://') && !url.startsWith('wss://')) {
          const protocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
          url = `${protocol}${url}`;
        }
        
        // Çift /api yolunu temizleyelim
        url = url.replace(/\/api\/api\//, '/api/');
        
        // HTTPS sayfada ws:// protokolü kullanılmışsa wss:// ile değiştirelim
        if (window.location.protocol === 'https:' && url.startsWith('ws://')) {
          console.warn('HTTPS sayfada güvensiz WebSocket (ws://) kullanılamaz. wss:// protokolüne geçiliyor.');
          url = url.replace('ws://', 'wss://');
        }
        
        return url;
      }

      // webSocketUrl oluşturan kısmı da düzeltiyoruz
      let webSocketUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/api/ws';
      
      // API URL'i içindeki olası "/api" kısmını temizleme
      if (import.meta.env.VITE_API_URL) {
        const apiBase = import.meta.env.VITE_API_URL.replace(/^https?:\/\//, '').replace(/\/api$/, '');
        webSocketUrl = `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${apiBase}/api/ws`;
      }

      // WebSocket URL'ini güvenlik için kontrol et
      const secureUrl = getSecureWebSocketUrl(webSocketUrl);
      if (secureUrl !== webSocketUrl) {
        webSocketUrl = secureUrl;
      }
      
      console.log('WebSocket bağlantısı deneniyor:', webSocketUrl);
      
      this.ws = new WebSocket(webSocketUrl);

      // Bağlantı zaman aşımı kontrolü
      const connectionTimeoutId = setTimeout(() => {
        if (this.ws?.readyState !== WebSocket.OPEN) {
          console.error('WebSocket bağlantı zaman aşımı');
          this.ws?.close();
          this.handleReconnect();
        }
      }, this.connectionTimeout);

      this.ws.onopen = () => {
        clearTimeout(connectionTimeoutId);
        this.reconnectAttempts = 0;
        this.setStatus('connected');
        this.sendConnectionMessage('connected');
        this.startPingInterval();
        console.log('WebSocket bağlantısı başarılı');
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          
          // Ping mesajını işle
          if (message.type === 'ping') {
            console.log('Ping alındı:', message.timestamp);
            this.handlePing();
            return;
          }
          
          this.handleMessage(message);
        } catch (error) {
          console.error('WebSocket message parse error:', error);
        }
      };

      this.ws.onclose = (event) => {
        clearTimeout(connectionTimeoutId);
        this.stopPingInterval();
        console.log('WebSocket bağlantısı kapandı:', event.code, event.reason);
        this.setStatus('disconnected');
        this.sendConnectionMessage('disconnected');
        this.handleReconnect();
      };

      this.ws.onerror = (error) => {
        clearTimeout(connectionTimeoutId);
        this.stopPingInterval();
        console.error('WebSocket error:', error);
        this.setStatus('error');
        this.sendConnectionMessage('disconnected');
        this.handleReconnect();
      };
    } catch (error) {
      console.error('WebSocket bağlantı hatası:', error);
      this.setStatus('error');
      this.sendConnectionMessage('disconnected');
      this.handleReconnect();
    }
  }

  private startPingInterval() {
    this.stopPingInterval();
    
    this.pingInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        try {
          const pingMessage = { 
            type: 'ping', 
            timestamp: new Date().toISOString(),
            client_id: this.clientId
          };
          this.ws.send(JSON.stringify(pingMessage));
          console.log('Ping gönderildi:', pingMessage.timestamp);
          
          // Ping timeout kontrolü
          this.pingTimeout = setTimeout(() => {
            console.error('Ping timeout - bağlantı kesildi');
            this.ws?.close();
            this.handleReconnect();
          }, this.PING_TIMEOUT);
        } catch (error) {
          console.error('Ping gönderme hatası:', error);
          this.ws?.close();
          this.handleReconnect();
        }
      }
    }, this.PING_INTERVAL);
  }

  private stopPingInterval() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    if (this.pingTimeout) {
      clearTimeout(this.pingTimeout);
      this.pingTimeout = null;
    }
  }

  private handlePing() {
    if (this.pingTimeout) {
      clearTimeout(this.pingTimeout);
      this.pingTimeout = null;
    }
    
    try {
      if (this.ws?.readyState === WebSocket.OPEN) {
        const pongMessage = {
          type: 'pong',
          timestamp: new Date().toISOString(),
          client_id: this.clientId
        };
        this.ws.send(JSON.stringify(pongMessage));
        console.log('Pong gönderildi:', pongMessage.timestamp);
      }
    } catch (error) {
      console.error('Pong gönderme hatası:', error);
    }
  }

  private sendConnectionMessage(status: 'connected' | 'disconnected' | 'reconnecting') {
    if (this.ws?.readyState === WebSocket.OPEN) {
      const message: ConnectionMessage = {
        type: 'connection',
        status,
        client_id: this.clientId,
        attempt: this.reconnectAttempts,
        timestamp: new Date().toISOString()
      };
      this.ws.send(JSON.stringify(message));
    }
  }

  private setStatus(status: WebSocketStatus) {
    this.status = status;
    this.statusListeners.forEach(listener => listener(status));
  }

  getStatus(): WebSocketStatus {
    if (getTestMode()) {
      return 'connected';
    }
    return this.status;
  }

  onStatusChange(listener: (status: WebSocketStatus) => void) {
    this.statusListeners.push(listener);
    if (getTestMode()) {
      listener('connected');
    }
    return () => {
      this.statusListeners = this.statusListeners.filter(l => l !== listener);
    };
  }

  private handleReconnect() {
    if (getTestMode()) {
      return;
    }

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Yeniden bağlanma denemesi ${this.reconnectAttempts}`);
      this.sendConnectionMessage('reconnecting');
      
      if (this.reconnectTimeoutId) {
        clearTimeout(this.reconnectTimeoutId);
      }
      
      // Exponential backoff
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 30000);
      
      this.reconnectTimeoutId = setTimeout(() => {
        this.connect();
      }, delay);
    } else {
      console.error('Maksimum yeniden bağlanma denemesi aşıldı');
    }
  }

  private handleMessage(message: WebSocketMessage) {
    const handlers = this.messageHandlers.get(message.type) || [];
    handlers.forEach(handler => handler(message));
  }

  subscribe(channel: string, handler: WebSocketHandler) {
    if (!this.messageHandlers.has(channel)) {
      this.messageHandlers.set(channel, []);
    }
    this.messageHandlers.get(channel)?.push(handler);

    if (this.ws?.readyState === WebSocket.OPEN) {
      const message: SubscriptionMessage = {
        type: 'subscription',
        status: 'subscribed',
        channel,
        timestamp: new Date().toISOString()
      };
      this.ws.send(JSON.stringify(message));
    }
  }

  unsubscribe(channel: string, handler: WebSocketHandler) {
    const handlers = this.messageHandlers.get(channel);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index !== -1) {
        handlers.splice(index, 1);
      }
    }

    if (this.ws?.readyState === WebSocket.OPEN) {
      const message: SubscriptionMessage = {
        type: 'subscription',
        status: 'unsubscribed',
        channel,
        timestamp: new Date().toISOString()
      };
      this.ws.send(JSON.stringify(message));
    }
  }

  send(data: any) {
    if (getTestMode()) {
      console.log('Test modu: WebSocket mesajı gönderildi', data);
      return;
    }

    if (this.ws?.readyState === WebSocket.OPEN) {
      const message: WebSocketMessage = {
        type: typeof data === 'string' ? data : data.type || 'message',
        content: typeof data === 'string' ? null : data.content,
        timestamp: new Date().toISOString()
      };
      this.ws.send(JSON.stringify(message));
    }
  }

  disconnect() {
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
    }
    if (this.ws) {
      this.ws.close();
    }
  }
}

export const websocketService = new WebSocketService(); 