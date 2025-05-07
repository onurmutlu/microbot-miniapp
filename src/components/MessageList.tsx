import React, { useEffect, useRef } from 'react';

interface MessageItem {
  id: string;
  text: string;
  source: 'sse' | 'ws' | 'user';
  timestamp: Date;
  topic?: string;
}

interface MessageListProps {
  messages: MessageItem[];
  formatTime: (date: Date) => string;
}

/**
 * Mesaj listesi bileşeni
 */
const MessageList: React.FC<MessageListProps> = ({ messages, formatTime }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Otomatik kaydırma
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  return (
    <div className="glass-card-sm h-96 overflow-y-auto mb-4 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700">
      <div className="flex flex-col-reverse p-4 min-h-full">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 py-12 flex flex-col items-center justify-center animate-fade-in">
            <i className="i-mdi-message-text-outline text-5xl mb-3 opacity-30"></i>
            <p>Henüz mesaj yok</p>
            <p className="text-xs mt-1.5">Mesaj göndererek başlayın</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`mb-3.5 rounded-2xl p-3.5 transform transition-all duration-300 animate-slide-in-bottom ${
                msg.source === 'user' 
                  ? 'bg-primary-100/90 dark:bg-primary-900/40 ml-12 shadow-sm hover:shadow-md hover:translate-y-[-2px]' 
                  : msg.source === 'sse' 
                    ? 'bg-success-100/90 dark:bg-success-900/40 mr-12 shadow-sm hover:shadow-md hover:translate-y-[-2px]' 
                    : 'bg-secondary-100/90 dark:bg-secondary-900/40 mr-12 shadow-sm hover:shadow-md hover:translate-y-[-2px]'
              }`}
            >
              <div className="text-sm text-gray-800 dark:text-gray-200 break-words">{msg.text}</div>
              <div className="flex justify-between mt-2.5 text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center">
                  {msg.source === 'user' ? (
                    <><i className="i-mdi-account-circle mr-1.5 text-primary-500"></i>Siz</>
                  ) : msg.source === 'sse' ? (
                    <><i className="i-mdi-server-network mr-1.5 text-success-500"></i>SSE</>
                  ) : (
                    <><i className="i-mdi-web-sync mr-1.5 text-secondary-500"></i>WebSocket</>
                  )}
                  {msg.topic && (
                    <span className="ml-2 bg-gray-200 dark:bg-gray-700 rounded-full px-2.5 py-0.5 text-2xs">
                      {msg.topic}
                    </span>
                  )}
                </div>
                <span className="flex items-center">
                  <i className="i-mdi-clock-outline mr-1 text-gray-400"></i>
                  {formatTime(msg.timestamp)}
                </span>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default MessageList;
