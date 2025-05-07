import React, { ButtonHTMLAttributes } from 'react';
import '../../styles/neon-effects.css';

interface NeonButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'pulsing' | 'cyan-pink' | 'blue-purple' | 'green-yellow';
}

const NeonButton: React.FC<NeonButtonProps> = ({ 
  children, 
  className = '',
  variant = 'default',
  ...rest 
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'pulsing':
        return 'neon-pulse';
      case 'cyan-pink':
        return 'neon-cyan-pink';
      case 'blue-purple':
        return 'neon-blue-purple';
      case 'green-yellow':
        return 'neon-green-yellow';
      default:
        return 'bg-gradient-to-r from-[#ff6ec4] to-[#7873f5]';
    }
  };

  return (
    <button
      className={`
        py-2 px-6 
        ${variant === 'default' ? 'bg-gradient-to-r from-[#ff6ec4] to-[#7873f5]' : getVariantClasses()}
        text-white font-medium
        rounded-full 
        shadow-md
        transition-all duration-300
        hover:scale-105 
        hover:shadow-lg hover:shadow-[#ff6ec4]/20
        active:scale-95
        min-h-10
        touch-manipulation
        select-none
        neon-button
        neon-glow
        ${className}
      `}
      {...rest}
    >
      {children}
    </button>
  );
};

export default NeonButton; 