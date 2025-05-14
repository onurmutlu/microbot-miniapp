import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { showError, showSuccess } from '../utils/toast';
import { UserCircleIcon } from '@heroicons/react/24/outline';
import Spinner from '../components/ui/Spinner';

const NewSessionPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    phone: '',
    api_id: '',
    api_hash: '',
    license_key: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const navigate = useNavigate();
  
  useEffect(() => {
    fetchUserProfile();
  }, []);
  
  const fetchUserProfile = async () => {
    try {
      setIsLoading(true);
      await api.get('/user/profile');
    } catch (error) {
      console.error('Kullanıcı profili alınırken hata:', error);
      showError('Kullanıcı bilgileri yüklenemedi. Lütfen daha sonra tekrar deneyin.');
      // Hata durumunda kullanıcıyı sessions sayfasına yönlendir
      navigate('/sessions');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.phone) {
      newErrors.phone = 'Telefon numarası gereklidir';
    } else if (!/^\+?[0-9\s]+$/.test(formData.phone)) {
      newErrors.phone = 'Geçerli bir telefon numarası girin';
    }
    
    if (!formData.api_id) {
      newErrors.api_id = 'API ID gereklidir';
    } else if (!/^\d+$/.test(formData.api_id)) {
      newErrors.api_id = 'API ID sadece rakamlardan oluşmalıdır';
    }
    
    if (!formData.api_hash) {
      newErrors.api_hash = 'API Hash gereklidir';
    } else if (formData.api_hash.length < 32) {
      newErrors.api_hash = 'API Hash en az 32 karakter olmalıdır';
    }
    
    if (!formData.license_key) {
      newErrors.license_key = 'Lisans anahtarı gereklidir';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Önce lisans anahtarını kontrol et
      const licenseResponse = await api.post('/license/validate', {
        license_key: formData.license_key
      });
      
      if (!licenseResponse.data.valid) {
        showError('Geçersiz lisans anahtarı. Lütfen geçerli bir anahtar girin.');
        setErrors(prev => ({...prev, license_key: 'Geçersiz lisans anahtarı'}));
        return;
      }
      
      // Telefon numarasını formatla (+ işaretini kaldır ve boşlukları sil)
      const phone = formData.phone.replace(/\+/g, '').replace(/\s/g, '');
      
      const response = await api.post('/telegram/start-login', {
        api_id: formData.api_id,
        api_hash: formData.api_hash,
        phone,
        license_key: formData.license_key
      });
      
      showSuccess('Doğrulama kodu gönderildi. Lütfen telefonunuza gelen kodu girin.');
      
      // Doğrulama kodu sayfasına yönlendir
      navigate('/session', { 
        state: { 
          phone,
          api_id: formData.api_id,
          api_hash: formData.api_hash,
          license_key: formData.license_key,
          phone_code_hash: response.data.phone_code_hash
        } 
      });
      
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Bir hata oluştu.';
      showError(`İşlem başarısız: ${errorMessage}`);
      console.error('Oturum başlatma hatası:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <UserCircleIcon className="w-8 h-8 mr-2 text-indigo-600 dark:text-indigo-400" />
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Telegram Hesabınızı Bağlayın</h1>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Telefon Numarası
              </label>
              <input
                type="text"
                id="phone"
                name="phone"
                placeholder="+905xxxxxxxxx"
                value={formData.phone}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 rounded-lg border ${errors.phone ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-900 text-gray-900 dark:text-white`}
              />
              {errors.phone && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.phone}</p>}
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Uluslararası format ile giriş +90...</p>
            </div>
            
            <div>
              <label htmlFor="api_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                API ID
              </label>
              <input
                type="text"
                id="api_id"
                name="api_id"
                placeholder="123456"
                value={formData.api_id}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 rounded-lg border ${errors.api_id ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-900 text-gray-900 dark:text-white`}
              />
              {errors.api_id && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.api_id}</p>}
            </div>
            
            <div>
              <label htmlFor="api_hash" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                API Hash
              </label>
              <input
                type="text"
                id="api_hash"
                name="api_hash"
                placeholder="a1b2c3d4e5f6g7h8i9j0..."
                value={formData.api_hash}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 rounded-lg border ${errors.api_hash ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-900 text-gray-900 dark:text-white`}
              />
              {errors.api_hash && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.api_hash}</p>}
            </div>
            
            <div>
              <label htmlFor="license_key" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Lisans Anahtarı
              </label>
              <input
                type="text"
                id="license_key"
                name="license_key"
                placeholder="TRIAL-XXXX-XXXX"
                value={formData.license_key}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 rounded-lg border ${errors.license_key ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-900 text-gray-900 dark:text-white`}
              />
              {errors.license_key && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.license_key}</p>}
            </div>
            
            <div className="flex justify-between items-center pt-4">
              <a href="#" onClick={() => navigate('/sessions')} className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
                Geri Dön
              </a>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {isSubmitting ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    İşleniyor...
                  </div>
                ) : (
                  "Hesabımı Doğrula"
                )}
              </button>
            </div>
          </form>
          
          <div className="mt-6 text-center">
            <a href="#" onClick={() => navigate('/admin-login')} className="text-xs text-gray-500 dark:text-gray-400 hover:underline">
              Admin girişi yap
            </a>
          </div>
        </div>
      </div>
      
      <div className="mt-6 text-sm text-gray-600 dark:text-gray-400">
        <p className="mb-2">API bilgilerinizi almak için:</p>
        <ol className="list-decimal pl-5 space-y-1">
          <li>Telegram hesabınızla <a href="https://my.telegram.org/apps" target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:underline">my.telegram.org/apps</a> adresine giriş yapın</li>
          <li>Yeni bir uygulama oluşturun ve gerekli bilgileri doldurun</li>
          <li>API ID ve API Hash değerlerinizi alın</li>
        </ol>
      </div>
    </div>
  );
};

export default NewSessionPage; 