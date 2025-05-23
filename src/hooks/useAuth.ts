import { useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { setCredentials, setLoading, setError, clearError } from '../store/slices/authSlice';
import api from '../config/api';
import { websocketService } from '../services/websocket';
import { getTestMode } from '../utils/testMode';
import { toast } from 'react-toastify';
import { miniAppAuth, validateMiniAppToken } from '../utils/api';

export const useAuth = () => {
  const dispatch = useDispatch();
  const { user, token, isAuthenticated, isLoading, error } = useSelector(
    (state: RootState) => state.auth
  );
  const isAuthInitialized = useRef(false);
  const isLoginInProgress = useRef(false);

  // Giriş hatası varsa temizle
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        dispatch(clearError());
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);

  // Auth State'i başlat
  const initializeAuth = useCallback(async () => {
    if (isAuthInitialized.current) return;
    isAuthInitialized.current = true;
    
    try {
      dispatch(setLoading(true));
      
      // Test modunda otomatik token oluştur
      if (getTestMode()) {
        console.log('[Auth] Test modu aktif, otomatik giriş yapılıyor');
        
        const testUser = {
          id: 'test-user-' + Date.now(),
          username: 'test_user',
          first_name: 'Test',
          last_name: 'User',
          photo_url: 'https://i.pravatar.cc/150?img=3'
        };
        
        const testToken = 'test-token-' + Date.now();
        
        // LocalStorage'e kaydet
        localStorage.setItem('access_token', testToken);
        localStorage.setItem('telegram_user', JSON.stringify(testUser));
        
        // Redux store'a dispatch et
        dispatch(setCredentials({ 
          user: testUser, 
          token: testToken 
        }));
        
        // WebSocket bağlantısını kur
        setTimeout(() => {
          try {
            websocketService.connect();
          } catch (err) {
            console.warn('[Auth] WebSocket bağlantısı kurulamadı (test modu):', err);
          }
        }, 500);
        
        return;
      }
      
      // Token kontrolü
      const existingToken = localStorage.getItem('access_token');
      if (!existingToken) {
        // Token yok, authenticated değil
        console.log('[Auth] Token bulunamadı, giriş yapılmadı');
        dispatch(setLoading(false));
        return;
      }
      
      // Offline mode kontrolü - Eğer offine_mode true ise, localStorage'daki kullanıcı ile devam et
      if (localStorage.getItem('offline_mode') === 'true') {
        console.log('[Auth] Offline mod tespit edildi');
        
        // Kullanıcı bilgilerini al
        const userDataStr = localStorage.getItem('telegram_user');
        if (userDataStr) {
          try {
            const userData = JSON.parse(userDataStr);
            
            // Store'a dispatch et
            dispatch(setCredentials({ 
              user: userData,
              token: existingToken
            }));
            
            console.log('[Auth] Offline mod ile giriş yapıldı');
            dispatch(setLoading(false));
            return;
          } catch (e) {
            console.error('[Auth] LocalStorage user verisi parse edilemedi', e);
          }
        }
      }
      
      // Token doğrulaması ve kullanıcı bilgilerini alma
      try {
        const userDataStr = localStorage.getItem('telegram_user');
        let userData = null;
        
        if (userDataStr) {
          try {
            userData = JSON.parse(userDataStr);
          } catch (e) {
            console.error('[Auth] LocalStorage user verisi parse edilemedi', e);
          }
        }
        
        // MiniApp token doğrulama
        if (window.Telegram?.WebApp?.initData) {
          try {
            // Yeni validate-token endpoint'ini kullan
            const validateResponse = await validateMiniAppToken();
            
            if (validateResponse.success) {
              console.log('[Auth] MiniApp token doğrulaması başarılı:', validateResponse.data);
              
              // Kullanıcı verisini ve token'ı güncelleyebiliriz
              if (validateResponse.data?.user) {
                userData = validateResponse.data.user;
              }
              
              // Yeni token varsa güncelle
              if (validateResponse.data?.token) {
                localStorage.setItem('access_token', validateResponse.data.token);
              }
              
              dispatch(setCredentials({
                user: userData,
                token: existingToken
              }));
              
              // WebSocket bağlantısını kur
              setTimeout(() => {
                try {
                  websocketService.connect();
                } catch (err) {
                  console.warn('[Auth] WebSocket bağlantısı kurulamadı:', err);
                }
              }, 500);
              
              return;
            } else {
              console.warn('[Auth] MiniApp token doğrulaması başarısız, yeniden doğrulama denenecek');
              
              // Token doğrulanamadı, yeniden MiniApp kimlik doğrulama dene
              const authResult = await miniAppAuth();
              if (authResult) {
                console.log('[Auth] MiniApp yeniden doğrulama başarılı');
                
                // Kullanıcı verisini tekrar kontrol et
                const refreshedUserStr = localStorage.getItem('telegram_user');
                if (refreshedUserStr) {
                  try {
                    userData = JSON.parse(refreshedUserStr);
                  } catch (e) {
                    console.error('[Auth] Yenilenen user verisi parse edilemedi', e);
                  }
                }
                
                // Redux store'a dispatch et
                const refreshedToken = localStorage.getItem('access_token');
                dispatch(setCredentials({ 
                  user: userData,
                  token: refreshedToken || existingToken 
                }));
                
                setTimeout(() => {
                  try {
                    websocketService.connect();
                  } catch (err) {
                    console.warn('[Auth] WebSocket bağlantısı kurulamadı:', err);
                  }
                }, 500);
                
                return;
              }
            }
          } catch (validateError) {
            console.error('[Auth] MiniApp token doğrulama hatası:', validateError);
          }
        }
        
        // Backend'den kullanıcı bilgilerini al - Hızlı timeout ile
        try {
          const response = await api.get('/api/auth/me', {
            headers: {
              Authorization: `Bearer ${existingToken}`
            },
            timeout: 2000, // 2 saniye timeout ile backend'e bağlanma dene (daha hızlı kontrol için)
            withCredentials: true // HttpOnly cookie desteği
          });
          
          // Backend'den kullanıcı bilgileri başarıyla alındı
          console.log('[Auth] Kullanıcı bilgileri backend\'den alındı:', response.data);
          
          dispatch(setCredentials({
            user: response.data,
            token: existingToken
          }));
        } catch (apiError) {
          console.warn('[Auth] Backend\'den kullanıcı bilgileri alınamadı:', apiError);
          
          // Backend bağlantısı yoksa veya hata varsa localStorage'deki verilerle devam et
          if (userData) {
            console.log('[Auth] LocalStorage\'daki kullanıcı bilgileriyle devam ediliyor');
            
            dispatch(setCredentials({ 
              user: userData,
              token: existingToken
            }));
          } else {
            // Token var ama kullanıcı bilgileri yok, çıkış yap
            console.warn('[Auth] Token bulundu fakat kullanıcı bilgileri yok, çıkış yapılıyor');
            logout();
            return;
          }
        }
        
        // WebSocket bağlantısını kur
        setTimeout(() => {
          try {
            websocketService.connect();
          } catch (err) {
            console.warn('[Auth] WebSocket bağlantısı kurulamadı:', err);
          }
        }, 500);
      } catch (error) {
        console.error('[Auth] Kimlik doğrulama sırasında hata:', error);
        logout();
      }
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch]);
  
  // Uygulama başladığında auth state'i başlat
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);
  
  // Telegram ile giriş yap
  const login = async (telegramData: any): Promise<boolean> => {
    // Eğer giriş işlemi zaten devam ediyorsa engelle
    if (isLoginInProgress.current) {
      console.log('[Auth] Login işlemi zaten devam ediyor, yeni istek engellendi');
      return false;
    }
    
    isLoginInProgress.current = true;
    dispatch(setLoading(true));
    
    try {
      // Telegram doğrulama verilerini kontrol et
      if (!telegramData) {
        console.error('[Auth] Giriş verileri eksik:', telegramData);
        toast.error('Giriş bilgileri eksik veya hatalı');
        return false;
      }
      
      // Test modunda doğrudan giriş yap
      if (getTestMode()) {
        const testUser = telegramData.user || telegramData || {
          id: 'test-user-' + Date.now(),
          username: 'test_user',
          first_name: 'Test',
          last_name: 'User',
          photo_url: 'https://i.pravatar.cc/150?img=3'
        };
        
        const testToken = 'test-token-' + Date.now();
        
        localStorage.setItem('access_token', testToken);
        localStorage.setItem('telegram_user', JSON.stringify(testUser));
        
        dispatch(setCredentials({
          user: testUser,
          token: testToken
        }));
        
        toast.success('Test modunda giriş başarılı (Simüle edildi)');
        
        // Çerezleri senkronize etmek için storage eventi tetikle
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'access_token',
          newValue: testToken
        }));
        
        return true;
      }

      // MiniApp'den veya InitDataUnsafe'den kullanıcı bilgilerini al
      const userData = telegramData.user || telegramData.initDataUnsafe?.user || telegramData;

      // Eğer kullanıcı bilgisine erişim varsa (MiniApp durumu)
      if (userData && (telegramData.initData || telegramData.initDataUnsafe)) {
        console.log('[Auth] Telegram kullanıcı bilgisi mevcut:', userData);
        
        try {
          // Backend bağlantısını dene (sınırlı süreyle)
          console.log('[Auth] Backend endpoint URL:', `${api.defaults.baseURL}/api/v1/miniapp/auth`);
          console.log('[Auth] Gönderilen veri:', JSON.stringify(telegramData, null, 2));
          
          // Yeni MiniApp auth endpoint'ini kullan
          const response = await api.post('/api/v1/miniapp/auth', telegramData, {
            timeout: 10000, // 10 saniye timeout ile backend bağlantı denemesi
            headers: {
              'Content-Type': 'application/json',
              'X-Debug-Info': 'MiniApp-Auth'
            },
            withCredentials: true // HttpOnly cookie desteği için
          });
          
          // Backend yanıtı başarılı (token doğrudan veya data içinde olabilir)
          const token = response.data?.token || response.data?.data?.token;
          const user = response.data?.user || response.data?.data?.user || userData;
          
          if (token) {
            console.log('[Auth] Backend giriş başarılı:', response.data);
            
            localStorage.setItem('access_token', token);
            localStorage.setItem('telegram_user', JSON.stringify(user));
            localStorage.removeItem('offline_mode'); // Offline modu temizle
            
            dispatch(setCredentials({ 
              user,
              token 
            }));
            
            setTimeout(() => {
              try {
                websocketService.connect();
              } catch (err) {
                console.warn('[Auth] WebSocket bağlantısı kurulamadı:', err);
              }
            }, 500);
            
            window.dispatchEvent(new StorageEvent('storage', {
              key: 'access_token',
              newValue: token
            }));
            
            return true;
          } else {
            throw new Error('Geçersiz token yanıtı');
          }
        } catch (error: any) {
          // Backend bağlantısı kurulamadıysa veya doğrulama başarısız olduysa
          console.warn('[Auth] Backend bağlantısı başarısız, offline kimlik doğrulama kullanılıyor:', error?.message);
          
          // Offline mod için token üret
          const offlineToken = `miniapp-offline-${Date.now()}`;
          
          // Kullanıcı bilgilerini ve offline token'ı kaydet
          localStorage.setItem('access_token', offlineToken);
          localStorage.setItem('telegram_user', JSON.stringify(userData));
          localStorage.setItem('offline_mode', 'true');
          localStorage.setItem('is_miniapp_session', 'true');
          
          dispatch(setCredentials({
            user: userData,
            token: offlineToken
          }));
          
          console.log('[Auth] Offline mod etkinleştirildi');
          
          setTimeout(() => {
            try {
              websocketService.connect();
            } catch (err) {
              console.warn('[Auth] WebSocket bağlantısı kurulamadı:', err);
            }
          }, 500);
          
          window.dispatchEvent(new StorageEvent('storage', {
            key: 'access_token',
            newValue: offlineToken
          }));
          
          return true;
        }
      }
      
      // Gerçek backend giriş işlemi (burası normal web arayüzü için)
      try {
        console.log('[Auth] Backend\'e giriş isteği gönderiliyor:', telegramData);
        console.log('[Auth] Backend endpoint URL:', `${api.defaults.baseURL}/auth/telegram-login`);
        
        // Telegram Auth verilerini backend'e gönder - Direct object gönder
        const response = await api.post('/auth/telegram-login', telegramData, {
          timeout: 10000, // 10 saniye timeout
          headers: {
            'Content-Type': 'application/json',
            'X-Debug-Info': 'Web-Auth'
          },
          withCredentials: true // HttpOnly cookie desteği
        });
        
        // MiniApp yanıt formatı kontrolü (success: false olabilir)
        if (response.data?.success === false) {
          console.error('[Auth] Backend yanıtı success: false -', response.data.message);
          toast.error(response.data.message || 'Giriş işlemi başarısız');
          return false;
        }
        
        if (!response.data) {
          console.error('[Auth] Backend yanıtı geçersiz - yanıt alınamadı');
          toast.error('Sunucu yanıtı geçersiz');
          return false;
        }
        
        // Yanıt içindeki token ve user'ı al (token doğrudan veya data içinde olabilir)
        const token = response.data?.token || response.data?.data?.token;
        const user = response.data?.user || response.data?.data?.user || telegramData;
        
        if (!token) {
          console.error('[Auth] Backend yanıtında token yok:', response.data);
          toast.error('Kimlik doğrulama token\'ı alınamadı');
          return false;
        }
        
        console.log('[Auth] Giriş başarılı:', { user, token });
        
        // Token ve kullanıcı verilerini kaydet
        localStorage.setItem('access_token', token);
        localStorage.setItem('telegram_user', JSON.stringify(user));
        localStorage.removeItem('offline_mode'); // Offline modu temizle
        
        dispatch(setCredentials({ 
          user, 
          token
        }));
        
        setTimeout(() => {
          try {
            websocketService.connect();
          } catch (err) {
            console.warn('[Auth] WebSocket bağlantısı kurulamadı:', err);
          }
        }, 500);
        
        // Çerezleri senkronize etmek için storage eventi tetikle
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'access_token',
          newValue: token
        }));
        
        return true;
      } catch (error: any) {
        console.error('[Auth] Backend giriş hatası:', error);
        
        // Error detaylarını göster
        let errorMsg = 'Giriş yapılırken bir hata oluştu';
        
        // MiniApp formatı kontrolü (success: false)
        if (error.response?.data?.success === false) {
          errorMsg = error.response.data.message || errorMsg;
        } else {
          errorMsg = error.response?.data?.detail || 
                    error.response?.data?.message || 
                    errorMsg;
        }
        
        dispatch(setError(errorMsg));
        
        // Hata alertini göster
        toast.error(errorMsg);
        
        // İstek başarısızsa, fallback giriş
        if (getTestMode() || import.meta.env.DEV) {
          console.log('[Auth] Geliştirme ortamında mock giriş kullanılıyor');
        
        const mockUser = telegramData.user || telegramData || {
          id: Date.now().toString(),
          username: 'mock_user',
          first_name: 'Mock',
          last_name: 'User',
          photo_url: 'https://i.pravatar.cc/150?img=7'
        };
          
        const mockToken = 'mock-token-' + Date.now();
        
        localStorage.setItem('access_token', mockToken);
        localStorage.setItem('telegram_user', JSON.stringify(mockUser));
        
        dispatch(setCredentials({ user: mockUser, token: mockToken }));
        
          toast.warning('Backend bağlantısı kurulamadı. Geliştirme modu aktif.');
          
          // Çerezleri senkronize etmek için storage eventi tetikle
          window.dispatchEvent(new StorageEvent('storage', {
            key: 'access_token',
            newValue: mockToken
          }));
          
        return true;
        } else {
          // Üretim ortamında gerçek hata göster
          return false;
        }
      }
    } catch (unexpectedError) {
      // Beklenmeyen hatalar
      console.error('[Auth] Beklenmeyen giriş hatası:', unexpectedError);
      dispatch(setError('Beklenmeyen bir hata oluştu'));
      toast.error('Giriş sırasında beklenmeyen bir hata oluştu');
      return false;
    } finally {
      dispatch(setLoading(false));
      isLoginInProgress.current = false;
    }
  };
  
  // Çıkış yap
  const logout = useCallback(() => {
    // Redux store'u temizle
    dispatch({ type: 'auth/logout' });
    
    // LocalStorage'den verileri sil
    localStorage.removeItem('access_token');
    localStorage.removeItem('telegram_user');
    localStorage.removeItem('token'); // Eski token varsa
    
    // WebSocket bağlantısını kes
    try {
      websocketService.disconnect();
    } catch (err) {
      console.warn('[Auth] WebSocket bağlantısı kapatılırken hata:', err);
    }
    
    // Çerezleri senkronize etmek için storage eventi tetikle
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'access_token',
      newValue: null
    }));
    
    toast.info('Çıkış yapıldı');
  }, [dispatch]);
  
  // Token güncelleme (refresh token işlemi için)
  const updateToken = useCallback((newToken: string) => {
    // Token'ı güncelle
    localStorage.setItem('access_token', newToken);
    
    // Redux store'u güncelle (eğer kullanıcı verisi varsa)
    if (user) {
      dispatch(setCredentials({ user, token: newToken }));
    }
    
    // API için token'ı güncelle
    api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
  }, [dispatch, user]);

  return {
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    updateToken,
    initializeAuth
  };
}; 