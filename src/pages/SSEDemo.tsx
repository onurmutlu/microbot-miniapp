import React, { useState, useEffect } from 'react';
import SSEDashboard from '../components/SSEDashboard';
import SSEListener from '../components/SSEListener';
import SSECacheSettings from '../components/SSECacheSettings';
import sseService from '../services/sseService';
import { toast } from 'react-toastify';

const SSEDemo: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'listener' | 'settings'>('dashboard');
  const [isOnline, setIsOnline] = useState<boolean>(sseService.isOnline());
  const [showOfflineStatus, setShowOfflineStatus] = useState<boolean>(false);
  
  // SSE durumunu izle
  useEffect(() => {
    const checkNetworkStatus = () => {
      const online = sseService.isOnline();
      setIsOnline(online);
      setShowOfflineStatus(!online);
    };
    
    // İlk kontrol
    checkNetworkStatus();
    
    // Çevrimiçi/çevrimdışı olay dinleyicileri
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineStatus(false);
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineStatus(true);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // SSE bağlantı durumu değişikliklerini izle
    const unsubscribeStatus = sseService.onStatusChange((status) => {
      if (status === 'disconnected' || status === 'error') {
        checkNetworkStatus();
      }
    });
    
    // Temizleme
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribeStatus();
    };
  }, []);
  
  const toggleOfflineMode = () => {
    // Tarayıcı online/offline durumunu değiştiremeyiz, bu yüzden sadece simüle ediyoruz
    toast.info(`${isOnline ? 'Çevrimdışı' : 'Çevrimiçi'} mod simüle ediliyor`);
    setShowOfflineStatus(!isOnline);
    
    // UI'dan görebilmek için mesaj gönder
    if (isOnline) {
      // Çevrimdışı olduğunda demo mesajı gönder
      sseService.publishToTopic('status', {
        status: 'offline',
        message: 'Çevrimdışı moda geçildi (simülasyon)',
        timestamp: new Date().toISOString()
      }, { priority: 'high' });
    } else {
      // Çevrimiçi olduğunda demo mesajı gönder
      sseService.publishToTopic('status', {
        status: 'online',
        message: 'Çevrimiçi moda geçildi (simülasyon)',
        timestamp: new Date().toISOString()
      }, { priority: 'normal' });
    }
  };
  
  // Sayfadan ayrılırken sistem kaynaklarını temizle
  useEffect(() => {
    return () => {
      console.log('SSEDemo sayfası unmount ediliyor, kaynaklar temizleniyor');
    };
  }, []);
  
  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <h1 className="text-2xl font-bold mb-2">SSE Demo</h1>
      <p className="text-gray-600 mb-4">
        Bu sayfa, Server-Sent Events (SSE) entegrasyonunu göstermek için oluşturulmuştur.
      </p>
      
      {showOfflineStatus && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4">
          <div className="flex items-center">
            <div className="py-1">
              <svg className="h-6 w-6 text-yellow-500 mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="font-bold">Çevrimdışı Mod {sseService.isOnline() ? '(Simülasyon)' : ''}</p>
              <p className="text-sm">
                Bu {sseService.isOnline() ? 'simülasyon' : 'gerçek çevrimdışı durum'}, 
                SSE'nin çevrimdışı durumdayken nasıl çalıştığını gösterir. 
                Mesajlar yerel olarak işlenecek ve çevrimiçi olduğunuzda senkronize edilecektir.
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex border-b mb-4">
        <button
          className={`py-2 px-4 font-medium ${
            activeTab === 'dashboard' 
              ? 'border-b-2 border-blue-500 text-blue-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('dashboard')}
        >
          Gösterge Paneli
        </button>
        <button
          className={`py-2 px-4 font-medium ${
            activeTab === 'listener' 
              ? 'border-b-2 border-blue-500 text-blue-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('listener')}
        >
          Basit Dinleyici
        </button>
        <button
          className={`py-2 px-4 font-medium ${
            activeTab === 'settings' 
              ? 'border-b-2 border-blue-500 text-blue-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('settings')}
        >
          Önbellek Ayarları
        </button>
        
        <div className="ml-auto flex items-center">
          <a 
            href="/sse-client-demo" 
            className="text-blue-600 hover:text-blue-800 text-sm mr-4"
          >
            Rehber API Örneği
          </a>
          
          <button
            onClick={toggleOfflineMode}
            className={`py-2 px-4 text-sm rounded ${
              !isOnline
                ? 'bg-green-500 text-white hover:bg-green-600' 
                : 'bg-yellow-500 text-white hover:bg-yellow-600'
            }`}
            disabled={!sseService.isOnline() && isOnline}
          >
            {!isOnline ? 'Çevrimiçi Modu Simüle Et' : 'Çevrimdışı Modu Simüle Et'}
          </button>
        </div>
      </div>
      
      <div className="mt-4">
        {activeTab === 'dashboard' && (
          <SSEDashboard 
            initialTopics={['status', 'notifications']} 
            showArchivedMessages={true}
            showConnectionHistory={true}
            showStats={true}
            showFilters={true}
          />
        )}
        
        {activeTab === 'listener' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SSEListener topic="status" showControls={true} />
            <SSEListener topic="notifications" showControls={true} />
          </div>
        )}
        
        {activeTab === 'settings' && (
          <SSECacheSettings />
        )}
      </div>
    </div>
  );
};

export default SSEDemo; 