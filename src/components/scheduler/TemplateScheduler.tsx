import React, { useState } from 'react';
import CronExpressionEditor from './CronExpressionEditor';
import { FormField } from '../ui/FormField';
import { useForm } from 'react-hook-form';
import { VALIDATION_RULES } from '../../utils/validation';

interface TemplateSchedulerProps {
  initialIntervalMinutes?: number;
  initialCronExpression?: string | null;
  onUpdate: (data: { interval_minutes: number; cron_expression: string | null }) => void;
}

const TemplateScheduler: React.FC<TemplateSchedulerProps> = ({ 
  initialIntervalMinutes = 60, 
  initialCronExpression = null, 
  onUpdate 
}) => {
  const [scheduleType, setScheduleType] = useState<'interval' | 'cron'>(
    initialCronExpression ? 'cron' : 'interval'
  );
  
  const { register, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      interval_minutes: initialIntervalMinutes,
      cron_expression: initialCronExpression || '0 9 * * 1-5'
    }
  });
  
  const intervalMinutes = watch('interval_minutes');
  const cronExpression = watch('cron_expression');
  
  // Zamanlama türü değiştiğinde
  const handleScheduleTypeChange = (type: 'interval' | 'cron') => {
    setScheduleType(type);
    // Üst bileşene değişikliği bildir
    onUpdate({
      interval_minutes: intervalMinutes,
      cron_expression: type === 'cron' ? cronExpression : null
    });
  };
  
  // Interval değiştiğinde
  const handleIntervalChange = (value: number) => {
    setValue('interval_minutes', value);
    if (scheduleType === 'interval') {
      onUpdate({
        interval_minutes: value,
        cron_expression: null
      });
    }
  };
  
  // Cron ifadesi değiştiğinde
  const handleCronChange = (value: string) => {
    setValue('cron_expression', value);
    if (scheduleType === 'cron') {
      onUpdate({
        interval_minutes: intervalMinutes,
        cron_expression: value
      });
    }
  };
  
  // Dakikaları insan tarafından okunabilir formata dönüştür
  const formatMinutesToReadable = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} dakika`;
    } else if (minutes < 60 * 24) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours} saat${mins ? ` ${mins} dakika` : ''}`;
    } else {
      const days = Math.floor(minutes / (60 * 24));
      const hours = Math.floor((minutes % (60 * 24)) / 60);
      return `${days} gün${hours ? ` ${hours} saat` : ''}`;
    }
  };
  
  return (
    <div className="border rounded-lg p-6 bg-white dark:bg-gray-800">
      <h3 className="text-lg font-semibold mb-4">Zamanlama Ayarları</h3>
      
      <div className="flex gap-4 mb-6">
        <label className="inline-flex items-center cursor-pointer">
          <input
            type="radio"
            checked={scheduleType === 'interval'}
            onChange={() => handleScheduleTypeChange('interval')}
            className="sr-only peer"
          />
          <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:translate-x-1/4 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
          <span className="ms-3 text-sm font-medium">Basit Aralık</span>
        </label>
        
        <label className="inline-flex items-center cursor-pointer">
          <input
            type="radio"
            checked={scheduleType === 'cron'}
            onChange={() => handleScheduleTypeChange('cron')}
            className="sr-only peer"
          />
          <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:translate-x-1/4 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
          <span className="ms-3 text-sm font-medium">Cron Zamanlama</span>
        </label>
      </div>
      
      <div className="border-t pt-4">
        {scheduleType === 'interval' ? (
          <div>
            <FormField
              label="Gönderim Aralığı (dakika)"
              name="interval_minutes"
              type="number"
              register={register}
              rules={{
                required: VALIDATION_RULES.REQUIRED,
                min: { value: 5, message: 'En az 5 dakika olmalıdır' },
                max: { value: 10080, message: 'En fazla 10080 dakika (1 hafta) olabilir' }
              }}
              errors={errors}
            />
            
            <div className="text-sm text-gray-500 mt-1 mb-4">
              {intervalMinutes && (
                <div>Her {formatMinutesToReadable(intervalMinutes)} aralıkla gönderilecek</div>
              )}
            </div>
            
            <div className="flex flex-wrap gap-2 mt-4">
              <button
                type="button"
                onClick={() => handleIntervalChange(60)}
                className="px-3 py-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded text-sm"
              >
                Saatlik
              </button>
              <button
                type="button"
                onClick={() => handleIntervalChange(60 * 24)}
                className="px-3 py-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded text-sm"
              >
                Günlük
              </button>
              <button
                type="button"
                onClick={() => handleIntervalChange(60 * 24 * 7)}
                className="px-3 py-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded text-sm"
              >
                Haftalık
              </button>
            </div>
          </div>
        ) : (
          <CronExpressionEditor 
            value={cronExpression} 
            onChange={handleCronChange} 
          />
        )}
      </div>
      
      <div className="mt-6 pt-4 border-t">
        <p className="text-xs text-gray-500">
          Zamanlama hakkında daha fazla bilgi için 
          <a 
            href="/cron-guide" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline ml-1"
          >
            Cron Rehberi
          </a>'ne bakabilirsiniz.
        </p>
      </div>
    </div>
  );
};

export default TemplateScheduler; 