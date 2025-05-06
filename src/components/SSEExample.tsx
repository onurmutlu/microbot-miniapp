import React, { useState, useEffect, useRef } from 'react';
import { useSSE } from '../hooks/useSSE';
import useWebSocket from '../hooks/useWebSocket';
import { SSEMessage, SSEMessageType } from '../utils/sseService';
import { WebSocketMessage, WebSocketMessageType } from '../utils/websocket';
import { toast } from '../utils/toast';

interface MessageItem {
  id: string;
  text: string;
  source: 'sse' | 'ws' | 'user';
  timestamp: Date;
  topic?: string;
}

/**
 * SSEClient rehberi için örnek bileşen
 */
const SSEExample: React.FC = () => {
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [message, setMessage] = useState('');
  const [topic, setTopic] = useState('notifications');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // SSE hook'u
  const sse = useSSE({
    autoConnect: true,
    topics: [topic],
    onMessage: (message: SSEMessage) => {
      handleIncomingMessage(message, 'sse');
    },
    onConnect: (clientId) => {
      toast.success(`SSE bağlantısı kuruldu (ID: ${clientId})`);
    },
    onDisconnect: () => {
      toast.error('SSE bağlantısı kesildi');
    },
    onError: (error) => {
      toast.error(`SSE hatası: ${error.message}`);
    }
  });
  
  // WebSocket hook'u
  const ws = useWebSocket({
    autoConnect: true,
    topics: [topic],
    onMessage: (message: WebSocketMessage) => {
      handleIncomingMessage(message, 'ws');
    },
    onConnect: () => {
      toast.success('WebSocket bağlantısı kuruldu');
    },
    onDisconnect: () => {
      toast.error('WebSocket bağlantısı kesildi');
    },
    onError: (error) => {
      toast.error(`WebSocket hatası: ${error.message}`);
    }
  });
  
  // Gelen mesajları işle
  const handleIncomingMessage = (message: SSEMessage | WebSocketMessage, source: 'sse' | 'ws') => {
    const newMessage: MessageItem = {
      id: Math.random().toString(36).substring(2, 9),
      text: typeof message.data === 'object' 
        ? JSON.stringify(message.data) 
        : String(message.data || message.message || ''),
      source,
      timestamp: new Date(),
      topic: message.topic
    };
    
    setMessages(prev => [newMessage, ...prev].slice(0, 50));
  };
  
  // Mesaj gönder
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) return;
    
    const messageData = { content: message, sentAt: new Date().toISOString() };
    
    // Mesaj listesine ekle
    const userMessage: MessageItem = {
      id: Math.random().toString(36).substring(2, 9),
      text: message,
      source: 'user',
      timestamp: new Date(),
      topic
    };
    
    setMessages(prev => [userMessage, ...prev].slice(0, 50));
    
    try {
      // SSE ile gönder
      await sse.publishToTopic(topic, messageData);
      
      // WebSocket ile gönder
      ws.sendToTopic(topic, messageData);
      
      // Mesaj kutusunu temizle
      setMessage('');
    } catch (error) {
      toast.error('Mesaj gönderilemedi');
      console.error('Mesaj gönderme hatası:', error);
    }
  };
  
  // Broadcast mesajı gönder
  const sendBroadcast = async () => {
    if (!message.trim()) return;
    
    const broadcastData = { 
      content: message, 
      type: 'broadcast', 
      sentAt: new Date().toISOString() 
    };
    
    try {
      // SSE ile broadcast
      await sse.broadcast(broadcastData);
      
      // WebSocket ile broadcast
      ws.broadcast(broadcastData);
      
      // Mesaj kutusunu temizle
      setMessage('');
      
      toast.success('Broadcast mesajı gönderildi');
    } catch (error) {
      toast.error('Broadcast gönderilemedi');
      console.error('Broadcast hatası:', error);
    }
  };
  
  // Konu değişikliğini işle
  const handleTopicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTopic = e.target.value;
    setTopic(newTopic);
  };
  
  // Bağlantı durumunu işle
  const handleConnection = (service: 'sse' | 'ws', action: 'connect' | 'disconnect' | 'reconnect') => {
    if (service === 'sse') {
      if (action === 'connect') sse.connect();
      else if (action === 'disconnect') sse.disconnect();
      else if (action === 'reconnect') sse.reconnect();
    } else {
      if (action === 'connect') ws.connect();
      else if (action === 'disconnect') ws.disconnect();
      else if (action === 'reconnect') ws.reconnect();
    }
  };
  
  // Otomatik kaydırma
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Konu değiştiğinde yeniden abone ol
  useEffect(() => {
    // Önceki abonelikleri temizle
    sse.unsubscribe();
    ws.unsubscribe();
    
    // Yeni konuya abone ol
    sse.subscribe(topic, (data) => {
      handleIncomingMessage({
        type: SSEMessageType.MESSAGE,
        data,
        topic
      }, 'sse');
    });
    
    ws.subscribe(topic, (data) => {
      handleIncomingMessage({
        type: WebSocketMessageType.MESSAGE,
        data,
        topic
      }, 'ws');
    });
  }, [topic]);
  
  // Mesaj zamanını biçimlendir
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };
  
  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
        Gerçek Zamanlı İletişim Örneği
      </h2>
      
      {/* Bağlantı durumu */}
      <div className="mb-4 flex flex-wrap gap-4">
        <div className="flex items-center">
          <div className={`w-3 h-3 rounded-full mr-2 ${sse.isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-sm text-gray-700 dark:text-gray-300">
            SSE: {sse.isConnected ? 'Bağlı' : sse.isConnecting ? 'Bağlanıyor...' : 'Bağlantı Kesik'}
          </span>
          <div className="ml-2 flex space-x-1">
            <button 
              onClick={() => handleConnection('sse', 'connect')}
              className="text-xs py-1 px-2 bg-blue-500 text-white rounded"
              disabled={sse.isConnected}
            >
              Bağlan
            </button>
            <button 
              onClick={() => handleConnection('sse', 'disconnect')}
              className="text-xs py-1 px-2 bg-red-500 text-white rounded"
              disabled={!sse.isConnected}
            >
              Kes
            </button>
            <button 
              onClick={() => handleConnection('sse', 'reconnect')}
              className="text-xs py-1 px-2 bg-yellow-500 text-white rounded"
            >
              Yenile
            </button>
          </div>
        </div>
        
        <div className="flex items-center">
          <div className={`w-3 h-3 rounded-full mr-2 ${ws.isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-sm text-gray-700 dark:text-gray-300">
            WebSocket: {ws.isConnected ? 'Bağlı' : ws.isConnecting ? 'Bağlanıyor...' : 'Bağlantı Kesik'}
          </span>
          <div className="ml-2 flex space-x-1">
            <button 
              onClick={() => handleConnection('ws', 'connect')}
              className="text-xs py-1 px-2 bg-blue-500 text-white rounded"
              disabled={ws.isConnected}
            >
              Bağlan
            </button>
            <button 
              onClick={() => handleConnection('ws', 'disconnect')}
              className="text-xs py-1 px-2 bg-red-500 text-white rounded"
              disabled={!ws.isConnected}
            >
              Kes
            </button>
            <button 
              onClick={() => handleConnection('ws', 'reconnect')}
              className="text-xs py-1 px-2 bg-yellow-500 text-white rounded"
            >
              Yenile
            </button>
          </div>
        </div>
      </div>
      
      {/* Konu aboneliği */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Konu
        </label>
        <input 
          type="text" 
          value={topic}
          onChange={handleTopicChange}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          placeholder="Konu adı"
        />
        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Aktif konular: {sse.activeTopics.join(', ')}
        </div>
      </div>
      
      {/* Mesaj formu */}
      <form onSubmit={sendMessage} className="mb-4">
        <div className="flex space-x-2">
          <input 
            type="text" 
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            placeholder="Mesajınızı yazın..."
          />
          <button 
            type="submit"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Gönder
          </button>
          <button 
            type="button"
            onClick={sendBroadcast}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
          >
            Broadcast
          </button>
        </div>
      </form>
      
      {/* Mesaj listesi */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-md h-64 overflow-y-auto mb-2">
        <div className="flex flex-col-reverse p-3 min-h-full">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 dark:text-gray-400 py-4">
              Henüz mesaj yok
            </div>
          ) : (
            messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`mb-2 p-2 rounded-lg ${
                  msg.source === 'user' 
                    ? 'bg-blue-100 dark:bg-blue-900 ml-12' 
                    : msg.source === 'sse' 
                      ? 'bg-green-100 dark:bg-green-900 mr-12' 
                      : 'bg-purple-100 dark:bg-purple-900 mr-12'
                }`}
              >
                <div className="text-sm text-gray-800 dark:text-gray-200">{msg.text}</div>
                <div className="flex justify-between mt-1 text-xs text-gray-500 dark:text-gray-400">
                  <span>
                    {msg.source === 'user' ? 'Siz' : msg.source === 'sse' ? 'SSE' : 'WebSocket'}
                    {msg.topic && ` (${msg.topic})`}
                  </span>
                  <span>{formatTime(msg.timestamp)}</span>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      {/* Bilgi */}
      <div className="text-xs text-gray-500 dark:text-gray-400">
        <p>SSE ClientID: {sse.clientId}</p>
        <p>Son mesaj: {sse.lastMessage ? formatTime(new Date(sse.lastMessage.timestamp || '')) : 'Yok'}</p>
      </div>
    </div>
  );
};

export default SSEExample; 