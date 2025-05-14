import api from '../utils/api';
import { showError } from '../utils/toast';

export type AdminRole = 'admin' | 'superadmin' | 'root';

export interface AdminUser {
  id: string;
  username: string;
  role: AdminRole;
  permissions: string[];
  createdAt: string;
}

export const adminService = {
  /**
   * Admin girişi yapar
   */
  async login(password: string): Promise<{ success: boolean; token?: string; role?: AdminRole; message?: string }> {
    // Root admin kontrolü - doğrudan .env dosyasından
    const rootAdminPassword = import.meta.env.VITE_ROOT_ADMIN_PASSWORD;
    
    if (password === rootAdminPassword) {
      // Root admin doğrudan erişim
      const token = 'root_admin_' + Date.now();
      localStorage.setItem('admin_token', token);
      localStorage.setItem('admin_role', 'root');
      
      return {
        success: true,
        token,
        role: 'root'
      };
    }
    
    // Normal admin doğrulama
    try {
      const response = await api.post('/admin/login', { password });
      
      if (response.data.success) {
        const { token, role = 'admin' } = response.data;
        localStorage.setItem('admin_token', token);
        localStorage.setItem('admin_role', role);
        
        return {
          success: true,
          token,
          role
        };
      } else {
        return {
          success: false,
          message: response.data.message || 'Geçersiz şifre'
        };
      }
    } catch (error: any) {
      console.error('Admin girişi başarısız:', error);
      const message = error.response?.data?.message || 'Giriş yapılırken bir hata oluştu';
      showError(message);
      
      return {
        success: false,
        message
      };
    }
  },
  
  /**
   * Admin oturumunu kapatır
   */
  logout(): void {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_role');
  },
  
  /**
   * Admin oturumunun açık olup olmadığını kontrol eder
   */
  isLoggedIn(): boolean {
    return localStorage.getItem('admin_token') !== null;
  },
  
  /**
   * Admin rolünü döndürür
   */
  getRole(): AdminRole | null {
    return localStorage.getItem('admin_role') as AdminRole | null;
  },
  
  /**
   * Admin rolünün belirtilen rolden büyük veya eşit olup olmadığını kontrol eder
   */
  hasRole(requiredRole: AdminRole): boolean {
    const currentRole = this.getRole();
    
    if (!currentRole) return false;
    
    const roles: AdminRole[] = ['admin', 'superadmin', 'root'];
    const currentRoleIndex = roles.indexOf(currentRole);
    const requiredRoleIndex = roles.indexOf(requiredRole);
    
    return currentRoleIndex >= requiredRoleIndex;
  },
  
  /**
   * Admin oturumunun geçerli olup olmadığını kontrol eder (API'den)
   */
  async validateSession(): Promise<boolean> {
    const currentRole = this.getRole();
    
    // Root admin token'ı her zaman geçerlidir
    if (currentRole === 'root') {
      return true;
    }
    
    try {
      const response = await api.get('/admin/validate', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        }
      });
      
      return response.data.valid === true;
    } catch (error) {
      console.error('Admin oturumu doğrulanamadı:', error);
      return false;
    }
  }
}; 