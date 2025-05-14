import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { showError, showSuccess } from '../utils/toast';
import { adminService } from '../services/adminService';

const AdminLogin: React.FC = () => {
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Admin zaten giriş yapmışsa admin paneline yönlendir
    if (adminService.isLoggedIn()) {
      navigate('/admin/licenses');
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password.trim()) {
      setError('Şifre gereklidir');
      return;
    }
    
    try {
      setIsLoading(true);
      setError('');
      
      const result = await adminService.login(password);
      
      if (result.success) {
        showSuccess(`${result.role === 'root' ? 'Root Admin' : 'Admin'} girişi başarılı`);
        
        // Admin paneline yönlendir
        navigate('/admin/licenses');
      } else {
        setError(result.message || 'Geçersiz şifre');
      }
    } catch (error: any) {
      console.error('Admin girişi hatası:', error);
      setError('Giriş yapılırken bir hata oluştu');
      showError('Giriş başarısız');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <svg 
            className="mx-auto h-12 w-12 text-white"
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" 
            />
          </svg>
          <h2 className="mt-4 text-2xl font-bold text-white">Telegram Grup Botu</h2>
          <p className="mt-1 text-sm text-gray-400">Kullanıcı Yönetim Sistemi</p>
        </div>
        
        <div className="bg-gray-800 border border-purple-800/30 shadow-lg rounded-lg overflow-hidden">
          <div className="p-6">
            <h3 className="text-xl font-semibold text-center text-white mb-6">Admin Girişi</h3>
            
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="password" className="block text-sm font-medium text-gray-400 mb-1">
                  Admin Şifresi
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 rounded-md border border-gray-700 bg-gray-900 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Admin şifresini girin"
                />
                {error && (
                  <p className="mt-1 text-sm text-red-400">{error}</p>
                )}
              </div>
              
              <div className="mt-6">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full px-4 py-2 text-white font-medium bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors duration-200"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Giriş Yapılıyor...
                    </div>
                  ) : (
                    "Admin Girişi Yap"
                  )}
                </button>
              </div>
            </form>
            
            <div className="mt-4 text-center">
              <a 
                href="#" 
                onClick={() => navigate('/sessions')}
                className="text-sm text-gray-400 hover:text-gray-300"
              >
                Kullanıcı Girişine Dön
              </a>
            </div>
          </div>
        </div>
        
        <div className="mt-6 text-center text-xs text-gray-500">
          © {new Date().getFullYear()} Telegram Grup Botu
        </div>
      </div>
    </div>
  );
};

export default AdminLogin; 