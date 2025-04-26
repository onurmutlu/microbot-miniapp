import { useState } from 'react'
import { Link } from 'react-router-dom'
import { 
  HomeIcon, 
  DocumentTextIcon, 
  ClockIcon, 
  BeakerIcon, 
  Cog6ToothIcon, 
  CalendarIcon, 
  BookOpenIcon,
  ServerIcon
} from '@heroicons/react/24/outline'

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className={`fixed inset-y-0 left-0 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-200 ease-in-out md:translate-x-0 md:static md:inset-y-0`}>
      <div className="h-full w-64 bg-gray-800 text-white">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-xl font-bold">MicroBot</h1>
          <button onClick={() => setIsOpen(!isOpen)} className="md:hidden">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <nav className="mt-4">
          <Link to="/" className="flex items-center px-4 py-2 text-gray-300 hover:bg-gray-700">
            <HomeIcon className="h-5 w-5 mr-2" />
            Kontrol Paneli
          </Link>
          <Link to="/message-templates" className="flex items-center px-4 py-2 text-gray-300 hover:bg-gray-700">
            <DocumentTextIcon className="h-5 w-5 mr-2" />
            Mesaj Şablonları
          </Link>
          <Link to="/auto-reply-rules" className="flex items-center px-4 py-2 text-gray-300 hover:bg-gray-700">
            <ClockIcon className="h-5 w-5 mr-2" />
            Otomatik Yanıt Kuralları
          </Link>
          <Link to="/group-list" className="flex items-center px-4 py-2 text-gray-300 hover:bg-gray-700">
            <BeakerIcon className="h-5 w-5 mr-2" />
            Grup Listesi
          </Link>
          <Link to="/scheduler" className="flex items-center px-4 py-2 text-gray-300 hover:bg-gray-700">
            <CalendarIcon className="h-5 w-5 mr-2" />
            Zamanlayıcı
          </Link>
          <Link to="/cron-guide" className="flex items-center px-4 py-2 text-gray-300 hover:bg-gray-700">
            <BookOpenIcon className="h-5 w-5 mr-2" />
            Cron Rehberi
          </Link>
          <Link to="/settings" className="flex items-center px-4 py-2 text-gray-300 hover:bg-gray-700">
            <Cog6ToothIcon className="h-5 w-5 mr-2" />
            Ayarlar
          </Link>
          <Link to="/system-status" className="flex items-center px-4 py-2 text-gray-300 hover:bg-gray-700">
            <ServerIcon className="h-5 w-5 mr-2" />
            Sistem Durumu
          </Link>
        </nav>
      </div>
    </div>
  )
}

export default Sidebar 