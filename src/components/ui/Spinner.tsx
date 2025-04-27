import React from 'react';

interface SpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'white';
  className?: string;
  variant?: 'default' | 'dots' | 'pulse' | 'glassEffect';
  isLoading?: boolean;
}

const Spinner: React.FC<SpinnerProps> = ({ 
  size = 'md', 
  color = 'white', 
  className = '',
  variant = 'default',
  isLoading = true
}) => {
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-10 h-10',
  };

  const colorClasses = {
    primary: 'text-blue-600',
    secondary: 'text-purple-600',
    success: 'text-green-500',
    danger: 'text-red-500',
    warning: 'text-yellow-500',
    white: 'text-white',
  };

  if (variant === 'dots') {
    return (
      <div className={`flex space-x-1 ${className}`}>
        <div className={`${sizeClasses[size].split(' ')[0]} ${colorClasses[color]} rounded-full animate-pulse`} style={{animationDelay: '0ms'}}></div>
        <div className={`${sizeClasses[size].split(' ')[0]} ${colorClasses[color]} rounded-full animate-pulse`} style={{animationDelay: '200ms'}}></div>
        <div className={`${sizeClasses[size].split(' ')[0]} ${colorClasses[color]} rounded-full animate-pulse`} style={{animationDelay: '400ms'}}></div>
      </div>
    );
  }

  if (variant === 'pulse') {
    return (
      <div className={`${className}`}>
        <div className={`${sizeClasses[size]} ${colorClasses[color]} rounded-full animate-ping opacity-75`}></div>
      </div>
    );
  }

  if (variant === 'glassEffect') {
    return (
      <div className={`relative flex justify-center items-center ${className}`}>
        <div className={`absolute ${sizeClasses[size]} rounded-full bg-opacity-20 bg-white backdrop-filter backdrop-blur-sm animate-ping`}></div>
        <div className={`${sizeClasses[size]} rounded-full bg-opacity-30 backdrop-filter backdrop-blur-sm border border-white border-opacity-20 shadow-lg animate-pulse ${colorClasses[color]}`}></div>
      </div>
    );
  }

  // Default spinner
  return (
    <div className={`flex justify-center items-center ${className}`}>
      <svg 
        className={`animate-spin ${sizeClasses[size]} ${colorClasses[color]}`} 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24"
      >
        <circle 
          className="opacity-25" 
          cx="12" 
          cy="12" 
          r="10" 
          stroke="currentColor" 
          strokeWidth="4"
        ></circle>
        <path 
          className="opacity-75" 
          fill="currentColor" 
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
    </div>
  );
};

export default Spinner; 