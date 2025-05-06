import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { setTestMode, getTestMode } from '../utils/testMode';

export default function TelegramSetup() {
  const [localIP, setLocalIP] = useState<string>('');
  const [hostname, setHostname] = useState<string>('');
  const [port, setPort] = useState<string>('');
  const [botUsername, setBotUsername] = useState<string>('');
  const [botToken, setBotToken] = useState<string>('');
  const [testMode, setTestModeState] = useState<boolean>(getTestMode());
  const [step, setStep] = useState<number>(1);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    // Hostname ve port bilgilerini al
    setHostname(window.location.hostname);
    setPort(window.location.port);
    
    // Bot bilgilerini al
    const envBotUsername = import.meta.env.VITE_TELEGRAM_BOT_USERNAME || '';
    const envBotToken = import.meta.env.VITE_TELEGRAM_BOT_TOKEN || '';
    
    setBotUsername(envBotUsername);
    setBotToken(envBotToken ? envBotToken.slice(0, 10) + '...' : '');
    
    // Yerel IP adresini al
    const getLocalIP = async () => {
      try {
        // Farklı yöntemler deneyerek IP adresini almaya çalış
        setLocalIP(window.location.hostname);
      } catch (error) {
        console.error('IP adresi alınamadı:', error);
        setLocalIP('IP alınamadı');
      }
    };
    
    getLocalIP();
  }, []);
  
  // Test modunu değiştir
  const toggleTestMode = () => {
    const newMode = !testMode;
    setTestModeState(newMode);
    setTestMode(newMode);
    toast.info(`Test modu ${newMode ? 'etkinleştirildi' : 'devre dışı bırakıldı'}`);
  };
  
  // Komut satırını kopyala
  const copyCommandToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        setCopied(true);
        toast.success('Komut panoya kopyalandı');
        setTimeout(() => setCopied(false), 3000);
      })
      .catch(err => {
        console.error('Kopyalama hatası:', err);
        toast.error('Komut kopyalanamadı');
      });
  };
  
  // BotFather'a URL'i kopyala
  const getDomainForBotFather = () => {
    return `${window.location.protocol}//${window.location.host}`;
  };

  // BotFather komutu oluştur
  const getBotFatherCommand = () => {
    return `/setdomain ${botUsername} ${getDomainForBotFather()}`;
  };

  return (
    <div className="px-4 py-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Telegram Bot Yapılandırması</h1>
        <p className="text-gray-600 dark:text-gray-300">
          Telegram Login Widget'ının doğru çalışması için Telegram botunuzu yapılandırmanız gerekiyor.
        </p>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
        <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Mevcut Yapılandırma</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">Bot Bilgileri</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Bot Kullanıcı Adı:</span>
                  <span className="font-medium">{botUsername || 'Yapılandırılmamış'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Bot Token:</span>
                  <span className="font-medium">{botToken || 'Yapılandırılmamış'}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">Ortam Bilgileri</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Hostname:</span>
                  <span className="font-medium">{hostname}:{port}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">IP Adresi:</span>
                  <span className="font-medium">{localIP}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Test Modu:</span>
                  <div>
                    <button 
                      onClick={toggleTestMode}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full ${testMode ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'}`}
                    >
                      <span 
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${testMode ? 'translate-x-6' : 'translate-x-1'}`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Yapılandırma Adımları</h2>
          
          <div className="space-y-6">
            <div className={`p-4 border rounded-lg transition-all ${step === 1 ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-200 dark:border-gray-700'}`}>
              <div className="flex items-start">
                <div className="flex-shrink-0 mr-3">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center ${step === 1 ? 'bg-indigo-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}>
                    1
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-medium mb-2">Telegram Bot Oluşturma</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-3">
                    Henüz bir Telegram botunuz yoksa, Telegram'da <span className="font-mono bg-gray-100 dark:bg-gray-800 rounded px-1">@BotFather</span> ile konuşarak yeni bir bot oluşturun.
                  </p>
                  <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded font-mono text-sm mb-3">
                    1. Telegram'da <span className="text-indigo-600 dark:text-indigo-400">@BotFather</span> ile sohbet başlatın<br />
                    2. <span className="text-green-600 dark:text-green-400">/newbot</span> komutunu gönderin<br />
                    3. Bot için bir isim girin (örn. "MicroBot")<br />
                    4. Bot için bir kullanıcı adı girin (örn. "MicroBotMiniApp_bot")<br />
                    5. BotFather size bir API token verecek<br />
                    6. Bu token'ı <span className="text-yellow-600 dark:text-yellow-400">.env</span> dosyanıza ekleyin
                  </div>
                  <button 
                    onClick={() => setStep(2)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm"
                  >
                    İleri
                  </button>
                </div>
              </div>
            </div>
            
            <div className={`p-4 border rounded-lg transition-all ${step === 2 ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-200 dark:border-gray-700'}`}>
              <div className="flex items-start">
                <div className="flex-shrink-0 mr-3">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center ${step === 2 ? 'bg-indigo-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}>
                    2
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-medium mb-2">Login Widget'ını Etkinleştirme</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-3">
                    Botunuz için Telegram Login Widget'ını etkinleştirin ve izin verilen domain'leri yapılandırın.
                  </p>
                  <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded font-mono text-sm mb-3">
                    1. Telegram'da <span className="text-indigo-600 dark:text-indigo-400">@BotFather</span> ile sohbet başlatın<br />
                    2. <span className="text-green-600 dark:text-green-400">/mybots</span> komutunu gönderin<br />
                    3. Botunuzu seçin<br />
                    4. <span className="text-green-600 dark:text-green-400">Bot Settings → Domain</span> seçeneğini seçin<br />
                    5. Aşağıdaki komutu gönderin:
                  </div>
                  <div className="bg-gray-200 dark:bg-gray-900 p-3 rounded-md font-mono text-sm flex items-center justify-between mb-4">
                    <code>{getBotFatherCommand()}</code>
                    <button 
                      onClick={() => copyCommandToClipboard(getBotFatherCommand())}
                      className={`ml-2 text-gray-600 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 ${copied ? 'text-green-500 dark:text-green-400' : ''}`}
                      title="Kopyala"
                    >
                      {copied ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                          <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  <div className="flex space-x-3">
                    <button 
                      onClick={() => setStep(1)}
                      className="border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 px-4 py-2 rounded-md text-sm"
                    >
                      Geri
                    </button>
                    <button 
                      onClick={() => setStep(3)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm"
                    >
                      İleri
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <div className={`p-4 border rounded-lg transition-all ${step === 3 ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-200 dark:border-gray-700'}`}>
              <div className="flex items-start">
                <div className="flex-shrink-0 mr-3">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center ${step === 3 ? 'bg-indigo-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}>
                    3
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-medium mb-2">Test Modunu Etkinleştirme</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-3">
                    Telegram Login Widget ile ilgili sorunları çözmek için, geliştirme sırasında Test Modunu etkinleştirin.
                  </p>
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-3 rounded-md text-yellow-800 dark:text-yellow-200 mb-4">
                    <div className="flex">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <div>
                        <p className="font-medium">
                          Test modu, Telegram Login Widget'ı olmadan giriş yapmanızı sağlar.
                        </p>
                        <p className="mt-1">
                          Bu, yerel geliştirme ortamında veya Telegram Bot API'sine erişiminiz olmadığında faydalıdır.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 mb-6">
                    <button 
                      onClick={toggleTestMode}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full ${testMode ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'}`}
                    >
                      <span 
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${testMode ? 'translate-x-6' : 'translate-x-1'}`}
                      />
                    </button>
                    <span className="font-medium">
                      Test Modu: {testMode ? 'Etkin' : 'Devre Dışı'}
                    </span>
                  </div>
                  <div className="flex space-x-3">
                    <button 
                      onClick={() => setStep(2)}
                      className="border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 px-4 py-2 rounded-md text-sm"
                    >
                      Geri
                    </button>
                    <Link to="/login" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm">
                      Giriş Sayfasına Git
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Sorun Giderme</h2>
        
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600">
            <h3 className="font-medium text-gray-800 dark:text-white mb-2">
              "Bot domain invalid" Hatası
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-2">
              Bu hata, Telegram'ın botunuzun domain'ine erişimini kısıtlamasından kaynaklanır.
            </p>
            <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-300">
              <li>BotFather'da domain'inizi doğru şekilde ayarladığınızdan emin olun</li>
              <li>Localhost yerine IP adresinizi kullanın (örn. 192.168.1.X:5176)</li>
              <li>SSL sertifikanızın geçerli olduğundan emin olun (HTTPS için)</li>
              <li>Geliştirme sırasında Test Modunu etkinleştirin</li>
            </ul>
          </div>
          
          <div className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600">
            <h3 className="font-medium text-gray-800 dark:text-white mb-2">
              Widget Görünmüyor
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-2">
              Telegram Login Widget'ı görünmüyorsa veya yüklenmiyorsa:
            </p>
            <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-300">
              <li>Tarayıcınızın konsolunda hata mesajları olup olmadığını kontrol edin</li>
              <li>Bot kullanıcı adınızın doğru olduğundan emin olun</li>
              <li>Tarayıcınızın JavaScript'i engellemiş olabileceğini kontrol edin</li>
              <li>Geliştirme ortamında Test Modunu etkinleştirin</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 