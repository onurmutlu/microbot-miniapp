import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Sınıf adlarını birleştirmek için yardımcı fonksiyon
 * clsx ile sınıf adlarını birleştirip, tailwind-merge ile olası çakışmaları çözer
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
} 