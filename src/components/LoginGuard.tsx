import { useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { RootState } from '../store'
import { getTestMode } from '../utils/testMode'
import { isMiniApp } from '../utils/env'
import { useAuth } from '../hooks/useAuth'
import Spinner from './ui/Spinner'

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
        // Telegram WebApp verilerini kontrol et
        if (window.Telegram?.WebApp?.initDataUnsafe?.user) {
          const telegramUser = window.Telegram.WebApp.initDataUnsafe.user;
          const initData = window.Telegram.WebApp.initData;
          
          if (telegramUser && initData) {
            console.log('[LoginGuard] Telegram kullanıcı verisi bulundu, giriş yapılıyor');
            
            // Login fonksiyonu ile giriş
            const loginData = { 
              initData,
              user: telegramUser
            };
            
            const success = await login(loginData);
            
            if (success) {
              console.log('[LoginGuard] MiniApp otomatik girişi başarılı');
              return;
            } else {
              console.error('[LoginGuard] MiniApp otomatik girişi başarısız oldu');
            }
          }
        } else {
          console.log('[LoginGuard] Telegram kullanıcı verisi bulunamadı');
        }
      } catch (error) {
        console.error('[LoginGuard] MiniApp girişi sırasında hata:', error);
      }
    };
    
    if (isTelegramMiniApp && !isAuthenticated && !isLoading) {
      processMiniAppAuth();
    }
  }, [isTelegramMiniApp, login, isAuthenticated, isLoading]);

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