import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-toastify';
import { getTestMode } from '../utils/testMode';
import { getWebSocketUrl } from '../utils/env';

export type WebSocketStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

/**
 * WebSocket bağlantısı kuran ve yöneten custom hook
 * @param url WebSocket bağlantı URL'i veya yolu
 * @param autoReconnect Bağlantı koptuğunda otomatik yeniden bağlanma
 * @param reconnectInterval Yeniden bağlanma denemesi arasındaki süre (ms)
 * @param maxReconnectAttempts Maksimum yeniden bağlanma denemesi sayısı
 * @returns WebSocket durumu ve işlevleri
 */
export const useWebSocketConnection = (
  url: string,
  autoReconnect: boolean = true,
  reconnectInterval: number = 5000,
  maxReconnectAttempts: number = 5
) => {
  const [status, setStatus] = useState<WebSocketStatus>('disconnected');
  const [messages, setMessages] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef<number>(0);
  const reconnectTimerRef = useRef<number | null>(null);

  // Tam WebSocket URL'ini hesapla
  const getFullWebSocketUrl = useCallback(() => {
    // Eğer URL bir protokol ile başlıyorsa (ws:// veya wss://) tam URL olarak kullan
    if (url.startsWith('ws://') || url.startsWith('wss://')) {
      return url;
    }
    
    // Diğer durumda, baz URL'e ekle
    const baseWsUrl = getWebSocketUrl();
    // URL'in başında / olup olmadığını kontrol et ve uygun şekilde birleştir
    const path = url.startsWith('/') ? url : `/${url}`;
    return `${baseWsUrl}${path}`;
  }, [url]);

  // Bağlantı kurma işlevi
  const connect = useCallback(() => {
    try {
      // Tam WebSocket URL'i 
      const fullWebSocketUrl = getFullWebSocketUrl();
      
      // Test modunda mock WebSocket davranışı
      if (getTestMode()) {
        console.info('[Test Modu] WebSocket bağlantısı simüle ediliyor:', fullWebSocketUrl);
        setStatus('connecting');
        
        // 500ms sonra bağlanmış gibi davran
        setTimeout(() => {
          setStatus('connected');
          setError(null);
          console.info('[Test Modu] WebSocket bağlantısı kuruldu');
          
          // Test mesajları gönder (opsiyonel)
          if (Math.random() > 0.3) { // %70 şans ile test mesajları gönder
            const interval = setInterval(() => {
              if (status === 'connected') {
                const testMessage = {
                  id: Math.floor(Math.random() * 1000),
                  type: 'test',
                  data: { timestamp: new Date().toISOString() },
                  event: 'update'
                };
                setMessages(prev => [...prev, testMessage]);
              } else {
                clearInterval(interval);
              }
            }, 10000); // Her 10 saniyede bir test mesajı
            
            return () => clearInterval(interval);
          }
        }, 500);
        
        return;
      }
      
      // Gerçek WebSocket bağlantısı
      setStatus('connecting');
      
      // Daha önce açık bağlantıyı kapat
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.close();
      }

      console.log('[WebSocket] Bağlanılıyor:', fullWebSocketUrl);
      socketRef.current = new WebSocket(fullWebSocketUrl);

      socketRef.current.onopen = () => {
        setStatus('connected');
        setError(null);
        reconnectAttemptsRef.current = 0; // Yeniden bağlanma sayacını sıfırla
        console.log('[WebSocket] Bağlantı kuruldu');
        toast.success('Sunucu bağlantısı kuruldu');
      };

      socketRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setMessages(prev => [...prev, data]);
        } catch (err) {
          console.error('[WebSocket] Mesaj işleme hatası:', err);
        }
      };

      socketRef.current.onerror = (e) => {
        console.error('[WebSocket] Bağlantı hatası:', e);
        setStatus('error');
        setError('WebSocket bağlantı hatası');
        toast.error('Sunucu bağlantısında hata oluştu');
      };

      socketRef.current.onclose = (e) => {
        setStatus('disconnected');
        console.log(`[WebSocket] Bağlantı kapatıldı, kod: ${e.code}, sebep: ${e.reason}`);
        
        // Bağlantı beklenmedik şekilde kapandıysa ve otomatik yeniden bağlanma aktifse
        if (autoReconnect && e.code !== 1000) {
          handleReconnect();
        }
      };
    } catch (err) {
      console.error('[WebSocket] Bağlantı kurulumunda hata:', err);
      setError('WebSocket bağlantısı kurulamadı');
      setStatus('error');
      toast.error('Sunucu bağlantısı kurulamadı');
    }
  }, [getFullWebSocketUrl, autoReconnect, status]);

  // Otomatik yeniden bağlanma işlevi
  const handleReconnect = useCallback(() => {
    if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
      console.log(`Maksimum yeniden bağlanma denemesi (${maxReconnectAttempts}) aşıldı`);
      toast.error('Sunucuya bağlanılamıyor. Lütfen sayfayı yenileyin.');
      return;
    }
    
    // Önceki zamanlayıcıyı temizle
    if (reconnectTimerRef.current !== null) {
      window.clearTimeout(reconnectTimerRef.current);
    }
    
    reconnectAttemptsRef.current += 1;
    console.log(`Yeniden bağlanma denemesi ${reconnectAttemptsRef.current}/${maxReconnectAttempts}`);
    
    const timeoutDuration = reconnectInterval * Math.pow(1.5, reconnectAttemptsRef.current - 1);
    console.log(`${timeoutDuration}ms sonra yeniden bağlanma denenecek`);
    
    toast.info(`Sunucu bağlantısı tekrar deneniyor (${reconnectAttemptsRef.current}/${maxReconnectAttempts})...`);
    
    // Yeni zamanlayıcı oluştur
    reconnectTimerRef.current = window.setTimeout(() => {
      connect();
    }, timeoutDuration);
  }, [connect, maxReconnectAttempts, reconnectInterval]);

  // Bağlantı kapatma işlevi
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      if (socketRef.current.readyState === WebSocket.CONNECTING || 
          socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.close(1000, 'Kullanıcı tarafından kapatıldı');
        socketRef.current = null;
      }
    }
    
    setStatus('disconnected');
    
    // Yeniden bağlanma zamanlayıcısını iptal et
    if (reconnectTimerRef.current !== null) {
      window.clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    
    console.log('WebSocket bağlantısı kapatıldı');
  }, []);

  // Mesaj gönderme işlevi
  const sendMessage = useCallback((data: any) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      try {
        socketRef.current.send(JSON.stringify(data));
        return true;
      } catch (err) {
        console.error('Mesaj gönderilirken hata oluştu:', err);
        setError('Mesaj gönderilemedi');
        return false;
      }
    } else {
      console.error('Mesaj gönderilemedi: Bağlantı kapalı');
      setError('Mesaj gönderilemedi: Bağlantı kapalı');
      return false;
    }
  }, []);

  // Mesajları temizleme işlevi
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  // Bağlantı hatalarından sonra manuel yeniden bağlanma
  const reconnect = useCallback(() => {
    disconnect();
    reconnectAttemptsRef.current = 0; // Sayacı sıfırla
    connect();
  }, [disconnect, connect]);

  // Component monte edildiğinde bağlantı kur
  useEffect(() => {
    connect();

    // Component unmount edildiğinde bağlantıyı kapat
    return () => {
      disconnect();
    };
  }, [connect, disconnect, url]);

  return {
    status,
    isConnected: status === 'connected',
    messages,
    error,
    sendMessage,
    disconnect,
    reconnect,
    clearMessages,
    reconnectAttempts: reconnectAttemptsRef.current,
  };
}; 