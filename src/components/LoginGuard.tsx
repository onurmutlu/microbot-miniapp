import { useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { RootState } from '../store'
import { getTestMode } from '../utils/testMode'
import { isMiniApp } from '../utils/env'
import { useAuth } from '../hooks/useAuth'
import Spinner from './ui/Spinner'
import { toast } from 'react-toastify'

type LoginGuardProps = {
  children: JSX.Element
}

/**
 * Korumalı sayfalar için kimlik doğrulama koruyucusu
 * Kimlik doğrulanmamışsa login sayfasına yönlendirir
 */
export default function LoginGuard({ children }: LoginGuardProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const navigatedRef = useRef(false)
  const processingRef = useRef(false)
  const miniAppProcessedRef = useRef(false)
  
  // Telegram Mini App kontrolü
  const isTelegramMiniApp = isMiniApp()
  
  // Redux store'dan auth durumunu al
  const { isAuthenticated, isLoading } = useSelector((state: RootState) => state.auth)
  
  // Auth hook'undan login fonksiyonu 
  const { login } = useAuth()

  // Telegram Mini App açıldığında otomatik giriş yapma
  useEffect(() => {
    const processMiniAppAuth = async () => {
      // Bu işlem sadece bir kez yapılmalı
      if (miniAppProcessedRef.current || !isTelegramMiniApp) return;
      miniAppProcessedRef.current = true;
      
      console.log('[LoginGuard] Telegram MiniApp olarak çalışıyor, otomatik giriş denenecek');
      
      try {
        // Telegram WebApp verilerini kontrol et - Daha kapsamlı kontrol
        const webAppAvailable = typeof window !== 'undefined' && window.Telegram && !!window.Telegram.WebApp;
        const initDataAvailable = webAppAvailable && !!window.Telegram?.WebApp?.initData;
        const userDataAvailable = webAppAvailable && !!window.Telegram?.WebApp?.initDataUnsafe?.user;
        
        console.log('[LoginGuard] Telegram MiniApp kontrolleri:', { 
          webAppAvailable, 
          initDataAvailable, 
          userDataAvailable 
        });
        
        // WebApp API kullanılabilir ve kullanıcı bilgisi varsa
        if (webAppAvailable && userDataAvailable && window.Telegram?.WebApp) {
          const telegramUser = window.Telegram.WebApp.initDataUnsafe.user;
          const initData = window.Telegram.WebApp.initData;
          
          console.log('[LoginGuard] Telegram kullanıcı verileri:', { 
            user: telegramUser, 
            dataLength: initData?.length || 0 
          });
          
          // WebApp verilerini localStorage'a yedekle (backend bağlantısı kesildiğinde kullanılacak)
          localStorage.setItem('telegram_user', JSON.stringify(telegramUser));
          localStorage.setItem('is_miniapp_session', 'true');
          
          // Login fonksiyonuna gönderilecek veriler
          const loginData = { 
            initData: initData || '',
            initDataUnsafe: window.Telegram.WebApp.initDataUnsafe,
            user: telegramUser
          };
          
          try {
            console.log('[LoginGuard] MiniApp verisi ile giriş deneniyor');
            const success = await login(loginData);
            
            if (success) {
              console.log('[LoginGuard] MiniApp otomatik girişi başarılı');
              toast.success('Telegram MiniApp girişi başarılı');
              
              // Başarılı girişten sonra sayfayı yenileme veya yönlendirme
              if (location.pathname === '/login') {
                // Login sayfasındaysa dashboard'a yönlendir
                navigate('/dashboard', { replace: true });
              }
              
              return;
            } else {
              console.warn('[LoginGuard] MiniApp backend girişi başarısız oldu');
              
              // Backend bağlantısı yoksa veya başarısız olduysa offline modu etkinleştir
              console.log('[LoginGuard] Offline mod etkinleştiriliyor');
              localStorage.setItem('offline_mode', 'true');
              
              // Kullanıcı bilgilerini kaydet
              const offlineToken = `miniapp-offline-${Date.now()}`;
              localStorage.setItem('access_token', offlineToken);
              
              // İşlem başarılı sayılır
              toast.info('Offline modda devam ediliyor');
              
              // Sayfa değişikliği olmadan otomatik algılama için event gönder
              window.dispatchEvent(new StorageEvent('storage', {
                key: 'access_token',
                newValue: offlineToken
              }));
              
              // Sayfa yenileme yerine navigate ile yönlendirme yapalım
              if (location.pathname === '/login') {
                navigate('/dashboard', { replace: true });
              }
              
              return;
            }
          } catch (error) {
            console.error('[LoginGuard] MiniApp giriş hatası:', error);
            
            // Hata durumunda da offline modu etkinleştir
            console.log('[LoginGuard] Hata nedeniyle offline mod etkinleştiriliyor');
            localStorage.setItem('offline_mode', 'true');
            
            const offlineToken = `miniapp-offline-${Date.now()}`;
            localStorage.setItem('access_token', offlineToken);
            
            toast.info('Bağlantı hatası. Offline modda devam ediliyor');
            
            // StorageEvent ile token değişimini bildir
            window.dispatchEvent(new StorageEvent('storage', {
              key: 'access_token',
              newValue: offlineToken
            }));
            
            // Sayfa yenileme yerine navigate ile yönlendirme yapalım
            if (location.pathname === '/login') {
              navigate('/dashboard', { replace: true });
            }
            
            return;
          }
        } else {
          console.warn('[LoginGuard] Telegram WebApp verisi bulunamadı veya eksik', { 
            webAppAvailable, 
            initDataAvailable, 
            userDataAvailable 
          });
          
          if (webAppAvailable && !initDataAvailable) {
            // WebApp var ama initData yok - genelde test ortamlarında oluşan durum
            console.log('[LoginGuard] WebApp mevcut fakat initData yok, test modu etkinleştiriliyor');
            
            if (getTestMode() || import.meta.env.DEV) {
              // Test modunda mock kullanıcı oluştur
              const mockUser = {
                id: Date.now(),
                first_name: 'Test',
                last_name: 'User',
                username: 'test_user',
                photo_url: 'https://t.me/i/userpic/320/vEYvduaYxMadgCBVsAl3s7BPDy2kSm8dkzkKRjMOCgY.jpg'
              };
              
              const mockLoginData = {
                user: mockUser,
                initDataUnsafe: { user: mockUser }
              };
              
              try {
                console.log('[LoginGuard] Test modu: Mock verilerle giriş deneniyor');
                await login(mockLoginData);
                
                if (location.pathname === '/login') {
                  navigate('/dashboard', { replace: true });
                }
              } catch (err) {
                console.error('[LoginGuard] Test giriş hatası:', err);
                toast.error('Test modunda giriş hatası');
              }
            } else {
              toast.error('Telegram kullanıcı verileri alınamadı');
            }
          } else {
            toast.error('Telegram Mini App başlatılamadı');
          }
        }
      } catch (error) {
        console.error('[LoginGuard] MiniApp girişi sırasında beklenmeyen hata:', error);
        toast.error('MiniApp başlatılırken bir hata oluştu');
      }
    };
    
    if (isTelegramMiniApp && !isAuthenticated && !isLoading) {
      processMiniAppAuth();
    }
  }, [isTelegramMiniApp, login, isAuthenticated, isLoading, location.pathname, navigate]);

  // Normal auth flow için useEffect
  useEffect(() => {
    // Eğer zaten yönlendirme yapılmışsa veya işlem devam ediyorsa tekrar çalıştırma
    if (navigatedRef.current || processingRef.current) return
    
    // İşlem başladı
    processingRef.current = true
    
    const validateAuth = () => {
      // Geliştirme test modunda ise izin ver
      if (getTestMode()) {
        console.log('[LoginGuard] Test modu aktif, erişim izni verildi')
        processingRef.current = false
        return
      }
      
      // Offline mod kontrolü - MiniApp ise ve offline_mode flag'i varsa izin ver
      if (isTelegramMiniApp && localStorage.getItem('offline_mode') === 'true') {
        console.log('[LoginGuard] MiniApp offline modda çalışıyor, erişim izni verildi');
        processingRef.current = false;
        return;
      }
      
      // Telegram MiniApp ise ve içeride gerekli bir sayfadaysa
      if (isTelegramMiniApp && (
        location.pathname === '/dashboard' || 
        location.pathname === '/message-templates' ||
        location.pathname.startsWith('/miniapp')
      )) {
        // MiniApp içinde login sayfasına yönlendirmeyi önle
        console.log('[LoginGuard] MiniApp içinde özel sayfaya erişim izni verildi');
        processingRef.current = false;
        return;
      }

      // Kullanıcı giriş yapmamışsa login sayfasına yönlendir
      if (!isAuthenticated && location.pathname !== '/login') {
        console.log('[LoginGuard] Kimlik doğrulanmadı, login sayfasına yönlendiriliyor...')
        navigatedRef.current = true
        navigate('/login', { 
          replace: true,
          state: { from: location.pathname } // Yönlendirme öncesi sayfa bilgisini tut
        })
        return
      }
      
      // Kullanıcı giriş yapmış ve login sayfasındaysa dashboard'a yönlendir
      if (isAuthenticated && location.pathname === '/login') {
        console.log('[LoginGuard] Kullanıcı zaten giriş yapmış, dashboard\'a yönlendiriliyor...')
        navigatedRef.current = true
        navigate('/dashboard', { replace: true })
        return
      }
      
      // İşlem tamamlandı
      processingRef.current = false
    }
    
    // Auth durumu yüklenmediyse bekle, yüklendiyse doğrula
    if (!isLoading) {
      validateAuth()
    }
  }, [isAuthenticated, isLoading, location.pathname, navigate, isTelegramMiniApp])
  
  // Sayfa her değiştiğinde navigasyon referansını sıfırla
  useEffect(() => {
    navigatedRef.current = false
  }, [location.pathname])
    
    // Token değişikliklerini dinle
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'access_token') {
        console.log('[LoginGuard] Token değişikliği algılandı')
        navigatedRef.current = false
        processingRef.current = false
      }
    }
    
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])
  
  // Kimlik doğrulama durumu yüklenirken yükleme ekranı göster
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    )
  }
  
  // Telegram MiniApp ve /miniapp ile başlayan bir sayfa ise
  if (isTelegramMiniApp && location.pathname.startsWith('/miniapp')) {
    return children;
  }
  
  // Giriş yapmadıysa ve login sayfasında değilse, null döndür
  // useEffect içinde yönlendirme yapılacak
  if (!isAuthenticated && location.pathname !== '/login') {
    return null
  }
  
  // Diğer tüm durumlarda çocukları render et
  return children
} 