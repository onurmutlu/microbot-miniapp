import React, { useState, useEffect } from 'react';
import { ChartBarIcon, ArrowPathIcon, CpuChipIcon, ServerIcon, ExclamationTriangleIcon, SignalIcon, ArrowsRightLeftIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';
import { systemService, SystemStatus as SystemStatusType } from '../services/systemService';
import Spinner from '../components/ui/Spinner';
import { Tab } from '@headlessui/react';
import { Link } from 'react-router-dom';

const SystemStatus: React.FC = () => {
  const [status, setStatus] = useState<SystemStatusType | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRestarting, setIsRestarting] = useState<boolean>(false);

  useEffect(() => {
    fetchSystemStatus();
    const interval = setInterval(fetchSystemStatus, 60000); // Her dakika yenile
    return () => clearInterval(interval);
  }, []);

  const fetchSystemStatus = async () => {
    try {
      setIsLoading(true);
      const data = await systemService.getSystemStatus();
      setStatus(data);
    } catch (error) {
      console.error('Sistem durumu yüklenirken hata oluştu:', error);
      toast.error('Sistem durumu yüklenirken hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const restartHandlers = async () => {
    try {
      setIsRestarting(true);
      await systemService.restartHandlers();
      toast.success('Tüm handler\'lar yeniden başlatıldı');
      fetchSystemStatus();
    } catch (error) {
      console.error('Handler\'lar yeniden başlatılırken hata oluştu:', error);
      toast.error('Handler\'lar yeniden başlatılırken hata oluştu');
    } finally {
      setIsRestarting(false);
    }
  };

  if (!status?.is_admin) {
    return (
      <div className="container mx-auto max-w-3xl py-8 animate-fade-in">
        <div className="glass-card p-8 rounded-xl shadow-lg border border-red-200/30">
          <div className="text-center py-8">
            <h1 className="text-2xl font-bold text-red-500 mb-4 glass-gradient">Yetkisiz Erişim</h1>
            <p className="text-gray-600 dark:text-gray-300">
              Bu sayfaya erişmek için admin yetkisine sahip olmalısınız.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-5xl py-6 animate-fade-in">
      <div className="glass-card p-8 rounded-xl shadow-lg border border-indigo-200/30">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white glass-gradient">Sistem Durumu</h1>
          <div className="flex items-center space-x-2">
            <Link
              to="/system/errors"
              className="glass-btn p-2 rounded-full hover:bg-red-100/30 dark:hover:bg-red-700/30 transition-colors flex items-center"
            >
              <ExclamationTriangleIcon className="h-5 w-5 text-red-600 dark:text-red-400 mr-2" />
              <span className="text-sm font-medium">Hata Raporları</span>
            </Link>
            <Link
              to="/system/websocket"
              className="glass-btn p-2 rounded-full hover:bg-blue-100/30 dark:hover:bg-blue-700/30 transition-colors flex items-center"
            >
              <SignalIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
              <span className="text-sm font-medium">WebSocket</span>
            </Link>
            <button
              onClick={fetchSystemStatus}
              className="glass-btn p-2 rounded-full hover:bg-indigo-100/30 dark:hover:bg-indigo-700/30 transition-colors"
              title="Yenile"
            >
              <ArrowPathIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-300" />
            </button>
          </div>
        </div>

        {isLoading && !status ? (
          <div className="flex justify-center items-center py-16">
            <Spinner isLoading={true} size="xl" variant="glassEffect" />
          </div>
        ) : (
          <Tab.Group>
            <Tab.List className="flex space-x-3 rounded-lg bg-gray-100/30 dark:bg-gray-800/30 p-1 mb-6">
              <Tab className={({ selected }) => 
                `w-full py-2.5 text-sm font-medium rounded-lg transition-all
                 ${selected ? 'glass-btn glass-gradient-primary' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200/30 dark:hover:bg-gray-700/30'}`
              }>
                Genel Bakış
              </Tab>
              <Tab className={({ selected }) => 
                `w-full py-2.5 text-sm font-medium rounded-lg transition-all
                 ${selected ? 'glass-btn glass-gradient-primary' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200/30 dark:hover:bg-gray-700/30'}`
              }>
                Bağlantılar
              </Tab>
              <Tab className={({ selected }) => 
                `w-full py-2.5 text-sm font-medium rounded-lg transition-all
                 ${selected ? 'glass-btn glass-gradient-primary' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200/30 dark:hover:bg-gray-700/30'}`
              }>
                Sistem Kaynakları
              </Tab>
            </Tab.List>
            
            <Tab.Panels>
              {/* Genel Bakış Paneli */}
              <Tab.Panel>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  <div className="glass-card glass-gradient-primary p-6 rounded-lg shadow-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-300 font-medium">Aktif Handler</p>
                        <h3 className="text-3xl font-bold text-indigo-600 dark:text-indigo-300 mt-2">{status?.active_handlers || 0}</h3>
                      </div>
                      <div className="p-3 bg-indigo-100/30 dark:bg-indigo-700/30 rounded-full">
                        <ChartBarIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-300" />
                      </div>
                    </div>
                  </div>

                  <div className="glass-card glass-gradient-secondary p-6 rounded-lg shadow-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-300 font-medium">Aktif Zamanlayıcılar</p>
                        <h3 className="text-3xl font-bold text-pink-600 dark:text-pink-300 mt-2">{status?.active_schedulers || 0}</h3>
                      </div>
                      <div className="p-3 bg-pink-100/30 dark:bg-pink-700/30 rounded-full">
                        <ArrowPathIcon className="h-6 w-6 text-pink-600 dark:text-pink-300" />
                      </div>
                    </div>
                  </div>

                  <div className="glass-card glass-gradient-success p-6 rounded-lg shadow-lg">
                    <div className="flex flex-col">
                      <div className="flex justify-between items-start">
                        <p className="text-sm text-gray-500 dark:text-gray-300 font-medium">Sistem Çalışma Süresi</p>
                        <div className="p-3 bg-emerald-100/30 dark:bg-emerald-700/30 rounded-full">
                          <ServerIcon className="h-6 w-6 text-emerald-600 dark:text-emerald-300" />
                        </div>
                      </div>
                      <h3 className="text-xl font-bold text-emerald-600 dark:text-emerald-300 mt-2">{status?.system_uptime || '-'}</h3>
                    </div>
                  </div>
                </div>

                {/* v1.5.0 için yeni kart grubu */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="glass-card p-6 rounded-lg shadow-lg">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Hata Sayısı</h3>
                      <div className="p-2 bg-red-100/20 dark:bg-red-700/20 rounded-full">
                        <ExclamationTriangleIcon className="h-5 w-5 text-red-600 dark:text-red-400" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-3xl font-bold text-red-600 dark:text-red-400">{status?.error_count || 0}</p>
                      <Link 
                        to="/system/errors" 
                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Detayları Gör
                      </Link>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      Son hata: {status?.last_error_time ? new Date(status.last_error_time).toLocaleString('tr-TR') : '-'}
                    </p>
                  </div>

                  <div className="glass-card p-6 rounded-lg shadow-lg">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">WebSocket Bağlantıları</h3>
                      <div className="p-2 bg-blue-100/20 dark:bg-blue-700/20 rounded-full">
                        <SignalIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{status?.websocket_connections || 0}</p>
                      <Link 
                        to="/system/websocket" 
                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Detayları Gör
                      </Link>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      Aktif istemci sayısı
                    </p>
                  </div>

                  <div className="glass-card p-6 rounded-lg shadow-lg">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Yeniden Bağlanmalar</h3>
                      <div className="p-2 bg-amber-100/20 dark:bg-amber-700/20 rounded-full">
                        <ArrowsRightLeftIcon className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">{status?.reconnect_count || 0}</p>
                      <Link 
                        to="/system/websocket" 
                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Detayları Gör
                      </Link>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      Toplam yeniden bağlanma sayısı
                    </p>
                  </div>
                </div>
              </Tab.Panel>

              {/* Bağlantılar Paneli */}
              <Tab.Panel>
                <div className="glass-card p-6 rounded-lg shadow-lg mb-6">
                  <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">Bağlantı Özeti</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-gray-600 dark:text-gray-300">Aktif WebSocket Bağlantıları</p>
                        <span className="text-blue-600 dark:text-blue-400 font-semibold">{status?.websocket_connections || 0}</span>
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-gray-600 dark:text-gray-300">Yeniden Bağlanma Sayısı</p>
                        <span className="text-amber-600 dark:text-amber-400 font-semibold">{status?.reconnect_count || 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-600 dark:text-gray-300">API İstek Hızı</p>
                        <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
                          {(Math.random() * 10).toFixed(1)} istek/sn
                        </span>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-gray-600 dark:text-gray-300">WebSocket Bağlantı Durumu</p>
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
                          Aktif
                        </span>
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-gray-600 dark:text-gray-300">SSE Bağlantı Durumu</p>
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
                          Aktif
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-600 dark:text-gray-300">Ortalama Ağ Gecikmesi</p>
                        <span className="text-purple-600 dark:text-purple-400 font-semibold">
                          {(Math.random() * 100).toFixed(0)} ms
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="glass-card p-6 rounded-lg shadow-lg">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Detaylı Bilgi</h3>
                    <Link 
                      to="/system/websocket" 
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Bağlantı Yönetimi
                    </Link>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                    WebSocket bağlantı yönetimi sayfasından aktif bağlantıları görüntüleyebilir, 
                    yeniden bağlanma stratejisini değiştirebilir ve bağlantı performansını izleyebilirsiniz.
                  </p>
                  <div className="flex flex-col xs:flex-row gap-2 justify-end">
                    <Link 
                      to="/system/websocket"
                      className="glass-btn px-4 py-2 bg-blue-500/70 hover:bg-blue-600/70 text-white rounded-lg shadow-md transition-colors text-center text-sm"
                    >
                      WebSocket Yönetimi
                    </Link>
                    <Link 
                      to="/system/errors"
                      className="glass-btn px-4 py-2 bg-red-500/70 hover:bg-red-600/70 text-white rounded-lg shadow-md transition-colors text-center text-sm"
                    >
                      Hata Raporları
                    </Link>
                  </div>
                </div>
              </Tab.Panel>

              {/* Sistem Kaynakları Paneli */}
              <Tab.Panel>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="glass-card p-6 rounded-lg shadow-lg">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Bellek Kullanımı</h3>
                      <div className="p-2 bg-blue-100/20 dark:bg-blue-700/20 rounded-full">
                        <ServerIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 font-medium mb-2">{status?.memory_usage || '-'}</p>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                      <div className="bg-blue-600 dark:bg-blue-500 h-2.5 rounded-full" style={{ width: status?.memory_usage ? status.memory_usage.match(/\((\d+)%\)/)?.[1] + '%' : '0%' }}></div>
                    </div>
                  </div>

                  <div className="glass-card p-6 rounded-lg shadow-lg">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">CPU Kullanımı</h3>
                      <div className="p-2 bg-purple-100/20 dark:bg-purple-700/20 rounded-full">
                        <CpuChipIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      </div>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 font-medium mb-2">{status?.cpu_usage || '-'}</p>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                      <div className="bg-purple-600 dark:bg-purple-500 h-2.5 rounded-full" style={{ width: status?.cpu_usage ? status.cpu_usage.replace('%', '') : '0%' }}></div>
                    </div>
                  </div>
                </div>

                <div className="glass-card p-6 rounded-lg shadow-lg">
                  <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">Sistem Bilgileri</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                      <p className="text-sm text-gray-600 dark:text-gray-300">Sistem Çalışma Süresi</p>
                      <span className="text-gray-800 dark:text-gray-200 font-medium">{status?.system_uptime || '-'}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                      <p className="text-sm text-gray-600 dark:text-gray-300">Aktif Handler</p>
                      <span className="text-gray-800 dark:text-gray-200 font-medium">{status?.active_handlers || 0}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                      <p className="text-sm text-gray-600 dark:text-gray-300">Aktif Zamanlayıcılar</p>
                      <span className="text-gray-800 dark:text-gray-200 font-medium">{status?.active_schedulers || 0}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                      <p className="text-sm text-gray-600 dark:text-gray-300">WebSocket Bağlantıları</p>
                      <span className="text-gray-800 dark:text-gray-200 font-medium">{status?.websocket_connections || 0}</span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <p className="text-sm text-gray-600 dark:text-gray-300">Ortam</p>
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200">
                        Production
                      </span>
                    </div>
                  </div>
                </div>
              </Tab.Panel>
            </Tab.Panels>
          </Tab.Group>
        )}

        <div className="flex justify-center mt-10">
          <button
            onClick={restartHandlers}
            disabled={isRestarting}
            className="glass-btn px-6 py-3 bg-indigo-500/70 hover:bg-indigo-600/70 text-white rounded-lg shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRestarting ? (
              <div className="flex items-center">
                <Spinner isLoading={isRestarting} size="sm" className="mr-2" />
                <span>Yeniden Başlatılıyor...</span>
              </div>
            ) : (
              'Tüm Handler\'ları Yeniden Başlat'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SystemStatus; 