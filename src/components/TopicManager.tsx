import React, { useState } from 'react';
import { toast } from '../utils/toast';

interface TopicManagerProps {
  activeTopics: string[];
  onAddTopic: (topic: string) => void;
  onRemoveTopic: (topic: string) => void;
}

/**
 * Gerçek zamanlı mesajlaşma için konuları yöneten bileşen
 */
const TopicManager: React.FC<TopicManagerProps> = ({ activeTopics, onAddTopic, onRemoveTopic }) => {
  const [newTopic, setNewTopic] = useState('');
  
  // Yeni konu ekle
  const handleAddTopic = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newTopic.trim() || activeTopics.includes(newTopic.trim())) {
      return;
    }
    
    onAddTopic(newTopic.trim());
    setNewTopic('');
    toast.success(`"${newTopic.trim()}" konusuna abone olundu`);
  };
  
  // Konuyu kaldır
  const handleRemoveTopic = (topicToRemove: string) => {
    if (topicToRemove === 'notifications') {
      toast.error('Varsayılan "notifications" konusu kaldırılamaz');
      return;
    }
    
    onRemoveTopic(topicToRemove);
    toast.info(`"${topicToRemove}" konusundan abonelik kaldırıldı`);
  };
  
  return (
    <div className="mb-6">
      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
        <i className="i-mdi-tag-multiple mr-1.5 text-primary-500"></i>
        Konu Yönetimi
      </h3>
      
      <div className="glass-card-sm p-4 mb-3">
        <div className="flex flex-wrap gap-2 mb-3">
          {activeTopics.map(t => (
            <div 
              key={t} 
              className="bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 text-xs rounded-full px-2.5 py-1 flex items-center"
            >
              <span>{t}</span>
              <button 
                onClick={() => handleRemoveTopic(t)}
                className="ml-1.5 text-primary-500 hover:text-primary-700 dark:hover:text-primary-300"
                disabled={t === 'notifications'}
              >
                <i className="i-mdi-close text-sm"></i>
              </button>
            </div>
          ))}
        </div>
        
        <form onSubmit={handleAddTopic} className="flex gap-2">
          <input
            type="text"
            value={newTopic}
            onChange={(e) => setNewTopic(e.target.value)}
            className="input-field flex-1 py-1.5 text-sm"
            placeholder="Yeni konu ekle..."
          />
          <button 
            type="submit"
            className="btn-primary text-xs py-1.5 px-3"
            disabled={!newTopic.trim() || activeTopics.includes(newTopic.trim())}
          >
            <i className="i-mdi-tag-plus mr-1"></i>
            Ekle
          </button>
        </form>
      </div>
    </div>
  );
};

export default TopicManager;
