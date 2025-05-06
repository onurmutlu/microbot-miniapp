import React, { useState, useEffect } from 'react';
import { SchedulerControlPanel, ScheduleHistory, TemplateScheduleSettings } from '../components/scheduler';
import api from '../utils/api';
import { handleApiError } from '../utils/toast';

interface Template {
  id: string;
  title: string;
  content: string;
  is_active: boolean;
  interval_minutes?: number;
}

const SchedulerPage: React.FC = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const res = await api.get('/message-templates');
      setTemplates(res.data);
      setLoading(false);
    } catch (error) {
      console.error('Mesaj şablonları alınırken hata:', error);
      handleApiError(error, 'Mesaj şablonları alınırken hata oluştu');
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchTemplates();
  }, []);
  
  return (
    <div className="p-4 space-y-6">
      <h1 className="text-xl font-bold">⏱️ Zamanlanmış Mesaj Yönetimi</h1>
      
      <p className="text-gray-600 dark:text-gray-300 mb-6">
        Bu sayfadan otomatik mesaj gönderimini planlayabilir, aktif şablonların gönderim aralıklarını belirleyebilir ve geçmiş gönderileri inceleyebilirsiniz.
      </p>
      
      <SchedulerControlPanel />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <h2 className="text-lg font-semibold mb-2">Şablon Zamanlama Ayarları</h2>
          
          {loading ? (
            <div className="flex justify-center items-center p-10 border rounded-lg bg-white dark:bg-gray-800">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
            </div>
          ) : templates.length > 0 ? (
            <div className="space-y-4">
              {templates.map(template => (
                <TemplateScheduleSettings 
                  key={template.id}
                  template={template}
                  onUpdate={fetchTemplates}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-10 border rounded-lg bg-white dark:bg-gray-800">
              <p>Henüz hiç mesaj şablonu yok.</p>
              <p className="text-sm text-gray-500 mt-2">
                Önce "Mesaj Şablonları" sayfasından şablonlar eklemelisiniz.
              </p>
            </div>
          )}
        </div>
        
        <div>
          <h2 className="text-lg font-semibold mb-2">Son Gönderimler</h2>
          <ScheduleHistory limit={5} />
        </div>
      </div>
    </div>
  );
};

export default SchedulerPage; 