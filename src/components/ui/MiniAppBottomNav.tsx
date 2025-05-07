import React from 'react';
import { useTelegramWebApp } from '../../hooks/useTelegramWebApp';

interface NavItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  onClick?: () => void;
  badge?: number | string;
}

interface MiniAppBottomNavProps {
  items: NavItem[];
  activeKey: string;
  onItemClick?: (key: string) => void;
  className?: string;
}

const MiniAppBottomNav: React.FC<MiniAppBottomNavProps> = ({
  items,
  activeKey,
  onItemClick,
  className = '',
}) => {
  // Safe area için padding ayarları
  const navBaseStyles = `
    fixed
    bottom-0
    left-0
    right-0
    flex
    items-center
    justify-around
    h-16
    bg-white
    dark:bg-gray-900
    border-t
    border-gray-200
    dark:border-gray-800
    pb-[env(safe-area-inset-bottom,0)]
    z-40
    backdrop-blur-md
    bg-opacity-90
    dark:bg-opacity-90
  `;

  // Tüm CSS sınıflarını birleştir
  const navClasses = `${navBaseStyles} ${className}`.trim();
  
  // Item'a tıklama olayını işle
  const handleItemClick = (key: string, onClick?: () => void) => {
    if (onClick) {
      onClick();
    }
    
    if (onItemClick) {
      onItemClick(key);
    }
  };
  
  return (
    <nav className={navClasses}>
      {items.map((item) => (
        <button
          key={item.key}
          className={`
            flex
            flex-col
            items-center
            justify-center
            h-full
            flex-1
            min-w-0
            transition-colors
            ${activeKey === item.key ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}
          `}
          onClick={() => handleItemClick(item.key, item.onClick)}
          aria-current={activeKey === item.key ? 'page' : undefined}
        >
          {/* İkon */}
          <div className="relative">
            <div className="text-2xl mb-1">
              {item.icon}
            </div>
            
            {/* Rozet (varsa) */}
            {item.badge && (
              <div className="absolute -top-1 -right-1 flex items-center justify-center min-w-5 h-5 rounded-full bg-red-500 text-white text-xs px-1">
                {typeof item.badge === 'number' && item.badge > 99 ? '99+' : item.badge}
              </div>
            )}
          </div>
          
          {/* Etiket */}
          <span className="text-xs truncate max-w-full px-1">
            {item.label}
          </span>
        </button>
      ))}
    </nav>
  );
};

export default MiniAppBottomNav; 