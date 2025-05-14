import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { systemService, DashboardStats } from '../services/systemService';
import { logService } from '../services/logService';
import GlassCard from '../components/ui/GlassCard';
import Spinner from '../components/ui/Spinner';
import { ChartBarIcon, UsersIcon, UserGroupIcon, DocumentTextIcon, ServerIcon, ClockIcon } from '@heroicons/react/24/outline';

const Statistics: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      logService.info('Statistics', 'İstatistikler getiriliyor');
      
      const data = await systemService.getDashboardStats();
      setStats(data);
      
      logService.success('Statistics', 'İstatistikler başarıyla getirildi', data);
    } catch (error) {
      console.error('İstatistikler alınırken hata oluştu:', error);
      logService.error('Statistics', 'İstatistikler alınırken hata oluştu', { error });
      toast.error('İstatistikler alınamadı. Lütfen daha sonra tekrar deneyin.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (refreshing) return;
    
    try {
      setRefreshing(true);
      logService.info('Statistics', 'İstatistikler yenileniyor');
      
      const data = await systemService.getDashboardStats();
      setStats(data);
      
      toast.success('İstatistikler güncellendi');
      logService.success('Statistics', 'İstatistikler başarıyla yenilendi', data);
    } catch (error) {
      console.error('İstatistikler yenilenirken hata oluştu:', error);
      logService.error('Statistics', 'İstatistikler yenilenirken hata oluştu', { error });
      toast.error('İstatistikler yenilenirken hata oluştu');
    } finally {
      setRefreshing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner isLoading={true} size="xl" variant="glassEffect" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white flex items-center">
          <ChartBarIcon className="w-8 h-8 mr-2 text-[#3f51b5]" />
          İstatistikler
        </h1>
        
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className={`px-4 py-2 rounded-lg bg-[#3f51b5] text-white hover:bg-[#303f9f] transition-all flex items-center ${
            refreshing ? 'opacity-70 cursor-not-allowed' : ''
          }`}
        >
          {refreshing ? (
            <>
              <Spinner size="sm" color="white" isLoading={true} className="mr-2" />
              Yenileniyor...
            </>
          ) : (
            <>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Yenile
            </>
          )}
        </button>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Aktif Kullanıcılar */}
          <GlassCard className="glass-gradient-tertiary">
            <div className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-1">Aktif Kullanıcılar</h3>
                  <p className="text-3xl font-bold text-[#3f51b5] dark:text-[#5c6bc0]">{stats.active_users}</p>
                </div>
                <div className="p-3 bg-[#3f51b5]/10 rounded-full">
                  <UsersIcon className="w-8 h-8 text-[#3f51b5]" />
                </div>
              </div>
              <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">
                Son 24 saatte aktif kullanıcı sayısı
              </p>
            </div>
          </GlassCard>
          
          {/* Aktif Gruplar */}
          <GlassCard className="glass-gradient-tertiary">
            <div className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-1">Aktif Gruplar</h3>
                  <p className="text-3xl font-bold text-[#3f51b5] dark:text-[#5c6bc0]">{stats.active_groups}</p>
                </div>
                <div className="p-3 bg-[#3f51b5]/10 rounded-full">
                  <UserGroupIcon className="w-8 h-8 text-[#3f51b5]" />
                </div>
              </div>
              <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">
                Toplam aktif grup sayısı
              </p>
            </div>
          </GlassCard>
          
          {/* Gönderilen Mesajlar */}
          <GlassCard className="glass-gradient-tertiary">
            <div className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-1">Bugün Gönderilen Mesajlar</h3>
                  <p className="text-3xl font-bold text-[#3f51b5] dark:text-[#5c6bc0]">{stats.messages_sent_today}</p>
                </div>
                <div className="p-3 bg-[#3f51b5]/10 rounded-full">
                  <svg className="w-8 h-8 text-[#3f51b5]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
              </div>
              <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">
                Bugün gönderilen toplam mesaj sayısı
              </p>
            </div>
          </GlassCard>
          
          {/* Aktif Handler'lar */}
          <GlassCard className="glass-gradient-tertiary">
            <div className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-1">Aktif Handler'lar</h3>
                  <p className="text-3xl font-bold text-[#3f51b5] dark:text-[#5c6bc0]">{stats.active_handlers}</p>
                </div>
                <div className="p-3 bg-[#3f51b5]/10 rounded-full">
                  <ServerIcon className="w-8 h-8 text-[#3f51b5]" />
                </div>
              </div>
              <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">
                Aktif çalışan mesaj işleyici sayısı
              </p>
            </div>
          </GlassCard>
          
          {/* Aktif Zamanlayıcılar */}
          <GlassCard className="glass-gradient-tertiary">
            <div className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-1">Aktif Zamanlayıcılar</h3>
                  <p className="text-3xl font-bold text-[#3f51b5] dark:text-[#5c6bc0]">{stats.active_schedulers}</p>
                </div>
                <div className="p-3 bg-[#3f51b5]/10 rounded-full">
                  <ClockIcon className="w-8 h-8 text-[#3f51b5]" />
                </div>
              </div>
              <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">
                Çalışan zamanlayıcı sayısı
              </p>
            </div>
          </GlassCard>
          
          {/* Toplam Şablonlar */}
          <GlassCard className="glass-gradient-tertiary">
            <div className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-1">Toplam Şablonlar</h3>
                  <p className="text-3xl font-bold text-[#3f51b5] dark:text-[#5c6bc0]">{stats.total_templates}</p>
                </div>
                <div className="p-3 bg-[#3f51b5]/10 rounded-full">
                  <DocumentTextIcon className="w-8 h-8 text-[#3f51b5]" />
                </div>
              </div>
              <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">
                Kayıtlı mesaj şablonu sayısı
              </p>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
};

export default Statistics; 