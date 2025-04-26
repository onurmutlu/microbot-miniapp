import React from 'react';
import { useSchedulerStatus, useStartScheduler, useStopScheduler } from '../../hooks/useScheduler';
import { Button } from '../ui/button';

const SchedulerControlPanel: React.FC = () => {
  const { status, isLoading: statusLoading, refetch } = useSchedulerStatus();
  const { startScheduler, isLoading: startLoading } = useStartScheduler();
  const { stopScheduler, isLoading: stopLoading } = useStopScheduler();
  
  const handleStart = async () => {
    const success = await startScheduler();
    if (success) {
      refetch();
    }
  };
  
  const handleStop = async () => {
    const success = await stopScheduler();
    if (success) {
      refetch();
    }
  };
  
  return (
    <div className="border rounded-lg p-6 bg-white dark:bg-gray-800">
      <h2 className="text-xl font-semibold mb-4">Zamanlanmış Mesaj Kontrolü</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Durum</div>
          {statusLoading ? (
            <div className="animate-pulse h-5 w-16 bg-gray-200 dark:bg-gray-600 rounded"></div>
          ) : (
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-2 ${status?.is_running ? 'bg-green-500' : 'bg-gray-400'}`}></div>
              <span className="font-medium">{status?.is_running ? 'Çalışıyor' : 'Durdu'}</span>
            </div>
          )}
        </div>
        
        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Son 24 Saat</div>
          {statusLoading ? (
            <div className="animate-pulse h-5 w-16 bg-gray-200 dark:bg-gray-600 rounded"></div>
          ) : (
            <div className="font-medium">
              {status?.messages_last_24h || 0} mesaj
            </div>
          )}
        </div>
        
        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Aktif Şablonlar</div>
          {statusLoading ? (
            <div className="animate-pulse h-5 w-16 bg-gray-200 dark:bg-gray-600 rounded"></div>
          ) : (
            <div className="font-medium">
              {status?.active_templates || 0} şablon
            </div>
          )}
        </div>
      </div>
      
      <div className="flex gap-4">
        <Button
          onClick={handleStart}
          disabled={!!status?.is_running || startLoading || stopLoading || statusLoading}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white"
        >
          {startLoading ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Başlatılıyor...
            </span>
          ) : (
            'Başlat'
          )}
        </Button>
        
        <Button
          onClick={handleStop}
          disabled={!status?.is_running || startLoading || stopLoading || statusLoading}
          className="flex-1 bg-red-600 hover:bg-red-700 text-white"
        >
          {stopLoading ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Durduruluyor...
            </span>
          ) : (
            'Durdur'
          )}
        </Button>
      </div>
    </div>
  );
};

export default SchedulerControlPanel; 