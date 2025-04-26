import { useState, useEffect, useCallback } from 'react';
import { schedulerService, SchedulerStatus } from '../services/schedulerService';
import { showSuccess, handleApiError, toast } from '../utils/toast';

export const useSchedulerStatus = () => {
  const [status, setStatus] = useState<SchedulerStatus | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await schedulerService.getStatus();
      setStatus(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Zamanlayıcı durumu alınırken hata oluştu'));
      handleApiError(err, 'Zamanlayıcı durumu alınırken hata oluştu');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();

    // 30 saniyede bir yenile
    const intervalId = setInterval(fetchStatus, 30000);
    return () => clearInterval(intervalId);
  }, [fetchStatus]);

  return { status, isLoading, error, refetch: fetchStatus };
};

export const useStartScheduler = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const startScheduler = useCallback(async () => {
    try {
      setIsLoading(true);
      await schedulerService.startScheduler();
      showSuccess('Zamanlayıcı başarıyla başlatıldı');
      setError(null);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Zamanlayıcı başlatılırken hata oluştu'));
      handleApiError(err, 'Zamanlayıcı başlatılırken hata oluştu');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { startScheduler, isLoading, error };
};

export const useStopScheduler = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const stopScheduler = useCallback(async () => {
    try {
      setIsLoading(true);
      await schedulerService.stopScheduler();
      showSuccess('Zamanlayıcı başarıyla durduruldu');
      setError(null);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Zamanlayıcı durdurulurken hata oluştu'));
      handleApiError(err, 'Zamanlayıcı durdurulurken hata oluştu');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { stopScheduler, isLoading, error };
};

export interface ScheduleUpdate {
  template_id: string;
  interval_minutes: number;
  cron_expression: string | null;
  is_active: boolean;
}

export const useTemplateSchedule = () => {
  const [isLoading, setIsLoading] = useState(false);

  const updateTemplateSchedule = async (data: ScheduleUpdate): Promise<boolean> => {
    setIsLoading(true);
    try {
      await schedulerService.updateTemplateSchedule(data);
      showSuccess('Zamanlama bilgileri başarıyla güncellendi');
      return true;
    } catch (error) {
      handleApiError(error, 'Zamanlama güncellenirken bir hata oluştu');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    updateTemplateSchedule,
    isLoading
  };
};

export const useCronValidation = () => {
  const [isValidating, setIsValidating] = useState(false);
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const [nextExecutions, setNextExecutions] = useState<string[]>([]);

  const validateCronExpression = async (expression: string): Promise<boolean> => {
    if (!expression.trim()) {
      setIsValid(false);
      setValidationMessage('Cron ifadesi boş olamaz');
      setNextExecutions([]);
      return false;
    }

    setIsValidating(true);
    setIsValid(null);
    setValidationMessage(null);

    try {
      const response = await schedulerService.validateCronExpression(expression);
      
      setIsValid(response.is_valid);
      setValidationMessage(response.error || null);
      
      if (response.is_valid && response.next_dates) {
        setNextExecutions(response.next_dates);
      } else {
        setNextExecutions([]);
      }
      
      return response.is_valid;
    } catch (error) {
      console.error('Cron doğrulama hatası:', error);
      setIsValid(false);
      setValidationMessage('Doğrulama sırasında bir hata oluştu');
      setNextExecutions([]);
      return false;
    } finally {
      setIsValidating(false);
    }
  };

  return {
    validateCronExpression,
    isValidating,
    isValid,
    validationMessage,
    nextExecutions
  };
};

export const useScheduleHistory = (limit = 10) => {
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchHistory = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await schedulerService.getScheduleHistory(limit);
      setHistory(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Zamanlama geçmişi alınırken hata oluştu'));
      handleApiError(err, 'Zamanlama geçmişi alınırken hata oluştu');
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return { history, isLoading, error, refetch: fetchHistory };
}; 