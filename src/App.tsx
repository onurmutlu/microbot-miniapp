import React, { useEffect, Suspense } from 'react';
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
              <Routes>
                {/* Korumasız Rotalar */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/telegram-setup" element={<TelegramSetup />} />
                
                {/* Protected Routes */}
                <Route
                  path="/"
                  element={
                    <LoginGuard>
                      <HomePage />
                    </LoginGuard>
                  }
                />
                <Route
                  path="/dashboard"
                  element={
                    <LoginGuard>
                      <Dashboard />
                    </LoginGuard>
                  }
                />
                <Route
                  path="/message-templates"
                  element={
                    <LoginGuard>
                      <MessageTemplates />
                    </LoginGuard>
                  }
                />
                <Route
                  path="/user-settings"
                  element={
                    <LoginGuard>
                      <UserSettings />
                    </LoginGuard>
                  }
                />
                <Route
                  path="/system-status"
                  element={
                    <LoginGuard>
                      <SystemStatus />
                    </LoginGuard>
                  }
                />
                <Route
                  path="/dm-panel"
                  element={
                    <LoginGuard>
                      <DMPanel />
                    </LoginGuard>
                  }
                />
                <Route
                  path="/auto-reply-rules"
                  element={
                    <LoginGuard>
                      <AutoReplyRules />
                    </LoginGuard>
                  }
                />
                <Route
                  path="/groups"
                  element={
                    <LoginGuard>
                      <GroupList />
                    </LoginGuard>
                  }
                />
                <Route
                  path="/join-group"
                  element={
                    <LoginGuard>
                      <JoinGroupForm />
                    </LoginGuard>
                  }
                />
                <Route
                  path="/telegram-groups"
                  element={
                    <LoginGuard>
                      <GroupsList />
                    </LoginGuard>
                  }
                />
                <Route
                  path="/message-send"
                  element={
                    <LoginGuard>
                      <MessageSend />
                    </LoginGuard>
                  }
                />
                <Route
                  path="/websocket-test"
                  element={
                    <LoginGuard>
                      <WebSocketTest />
                    </LoginGuard>
                  }
                />
                <Route
                  path="/scheduler"
                  element={
                    <LoginGuard>
                      <SchedulerPage />
                    </LoginGuard>
                  }
                />
                <Route
                  path="/cron-guide"
                  element={
                    <LoginGuard>
                      <CronGuidePage />
                    </LoginGuard>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <LoginGuard>
                      <UserSettings />
                    </LoginGuard>
                  }
                />
                <Route
                  path="/sessions"
                  element={
                    <LoginGuard>
                      <SessionListPage />
                    </LoginGuard>
                  }
                />
                <Route
                  path="/session/:id"
                  element={
                    <LoginGuard>
                      <SessionPage />
                    </LoginGuard>
                  }
                />
                <Route
                  path="/new-session"
                  element={
                    <LoginGuard>
                      <NewSessionPage />
                    </LoginGuard>
                  }
                />
                <Route
                  path="/sse-demo"
                  element={
                    <LoginGuard>
                      <SSEDemo />
                    </LoginGuard>
                  }
                />
                <Route
                  path="/sse-client-demo"
                  element={
                    <LoginGuard>
                      <SSEClientDemo />
                    </LoginGuard>
                  }
                />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </ErrorBoundary>
          </Suspense>
        </main>
      </div>
      <MobileNavigation />
      <ErrorBoundary>
        <ToastContainer
          position="top-right"
          autoClose={1000}
          hideProgressBar={false}
          newestOnTop={true}
          closeOnClick={true}
          rtl={false}
          pauseOnFocusLoss={false}
          draggable={true}
          pauseOnHover={false}
          theme="light"
          limit={1}
          closeButton={true}
          toastStyle={{
            border: '1px solid rgba(0,0,0,0.1)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            fontWeight: 'bold'
          }}
          style={{
            width: 'auto',
            maxWidth: '320px'
          }}
        />
      </ErrorBoundary>
      <TestModeIndicator />
    </div>
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
                  <AppContent />
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