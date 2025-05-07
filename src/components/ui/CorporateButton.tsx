import React, { ButtonHTMLAttributes } from 'react';
import '../../styles/corporate-theme.css';

interface CorporateButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  className?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

const CorporateButton: React.FC<CorporateButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  icon,
  iconPosition = 'left',
  ...rest
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'bg-[var(--corporate-accent-blue)] hover:bg-[var(--corporate-accent-blue-light)]';
      case 'secondary':
        return 'bg-[var(--corporate-accent-slate)] hover:bg-[var(--corporate-accent-slate-light)]';
      case 'outline':
        return 'bg-transparent border border-[var(--corporate-border)] hover:bg-[var(--corporate-bg-tertiary)]';
      case 'danger':
        return 'bg-red-700 hover:bg-red-600';
      case 'success':
        return 'bg-green-700 hover:bg-green-600';
      default:
        return 'bg-[var(--corporate-accent-blue)] hover:bg-[var(--corporate-accent-blue-light)]';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-2 py-1 text-sm';
      case 'lg':
        return 'px-6 py-3 text-lg';
      default:
        return 'px-4 py-2';
    }
  };

  return (
    <button
      className={`
        text-[var(--corporate-text-primary)]
        rounded
        font-medium
        transition-all
        duration-200
        flex
        items-center
        justify-center
        ${getVariantClasses()}
        ${getSizeClasses()}
        ${fullWidth ? 'w-full' : ''}
        ${variant === 'outline' ? 'text-[var(--corporate-text-secondary)]' : 'text-[var(--corporate-text-primary)]'}
        ${className}
      `}
      {...rest}
    >
      {icon && iconPosition === 'left' && <span className="mr-2">{icon}</span>}
      {children}
      {icon && iconPosition === 'right' && <span className="ml-2">{icon}</span>}
    </button>
  );
};

export default CorporateButton; 