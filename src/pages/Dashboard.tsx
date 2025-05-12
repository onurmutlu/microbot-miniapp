import React, { useEffect } from 'react';
import DashboardPage from '../components/Dashboard/DashboardPage';
import { toast } from 'react-toastify';
import useOfflineMode from '../hooks/useOfflineMode';
import { RequestType } from '../utils/offlineManager';

// Dashboard verilerinin tipi
interface DashboardData {
  activeGroupCount?: number;
  messageCount?: number;
  userCount?: number;
  last24hMessages?: number;
  groups?: any[];
}

const Dashboard: React.FC = () => {
  const { fetchWithOfflineSupport } = useOfflineMode();
  
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        // API URL'ini oluştur
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
        
        // offlineManager ile veri yükle (offline durumu destekleyen)
        const result = await fetchWithOfflineSupport<DashboardData>(
          `${apiUrl}/dashboard/stats`,
          {
            method: RequestType.GET,
            offlineOptions: {
              cacheDuration: 30 * 60 * 1000, // 30 dakika önbellek
              fallbackData: {
                // Dashboard için varsayılan veriler
                activeGroupCount: Number(localStorage.getItem('dashboard_active_groups')) || 0,
                messageCount: Number(localStorage.getItem('dashboard_message_count')) || 0,
                userCount: Number(localStorage.getItem('dashboard_user_count')) || 0,
                last24hMessages: Number(localStorage.getItem('dashboard_last24h')) || 0,
                // Diğer istatistikler...
                groups: JSON.parse(localStorage.getItem('dashboard_groups') || '[]')
              }
            }
          }
        );
        
        // Başarılı veriyi localStorage'a da kaydet (offline mod için)
        if (result) {
          if (result.activeGroupCount !== undefined) {
            localStorage.setItem('dashboard_active_groups', String(result.activeGroupCount));
          }
          if (result.messageCount !== undefined) {
            localStorage.setItem('dashboard_message_count', String(result.messageCount));
          }
          if (result.userCount !== undefined) {
            localStorage.setItem('dashboard_user_count', String(result.userCount));
          }
          if (result.last24hMessages !== undefined) {
            localStorage.setItem('dashboard_last24h', String(result.last24hMessages));
          }
          if (result.groups) {
            localStorage.setItem('dashboard_groups', JSON.stringify(result.groups));
          }
        }
      } catch (error: unknown) {
        console.error("Dashboard verileri yüklenemedi:", error);
        // Offline mod devreye girdiğinde veya fallback veriler kullanıldığında
        // kullanıcıya bilgi ver ama hata mesajı gösterme
        if (error instanceof Error && !error.message.includes('Çevrimdışı:')) {
          toast.error("Dashboard verileri yüklenemedi, tekrar deneyin");
        }
      }
    };
    
    loadDashboardData();
  }, [fetchWithOfflineSupport]);
  
  return (
    <div className="dashboard-container">
      <DashboardPage />
    </div>
  );
};

export default Dashboard; 