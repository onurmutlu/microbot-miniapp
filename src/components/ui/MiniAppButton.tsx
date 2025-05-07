import React from 'react';
import { useTelegramWebApp } from '../../hooks/useTelegramWebApp';

interface MiniAppButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'text' | 'neon' | 'gradient';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  haptic?: 'light' | 'medium' | 'heavy';
  rounded?: boolean;
}

const MiniAppButton: React.FC<MiniAppButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  fullWidth = false,
  icon,
  iconPosition = 'left',
  disabled = false,
  loading = false,
  className = '',
  type = 'button',
  haptic,
  rounded = false,
}) => {
  const { webApp } = useTelegramWebApp();
  
  // Buton boyutuna göre stil sınıfları
  const sizeClasses = {
    sm: 'h-9 text-sm px-3 py-1 min-h-9',
    md: 'h-12 text-base px-5 py-2 min-h-12',
    lg: 'h-14 text-lg px-6 py-3 min-h-14',
  };
  
  // Buton varyantına göre stil sınıfları
  const variantClasses = {
    primary: `
      bg-blue-600 
      text-white 
      border-blue-700
      hover:bg-blue-700 
      active:bg-blue-800
      dark:bg-blue-500 
      dark:border-blue-600 
      dark:hover:bg-blue-600
    `,
    secondary: `
      bg-gray-200 
      text-gray-800 
      border-gray-300
      hover:bg-gray-300 
      active:bg-gray-400
      dark:bg-gray-700 
      dark:text-gray-100 
      dark:border-gray-600 
      dark:hover:bg-gray-600
    `,
    outline: `
      bg-transparent 
      text-gray-800 
      border border-gray-300
      hover:bg-gray-100 
      active:bg-gray-200
      dark:text-gray-100 
      dark:border-gray-600 
      dark:hover:bg-gray-800 
      dark:active:bg-gray-700
    `,
    text: `
      bg-transparent 
      text-blue-600 
      border-transparent
      hover:bg-blue-50 
      active:bg-blue-100
      dark:text-blue-400 
      dark:hover:bg-blue-900/30 
      dark:active:bg-blue-900/50
    `,
    neon: `
      bg-blue-600/90 
      text-white 
      border-blue-500/50
      hover:bg-blue-500 
      active:bg-blue-700
      hover:shadow-[0_0_15px_rgba(59,130,246,0.5)]
      dark:hover:shadow-[0_0_20px_rgba(59,130,246,0.7)]
      hover:scale-[1.03] 
      active:scale-[0.97]
      transition-all 
      duration-200
    `,
    gradient: `
      bg-gradient-to-r 
      from-blue-600 
      to-indigo-600 
      text-white 
      border-transparent
      hover:from-blue-500 
      hover:to-indigo-500 
      active:from-blue-700 
      active:to-indigo-700
      hover:scale-[1.03] 
      active:scale-[0.97]
      transition-all 
      duration-200
    `,
  };
  
  // Haptic feedback'i tetikleyecek fonksiyon
  const handleClick = (e: React.MouseEvent) => {
    if (disabled || loading) {
      e.preventDefault();
      return;
    }
    
    if (haptic && webApp?.HapticFeedback) {
      webApp.HapticFeedback.impactOccurred(haptic);
    }
    
    if (onClick) {
      onClick();
    }
  };
  
  // Tüm CSS sınıflarını birleştir
  const buttonClasses = `
    flex 
    items-center 
    justify-center 
    gap-2 
    font-medium 
    border 
    transition-all 
    select-none
    ${rounded ? 'rounded-full' : 'rounded-xl'} 
    ${sizeClasses[size]} 
    ${variantClasses[variant]} 
    ${fullWidth ? 'w-full' : ''}
    ${disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'cursor-pointer'}
    ${className}
  `.trim();
  
  // İkon konumu ayarla
  const renderContent = () => (
    <>
      {loading ? (
        <span className="i-mdi-loading animate-spin h-5 w-5"></span>
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <span className="flex-shrink-0">{icon}</span>
          )}
          <span>{children}</span>
          {icon && iconPosition === 'right' && (
            <span className="flex-shrink-0">{icon}</span>
          )}
        </>
      )}
    </>
  );
  
  return (
    <button
      type={type}
      className={buttonClasses}
      onClick={handleClick}
      disabled={disabled || loading}
    >
      {renderContent()}
    </button>
  );
};

export default MiniAppButton; 