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
      if (token) {
        setIsAuthenticated(true)
        
        // Giriş yapıldığında login sayfasından başka sayfaya yönlendir
        if (location.pathname === '/login') {
          const redirectPath = location.state?.from?.pathname || '/dashboard'
          navigate(redirectPath)
        }
      } else {
        setIsAuthenticated(false)
        
        // Giriş yapılmadığında login sayfasına yönlendir (sonsuz döngüyü engelle)
        if (location.pathname !== '/login') {
          navigate('/login', { state: { from: location } })
        }
      }
      
      setIsCheckingAuth(false)
    }

    checkAuth()
    
    // URL değiştiğinde tekrar kontrol et
    return () => {
      setIsCheckingAuth(true)
    }
  }, [navigate, location])

  // Kimlik doğrulama kontrolü yapılırken loading göster
  if (isCheckingAuth) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spinner size="lg" />
        <p className="ml-2 text-gray-600">Kimlik doğrulanıyor...</p>
      </div>
    )
  }

  // Oturum kontrolünden sonra bileşeni göster veya login sayfasına yönlendir
  return isAuthenticated ? children : null
} 