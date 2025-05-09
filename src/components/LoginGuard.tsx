import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { getTestMode } from '../utils/testMode'
import { toast } from 'react-toastify'
import Spinner from './ui/Spinner'

export default function LoginGuard({ children }: { children: JSX.Element }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)

  useEffect(() => {
    const checkAuth = () => {
      setIsCheckingAuth(true)
      
      // Test modunda otomatik kimlik doğrulama
      if (getTestMode()) {
        console.log('Test modu aktif: Otomatik kimlik doğrulama yapılıyor')
        
        // Eğer token yoksa otomatik oluştur
        if (!localStorage.getItem('access_token')) {
          localStorage.setItem('access_token', 'test-token-' + Math.random().toString(36).substring(2))
          localStorage.setItem('user', JSON.stringify({
            id: 12345,
            username: 'test_user',
            first_name: 'Test',
            last_name: 'User',
            is_bot: false,
            language_code: 'tr'
          }))
        }
        
        setIsAuthenticated(true)
        setIsCheckingAuth(false)
        
        // Login sayfasındaysan dashboard'a yönlendir
        if (location.pathname === '/login') {
          navigate('/dashboard')
        }
        
        return
      }
      
      // Normal mod - token kontrolü yap
      const token = localStorage.getItem('access_token')
      const telegramUser = localStorage.getItem('telegram_user')
      
      const isAuth = !!token && !!telegramUser
      
      setIsAuthenticated(isAuth)
      setIsCheckingAuth(false)
      
      // Kimlik doğrulanmamışsa ve login sayfasında değilse login'e yönlendir
      if (!isAuth && location.pathname !== '/login') {
        // Asenkron çalıştır ki render hatası olmasın
        setTimeout(() => {
          navigate('/login', { replace: true })
        }, 0)
      }
      
      // Kimlik doğrulanmışsa ve login sayfasındaysa dashboard'a yönlendir
      if (isAuth && location.pathname === '/login') {
        // Asenkron çalıştır ki render hatası olmasın
        setTimeout(() => {
          navigate('/dashboard', { replace: true })
        }, 0)
      }
    }
    
    checkAuth()
    
    // Token değişikliklerini dinle
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'access_token' || e.key === 'telegram_user') {
        checkAuth()
      }
    }
    
    window.addEventListener('storage', handleStorageChange)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [navigate, location.pathname])
  
  // Oturum kontrolü hala devam ediyorsa bekleme ekranını göster
  if (isCheckingAuth) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spinner size="lg" />
      </div>
    )
  }
  
  // Login sayfasında değilse ve kimlik doğrulanmamışsa boş döndür
  // (useEffect zaten yönlendirme yapacak)
  if (!isAuthenticated && location.pathname !== '/login') {
    return null
  }
  
  // Diğer tüm durumlarda çocukları render et
  return children
} 