import { useEffect, useState } from 'react'
import { isMiniApp } from '../utils/env'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { toast } from 'react-toastify'
import { getTestMode } from '../utils/testMode'

declare global {
  interface Window {
    onTelegramAuth?: (user: any) => void
  }
}

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [isScriptLoaded, setIsScriptLoaded] = useState(false)
  const [useSimulation, setUseSimulation] = useState(false)
  const [showDebugPanel, setShowDebugPanel] = useState(false)

  useEffect(() => {
    // Token kontrolü ve sayfa yönlendirmesi
    const checkAuthentication = async () => {
      // Token varsa ana sayfaya yönlendir (zaten giriş yapılmış)
      const token = localStorage.getItem('access_token') || localStorage.getItem('token')
      if (token) {
        navigate('/', { replace: true })
        return
      }

      // MiniApp kontrolü
      if (isMiniApp()) {
        // Mini uygulamada otomatik giriş yapılmalı
        await handleMiniAppLogin()
        return
      }

      // Test modu kontrolü
      if (getTestMode()) {
        setUseSimulation(true)
      }

      // Normal web tarayıcı için yükleme durumunu sonlandır
      setIsLoading(false)
    }

    // Telegram Web Login callback tanımla
    window.onTelegramAuth = async (user) => {
      try {
        setIsLoading(true)
        console.log('Telegram Auth başarılı:', user)
        
        const loginSuccess = await login({ user })
        
        if (loginSuccess) {
          navigate('/', { replace: true })
        } else {
          toast.error('Giriş başarısız')
          setIsLoading(false)
        }
      } catch (error) {
        console.error('Login error:', error)
        toast.error('Giriş işlemi sırasında bir hata oluştu')
        setIsLoading(false)
      }
    }

    // İlk yükleme
    checkAuthentication()

    // Telegram Login Widget'ını ekle
    if (!useSimulation) {
      loadTelegramWidget()
    }

    // Cleanup
    return () => {
      if (window.onTelegramAuth) {
        delete window.onTelegramAuth
      }
    }
  }, [navigate, login, useSimulation])
  
  // Telegram Widget'ını yükle
  const loadTelegramWidget = () => {
    if (isScriptLoaded) return

    try {
      const script = document.createElement('script')
      script.src = 'https://telegram.org/js/telegram-widget.js?22'
      script.async = true
      script.setAttribute('data-telegram-login', import.meta.env.VITE_TELEGRAM_BOT_USERNAME || 'MicroBotMiniApp_bot')
      script.setAttribute('data-size', 'large')
      script.setAttribute('data-userpic', 'true')
      script.setAttribute('data-onauth', 'onTelegramAuth(user)')
      script.setAttribute('data-request-access', 'write')
      script.setAttribute('data-radius', '8')
      
      script.onload = () => {
        setIsScriptLoaded(true)
        console.log('Telegram widget yüklendi')
      }
      
      script.onerror = (error) => {
        console.error('Telegram widget yüklenirken hata:', error)
        setIsScriptLoaded(false)
        setUseSimulation(true)
        toast.error('Telegram giriş butonu yüklenemedi. Simülasyon modu etkinleştirildi.')
      }
      
      const container = document.getElementById('telegram-login-container')
      if (container) {
        // Önceki widget'ları temizle
        while (container.firstChild) {
          container.removeChild(container.firstChild)
        }
        container.appendChild(script)
      } else {
        console.error('telegram-login-container elementi bulunamadı')
      }
    } catch (error) {
      console.error('Telegram widget eklenirken hata:', error)
      setUseSimulation(true)
    }
  }
  
  // Mini Uygulamada otomatik giriş
  const handleMiniAppLogin = async () => {
    try {
      setIsLoading(true)
      
      // Telegram Mini App entegrasyonu için otomatik giriş
      if (!window.Telegram?.WebApp?.initData) {
        console.error('Telegram WebApp initData bulunamadı')
        toast.error('Telegram Mini App verisi bulunamadı')
        setIsLoading(false)
        return
      }
      
      const loginSuccess = await login({ initData: window.Telegram.WebApp.initData })
      
      if (loginSuccess) {
        navigate('/', { replace: true })
      } else {
        toast.error('Telegram Mini App kimlik doğrulaması başarısız oldu')
        setIsLoading(false)
      }
    } catch (error) {
      console.error('Mini App login error:', error)
      toast.error('Mini App kimlik doğrulama hatası')
      setIsLoading(false)
    }
  }
  
  // Manuel Telegram giriş butonu
  const handleManualLogin = () => {
    if (useSimulation) {
      handleSimulatedLogin()
      return
    }
    
    toast.info('Telegram ile giriş deneniyor...')
    
    // Telegram widget'ını yeniden yükle
    loadTelegramWidget()
    
    // Eğer Telegram widget zaten yüklü değilse
    if (!isScriptLoaded) {
      toast.info('Telegram giriş butonu yükleniyor. Lütfen bekleyin...')
    }
  }
  
  // Simüle edilmiş Telegram giriş
  const handleSimulatedLogin = async () => {
    try {
      setIsLoading(true)
      
      // Simüle edilmiş Telegram kullanıcı verisi
      const mockUser = {
        id: Math.floor(Math.random() * 1000000),
        first_name: "Test",
        last_name: "User",
        username: "test_user_" + Math.floor(Math.random() * 1000),
        photo_url: "https://i.pravatar.cc/150?img=" + Math.floor(Math.random() * 10),
        auth_date: Math.floor(Date.now() / 1000),
        hash: "simulated_hash_" + Math.random().toString(36).substring(2)
      }
      
      toast.info('Simülasyon: Telegram giriş yapılıyor...')
      console.log('Simüle edilen kullanıcı:', mockUser)
      
      // Login işlemini çağır
      const success = await login({ user: mockUser })
      
      if (success) {
        navigate('/', { replace: true })
      } else {
        toast.error('Simüle edilmiş giriş başarısız oldu')
        setIsLoading(false)
      }
    } catch (error) {
      console.error('Simülasyon giriş hatası:', error)
      toast.error('Giriş simülasyonu sırasında bir hata oluştu')
      setIsLoading(false)
    }
  }
  
  // Debug paneli aç/kapat
  const toggleDebugPanel = () => {
    setShowDebugPanel(prev => !prev)
  }

  if (isLoading) {
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
        
        <div className="flex justify-center mt-4">
          <button
            onClick={handleManualLogin}
            className="px-5 py-3 bg-[#0088cc] text-white rounded-lg shadow-md hover:bg-[#0077b5] transition-colors flex items-center justify-center w-full"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z" />
            </svg>
            {useSimulation ? 'Simüle Edilmiş Giriş Yap' : 'Telegram ile Giriş Yap'}
          </button>
        </div>
        
        <div className="mt-8 pt-6 border-t border-gray-700">
          <p className="text-sm text-gray-400 text-center">
            Bu uygulama, yalnızca yetkili kullanıcılara açıktır. 
            Giriş yaparak <a href="#" className="text-blue-400 hover:underline">kullanım koşullarını</a> kabul etmiş olursunuz.
          </p>
        </div>
        
        {/* Debug Panel Toggle */}
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
              <p>Bot Kullanıcı Adı: {import.meta.env.VITE_TELEGRAM_BOT_USERNAME || 'Tanımlanmamış'}</p>
              <p>Widget Durumu: {isScriptLoaded ? 'Yüklendi' : 'Yüklenemedi'}</p>
              <p>Simülasyon Modu: {useSimulation ? 'Aktif' : 'Devre Dışı'}</p>
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
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="mt-6 text-center text-gray-500 text-sm">
        <p>Sorun mu yaşıyorsunuz? <a href="#" className="text-blue-400 hover:underline">Destek alın</a></p>
        <p className="mt-2">© {new Date().getFullYear()} MicroBot - Tüm hakları saklıdır</p>
      </div>
    </div>
  )
} 