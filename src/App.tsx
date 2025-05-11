import React, { useEffect, Suspense, useState, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider, useSelector, useDispatch } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastContainer, toast } from 'react-toastify';
import { store, RootState } from './store';
import { useAuth } from './hooks/useAuth';
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
import ContentOptimizationPage from './pages/ContentOptimizationPage';
import GroupAnalysisPage from './pages/GroupAnalysisPage';
import TestModeIndicator from './components/debug/TestModeIndicator';
import Spinner from './components/ui/Spinner';
import { SessionProvider } from './context/SessionContext';
import 'react-toastify/dist/ReactToastify.css';
import './styles/glass.css';
import './styles/neon-effects.css';
import './styles/telegramMobile.css';
import { ActiveSessionProvider } from './hooks/useActiveSession';
import { WebSocketProvider, useWebSocketContext } from './contexts/WebSocketContext';
import ErrorBoundary from './components/ErrorBoundary';
import LoginPage from './pages/LoginPage';
import { UserProvider } from './context/UserContext';
import LoginGuard from './components/LoginGuard';
import SSEDemo from './pages/SSEDemo';
import SSEClientDemo from './pages/SSEClientDemo';
import PageTransition from './components/ui/PageTransition';
import ThemeSwitcher from './components/ThemeSwitcher';
import './styles/themes.css';
import { initTelegramApp } from './utils/telegramSDK';
import MiniAppDemo from './components/MiniAppDemo';
import ErrorReports from './pages/ErrorReports';
import WebSocketManager from './pages/WebSocketManager';
import { websocketService } from './services/websocket';
import { apiService } from './services/api';

// QueryClient - React Query için
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 300000 // 5 dakika
    }
  }
});

// API hata interceptor'u
apiService.setupInterceptors(
  (error) => {
    // Network hatası
    if (!error.response) {
      console.error('API ağ hatası:', error);
      return Promise.reject(error);
    }
    
    // Auth hataları
    if (error.response.status === 401) {
      // Token süresi dolmuş olabilir, oturumu kapat
      if (error.config && error.config.url !== '/auth/login' && error.config.url !== '/auth/telegram') {
        console.warn('Kimlik doğrulama hatası, oturum kapatılıyor');
        
        // LocalStorage temizleme
        localStorage.removeItem('access_token');
        localStorage.removeItem('token');
        localStorage.removeItem('telegram_user');
        
        // Sayfa yenileme ile oturumu kapat
        setTimeout(() => {
          window.location.href = '/login';
        }, 1500);
        
        toast.error('Oturumunuz sona erdi, yeniden giriş yapmalısınız', {
          autoClose: 3000
        });
      }
    }
    
    // Diğer hataları ilet
    return Promise.reject(error);
  }
);

// Geliştirme ortamında test modu ayarı
if (import.meta.env.DEV) {
  // Test modu ayarını kontrol et
  const testModeStorage = localStorage.getItem('test_mode');
  if (testModeStorage === null) {
    // İlk kullanımda varsayılan olarak açık
    setTestMode(true);
  }
  
  // Tarayıcı konsolundan erişim için
  if (typeof window !== 'undefined') {
    import('./utils/toggleTestMode').then(module => {
      (window as any).toggleTestMode = module.default;
    });
  }
}

// Ana uygulama rotaları
const AppRoutes: React.FC = () => {
  const dispatch = useDispatch();
  const { isConnected } = useWebSocketContext();
  const { isAuthenticated, isLoading, initializeAuth } = useAuth();
  const [networkStatus, setNetworkStatus] = useState<'online' | 'offline'>('online');
  
  // Backend bağlantı durumunu izle
  useEffect(() => {
    const checkConnection = async () => {
      try {
        // Basit bir endpoint'e istek at
        await apiService.get('/ping', { timeout: 3000 });
        setNetworkStatus('online');
      } catch (error) {
        setNetworkStatus('offline');
      }
    };
    
    // Periyodik kontrol
    checkConnection();
    const interval = setInterval(checkConnection, 30000); // 30 saniyede bir
    
    // Online/offline durumu izle
    const handleOnline = () => setNetworkStatus('online');
    const handleOffline = () => setNetworkStatus('offline');
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  // Kimlik doğrulama durumunu başlat
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);
  
  // Yükleniyor ekranı
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner isLoading={true} size="xl" variant="glassEffect" />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <Sidebar />
      <div className="md:ml-64 transition-all duration-300 relative">
        <Header />
        <main className="p-4 md:p-6 pb-20 md:pb-6 tg-height-fix">
          {/* Bağlantı durum göstergesi */}
          <div className="mb-4 flex items-center gap-2">
            <div className={`relative w-3 h-3 rounded-full ${
              isConnected && networkStatus === 'online' 
                ? 'bg-green-500' 
                : 'bg-red-500'
            }`}>
              {!isConnected && <span className="absolute -top-1 -right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>}
            </div>
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {isConnected && networkStatus === 'online' 
                ? 'Sunucu bağlantısı: Aktif' 
                : 'Sunucu bağlantısı: Kopuk'
              }
            </span>
            
            {networkStatus === 'offline' && (
              <span className="text-xs text-red-400 ml-2">
                (Çevrimdışı modu aktif)
              </span>
            )}
          </div>

          {/* Ana içerik */}
          <Suspense fallback={<Spinner isLoading={true} size="xl" variant="glassEffect" />}>
            <ErrorBoundary>
              <PageTransition>
                <Routes>
                  {/* Ana rotalar */}
                  <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} />
                  
                  {/* Login sayfası koruma olmadan */}
                  <Route path="/login" element={<LoginPage />} />
                  
                  {/* Korumalı sayfalar */}
                  <Route path="/dashboard" element={
                    <LoginGuard>
                      <Dashboard />
                    </LoginGuard>
                  } />
                  
                  <Route path="/message-templates" element={
                    <LoginGuard>
                      <MessageTemplates />
                    </LoginGuard>
                  } />
                  <Route path="/auto-reply-rules" element={
                    <LoginGuard>
                      <AutoReplyRules />
                    </LoginGuard>
                  } />
                  <Route path="/group-list" element={
                    <LoginGuard>
                      <GroupList />
                    </LoginGuard>
                  } />
                  <Route path="/message-send" element={
                    <LoginGuard>
                      <MessageSend />
                    </LoginGuard>
                  } />
                  <Route path="/dm-panel" element={
                    <LoginGuard>
                      <DMPanel />
                    </LoginGuard>
                  } />
                  <Route path="/scheduler" element={
                    <LoginGuard>
                      <SchedulerPage />
                    </LoginGuard>
                  } />
                  <Route path="/cron-guide" element={<CronGuidePage />} />
                  <Route path="/sessions" element={
                    <LoginGuard>
                      <SessionListPage />
                    </LoginGuard>
                  } />
                  <Route path="/sessions/new" element={
                    <LoginGuard>
                      <NewSessionPage />
                    </LoginGuard>
                  } />
                  <Route path="/sessions/:id" element={
                    <LoginGuard>
                      <SessionPage />
                    </LoginGuard>
                  } />
                  <Route path="/settings" element={
                    <LoginGuard>
                      <UserSettings />
                    </LoginGuard>
                  } />
                  <Route path="/sse-demo" element={
                    <LoginGuard>
                      <SSEDemo />
                    </LoginGuard>
                  } />
                  <Route path="/sse-client-demo" element={
                    <LoginGuard>
                      <SSEClientDemo />
                    </LoginGuard>
                  } />
                  <Route path="system-status" element={
                    <LoginGuard>
                      <SystemStatus />
                    </LoginGuard>
                  } />
                  <Route path="/system/errors" element={
                    <LoginGuard>
                      <ErrorReports />
                    </LoginGuard>
                  } />
                  <Route path="system/websocket" element={
                    <LoginGuard>
                      <WebSocketManager />
                    </LoginGuard>
                  } />
                  
                  {/* AI ve Analiz Sayfaları */}
                  <Route path="/ai/content-optimization" element={
                    <LoginGuard>
                      <ContentOptimizationPage />
                    </LoginGuard>
                  } />
                  <Route path="/ai/group-analysis" element={
                    <LoginGuard>
                      <GroupAnalysisPage />
                    </LoginGuard>
                  } />
                  
                  {/* Bulunamayan sayfalar */}
                  <Route path="*" element={
                    <div className="text-center p-10">
                      <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-200 mb-4">
                        Sayfa Bulunamadı
                      </h2>
                      <p className="text-gray-600 dark:text-gray-300 mb-6">
                        Aradığınız sayfa mevcut değil veya taşınmış olabilir.
                      </p>
                      <button 
                        onClick={() => window.history.back()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg"
                      >
                        Geri Dön
                      </button>
                    </div>
                  } />
                </Routes>
              </PageTransition>
            </ErrorBoundary>
          </Suspense>
        </main>
      </div>
      <MobileNavigation />
      <ThemeSwitcher />
      {getTestMode() && <TestModeIndicator />}
    </div>
  );
};

// Ana uygulama komponenti
const App: React.FC = () => {
  // İlk yüklenmede sayfa ayarları
  useEffect(() => {
    // Telegram Mini App ise
    if (isMiniApp() && window.Telegram?.WebApp) {
      // Body'e MiniApp class'ını ekle (CSS için)
      document.body.classList.add('is-telegram-miniapp');
      
      // Telegram WebApp başlat
      initTelegramApp();

      console.log('[App] Telegram MiniApp ortamı algılandı');
      console.log('[App] WebApp verileri:', {
        platform: window.Telegram.WebApp.platform || 'bilinmiyor',
        version: window.Telegram.WebApp.version || 'bilinmiyor',
        colorScheme: window.Telegram.WebApp.colorScheme || 'bilinmiyor',
        viewportHeight: window.Telegram.WebApp.viewportHeight,
        viewportStableHeight: window.Telegram.WebApp.viewportStableHeight,
        dataLength: window.Telegram.WebApp.initData?.length || 0,
        user: window.Telegram.WebApp.initDataUnsafe?.user || null
      });
      
      // Hazır olduğunu bildir
      window.Telegram.WebApp.ready();
      
      // Tam ekran yap
      window.Telegram.WebApp.expand();
      
      // Telegram'den gelen verileri kullanarak otomatik giriş yap
      const telegramUser = window.Telegram.WebApp.initDataUnsafe?.user;
      const initData = window.Telegram.WebApp.initData;
      
      if (telegramUser && initData) {
        console.log('[App] Telegram kullanıcı verileri bulundu, otomatik giriş deneniyor...');
        
        // LocalStorage'e Telegram verilerini kaydet
        localStorage.setItem('telegram_user', JSON.stringify(telegramUser));
        localStorage.setItem('is_miniapp_session', 'true');
        
        // Sayfa yüklendiğinde login işlemi LoginGuard tarafından yapılacak
        console.log('[App] Kullanıcı bilgileri saklandı, LoginGuard tarafından işlenecek');
      } else if (telegramUser) {
        console.warn('[App] Telegram kullanıcısı var fakat initData eksik');
        
        // Sadece kullanıcı bilgisine erişim varsa yine de kaydet
        localStorage.setItem('telegram_user', JSON.stringify(telegramUser));
        localStorage.setItem('is_miniapp_session', 'true');
        localStorage.setItem('init_data_missing', 'true');
      } else {
        console.error('[App] Telegram kullanıcı verileri eksik!');
      }

      // iOS Safe Area ayarlaması
      const setIOSSafeArea = () => {
        setTimeout(() => {
          const safeAreaTop = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--tg-viewport-stable-height'), 10) || 0;
          document.body.style.setProperty('--safe-area-inset-top', `${safeAreaTop}px`);
        }, 500);
      };
      
      setIOSSafeArea();
      window.addEventListener('resize', setIOSSafeArea);
    }
    
    // Tema tercihini kontrol et
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    }
    
    // Viewport yüksekliğini ayarla (iOS için)
    const setViewportHeight = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    
    setViewportHeight();
    window.addEventListener('resize', setViewportHeight);
    
    return () => {
      window.removeEventListener('resize', setViewportHeight);
    };
  }, []);

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
                    
                    {/* Diğer tüm sayfalar */}
                    <Route path="/*" element={<AppRoutes />} />
                  </Routes>
                  
                  {/* Toast mesajları */}
                  <ToastContainer 
                    position="bottom-right" 
                    theme="dark"
                    autoClose={3000}
                    newestOnTop
                    closeOnClick
                    pauseOnHover
                  />
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