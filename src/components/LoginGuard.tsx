import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

export default function LoginGuard({ children }: { children: JSX.Element }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)

  useEffect(() => {
    // İlk render'da kimlik doğrulaması yapılıyor
    const checkAuth = () => {
      const token = localStorage.getItem('access_token')
      
      // Token varsa erişime izin ver
      if (token) {
        setIsAuthenticated(true)
      } else {
        // Token yoksa login sayfasına yönlendir
        setIsAuthenticated(false)
        
        // Şu anki sayfa login değilse yönlendir
        if (location.pathname !== '/login') {
          navigate('/login', { replace: true })
        }
      }
    }
    
    checkAuth()
  }, [navigate, location.pathname])

  // Kimlik doğrulama kontrol edilene kadar bir şey gösterme
  if (isAuthenticated === null) {
    return null
  }

  // Kimlik doğrulanmışsa içeriği göster
  if (isAuthenticated) {
    return children
  }

  // Kimlik doğrulanmamışsa (login sayfasına yönlendirme yapılacak)
  return null
} 