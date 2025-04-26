import React, { useState, useEffect } from 'react';
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
  BeakerIcon
} from '@heroicons/react/24/outline';

const Header: React.FC = () => {
  const dispatch = useDispatch();
  const { user, logout } = useAuth();
  // Default theme değeri 'light' ve güvenli şekilde ui.theme'i oku
  const theme = useSelector((state: RootState) => state.ui?.theme) || 'light';
  const [showDropdown, setShowDropdown] = useState(false);
  const isTestMode = getTestMode();

  // Tarayıcı tema ayarlarına göre ilk değeri ayarla
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
      dispatch(setTheme(savedTheme));
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      dispatch(setTheme('dark'));
    }
  }, [dispatch]);

  // Theme değiştiğinde body'ye class ekle/çıkar
  useEffect(() => {
    if (theme === 'dark') {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    dispatch(setTheme(theme === 'light' ? 'dark' : 'light'));
  };

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            title={theme === 'light' ? 'Karanlık Moda Geç' : 'Aydınlık Moda Geç'}
          >
            {theme === 'light' ? (
              <MoonIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            ) : (
              <SunIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            )}
          </button>
          
          {isTestMode && (
            <div className="bg-red-500 text-white text-xs px-2 py-1 rounded-full flex items-center">
              <BeakerIcon className="w-3 h-3 mr-1" />
              Test Modu
            </div>
          )}
        </div>

        <div className="flex items-center space-x-4">
          <button 
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            title="Bildirimler"
          >
            <BellIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>

          <div className="relative">
            <button 
              className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={toggleDropdown}
            >
              {user?.photo_url ? (
                <img
                  src={user.photo_url}
                  alt={user.username || user.first_name}
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <UserCircleIcon className="w-8 h-8 text-gray-500 dark:text-gray-400" />
              )}
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {user?.first_name} {user?.last_name}
              </span>
            </button>

            {showDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-2 z-10">
                <a 
                  href="/settings" 
                  className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <div className="flex items-center">
                    <Cog6ToothIcon className="w-4 h-4 mr-2" />
                    Ayarlar
                  </div>
                </a>
                <button
                  onClick={logout}
                  className="block w-full px-4 py-2 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
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