import React from 'react';

interface ResponseEditorProps {
  value: string;
  onChange: (value: string) => void;
  groups: string[];
}

const ResponseEditor: React.FC<ResponseEditorProps> = ({ value, onChange, groups }) => {
  const insertVariable = (variable: string) => {
    onChange(value + variable);
  };
  
  return (
    <div>
      <label className="block text-sm font-medium mb-1">
        Yanıt Mesajı
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Yanıt mesajını yazın..."
        className="w-full p-2 border rounded min-h-[100px]"
      />
      
      <div className="mt-2">
        <div className="text-sm font-medium mb-1">Değişkenler</div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => insertVariable('${username}')}
            className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-sm"
          >
            ${'{username}'}
          </button>
          <button
            type="button"
            onClick={() => insertVariable('${groupname}')}
            className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-sm"
          >
            ${'{groupname}'}
          </button>
          <button
            type="button"
            onClick={() => insertVariable('${date}')}
            className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-sm"
          >
            ${'{date}'}
          </button>
          <button
            type="button"
            onClick={() => insertVariable('${time}')}
            className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-sm"
          >
            ${'{time}'}
          </button>
          
          {groups.length > 0 && (
            <>
              <div className="w-full h-0 border-t my-2"></div>
              <div className="w-full text-sm font-medium">Yakalanan Gruplar</div>
              {groups.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => insertVariable(`\${${index + 1}}`)}
                  className="px-2 py-1 bg-green-100 dark:bg-green-900 rounded text-sm"
                >
                  ${`{${index + 1}}`}
                </button>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResponseEditor; 