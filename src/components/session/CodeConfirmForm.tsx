import React, { useState } from 'react';
import { useForm, SubmitHandler, FormProvider } from 'react-hook-form';
import { ArrowLeftIcon, CheckBadgeIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { FormField } from '../ui/FormField';
import { Button } from '../ui/FormElements';
import api from '../../utils/api';
import { showSuccess, handleApiError } from '../../utils/toast';
import GlassCard from '../ui/GlassCard';

interface CodeConfirmFormProps {
  phone: string;
  api_id?: string;
  api_hash?: string;
  phone_code_hash?: string;
  onBackClick: () => void;
  onCodeConfirmed: (requires2FA: boolean) => void;
}

interface FormInputs {
  code: string;
}

const CodeConfirmForm: React.FC<CodeConfirmFormProps> = ({ 
  phone, 
  api_id = '', 
  api_hash = '',
  phone_code_hash = '',
  onBackClick, 
  onCodeConfirmed 
}) => {
  const [isLoading, setIsLoading] = useState(false);
  
  const methods = useForm<FormInputs>();
  const { handleSubmit } = methods;

  const onSubmit: SubmitHandler<FormInputs> = async (data) => {
    try {
      setIsLoading(true);
      
      const response = await api.post('/telegram/code-confirm', {
        api_id,
        api_hash,
        phone,
        phone_code_hash,
        code: data.code
      });
      
      if (response.data?.status === 'code_confirmed') {
        showSuccess('Kod başarıyla doğrulandı');
        onCodeConfirmed(false);
      } else if (response.data?.status === '2fa_required') {
        showSuccess('SMS kodu doğrulandı, 2FA şifresi gerekli');
        onCodeConfirmed(true);
      }
    } catch (error) {
      handleApiError(error, 'Doğrulama kodu onaylanırken bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    try {
      setIsLoading(true);
      
      const response = await api.post('/telegram/resend-code', { 
        phone,
        api_id,
        api_hash,
        phone_code_hash 
      });
      
      if (response.data?.status === 'code_sent') {
        showSuccess('Yeni doğrulama kodu telefonunuza gönderildi');
      }
    } catch (error) {
      handleApiError(error, 'Doğrulama kodu yeniden gönderilirken bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <GlassCard className="p-6" variant="primary">
        <div className="flex items-center mb-4">
          <CheckBadgeIcon className="w-6 h-6 mr-2 text-[#3f51b5]" />
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">SMS Doğrulama</h2>
        </div>
        
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
          <span className="font-medium">{phone}</span> numaralı telefonunuza gönderilen doğrulama kodunu girin.
        </p>
        
        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              name="code"
              label="Doğrulama Kodu"
              type="text"
              placeholder="12345"
              tooltip="Telegram tarafından telefonunuza gönderilen doğrulama kodu"
              options={{ 
                required: 'Doğrulama kodu gereklidir',
                pattern: {
                  value: /^\d+$/,
                  message: 'Doğrulama kodu sadece rakamlardan oluşmalıdır'
                }
              }}
            />
            
            <div className="flex space-x-2 pt-2">
              <Button
                type="button"
                variant="outline"
                disabled={isLoading}
                onClick={onBackClick}
                icon={<ArrowLeftIcon className="w-4 h-4" />}
                className="flex-1"
              >
                Geri
              </Button>
              
              <Button
                type="submit"
                variant="primary"
                disabled={isLoading}
                isLoading={isLoading}
                icon={<CheckBadgeIcon className="w-4 h-4" />}
                className="flex-1"
              >
                {isLoading ? 'Doğrulanıyor...' : 'Kodu Doğrula'}
              </Button>
            </div>
            
            <div className="text-center">
              <button
                type="button"
                onClick={handleResendCode}
                disabled={isLoading}
                className="mt-2 text-sm text-[#3f51b5] hover:text-[#303f9f] dark:text-[#5c6bc0] dark:hover:text-[#7986cb] flex items-center justify-center mx-auto"
              >
                <ArrowPathIcon className="w-3.5 h-3.5 mr-1" />
                Kodu Tekrar Gönder
              </button>
            </div>
          </form>
        </FormProvider>
      </GlassCard>
    </div>
  );
};

export default CodeConfirmForm; 