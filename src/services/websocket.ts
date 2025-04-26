import { toast } from 'react-toastify';
import { getTestMode } from '../utils/testMode';

export type WebSocketMessage = {
  type: string;
  data: any;
  timestamp: number;
};

export type WebSocketHandler = (message: WebSocketMessage) => void;

export type WebSocketStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private messageHandlers: Map<string, WebSocketHandler[]> = new Map();
  private status: WebSocketStatus = 'disconnected';
  private statusListeners: ((status: WebSocketStatus) => void)[] = [];

  constructor() {
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

    this.setStatus('connecting');
    try {
      this.ws = new WebSocket(import.meta.env.VITE_WS_URL);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        this.setStatus('connected');
        toast.success('WebSocket bağlantısı kuruldu');
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('WebSocket message parse error:', error);
          toast.error('Mesaj işlenirken hata oluştu');
        }
      };

      this.ws.onclose = () => {
        this.setStatus('disconnected');
        this.handleReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.setStatus('error');
        toast.error('WebSocket bağlantı hatası');
      };
    } catch (error) {
      console.error('WebSocket bağlantı hatası:', error);
      this.setStatus('error');
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
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
      this.reconnectTimeout = setTimeout(() => {
        this.reconnectAttempts++;
        this.connect();
      }, delay);
    } else {
      toast.error('WebSocket bağlantısı kesildi');
    }
  }

  private handleMessage(message: WebSocketMessage) {
    const handlers = this.messageHandlers.get(message.type) || [];
    handlers.forEach(handler => handler(message));
  }

  subscribe(type: string, handler: WebSocketHandler) {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, []);
    }
    this.messageHandlers.get(type)?.push(handler);
  }

  unsubscribe(type: string, handler: WebSocketHandler) {
    const handlers = this.messageHandlers.get(type);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index !== -1) {
        handlers.splice(index, 1);
      }
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
        data: typeof data === 'string' ? null : data.data,
        timestamp: Date.now()
      };
      this.ws.send(JSON.stringify(message));
    } else {
      console.error('WebSocket bağlantısı açık değil');
      toast.error('Mesaj gönderilemedi: Bağlantı kesik');
    }
  }

  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    if (this.ws) {
      this.ws.close();
    }
  }
}

export const websocketService = new WebSocketService(); 