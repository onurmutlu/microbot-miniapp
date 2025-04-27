import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { UsersIcon, ServerIcon, ClockIcon, BoltIcon } from '@heroicons/react/24/outline';
import { systemService, DashboardStats } from '../services/systemService';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchDashboardStats();
    const interval = setInterval(fetchDashboardStats, 60000); // Her dakika yenile
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setIsLoading(true);
      const data = await systemService.getDashboardStats();
      setStats(data);
    } catch (error) {
      console.error('Dashboard istatistikleri yüklenirken hata oluştu:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto animate-fade-in">
      <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white glass-gradient">Kontrol Paneli</h1>

      {isLoading && !stats ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#3f51b5]"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Sistem Durumu Kartı */}
          <div className="glass-card glass-gradient-primary p-5 rounded-xl">
            <div className="mb-4 flex justify-between items-start">
              <h2 className="text-lg font-semibold text-gray-700 dark:text-white">Sistem Durumu</h2>
              <div className="p-2 bg-[#3f51b5]/10 rounded-full inner-glass-shadow">
                <ServerIcon className="h-5 w-5 text-[#3f51b5]" />
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Aktif Handler</p>
                <h3 className="text-2xl font-bold text-[#3f51b5]">{stats?.active_handlers || 0}</h3>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Aktif Zamanlayıcılar</p>
                <h3 className="text-2xl font-bold text-[#f50057]">{stats?.active_schedulers || 0}</h3>
              </div>
            </div>
            <div className="mt-4 text-right">
              <Link 
                to="/system-status" 
                className="glass-btn text-[#3f51b5] px-3 py-1 inline-block"
              >
                Detayları Görüntüle →
              </Link>
            </div>
          </div>

          {/* Kullanıcı İstatistikleri */}
          <div className="glass-card glass-gradient-secondary p-5 rounded-xl">
            <div className="mb-4 flex justify-between items-start">
              <h2 className="text-lg font-semibold text-gray-700 dark:text-white">Kullanıcı İstatistikleri</h2>
              <div className="p-2 bg-[#f50057]/10 rounded-full inner-glass-shadow">
                <UsersIcon className="h-5 w-5 text-[#f50057]" />
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Aktif Kullanıcılar</p>
              <h3 className="text-2xl font-bold text-[#f50057]">{stats?.active_users || 0}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">Aktif Gruplar</p>
              <h3 className="text-2xl font-bold text-[#f50057]">{stats?.active_groups || 0}</h3>
            </div>
            <div className="mt-4 text-right">
              <Link 
                to="/group-list" 
                className="glass-btn text-[#f50057] px-3 py-1 inline-block"
              >
                Grupları Yönet →
              </Link>
            </div>
          </div>

          {/* Mesaj İstatistikleri */}
          <div className="glass-card glass-gradient-success p-5 rounded-xl">
            <div className="mb-4 flex justify-between items-start">
              <h2 className="text-lg font-semibold text-gray-700 dark:text-white">Mesaj İstatistikleri</h2>
              <div className="p-2 bg-gray-100/30 dark:bg-gray-700/30 rounded-full inner-glass-shadow">
                <BoltIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Bugün Gönderilen Mesajlar</p>
              <h3 className="text-2xl font-bold text-gray-700 dark:text-white">{stats?.messages_sent_today || 0}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">Toplam Şablonlar</p>
              <h3 className="text-2xl font-bold text-gray-700 dark:text-white">{stats?.total_templates || 0}</h3>
            </div>
            <div className="mt-4 text-right">
              <Link 
                to="/message-templates" 
                className="glass-btn text-gray-600 dark:text-gray-300 px-3 py-1 inline-block"
              >
                Şablonları Yönet →
              </Link>
            </div>
          </div>

          {/* Hızlı Erişim */}
          <div className="glass-card p-5 rounded-xl">
            <div className="mb-4 flex justify-between items-start">
              <h2 className="text-lg font-semibold text-gray-700 dark:text-white">Hızlı Erişim</h2>
              <div className="p-2 bg-gray-100/30 dark:bg-gray-700/30 rounded-full inner-glass-shadow">
                <ClockIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              </div>
            </div>
            <div className="space-y-3">
              <Link 
                to="/message-send" 
                className="block p-3 glass-card hover:scale-[1.02] transition-all"
              >
                <p className="font-medium text-gray-700 dark:text-white">Mesaj Gönder</p>
              </Link>
              <Link 
                to="/scheduler" 
                className="block p-3 glass-card hover:scale-[1.02] transition-all"
              >
                <p className="font-medium text-gray-700 dark:text-white">Zamanlayıcı</p>
              </Link>
              <Link 
                to="/settings" 
                className="block p-3 glass-card hover:scale-[1.02] transition-all"
              >
                <p className="font-medium text-gray-700 dark:text-white">Ayarlar</p>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard; 