import React, { useState, useEffect } from 'react';
import { QuestionMarkCircleIcon, ClockIcon, BoltIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';
import { settingsService, AutoStartSettings } from '../services/settingsService';
import GlassCard from '../components/ui/GlassCard';
import { Toggle, Button } from '../components/ui/FormElements';

const UserSettings: React.FC = () => {
  const [settings, setSettings] = useState<AutoStartSettings>({
    auto_start_bots: true,
    auto_start_scheduling: false
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  useEffect(() => {
    fetchSettings();
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
          <GlassCard className="mb-6" variant="primary">
            <div className="p-1">
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