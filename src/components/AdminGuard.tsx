import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { adminService, AdminRole } from '../services/adminService';
import Spinner from './ui/Spinner';
import { showError } from '../utils/toast';

interface AdminGuardProps {
  children: React.ReactNode;
  requiredRole?: AdminRole;
}

/**
 * Admin sayfalarını korumak için kullanılan bileşen.
 * Sadece giriş yapmış adminler bu bileşenin içeriğine erişebilir.
 * requiredRole parametresi ile belirli bir admin rolü de talep edilebilir.
 */
const AdminGuard: React.FC<AdminGuardProps> = ({ 
  children,
  requiredRole = 'admin' // Varsayılan olarak en düşük admin rolü
}) => {
  const [isValidating, setIsValidating] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasRequiredRole, setHasRequiredRole] = useState(false);

  useEffect(() => {
    const validateAdmin = async () => {
      try {
        setIsValidating(true);
        
        // Admin girişi yapılmış mı?
        if (!adminService.isLoggedIn()) {
          setIsAuthenticated(false);
          return;
        }
        
        // Admin oturumu geçerli mi?
        const isValid = await adminService.validateSession();
        setIsAuthenticated(isValid);
        
        if (isValid) {
          // Admin rol kontrolü
          const hasRole = adminService.hasRole(requiredRole);
          setHasRequiredRole(hasRole);
          
          if (!hasRole) {
            showError('Bu sayfaya erişim yetkiniz yok');
          }
        }
      } catch (error) {
        console.error('Admin doğrulama hatası:', error);
        setIsAuthenticated(false);
      } finally {
        setIsValidating(false);
      }
    };
    
    validateAdmin();
  }, [requiredRole]);
  
  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/admin-login" replace />;
  }
  
  if (!hasRequiredRole) {
    return <Navigate to="/admin/licenses" replace />;
  }
  
  return <>{children}</>;
};

export default AdminGuard; 