import axios from 'axios'
import Telegram from '@twa-dev/sdk'

// Axios instance oluştur
const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// JWT token yönetimi için interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Hata işleme için interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // 401 hatası durumunda Telegram init data ile otomatik login deneme
    if (error.response?.status === 401) {
      try {
        const initData = Telegram.initData
        if (initData) {
          const response = await axios.post('http://localhost:8000/api/auth/telegram', {
            initData
          })
          if (response.data.token) {
            localStorage.setItem('access_token', response.data.token)
            
            // Yeni token ile orijinal isteği tekrarla
            const originalRequest = error.config
            originalRequest.headers.Authorization = `Bearer ${response.data.token}`
            return axios(originalRequest)
          }
        }
      } catch (loginError) {
        console.error('Telegram login hatası:', loginError)
      }
    }
    return Promise.reject(error)
  }
)

export default api

// Yardımcı fonksiyonlar
export const initAuth = async () => {
  try {
    // Telegram initData'yı kullanarak authentication
    const initData = Telegram.initData
    if (initData) {
      const response = await axios.post('http://localhost:8000/api/auth/telegram', {
        initData
      })
      if (response.data.token) {
        localStorage.setItem('access_token', response.data.token)
        return true
      }
    }
    return false
  } catch (error) {
    console.error('Authentication hatası:', error)
    return false
  }
} 