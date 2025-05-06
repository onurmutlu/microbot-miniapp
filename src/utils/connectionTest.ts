import api from './api';
import { toast } from 'react-toastify';
import { getTestMode } from './testMode';

// API_BASE_URL'yi api.ts'den alıyoruz
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const WS_BASE_URL = `ws://${import.meta.env.VITE_API_URL?.replace(/^https?:\/\//, '') || 'localhost:8000'}/ws`;
const CONNECTION_TIMEOUT = 5000; // 5 saniye

export async function testApiConnection(): Promise<boolean> {
  // Test modunda çalışıyorsa bağlantı testini atla
  if (getTestMode()) {
    console.log('Test modu aktif: API bağlantı testi atlanıyor');
    return true;
  }

  try {
    const response = await api.get('/health');
    return response.status === 200;
  } catch (error) {
    console.error('API bağlantı hatası:', error);
    toast.error('API bağlantısı kurulamadı');
    return false;
  }
}

export async function testWebSocketConnection(): Promise<boolean> {
  // Test modunda çalışıyorsa WebSocket testini atla
  if (getTestMode()) {
    console.log('Test modu aktif: WebSocket bağlantı testi atlanıyor');
    return true;
  }

  return new Promise((resolve) => {
    try {
      console.log('WebSocket bağlantısı deneniyor:', WS_BASE_URL);
      const ws = new WebSocket(WS_BASE_URL);
      let timeoutId: NodeJS.Timeout;
      let isResolved = false;

      const cleanup = () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
          ws.close();
        }
      };

      const resolveOnce = (result: boolean) => {
        if (!isResolved) {
          isResolved = true;
          cleanup();
          resolve(result);
        }
      };

      timeoutId = setTimeout(() => {
        console.error('WebSocket bağlantı zaman aşımı');
        resolveOnce(false);
      }, CONNECTION_TIMEOUT);

      ws.onopen = () => {
        console.log('WebSocket bağlantısı başarılı');
        resolveOnce(true);
      };

      ws.onerror = (error) => {
        console.error('WebSocket bağlantı hatası:', error);
        resolveOnce(false);
      };

      ws.onclose = (event) => {
        console.log('WebSocket bağlantısı kapandı:', event.code, event.reason);
        if (!isResolved) {
          resolveOnce(false);
        }
      };
    } catch (error) {
      console.error('WebSocket bağlantı hatası:', error);
      resolve(false);
    }
  });
}

export async function runConnectionTests(): Promise<{
  apiConnected: boolean;
  wsConnected: boolean;
}> {
  // Test modunda çalışıyorsa testleri atla
  if (getTestMode()) {
    console.log('Test modu aktif: Bağlantı testleri atlanıyor');
    return {
      apiConnected: true,
      wsConnected: true
    };
  }

  try {
    // Önce API bağlantısını test et
    const apiTest = await testApiConnection();
    
    // API bağlantısı başarısızsa WebSocket testini atla
    if (!apiTest) {
      toast.error('API bağlantısı kurulamadı');
      return {
        apiConnected: false,
        wsConnected: false
      };
    }

    // WebSocket bağlantısını test et
    const wsTest = await testWebSocketConnection();
    
    if (!wsTest) {
      toast.error('WebSocket bağlantısı kurulamadı');
    }

    return {
      apiConnected: apiTest,
      wsConnected: wsTest
    };
  } catch (error) {
    console.error('Bağlantı testleri sırasında hata:', error);
    toast.error('Bağlantı testleri başarısız oldu');
    return {
      apiConnected: false,
      wsConnected: false
    };
  }
} 