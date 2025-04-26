import React from 'react';

interface TriggerSelectorProps {
  selected: 'text' | 'regex';
  onChange: (type: 'text' | 'regex') => void;
}

const TriggerSelector: React.FC<TriggerSelectorProps> = ({ selected, onChange }) => {
  return (
    <div>
      <label className="block text-sm font-medium mb-2">
        Tetikleyici Tipi
      </label>
      
      <div className="grid grid-cols-2 gap-3">
        <div
          onClick={() => onChange('text')}
          className={`cursor-pointer border rounded-lg p-3 transition-colors ${
            selected === 'text'
              ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
              : 'hover:bg-gray-50 dark:hover:bg-gray-800'
          }`}
        >
          <h3 className="font-medium">Metin İçeriyor</h3>
          <p className="text-sm mt-1 text-gray-600 dark:text-gray-400">
            Mesaj belirli bir metin içerdiğinde kural tetiklenir.
          </p>
        </div>
        
        <div
          onClick={() => onChange('regex')}
          className={`cursor-pointer border rounded-lg p-3 transition-colors ${
            selected === 'regex'
              ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
              : 'hover:bg-gray-50 dark:hover:bg-gray-800'
          }`}
        >
          <h3 className="font-medium">Regex Pattern</h3>
          <p className="text-sm mt-1 text-gray-600 dark:text-gray-400">
            Mesaj belirli bir kalıba uyduğunda kural tetiklenir. (Gelişmiş)
          </p>
        </div>
      </div>
    </div>
  );
};

export default TriggerSelector; 