import React from 'react';
import '../../styles/corporate-theme.css';

interface CorporateMobileHeaderProps {
  title: string;
  avatarUrl?: string;
  onMenuClick?: () => void;
  onAvatarClick?: () => void;
}

const CorporateMobileHeader: React.FC<CorporateMobileHeaderProps> = ({ 
  title, 
  avatarUrl, 
  onMenuClick,
  onAvatarClick
}) => {
  return (
    <header className="sticky top-0 z-50 bg-[#0f0f0f]/60 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-[var(--corporate-border)]">
      {/* Hamburger Menü İkonu */}
      <button 
        onClick={onMenuClick} 
        className="w-10 h-10 flex items-center justify-center text-[var(--corporate-text-primary)] focus:outline-none active:bg-white/5 rounded-full"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
          <path fillRule="evenodd" d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5z"/>
        </svg>
      </button>
      
      {/* Başlık */}
      <h1 className="text-xl font-medium text-[var(--corporate-text-primary)]">{title}</h1>
      
      {/* Kullanıcı Avatarı */}
      <button 
        onClick={onAvatarClick} 
        className="w-10 h-10 flex items-center justify-center focus:outline-none active:bg-white/5 rounded-full overflow-hidden"
      >
        {avatarUrl ? (
          <img 
            src={avatarUrl} 
            alt="Kullanıcı" 
            className="w-8 h-8 rounded-full object-cover border border-[var(--corporate-border)]"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-[var(--corporate-accent-blue)] flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4Zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10Z"/>
            </svg>
          </div>
        )}
      </button>
    </header>
  );
};

export default CorporateMobileHeader; 