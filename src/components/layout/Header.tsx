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
  ShieldExclamationIcon
} from '@heroicons/react/24/outline';

const Header: React.FC = () => {
  const dispatch = useDispatch();
  const { user, logout } = useAuth();
  const [darkMode, setDarkMode] = useState(false);
  const [hasActiveSession, setHasActiveSession] = useState<boolean>(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const isTestMode = getTestMode();

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
    <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg shadow-sm px-6 py-3 sticky top-0 left-0 right-0 z-10 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/" className="text-xl font-bold text-gray-800 dark:text-white">
            MicroBot <span className="text-xs text-[#3f51b5] dark:text-[#5c6bc0]">Beta</span>
          </Link>
          
          {isTestMode && (
            <div className="bg-red-500 text-white text-xs px-2 py-1 rounded-full flex items-center">
              <BeakerIcon className="w-3 h-3 mr-1" />
              Test Modu
            </div>
          )}
        </div>
        
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
          <div className="relative">
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
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl py-1 z-20 border border-gray-200 dark:border-gray-700">
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
    </header>
  );
};

export default Header; 