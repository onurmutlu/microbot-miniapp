import { useState } from 'react';
import { schedulerService, CronValidationResult } from '../services/schedulerService';
import { handleApiError } from '../utils/toast';

export const useCronValidation = () => {
  const [isValidating, setIsValidating] = useState(false);
  const [data, setData] = useState<CronValidationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const validate = async (cronExpression: string) => {
    setIsValidating(true);
    setError(null);
    
    try {
      const result = await schedulerService.validateCronExpression(cronExpression);
      setData(result);
    } catch (err) {
      setError('Cron ifadesi doğrulanırken bir hata oluştu.');
      console.error('Cron validation error:', err);
      handleApiError(err, 'Cron ifadesi doğrulanırken hata oluştu');
    } finally {
      setIsValidating(false);
    }
  };
  
  return {
    isValidating,
    data,
    error,
    validate
  };
}; 