import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  HomeIcon,
  DocumentTextIcon,
  ChatBubbleLeftEllipsisIcon,
  UserGroupIcon,
  CalendarIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeSolidIcon,
  DocumentTextIcon as DocumentSolidIcon,
  ChatBubbleLeftEllipsisIcon as ChatSolidIcon,
  UserGroupIcon as GroupSolidIcon,
  CalendarIcon as CalendarSolidIcon,
  Cog6ToothIcon as CogSolidIcon
} from '@heroicons/react/24/solid';

const MobileNavigation: React.FC = () => {
  const location = useLocation();
  
  const navItems = [
    {
      path: '/',
      name: 'Ana Sayfa',
      icon: HomeIcon,
      activeIcon: HomeSolidIcon
    },
    {
      path: '/message-templates',
      name: 'Şablonlar',
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
      name: 'Gruplar',
      icon: UserGroupIcon,
      activeIcon: GroupSolidIcon
    },
    {
      path: '/scheduler',
      name: 'Zamanlayıcı',
      icon: CalendarIcon,
      activeIcon: CalendarSolidIcon
    },
    {
      path: '/settings',
      name: 'Ayarlar',
      icon: Cog6ToothIcon,
      activeIcon: CogSolidIcon
    }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-t border-gray-200 dark:border-gray-700 md:hidden z-50 shadow-lg shadow-blue-700/10">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || 
                          (item.path !== '/' && location.pathname.startsWith(item.path));
          const Icon = isActive ? item.activeIcon : item.icon;
          
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `
                flex flex-col items-center justify-center w-full h-full
                transition-all duration-200 ease-in-out
                ${isActive 
                  ? 'text-[#3f51b5] dark:text-[#5c6bc0]' 
                  : 'text-gray-500 dark:text-gray-400'}
              `}
            >
              <div className="flex flex-col items-center">
                <Icon className="w-6 h-6" />
                <span className="text-xs font-medium mt-1">{item.name}</span>
              </div>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileNavigation; 