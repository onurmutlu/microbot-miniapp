import { useState, useEffect, useCallback } from 'react';
import { ThemeType, applyTheme, toggleTheme as toggleThemeUtil, getThemePreference } from '../utils/themeManager';

export const useTheme = () => {
  const [theme, setTheme] = useState<ThemeType>(getThemePreference);
  
  // Temayı belirli bir değere ayarlar
  const setThemeValue = useCallback((newTheme: ThemeType) => {
    applyTheme(newTheme);
    setTheme(newTheme);
  }, []);
  
  // Temalar arasında geçiş yapar
  const toggleTheme = useCallback(() => {
    const newTheme = toggleThemeUtil();
    setTheme(newTheme);
    return newTheme;
  }, []);
  
  // Tema sınıflarını conditional olarak döndürür
  const themeClass = (options: { 
    base?: string;
    corporate?: string;
    cyberpunk?: string;
  }) => {
    const { base = '', corporate = '', cyberpunk = '' } = options;
    return `${base} ${theme === 'corporate' ? corporate : cyberpunk}`;
  };

  // Tema özellikleri
  const themeProperties = {
    isDark: true, // Her iki temamız da dark
    isCyberpunk: theme === 'cyberpunk',
    isCorporate: theme === 'corporate',
    name: theme,
    displayName: theme === 'corporate' ? 'Kurumsal' : 'Cyberpunk',
    primaryColor: theme === 'corporate' ? 'bg-blue-600' : 'bg-cyber-neon-purple',
    textColor: theme === 'corporate' ? 'text-gray-100' : 'text-cyan-50',
    bgColor: theme === 'corporate' ? 'bg-gray-900' : 'bg-cyber-bg'
  };
  
  // Tema ayarlandığında ve bileşen mount edildiğinde, temayı uygula
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);
  
  return {
    theme,
    setTheme: setThemeValue,
    toggleTheme,
    themeClass,
    ...themeProperties
  };
};

export default useTheme; 