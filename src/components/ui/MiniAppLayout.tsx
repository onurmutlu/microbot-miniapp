import React, { useEffect, useState } from 'react';
import { useTelegramWebApp } from '../../hooks/useTelegramWebApp';

interface MiniAppLayoutProps {
  children: React.ReactNode;
  withBottomNav?: boolean;
  withHeader?: boolean;
  className?: string;
}

const MiniAppLayout: React.FC<MiniAppLayoutProps> = ({
  children,
  withBottomNav = false,
  withHeader = false,
  className = '',
}) => {
  const { webApp, themeParams, ready } = useTelegramWebApp();
  const [mounted, setMounted] = useState(false);

  // Component mount olduğunda dark mode'u ayarla
  useEffect(() => {
    setMounted(true);
    // Telegram'ın varsayılan temasını kontrol et
    const isDarkMode = themeParams?.text_color && 
      (themeParams.text_color === '#ffffff' || 
      themeParams.text_color.toLowerCase() === '#fff' ||
      calculateLuminance(themeParams.text_color) > 0.7);
      
    // Temayı ayarla
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Viewport yüksekliğini CSS değişkeni olarak ayarla
    const updateViewportHeight = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    
    updateViewportHeight();
    window.addEventListener('resize', updateViewportHeight);
    
    return () => window.removeEventListener('resize', updateViewportHeight);
  }, [themeParams]);
  
  // Luminance hesaplama yardımcı fonksiyonu
  const calculateLuminance = (hexColor: string) => {
    const rgb = hexColor.replace('#', '').match(/.{2}/g)?.map(x => parseInt(x, 16)) || [0, 0, 0];
    const [r, g, b] = rgb.map(c => {
      c = c / 255.0;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };

  // Ana stiller - 100dvh ve safe area optimizasyonları
  const baseStyles = `
    min-h-[100dvh]
    w-full
    bg-gray-50 dark:bg-gray-900
    text-gray-900 dark:text-gray-50
    flex flex-col
    overflow-x-hidden
    ${withBottomNav ? 'pb-[calc(4rem+env(safe-area-inset-bottom,0))]' : 'pb-[env(safe-area-inset-bottom,0)]'}
    ${withHeader ? 'pt-16' : 'pt-4'}
    px-[env(safe-area-inset-left,0)] 
    pr-[env(safe-area-inset-right,0)]
  `;

  // Tüm CSS sınıflarını birleştir
  const layoutClasses = `${baseStyles} ${className}`.trim();

  return (
    <div className={layoutClasses}>
      {!mounted ? (
        <div className="flex items-center justify-center min-h-[60dvh]">
          <div className="animate-pulse h-24 w-24 rounded-full bg-blue-500/20 flex items-center justify-center">
            <span className="i-mdi-loading animate-spin h-12 w-12 text-blue-500"></span>
          </div>
        </div>
      ) : (
        <>
          {children}
        </>
      )}
    </div>
  );
};

export default MiniAppLayout; 