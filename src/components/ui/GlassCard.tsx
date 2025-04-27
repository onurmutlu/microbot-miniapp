import React, { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'danger' | 'info';
  hoverable?: boolean;
  onClick?: () => void;
}

const variants = {
  default: 'bg-white/30 dark:bg-gray-800/30 border-white/20 dark:border-gray-700/20',
  primary: 'bg-[#3f51b5]/10 dark:bg-[#3f51b5]/20 border-[#3f51b5]/20 dark:border-[#3f51b5]/30',
  secondary: 'bg-[#f50057]/10 dark:bg-[#f50057]/20 border-[#f50057]/20 dark:border-[#f50057]/30',
  success: 'bg-green-500/10 dark:bg-green-500/20 border-green-500/20 dark:border-green-500/30',
  danger: 'bg-red-500/10 dark:bg-red-500/20 border-red-500/20 dark:border-red-500/30',
  info: 'bg-blue-400/10 dark:bg-blue-400/20 border-blue-400/20 dark:border-blue-400/30',
};

const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  variant = 'default',
  hoverable = false,
  onClick
}) => {
  const hoverEffect = hoverable
    ? 'hover:shadow-lg hover:-translate-y-1 hover:scale-[1.01] cursor-pointer'
    : '';

  return (
    <div
      className={`
        relative overflow-hidden rounded-xl backdrop-blur-lg
        border p-4 shadow-sm transition-all duration-300
        ${variants[variant]}
        ${hoverEffect}
        ${className}
      `}
      onClick={onClick}
    >
      {/* Gradient overlay */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br opacity-30
        from-white/40 via-transparent to-white/5
        dark:from-white/10 dark:via-transparent dark:to-white/5" 
      />
      
      {/* Inner shadow effect */}
      <div className="absolute inset-0 -z-10 rounded-xl inner-glass-shadow" />
      
      {children}
    </div>
  );
};

export default GlassCard; 