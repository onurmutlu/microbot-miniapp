import React, { InputHTMLAttributes, SelectHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';
import Spinner from './Spinner';

// Input Bileşeni
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: ReactNode;
}

export const Input: React.FC<InputProps> = ({ label, error, icon, className, ...rest }) => {
  return (
    <div className="mb-4">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {icon}
          </div>
        )}
        <input
          className={`
            w-full px-4 py-2.5 rounded-lg
            bg-white/50 dark:bg-gray-800/50 backdrop-blur-md
            border border-gray-200 dark:border-gray-700
            text-gray-900 dark:text-white
            placeholder-gray-400 dark:placeholder-gray-500
            focus:ring-2 focus:ring-[#3f51b5]/50 focus:border-[#3f51b5]
            transition-all duration-200 ease-in-out
            ${icon ? 'pl-10' : ''}
            ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}
            ${className || ''}
          `}
          {...rest}
        />
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
};

// Select Bileşeni
interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: Array<{ value: string; label: string }>;
}

export const Select: React.FC<SelectProps> = ({ label, error, options, className, ...rest }) => {
  return (
    <div className="mb-4">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
          {label}
        </label>
      )}
      <select
        className={`
          w-full px-4 py-2.5 rounded-lg
          bg-white/50 dark:bg-gray-800/50 backdrop-blur-md
          border border-gray-200 dark:border-gray-700
          text-gray-900 dark:text-white
          focus:ring-2 focus:ring-[#3f51b5]/50 focus:border-[#3f51b5]
          transition-all duration-200 ease-in-out
          ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}
          ${className || ''}
        `}
        {...rest}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
};

// Button Bileşeni
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: ReactNode;
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  isLoading,
  className,
  disabled,
  ...rest
}) => {
  const variantClasses = {
    primary: 'bg-[#3f51b5] hover:bg-[#303f9f] text-white',
    secondary: 'bg-[#f50057] hover:bg-[#c51162] text-white',
    success: 'bg-green-500 hover:bg-green-600 text-white',
    danger: 'bg-red-500 hover:bg-red-600 text-white',
    outline: 'bg-transparent border border-[#3f51b5] text-[#3f51b5] hover:bg-[#3f51b5]/10',
    ghost: 'bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200'
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg'
  };

  return (
    <button
      className={`
        relative rounded-lg font-medium
        transition-all duration-200 ease-in-out
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#3f51b5]/50
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${disabled || isLoading ? 'opacity-70 cursor-not-allowed' : ''}
        ${className || ''}
      `}
      disabled={disabled || isLoading}
      {...rest}
    >
      <span className={`flex items-center justify-center ${isLoading ? 'opacity-0' : ''}`}>
        {icon && <span className="mr-2">{icon}</span>}
        {children}
      </span>

      {isLoading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <Spinner size="sm" color="white" />
        </span>
      )}
    </button>
  );
};

// Toggle Switch Bileşeni
interface ToggleProps {
  checked: boolean;
  onChange: () => void;
  label?: string;
  disabled?: boolean;
}

export const Toggle: React.FC<ToggleProps> = ({
  checked,
  onChange,
  label,
  disabled = false
}) => {
  return (
    <div className="flex items-center">
      <button
        type="button"
        onClick={onChange}
        disabled={disabled}
        className={`
          relative inline-flex h-6 w-11 items-center rounded-full
          transition-colors duration-300 ease-in-out
          focus:outline-none focus:ring-2 focus:ring-[#3f51b5]/50 focus:ring-offset-2
          ${checked ? 'bg-[#3f51b5]' : 'bg-gray-300 dark:bg-gray-600'}
          ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
        `}
        role="switch"
        aria-checked={checked}
      >
        <span
          className={`
            inline-block h-4 w-4 transform rounded-full
            bg-white shadow transition-transform duration-300 ease-in-out
            ${checked ? 'translate-x-6' : 'translate-x-1'}
          `}
        />
      </button>
      {label && (
        <span
          className={`ml-3 text-sm font-medium ${
            disabled ? 'text-gray-400 dark:text-gray-500' : 'text-gray-700 dark:text-gray-200'
          }`}
        >
          {label}
        </span>
      )}
    </div>
  );
}; 