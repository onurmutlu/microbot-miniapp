import React from 'react';

interface PreviewPanelProps {
  trigger: string;
  triggerType: 'text' | 'regex';
  response: string;
}

const PreviewPanel: React.FC<PreviewPanelProps> = ({ trigger, triggerType, response }) => {
  return (
    <div className="border rounded-lg p-4">
      <h3 className="font-medium mb-3">Önizleme</h3>
      
      <div className="mb-4">
        <div className="text-sm font-medium mb-1">Tetikleyici</div>
        <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded-lg">
          <span className="text-sm mr-2 text-gray-500">Tür:</span>
          <span className="font-medium">
            {triggerType === 'text' ? 'Metin İçeriyor' : 'Regex Pattern'}
          </span>
          <br />
          <span className="text-sm mr-2 text-gray-500">Değer:</span>
          <code className="font-mono bg-gray-200 dark:bg-gray-700 px-1 rounded">
            {trigger || '<boş>'}
          </code>
        </div>
      </div>
      
      <div>
        <div className="text-sm font-medium mb-1">Yanıt</div>
        <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded-lg whitespace-pre-wrap">
          {response || '<boş>'}
        </div>
      </div>
      
      <div className="mt-4 text-xs text-gray-500">
        <p><strong>Not:</strong> Gerçek değişkenler (${'{'} ... {'}'}) sadece mesaj gönderildiğinde doldurulacaktır.</p>
      </div>
    </div>
  );
};

export default PreviewPanel; 