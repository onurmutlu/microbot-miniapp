import api from './api';
import { toast } from 'react-toastify';
import { getTestMode } from './testMode';

export const testApiConnection = async () => {
  // Test modunda çalışıyorsa bağlantı testini atla
  if (getTestMode()) {
    console.log('Test modu aktif: API bağlantı testi atlanıyor');
    return true;
  }

  try {
    const response = await api.get('/health');
    if (response.status === 200) {
      toast.success('API bağlantısı başarılı');
      return true;
    }
  } catch (error) {
    console.error('API bağlantı hatası:', error);
    toast.error('API bağlantısı başarısız');
    return false;
  }
};

export const testWebSocketConnection = () => {
  // Test modunda çalışıyorsa WebSocket testini atla
  if (getTestMode()) {
    console.log('Test modu aktif: WebSocket bağlantı testi atlanıyor');
    return true;
  }

  return new Promise<boolean>((resolve) => {
    const ws = new WebSocket('ws://localhost:8000/ws');
    
    ws.onopen = () => {
      toast.success('WebSocket bağlantısı başarılı');
      ws.close();
      resolve(true);
    };
    
    ws.onerror = () => {
      console.error('WebSocket bağlantı hatası');
      toast.error('WebSocket bağlantısı başarısız');
      resolve(false);
    };
    
    // Zaman aşımı
    setTimeout(() => {
      if (ws.readyState !== WebSocket.OPEN) {
        console.error('WebSocket bağlantı zaman aşımı');
        ws.close();
        resolve(false);
      }
    }, 5000);
  });
};

export const runConnectionTests = async () => {
  // Test modunda çalışıyorsa testleri atla
  if (getTestMode()) {
    console.log('Test modu aktif: Bağlantı testleri atlanıyor');
    return;
  }

  await testApiConnection();
  await testWebSocketConnection();
}; 