import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { UsersIcon, ServerIcon, ClockIcon, BoltIcon, ArrowPathIcon, UserGroupIcon, ChatBubbleLeftRightIcon, DocumentTextIcon, ArrowTrendingUpIcon } from '@heroicons/react/24/outline';
import { systemService, DashboardStats } from '../services/systemService';
import Spinner from '../components/ui/Spinner';
import { logoutUser } from '../utils/logout';
import { getTestMode } from '../utils/testMode';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardStats();
    const interval = setInterval(fetchDashboardStats, 60000); // Her dakika yenile
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Simülasyon amaçlı loading durumu
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, []);

  const fetchDashboardStats = async () => {
    try {
      // Hata durumunu sıfırla
      setApiError(null);
      
      const data = await systemService.getDashboardStats();
      setStats(data);
    } catch (error: any) {
      console.error('Dashboard istatistikleri yüklenirken hata oluştu:', error);
      
      // Test modunda hataları görmezden gel, mock veriler kullan
      if (getTestMode()) {
        console.log('Test modu: Mock dashboard verileri kullanılıyor');
        setStats({
          active_users: 156,
          active_handlers: 12,
          active_schedulers: 5,
          messages_sent_today: 1250,
          active_groups: 34,
          total_templates: 87
        });
        return;
      }
      
      // Kimlik doğrulama hatası kontrolü
      if (error?.response?.status === 401) {
        setApiError('Oturum süresi doldu. Lütfen tekrar giriş yapın.');
      } else {
        setApiError('Dashboard verileri yüklenirken bir hata oluştu.');
      }
    }
  };

  // Logout işlemi
  const handleLogout = () => {
    logoutUser();
  };

  return (
    <div className="container mx-auto px-4 py-8 animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold glass-gradient">MicroBot Kontrol Paneli</h1>
        
        {/* Logout Butonu */}
        <button 
          onClick={handleLogout}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-md transition-colors"
        >
          Çıkış Yap
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Spinner isLoading={isLoading} size="xl" variant="glassEffect" />
        </div>
      ) : apiError ? (
        <div className="p-6 glass-card bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl text-center">
          <div className="text-red-600 dark:text-red-400 mb-4 text-xl">{apiError}</div>
          <button 
            onClick={fetchDashboardStats} 
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center gap-2 mx-auto"
          >
            <ArrowPathIcon className="w-5 h-5" />
            Yeniden Dene
          </button>
        </div>
      ) : (
        <>
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
        </>
      )}
    </div>
  );
};

export default Dashboard; 