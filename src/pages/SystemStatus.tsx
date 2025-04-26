import React, { useState, useEffect } from 'react';
import { ChartBarIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';
import { systemService, SystemStatus as SystemStatusType } from '../services/systemService';

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
      <div className="container mx-auto max-w-3xl py-8">
        <div className="glass-card p-6 rounded-xl shadow-lg">
          <div className="text-center py-8">
            <h1 className="text-2xl font-bold text-red-500 mb-4">Yetkisiz Erişim</h1>
            <p className="text-gray-600 dark:text-gray-300">
              Bu sayfaya erişmek için admin yetkisine sahip olmalısınız.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-5xl">
      <div className="glass-card p-6 rounded-xl shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Sistem Durumu</h1>
          <button
            onClick={fetchSystemStatus}
            className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            title="Yenile"
          >
            <ArrowPathIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        {isLoading && !status ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#3f51b5]"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <div className="glass-card bg-gradient-to-br from-[#3f51b5]/10 to-[#3f51b5]/5 p-4 rounded-lg shadow">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Aktif Handler</p>
                    <h3 className="text-3xl font-bold text-[#3f51b5]">{status?.active_handlers || 0}</h3>
                  </div>
                  <div className="p-2 bg-[#3f51b5]/10 rounded-full">
                    <ChartBarIcon className="h-6 w-6 text-[#3f51b5]" />
                  </div>
                </div>
              </div>

              <div className="glass-card bg-gradient-to-br from-[#f50057]/10 to-[#f50057]/5 p-4 rounded-lg shadow">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Aktif Zamanlayıcılar</p>
                    <h3 className="text-3xl font-bold text-[#f50057]">{status?.active_schedulers || 0}</h3>
                  </div>
                  <div className="p-2 bg-[#f50057]/10 rounded-full">
                    <ArrowPathIcon className="h-6 w-6 text-[#f50057]" />
                  </div>
                </div>
              </div>

              <div className="glass-card bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-700 dark:to-gray-800 p-4 rounded-lg shadow">
                <div className="flex flex-col">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Sistem Çalışma Süresi</p>
                  <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200">{status?.system_uptime || '-'}</h3>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="glass-card bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-2 text-gray-700 dark:text-gray-200">Bellek Kullanımı</h3>
                <p className="text-gray-600 dark:text-gray-300">{status?.memory_usage || '-'}</p>
              </div>

              <div className="glass-card bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-2 text-gray-700 dark:text-gray-200">CPU Kullanımı</h3>
                <p className="text-gray-600 dark:text-gray-300">{status?.cpu_usage || '-'}</p>
              </div>
            </div>

            <div className="flex justify-center mt-8">
              <button
                onClick={restartHandlers}
                disabled={isRestarting}
                className="px-6 py-3 bg-[#3f51b5] hover:bg-[#303f9f] text-white rounded-lg shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRestarting ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
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