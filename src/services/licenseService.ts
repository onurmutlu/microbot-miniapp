import api from '../utils/api';
import { showError } from '../utils/toast';

export interface License {
  id: string;
  key: string;
  type: 'TRIAL' | 'PRO' | 'VIP';
  expiryDate: string;
  isActive: boolean;
  createdAt: string;
  usedBy: string | null;
}

export interface LicenseValidationResponse {
  valid: boolean;
  licenseData?: License;
  message?: string;
}

export const licenseService = {
  /**
   * Lisans anahtarının geçerliliğini kontrol eder
   */
  async validateLicense(licenseKey: string): Promise<LicenseValidationResponse> {
    try {
      const response = await api.post('/license/validate', { license_key: licenseKey });
      return response.data;
    } catch (error: any) {
      console.error('Lisans doğrulama hatası:', error);
      const message = error.response?.data?.message || 'Lisans doğrulanırken bir hata oluştu';
      showError(message);
      return {
        valid: false,
        message
      };
    }
  },
  
  /**
   * Kullanıcının lisanslarını getirir
   */
  async getUserLicenses(): Promise<License[]> {
    try {
      const response = await api.get('/user/licenses');
      return response.data;
    } catch (error) {
      console.error('Lisanslar alınamadı:', error);
      showError('Lisanslar alınırken bir hata oluştu');
      return [];
    }
  },
  
  /**
   * Admin: Lisans listesini getirir
   */
  async getAdminLicenses(): Promise<License[]> {
    try {
      const response = await api.get('/admin/licenses', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Admin lisansları alınamadı:', error);
      showError('Lisanslar alınırken bir hata oluştu');
      return [];
    }
  },
  
  /**
   * Admin: Yeni lisans oluşturur
   */
  async createLicense(type: 'TRIAL' | 'PRO' | 'VIP', validityDays: number): Promise<License | null> {
    try {
      const response = await api.post('/admin/licenses', 
        { type, validityDays },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Lisans oluşturulamadı:', error);
      showError('Lisans oluşturulurken bir hata oluştu');
      return null;
    }
  },
  
  /**
   * Admin: Lisans siler
   */
  async deleteLicense(id: string): Promise<boolean> {
    try {
      await api.delete(`/admin/licenses/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        }
      });
      return true;
    } catch (error) {
      console.error('Lisans silinemedi:', error);
      showError('Lisans silinirken bir hata oluştu');
      return false;
    }
  },
  
  /**
   * Admin: Telegram oturum doğrulama
   */
  async adminLogin(password: string): Promise<{ success: boolean, token?: string, message?: string }> {
    try {
      const response = await api.post('/admin/login', { password });
      return response.data;
    } catch (error: any) {
      console.error('Admin girişi başarısız:', error);
      const message = error.response?.data?.message || 'Giriş yapılırken bir hata oluştu';
      return {
        success: false,
        message
      };
    }
  }
}; 