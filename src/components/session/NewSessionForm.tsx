import React, { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { FiPhone, FiKey, FiHash, FiInfo, FiArrowLeft } from 'react-icons/fi';
import api from '../../utils/api';
import { showSuccess, showError } from '../../utils/toast';

interface NewSessionFormData {
  api_id: string;
  api_hash: string;
  phone: string;
}

interface NewSessionFormProps {
  remainingSessions: number;
}

const NewSessionForm: React.FC<NewSessionFormProps> = ({ remainingSessions }) => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  
  const { register, handleSubmit, formState: { errors } } = useForm<NewSessionFormData>({
    defaultValues: {
      api_id: '',
      api_hash: '',
      phone: ''
    }
  });

  // Form gönderildiğinde
  const onSubmit: SubmitHandler<NewSessionFormData> = async (data) => {
    if (remainingSessions <= 0) {
      showError('Paket limitinize ulaştınız. Daha fazla hesap eklemek için planınızı yükseltin.');
      return;
    }

    try {
      setIsLoading(true);
      
      // Telefon numarasını formatla (+ işaretini kaldır ve boşlukları sil)
      const phone = data.phone.replace(/\+/g, '').replace(/\s/g, '');
      
      const response = await api.post('/start-login', {
        api_id: data.api_id,
        api_hash: data.api_hash,
        phone
      });
      
      showSuccess('Doğrulama kodu gönderildi. Lütfen telefonunuza gelen kodu girin.');
      
      // Doğrulama kodu sayfasına yönlendir
      // Bu veriler SessionManager veya benzeri bir bileşende kullanılacak
      navigate('/session', { 
        state: { 
          phone,
          api_id: data.api_id,
          api_hash: data.api_hash,
          phone_code_hash: response.data.phone_code_hash
        } 
      });
      
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Bir hata oluştu.';
      showError(`İşlem başarısız: ${errorMessage}`);
      console.error('Oturum başlatma hatası:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Eğer kullanıcının hesap ekleme hakkı kalmadıysa
  if (remainingSessions <= 0) {
    return (
      <div className="glass-card p-6 rounded-xl animate-fade-in">
        <div className="flex items-center mb-6">
          <div className="w-10 h-10 rounded-full glass-gradient-primary flex items-center justify-center mr-3">
            <FiInfo className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white glass-gradient">Paket Limitine Ulaştınız</h2>
        </div>
        
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Kullanıcı hesabı ekleme limitinize ulaştınız. Daha fazla hesap eklemek için mevcut hesaplarınızdan birini silmeyi veya paketinizi yükseltmeyi deneyebilirsiniz.
        </p>
        
        <div className="flex justify-between">
          <button
            type="button"
            onClick={() => navigate('/sessions')}
            className="glass-btn px-4 py-2 flex items-center gap-2"
          >
            <FiArrowLeft className="w-4 h-4" />
            <span>Hesaplarıma Dön</span>
          </button>
          
          <button
            type="button"
            onClick={() => navigate('/settings')}
            className="glass-btn glass-gradient-primary px-4 py-2 text-white"
          >
            Paketimi Yükselt
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6 rounded-xl animate-fade-in">
      <div className="flex items-center mb-6">
        <div className="w-10 h-10 rounded-full glass-gradient-primary flex items-center justify-center mr-3">
          <FiPhone className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white glass-gradient">Yeni Telegram Hesabı Ekle</h2>
      </div>
      
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Telegram hesabı eklemek için <a href="https://my.telegram.org/apps" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">my.telegram.org/apps</a> adresinden alacağınız API bilgilerinizi ve telefon numaranızı girin.
      </p>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-1">
            API ID <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiHash className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg w-full pl-10 p-2.5 focus:ring-blue-500 focus:border-blue-500"
              placeholder="12345678"
              {...register('api_id', { 
                required: 'API ID gereklidir',
                pattern: {
                  value: /^\d+$/,
                  message: 'API ID sadece rakamlardan oluşmalıdır'
                }
              })}
            />
          </div>
          {errors.api_id && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.api_id.message}</p>
          )}
        </div>
        
        <div>
          <label className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-1">
            API Hash <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiKey className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg w-full pl-10 p-2.5 focus:ring-blue-500 focus:border-blue-500"
              placeholder="abcdef1234567890abcdef1234567890"
              {...register('api_hash', { 
                required: 'API Hash gereklidir',
                minLength: {
                  value: 32,
                  message: 'API Hash en az 32 karakter olmalıdır'
                }
              })}
            />
          </div>
          {errors.api_hash && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.api_hash.message}</p>
          )}
        </div>
        
        <div>
          <label className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-1">
            Telefon Numarası <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiPhone className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg w-full pl-10 p-2.5 focus:ring-blue-500 focus:border-blue-500"
              placeholder="+905551234567"
              {...register('phone', { 
                required: 'Telefon numarası gereklidir',
                pattern: {
                  value: /^\+?[0-9\s]+$/,
                  message: 'Geçerli bir telefon numarası girin'
                }
              })}
            />
          </div>
          {errors.phone && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.phone.message}</p>
          )}
        </div>
        
        <div className="flex justify-between pt-4">
          <button
            type="button"
            onClick={() => navigate('/sessions')}
            className="glass-btn px-4 py-2 flex items-center gap-2"
          >
            <FiArrowLeft className="w-4 h-4" />
            <span>Geri</span>
          </button>
          
          <button
            type="submit"
            disabled={isLoading}
            className="glass-btn glass-gradient-primary text-white px-6 py-2 flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                İşleniyor...
              </>
            ) : (
              <>Devam Et</>
            )}
          </button>
        </div>
      </form>
      
      <div className="text-xs text-gray-500 dark:text-gray-400 mt-6 bg-gray-50 dark:bg-gray-800/30 p-3 rounded-lg border border-gray-200 dark:border-gray-700/30">
        <p className="flex items-center mb-1">
          <FiInfo className="w-4 h-4 mr-2 text-blue-500" />
          API bilgilerinizi almak için Telegram'ın resmi sitesini kullanmanız gerekir.
        </p>
        <ol className="list-decimal ml-5 space-y-1">
          <li>Telegram hesabınızla <a href="https://my.telegram.org" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">my.telegram.org</a> adresine giriş yapın</li>
          <li>"API Development Tools" seçeneğine tıklayın</li>
          <li>Yeni bir uygulama oluşturun ve bilgileri doldurun</li>
          <li>Oluşturduğunuz uygulamadan API ID ve API Hash değerlerini alın</li>
        </ol>
      </div>
    </div>
  );
};

export default NewSessionForm; 