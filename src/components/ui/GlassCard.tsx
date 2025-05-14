import React, { ReactNode } from 'react';

export interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hoverEffect?: 'glow' | 'scale' | 'both' | 'none';
  intensity?: 'light' | 'medium' | 'strong';
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info';
  onClick?: () => void;
}

const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  hoverEffect = 'both',
  intensity = 'medium',
  variant = 'default',
  onClick
}) => {
  // Efekt yoğunluğuna göre sınıf belirleme
  const getIntensityClasses = () => {
    switch (intensity) {
      case 'light':
        return 'bg-white/5 border-white/20 shadow-sm';
      case 'strong':
        return 'bg-white/15 border-white/40 shadow-lg';
      case 'medium':
      default:
        return 'bg-white/10 border-white/30 shadow-md';
    }
  };

  // Hover efekti belirleme
  const getHoverClasses = () => {
    switch (hoverEffect) {
      case 'glow':
        return 'hover:shadow-[0_0_15px_rgba(255,255,255,0.3)] hover:border-white/50';
      case 'scale':
        return 'hover:scale-[1.02] hover:shadow-lg';
      case 'both':
        return 'hover:scale-[1.02] hover:shadow-[0_0_15px_rgba(255,255,255,0.3)] hover:border-white/50';
      case 'none':
      default:
        return '';
    }
  };

  // Varyant renklerini belirleme
  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'border-blue-500/40 dark:border-blue-400/40';
      case 'secondary':
        return 'border-purple-500/40 dark:border-purple-400/40';
      case 'success':
        return 'border-green-500/40 dark:border-green-400/40';
      case 'danger':
        return 'border-red-500/40 dark:border-red-400/40';
      case 'warning':
        return 'border-amber-500/40 dark:border-amber-400/40'; 
      case 'info':
        return 'border-cyan-500/40 dark:border-cyan-400/40';
      default:
        return 'border-gray-200/40 dark:border-gray-700/40';
    }
  };

  return (
    <div
      className={`
        rounded-2xl
        p-6
        flex
        flex-col
        items-center
        justify-center
        backdrop-blur-md
        border
        transition-all
        duration-300
        cursor-${onClick ? 'pointer' : 'default'}
        ${getIntensityClasses()}
        ${getHoverClasses()}
        ${getVariantClasses()}
        ${className}
      `}
      onClick={onClick}
    >
      {/* Gradient overlay */}
      <div className={`absolute inset-0 -z-10 bg-gradient-to-br opacity-30
        ${variant === 'primary' ? 'from-blue-500/20 via-transparent to-blue-500/5' :
          variant === 'secondary' ? 'from-purple-500/20 via-transparent to-purple-500/5' :
          variant === 'success' ? 'from-green-500/20 via-transparent to-green-500/5' :
          variant === 'danger' ? 'from-red-500/20 via-transparent to-red-500/5' :
          variant === 'warning' ? 'from-amber-500/20 via-transparent to-amber-500/5' :
          variant === 'info' ? 'from-cyan-500/20 via-transparent to-cyan-500/5' :
          'from-white/40 via-transparent to-white/5 dark:from-white/10 dark:via-transparent dark:to-white/5'
        }`} 
      />
      
      {/* Glass shine effect */}
      <div className="absolute -top-[150%] -right-[150%] w-[300%] h-[300%] -z-10 rounded-full 
          bg-gradient-to-br from-white/10 to-transparent rotate-45 opacity-20" />
      
      {/* Inner shadow effect */}
      <div className="absolute inset-0 -z-10 rounded-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),inset_0_-1px_1px_rgba(0,0,0,0.05)]" />
      
      {children}
    </div>
  );
};

export default GlassCard; 