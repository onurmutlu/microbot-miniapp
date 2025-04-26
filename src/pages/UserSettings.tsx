import React, { useState, useEffect } from 'react';
import { Switch } from '@headlessui/react';
import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';
import { settingsService, AutoStartSettings } from '../services/settingsService';

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
    <div className="container mx-auto max-w-3xl">
      <div className="glass-card p-6 rounded-xl shadow-lg">
        <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Kullanıcı Ayarları</h1>

        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-200">Otomatik Başlatma Ayarları</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <div className="flex items-center">
                    <span className="text-gray-700 dark:text-gray-200">Telegram botlarını otomatik başlat</span>
                    <div className="relative ml-2 group">
                      <QuestionMarkCircleIcon className="h-5 w-5 text-gray-400 cursor-help" />
                      <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-2 bg-gray-800 text-white text-sm rounded shadow-lg">
                        Sunucu yeniden başladığında Telegram botlarının otomatik olarak çalıştırılmasını sağlar.
                      </div>
                    </div>
                  </div>
                  <Switch
                    checked={settings.auto_start_bots}
                    onChange={() => handleToggle('auto_start_bots')}
                    className={`${
                      settings.auto_start_bots ? 'bg-[#3f51b5]' : 'bg-gray-300 dark:bg-gray-600'
                    } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#3f51b5] focus:ring-offset-2`}
                  >
                    <span
                      className={`${
                        settings.auto_start_bots ? 'translate-x-6' : 'translate-x-1'
                      } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                    />
                  </Switch>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <div className="flex items-center">
                    <span className="text-gray-700 dark:text-gray-200">Zamanlanmış görevleri otomatik başlat</span>
                    <div className="relative ml-2 group">
                      <QuestionMarkCircleIcon className="h-5 w-5 text-gray-400 cursor-help" />
                      <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-2 bg-gray-800 text-white text-sm rounded shadow-lg">
                        Sunucu yeniden başladığında zamanlanmış görevlerin otomatik olarak başlatılmasını sağlar.
                      </div>
                    </div>
                  </div>
                  <Switch
                    checked={settings.auto_start_scheduling}
                    onChange={() => handleToggle('auto_start_scheduling')}
                    className={`${
                      settings.auto_start_scheduling ? 'bg-[#3f51b5]' : 'bg-gray-300 dark:bg-gray-600'
                    } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#3f51b5] focus:ring-offset-2`}
                  >
                    <span
                      className={`${
                        settings.auto_start_scheduling ? 'translate-x-6' : 'translate-x-1'
                      } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                    />
                  </Switch>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={saveSettings}
                disabled={isSaving}
                className="px-4 py-2 bg-[#3f51b5] hover:bg-[#303f9f] text-white rounded-lg shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default UserSettings; 