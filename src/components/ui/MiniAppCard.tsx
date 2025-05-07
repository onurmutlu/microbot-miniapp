import React from 'react';

interface MiniAppCardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  className?: string;
  onClick?: () => void;
  glass?: boolean;
  noPadding?: boolean;
  elevated?: boolean;
  bordered?: boolean;
  disabled?: boolean;
  interactive?: boolean;
  headerSlot?: React.ReactNode;
  footerSlot?: React.ReactNode;
}

const MiniAppCard: React.FC<MiniAppCardProps> = ({
  children,
  title,
  subtitle,
  icon,
  className = '',
  onClick,
  glass = false,
  noPadding = false,
  elevated = false,
  bordered = true,
  disabled = false,
  interactive = false,
  headerSlot,
  footerSlot,
}) => {
  // Kart stilleri - mobil ekranlarda rahat dokunulabilir ve görüntülenebilir
  const cardBaseStyles = `
    w-full
    rounded-xl
    overflow-hidden
    ${!noPadding ? 'p-4' : ''}
    ${elevated ? 'shadow-lg dark:shadow-gray-900/30' : 'shadow-sm'}
    ${bordered ? 'border border-gray-200 dark:border-gray-800' : ''}
    ${glass ? 'bg-white/10 dark:bg-gray-800/20 backdrop-blur-md' : 'bg-white dark:bg-gray-800'}
    ${disabled ? 'opacity-60 pointer-events-none' : ''}
    ${interactive ? 'hover:scale-[1.02] active:scale-[0.98] transition-transform cursor-pointer' : ''}
    ${onClick && !disabled ? 'cursor-pointer' : ''}
    ${interactive && !disabled ? 'hover:border-blue-500/50 dark:hover:border-blue-400/50' : ''}
    transition-all duration-200
  `;

  // Tüm CSS sınıflarını birleştir
  const cardClasses = `${cardBaseStyles} ${className}`.trim();
  
  // Kart interaktif ise tıklama olayını ekle
  const handleClick = () => {
    if (onClick && !disabled) {
      onClick();
    }
  };
  
  return (
    <div 
      className={cardClasses} 
      onClick={handleClick}
      role={onClick ? 'button' : 'article'}
      tabIndex={onClick && !disabled ? 0 : undefined}
    >
      {/* Kart başlığı */}
      {(title || subtitle || icon || headerSlot) && (
        <div className={`flex items-center gap-3 ${!noPadding ? 'mb-3' : 'p-4 pb-0'}`}>
          {/* İkon */}
          {icon && (
            <div className="flex-shrink-0">
              {icon}
            </div>
          )}
          
          {/* Başlık ve alt başlık */}
          {(title || subtitle) && (
            <div className="flex-grow min-w-0">
              {title && (
                <h3 className="text-base font-medium text-gray-900 dark:text-white truncate">
                  {title}
                </h3>
              )}
              
              {subtitle && (
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-0.5">
                  {subtitle}
                </p>
              )}
            </div>
          )}
          
          {/* Özel header içeriği */}
          {headerSlot && (
            <div className="flex-shrink-0 ml-auto">
              {headerSlot}
            </div>
          )}
        </div>
      )}
      
      {/* Kart içeriği */}
      <div className={noPadding && (title || subtitle || icon) ? 'p-4 pt-3' : ''}>
        {children}
      </div>
      
      {/* Kart altbilgisi */}
      {footerSlot && (
        <div className={`mt-3 flex items-center justify-between ${noPadding ? 'p-4 pt-0' : ''}`}>
          {footerSlot}
        </div>
      )}
    </div>
  );
};

export default MiniAppCard; 