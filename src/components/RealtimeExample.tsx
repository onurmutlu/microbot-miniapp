import React, { useState, useEffect } from 'react';
import { useSSE } from '../hooks/useSSE';
import useWebSocket from '../hooks/useWebSocket';
import { WebSocketMessage, WebSocketMessageType } from '../services/WebSocketClient';
import { toast } from '../utils/toast';
import TopicManager from './TopicManager';
import MessageForm from './MessageForm';
import MessageList from './MessageList';

// SSE mesaj tipleri için yerel tanımlamalar
interface SSEMessage {
  type: SSEMessageType;
  data?: any;
  topic?: string;
  client_id?: string;
  timestamp?: string;
  message?: string;
  error?: string;
}

enum SSEMessageType {
  MESSAGE = 'message',
  BROADCAST = 'broadcast',
  CONNECTION = 'connection',
  SUBSCRIPTION = 'subscription',
  ERROR = 'error'
}

interface MessageItem {
  id: string;
  text: string;
  source: 'sse' | 'ws' | 'user';
  timestamp: Date;
  topic?: string;
}

/**
 * Realtime iletişim örnek bileşeni
 */
const RealtimeExample: React.FC = () => {
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [activeTopics, setActiveTopics] = useState<string[]>(['notifications']);
  
  // SSE hook'u
  const sse = useSSE({
    autoConnect: true,
    topics: activeTopics,
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
    topics: activeTopics,
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
  
  // Yeni konu ekle
  const addTopic = (topic: string) => {
    const updatedTopics = [...activeTopics, topic];
    setActiveTopics(updatedTopics);
    
    // Yeni konuya abone ol
    sse.subscribe(topic, (data: any) => {
      handleIncomingMessage({
        type: SSEMessageType.MESSAGE,
        data,
        topic
      }, 'sse');
    });
    
    ws.subscribe(topic, (data: any) => {
      handleIncomingMessage({
        type: WebSocketMessageType.MESSAGE,
        data,
        topic
      }, 'ws');
    });
  };
  
  // Konuyu kaldır
  const removeTopic = (topic: string) => {
    setActiveTopics(prev => prev.filter(t => t !== topic));
    
    // Konudan aboneliği kaldır
    sse.unsubscribe(topic);
    ws.unsubscribe(topic);
  };
  
  // Mesaj gönder
  const sendMessage = async (message: string, topic: string) => {
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
    } catch (error) {
      toast.error('Mesaj gönderilemedi');
      console.error('Mesaj gönderme hatası:', error);
      throw error;
    }
  };

  // Broadcast mesajı gönder
  const sendBroadcast = async (message: string) => {
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
      
      toast.success('Broadcast mesajı gönderildi');
    } catch (error) {
      toast.error('Broadcast gönderilemedi');
      console.error('Broadcast hatası:', error);
      throw error;
    }
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
  
  // Konu değiştiğinde yeniden abone ol
  useEffect(() => {
    // Önceki abonelikleri temizle
    sse.unsubscribe();
    ws.unsubscribe();
    
    // Tüm aktif konulara yeniden abone ol
    activeTopics.forEach(topicName => {
      sse.subscribe(topicName, (data: any) => {
        handleIncomingMessage({
          type: SSEMessageType.MESSAGE,
          data,
          topic: topicName
        }, 'sse');
      });
      
      ws.subscribe(topicName, (data: any) => {
        handleIncomingMessage({
          type: WebSocketMessageType.MESSAGE,
          data,
          topic: topicName
        }, 'ws');
      });
    });
  }, [activeTopics]);
  
  // Mesaj zamanını biçimlendir
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="w-full max-w-md lg:max-w-2xl mx-auto p-4 sm:p-5">
      <div className="glass-card gradient-bg p-5 sm:p-6 mb-8 animate-fade-in">
        <h2 className="text-2xl font-bold mb-5 gradient-text flex items-center">
          <i className="i-mdi-access-point-network mr-2 text-blue-500"></i>
          Gerçek Zamanlı İletişim
        </h2>
        
        {/* Bağlantı durumu kartları */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="glass-card-sm p-4 hover:shadow-lg hover:translate-y-[-2px] transform">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-2 ${sse.isConnected ? 'bg-success-500 animate-pulse' : 'bg-danger-500'}`}></div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  SSE: {sse.isConnected ? 'Bağlı' : sse.isConnecting ? 'Bağlanıyor...' : 'Bağlantı Kesik'}
                </span>
              </div>
              <div className="flex space-x-1.5">
                <button 
                  onClick={() => handleConnection('sse', 'connect')}
                  className={`text-xs py-1.5 px-3 rounded-full transition-all duration-200 ${sse.isConnected 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500' 
                    : 'btn-primary text-xs py-1.5 px-3 rounded-full'}`}
                  disabled={sse.isConnected}
                >
                  <i className="i-mdi-connection mr-1"></i>
                  Bağlan
                </button>
                <button 
                  onClick={() => handleConnection('sse', 'disconnect')}
                  className={`text-xs py-1.5 px-3 rounded-full transition-all duration-200 ${!sse.isConnected 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500' 
                    : 'btn-danger text-xs py-1.5 px-3 rounded-full'}`}
                  disabled={!sse.isConnected}
                >
                  <i className="i-mdi-connection-off mr-1"></i>
                  Kes
                </button>
                <button 
                  onClick={() => handleConnection('sse', 'reconnect')}
                  className="text-xs py-1.5 px-3 bg-amber-500 text-white rounded-full hover:bg-amber-600 transition-all duration-200 active:scale-95 transform"
                >
                  <i className="i-mdi-refresh mr-1"></i>
                  Yenile
                </button>
              </div>
            </div>
          </div>
          
          <div className="glass-card-sm p-4 hover:shadow-lg hover:translate-y-[-2px] transform">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-2 ${ws.isConnected ? 'bg-success-500 animate-pulse' : 'bg-danger-500'}`}></div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  WebSocket: {ws.isConnected ? 'Bağlı' : ws.isConnecting ? 'Bağlanıyor...' : 'Bağlantı Kesik'}
                </span>
              </div>
              <div className="flex space-x-1.5">
                <button 
                  onClick={() => handleConnection('ws', 'connect')}
                  className={`text-xs py-1.5 px-3 rounded-full transition-all duration-200 ${ws.isConnected 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500' 
                    : 'btn-primary text-xs py-1.5 px-3 rounded-full'}`}
                  disabled={ws.isConnected}
                >
                  <i className="i-mdi-connection mr-1"></i>
                  Bağlan
                </button>
                <button 
                  onClick={() => handleConnection('ws', 'disconnect')}
                  className={`text-xs py-1.5 px-3 rounded-full transition-all duration-200 ${!ws.isConnected 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500' 
                    : 'btn-danger text-xs py-1.5 px-3 rounded-full'}`}
                  disabled={!ws.isConnected}
                >
                  <i className="i-mdi-connection-off mr-1"></i>
                  Kes
                </button>
                <button 
                  onClick={() => handleConnection('ws', 'reconnect')}
                  className="text-xs py-1.5 px-3 bg-amber-500 text-white rounded-full hover:bg-amber-600 transition-all duration-200 active:scale-95 transform"
                >
                  <i className="i-mdi-refresh mr-1"></i>
                  Yenile
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Konu yönetimi */}
        <TopicManager 
          activeTopics={activeTopics}
          onAddTopic={addTopic}
          onRemoveTopic={removeTopic}
        />
        
        {/* Mesaj gönderme */}
        <MessageForm 
          activeTopics={activeTopics}
          onSend={sendMessage}
          onBroadcast={sendBroadcast}
        />
        
        {/* Mesaj listesi */}
        <MessageList 
          messages={messages}
          formatTime={formatTime}
        />
        
        {/* Bilgi */}
        <div className="glass-card-sm p-3.5 text-xs text-gray-600 dark:text-gray-400">
          <div className="flex flex-wrap gap-y-2 gap-x-4">
            <div className="flex items-center">
              <i className="i-mdi-identifier mr-1.5 text-primary-500"></i>
              <span className="font-medium mr-1">SSE ClientID:</span> 
              <code className="bg-gray-100 dark:bg-gray-900 px-1.5 py-0.5 rounded text-2xs">{sse.clientId}</code>
            </div>
            <div className="flex items-center">
              <i className="i-mdi-message-badge-outline mr-1.5 text-secondary-500"></i>
              <span className="font-medium mr-1">Son mesaj:</span>
              {sse.lastMessage ? formatTime(new Date(sse.lastMessage.timestamp || '')) : 'Yok'}
            </div>
            <div className="flex items-center">
              <i className="i-mdi-tag-multiple mr-1.5 text-success-500"></i>
              <span className="font-medium mr-1">Aktif konular:</span>
              <span>{activeTopics.length}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealtimeExample;