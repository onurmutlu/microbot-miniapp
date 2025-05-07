import React from 'react';
import { useTelegramWebApp } from '../../hooks/useTelegramWebApp';

interface MiniAppHeaderProps {
  title: string;
  showBackButton?: boolean;
  onBackClick?: () => void;
  rightSlot?: React.ReactNode;
  sticky?: boolean;
  transparent?: boolean;
  className?: string;
}

const MiniAppHeader: React.FC<MiniAppHeaderProps> = ({
  title,
  showBackButton = false,
  onBackClick,
  rightSlot,
  sticky = true,
  transparent = false,
  className = '',
}) => {
  const { webApp } = useTelegramWebApp();
  
  // Telegram BackButton'ı ile entegrasyon
  React.useEffect(() => {
    if (webApp?.BackButton && showBackButton) {
      webApp.BackButton.show();
      webApp.BackButton.onClick(handleBackClick);
      
      return () => {
        webApp.BackButton.hide();
        webApp.BackButton.onClick(() => {});
      };
    }
  }, [webApp, showBackButton]);
  
  const handleBackClick = () => {
    if (onBackClick) {
      onBackClick();
    }
  };
  
  // Header stilleri
  const headerBaseStyles = `
    w-full
    h-16
    px-4
    py-3
    flex
    items-center
    justify-between
    gap-2
    text-lg
    font-medium
    ${sticky ? 'sticky top-0 z-40' : ''}
    ${transparent 
      ? 'bg-transparent backdrop-blur-none' 
      : 'bg-white/80 dark:bg-gray-900/80 backdrop-blur-md'
    }
    ${sticky && !transparent ? 'border-b border-gray-200 dark:border-gray-800' : ''}
  `;

  // Tüm CSS sınıflarını birleştir
  const headerClasses = `${headerBaseStyles} ${className}`.trim();
  
  return (
    <header className={headerClasses}>
      <div className="flex items-center gap-2">
        {showBackButton && (
          <button 
            onClick={handleBackClick}
            className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Geri dön"
          >
            <span className="i-mdi-arrow-left text-xl"></span>
          </button>
        )}
        
        <h1 className="text-lg font-medium truncate max-w-[200px]">
          {title}
        </h1>
      </div>
      
      {rightSlot && (
        <div className="flex items-center">
          {rightSlot}
        </div>
      )}
    </header>
  );
};

export default MiniAppHeader; 