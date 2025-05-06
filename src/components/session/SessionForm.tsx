import React, { useState } from 'react';
import { useForm, SubmitHandler, FormProvider } from 'react-hook-form';
import { KeyIcon, PhoneIcon, ShieldCheckIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { FormField } from '../ui/FormField';
import { Button } from '../ui/FormElements';
import api from '../../utils/api';
import { showSuccess, handleApiError } from '../../utils/toast';
import GlassCard from '../ui/GlassCard';

interface SessionFormProps {
  onCodeRequested: (phone: string, api_id: string, api_hash: string, phone_code_hash: string) => void;
}

interface FormInputs {
  api_id: string;
  api_hash: string;
  phone: string;
}

const SessionForm: React.FC<SessionFormProps> = ({ onCodeRequested }) => {
  const [isLoading, setIsLoading] = useState(false);
  
  const methods = useForm<FormInputs>();
  const { handleSubmit } = methods;

  const onSubmit: SubmitHandler<FormInputs> = async (data) => {
    try {
      setIsLoading(true);
      
      const response = await api.post('/telegram/start-login', {
        api_id: data.api_id,
        api_hash: data.api_hash, 
        phone: data.phone
      });
      
      if (response.data?.status === 'code_sent') {
        showSuccess('Doğrulama kodu telefonunuza gönderildi');
        onCodeRequested(
          data.phone, 
          data.api_id, 
          data.api_hash, 
          response.data.phone_code_hash || ''
        );
      }
    } catch (error) {
      handleApiError(error, 'Oturum başlatma işlemi sırasında bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="glass-card p-6 border border-white/10 shadow-xl">
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 rounded-full glass-gradient-primary flex items-center justify-center mr-3">
            <ShieldCheckIcon className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white glass-gradient">Telegram Oturumu Başlat</h2>
        </div>
        
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
          Telegram oturumu başlatmak için lütfen <a href="https://my.telegram.org/apps" target="_blank" className="text-[#3f51b5] underline hover:text-[#303f9f] transition-colors">my.telegram.org/apps</a> adresinden aldığınız API bilgilerinizi girin.
        </p>
        
        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              name="api_id"
              label="API ID"
              type="text"
              placeholder="12345678"
              tooltip="my.telegram.org/apps sayfasından edinebileceğiniz API ID"
              options={{ 
                required: 'API ID gereklidir',
                pattern: {
                  value: /^\d+$/,
                  message: 'API ID sadece rakamlardan oluşmalıdır'
                }
              }}
            />
            
            <FormField
              name="api_hash"
              label="API Hash"
              type="text"
              placeholder="a1b2c3d4e5f6g7h8i9j0..."
              tooltip="my.telegram.org/apps sayfasından edinebileceğiniz API Hash"
              options={{ 
                required: 'API Hash gereklidir',
                minLength: {
                  value: 32,
                  message: 'API Hash en az 32 karakter olmalıdır'
                }
              }}
            />
            
            <FormField
              name="phone"
              label="Telefon Numarası"
              type="text"
              placeholder="+905551234567"
              tooltip="Ülke kodu dahil telefon numaranız (örn. +905551234567)"
              options={{ 
                required: 'Telefon numarası gereklidir',
                pattern: {
                  value: /^\+[0-9]{10,15}$/,
                  message: 'Geçerli bir telefon numarası girin (örn. +905551234567)'
                }
              }}
            />
            
            <div className="pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full glass-btn glass-gradient-primary text-white font-medium py-2.5 px-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent"></span>
                    <span>İşlem Yapılıyor</span>
                  </>
                ) : (
                  <>
                    <KeyIcon className="w-4 h-4" />
                    <span>Oturumu Başlat</span>
                  </>
                )}
              </button>
            </div>
            
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-4 bg-white/5 p-3 rounded-lg border border-white/5">
              <p className="flex items-center">
                <DocumentTextIcon className="w-4 h-4 mr-2 inline text-[#3f51b5]" />
                API bilgileriniz tamamen güvenli bir şekilde yerel cihazınızda saklanacaktır.
              </p>
            </div>
          </form>
        </FormProvider>
      </div>
    </div>
  );
};

export default SessionForm; 