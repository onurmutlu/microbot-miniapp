import { apiService } from './api';
import { getTestMode } from '../utils/testMode';
import { mockSystemService } from '../mocks/mockServices';

export interface SystemStatus {
  active_handlers: number;
  active_schedulers: number;
  system_uptime: string;
  memory_usage: string;
  cpu_usage: string;
  is_admin: boolean;
}

export interface DashboardStats {
  active_users: number;
  active_handlers: number;
  active_schedulers: number;
  messages_sent_today: number;
  active_groups: number;
  total_templates: number;
}

export const systemService = {
  /**
   * Sistem durumu bilgilerini getirir
   */
  async getSystemStatus(): Promise<SystemStatus> {
    // Test modunda mock servisi kullan
    if (getTestMode()) {
      return mockSystemService.getSystemStatus();
    }
    return await apiService.get<SystemStatus>('/system/status');
  },

  /**
   * Tüm handler'ları yeniden başlatır
   */
  async restartHandlers(): Promise<void> {
    // Test modunda mock servisi kullan
    if (getTestMode()) {
      return mockSystemService.restartHandlers();
    }
    await apiService.post('/system/restart-handlers', {});
  },

  /**
   * Dashboard istatistiklerini getirir
   */
  async getDashboardStats(): Promise<DashboardStats> {
    // Test modunda mock servisi kullan
    if (getTestMode()) {
      return mockSystemService.getDashboardStats();
    }
    return await apiService.get<DashboardStats>('/dashboard/stats');
  }
};

export default systemService; 