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

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-[#181f2a] via-[#232b3e] to-[#181f2a]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-[#181f2a] via-[#232b3e] to-[#181f2a]">
        <div className="glass-card p-10 max-w-md w-full text-center animate-fade-in shadow-2xl border border-white/10">
          <h1 className="text-3xl font-extrabold mb-4 text-white drop-shadow-lg">Kimlik Doğrulama Gerekli</h1>
          <p className="text-gray-200 mb-6">Lütfen Telegram üzerinden giriş yapın veya <span className="font-bold text-primary-400">Test Modu</span> ile devam edin.</p>
          <button
            className="mt-4 px-6 py-2 rounded-lg glass-btn text-white font-semibold shadow-lg transition-all duration-200"
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
    <div className="min-h-screen bg-[#181f2a]">
      <Sidebar />
      <div className="ml-64">
        <Header />
        <main className="p-6">
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