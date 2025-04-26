import React from 'react';
import { useScheduleHistory } from '../../hooks/useScheduler';
import { Button } from '../ui/button';

interface ScheduleHistoryProps {
  limit?: number;
}

const ScheduleHistory: React.FC<ScheduleHistoryProps> = ({ limit = 10 }) => {
  const { history, isLoading, error, refetch } = useScheduleHistory(limit);
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  };
  
  const calculateSuccess = (data: any[]) => {
    if (!data || data.length === 0) return '0%';
    
    const success = data.filter(item => item.status === 'success').length;
    return `${Math.round((success / data.length) * 100)}%`;
  };
  
  return (
    <div className="border rounded-lg p-6 bg-white dark:bg-gray-800">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Zamanlama Geçmişi</h2>
        <Button 
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isLoading}
        >
          {isLoading ? 'Yükleniyor...' : 'Yenile'}
        </Button>
      </div>
      
      {error && (
        <div className="p-3 mb-4 bg-red-100 text-red-700 rounded-lg dark:bg-red-900/30 dark:text-red-400">
          Geçmiş yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.
        </div>
      )}
      
      {isLoading ? (
        <div className="flex justify-center items-center p-10">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
        </div>
      ) : history.length > 0 ? (
        <div>
          <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-500 mb-1">İşlemler</div>
                <div className="font-medium">{history.length} işlem</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">Başarı Oranı</div>
                <div className="font-medium">{calculateSuccess(history)}</div>
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tarih
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Şablon
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Grup
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Durum
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {history.map((item: any) => (
                  <tr key={item.id}>
                    <td className="px-4 py-2 whitespace-nowrap text-sm">
                      {formatDate(item.timestamp)}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm">
                      {item.template_title || item.template_id}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm">
                      {item.group_name || item.group_id}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm">
                      <span 
                        className={`px-2 py-1 rounded-full text-xs ${
                          item.status === 'success' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        }`}
                      >
                        {item.status === 'success' ? 'Başarılı' : 'Başarısız'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-10 text-gray-500">
          <p>Henüz zamanlanmış mesaj geçmişi bulunmuyor.</p>
        </div>
      )}
    </div>
  );
};

export default ScheduleHistory; 