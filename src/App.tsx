import React, { useEffect, Suspense, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastContainer } from 'react-toastify';
import { store } from './store';
import { useAuth } from './hooks/useAuth';
import { runConnectionTests } from './utils/connectionTest';
import { checkEnv, isMiniApp } from './utils/env';
import { setTestMode, getTestMode } from './utils/testMode';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import MobileNavigation from './components/layout/MobileNavigation';
import MessageTemplates from './pages/MessageTemplates';
import AutoReplyRules from './pages/AutoReplyRules';
import GroupList from './pages/GroupList';
import MessageSend from './pages/MessageSend';
import DMPanel from './pages/DMPanel';
import SchedulerPage from './pages/SchedulerPage';
import CronGuidePage from './pages/CronGuidePage';
import Dashboard from './pages/Dashboard';
import UserSettings from './pages/UserSettings';
import SystemStatus from './pages/SystemStatus';
import SessionPage from './pages/SessionPage';
import SessionListPage from './pages/SessionListPage';
import NewSessionPage from './pages/NewSessionPage';
import TestModeIndicator from './components/debug/TestModeIndicator';
import Spinner from './components/ui/Spinner';
import JoinGroupForm from './components/JoinGroupForm';
import GroupsList from './components/GroupsList';
import { SessionProvider } from './context/SessionContext';
import 'react-toastify/dist/ReactToastify.css';
import './styles/glass.css';
import './styles/neon-effects.css';
import HomePage from './pages/HomePage';
import WebSocketTest from './pages/WebSocketTest';
import { ActiveSessionProvider } from './hooks/useActiveSession';
import { useWebSocket } from './hooks/useWebSocket.ts';
import { WebSocketProvider } from './contexts/WebSocketContext';
import { clearAllToasts } from './utils/toast';
import ErrorBoundary from './components/ErrorBoundary';
import LoginPage from './pages/LoginPage';
import api from './utils/api';
import { UserProvider } from './context/UserContext';
import { useUser } from './context/UserContext';
import LoginGuard from './components/LoginGuard';
import SSEDemo from './pages/SSEDemo';
import SSEClientDemo from './pages/SSEClientDemo';
import TelegramSetup from './pages/TelegramSetup';
import CyberpunkUIDemo from './pages/CyberpunkUIDemo';
import CyberpunkDashboardDemo from './pages/CyberpunkDashboardDemo';
import NeonButtonDemo from './pages/NeonButtonDemo';
import CorporatePanelDemo from './pages/CorporatePanelDemo';
import CorporateButtonDemo from './pages/CorporateButtonDemo';
import CorporateMobileHeaderDemo from './pages/CorporateMobileHeaderDemo';
import CorporateGlassCardDemo from './pages/CorporateGlassCardDemo';
import ThemeSwitcherDemo from './pages/ThemeSwitcherDemo';
import AnimationDemo from './pages/AnimationDemo';
import UIStyleGuide from './pages/UIStyleGuide';
import PageTransition from './components/ui/PageTransition';
import ThemeSwitcher from './components/ThemeSwitcher';
import './styles/themes.css';
import { initTelegramApp } from './utils/telegramSDK';
import MiniAppLayout from './components/ui/MiniAppLayout';
import MiniAppHeader from './components/ui/MiniAppHeader';
import MiniAppCard from './components/ui/MiniAppCard';
import MiniAppButton from './components/ui/MiniAppButton';
import MiniAppBottomNav from './components/ui/MiniAppBottomNav';
import MiniAppSkeleton from './components/ui/MiniAppSkeleton';
import { useTelegramWebApp } from './hooks/useTelegramWebApp';
import MiniAppDemo from './components/MiniAppDemo';
import ErrorReports from './pages/ErrorReports';
import WebSocketManager from './pages/WebSocketManager';

const queryClient = new QueryClient();

const dummyUser = {
  id: 'dummy',
  username: 'testuser',
  email: 'test@microbot.local',
  first_name: 'Test',
  last_name: 'User',
  photo_url: 'https://i.pravatar.cc/150?img=3'
};

// Geliştirme ortamında ise test modu ayarlarını yapılandır
if (import.meta.env.DEV) {
  // Test modunu varsayılan olarak açık bırak
  setTestMode(true);
  
  // Test modu için konsol yardımcı fonksiyonu
  if (typeof window !== 'undefined') {
    // Konsol üzerinden test modunu değiştirme fonksiyonunu ekle
    (window as any).toggleTestMode = () => {
      const newMode = !getTestMode();
      setTestMode(newMode);
      console.log(`Test modu: ${newMode ? 'Açık' : 'Kapalı'}`);
      return newMode;
    };
  }
}

const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading, login } = useAuth();
  const { isConnected: isWsConnected } = useWebSocket();
  const { setUser } = useUser();
  const { user, themeParams, webApp, isDarkMode } = useTelegramWebApp();
  const [activeTab, setActiveTab] = useState('home');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Environment kontrolü
    if (!checkEnv()) {
      console.error('Eksik environment değişkenleri tespit edildi');
    }

    // Bağlantı testleri
    runConnectionTests();

    // Sayfa yüklendiğinde tüm bildirimleri temizle
    clearAllToasts();

    // MiniApp kontrolü ve initData işleme
    if (isMiniApp() && window.Telegram?.WebApp) {
      const initData = window.Telegram.WebApp.initData;
      
      // initData varsa ve oturum açılmamışsa backend'e gönder
      if (initData && !localStorage.getItem('access_token')) {
        api.post('/auth/telegram', { initData })
          .then(response => {
            if (response.data.token) {
              localStorage.setItem('access_token', response.data.token);
              
              // Kullanıcı bilgilerini sakla
              if (response.data.user) {
                localStorage.setItem('telegram_user', JSON.stringify(response.data.user));
                // useUser hook'u ile kullanıcı context'ini güncelle
                const userData = response.data.user;
                setUser(userData);
              }
              
              // Auth hook ile login yap
              login(response.data);
            }
          })
          .catch(error => {
            console.error('MiniApp authentication error:', error);
          });
      }
    }

    // Sayfa yeniden yüklendiğinde veya kapatıldığında bildirimleri temizle
    const clearToastsOnAction = () => {
      clearAllToasts();
    };

    window.addEventListener('beforeunload', clearToastsOnAction);
    window.addEventListener('unload', clearToastsOnAction);

    return () => {
      window.removeEventListener('beforeunload', clearToastsOnAction);
      window.removeEventListener('unload', clearToastsOnAction);
    };
  }, [setUser, login]);

  // Body'e class ekle
  useEffect(() => {
    document.body.classList.add('bg-gradient');
  }, []);

  // Telegram MiniApp SDK'yı başlat
  useEffect(() => {
    initTelegramApp();
  }, []);

  // Ana butonun hazırlanması
  React.useEffect(() => {
    if (webApp?.MainButton) {
      webApp.MainButton.setText('İşlemi Tamamla');
      webApp.MainButton.color = themeParams?.button_color || '#2AABEE';
      webApp.MainButton.textColor = themeParams?.button_text_color || '#FFFFFF';
      webApp.MainButton.onClick(() => {
        webApp.HapticFeedback?.notificationOccurred('success');
        handleMainButtonClick();
      });
    }
  }, [webApp]);
  
  const handleMainButtonClick = () => {
    setLoading(true);
    // Yükleme durumunu simüle et
    setTimeout(() => {
      setLoading(false);
      webApp?.showAlert('İşlem başarıyla tamamlandı!');
    }, 1500);
  };
  
  const showMainButton = () => {
    webApp?.MainButton?.show();
  };
  
  const hideMainButton = () => {
    webApp?.MainButton?.hide();
  };
  
  // Alt navigasyon öğeleri
  const navItems = [
    {
      key: 'home',
      label: 'Ana Sayfa',
      icon: <span className="i-mdi-home" />,
    },
    {
      key: 'search',
      label: 'Keşfet',
      icon: <span className="i-mdi-compass" />,
    },
    {
      key: 'notifications',
      label: 'Bildirimler',
      icon: <span className="i-mdi-bell" />,
      badge: 5,
    },
    {
      key: 'profile',
      label: 'Profil',
      icon: <span className="i-mdi-account" />,
    },
  ];
  
  // Ana sayfa içeriği
  const renderHomeContent = () => (
    <div className="flex flex-col gap-4">
      <MiniAppCard 
        title="Hoş Geldiniz" 
        subtitle={user?.first_name ? `Merhaba, ${user.first_name}!` : 'Telegram MiniApp'}
        glass
        elevated
        icon={<span className="i-mdi-hand-wave text-2xl text-yellow-500" />}
      >
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
          Bu demo uygulaması Telegram MiniApp için optimize edilmiş bir kullanıcı arayüzü örneğidir. 
          UnoCSS ve React kullanılarak geliştirilmiştir.
        </p>
        
        <div className="flex flex-wrap gap-2 mt-4">
          <MiniAppButton 
            variant="primary" 
            size="md"
            icon={<span className="i-mdi-rocket-launch" />}
            onClick={showMainButton}
          >
            Ana Butonu Göster
          </MiniAppButton>
          
          <MiniAppButton 
            variant="outline" 
            size="md"
            icon={<span className="i-mdi-close" />}
            onClick={hideMainButton}
          >
            Ana Butonu Gizle
          </MiniAppButton>
        </div>
      </MiniAppCard>
      
      <div className="grid grid-cols-2 gap-3">
        <MiniAppCard
          title="Neon Efekti"
          interactive
          onClick={() => webApp?.HapticFeedback?.impactOccurred('medium')}
        >
          <div className="mt-2">
            <MiniAppButton variant="neon" fullWidth>
              Işıltılı Buton
            </MiniAppButton>
          </div>
        </MiniAppCard>
        
        <MiniAppCard
          title="Gradient"
          interactive
          onClick={() => webApp?.HapticFeedback?.impactOccurred('light')}
        >
          <div className="mt-2">
            <MiniAppButton variant="gradient" fullWidth>
              Gradient Buton
            </MiniAppButton>
          </div>
        </MiniAppCard>
      </div>
      
      <MiniAppCard
        title="Yükleme Durumları"
        subtitle="Skeleton bileşenleri"
      >
        <div className="mt-3 space-y-3">
          <MiniAppSkeleton variant="text" count={3} />
          
          <div className="flex gap-3 mt-3">
            <MiniAppSkeleton variant="avatar" />
            <div className="flex-1">
              <MiniAppSkeleton variant="text" width="60%" />
              <MiniAppSkeleton variant="text" width="90%" className="mt-2" />
            </div>
          </div>
        </div>
      </MiniAppCard>
      
      <MiniAppCard
        title="Tema ve Renkler"
        subtitle={isDarkMode ? 'Karanlık Mod Aktif' : 'Aydınlık Mod Aktif'}
        icon={<span className={`${isDarkMode ? 'i-mdi-moon-waning-crescent' : 'i-mdi-white-balance-sunny'} text-2xl ${isDarkMode ? 'text-blue-400' : 'text-yellow-500'}`} />}
      >
        <div className="grid grid-cols-2 gap-2 mt-3">
          <div className="flex flex-col gap-2">
            <div className="h-8 rounded-md bg-blue-500 flex items-center justify-center text-white text-xs">
              Mavi
            </div>
            <div className="h-8 rounded-md bg-green-500 flex items-center justify-center text-white text-xs">
              Yeşil
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <div className="h-8 rounded-md bg-purple-500 flex items-center justify-center text-white text-xs">
              Mor
            </div>
            <div className="h-8 rounded-md bg-red-500 flex items-center justify-center text-white text-xs">
              Kırmızı
            </div>
          </div>
        </div>
      </MiniAppCard>
    </div>
  );
  
  // Keşfet sayfası içeriği
  const renderSearchContent = () => (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <input
          type="text"
          placeholder="Ara..."
          className="w-full px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 pr-10"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 i-mdi-magnify text-xl text-gray-400"></span>
      </div>
      
      <h2 className="text-lg font-medium mt-2">Popüler Kategoriler</h2>
      
      <div className="grid grid-cols-2 gap-3">
        {['Teknoloji', 'Eğitim', 'Sağlık', 'Spor'].map((category, index) => (
          <MiniAppCard 
            key={index}
            title={category}
            interactive
            glass={index % 2 === 0}
            elevated={index % 3 === 0}
          >
            <div className="h-20 flex items-center justify-center">
              <span className={`i-mdi-${
                index === 0 ? 'laptop' : 
                index === 1 ? 'book-open' : 
                index === 2 ? 'heart-pulse' : 
                'soccer'
              } text-4xl text-blue-500`}></span>
            </div>
          </MiniAppCard>
        ))}
      </div>
      
      <h2 className="text-lg font-medium mt-2">Önerilen</h2>
      <MiniAppSkeleton variant="list" count={3} />
    </div>
  );
  
  // Bildirimler sayfası içeriği
  const renderNotificationsContent = () => (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-medium">Bildirimler</h2>
      
      {[1, 2, 3, 4, 5].map((item) => (
        <MiniAppCard 
          key={item}
          bordered
          className="border-l-4 border-l-blue-500"
        >
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
              <span className="i-mdi-bell text-blue-500"></span>
            </div>
            <div>
              <h3 className="font-medium">Yeni Bildirim #{item}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Bu bir örnek bildirim içeriğidir. Gerçek veriler uygulamanıza göre değişecektir.
              </p>
              <p className="text-xs text-gray-400 mt-2">2 saat önce</p>
            </div>
          </div>
        </MiniAppCard>
      ))}
    </div>
  );
  
  // Profil sayfası içeriği
  const renderProfileContent = () => (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-center flex-col">
        <div className="h-24 w-24 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mb-3">
          {user?.photo_url ? (
            <img src={user.photo_url} alt="Profil" className="h-24 w-24 rounded-full object-cover" />
          ) : (
            <span className="i-mdi-account text-4xl text-blue-500"></span>
          )}
        </div>
        
        <h2 className="text-xl font-medium">
          {user?.first_name} {user?.last_name || ''}
        </h2>
        
        {user?.username && (
          <p className="text-gray-500 dark:text-gray-400">@{user.username}</p>
        )}
      </div>
      
      <MiniAppCard>
        <div className="space-y-4">
          <button className="flex items-center justify-between w-full py-2">
            <div className="flex items-center gap-3">
              <span className="i-mdi-settings text-xl text-gray-500"></span>
              <span>Ayarlar</span>
            </div>
            <span className="i-mdi-chevron-right"></span>
          </button>
          
          <div className="border-t border-gray-200 dark:border-gray-700"></div>
          
          <button className="flex items-center justify-between w-full py-2">
            <div className="flex items-center gap-3">
              <span className="i-mdi-help-circle text-xl text-gray-500"></span>
              <span>Yardım</span>
            </div>
            <span className="i-mdi-chevron-right"></span>
          </button>
          
          <div className="border-t border-gray-200 dark:border-gray-700"></div>
          
          <button className="flex items-center justify-between w-full py-2">
            <div className="flex items-center gap-3">
              <span className="i-mdi-information text-xl text-gray-500"></span>
              <span>Hakkında</span>
            </div>
            <span className="i-mdi-chevron-right"></span>
          </button>
        </div>
      </MiniAppCard>
      
      <MiniAppButton 
        variant="outline" 
        fullWidth
        icon={<span className="i-mdi-logout"></span>}
        onClick={() => webApp?.close()}
      >
        Çıkış Yap
      </MiniAppButton>
    </div>
  );
  
  // Aktif sekmeye göre içeriği görüntüle
  const renderContent = () => {
    switch(activeTab) {
      case 'home':
        return renderHomeContent();
      case 'search':
        return renderSearchContent();
      case 'notifications':
        return renderNotificationsContent();
      case 'profile':
        return renderProfileContent();
      default:
        return renderHomeContent();
    }
  };
  
  // Sayfa başlığı
  const getPageTitle = () => {
    switch(activeTab) {
      case 'home':
        return 'Ana Sayfa';
      case 'search':
        return 'Keşfet';
      case 'notifications':
        return 'Bildirimler';
      case 'profile':
        return 'Profil';
      default:
        return 'MiniApp';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-[#181f2a] via-[#232b3e] to-[#181f2a]">
        <div className="text-center glass-card p-10 animate-fade-in">
          <Spinner size="xl" color="primary" />
          <p className="mt-4 text-gray-300">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <MiniAppLayout withBottomNav>
      <MiniAppHeader 
        title={getPageTitle()} 
        showBackButton={activeTab !== 'home'}
        onBackClick={() => setActiveTab('home')}
        rightSlot={
          <button 
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800"
            onClick={() => webApp?.HapticFeedback?.impactOccurred('light')}
          >
            <span className="i-mdi-dots-vertical text-xl"></span>
          </button>
        }
      />
      
      <main className="flex-1 px-4 pt-2 pb-4">
        {loading ? (
          <div className="flex flex-col gap-4">
            <MiniAppSkeleton variant="rectangle" height={160} />
            <div className="grid grid-cols-2 gap-3">
              <MiniAppSkeleton variant="rectangle" height={120} />
              <MiniAppSkeleton variant="rectangle" height={120} />
            </div>
            <MiniAppSkeleton variant="rectangle" height={200} />
          </div>
        ) : (
          renderContent()
        )}
      </main>
      
      <MiniAppBottomNav
        items={navItems}
        activeKey={activeTab}
        onItemClick={setActiveTab}
      />
    </MiniAppLayout>
  );
};

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <UserProvider>
          <SessionProvider>
            <ActiveSessionProvider>
              <WebSocketProvider>
                <Router>
                  <Routes>
                    {/* Telegram MiniApp Demo Sayfası */}
                    <Route path="/miniapp" element={<MiniAppDemo />} />
                    
                    {/* Diğer sayfalar */}
                    <Route path="/*" element={
                      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
                        <Sidebar />
                        <div className="md:ml-64 transition-all duration-300 relative">
                          <Header />
                          <main className="p-4 md:p-6 pb-20 md:pb-6 tg-height-fix">
                            <div className="mb-4 flex items-center gap-2">
                              <div
                                className={`w-3 h-3 rounded-full ${
                                  isWsConnected ? 'bg-green-500' : 'bg-red-500'
                                }`}
                              />
                              <span className="text-sm text-gray-600 dark:text-gray-300">
                                {isWsConnected ? 'Bağlı' : 'Bağlantı Kesik'}
                              </span>
                            </div>

                            <Suspense fallback={<Spinner isLoading={true} size="xl" variant="glassEffect" />}>
                              <ErrorBoundary>
                                <PageTransition>
                                  <Routes>
                                    {/* Ana rotalar */}
                                    <Route path="/" element={<Navigate to="/miniapp" replace />} />
                                    {/* Diğer rotalar */}
                                    <Route path="system-status" element={<SystemStatus />} />
                                    <Route path="system/errors" element={<ErrorReports />} />
                                    <Route path="system/websocket" element={<WebSocketManager />} />
                                  </Routes>
                                </PageTransition>
                              </ErrorBoundary>
                            </Suspense>
                          </main>
                        </div>
                        <ThemeSwitcher />
                        {getTestMode() && <TestModeIndicator />}
                      </div>
                    } />
                  </Routes>
                  <ToastContainer position="bottom-right" theme="dark" />
                </Router>
              </WebSocketProvider>
            </ActiveSessionProvider>
          </SessionProvider>
        </UserProvider>
      </QueryClientProvider>
    </Provider>
  );
};

export default App; 