import React, { useEffect, useState } from 'react'
import { FiAlertTriangle } from 'react-icons/fi'
import SessionInfoCard from './SessionInfoCard'
import PasswordConfirmForm from './PasswordConfirmForm'
import { showError } from '../../utils/toast'

const SessionPage: React.FC = () => {
  const [userData, setUserData] = useState<any>(null)
  const [sessionData, setSessionData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [needPassword, setNeedPassword] = useState(false)

  useEffect(() => {
    // Oturum bilgilerini fetch et
    fetchSessionData()
  }, [])

  const fetchSessionData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/auth/session')
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || 'Oturum bilgisi alınamadı')
      }
      
      // Kullanıcı ve oturum verisini ayarla
      setUserData(data.user)
      setSessionData(data.session)
      
      // 2FA durumunu kontrol et
      if (data.session.requirePassword) {
        setNeedPassword(true)
      }
      
      setError(null)
    } catch (err: any) {
      setError(err.message || 'Bir hata oluştu')
      showError(err.message || 'Oturum bilgileri yüklenirken bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordConfirmed = () => {
    setNeedPassword(false)
    // Yeniden oturum bilgilerini yükle
    fetchSessionData()
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="glass-card glass-gradient-secondary p-6 rounded-xl flex flex-col items-center">
        <FiAlertTriangle className="text-yellow-500 w-12 h-12 mb-4" />
        <h3 className="text-xl font-semibold mb-2">Oturum Hatası</h3>
        <p className="text-gray-600 dark:text-gray-400 text-center">{error}</p>
        <button 
          onClick={fetchSessionData}
          className="glass-btn mt-4 px-4 py-2 rounded-lg font-medium"
        >
          Yeniden Dene
        </button>
      </div>
    )
  }

  if (needPassword) {
    return <PasswordConfirmForm 
      onSuccess={handlePasswordConfirmed} 
      onBackClick={() => setNeedPassword(false)}
    />
  }

  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-bold glass-gradient mb-4">Oturum Bilgileriniz</h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Telegram hesabınız ile ilgili mevcut oturum bilgileriniz aşağıda gösterilmektedir.
      </p>
      
      {userData && sessionData && (
        <SessionInfoCard 
          userData={userData} 
          sessionData={sessionData} 
        />
      )}
    </div>
  )
}

export default SessionPage 