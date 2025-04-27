import React, { useState, useEffect } from 'react';
import { QuestionMarkCircleIcon, ClockIcon, BoltIcon, ArrowPathIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';
import { settingsService, AutoStartSettings } from '../services/settingsService';
import GlassCard from '../components/ui/GlassCard';
import { Toggle, Button } from '../components/ui/FormElements';
import SessionManager from '../components/session/SessionManager';

const UserSettings: React.FC = () => {
  const [settings, setSettings] = useState<AutoStartSettings>({
    auto_start_bots: true,
    auto_start_scheduling: false
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [showSessionManager, setShowSessionManager] = useState<boolean>(false);
  const [hasActiveSession, setHasActiveSession] = useState<boolean>(false);

  useEffect(() => {
    fetchSettings();
    checkActiveSession();
  }, []);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const data = await settingsService.getAutoStartSettings();
      setSettings(data);
    } catch (error) {
      console.error('Ayarlar yüklenirken hata oluştu:', error);
      toast.error('Ayarlar yüklenirken hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const checkActiveSession = async () => {
    try {
      // API'den aktif oturum kontrolü yapılır
      // Bu örnek için varsayılan olarak false atadık
      // Gerçek uygulamada bu değer API'den gelmelidir
      setHasActiveSession(localStorage.getItem('telegram_session') !== null);
    } catch (error) {
      console.error('Oturum durumu kontrol edilirken hata oluştu:', error);
    }
  };

  const saveSettings = async () => {
    try {
      setIsSaving(true);
      await settingsService.updateAutoStartSettings(settings);
      toast.success('Ayarlar başarıyla kaydedildi');
    } catch (error) {
      console.error('Ayarlar kaydedilirken hata oluştu:', error);
      toast.error('Ayarlar kaydedilirken hata oluştu');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = (key: keyof AutoStartSettings) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleTerminateSession = async () => {
    try {
      setIsLoading(true);
      // API'ye oturumu sonlandırma isteği gönderilebilir
      // await api.post('/terminate-session');
      
      // localStorage'dan oturum bilgilerini temizle
      localStorage.removeItem('telegram_session');
      
      toast.success('Telegram oturumu sonlandırıldı');
      setHasActiveSession(false);
    } catch (error) {
      console.error('Oturum sonlandırılırken hata oluştu:', error);
      toast.error('Oturum sonlandırılırken hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSessionStarted = () => {
    setShowSessionManager(false);
    setHasActiveSession(true);
    checkActiveSession();
  };

  if (showSessionManager) {
    return <SessionManager onSessionStarted={handleSessionStarted} />;
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 animate-fade-in">
      <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white flex items-center">
        <ClockIcon className="w-6 h-6 mr-2 text-[#3f51b5]" />
        Kullanıcı Ayarları
      </h1>

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#3f51b5]"></div>
        </div>
      ) : (
        <>
          {/* Telegram Oturum Yönetimi */}
          <GlassCard className="mb-6" variant={hasActiveSession ? "success" : "secondary"}>
            <div className="p-5">
              <div className="flex items-center mb-4">
                <ShieldCheckIcon className="w-5 h-5 mr-2 text-[#3f51b5]" /> 
                <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200">Telegram Oturum Yönetimi</h2>
              </div>
              
              <div className="bg-white/30 dark:bg-gray-800/30 rounded-lg p-4 backdrop-blur-sm border border-gray-100 dark:border-gray-700">
                {hasActiveSession ? (
                  <div>
                    <div className="flex items-center mb-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                      <span className="font-medium text-gray-800 dark:text-white">Aktif Oturum</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                      Telegram oturumunuz aktif durumda. Bot bağlantısı sağlanıyor.
                    </p>
                    <Button
                      variant="danger"
                      onClick={handleTerminateSession}
                      disabled={isLoading}
                      isLoading={isLoading}
                      size="sm"
                    >
                      Oturumu Sonlandır
                    </Button>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center mb-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                      <span className="font-medium text-gray-800 dark:text-white">Oturum Yok</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                      Bot ile iletişim için Telegram oturumu başlatmanız gerekiyor.
                    </p>
                    <Button
                      variant="primary"
                      onClick={() => setShowSessionManager(true)}
                      size="sm"
                    >
                      Telegram Oturumu Başlat
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </GlassCard>

          <GlassCard className="mb-6" variant="primary">
            <div className="p-5">
              <div className="flex items-center mb-4">
                <BoltIcon className="w-5 h-5 mr-2 text-[#3f51b5]" /> 
                <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200">Otomatik Başlatma Ayarları</h2>
              </div>
              
              <div className="space-y-5">
                <div className="p-4 backdrop-blur-sm bg-white/30 dark:bg-gray-800/30 rounded-lg border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center mb-1.5">
                        <span className="font-medium text-gray-700 dark:text-gray-200">Telegram botlarını otomatik başlat</span>
                        <div className="relative ml-2 group">
                          <QuestionMarkCircleIcon className="h-4 w-4 text-gray-400 cursor-help" />
                          <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-2 glass-dialog text-white text-sm rounded shadow-lg z-10">
                            Sunucu yeniden başladığında Telegram botlarının otomatik olarak çalıştırılmasını sağlar.
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Sunucu her başladığında botlar otomatik olarak çalıştırılır</p>
                    </div>
                    <div>
                      <Toggle 
                        checked={settings.auto_start_bots}
                        onChange={() => handleToggle('auto_start_bots')}
                      />
                    </div>
                  </div>
                </div>

                <div className="p-4 backdrop-blur-sm bg-white/30 dark:bg-gray-800/30 rounded-lg border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center mb-1.5">
                        <span className="font-medium text-gray-700 dark:text-gray-200">Zamanlanmış görevleri otomatik başlat</span>
                        <div className="relative ml-2 group">
                          <QuestionMarkCircleIcon className="h-4 w-4 text-gray-400 cursor-help" />
                          <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-2 glass-dialog text-white text-sm rounded shadow-lg z-10">
                            Sunucu yeniden başladığında zamanlanmış görevlerin otomatik olarak başlatılmasını sağlar.
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Sunucu yeniden başladığında tüm zamanlayıcılar otomatik olarak etkinleştirilir</p>
                    </div>
                    <div>
                      <Toggle
                        checked={settings.auto_start_scheduling}
                        onChange={() => handleToggle('auto_start_scheduling')}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>

          <div className="flex justify-end">
            <Button
              onClick={saveSettings}
              disabled={isSaving}
              isLoading={isSaving}
              variant="primary"
              icon={<ArrowPathIcon className="w-4 h-4" />}
            >
              {isSaving ? 'Kaydediliyor...' : 'Ayarları Kaydet'}
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default UserSettings; 