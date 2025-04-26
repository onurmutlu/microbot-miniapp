import React from 'react';
import { useFormContext, RegisterOptions } from 'react-hook-form';
import { FormError } from '../../utils/validation';

interface FormFieldProps {
  name: string;
  label: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'textarea' | 'select';
  placeholder?: string;
  options?: RegisterOptions;
  children?: React.ReactNode;
  className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  name,
  label,
  type = 'text',
  placeholder,
  options,
  children,
  className = ''
}) => {
  const {
    register,
    formState: { errors }
  } = useFormContext();

  const error = errors[name];

  return (
    <div className={`space-y-2 ${className}`}>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      {type === 'textarea' ? (
        <textarea
          id={name}
          placeholder={placeholder}
          {...register(name, options)}
          className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
            error ? 'border-red-500' : ''
          }`}
        />
      ) : type === 'select' ? (
        <select
          id={name}
          {...register(name, options)}
          className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
            error ? 'border-red-500' : ''
          }`}
        >
          {children}
        </select>
      ) : (
        <input
          id={name}
          type={type}
          placeholder={placeholder}
          {...register(name, options)}
          className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
            error ? 'border-red-500' : ''
          }`}
        />
      )}
      <FormError error={error} />
    </div>
  );
}; 