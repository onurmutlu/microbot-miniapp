import React from 'react';
import { useFormContext, RegisterOptions } from 'react-hook-form';
import { FormError } from '../../utils/validation';
import { 
  ExclamationCircleIcon, 
  QuestionMarkCircleIcon
} from '@heroicons/react/24/outline';

interface FormFieldProps {
  name: string;
  label: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'textarea' | 'select';
  placeholder?: string;
  options?: RegisterOptions;
  children?: React.ReactNode;
  className?: string;
  tooltip?: string;
  rows?: number;
  disabled?: boolean;
}

export const FormField: React.FC<FormFieldProps> = ({
  name,
  label,
  type = 'text',
  placeholder,
  options,
  children,
  className = '',
  tooltip,
  rows = 4,
  disabled = false
}) => {
  const {
    register,
    formState: { errors }
  } = useFormContext();

  const error = errors[name];

  const inputClasses = `
    block w-full rounded-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-md
    border ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 dark:border-gray-700 focus:ring-[#3f51b5]/50 focus:border-[#3f51b5]'}
    text-gray-900 dark:text-white
    placeholder-gray-400 dark:placeholder-gray-500
    focus:outline-none focus:ring-2
    transition-all duration-200 ease-in-out
    disabled:opacity-60 disabled:cursor-not-allowed
  `;

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <label 
          htmlFor={name} 
          className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1"
        >
          {label}
        </label>
        
        {tooltip && (
          <div className="relative group">
            <QuestionMarkCircleIcon className="h-4 w-4 text-gray-400 cursor-help" />
            <div className="absolute right-0 bottom-full mb-2 hidden group-hover:block w-64 p-2 bg-gray-800 text-white text-xs rounded shadow-lg z-10">
              {tooltip}
            </div>
          </div>
        )}
      </div>
      
      {type === 'textarea' ? (
        <div className="relative">
          <textarea
            id={name}
            placeholder={placeholder}
            rows={rows}
            disabled={disabled}
            {...register(name, options)}
            className={inputClasses}
          />
          {error && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <ExclamationCircleIcon className="h-5 w-5 text-red-500" />
            </div>
          )}
        </div>
      ) : type === 'select' ? (
        <div className="relative">
          <select
            id={name}
            disabled={disabled}
            {...register(name, options)}
            className={inputClasses}
          >
            {children}
          </select>
          {error && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <ExclamationCircleIcon className="h-5 w-5 text-red-500" />
            </div>
          )}
        </div>
      ) : (
        <div className="relative">
          <input
            id={name}
            type={type}
            placeholder={placeholder}
            disabled={disabled}
            {...register(name, options)}
            className={inputClasses}
          />
          {error && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <ExclamationCircleIcon className="h-5 w-5 text-red-500" />
            </div>
          )}
        </div>
      )}
      
      <FormError error={error} />
    </div>
  );
}; 