import React, { useEffect, useState } from 'react';
import sseService, { SSEConnectionState, SSEMessage } from '../services/sseService';
import { toast } from 'react-toastify';

interface SSEListenerProps {
  topic?: string;
  showControls?: boolean;
}

const SSEListener: React.FC<SSEListenerProps> = ({ 
  topic = 'notifications', 
  showControls = true 
}) => {
  const [connectionStatus, setConnectionStatus] = useState<SSEConnectionState>(
    sseService.getStatus()
  );
  const [messages, setMessages] = useState<SSEMessage[]>([]);
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [customTopic, setCustomTopic] = useState<string>(topic);
  const [customMessage, setCustomMessage] = useState<string>('');

  useEffect(() => {
    // Bağlantı durumu değişikliklerini izle
    const unsubscribeStatus = sseService.onStatusChange(setConnectionStatus);
    
    // Temizleme fonksiyonu
    return () => {
      unsubscribeStatus();
    };
  }, []);

  useEffect(() => {
    // Varsayılan konuya otomatik abone ol
    let topicHandler: ((message: SSEMessage) => void) | null = null;
    let topicUnsubscribe: (() => void) | null = null;
    
    const subscribeToDefaultTopic = async () => {
      if (topic) {
        const success = await handleSubscribe();
        
        if (success) {
          // Konu özel mesaj dinleyicisi
          topicHandler = (message: SSEMessage) => {
            console.log(`${topic} konusundan mesaj alındı:`, message);
            // Toast göstermek yerine direkt mesajlar listesine ekle
            setMessages(prev => [message, ...prev].slice(0, 50)); // Son 50 mesajı tut
          };
          
          // Bu kapsamda tanımlı bir değişkene referansı kaydet
          topicUnsubscribe = sseService.onTopic(topic, topicHandler);
        }
      }
    };
    
    // Varsayılan konuya abone ol
    subscribeToDefaultTopic();
    
    // Global mesaj dinleyicisi
    const messageHandler = (message: SSEMessage) => {
      // Eğer özel bir konuya abonelik yoksa veya mesaj konusu abone olduğumuz konu değilse
      if (!topic || !message.topic || message.topic !== topic) {
        console.log('Genel SSE mesajı alındı:', message);
        setMessages(prev => [message, ...prev].slice(0, 50)); // Son 50 mesajı tut
      }
    };
    
    const unsubscribeMessages = sseService.on('message', messageHandler);
    
    // Temizleme fonksiyonu
    return () => {
      if (isSubscribed && topic) {
        sseService.unsubscribeTopic(topic)
          .catch(error => console.error('Abonelik sonlandırma hatası:', error));
      }
      
      if (topicUnsubscribe) {
        topicUnsubscribe();
      }
      
      unsubscribeMessages();
    };
  }, [topic]);

  const handleSubscribe = async () => {
    if (!customTopic) {
      toast.error('Lütfen bir konu adı girin');
      return false;
    }
    
    try {
      const success = await sseService.subscribeTopic(customTopic);
      if (success) {
        setIsSubscribed(true);
        toast.success(`${customTopic} konusuna abone olundu`);
        return true;
      } else {
        toast.error(`${customTopic} konusuna abone olunamadı`);
        return false;
      }
    } catch (error) {
      console.error('Abonelik hatası:', error);
      toast.error('Abonelik sırasında bir hata oluştu');
      return false;
    }
  };

  const handleUnsubscribe = async () => {
    if (!customTopic || !isSubscribed) return;
    
    try {
      const success = await sseService.unsubscribeTopic(customTopic);
      if (success) {
        setIsSubscribed(false);
        toast.success(`${customTopic} konusundan abonelik kaldırıldı`);
      } else {
        toast.error(`${customTopic} konusundan abonelik kaldırılamadı`);
      }
    } catch (error) {
      console.error('Abonelik kaldırma hatası:', error);
      toast.error('Abonelik kaldırılırken bir hata oluştu');
    }
  };

  const handleSendMessage = async () => {
    if (!customTopic || !customMessage) {
      toast.error('Lütfen bir konu ve mesaj içeriği girin');
      return;
    }
    
    try {
      await sseService.publishToTopic(customTopic, customMessage);
      toast.success(`Mesaj ${customTopic} konusuna gönderildi`);
      setCustomMessage('');
    } catch (error) {
      console.error('Mesaj gönderme hatası:', error);
      toast.error('Mesaj gönderilirken bir hata oluştu');
    }
  };

  const handleSendBroadcast = async () => {
    if (!customMessage) {
      toast.error('Lütfen bir mesaj içeriği girin');
      return;
    }
    
    try {
      await sseService.broadcast(customMessage);
      toast.success('Yayın mesajı gönderildi');
      setCustomMessage('');
    } catch (error) {
      console.error('Yayın hatası:', error);
      toast.error('Yayın gönderilirken bir hata oluştu');
    }
  };

  const handleReconnect = () => {
    sseService.connect();
  };

  const statusColors = {
    connecting: 'bg-yellow-500',
    connected: 'bg-green-500',
    disconnected: 'bg-red-500',
    error: 'bg-red-700'
  };

  return (
    <div className="p-4 border rounded-lg shadow-md bg-white">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">SSE İzleyici</h2>
        <div className="flex items-center">
          <div className={`w-3 h-3 rounded-full mr-2 ${statusColors[connectionStatus]}`}></div>
          <span className="text-sm font-medium">
            {connectionStatus === 'connected' ? 'Bağlı' : 
             connectionStatus === 'connecting' ? 'Bağlanıyor...' : 
             connectionStatus === 'disconnected' ? 'Bağlantı Kesildi' : 
             'Bağlantı Hatası'}
          </span>
        </div>
      </div>

      {showControls && (
        <>
          <div className="mb-4">
            <div className="flex mb-2">
              <input
                type="text"
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
                placeholder="Konu adı"
                className="flex-1 p-2 border rounded-l focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isSubscribed}
              />
              {isSubscribed ? (
                <button
                  onClick={handleUnsubscribe}
                  className="bg-red-500 text-white px-4 py-2 rounded-r hover:bg-red-600"
                >
                  Abonelikten Çık
                </button>
              ) : (
                <button
                  onClick={handleSubscribe}
                  className="bg-blue-500 text-white px-4 py-2 rounded-r hover:bg-blue-600"
                >
                  Abone Ol
                </button>
              )}
            </div>
            
            <div className="flex mb-2">
              <input
                type="text"
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Mesaj içeriği"
                className="flex-1 p-2 border rounded-l focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleSendMessage}
                className="bg-green-500 text-white px-4 py-2 hover:bg-green-600"
                disabled={!isSubscribed}
              >
                Konuya Gönder
              </button>
              <button
                onClick={handleSendBroadcast}
                className="bg-purple-500 text-white px-4 py-2 rounded-r hover:bg-purple-600"
              >
                Yayınla
              </button>
            </div>
          </div>
          
          <div className="mb-4">
            <button
              onClick={handleReconnect}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              disabled={connectionStatus === 'connected' || connectionStatus === 'connecting'}
            >
              Yeniden Bağlan
            </button>
          </div>
        </>
      )}
      
      <div>
        <h3 className="text-lg font-medium mb-2">Mesajlar</h3>
        <div className="border rounded h-64 overflow-y-auto p-2 bg-gray-50">
          {messages.length === 0 ? (
            <p className="text-gray-500 text-center p-4">Henüz mesaj yok</p>
          ) : (
            <ul className="space-y-2">
              {messages.map((msg, index) => (
                <li key={index} className="p-2 border-b text-sm">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span className="font-semibold">{msg.type}</span>
                    <span>{new Date(msg.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <div className="bg-white p-2 rounded">
                    {msg.topic && <span className="text-xs bg-blue-100 text-blue-800 rounded px-1 py-0.5 mr-1">{msg.topic}</span>}
                    <code className="text-xs whitespace-pre-wrap overflow-x-auto block max-h-24">
                      {typeof msg.data === 'object' ? JSON.stringify(msg.data, null, 2) : String(msg.data)}
                    </code>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default SSEListener; 