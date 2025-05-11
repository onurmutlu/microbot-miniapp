import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { setTheme } from '../../store/slices/uiSlice';
import { useAuth } from '../../hooks/useAuth';
import { getTestMode } from '../../utils/testMode';
import {
  SunIcon,
  MoonIcon,
  BellIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  BeakerIcon,
  ShieldCheckIcon,
  ShieldExclamationIcon,
  ArrowsRightLeftIcon
} from '@heroicons/react/24/outline';
import SSENotificationCenter from '../SSENotificationCenter';
import { isMiniApp } from '../../utils/env';
import WebSocketStatusIndicator from './WebSocketStatusIndicator';

const Header: React.FC = () => {
  const dispatch = useDispatch();
  const { user, logout } = useAuth();
  const [darkMode, setDarkMode] = useState(false);
  const [hasActiveSession, setHasActiveSession] = useState<boolean>(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const isTestMode = getTestMode();
  
  // Aktif grupları saklayacak olan değişken
  const [activeGroups, setActiveGroups] = useState<string[]>([]);

  // Telegram WebApp'i genişletme fonksiyonu
  const expandMiniApp = () => {
    if (isMiniApp() && window.Telegram?.WebApp) {
      window.Telegram.WebApp.expand();
    }
  };
  
  // Aktif grupları yükle
  useEffect(() => {
    const loadActiveGroups = async () => {
      try {
        // Bu örnek için sabit grup ID'leri kullanıyoruz
        // Gerçek bir uygulamada API'den alınabilir
        setActiveGroups(['group1', 'group2', 'notifications']);
      } catch (error) {
        console.error('Gruplar yüklenirken hata:', error);
      }
    };
    
    loadActiveGroups();
  }, []);

  useEffect(() => {
    // Karanlık mod için isteği kontrol et
    const isDark = localStorage.getItem('darkMode') === 'true' || window.matchMedia('(prefers-color-scheme: dark)').matches;
    setDarkMode(isDark);
    applyTheme(isDark);
    
    // Tema değişikliklerini dinle
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', handleThemeChange);
    
    // Aktif oturum kontrolü
    const checkSession = () => {
      setHasActiveSession(localStorage.getItem('telegram_session') !== null);
    };
    
    // İlk yükleme kontrolü
    checkSession();
    
    // Local storage değişikliğini dinle
    window.addEventListener('storage', checkSession);
    
    return () => {
      mediaQuery.removeEventListener('change', handleThemeChange);
      window.removeEventListener('storage', checkSession);
    };
  }, []);

  useEffect(() => {
    // Profil dropdown dışında tıklandığında menüyü kapat
    const handleClickOutside = (event: MouseEvent) => {
      if (showDropdown && !(event.target as Element).closest('.user-menu-container')) {
        setShowDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDropdown]);

  const handleThemeChange = (e: MediaQueryListEvent) => {
    const newDarkMode = e.matches;
    setDarkMode(newDarkMode);
    applyTheme(newDarkMode);
  };

  const toggleTheme = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode.toString());
    applyTheme(newDarkMode);
  };

  const applyTheme = (isDark: boolean) => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  return (
    <header className="sticky top-0 z-40 glass-card bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200/30 dark:border-gray-700/30">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center space-x-4">
          <div className="font-bold text-lg hidden md:block text-gray-800 dark:text-white">
            MicroBot <span className="text-xs font-normal text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded dark:text-indigo-300 dark:bg-indigo-900">Mini App</span>
          </div>
          
          {/* Telegram WebApp butonu - sadece MiniApp modunda göster */}
          {isMiniApp() && (
            <button
              className="p-2 glass-btn text-white rounded-lg hover:bg-indigo-600 bg-[#3f51b5]"
              onClick={expandMiniApp}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 01-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 110-2h4a1 1 0 011 1v4a1 1 0 11-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 112 0v1.586l2.293-2.293a1 1 0 111.414 1.414L6.414 15H8a1 1 0 110 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 110-2h1.586l-2.293-2.293a1 1 0 111.414-1.414L15 13.586V12a1 1 0 011-1z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          )}
        </div>

        <div className="flex items-center space-x-4">
          {/* Bildirim Merkezi - z-index ve pozisyonu düzeltilmiş */}
          <div className="notification-center-wrapper relative z-[var(--z-dropdown)]">
            <SSENotificationCenter 
              channelIds={activeGroups} 
              maxNotifications={100}
              showUnreadBadge={true}
              onNotificationClick={(notification) => {
                // Bildirim tıklama işlemlerini burada yapabilirsiniz
                if (notification.channelId) {
                  // Grupla ilgili bir işlem yapılabilir
                  console.log(`${notification.channelId} kanalından bildirim tıklandı`);
                }
              }}
            />
          </div>
          
          {/* Kullanıcı Alanı */}
          <div className="flex items-center space-x-3">
            {/* Oturum durumu */}
            <Link to="/settings" className="flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-sm">
              {hasActiveSession ? (
                <>
                  <ShieldCheckIcon className="w-4 h-4 text-green-500" />
                  <span className="text-green-600 dark:text-green-400">Oturum Aktif</span>
                </>
              ) : (
                <>
                  <ShieldExclamationIcon className="w-4 h-4 text-red-500" />
                  <span className="text-red-600 dark:text-red-400">Oturum Gerekiyor</span>
                </>
              )}
            </Link>
            
            {/* WebSocket durumu göstergesi */}
            <Link to="/system/websocket" className="relative p-2 rounded-full hover:bg-gray-100/50 dark:hover:bg-gray-800/50">
              <WebSocketStatusIndicator />
            </Link>
            
            {/* Tema değiştirme butonu */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
              aria-label="Toggle dark mode"
            >
              {darkMode ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
            </button>
            
            {/* Bildirimler */}
            <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 relative">
              <BellIcon className="w-5 h-5" />
              <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></div>
            </button>
            
            {/* Kullanıcı menüsü */}
            <div className="relative user-menu-container z-[var(--z-dropdown)]">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center space-x-2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                  {user?.photo_url ? (
                    <img src={user.photo_url} alt={user.username} className="w-full h-full object-cover" />
                  ) : (
                    <UserCircleIcon className="w-7 h-7 text-gray-500" />
                  )}
                </div>
              </button>
              
              {showDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl py-1 z-[var(--z-dropdown)] border border-gray-200 dark:border-gray-700">
                  <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                    <div className="font-medium text-sm text-gray-800 dark:text-white">{user?.first_name} {user?.last_name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">@{user?.username}</div>
                  </div>
                  <Link
                    to="/settings"
                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => setShowDropdown(false)}
                  >
                    Ayarlar
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setShowDropdown(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Çıkış Yap
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header; 