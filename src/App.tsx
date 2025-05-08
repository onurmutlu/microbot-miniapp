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
import { WebSocketProvider, useWebSocketContext } from './contexts/WebSocketContext';
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
  // Test modu ayarını kontrol et, sadece null ise varsayılan değer ayarla
  const testModeStorage = localStorage.getItem('test_mode');
  if (testModeStorage === null) {
    // Sadece ilk kullanımda ayarla, varsayılan olarak açık
    setTestMode(true);
  }
  
  // Tarayıcı konsolundan erişim için global fonksiyon
  if (typeof window !== 'undefined') {
    // toggleTestMode.ts'den import edilen fonksiyonu kullan
    import('./utils/toggleTestMode').then(module => {
      (window as any).toggleTestMode = module.default;
    });
  }
}

const AppRoutes: React.FC = () => {
  const { isConnected } = useWebSocketContext();
  const [hasToken, setHasToken] = useState<boolean>(false);
  const [checkingAuth, setCheckingAuth] = useState<boolean>(true); // Kimlik doğrulama kontrolü yapılıyor mu?
  
  // Token kontrolünü useEffect içinde yap
  useEffect(() => {
    const checkTokenAndAuth = () => {
      // Test modunda ise otomatik token oluşturma
      if (getTestMode() && !localStorage.getItem('access_token')) {
        localStorage.setItem('access_token', 'test-token');
        setHasToken(true);
        setCheckingAuth(false);
        return;
      }
      
      const token = localStorage.getItem('access_token');
      setHasToken(!!token);
      setCheckingAuth(false);
    };
    
    checkTokenAndAuth();
    
    // Storage değişikliklerini dinle
    const handleStorageChange = () => {
      checkTokenAndAuth();
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);
  
  // Kimlik doğrulama kontrolü yapılırken yükleme ekranı göster
  if (checkingAuth) {
    return <Spinner isLoading={true} size="xl" variant="glassEffect" />;
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
                isConnected ? 'bg-green-500' : 'bg-red-500'
              }`}
            />
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {isConnected ? 'Bağlı' : 'Bağlantı Kesik'}
            </span>
          </div>

          <Suspense fallback={<Spinner isLoading={true} size="xl" variant="glassEffect" />}>
            <ErrorBoundary>
              <PageTransition>
                <Routes>
                  {/* Ana rotalar */}
                  <Route path="/" element={
                    hasToken 
                      ? <Navigate to="/dashboard" replace /> 
                      : <Navigate to="/login" replace />
                  } />
                  
                  <Route path="/login" element={
                    hasToken 
                      ? <Navigate to="/dashboard" replace /> 
                      : <LoginPage />
                  } />
                  
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
                  <Route path="system/errors" element={
                    <LoginGuard>
                      <ErrorReports />
                    </LoginGuard>
                  } />
                  <Route path="system/websocket" element={
                    <LoginGuard>
                      <WebSocketManager />
                    </LoginGuard>
                  } />
                </Routes>
              </PageTransition>
            </ErrorBoundary>
          </Suspense>
        </main>
      </div>
      <ThemeSwitcher />
      {getTestMode() && <TestModeIndicator />}
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
                  <Routes>
                    {/* Telegram MiniApp Demo Sayfası */}
                    <Route path="/miniapp" element={<MiniAppDemo />} />
                    
                    {/* Diğer sayfalar */}
                    <Route path="/*" element={<AppRoutes />} />
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