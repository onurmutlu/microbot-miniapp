import React, { useState, useEffect } from 'react';
import { useCronValidation } from '../../hooks/useCron';
import { Button } from '../ui/button';

interface CronEditorProps {
  value: string;
  onChange: (value: string) => void;
}

const CronExpressionEditor: React.FC<CronEditorProps> = ({ value, onChange }) => {
  const [activeTab, setActiveTab] = useState<'simple' | 'advanced'>('simple');
  const [minute, setMinute] = useState<string>('0');
  const [hour, setHour] = useState<string>('9');
  const [day, setDay] = useState<string>('*');
  const [month, setMonth] = useState<string>('*');
  const [weekday, setWeekday] = useState<string>('1-5');
  const [customExpression, setCustomExpression] = useState<string>(value || '0 9 * * 1-5');
  
  const { isValidating, data, validate } = useCronValidation();

  // İlk render'da value değerini ayrıştır
  useEffect(() => {
    if (value) {
      setCustomExpression(value);
      const parts = value.split(' ');
      if (parts.length === 5) {
        setMinute(parts[0]);
        setHour(parts[1]);
        setDay(parts[2]);
        setMonth(parts[3]);
        setWeekday(parts[4]);
      }
    }
  }, []);
  
  // Basit modda değerler değiştiğinde cron ifadesini güncelle
  useEffect(() => {
    if (activeTab === 'simple') {
      const expression = `${minute} ${hour} ${day} ${month} ${weekday}`;
      setCustomExpression(expression);
      onChange(expression);
    }
  }, [minute, hour, day, month, weekday, activeTab, onChange]);
  
  // Gelişmiş modda manuel ifade değiştiğinde
  const handleCustomExpressionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomExpression(e.target.value);
  };
  
  // Gelişmiş moddaki ifadeyi kaydet
  const handleSaveCustomExpression = () => {
    onChange(customExpression);
    validate(customExpression);
  };
  
  // Yaygın zamanlamalar için hızlı seçim
  const presets = [
    { label: 'Hafta içi her sabah (09:00)', value: '0 9 * * 1-5' },
    { label: 'Her gün sabah (09:00)', value: '0 9 * * *' },
    { label: 'Her saatin başında', value: '0 * * * *' },
    { label: 'Her ayın ilk günü', value: '0 9 1 * *' },
    { label: 'Her Pazartesi', value: '0 9 * * 1' },
  ];
  
  // Preseti uygula
  const applyPreset = (presetValue: string) => {
    const parts = presetValue.split(' ');
    if (parts.length === 5) {
      setMinute(parts[0]);
      setHour(parts[1]);
      setDay(parts[2]);
      setMonth(parts[3]);
      setWeekday(parts[4]);
    }
    setCustomExpression(presetValue);
    onChange(presetValue);
  };
  
  return (
    <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
      <div className="flex border-b mb-4">
        <button
          className={`py-2 px-4 ${activeTab === 'simple' ? 'border-b-2 border-blue-500 font-medium' : 'text-gray-500'}`}
          onClick={() => setActiveTab('simple')}
        >
          Basit
        </button>
        <button
          className={`py-2 px-4 ${activeTab === 'advanced' ? 'border-b-2 border-blue-500 font-medium' : 'text-gray-500'}`}
          onClick={() => setActiveTab('advanced')}
        >
          Gelişmiş
        </button>
      </div>
      
      {activeTab === 'simple' ? (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2 items-center">
            <label className="text-sm font-medium">Dakika:</label>
            <select 
              value={minute} 
              onChange={(e) => setMinute(e.target.value)}
              className="col-span-2 p-2 border rounded bg-white dark:bg-gray-700"
            >
              <option value="*">Her dakika (*)</option>
              <option value="*/5">Her 5 dakika (*/5)</option>
              <option value="*/15">Her 15 dakika (*/15)</option>
              <option value="*/30">Her 30 dakika (*/30)</option>
              <option value="0">Tam saatte (0)</option>
            </select>
          </div>
          
          <div className="grid grid-cols-3 gap-2 items-center">
            <label className="text-sm font-medium">Saat:</label>
            <select 
              value={hour} 
              onChange={(e) => setHour(e.target.value)}
              className="col-span-2 p-2 border rounded bg-white dark:bg-gray-700"
            >
              <option value="*">Her saat (*)</option>
              <option value="9">Sabah 9 (9)</option>
              <option value="12">Öğle 12 (12)</option>
              <option value="17">Akşam 17 (17)</option>
              <option value="9-17">İş saatleri (9-17)</option>
            </select>
          </div>
          
          <div className="grid grid-cols-3 gap-2 items-center">
            <label className="text-sm font-medium">Haftanın Günü:</label>
            <select 
              value={weekday} 
              onChange={(e) => setWeekday(e.target.value)}
              className="col-span-2 p-2 border rounded bg-white dark:bg-gray-700"
            >
              <option value="*">Her gün (*)</option>
              <option value="1-5">Hafta içi (1-5)</option>
              <option value="0,6">Hafta sonu (0,6)</option>
              <option value="1">Pazartesi (1)</option>
              <option value="5">Cuma (5)</option>
            </select>
          </div>
          
          <div className="mt-6">
            <h4 className="text-sm font-medium mb-2">Hazır Kalıplar:</h4>
            <div className="flex flex-wrap gap-2">
              {presets.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => applyPreset(preset.value)}
                  className="px-3 py-1 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800 rounded text-sm"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <label className="block text-sm font-medium mb-1">Cron İfadesi:</label>
          <div className="flex gap-2">
            <input 
              type="text" 
              value={customExpression} 
              onChange={handleCustomExpressionChange} 
              placeholder="* * * * *"
              className="flex-1 p-2 border rounded font-mono"
            />
            <Button onClick={handleSaveCustomExpression} disabled={isValidating}>
              {isValidating ? 'Doğrulanıyor...' : 'Doğrula'}
            </Button>
          </div>
          <div className="text-xs text-gray-500">
            Format: dakika saat gün ay haftanın_günü (örn: 0 9 * * 1-5)
          </div>
        </div>
      )}
      
      <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono">
        {customExpression}
      </div>
      
      {data && (
        <div className="mt-4 p-3 border rounded">
          <h4 className="text-sm font-medium mb-2">Sonraki çalışma zamanları:</h4>
          {data.is_valid ? (
            <ul className="space-y-1 text-sm">
              {data.next_dates.map((date, index) => (
                <li key={index} className="text-gray-600 dark:text-gray-300">
                  {new Date(date).toLocaleString('tr-TR')}
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-2 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 rounded text-sm">
              Geçersiz cron ifadesi: {data.error}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CronExpressionEditor; 