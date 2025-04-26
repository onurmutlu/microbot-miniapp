import React, { useState } from 'react';
import { useWizard } from './WizardContext';

const StepTestRule: React.FC = () => {
  const { data } = useWizard();
  const [testMessage, setTestMessage] = useState('');
  const [testResult, setTestResult] = useState<{
    matches: boolean;
    groups: string[];
    response: string;
  } | null>(null);
  
  const handleTest = () => {
    // Tetikleyici ile test mesajını karşılaştır
    let matches = false;
    let groups: string[] = [];
    let response = data.responseValue;
    
    if (data.triggerType === 'text') {
      // Metin içeriyor testi
      matches = testMessage.toLowerCase().includes(data.triggerValue.toLowerCase());
    } else {
      // Regex testi
      try {
        const regex = new RegExp(data.triggerValue, 'i');
        const result = testMessage.match(regex);
        matches = !!result;
        
        if (result && result.length > 1) {
          groups = result.slice(1);
          
          // Yanıtta grupları değiştir
          for (let i = 0; i < groups.length; i++) {
            const placeholder = `\${${i + 1}}`;
            response = response.replace(new RegExp(placeholder, 'g'), groups[i] || '');
          }
        }
      } catch (e) {
        // Geçersiz regex
        console.error('Geçersiz regex:', e);
      }
    }
    
    // Diğer değişkenleri değiştir (basit örnekler)
    response = response
      .replace(/\${username}/g, 'TestKullanıcı')
      .replace(/\${groupname}/g, 'TestGrup')
      .replace(/\${date}/g, new Date().toLocaleDateString('tr-TR'))
      .replace(/\${time}/g, new Date().toLocaleTimeString('tr-TR'));
    
    setTestResult({ matches, groups, response });
  };
  
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Kuralı Test Edin</h2>
      <p className="mb-6 text-gray-600 dark:text-gray-300">
        Oluşturduğunuz kuralı farklı mesajlarla test edin.
      </p>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Test Mesajı
          </label>
          <textarea
            value={testMessage}
            onChange={(e) => setTestMessage(e.target.value)}
            placeholder="Test etmek istediğiniz mesajı yazın..."
            className="w-full p-2 border rounded h-24"
          />
        </div>
        
        <button
          onClick={handleTest}
          disabled={!testMessage}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          Testi Çalıştır
        </button>
        
        {testResult && (
          <div className="mt-6 border rounded-lg p-4">
            <h3 className="font-medium mb-2">Test Sonucu</h3>
            
            <div className="flex items-center mb-4">
              <span className={`text-lg mr-2 ${testResult.matches ? 'text-green-500' : 'text-red-500'}`}>
                {testResult.matches ? '✅' : '❌'}
              </span>
              <span className="font-medium">
                {testResult.matches ? 'Mesaj kurala uyuyor' : 'Mesaj kurala uymuyor'}
              </span>
            </div>
            
            {testResult.matches && (
              <>
                {testResult.groups.length > 0 && (
                  <div className="mb-3">
                    <h4 className="text-sm font-medium mb-1">Yakalanan Gruplar:</h4>
                    <ul className="space-y-1">
                      {testResult.groups.map((group, index) => (
                        <li key={index} className="text-sm">
                          <span className="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">
                            ${`{${index + 1}}`}
                          </span>
                          {' = '}
                          <span className="font-mono">"{group}"</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <div>
                  <h4 className="text-sm font-medium mb-1">Verilecek Yanıt:</h4>
                  <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg whitespace-pre-wrap">
                    {testResult.response}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
        
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h3 className="font-medium mb-2">Kural Özeti</h3>
          
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium mr-2">Tetikleyici Tipi:</span>
              <span>{data.triggerType === 'text' ? 'Metin İçeriyor' : 'Regex Pattern'}</span>
            </div>
            
            <div>
              <span className="font-medium mr-2">Tetikleyici Değeri:</span>
              <code className="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">
                {data.triggerValue || '<boş>'}
              </code>
            </div>
            
            <div>
              <span className="font-medium mr-2">Yanıt Tipi:</span>
              <span>{data.responseType === 'simple' ? 'Basit Yanıt' : 'Şablon'}</span>
            </div>
            
            <div>
              <span className="font-medium mr-2">Yanıt Değeri:</span>
              <div className="mt-1 p-2 bg-gray-100 dark:bg-gray-800 rounded">
                {data.responseValue || '<boş>'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StepTestRule; 