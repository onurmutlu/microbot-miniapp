import api from './api';
import { toast } from './toast';
import { getTestMode } from './testMode';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const SSE_BASE_URL = `${API_BASE_URL}/sse`;
const CONNECTION_TIMEOUT = 5000; // 5 saniye

/**
 * SSE bağlantısını test et
 * @returns Test sonucu
 */
export const testSSEConnection = async (): Promise<boolean> => {
  if (getTestMode()) {
    console.log('Test modu: SSE bağlantı testi simülasyonu');
    return true;
  }

  try {
    const response = await axios.get(`${API_BASE_URL}/api/health`, { timeout: 2000 });
    if (response.status === 200) {
      toast.success('API sunucusu çalışıyor (SSE)');
      return true;
    } else {
      toast.error(`API sunucusu hata döndürdü: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.error('SSE API bağlantı hatası:', error);
    toast.error('API sunucusuna bağlanılamadı (SSE)');
    return false;
  }
};

export async function runSSEConnectionTest(): Promise<boolean> {
  // Test modunda çalışıyorsa testi atla
  if (getTestMode()) {
    console.log('Test modu aktif: SSE bağlantı testi atlanıyor');
    return true;
  }

  try {
    // Önce API bağlantısını health endpoint ile test et
    try {
      await api.get('/health');
    } catch (error) {
      console.error('API sağlık kontrolü başarısız:', error);
      toast.error('API sunucusuna bağlantı kurulamadı');
      return false;
    }
    
    // SSE bağlantısını test et
    const sseTest = await testSSEConnection();
    
    if (!sseTest) {
      toast.error('SSE bağlantısı kurulamadı');
      return false;
    }

    return true;
  } catch (error) {
    console.error('SSE bağlantı testi sırasında hata:', error);
    toast.error('SSE bağlantı testi başarısız oldu');
    return false;
  }
}

// Bağlantı durumunu izleyen bir fonksiyon
export const monitorSSEConnection = (
  onStatusChange: (isConnected: boolean) => void,
  checkInterval = 30000 // 30 saniye
): () => void => {
  if (getTestMode()) {
    onStatusChange(true);
    return () => {};
  }
  
  let intervalId: NodeJS.Timeout;
  
  const checkConnection = async () => {
    const isConnected = await testSSEConnection();
    onStatusChange(isConnected);
  };
  
  // İlk kontrol
  checkConnection();
  
  // Periyodik kontroller
  intervalId = setInterval(checkConnection, checkInterval);
  
  // Temizleme fonksiyonu
  return () => {
    if (intervalId) {
      clearInterval(intervalId);
    }
  };
};

export default {
  testSSEConnection,
  runSSEConnectionTest,
  monitorSSEConnection
}; 