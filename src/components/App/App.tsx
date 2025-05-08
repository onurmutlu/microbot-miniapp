import React, { useState, useEffect } from "react";
import clsx from "clsx";
import styles from "./App.module.scss";
import { initAuth } from "../../utils/api";
import { getTestMode, setTestMode } from "../../utils/testMode";

import MessageTemplates from "../../pages/MessageTemplates";
import AutoReplyRules from "../../pages/AutoReplyRules";
import GroupList from "../../pages/GroupList";
import MessageSend from "../../pages/MessageSend";
import DMPanel from "../../pages/DMPanel";

export type AppProps = {
  className?: string;
};

type PageKey = 'templates' | 'replies' | 'groups' | 'send' | 'dm';

// Test modunu aktifleştir
if (typeof window !== 'undefined') {
  setTestMode(true);
  console.log('Test modu aktifleştirildi');
}

// Named export yerine default export kullan
const App: React.FC<AppProps> = ({ className }) => {
  const [currentPage, setCurrentPage] = useState<PageKey>('templates');
  const [authInitialized, setAuthInitialized] = useState<boolean>(false);

  useEffect(() => {
    const setupAuth = async () => {
      await initAuth();
      setAuthInitialized(true);
    };
    
    setupAuth();
  }, []);

  const renderPage = () => {
    switch (currentPage) {
      case 'templates':
        return <MessageTemplates />;
      case 'replies':
        return <AutoReplyRules />;
      case 'groups':
        return <GroupList />;
      case 'send':
        return <MessageSend />;
      case 'dm':
        return <DMPanel />;
      default:
        return <MessageTemplates />;
    }
  };

  return (
    <div className={clsx(styles.App, className)}>
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex justify-around py-2 z-10">
        <button
          onClick={() => setCurrentPage('templates')}
          className={`flex flex-col items-center p-2 ${currentPage === 'templates' ? 'text-blue-600' : 'text-gray-500'}`}
        >
          <span className="text-lg">📨</span>
          <span className="text-xs">Şablonlar</span>
        </button>
        <button
          onClick={() => setCurrentPage('replies')}
          className={`flex flex-col items-center p-2 ${currentPage === 'replies' ? 'text-blue-600' : 'text-gray-500'}`}
        >
          <span className="text-lg">🤖</span>
          <span className="text-xs">Yanıtlar</span>
        </button>
        <button
          onClick={() => setCurrentPage('groups')}
          className={`flex flex-col items-center p-2 ${currentPage === 'groups' ? 'text-blue-600' : 'text-gray-500'}`}
        >
          <span className="text-lg">👥</span>
          <span className="text-xs">Gruplar</span>
        </button>
        <button
          onClick={() => setCurrentPage('send')}
          className={`flex flex-col items-center p-2 ${currentPage === 'send' ? 'text-blue-600' : 'text-gray-500'}`}
        >
          <span className="text-lg">📤</span>
          <span className="text-xs">Gönder</span>
        </button>
        <button
          onClick={() => setCurrentPage('dm')}
          className={`flex flex-col items-center p-2 ${currentPage === 'dm' ? 'text-blue-600' : 'text-gray-500'}`}
        >
          <span className="text-lg">💬</span>
          <span className="text-xs">DM</span>
        </button>
      </div>

      <div className="pb-16 mb-4">
        {!authInitialized ? (
          <div className="flex justify-center items-center h-screen">
            <div className="text-center">
              <p className="mb-2">Yükleniyor...</p>
              <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
          </div>
        ) : (
          renderPage()
        )}
      </div>
    </div>
  );
};

export default App;
