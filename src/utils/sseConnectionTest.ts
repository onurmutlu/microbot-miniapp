import api from './api';
import { toast } from './toast';
import { getTestMode } from './testMode';

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
    // API URL'ini belirle
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    const testUrl = `${apiUrl}/api/sse/test`;
    
    console.log(`SSE test bağlantısı kuruluyor: ${testUrl}`);
    
    // EventSource oluştur
    const eventSource = new EventSource(testUrl);

    // Bağlantı başarısını Promis ile izle
    const result = await new Promise<boolean>((resolve) => {
      // Başarılı bağlantı
      eventSource.onopen = () => {
        console.log('SSE bağlantı testi başarılı');
        eventSource.close();
        resolve(true);
      };

      // Bağlantı hatası
      eventSource.onerror = (error) => {
        console.error('SSE bağlantı testi başarısız:', error);
        eventSource.close();
        resolve(false);
      };

      // Zaman aşımı (3 saniye)
      setTimeout(() => {
        console.warn('SSE bağlantı testi zaman aşımı');
        eventSource.close();
        resolve(false);
      }, 3000);
    });

    if (!result) {
      toast.error('SSE servisine bağlanılamadı');
    }

    return result;
  } catch (error) {
    console.error('SSE bağlantı testi hatası:', error);
    toast.error('SSE bağlantı testi hatası');
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