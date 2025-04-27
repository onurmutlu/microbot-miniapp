import React from 'react';
import SessionManager from '../components/session/SessionManager';
import { useNavigate } from 'react-router-dom';

const SessionPage: React.FC = () => {
  const navigate = useNavigate();
  
  const handleSessionStarted = () => {
    // Oturum başarıyla başlatıldığında anasayfaya yönlendir
    setTimeout(() => {
      navigate('/');
    }, 2000);
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-[#121212] dark:to-[#1a2035] py-8">
      <SessionManager onSessionStarted={handleSessionStarted} />
    </div>
  );
};

export default SessionPage; 