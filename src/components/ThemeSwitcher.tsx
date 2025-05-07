import React, { useEffect, useState } from 'react';
import { ThemeType, applyTheme, loadSavedTheme } from '../utils/themeManager';
import '../styles/theme-switcher.css';
import '../styles/themes.css';

interface ThemeSwitcherProps {
  className?: string;
}

const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ className = '' }) => {
  const [theme, setTheme] = useState<ThemeType>('corporate');
  
  // Sayfa yüklendiğinde kaydedilmiş tema tercihini yükle
  useEffect(() => {
    const savedTheme = loadSavedTheme();
    setTheme(savedTheme);
  }, []);
  
  // Tema değiştirme işlemi
  const handleThemeChange = (newTheme: ThemeType) => {
    applyTheme(newTheme);
    setTheme(newTheme);
  };
  
  // Toggle butonun değeri değiştiğinde tema değiştir
  const handleToggleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTheme: ThemeType = e.target.checked ? 'cyberpunk' : 'corporate';
    handleThemeChange(newTheme);
  };

  return (
    <div className={`theme-switcher-container ${className}`}>
      {/* Tooltip */}
      <div className="theme-tooltip">
        {theme === 'corporate' ? 'Cyberpunk Moda Geç' : 'Kurumsal Moda Geç'}
      </div>
      
      {/* Tema değiştirici toggle */}
      <label className="theme-switcher-toggle">
        <input 
          type="checkbox" 
          checked={theme === 'cyberpunk'}
          onChange={handleToggleChange}
        />
        <span className={`theme-switcher-slider ${theme}`}>
          <div className="theme-labels">
            <span>CORP</span>
            <span>CYBER</span>
          </div>
        </span>
      </label>
    </div>
  );
};

export default ThemeSwitcher; 