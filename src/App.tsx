import React, { useEffect, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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
        <div className="text-center glass-card p-10 animate-fade-in">
          <Spinner size="xl" color="primary" />
          <p className="mt-4 text-gray-300">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-[#181f2a] via-[#232b3e] to-[#181f2a] p-4">
        <div className="glass-card max-w-md w-full text-center animate-fade-in shadow-2xl border border-white/10 p-8 rounded-2xl">
          <div className="mb-6 flex justify-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#3f51b5] to-[#5c6bc0] flex items-center justify-center shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 10l-4 4l6 6l4-16l-18 7l4 2l2 6l3-4"/>
              </svg>
            </div>
          </div>
          <h1 className="text-3xl font-extrabold mb-4 text-white glass-gradient drop-shadow-lg">Kimlik Doğrulama Gerekli</h1>
          <p className="text-gray-200 mb-8">Lütfen Telegram üzerinden giriş yapın veya <span className="font-bold text-[#5c6bc0]">Test Modu</span> ile devam edin.</p>
          <button
            className="w-full py-3 px-6 rounded-xl glass-btn glass-gradient-primary text-white font-semibold shadow-lg transition-all duration-200 hover:shadow-[#3f51b5]/20 hover:shadow-xl"
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
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/message-templates" element={<MessageTemplates />} />
              <Route path="/user-settings" element={<UserSettings />} />
              <Route path="/system-status" element={<SystemStatus />} />
              <Route path="/dm-panel" element={<DMPanel />} />
              <Route path="/auto-reply-rules" element={<AutoReplyRules />} />
              <Route path="/groups" element={<GroupList />} />
              <Route path="/join-group" element={<JoinGroupForm />} />
              <Route path="/telegram-groups" element={<GroupsList />} />
              <Route path="/message-send" element={<MessageSend />} />
              <Route path="/websocket-test" element={<WebSocketTest />} />
              <Route path="/scheduler" element={<SchedulerPage />} />
              <Route path="/cron-guide" element={<CronGuidePage />} />
            </Routes>
          </Suspense>
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
        <SessionProvider>
          <Router>
            <AppContent />
          </Router>
        </SessionProvider>
      </QueryClientProvider>
    </Provider>
  );
};

export default App; 