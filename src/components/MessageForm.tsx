import React, { useState } from 'react';

interface MessageFormProps {
  activeTopics: string[];
  onSend: (message: string, topic: string) => Promise<void>;
  onBroadcast: (message: string) => Promise<void>;
}

/**
 * Mesaj gönderme formu bileşeni
 */
const MessageForm: React.FC<MessageFormProps> = ({ activeTopics, onSend, onBroadcast }) => {
  const [message, setMessage] = useState('');
  const [topic, setTopic] = useState(activeTopics[0] || 'notifications');
  
  // Mesaj gönder
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) return;
    
    try {
      await onSend(message, topic);
      setMessage('');
    } catch (error) {
      console.error('Mesaj gönderme hatası:', error);
    }
  };
  
  // Broadcast mesajı gönder
  const handleBroadcast = async () => {
    if (!message.trim()) return;
    
    try {
      await onBroadcast(message);
      setMessage('');
    } catch (error) {
      console.error('Broadcast hatası:', error);
    }
  };
  
  return (
    <div className="mb-6">
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          <i className="i-mdi-label mr-1.5 text-primary-500"></i>
          Mesaj Gönderilecek Konu
        </label>
        <select
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className="input-field py-2 appearance-none pr-10"
        >
          {activeTopics.map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>
      
      <form onSubmit={handleSend}>
        <div className="relative mb-3">
          <input 
            type="text" 
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="input-field pr-28"
            placeholder="Mesajınızı yazın..."
          />
          <button 
            type="submit"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 px-4 py-1.5 btn-primary rounded-lg"
            disabled={!message.trim()}
          >
            <i className="i-mdi-send mr-1.5"></i>
            Gönder
          </button>
        </div>
        <button
          type="button"
          onClick={handleBroadcast}
          className="btn-secondary w-full flex items-center justify-center py-3"
          disabled={!message.trim()}
        >
          <i className="i-mdi-broadcast mr-2 animate-pulse"></i>
          Herkese Broadcast Gönder
        </button>
      </form>
    </div>
  );
};

export default MessageForm;
