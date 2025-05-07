import React, { ReactNode } from 'react';

interface CorporateGlassCardProps {
  children: ReactNode;
  className?: string;
  hoverEffect?: 'glow' | 'scale' | 'both' | 'none';
  intensity?: 'light' | 'medium' | 'strong';
  onClick?: () => void;
}

const CorporateGlassCard: React.FC<CorporateGlassCardProps> = ({
  children,
  className = '',
  hoverEffect = 'both',
  intensity = 'medium',
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
        relative
        ${onClick ? 'cursor-pointer' : 'cursor-default'}
        ${getIntensityClasses()}
        ${getHoverClasses()}
        ${className}
      `}
      onClick={onClick}
    >
      {/* Gradient overlay */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br rounded-2xl opacity-30
        from-white/40 via-transparent to-white/5" 
      />
      
      {/* Glass shine effect */}
      <div className="absolute -top-[150%] -right-[150%] w-[300%] h-[300%] -z-10 rounded-full 
          bg-gradient-to-br from-white/10 to-transparent rotate-45 opacity-20" />
      
      {/* Inner shadow effect */}
      <div className="absolute inset-0 -z-10 rounded-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),inset_0_-1px_1px_rgba(0,0,0,0.05)]" />
      
      {children}
    </div>
  );
};

export default CorporateGlassCard; 