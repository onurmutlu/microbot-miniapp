import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-toastify';
import { getTestMode } from '../utils/testMode';
import { getSSEUrl } from '../utils/env';

export type SSEStatus = 'connecting' | 'connected' | 'disconnected' | 'error';
export type SSEEventType = 'message' | 'system' | 'scheduler' | 'cache' | 'user' | string;

/**
 * SSE (Server-Sent Events) bağlantısı kuran ve yöneten custom hook
 * @param url SSE bağlantı URL'i veya yolu
 * @param autoReconnect Bağlantı koptuğunda otomatik yeniden bağlanma
 * @param reconnectInterval Yeniden bağlanma denemesi arasındaki süre (ms)
 * @param maxReconnectAttempts Maksimum yeniden bağlanma denemesi sayısı
 * @param eventTypes Dinlenecek özel olay tipleri
 * @returns SSE durumu ve işlevleri
 */
export const useSSEConnection = (
  url: string,
  autoReconnect: boolean = true,
  reconnectInterval: number = 5000,
  maxReconnectAttempts: number = 5,
  eventTypes: SSEEventType[] = ['system', 'scheduler', 'cache', 'user']
) => {
  const [status, setStatus] = useState<SSEStatus>('disconnected');
  const [events, setEvents] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectAttemptsRef = useRef<number>(0);
  const reconnectTimerRef = useRef<number | null>(null);

  // Tam SSE URL'ini hesapla
  const getFullSSEUrl = useCallback(() => {
    // Eğer URL bir protokol ile başlıyorsa (http:// veya https://) tam URL olarak kullan
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    
    // Diğer durumda, baz URL'e ekle
    const baseSSEUrl = getSSEUrl();
    // URL'in başında / olup olmadığını kontrol et ve uygun şekilde birleştir
    const path = url.startsWith('/') ? url : `/${url}`;
    return `${baseSSEUrl}${path}`;
  }, [url]);

  // Bağlantı kurma işlevi
  const connect = useCallback(() => {
    try {
      // Tam SSE URL'i
      const fullSSEUrl = getFullSSEUrl();
      
      // Test modunda mock SSE davranışı
      if (getTestMode()) {
        console.info('[Test Modu] SSE bağlantısı simüle ediliyor:', fullSSEUrl);
        setStatus('connecting');
        
        // 500ms sonra bağlanmış gibi davran
        setTimeout(() => {
          setStatus('connected');
          setError(null);
          console.info('[Test Modu] SSE bağlantısı kuruldu');
          
          // Test olayları gönder
          const testEventsInterval = setInterval(() => {
            if (status === 'connected') {
              const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
              const testEvent = {
                id: Math.floor(Math.random() * 1000).toString(),
                type: eventType,
                data: { 
                  timestamp: new Date().toISOString(),
                  message: `Test ${eventType} olayı`
                },
              };
              setEvents(prev => [...prev, testEvent]);
            } else {
              clearInterval(testEventsInterval);
            }
          }, 8000); // Her 8 saniyede bir test olayı
          
          return () => clearInterval(testEventsInterval);
        }, 500);
        
        return;
      }
      
      // Gerçek EventSource bağlantısı
      setStatus('connecting');
      
      // Varolan bir bağlantı varsa kapat
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      console.log('[SSE] Bağlanılıyor:', fullSSEUrl);
      // Yeni EventSource bağlantısı oluştur
      eventSourceRef.current = new EventSource(fullSSEUrl);

      // Bağlantı açıldığında
      eventSourceRef.current.onopen = () => {
        setStatus('connected');
        setError(null);
        reconnectAttemptsRef.current = 0; // Yeniden bağlanma sayacını sıfırla
        console.log('[SSE] Bağlantı kuruldu');
        toast.success('Gerçek zamanlı veri bağlantısı kuruldu');
      };

      // Bağlantı hatası oluştuğunda
      eventSourceRef.current.onerror = (e) => {
        console.error('[SSE] Bağlantı hatası:', e);
        setError('SSE bağlantı hatası');
        
        if (eventSourceRef.current?.readyState === EventSource.CLOSED) {
          setStatus('disconnected');
          console.log('[SSE] Bağlantı kapandı');
          
          // Otomatik yeniden bağlanma etkinse
          if (autoReconnect) {
            handleReconnect();
          }
        } else {
          setStatus('error');
          toast.error('Gerçek zamanlı veri bağlantısında hata');
        }
      };

      // Mesaj geldiğinde
      eventSourceRef.current.addEventListener('message', (event) => {
        try {
          const data = JSON.parse(event.data);
          setEvents(prev => [...prev, data]);
        } catch (err) {
          console.error('[SSE] Mesaj işleme hatası:', err);
        }
      });

      // Özel olayları dinle
      eventTypes.forEach(type => {
        eventSourceRef.current?.addEventListener(type, (event) => {
          try {
            const data = JSON.parse(event.data);
            setEvents(prev => [...prev, { ...data, type }]);
          } catch (err) {
            console.error(`[SSE] ${type} olay işleme hatası:`, err);
          }
        });
      });
    } catch (err) {
      console.error('[SSE] Bağlantı kurulumunda hata:', err);
      setError('SSE bağlantısı kurulamadı');
      setStatus('error');
      toast.error('Gerçek zamanlı veri bağlantısı kurulamadı');
    }
  }, [getFullSSEUrl, autoReconnect, eventTypes, status]);
  
  // Otomatik yeniden bağlanma işlevi
  const handleReconnect = useCallback(() => {
    if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
      console.log(`Maksimum yeniden bağlanma denemesi (${maxReconnectAttempts}) aşıldı`);
      toast.error('Gerçek zamanlı veri sunucusuna bağlanılamıyor. Lütfen sayfayı yenileyin.');
      return;
    }
    
    // Önceki zamanlayıcıyı temizle
    if (reconnectTimerRef.current !== null) {
      window.clearTimeout(reconnectTimerRef.current);
    }
    
    reconnectAttemptsRef.current += 1;
    console.log(`SSE yeniden bağlanma denemesi ${reconnectAttemptsRef.current}/${maxReconnectAttempts}`);
    
    const timeoutDuration = reconnectInterval * Math.pow(1.5, reconnectAttemptsRef.current - 1);
    console.log(`${timeoutDuration}ms sonra SSE yeniden bağlanma denenecek`);
    
    toast.info(`Gerçek zamanlı veri bağlantısı tekrar deneniyor (${reconnectAttemptsRef.current}/${maxReconnectAttempts})...`);
    
    // Yeni zamanlayıcı oluştur
    reconnectTimerRef.current = window.setTimeout(() => {
      connect();
    }, timeoutDuration);
  }, [connect, maxReconnectAttempts, reconnectInterval]);

  // Bağlantı kapatma işlevi
  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      setStatus('disconnected');
    }
    
    // Yeniden bağlanma zamanlayıcısını iptal et
    if (reconnectTimerRef.current !== null) {
      window.clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    
    console.log('SSE bağlantısı kapatıldı');
  }, []);

  // Olayları temizleme işlevi
  const clearEvents = useCallback(() => {
    setEvents([]);
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
    events,
    error,
    reconnect,
    disconnect,
    clearEvents,
    reconnectAttempts: reconnectAttemptsRef.current,
  };
}; 