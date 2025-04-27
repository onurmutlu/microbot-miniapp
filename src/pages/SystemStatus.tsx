import React, { useState, useEffect } from 'react';
import { ChartBarIcon, ArrowPathIcon, CpuChipIcon, ServerIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';
import { systemService, SystemStatus as SystemStatusType } from '../services/systemService';
import { Spinner } from '../components/ui/Spinner';

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
          <button
            onClick={fetchSystemStatus}
            className="glass-btn p-2 rounded-full hover:bg-indigo-100/30 dark:hover:bg-indigo-700/30 transition-colors"
            title="Yenile"
          >
            <ArrowPathIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-300" />
          </button>
        </div>

        {isLoading && !status ? (
          <div className="flex justify-center items-center py-16">
            <Spinner isLoading={true} size="xl" variant="glassEffect" />
          </div>
        ) : (
          <>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="glass-card p-6 rounded-lg shadow-lg">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Bellek Kullanımı</h3>
                  <div className="p-2 bg-blue-100/20 dark:bg-blue-700/20 rounded-full">
                    <ServerIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-300 font-medium">{status?.memory_usage || '-'}</p>
              </div>

              <div className="glass-card p-6 rounded-lg shadow-lg">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">CPU Kullanımı</h3>
                  <div className="p-2 bg-purple-100/20 dark:bg-purple-700/20 rounded-full">
                    <CpuChipIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-300 font-medium">{status?.cpu_usage || '-'}</p>
              </div>
            </div>

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
          </>
        )}
      </div>
    </div>
  );
};

export default SystemStatus; 