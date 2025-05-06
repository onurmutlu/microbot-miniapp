import api from '../utils/api';
import { getTestMode } from '../utils/testMode';
import { toast } from '../utils/toast';
import webSocketClient from './WebSocketClient';
import sseClient from './SSEClient';

/**
 * API ve realtime bağlantılarını test eder
 * @returns Test sonuçları
 */
export const runConnectionTests = async (): Promise<{
  apiConnection: boolean;
  webSocketConnection: boolean;
  sseConnection: boolean;
}> => {
  const results = {
    apiConnection: false,
    webSocketConnection: false,
    sseConnection: false,
  };

  // Test modunda ise tüm bağlantıları başarılı say
  if (getTestMode()) {
    console.log('Test modu aktif: Tüm bağlantılar simüle ediliyor');
    return {
      apiConnection: true,
      webSocketConnection: true,
      sseConnection: true,
    };
  }

  try {
    // API health endpoint'ini kontrol et
    const apiResponse = await api.get('/health');
    results.apiConnection = apiResponse.status === 200;
    console.log('API bağlantısı:', results.apiConnection ? 'Başarılı' : 'Başarısız');
  } catch (error) {
    console.error('API bağlantı hatası:', error);
    results.apiConnection = false;
  }

  // WebSocket bağlantısını kontrol et
  try {
    // Geçici bir bağlantı kur ve kontrol et
    const ws = new WebSocket(`${webSocketClient['config'].url}/test`);
    
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        ws.close();
        results.webSocketConnection = false;
        reject(new Error('WebSocket bağlantı zaman aşımı'));
      }, 3000);

      ws.onopen = () => {
        clearTimeout(timeout);
        ws.close();
        results.webSocketConnection = true;
        resolve();
      };

      ws.onerror = () => {
        clearTimeout(timeout);
        results.webSocketConnection = false;
        reject(new Error('WebSocket bağlantı hatası'));
      };
    });

    console.log('WebSocket bağlantısı:', results.webSocketConnection ? 'Başarılı' : 'Başarısız');
  } catch (error) {
    console.error('WebSocket bağlantı hatası:', error);
    results.webSocketConnection = false;
  }

  // SSE bağlantısını kontrol et
  try {
    // SSE test endpoint'ini kontrol et
    const source = new EventSource(`${sseClient['config'].baseUrl}/test`);
    
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        source.close();
        results.sseConnection = false;
        reject(new Error('SSE bağlantı zaman aşımı'));
      }, 3000);

      source.onopen = () => {
        clearTimeout(timeout);
        source.close();
        results.sseConnection = true;
        resolve();
      };

      source.onerror = () => {
        clearTimeout(timeout);
        results.sseConnection = false;
        reject(new Error('SSE bağlantı hatası'));
      };
    });

    console.log('SSE bağlantısı:', results.sseConnection ? 'Başarılı' : 'Başarısız');
  } catch (error) {
    console.error('SSE bağlantı hatası:', error);
    results.sseConnection = false;
  }

  // Bağlantı durumlarını göster
  if (!results.apiConnection) {
    console.warn('API bağlantısı kurulamadı. Test moduna geçmeyi deneyin.');
    toast.warning('API sunucusuna bağlanılamadı. Test modunu etkinleştirin.');
  }

  if (!results.webSocketConnection) {
    console.warn('WebSocket bağlantısı kurulamadı.');
  }

  if (!results.sseConnection) {
    console.warn('SSE bağlantısı kurulamadı.');
  }

  return results;
};

export default runConnectionTests; 