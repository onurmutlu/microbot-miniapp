import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  HomeIcon, 
  DocumentTextIcon, 
  ChatBubbleLeftEllipsisIcon, 
  UserGroupIcon, 
  CalendarIcon, 
  Cog6ToothIcon, 
  BookOpenIcon,
  ServerIcon,
  PaperAirplaneIcon,
  ChatBubbleOvalLeftEllipsisIcon,
  XMarkIcon,
  Bars3Icon,
  ShieldCheckIcon,
  UserIcon,
  ChartBarIcon,
  BellIcon,
  ClockIcon,
  QueueListIcon,
  ArrowPathIcon,
  CodeBracketIcon,
  CommandLineIcon,
  DevicePhoneMobileIcon,
  SparklesIcon,
  BeakerIcon
} from '@heroicons/react/24/outline'

import {
  HomeIcon as HomeSolidIcon, 
  DocumentTextIcon as DocumentSolidIcon, 
  ChatBubbleLeftEllipsisIcon as ChatSolidIcon, 
  UserGroupIcon as UserGroupSolidIcon, 
  CalendarIcon as CalendarSolidIcon, 
  Cog6ToothIcon as CogSolidIcon, 
  BookOpenIcon as BookSolidIcon,
  ServerIcon as ServerSolidIcon,
  PaperAirplaneIcon as PaperAirplaneSolidIcon,
  ChatBubbleOvalLeftEllipsisIcon as ChatBubbleSolidIcon,
  ShieldCheckIcon as ShieldCheckSolidIcon,
  UserIcon as UserSolidIcon,
  ChartBarIcon as ChartBarSolidIcon,
  BellIcon as BellSolidIcon,
  ClockIcon as ClockSolidIcon,
  QueueListIcon as QueueListSolidIcon,
  ArrowPathIcon as ArrowPathSolidIcon,
  CodeBracketIcon as CodeBracketSolidIcon,
  CommandLineIcon as CommandLineSolidIcon,
  DevicePhoneMobileIcon as DevicePhoneMobileSolidIcon,
  SparklesIcon as SparklesSolidIcon,
  BeakerIcon as BeakerSolidIcon
} from '@heroicons/react/24/solid'

import { TbTemplate, TbAutomation, TbUsers, TbMessage, TbDeviceMobile, TbCalendarTime, TbBrandTelegram, TbWaveSine } from 'react-icons/tb';
import { FiSettings, FiHome, FiServer, FiMessageSquare, FiUserPlus, FiUsers, FiSend, FiInbox, FiClock, FiRadio } from 'react-icons/fi';

const Sidebar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const location = useLocation()
  const [hasActiveSession, setHasActiveSession] = useState<boolean>(false)

  useEffect(() => {
    // Aktif oturum kontrolü
    const checkSession = () => {
      setHasActiveSession(localStorage.getItem('telegram_session') !== null);
    };
    
    // İlk yükleme kontrolü
    checkSession();
    
    // Local storage değişikliğini dinle
    window.addEventListener('storage', checkSession);
    
    return () => {
      window.removeEventListener('storage', checkSession);
    };
  }, []);

  const menuItems = [
    // Ana Modüller
    { 
      path: '/dashboard', 
      name: 'Kontrol Paneli', 
      icon: HomeIcon,
      activeIcon: HomeSolidIcon 
    },
    { 
      path: '/statistics', 
      name: 'İstatistikler', 
      icon: ChartBarIcon,
      activeIcon: ChartBarSolidIcon 
    },
    { 
      path: '/sessions', 
      name: 'Telegram Hesaplarım', 
      icon: UserIcon,
      activeIcon: UserSolidIcon,
      badge: !hasActiveSession ? {
        text: "Gerekli",
        color: "bg-red-500"
      } : null
    },
    {
      path: '/login',
      name: 'Giriş Yap',
      icon: ShieldCheckIcon,
      activeIcon: ShieldCheckSolidIcon,
      divider: true
    },
    
    // AI ve Analiz Modülleri
    { 
      path: '/ai/content-optimization', 
      name: 'İçerik Optimizasyonu', 
      icon: SparklesIcon,
      activeIcon: SparklesSolidIcon
    },
    { 
      path: '/ai/group-analysis', 
      name: 'Grup Analizi', 
      icon: BeakerIcon,
      activeIcon: BeakerSolidIcon,
      divider: true
    },
    
    // Mesajlaşma Modülleri
    { 
      path: '/message-templates', 
      name: 'Mesaj Şablonları', 
      icon: DocumentTextIcon,
      activeIcon: DocumentSolidIcon 
    },
    { 
      path: '/auto-reply-rules', 
      name: 'Otomatik Yanıt', 
      icon: ChatBubbleLeftEllipsisIcon,
      activeIcon: ChatSolidIcon 
    },
    { 
      path: '/message-send', 
      name: 'Mesaj Gönder', 
      icon: PaperAirplaneIcon,
      activeIcon: PaperAirplaneSolidIcon 
    },
    { 
      path: '/dm-panel', 
      name: 'DM Paneli', 
      icon: ChatBubbleOvalLeftEllipsisIcon,
      activeIcon: ChatBubbleSolidIcon,
      divider: true
    },
    
    // Grup Yönetimi
    { 
      path: '/group-list', 
      name: 'Grup Listesi', 
      icon: UserGroupIcon,
      activeIcon: UserGroupSolidIcon 
    },
    {
      path: '/group-management',
      name: 'Grup Yönetimi',
      icon: QueueListIcon,
      activeIcon: QueueListSolidIcon
    },
    {
      path: '/member-tracking',
      name: 'Üye Takibi',
      icon: ({ className }: { className?: string }) => <TbUsers className={className} />,
      activeIcon: ({ className }: { className?: string }) => <TbUsers className={className} />,
      divider: true
    },
    
    // Zamanlanmış Görevler
    { 
      path: '/scheduler', 
      name: 'Zamanlayıcı', 
      icon: CalendarIcon,
      activeIcon: CalendarSolidIcon 
    },
    {
      path: '/recurring-tasks',
      name: 'Yinelenen Görevler',
      icon: ArrowPathIcon,
      activeIcon: ArrowPathSolidIcon
    },
    { 
      path: '/cron-guide', 
      name: 'Cron Rehberi', 
      icon: BookOpenIcon,
      activeIcon: BookSolidIcon,
      divider: true
    },

    // Bildirimler ve SSE
    {
      path: '/notifications',
      name: 'Bildirimler',
      icon: BellIcon,
      activeIcon: BellSolidIcon
    },
    {
      path: '/sse-demo',
      name: 'SSE Demo',
      icon: ({ className }: { className?: string }) => <TbWaveSine className={className} />,
      activeIcon: ({ className }: { className?: string }) => <TbWaveSine className={className} />,
    },
    {
      path: '/sse-client-demo',
      name: 'SSE Rehber',
      icon: ({ className }: { className?: string }) => <FiRadio className={className} />,
      activeIcon: ({ className }: { className?: string }) => <FiRadio className={className} />,
      divider: true
    },
    
    // MiniApp ve Botlar
    {
      path: '/miniapp',
      name: 'MiniApp Demo',
      icon: DevicePhoneMobileIcon,
      activeIcon: DevicePhoneMobileSolidIcon
    },
    {
      path: '/telegram-api',
      name: 'Telegram API',
      icon: ({ className }: { className?: string }) => <TbBrandTelegram className={className} />,
      activeIcon: ({ className }: { className?: string }) => <TbBrandTelegram className={className} />,
      divider: true
    },
    
    // Sistem ve Ayarlar
    { 
      path: '/system-status', 
      name: 'Sistem Durumu', 
      icon: ServerIcon,
      activeIcon: ServerSolidIcon 
    },
    {
      path: '/system/errors',
      name: 'Hata Raporları',
      icon: CodeBracketIcon,
      activeIcon: CodeBracketSolidIcon
    },
    {
      path: '/system/websocket',
      name: 'WebSocket Yönetimi',
      icon: CommandLineIcon,
      activeIcon: CommandLineSolidIcon,
      divider: true
    },
    { 
      path: '/settings', 
      name: 'Ayarlar', 
      icon: Cog6ToothIcon,
      activeIcon: CogSolidIcon
    }
  ]

  const toggleSidebar = () => {
    setIsOpen(!isOpen)
  }

  // Mobil görünümde arka planı karartır
  const overlayClasses = isOpen 
    ? 'md:hidden fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300 opacity-100' 
    : 'md:hidden fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300 opacity-0 pointer-events-none'

  return (
    <>
      {/* Hamburger menü butonu - yalnızca mobil */}
      <button 
        className="fixed top-4 left-4 z-50 p-2 rounded-lg glass-btn bg-[#3f51b5]/80 text-white md:hidden"
        onClick={toggleSidebar}
      >
        <Bars3Icon className="w-6 h-6" />
      </button>

      {/* Mobil karartma overlay'i */}
      <div className={overlayClasses} onClick={toggleSidebar}></div>

      {/* Sidebar */}
      <aside 
        className={`fixed top-0 left-0 h-full w-72 md:w-64 glass-card border-r border-gray-200/30 dark:border-gray-700/30 shadow-xl transform transition-transform duration-300 ease-in-out z-50 md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col overflow-hidden">
          {/* Logo ve başlık */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200/30 dark:border-gray-700/30 glass-gradient-primary">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-[#3f51b5] flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 10l-4 4l6 6l4-16l-18 7l4 2l2 6l3-4"/>
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800 dark:text-white">MicroBot</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">Telegram Mini App</p>
              </div>
            </div>
            <button 
              onClick={toggleSidebar} 
              className="md:hidden p-1.5 rounded-lg hover:bg-gray-100/50 dark:hover:bg-gray-700/50"
            >
              <XMarkIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* Oturum durumu */}
          {!hasActiveSession && (
            <div className="glass-card glass-gradient-primary border-l-4 border-red-500 p-2 m-2 rounded">
              <div className="flex items-center text-xs text-red-700 dark:text-red-300">
                <ShieldCheckIcon className="w-4 h-4 mr-1" />
                <span>Telegram oturumu gerekli</span>
              </div>
            </div>
          )}

          {/* Menü öğeleri */}
          <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
            {menuItems.map((item) => {
              const isActive = 
                location.pathname === item.path || 
                (location.pathname.startsWith(item.path) && item.path !== '/')
              
              const Icon = isActive ? item.activeIcon : item.icon
              
              return (
                <React.Fragment key={item.path}>
                  <Link
                    to={item.path}
                    className={`
                      flex items-center px-4 py-2.5 rounded-lg transition-all duration-200
                      ${isActive 
                        ? 'glass-btn glass-gradient-primary font-medium' 
                        : 'text-gray-700 dark:text-gray-300 hover:glass-btn hover:bg-gray-100/30 dark:hover:bg-gray-700/30'}
                    `}
                    onClick={() => setIsOpen(false)}
                  >
                    <Icon className={`h-5 w-5 mr-3 transition-all ${isActive ? 'animate-pulse' : ''}`} />
                    <span className="flex-grow">{item.name}</span>
                    
                    {item.badge && (
                      <span className={`inline-block px-2 py-0.5 ml-2 text-xs font-medium rounded-full ${item.badge.color} text-white animate-pulse`}>
                        {item.badge.text}
                      </span>
                    )}
                  </Link>
                  {item.divider && (
                    <div className="h-px bg-gray-200/30 dark:bg-gray-700/30 my-2 mx-3" />
                  )}
                </React.Fragment>
              )
            })}
          </nav>

          {/* Sürüm bilgisi */}
          <div className="p-4 border-t border-gray-200/30 dark:border-gray-700/30 glass-gradient-secondary">
            <p className="text-xs text-center text-gray-500 dark:text-gray-400">
              MicroBot v1.6.0 <span className="text-[#3f51b5] dark:text-[#5c6bc0] animate-pulse">Beta</span>
            </p>
          </div>
        </div>
      </aside>
    </>
  )
}

export default Sidebar 