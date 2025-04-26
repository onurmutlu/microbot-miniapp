import React, { useState } from 'react';
import { useTemplateSchedule } from '../../hooks/useScheduler';
import { Button } from '../ui/button';
import TemplateScheduler from './TemplateScheduler';

interface Template {
  id: string;
  title: string;
  content: string;
  is_active: boolean;
  interval_minutes?: number;
  cron_expression?: string | null;
}

interface TemplateScheduleSettingsProps {
  template: Template;
  onUpdate?: () => void;
}

const TemplateScheduleSettings: React.FC<TemplateScheduleSettingsProps> = ({ template, onUpdate }) => {
  const { updateTemplateSchedule, isLoading } = useTemplateSchedule();
  const [showPreview, setShowPreview] = useState(false);
  const [scheduleData, setScheduleData] = useState({
    interval_minutes: template.interval_minutes || 60,
    cron_expression: template.cron_expression || null
  });
  
  const handleScheduleUpdate = (data: { interval_minutes: number; cron_expression: string | null }) => {
    setScheduleData(data);
  };
  
  const handleSubmit = async () => {
    const success = await updateTemplateSchedule({
      template_id: template.id,
      interval_minutes: scheduleData.interval_minutes,
      cron_expression: scheduleData.cron_expression,
      is_active: template.is_active
    });
    
    if (success && onUpdate) {
      onUpdate();
    }
  };
  
  return (
    <div className="border rounded-lg p-4 bg-white dark:bg-gray-800">
      <h3 className="font-medium text-lg mb-3">{template.title}</h3>
      
      <div className="mb-4">
        <TemplateScheduler
          initialIntervalMinutes={template.interval_minutes}
          initialCronExpression={template.cron_expression}
          onUpdate={handleScheduleUpdate}
        />
      </div>
      
      <div className="flex items-center gap-3 mb-4">
        <Button 
          onClick={handleSubmit} 
          disabled={isLoading}
        >
          {isLoading ? 'Güncelleniyor...' : 'Güncelle'}
        </Button>
        
        <Button 
          variant="outline" 
          onClick={() => setShowPreview(!showPreview)}
        >
          {showPreview ? 'Önizlemeyi Gizle' : 'Önizle'}
        </Button>
        
        <div className="inline-flex items-center space-x-1 text-sm text-gray-500">
          <div className={`w-3 h-3 rounded-full ${template.is_active ? 'bg-green-500' : 'bg-gray-400'}`}></div>
          <span>{template.is_active ? 'Aktif' : 'Pasif'}</span>
        </div>
      </div>
      
      {showPreview && (
        <div className="mt-3 border-t pt-3">
          <div className="text-sm font-medium mb-1">Şablon İçeriği:</div>
          <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded whitespace-pre-wrap text-sm">
            {template.content}
          </div>
          
          <div className="mt-3 text-xs text-gray-500">
            <p>
              Bu şablon {template.is_active ? 'aktif' : 'pasif'} durumdadır.
              {template.is_active && scheduleData.cron_expression 
                ? ` Cron zamanlaması: ${scheduleData.cron_expression}` 
                : template.is_active ? ` Her ${scheduleData.interval_minutes} dakikada bir gönderilecektir.` : ''}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateScheduleSettings; 