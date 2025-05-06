import React, { useState, useEffect, useRef } from 'react';
import useSSEIntegration from '../hooks/useSSEIntegration';

interface Message {
  id: string;
  text: string;
  sender: string;
  timestamp: string;
  isSystem?: boolean;
  attachments?: any[];
}

interface SSELiveGroupProps {
  groupId: string;
  groupName: string;
  showHeader?: boolean;
  maxMessages?: number;
  height?: string;
  showSendForm?: boolean;
  onSendMessage?: (text: string) => void;
}

/**
 * Telegram grubu için gerçek zamanlı SSE mesajlarını gösteren bileşen
 */
const SSELiveGroup: React.FC<SSELiveGroupProps> = ({
  groupId,
  groupName,
  showHeader = true,
  maxMessages = 50,
  height = '400px',
  showSendForm = true,
  onSendMessage
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // SSE entegrasyonu
  const {
    isConnected,
    isLoading,
    error,
    lastMessage,
    publishToTopic,
    sendTelegramNotification
  } = useSSEIntegration({
    enableNotifications: true,
    enableTelegramIntegration: true,
    autoConnect: true,
    channels: [groupId, `telegram_notification_${groupId}`]
  });

  // Yeni mesajlar geldiğinde işle
  useEffect(() => {
    if (lastMessage && (lastMessage.type === 'topic' || lastMessage.type === 'telegram')) {
      const data = lastMessage.data;
      
      if (data.text || data.message) {
        // Yeni mesaj oluştur
        const newMsg: Message = {
          id: data.id || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          text: data.text || data.message || '',
          sender: data.sender || data.author || 'Anonim',
          timestamp: data.timestamp || new Date().toISOString(),
          isSystem: data.isSystem || false,
          attachments: data.attachments || []
        };
        
        // Mesajları güncelle (yeni mesajı en alta ekle)
        setMessages(prevMessages => {
          // Aynı ID'li mesaj varsa güncelleme, yoksa ekleme yap
          const exists = prevMessages.some(m => m.id === newMsg.id);
          if (exists) {
            return prevMessages.map(m => m.id === newMsg.id ? newMsg : m);
          } else {
            // Maksimum mesaj sayısını kontrol et
            const updatedMessages = [...prevMessages, newMsg];
            return updatedMessages.slice(-maxMessages);
          }
        });
        
        // Yazıyor göstergesini kapat
        setIsTyping(false);
      } else if (data.typing) {
        // Yazıyor göstergesini göster
        setIsTyping(true);
        
        // 3 saniye sonra göstergeyi kapat
        setTimeout(() => {
          setIsTyping(false);
        }, 3000);
      }
    }
  }, [lastMessage, maxMessages]);

  // Mesajların sonuna kaydır
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Mesaj gönderme
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    
    if (!newMessage.trim()) return;
    
    try {
      // Grup mesajı olarak yayınla
      await publishToTopic(groupId, {
        text: newMessage,
        sender: 'Kullanıcı', // Gerçek kullanıcı adı buraya eklenebilir
        timestamp: new Date().toISOString()
      });
      
      // Telegram bildirimi olarak da gönder
      await sendTelegramNotification(groupId, {
        text: newMessage,
        sender: 'Kullanıcı', // Gerçek kullanıcı adı buraya eklenebilir
        timestamp: new Date().toISOString()
      });
      
      // Custom handler
      if (onSendMessage) {
        onSendMessage(newMessage);
      }
      
      // Girdi alanını temizle
      setNewMessage('');
    } catch (err) {
      console.error('Mesaj gönderme hatası:', err);
    }
  };

  // Mesaj süresi formatla
  const formatMessageTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (err) {
      return '';
    }
  };

  return (
    <div className="border rounded-lg shadow-sm bg-white overflow-hidden flex flex-col">
      {/* Grup Başlığı */}
      {showHeader && (
        <div className="p-3 border-b bg-gray-50 flex justify-between items-center">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-white font-bold mr-2">
              {groupName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="font-medium">{groupName}</div>
              <div className="text-xs text-gray-500 flex items-center">
                {isConnected ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-green-500 mr-1"></span>
                    Canlı
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-red-500 mr-1"></span>
                    Bağlantı yok
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Mesaj Listesi */}
      <div className="flex-1 overflow-y-auto p-3" style={{ height }}>
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin w-6 h-6 border-2 border-gray-300 border-t-indigo-500 rounded-full"></div>
          </div>
        ) : error ? (
          <div className="text-center text-red-500 p-4">{error}</div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-500 p-4">
            Henüz mesaj yok. İlk mesajı gönder!
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((message) => (
              <div 
                key={message.id} 
                className={`flex ${message.isSystem ? 'justify-center' : 'justify-start'}`}
              >
                {message.isSystem ? (
                  <div className="bg-gray-100 text-gray-600 py-1 px-3 rounded-full text-xs">
                    {message.text}
                  </div>
                ) : (
                  <div className="max-w-[80%]">
                    <div className="bg-gray-100 p-3 rounded-lg">
                      <div className="flex items-center mb-1">
                        <span className="font-medium text-sm">{message.sender}</span>
                        <span className="text-xs text-gray-500 ml-2">
                          {formatMessageTime(message.timestamp)}
                        </span>
                      </div>
                      <div className="text-sm whitespace-pre-wrap">{message.text}</div>
                      
                      {/* Ekler varsa göster */}
                      {message.attachments && message.attachments.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {message.attachments.map((attachment, index) => (
                            <div key={index} className="border rounded p-1 text-xs text-blue-500">
                              Ek: {attachment.name || 'Dosya'}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            {/* Yazıyor göstergesi */}
            {isTyping && (
              <div className="flex items-center text-gray-500 text-xs">
                <div className="animate-pulse">
                  <span className="inline-block w-1 h-1 bg-gray-500 rounded-full mx-0.5"></span>
                  <span className="inline-block w-1 h-1 bg-gray-500 rounded-full mx-0.5 animation-delay-100"></span>
                  <span className="inline-block w-1 h-1 bg-gray-500 rounded-full mx-0.5 animation-delay-200"></span>
                </div>
                <span className="ml-2">Birisi yazıyor...</span>
              </div>
            )}
            
            {/* Otomatik kaydırma için referans div */}
            <div ref={messagesEndRef}></div>
          </div>
        )}
      </div>
      
      {/* Mesaj Formu */}
      {showSendForm && (
        <div className="border-t p-3">
          <form onSubmit={handleSendMessage} className="flex">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Mesajınızı yazın..."
              className="flex-1 px-3 py-2 border rounded-l focus:outline-none focus:ring-2 focus:ring-indigo-300"
              disabled={!isConnected}
            />
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-500 text-white rounded-r hover:bg-indigo-600 transition disabled:bg-gray-300"
              disabled={!isConnected || !newMessage.trim()}
            >
              Gönder
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default SSELiveGroup; 