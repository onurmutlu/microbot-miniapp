import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastContainer } from 'react-toastify';
import { store } from './store';
import { useAuth } from './hooks/useAuth';
import { useWebSocket } from './hooks/useWebSocket';
import { runConnectionTests } from './utils/connectionTest';
import { checkEnv } from './utils/env';
import { setupTestModeToggle, setTestMode } from './utils/testMode';
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
import TestModeIndicator from './components/debug/TestModeIndicator';
import 'react-toastify/dist/ReactToastify.css';
import './styles/glass.css';

const queryClient = new QueryClient();

const dummyUser = {
  id: 'dummy',
  username: 'testuser',
  email: 'test@microbot.local',
  first_name: 'Test',
  last_name: 'User',
  photo_url: 'https://i.pravatar.cc/150?img=3'
};

// Geliştirme ortamında ise test modunu etkinleştir
if (import.meta.env.DEV) {
  // Test modunu etkinleştir
  setTestMode(true);
  
  // Konsol üzerinden test modunu değiştirme fonksiyonunu ekle
  setupTestModeToggle();
}

const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading, login } = useAuth();
  const { isConnected: isWsConnected } = useWebSocket();

  useEffect(() => {
    // Environment kontrolü
    if (!checkEnv()) {
      console.error('Eksik environment değişkenleri tespit edildi');
    }

    // Bağlantı testleri
    runConnectionTests();
  }, []);

  // Body'e class ekle
  useEffect(() => {
    document.body.classList.add('bg-gradient');
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-[#181f2a] via-[#232b3e] to-[#181f2a]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-[#181f2a] via-[#232b3e] to-[#181f2a] p-4">
        <div className="glass-card max-w-md w-full text-center animate-fade-in shadow-2xl border border-white/10 p-8 rounded-2xl">
          <div className="mb-6 flex justify-center">
            <div className="w-20 h-20 rounded-full bg-[#3f51b5] flex items-center justify-center shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 10l-4 4l6 6l4-16l-18 7l4 2l2 6l3-4"/>
              </svg>
            </div>
          </div>
          <h1 className="text-3xl font-extrabold mb-4 text-white drop-shadow-lg">Kimlik Doğrulama Gerekli</h1>
          <p className="text-gray-200 mb-8">Lütfen Telegram üzerinden giriş yapın veya <span className="font-bold text-[#5c6bc0]">Test Modu</span> ile devam edin.</p>
          <button
            className="w-full py-3 px-6 rounded-xl glass-btn text-white font-semibold shadow-lg transition-all duration-200 hover:shadow-[#3f51b5]/20 hover:shadow-xl"
            onClick={() => {
              login({ user: dummyUser, token: 'dummy-token' });
            }}
          >
            Test Modu ile Devam Et
          </button>
        </div>
        <TestModeIndicator />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-[#121212] dark:to-[#1a2035]">
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

          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/message-templates" element={<MessageTemplates />} />
            <Route path="/auto-reply-rules" element={<AutoReplyRules />} />
            <Route path="/group-list" element={<GroupList />} />
            <Route path="/message-send" element={<MessageSend />} />
            <Route path="/dm-panel" element={<DMPanel />} />
            <Route path="/scheduler" element={<SchedulerPage />} />
            <Route path="/cron-guide" element={<CronGuidePage />} />
            <Route path="/settings" element={<UserSettings />} />
            <Route path="/system-status" element={<SystemStatus />} />
          </Routes>
        </main>
      </div>
      <MobileNavigation />
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
      <TestModeIndicator />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <Router>
          <AppContent />
        </Router>
      </QueryClientProvider>
    </Provider>
  );
};

export default App; 