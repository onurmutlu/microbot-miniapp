import React, { useState } from 'react'
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
  Bars3Icon
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
  ChatBubbleOvalLeftEllipsisIcon as ChatBubbleSolidIcon
} from '@heroicons/react/24/solid'

const Sidebar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const location = useLocation()

  const menuItems = [
    { 
      path: '/', 
      name: 'Kontrol Paneli', 
      icon: HomeIcon,
      activeIcon: HomeSolidIcon 
    },
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
      path: '/group-list', 
      name: 'Grup Listesi', 
      icon: UserGroupIcon,
      activeIcon: UserGroupSolidIcon 
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
      activeIcon: ChatBubbleSolidIcon 
    },
    { 
      path: '/scheduler', 
      name: 'Zamanlayıcı', 
      icon: CalendarIcon,
      activeIcon: CalendarSolidIcon 
    },
    { 
      path: '/cron-guide', 
      name: 'Cron Rehberi', 
      icon: BookOpenIcon,
      activeIcon: BookSolidIcon,
      divider: true
    },
    { 
      path: '/system-status', 
      name: 'Sistem Durumu', 
      icon: ServerIcon,
      activeIcon: ServerSolidIcon 
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
        className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-[#3f51b5]/80 text-white md:hidden"
        onClick={toggleSidebar}
      >
        <Bars3Icon className="w-6 h-6" />
      </button>

      {/* Mobil karartma overlay'i */}
      <div className={overlayClasses} onClick={toggleSidebar}></div>

      {/* Sidebar */}
      <aside 
        className={`fixed top-0 left-0 h-full w-72 md:w-64 bg-white/80 dark:bg-gray-800/70 backdrop-blur-xl border-r border-gray-200 dark:border-gray-700 shadow-xl transform transition-transform duration-300 ease-in-out z-50 md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col overflow-hidden">
          {/* Logo ve başlık */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
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
              className="md:hidden p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <XMarkIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

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
                        ? 'bg-[#3f51b5]/10 text-[#3f51b5] dark:bg-[#3f51b5]/20 dark:text-[#5c6bc0] font-medium' 
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50'}
                    `}
                    onClick={() => setIsOpen(false)}
                  >
                    <Icon className="h-5 w-5 mr-3 transition-all" />
                    {item.name}
                  </Link>
                  {item.divider && (
                    <div className="h-px bg-gray-200 dark:bg-gray-700 my-2 mx-3" />
                  )}
                </React.Fragment>
              )
            })}
          </nav>

          {/* Sürüm bilgisi */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-center text-gray-500 dark:text-gray-400">
              MicroBot v1.0.0 <span className="text-[#3f51b5] dark:text-[#5c6bc0]">Beta</span>
            </p>
          </div>
        </div>
      </aside>
    </>
  )
}

export default Sidebar 