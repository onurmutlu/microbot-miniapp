import React from 'react';
import { cn } from '../../utils/cn';

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'danger';
  elevated?: boolean;
  hoverable?: boolean;
  withAnimation?: boolean;
  compact?: boolean;
  withInnerShadow?: boolean;
}

const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className,
  variant = 'primary',
  elevated = false,
  hoverable = false,
  withAnimation = false,
  compact = false,
  withInnerShadow = false,
  ...props
}) => {
  return (
    <div
      className={cn(
        'glass-card rounded-lg transition-all duration-300 relative',
        {
          'glass-gradient-primary': variant === 'primary',
          'glass-gradient-secondary': variant === 'secondary',
          'glass-gradient-success': variant === 'success',
          'glass-gradient-info': variant === 'info',
          'glass-gradient-warning': variant === 'warning',
          'glass-gradient-danger': variant === 'danger',
          'shadow-lg': elevated,
          'hover:scale-[1.01] hover:shadow-xl cursor-pointer': hoverable,
          'animate-fade-in': withAnimation,
          'p-3': compact,
          'p-6': !compact,
          'inner-glass-shadow': withInnerShadow,
        },
        className
      )}
      {...props}
    >
      {/* Gradient overlay */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br opacity-30
        from-white/40 via-transparent to-white/5
        dark:from-white/10 dark:via-transparent dark:to-white/5" 
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