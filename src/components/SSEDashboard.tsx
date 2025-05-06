import React, { useState, useEffect, useMemo } from 'react';
import sseService, { 
  SSEConnectionState, 
  SSEMessage, 
  SSEConnectionHistoryEntry,
  SSEStats
} from '../services/sseService';
import { useSSE } from '../hooks/useSSE';
import { toast } from 'react-toastify';

const formatTimestamp = (timestamp: string) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString() + '.' + date.getMilliseconds().toString().padStart(3, '0');
};

const formatDuration = (ms: number) => {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
};

interface SSEDashboardProps {
  refreshInterval?: number; // istatistikleri güncelleme aralığı (ms)
  initialTopics?: string[];
  showConnectionHistory?: boolean;
  showStats?: boolean;
  showFilters?: boolean;
  maxDisplayedMessages?: number;
  showArchivedMessages?: boolean;
  compactMode?: boolean;
}

const SSEDashboard: React.FC<SSEDashboardProps> = ({
  refreshInterval = 5000,
  initialTopics = [],
  showConnectionHistory = true,
  showStats = true,
  showFilters = true,
  maxDisplayedMessages = 25,
  showArchivedMessages = true,
  compactMode = false
}) => {
  const {
    status,
    isSubscribed,
    messages,
    subscribeTopic,
    unsubscribeTopic,
    publishToTopic,
    broadcast,
    reconnect,
    clearMessages
  } = useSSE({
    topic: initialTopics.length === 1 ? initialTopics[0] : undefined,
    autoSubscribe: initialTopics.length === 1,
    showToasts: true
  });

  const [newTopic, setNewTopic] = useState<string>('');
  const [newMessage, setNewMessage] = useState<string>('');
  const [messageFilter, setMessageFilter] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'messages' | 'history' | 'stats' | 'archived'>('messages');
  const [stats, setStats] = useState<SSEStats | null>(null);
  const [connectionHistory, setConnectionHistory] = useState<SSEConnectionHistoryEntry[]>([]);
  const [archivedTopic, setArchivedTopic] = useState<string>('global');
  const [archivedMessages, setArchivedMessages] = useState<SSEMessage[]>([]);
  const [selectedPriority, setSelectedPriority] = useState<SSEMessage['priority']>('normal');
  const [messageMetadata, setMessageMetadata] = useState<string>('');
  const [ttl, setTtl] = useState<number>(0);
  const [activeTopics, setActiveTopics] = useState<string[]>(initialTopics);
  const [debugMode, setDebugMode] = useState<boolean>(false);

  // İstatistikleri düzenli olarak güncelle
  useEffect(() => {
    if (!showStats && activeTab !== 'stats') return;

    const updateStats = () => {
      try {
        const currentStats = sseService.getStats();
        setStats(currentStats);
        
        if (showConnectionHistory || activeTab === 'history') {
          setConnectionHistory(sseService.getConnectionHistory());
        }
        
        if (showArchivedMessages && activeTab === 'archived') {
          setArchivedMessages(sseService.getArchivedMessages(archivedTopic));
        }
      } catch (error) {
        console.error('İstatistik güncelleme hatası:', error);
      }
    };

    // İlk çağrı
    updateStats();

    // Periyodik güncelleme
    const intervalId = setInterval(updateStats, refreshInterval);
    return () => {
      clearInterval(intervalId);
    };
  }, [refreshInterval, showStats, showConnectionHistory, activeTab, archivedTopic, showArchivedMessages]);

  // Arşivlenen mesajları yükle
  useEffect(() => {
    if (activeTab === 'archived') {
      setArchivedMessages(sseService.getArchivedMessages(archivedTopic));
    }
  }, [activeTab, archivedTopic]);

  // Debug modunu ayarla
  const toggleDebugMode = () => {
    const newMode = !debugMode;
    sseService.setDebugMode(newMode);
    setDebugMode(newMode);
    toast.info(`Debug modu ${newMode ? 'aktif' : 'devre dışı'}`);
  };

  // Konuya abone ol
  const handleSubscribe = async () => {
    if (!newTopic) {
      toast.error('Lütfen bir konu adı girin');
      return;
    }

    const success = await subscribeTopic(newTopic);
    if (success) {
      setActiveTopics(prev => [...prev, newTopic]);
      setNewTopic('');
    }
  };

  // Konudan abone olmayı kaldır
  const handleUnsubscribe = async (topic: string) => {
    const success = await unsubscribeTopic(topic);
    if (success) {
      setActiveTopics(prev => prev.filter(t => t !== topic));
    }
  };

  // Mesaj gönder
  const handleSendMessage = async () => {
    if (!newMessage) {
      toast.error('Lütfen bir mesaj içeriği girin');
      return;
    }

    try {
      // Metadata'yı parse et
      let metadata: Record<string, any> | undefined;
      if (messageMetadata) {
        try {
          metadata = JSON.parse(messageMetadata);
        } catch (error) {
          toast.error('Metadata JSON formatında olmalıdır');
          return;
        }
      }

      // Seçilen aktif konulara mesaj gönder
      if (activeTopics.length > 0) {
        const messageOptions = {
          priority: selectedPriority,
          ttl: ttl > 0 ? ttl : undefined,
          metadata
        };

        if (activeTopics.length === 1) {
          await publishToTopic(activeTopics[0], newMessage, messageOptions);
        } else {
          await sseService.publishToMultipleTopics(activeTopics, newMessage, messageOptions);
        }
      } else {
        // Aktif konu yoksa yayın yap
        await broadcast(newMessage, {
          priority: selectedPriority,
          ttl: ttl > 0 ? ttl : undefined,
          metadata
        });
      }

      setNewMessage('');
      setMessageMetadata('');
    } catch (error) {
      console.error('Mesaj gönderme hatası:', error);
      toast.error('Mesaj gönderilirken bir hata oluştu');
    }
  };

  // Filtrelenmiş mesajlar
  const filteredMessages = useMemo(() => {
    if (!messageFilter) return messages;

    const lowerFilter = messageFilter.toLowerCase();
    return messages.filter(msg => {
      const msgString = JSON.stringify(msg).toLowerCase();
      return msgString.includes(lowerFilter);
    });
  }, [messages, messageFilter]);

  // Bağlantı durumu renk ve metin
  const connectionStatusInfo = {
    connecting: { color: 'bg-yellow-500', text: 'Bağlanıyor...' },
    connected: { color: 'bg-green-500', text: 'Bağlı' },
    disconnected: { color: 'bg-red-500', text: 'Bağlantı Kesildi' },
    error: { color: 'bg-red-700', text: 'Bağlantı Hatası' }
  };

  // Öncelik sınıfları
  const priorityClasses = {
    low: 'bg-gray-200 text-gray-800',
    normal: 'bg-blue-200 text-blue-800',
    high: 'bg-yellow-200 text-yellow-800',
    critical: 'bg-red-200 text-red-800'
  };

  // Öncelik badge'i
  const PriorityBadge = ({ priority }: { priority?: string }) => {
    if (!priority) return null;
    return (
      <span className={`text-xs rounded px-1.5 py-0.5 ml-1 ${priorityClasses[priority as keyof typeof priorityClasses] || 'bg-gray-200'}`}>
        {priority}
      </span>
    );
  };

  return (
    <div className={`border rounded-lg shadow-md bg-white ${compactMode ? 'p-2' : 'p-4'}`}>
      {/* Başlık ve Durum */}
      <div className="flex justify-between items-center mb-3">
        <h2 className={`${compactMode ? 'text-lg' : 'text-xl'} font-semibold`}>
          SSE Gösterge Paneli
          {debugMode && <span className="ml-2 text-xs bg-purple-200 text-purple-800 rounded-full px-2 py-0.5">DEBUG</span>}
        </h2>
        <div className="flex items-center">
          <div className={`w-2.5 h-2.5 rounded-full mr-1.5 ${connectionStatusInfo[status].color}`}></div>
          <span className="text-sm font-medium">{connectionStatusInfo[status].text}</span>
        </div>
      </div>

      {/* Tab Menüsü */}
      <div className="flex border-b mb-3">
        <button
          className={`py-1.5 px-3 text-sm font-medium ${activeTab === 'messages' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('messages')}
        >
          Mesajlar
        </button>
        {showArchivedMessages && (
          <button
            className={`py-1.5 px-3 text-sm font-medium ${activeTab === 'archived' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('archived')}
          >
            Arşiv
          </button>
        )}
        {showConnectionHistory && (
          <button
            className={`py-1.5 px-3 text-sm font-medium ${activeTab === 'history' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('history')}
          >
            Bağlantı Geçmişi
          </button>
        )}
        {showStats && (
          <button
            className={`py-1.5 px-3 text-sm font-medium ${activeTab === 'stats' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('stats')}
          >
            İstatistikler
          </button>
        )}
      </div>

      {/* Kontrol Paneli */}
      <div className={`mb-3 ${compactMode ? 'space-y-1.5' : 'space-y-2'}`}>
        <div className="flex items-center">
          <span className="text-sm font-medium mr-2">Konular:</span>
          <div className="flex flex-wrap gap-1.5">
            {activeTopics.length === 0 ? (
              <span className="text-sm text-gray-500 italic">Yok (Genel yayın)</span>
            ) : (
              activeTopics.map(topic => (
                <div key={topic} className="flex items-center text-xs bg-blue-100 text-blue-800 rounded px-2 py-1">
                  {topic}
                  <button
                    onClick={() => handleUnsubscribe(topic)}
                    className="ml-1.5 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={newTopic}
            onChange={(e) => setNewTopic(e.target.value)}
            placeholder="Yeni konu"
            className="flex-1 p-1.5 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            onClick={handleSubscribe}
            className="bg-blue-500 text-white px-3 py-1.5 text-sm rounded hover:bg-blue-600"
          >
            Abone Ol
          </button>
          <button
            onClick={reconnect}
            className="bg-gray-500 text-white px-3 py-1.5 text-sm rounded hover:bg-gray-600"
            disabled={status === 'connected' || status === 'connecting'}
          >
            Yeniden Bağlan
          </button>
          <button
            onClick={toggleDebugMode}
            className={`text-white px-3 py-1.5 text-sm rounded ${debugMode ? 'bg-purple-600 hover:bg-purple-700' : 'bg-gray-400 hover:bg-gray-500'}`}
          >
            Debug {debugMode ? 'Kapat' : 'Aç'}
          </button>
        </div>
      </div>

      {/* Aktif Tab İçeriği */}
      {activeTab === 'messages' && (
        <>
          {/* Mesaj Gönderme */}
          <div className={`mb-3 ${compactMode ? 'space-y-1.5' : 'space-y-2'}`}>
            <div className="flex gap-2">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Mesaj içeriği"
                rows={compactMode ? 1 : 2}
                className="flex-1 p-2 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <div className="flex flex-col justify-between">
                <button
                  onClick={handleSendMessage}
                  className="bg-green-500 text-white px-4 py-1.5 text-sm rounded hover:bg-green-600"
                >
                  Gönder
                </button>
                <button
                  onClick={clearMessages}
                  className="bg-red-500 text-white px-4 py-1.5 text-sm rounded hover:bg-red-600"
                >
                  Temizle
                </button>
              </div>
            </div>

            {/* Mesaj Seçenekleri */}
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center">
                <label className="text-xs text-gray-700 mr-1">Öncelik:</label>
                <select 
                  value={selectedPriority || 'normal'} 
                  onChange={(e) => setSelectedPriority(e.target.value as SSEMessage['priority'])}
                  className="text-xs border rounded p-1"
                >
                  <option value="low">Düşük</option>
                  <option value="normal">Normal</option>
                  <option value="high">Yüksek</option>
                  <option value="critical">Kritik</option>
                </select>
              </div>
              <div className="flex items-center">
                <label className="text-xs text-gray-700 mr-1">TTL (sn):</label>
                <input 
                  type="number" 
                  value={ttl} 
                  onChange={(e) => setTtl(Number(e.target.value))}
                  min="0"
                  className="text-xs border rounded p-1 w-16"
                />
              </div>
              <div className="flex-1">
                <input 
                  type="text" 
                  value={messageMetadata} 
                  onChange={(e) => setMessageMetadata(e.target.value)}
                  placeholder="Metadata (JSON formatında)"
                  className="text-xs border rounded p-1 w-full"
                />
              </div>
            </div>
          </div>

          {/* Filtre */}
          {showFilters && (
            <div className="mb-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={messageFilter}
                  onChange={(e) => setMessageFilter(e.target.value)}
                  placeholder="Mesajları filtrele..."
                  className="flex-1 p-1.5 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {/* Mesaj Listesi */}
          <div>
            <h3 className="text-sm font-medium mb-1.5">Mesajlar ({filteredMessages.length})</h3>
            <div className={`border rounded overflow-y-auto p-1.5 bg-gray-50 ${compactMode ? 'h-32' : 'h-64'}`}>
              {filteredMessages.length === 0 ? (
                <p className="text-gray-500 text-center text-sm p-4">Henüz mesaj yok</p>
              ) : (
                <ul className="space-y-1.5">
                  {filteredMessages.slice(0, maxDisplayedMessages).map((msg, index) => (
                    <li key={index} className="text-sm border-b pb-1.5">
                      <div className="flex justify-between text-xs text-gray-500 mb-0.5">
                        <div className="flex items-center">
                          <span className="font-semibold">{msg.type}</span>
                          <PriorityBadge priority={msg.priority} />
                          {msg.topic && (
                            <span className="ml-1.5 bg-blue-100 text-blue-800 rounded-sm px-1">{msg.topic}</span>
                          )}
                        </div>
                        <span>{formatTimestamp(msg.timestamp)}</span>
                      </div>
                      <div className="bg-white p-1.5 rounded text-xs">
                        <code className="whitespace-pre-wrap overflow-x-auto block max-h-24">
                          {typeof msg.data === 'object' ? JSON.stringify(msg.data, null, 2) : String(msg.data)}
                        </code>
                        {msg.metadata && (
                          <div className="mt-1 pt-1 border-t border-dashed border-gray-200">
                            <span className="text-xs text-gray-500">Metadata:</span>
                            <code className="whitespace-pre-wrap overflow-x-auto block max-h-16 text-gray-600">
                              {JSON.stringify(msg.metadata, null, 2)}
                            </code>
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}

      {/* Arşivlenmiş Mesajlar */}
      {activeTab === 'archived' && (
        <>
          <div className="mb-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <label className="text-sm font-medium mr-2">Arşiv:</label>
                <select
                  value={archivedTopic}
                  onChange={(e) => setArchivedTopic(e.target.value)}
                  className="text-sm border rounded p-1.5"
                >
                  <option value="global">Global</option>
                  {/* Aktif konular */}
                  {activeTopics.map(topic => (
                    <option key={topic} value={topic}>{topic}</option>
                  ))}
                  {/* Mesaj tipleri */}
                  <option value="type:broadcast">Yayın Mesajları</option>
                  <option value="type:topic_message">Konu Mesajları</option>
                  <option value="type:system">Sistem Mesajları</option>
                  <option value="type:notification">Bildirimler</option>
                </select>
              </div>
              <button
                onClick={() => sseService.clearArchivedMessages(archivedTopic)}
                className="bg-red-500 text-white px-3 py-1 text-xs rounded hover:bg-red-600"
              >
                Arşivi Temizle
              </button>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-1.5">Arşivlenmiş Mesajlar ({archivedMessages.length})</h3>
            <div className={`border rounded overflow-y-auto p-1.5 bg-gray-50 ${compactMode ? 'h-32' : 'h-64'}`}>
              {archivedMessages.length === 0 ? (
                <p className="text-gray-500 text-center text-sm p-4">Arşivlenmiş mesaj yok</p>
              ) : (
                <ul className="space-y-1.5">
                  {archivedMessages.slice(0, maxDisplayedMessages).map((msg, index) => (
                    <li key={index} className="text-sm border-b pb-1.5">
                      <div className="flex justify-between text-xs text-gray-500 mb-0.5">
                        <div className="flex items-center">
                          <span className="font-semibold">{msg.type}</span>
                          <PriorityBadge priority={msg.priority} />
                          {msg.topic && (
                            <span className="ml-1.5 bg-blue-100 text-blue-800 rounded-sm px-1">{msg.topic}</span>
                          )}
                        </div>
                        <span>{formatTimestamp(msg.timestamp)}</span>
                      </div>
                      <div className="bg-white p-1.5 rounded text-xs">
                        <code className="whitespace-pre-wrap overflow-x-auto block max-h-24">
                          {typeof msg.data === 'object' ? JSON.stringify(msg.data, null, 2) : String(msg.data)}
                        </code>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}

      {/* Bağlantı Geçmişi */}
      {activeTab === 'history' && (
        <div>
          <h3 className="text-sm font-medium mb-1.5">Bağlantı Geçmişi</h3>
          <div className={`border rounded overflow-y-auto p-1.5 bg-gray-50 ${compactMode ? 'h-32' : 'h-64'}`}>
            {connectionHistory.length === 0 ? (
              <p className="text-gray-500 text-center text-sm p-4">Bağlantı kaydı yok</p>
            ) : (
              <ul className="space-y-1.5">
                {connectionHistory.map((entry, index) => (
                  <li key={index} className={`
                    p-1.5 text-xs rounded 
                    ${entry.action === 'connect' ? 'bg-green-50 border-l-2 border-green-500' : 
                      entry.action === 'disconnect' ? 'bg-gray-50 border-l-2 border-gray-500' :
                      entry.action === 'reconnect' ? 'bg-yellow-50 border-l-2 border-yellow-500' :
                      'bg-red-50 border-l-2 border-red-500'
                    }
                  `}>
                    <div className="flex justify-between">
                      <span className="font-medium">
                        {entry.action === 'connect' ? 'Bağlandı' : 
                         entry.action === 'disconnect' ? 'Bağlantı Kesildi' :
                         entry.action === 'reconnect' ? 'Yeniden Bağlanıyor' :
                         'Hata'
                        }
                      </span>
                      <span className="text-gray-500">{formatTimestamp(entry.timestamp)}</span>
                    </div>
                    {entry.reason && (
                      <div className="mt-1 text-gray-600">
                        Sebep: {entry.reason}
                      </div>
                    )}
                    {entry.duration !== undefined && (
                      <div className="mt-1 text-gray-600">
                        Süre: {formatDuration(entry.duration)}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* İstatistikler */}
      {activeTab === 'stats' && stats && (
        <div>
          <h3 className="text-sm font-medium mb-1.5">Bağlantı İstatistikleri</h3>
          <div className="bg-gray-50 rounded p-3 text-sm grid grid-cols-2 gap-3">
            <div>
              <div className="mb-2">
                <div className="text-xs font-medium text-gray-500">Alınan Mesaj Sayısı</div>
                <div className="text-lg font-semibold">{stats.messagesReceived}</div>
              </div>
              
              <div className="mb-2">
                <div className="text-xs font-medium text-gray-500">Bağlantı Denemeleri</div>
                <div className="text-lg font-semibold">{stats.connectionAttempts}</div>
              </div>
              
              <div className="mb-2">
                <div className="text-xs font-medium text-gray-500">Mesaj Hızı</div>
                <div className="text-lg font-semibold">{stats.messageRate.toFixed(2)} mesaj/sn</div>
              </div>
            </div>
            
            <div>
              <div className="mb-2">
                <div className="text-xs font-medium text-gray-500">Çalışma Süresi</div>
                <div className="font-semibold">
                  {stats.uptime > 0 ? formatDuration(stats.uptime) : 'Bağlı değil'}
                </div>
              </div>
              
              <div className="mb-2">
                <div className="text-xs font-medium text-gray-500">Son Bağlantı</div>
                <div className="font-semibold">
                  {stats.lastConnectedAt ? new Date(stats.lastConnectedAt).toLocaleString() : 'Hiç bağlanmadı'}
                </div>
              </div>
              
              <div className="mb-2">
                <div className="text-xs font-medium text-gray-500">Son Kopma</div>
                <div className="font-semibold">
                  {stats.lastDisconnectedAt ? new Date(stats.lastDisconnectedAt).toLocaleString() : 'Hiç kopmadı'}
                </div>
              </div>
            </div>
            
            <div className="col-span-2">
              <div className="text-xs font-medium text-gray-500 mb-1">Aktif Konular</div>
              <div className="flex flex-wrap gap-1.5">
                {stats.activeTopics.length === 0 ? (
                  <span className="text-xs text-gray-500 italic">Yok</span>
                ) : (
                  stats.activeTopics.map((topic) => (
                    <div key={topic} className="text-xs bg-blue-100 text-blue-800 rounded px-1.5 py-0.5">
                      {topic}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SSEDashboard; 