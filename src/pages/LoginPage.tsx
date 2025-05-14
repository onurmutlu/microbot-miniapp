import { useEffect, useState, useRef } from 'react'
import { isMiniApp } from '../utils/env'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { toast } from 'react-toastify'
import { getTestMode } from '../utils/testMode'

// Telegram kullanıcı verisi türü için tip tanımlaması
interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

// NOT: Global Telegram tipleri src/types/telegram.d.ts dosyasında tanımlanmıştır

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as any)?.from || '/dashboard'
  const { login, isAuthenticated, isLoading } = useAuth()
  
  const [isPageLoading, setIsPageLoading] = useState(true)
  const [isScriptLoaded, setIsScriptLoaded] = useState(false)
  const [useSimulation, setUseSimulation] = useState(false)
  const [showDebugPanel, setShowDebugPanel] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)
  const loginProcessRef = useRef(false)
  const scriptAttempts = useRef(0)

  // Telegram callback'i tanımla
  useEffect(() => {
    // Telegram Web Login callback
    if (window.Telegram) {
      // onTelegramAuth özelliğini tür güvenli şekilde ekleyelim
      (window.Telegram as any).onTelegramAuth = async (user: TelegramUser) => {
        if (loginProcessRef.current) {
          console.log('[LoginPage] Giriş işlemi zaten devam ediyor, tekrar edilmedi')
          return;
        }
        
        try {
          loginProcessRef.current = true
          setIsPageLoading(true)
          setLoginError(null)
          
          console.log('[LoginPage] Telegram Login Callback:', user)
          
          // Telegram verilerini doğrula
          if (!user || !user.id) {
            setLoginError('Geçersiz kullanıcı bilgileri')
            toast.error('Geçersiz kullanıcı bilgileri')
            setIsPageLoading(false)
            return
          }
          
          // Backend'e gönderilecek veri - hash doğrulaması için tüm alanları içermeli
          const loginData = { 
            id: user.id,
            first_name: user.first_name,
            last_name: user.last_name || "",
            username: user.username || "",
            photo_url: user.photo_url || "",
            auth_date: user.auth_date,
            hash: user.hash
          }
          
          // Auth hook ile giriş yap
          const success = await login(loginData)
          
          if (success) {
            toast.success('Giriş başarılı!')
            navigate(from, { replace: true })
          } else {
            toast.error('Giriş başarısız')
            setLoginError('Giriş işlemi başarısız oldu')
            setIsPageLoading(false)
          }
        } catch (error) {
          console.error('[LoginPage] Giriş hatası:', error)
          toast.error('Giriş sırasında bir hata oluştu')
          setLoginError('Giriş sırasında beklenmeyen bir hata oluştu')
          setIsPageLoading(false)
        } finally {
          loginProcessRef.current = false
        }
      }
    }
    
    return () => {
      // Temizlik yaparken referansları sıfırla
      if (window.Telegram) {
        (window.Telegram as any).onTelegramAuth = undefined
      }
    }
  }, [login, navigate, from])
  
  // Sayfa yüklendiğinde
  useEffect(() => {
    const initPage = async () => {
      // İlk yükleme
      setIsPageLoading(true)
      
      try {
        // Zaten giriş yapılmış mı kontrol et
        if (isAuthenticated) {
          console.log('[LoginPage] Kullanıcı zaten giriş yapmış, yönlendiriliyor')
          navigate(from, { replace: true })
          return
        }
        
        // Telegram Mini App mı kontrol et
        if (isMiniApp()) {
          await handleMiniAppLogin()
          return
        }
        
        // Test modu kontrolü
        if (getTestMode()) {
          setUseSimulation(true)
        }
      } catch (error) {
        console.error('[LoginPage] Sayfa başlatma hatası:', error)
      } finally {
        setIsPageLoading(false)
      }
    }
    
    initPage()
    
    // Telegram widget'ını yükle (simülasyon kullanılmıyorsa)
    if (!useSimulation) {
      loadTelegramWidget()
    }
  }, [isAuthenticated, navigate, from, useSimulation])
  
  // Telegram Widget yükleme
  const loadTelegramWidget = () => {
    if (loginProcessRef.current) return
    
    try {
      console.log('[LoginPage] Telegram widget yükleniyor')
      
      // Varolan scriptleri temizle
      const existingScripts = document.querySelectorAll('script[id="telegram-login"]')
      if (existingScripts.length > 0) {
        existingScripts.forEach(script => script.remove())
      }
      
      // Login container'ı temizle
      const loginContainer = document.getElementById('telegram-login-container')
      if (loginContainer) {
        loginContainer.innerHTML = ''
      }
      
      // Yeni script oluştur
      const script = document.createElement('script')
      script.id = 'telegram-login'
      script.src = 'https://telegram.org/js/telegram-widget.js?22' // Versiyonu güncelledik
      script.setAttribute('data-telegram-login', 'MicroBotMiniApp_bot') // Doğru bot adını kullan
      script.setAttribute('data-size', 'large')
      script.setAttribute('data-radius', '8')
      script.setAttribute('data-request-access', 'write')
      script.setAttribute('data-userpic', 'false')
      // Burayı kaldırıyoruz çünkü frontend'de işlemi yapacağız
      // script.setAttribute('data-auth-url', 'https://microbot-api.siyahkare.com/api/auth/telegram/callback')
      script.setAttribute('data-onauth', 'Telegram.onTelegramAuth(user)')
      script.async = true
      
      // Scripti ekle
      loginContainer?.appendChild(script)
      
      // Script yükleme durumunu izle
      script.onload = () => {
        console.log('[LoginPage] Telegram widget başarıyla yüklendi')
        setIsScriptLoaded(true)
        scriptAttempts.current = 0 // başarılı olursa sayacı sıfırla
      }
      
      script.onerror = (e) => {
        console.error('[LoginPage] Telegram widget yüklenemedi:', e)
        setLoginError('Telegram login widget yüklenemedi')
        setIsScriptLoaded(false)
        
        // 3 deneme hakkı
        if (scriptAttempts.current < 3) {
          scriptAttempts.current++
          // 2 saniye sonra tekrar dene
          setTimeout(() => {
            console.log(`[LoginPage] Widget yükleme tekrar deneniyor (${scriptAttempts.current}/3)`)
            loadTelegramWidget()
          }, 2000)
        } else {
          setLoginError('Telegram widget yüklenemedi. Lütfen sayfayı yenileyin.')
        }
      }
    } catch (error) {
      console.error('[LoginPage] Widget yükleme hatası:', error)
      setLoginError('Widget yüklenirken bir hata oluştu')
    }
  }
  
  // Mini App otomatik giriş
  const handleMiniAppLogin = async () => {
    if (loginProcessRef.current) return
    
    try {
      loginProcessRef.current = true
      setIsPageLoading(true)
      setLoginError(null)
      
      // Telegram WebApp verisini kontrol et
      if (!window.Telegram?.WebApp?.initData) {
        console.error('[LoginPage] WebApp initData bulunamadı')
        setLoginError('Telegram Mini App verisi bulunamadı')
        toast.error('Telegram Mini App verisi bulunamadı')
        setIsPageLoading(false)
        return
      }
      
      // Debug için WebApp bilgilerini loglama
      console.log('[LoginPage] WebApp bilgileri:', {
        initDataLength: window.Telegram.WebApp.initData?.length || 0,
        user: window.Telegram.WebApp.initDataUnsafe?.user || null,
        startParam: window.Telegram.WebApp.initDataUnsafe?.start_param || null
      });
      
      // Mini App verileriyle oturum aç
      const loginData = {
        initData: window.Telegram.WebApp.initData,
        initDataUnsafe: window.Telegram.WebApp.initDataUnsafe,
        user: window.Telegram.WebApp.initDataUnsafe?.user || {},
        // Ek debug bilgileri
        sessionInfo: {
          userAgent: navigator.userAgent,
          timestamp: Date.now(),
          isWebView: /iPhone|iPad|iPod|Android/i.test(navigator.userAgent),
          referrer: document.referrer,
          screenWidth: window.screen.width,
          screenHeight: window.screen.height
        }
      };
      
      console.log('[LoginPage] Login isteği yapılıyor:', loginData);
      const success = await login(loginData);
      
      if (success) {
        toast.success('Mini App girişi başarılı!')
        navigate(from, { replace: true })
      } else {
        setLoginError('Mini App kimlik doğrulaması başarısız oldu')
        toast.error('Mini App kimlik doğrulaması başarısız oldu')
        setIsPageLoading(false)
      }
    } catch (error) {
      console.error('[LoginPage] Mini App login hatası:', error)
      setLoginError('Mini App girişi sırasında bir hata oluştu')
      toast.error('Mini App kimlik doğrulama hatası')
      setIsPageLoading(false)
    } finally {
      loginProcessRef.current = false
    }
  }
  
  // Manuel giriş butonuna tıklama
  const handleManualLogin = () => {
    if (loginProcessRef.current) return
    
    if (useSimulation) {
      handleSimulatedLogin()
      return
    }
    
    toast.info('Telegram ile giriş yapabilmek için login butonuna tıklayın')
    
    // Telegram widget'ını yeniden yükle
    loadTelegramWidget()
  }
  
  // Simüle edilmiş giriş
  const handleSimulatedLogin = async () => {
    if (loginProcessRef.current) return
    
    try {
      loginProcessRef.current = true
      setIsPageLoading(true)
      setLoginError(null)
      
      // Simüle edilmiş kullanıcı verisi
      const mockUser = {
        id: Math.floor(Math.random() * 1000000),
        first_name: "Test",
        last_name: "User",
        username: "test_user_" + Math.floor(Math.random() * 1000),
        photo_url: "https://i.pravatar.cc/150?img=" + Math.floor(Math.random() * 10),
        auth_date: Math.floor(Date.now() / 1000),
        hash: "simulated_hash_" + Math.random().toString(36).substring(2)
      }
      
      toast.info('Simülasyon: Telegram girişi deneniyor...')
      console.log('[LoginPage] Simüle edilen kullanıcı:', mockUser)
      
      // Login işlemi
      const success = await login(mockUser)
      
      if (success) {
        toast.success('Simülasyon girişi başarılı!')
        setTimeout(() => {
          navigate(from, { replace: true })
        }, 500) // Toast görülebilsin diye kısa gecikme
      } else {
        setLoginError('Simülasyon girişi başarısız oldu')
        toast.error('Simülasyon girişi başarısız')
        setIsPageLoading(false)
      }
    } catch (error) {
      console.error('[LoginPage] Simülasyon hatası:', error)
      setLoginError('Simülasyon sırasında bir hata oluştu')
      toast.error('Simülasyon hatası')
      setIsPageLoading(false)
    } finally {
      loginProcessRef.current = false
    }
  }
  
  // Debug paneli göster/gizle
  const toggleDebugPanel = () => {
    setShowDebugPanel(prev => !prev)
  }
  
  // Yükleniyor ekranı
  if (isPageLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 px-4">
        <div className="bg-gray-800 bg-opacity-70 backdrop-blur-md max-w-md w-full text-center p-8 rounded-xl shadow-xl border border-gray-700 animate-pulse">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <svg className="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Giriş Yapılıyor</h2>
          <p className="text-gray-300">Lütfen bekleyin, işleminiz gerçekleştiriliyor...</p>
        </div>
      </div>
    )
  }
  
  // Giriş sayfası
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 px-4 py-8">
      <div className="bg-gray-800 bg-opacity-70 backdrop-blur-md w-full max-w-md p-8 rounded-xl shadow-2xl border border-gray-700">
        <div className="mb-8 flex justify-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 10l-4 4l6 6l4-16l-18 7l4 2l2 6l3-4"/>
            </svg>
          </div>
        </div>
        
        <h1 className="text-3xl font-extrabold text-center text-white mb-2">Telegram ile Giriş</h1>
        <p className="text-gray-300 text-center mb-8">
          MicroBot'a erişmek için Telegram hesabınızla giriş yapın
        </p>
        
        {/* Hata mesajı */}
        {loginError && (
          <div className="bg-red-900 bg-opacity-60 text-white p-3 rounded-lg mb-6 text-sm">
            <div className="flex items-start">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 mt-0.5 text-red-300" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div>{loginError}</div>
            </div>
          </div>
        )}
        
        {/* Telegram Widget veya Simülasyon */}
        {!useSimulation ? (
          <div id="telegram-login-container" className="flex justify-center mb-6 min-h-[60px]"></div>
        ) : (
          <div className="flex justify-center mb-6">
            <div className="bg-gray-700 rounded-lg border border-gray-600 p-4 w-full">
              <div className="text-center text-gray-300 text-sm mb-2">
                <span className="inline-block px-2 py-1 bg-yellow-600 text-white text-xs rounded mb-2">Test Modu</span>
                <p>Telegram widget yerine simülasyon kullanılıyor</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Giriş butonu */}
        <div className="flex justify-center mt-4">
          <button
            onClick={handleManualLogin}
            disabled={loginProcessRef.current}
            className="px-5 py-3 bg-[#0088cc] text-white rounded-lg shadow-md hover:bg-[#0077b5] transition-colors flex items-center justify-center w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z" />
            </svg>
            {useSimulation ? 'Simüle Edilmiş Giriş Yap' : 'Telegram ile Giriş Yap'}
          </button>
        </div>
        
        {/* Altbilgi */}
        <div className="mt-8 pt-6 border-t border-gray-700">
          <p className="text-sm text-gray-400 text-center">
            Bu uygulama, yalnızca yetkili kullanıcılara açıktır. 
            Giriş yaparak kullanım koşullarını kabul etmiş olursunuz.
          </p>
        </div>
        
        {/* Debug Panel Butonu */}
        <div className="mt-4 flex justify-center">
          <button 
            className="text-xs text-gray-500 hover:text-gray-300"
            onClick={toggleDebugPanel}
          >
            {showDebugPanel ? 'Debug Panelini Gizle' : 'Debug Panelini Göster'}
          </button>
        </div>
        
        {/* Debug Panel */}
        {showDebugPanel && (
          <div className="mt-4 bg-gray-900 p-4 rounded-lg border border-gray-700 text-gray-300 text-xs">
            <h4 className="font-bold mb-2">Debug Bilgileri</h4>
            <div className="space-y-1">
              <p>Bot Kullanıcı Adı: {import.meta.env.VITE_TELEGRAM_BOT_USERNAME || 'MicroBotMiniApp_bot'}</p>
              <p>Widget Durumu: {isScriptLoaded ? 'Yüklendi' : 'Yüklenemedi'}</p>
              <p>Simülasyon Modu: {useSimulation ? 'Aktif' : 'Devre Dışı'}</p>
              <p>Mini App: {isMiniApp() ? 'Evet' : 'Hayır'}</p>
              <p>Test Modu: {getTestMode() ? 'Aktif' : 'Devre Dışı'}</p>
              <div className="flex mt-2 space-x-2">
                <button 
                  className="px-2 py-1 bg-gray-700 rounded hover:bg-gray-600 text-xs"
                  onClick={() => setUseSimulation(true)}
                >
                  Simülasyonu Etkinleştir
                </button>
                <button 
                  className="px-2 py-1 bg-gray-700 rounded hover:bg-gray-600 text-xs"
                  onClick={() => setUseSimulation(false)}
                >
                  Widget'ı Etkinleştir
                </button>
                <button 
                  className="px-2 py-1 bg-gray-700 rounded hover:bg-gray-600 text-xs"
                  onClick={loadTelegramWidget}
                >
                  Widget'ı Yenile
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Sayfa altbilgisi */}
      <div className="mt-6 text-center text-gray-500 text-sm">
        <p>Sorun mu yaşıyorsunuz? <a href="#" className="text-blue-400 hover:underline">Destek alın</a></p>
        <p className="mt-2">© {new Date().getFullYear()} MicroBot - Tüm hakları saklıdır</p>
      </div>
    </div>
  )
} 