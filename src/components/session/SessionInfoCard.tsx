import React, { useState } from 'react'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/tr'
import {
  UserIcon,
  ClockIcon,
  ShieldCheckIcon,
  ArrowPathIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline'

// DayJS için Turkish locale ayarları
dayjs.extend(relativeTime)
dayjs.locale('tr')

interface SessionInfoCardProps {
  userData: {
    id: number
    first_name: string
    last_name?: string
    username?: string
    photo_url?: string
  }
  sessionData: {
    expiresAt: string
  }
}

const SessionInfoCard: React.FC<SessionInfoCardProps> = ({ userData, sessionData }) => {
  const [isExpanded, setIsExpanded] = useState(false)

  // Kullanıcı bilgilerini hazırla
  const fullName = userData?.first_name + (userData?.last_name ? ` ${userData.last_name}` : '')
  
  // Kullanıcı fotoğrafı var mı kontrol et
  const hasPhoto = !!userData?.photo_url
  
  // Oturum süresi bilgilerini hesapla
  const expiresAt = dayjs(sessionData?.expiresAt)
  const isExpired = expiresAt.isBefore(dayjs())
  const timeLeft = expiresAt.fromNow()
  
  return (
    <div className="glass-card glass-gradient-primary p-4 rounded-xl mb-4 shadow-md transition-all duration-300 hover:shadow-lg">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center space-x-3">
          {hasPhoto ? (
            <img 
              src={userData.photo_url} 
              alt={fullName} 
              className="w-12 h-12 rounded-full border-2 border-blue-500/50"
            />
          ) : (
            <div className="glass-btn w-12 h-12 rounded-full flex items-center justify-center bg-blue-100/50 dark:bg-blue-900/50">
              <UserIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          )}
          <div>
            <h3 className="font-semibold text-lg">{fullName}</h3>
            {userData?.username && (
              <p className="text-sm text-gray-600 dark:text-gray-400">@{userData.username}</p>
            )}
          </div>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="glass-btn p-2 rounded-full hover:bg-blue-100/50 dark:hover:bg-blue-900/50 transition-colors"
        >
          {isExpanded ? (
            <ChevronUpIcon className="w-5 h-5" />
          ) : (
            <ChevronDownIcon className="w-5 h-5" />
          )}
        </button>
      </div>

      {isExpanded && (
        <div className="space-y-2 mt-4 animate-fade-in">
          <div className="glass-card bg-gray-50/30 dark:bg-gray-800/30 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <UserIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <div>
                <p className="text-sm font-medium">Telegram ID</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{userData.id}</p>
              </div>
            </div>
          </div>

          <div className="glass-card bg-gray-50/30 dark:bg-gray-800/30 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <ClockIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <div>
                <p className="text-sm font-medium">Oturum Süresi</p>
                <p className={`text-sm ${isExpired ? 'text-red-500' : 'text-green-500'}`}>
                  {isExpired ? 'Süresi doldu' : `${timeLeft} sona erecek`}
                </p>
              </div>
            </div>
          </div>

          <div className="glass-card bg-gray-50/30 dark:bg-gray-800/30 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <ShieldCheckIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <div>
                <p className="text-sm font-medium">Güvenlik Durumu</p>
                <p className="text-sm text-green-500">Telegram ile doğrulanmış</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end mt-3">
        <button 
          className="glass-btn px-3 py-1.5 rounded text-sm font-medium flex items-center space-x-1"
          onClick={() => window.location.reload()}
        >
          <ArrowPathIcon className="w-4 h-4" />
          <span>Yenile</span>
        </button>
      </div>
    </div>
  )
}

export default SessionInfoCard 