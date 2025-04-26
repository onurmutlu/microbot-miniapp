import React from 'react';
import { useWizard } from './WizardContext';

const StepTriggerType: React.FC = () => {
  const { data, updateData } = useWizard();
  
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Tetikleyici Tipi Seçin</h2>
      <p className="mb-6 text-gray-600 dark:text-gray-300">
        Kuralınızın ne zaman tetiklenmesi gerektiğini seçin.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div 
          className={`border rounded-lg p-4 cursor-pointer ${
            data.triggerType === 'text' 
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
              : 'hover:border-gray-400'
          }`}
          onClick={() => updateData({ triggerType: 'text' })}
        >
          <div className="flex items-center mb-2">
            <div className={`w-6 h-6 rounded-full mr-2 flex items-center justify-center ${
              data.triggerType === 'text' 
                ? 'bg-blue-500 text-white' 
                : 'border border-gray-400'
            }`}>
              {data.triggerType === 'text' && '✓'}
            </div>
            <h3 className="font-medium">Metin İçeriyor</h3>
          </div>
          
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Mesaj belirli bir metin içerdiğinde tetiklenir. Büyük/küçük harf duyarsızdır.
          </p>
          
          <div className="mt-3 p-2 bg-gray-100 dark:bg-gray-700 rounded text-sm">
            <p><strong>Örnek:</strong> Mesaj "merhaba" içerdiğinde tetiklenir</p>
          </div>
        </div>
        
        <div 
          className={`border rounded-lg p-4 cursor-pointer ${
            data.triggerType === 'regex' 
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
              : 'hover:border-gray-400'
          }`}
          onClick={() => updateData({ triggerType: 'regex' })}
        >
          <div className="flex items-center mb-2">
            <div className={`w-6 h-6 rounded-full mr-2 flex items-center justify-center ${
              data.triggerType === 'regex' 
                ? 'bg-blue-500 text-white' 
                : 'border border-gray-400'
            }`}>
              {data.triggerType === 'regex' && '✓'}
            </div>
            <h3 className="font-medium">Regex (Gelişmiş)</h3>
          </div>
          
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Mesaj belirli bir kalıba uyduğunda tetiklenir. Daha güçlü ve esnek eşleştirme sağlar.
          </p>
          
          <div className="mt-3 p-2 bg-gray-100 dark:bg-gray-700 rounded text-sm">
            <p><strong>Örnek:</strong> Mesaj "sipariş #123456" formatına uyduğunda tetiklenir</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StepTriggerType; 