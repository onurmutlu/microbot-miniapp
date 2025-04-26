import { RegisterOptions } from 'react-hook-form';
import React from 'react';

// Validasyon kuralları
export const validationRules = {
  required: (message = 'Bu alan zorunludur'): RegisterOptions => ({
    required: message
  }),
  minLength: (min: number, message = `En az ${min} karakter olmalıdır`): RegisterOptions => ({
    minLength: {
      value: min,
      message
    }
  }),
  maxLength: (max: number, message = `En fazla ${max} karakter olmalıdır`): RegisterOptions => ({
    maxLength: {
      value: max,
      message
    }
  }),
  email: (message = 'Geçerli bir e-posta adresi giriniz'): RegisterOptions => ({
    pattern: {
      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
      message
    }
  }),
  password: (message = 'Şifre en az 8 karakter olmalı ve en az bir büyük harf, bir küçük harf ve bir rakam içermelidir'): RegisterOptions => ({
    pattern: {
      value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/,
      message
    }
  }),
  url: (message = 'Geçerli bir URL giriniz'): RegisterOptions => ({
    pattern: {
      value: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/,
      message
    }
  }),
  number: (message = 'Sadece sayı giriniz'): RegisterOptions => ({
    pattern: {
      value: /^\d+$/,
      message
    }
  }),
  phone: (message = 'Geçerli bir telefon numarası giriniz'): RegisterOptions => ({
    pattern: {
      value: /^[0-9]{10}$/,
      message
    }
  })
};

export const VALIDATION_RULES = validationRules;

// Hata mesajları için yardımcı fonksiyonlar
export const getErrorMessage = (error: any): string => {
  if (typeof error === 'string') return error;
  if (error?.message) return error.message;
  return 'Bir hata oluştu';
};

// Form alanı için hata mesajı gösterme
export const FormError: React.FC<{ error?: any }> = ({ error }) => {
  if (!error) return null;
  return React.createElement('p', { className: 'mt-1 text-sm text-red-500' }, getErrorMessage(error));
}; 