import React from 'react';
import { useWizard } from './WizardContext';

const StepResponseType: React.FC = () => {
  const { data, updateData } = useWizard();
  
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Yanıt Tipi Seçin</h2>
      <p className="mb-6 text-gray-600 dark:text-gray-300">
        Bot'un nasıl yanıt vermesini istediğinizi seçin.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div 
          className={`border rounded-lg p-4 cursor-pointer ${
            data.responseType === 'simple' 
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
              : 'hover:border-gray-400'
          }`}
          onClick={() => updateData({ responseType: 'simple' })}
        >
          <div className="flex items-center mb-2">
            <div className={`w-6 h-6 rounded-full mr-2 flex items-center justify-center ${
              data.responseType === 'simple' 
                ? 'bg-blue-500 text-white' 
                : 'border border-gray-400'
            }`}>
              {data.responseType === 'simple' && '✓'}
            </div>
            <h3 className="font-medium">Basit Yanıt</h3>
          </div>
          
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Her tetiklemede aynı yanıt mesajı gönderilir. Değişkenler kullanabilirsiniz.
          </p>
          
          <div className="mt-3 p-2 bg-gray-100 dark:bg-gray-700 rounded text-sm">
            <p><strong>Örnek:</strong> "Merhaba ${'{username}'}, size nasıl yardımcı olabilirim?"</p>
          </div>
        </div>
        
        <div 
          className={`border rounded-lg p-4 cursor-pointer ${
            data.responseType === 'template' 
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
              : 'hover:border-gray-400'
          }`}
          onClick={() => updateData({ responseType: 'template' })}
        >
          <div className="flex items-center mb-2">
            <div className={`w-6 h-6 rounded-full mr-2 flex items-center justify-center ${
              data.responseType === 'template' 
                ? 'bg-blue-500 text-white' 
                : 'border border-gray-400'
            }`}>
              {data.responseType === 'template' && '✓'}
            </div>
            <h3 className="font-medium">Şablon Kullan</h3>
          </div>
          
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Önceden kaydettiğiniz bir mesaj şablonunu kullanın.
          </p>
          
          <div className="mt-3 p-2 bg-gray-100 dark:bg-gray-700 rounded text-sm">
            <p><strong>Örnek:</strong> "Karşılama Mesajı" şablonunu kullan</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StepResponseType; 