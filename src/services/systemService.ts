import { apiService } from './api';
import { getTestMode } from '../utils/testMode';
import { mockSystemService } from '../mocks/mockServices';
import { 
  SystemStatus, 
  ErrorLog, 
  ErrorStats, 
  WebSocketConnection, 
  ReconnectStats, 
  ReconnectStrategy 
} from '../types/system';

export type { SystemStatus };

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
  },

  /**
   * Hata loglarını getirir
   * @param page Sayfa numarası
   * @param limit Sayfa başına log sayısı
   * @param category Hata kategorisi filtresi
   * @param severity Hata şiddeti filtresi
   * @param resolved Çözüm durumu filtresi
   */
  async getErrorLogs(
    page = 1, 
    limit = 20, 
    category?: string, 
    severity?: string,
    resolved?: boolean
  ): Promise<{ logs: ErrorLog[], total: number }> {
    // Test modunda mock servisi kullan
    if (getTestMode()) {
      return mockSystemService.getErrorLogs(page, limit, category, severity, resolved);
    }
    
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    
    if (category) params.append('category', category);
    if (severity) params.append('severity', severity);
    if (resolved !== undefined) params.append('resolved', resolved.toString());
    
    return await apiService.get<{ logs: ErrorLog[], total: number }>(`/system/errors?${params.toString()}`);
  },

  /**
   * Hata istatistiklerini getirir
   */
  async getErrorStats(): Promise<ErrorStats> {
    // Test modunda mock servisi kullan
    if (getTestMode()) {
      return mockSystemService.getErrorStats();
    }
    return await apiService.get<ErrorStats>('/system/error-stats');
  },

  /**
   * Bir hatayı çözülmüş olarak işaretler
   * @param errorId Hata ID'si
   */
  async resolveError(errorId: string): Promise<void> {
    // Test modunda mock servisi kullan
    if (getTestMode()) {
      return mockSystemService.resolveError(errorId);
    }
    await apiService.post(`/system/errors/${errorId}/resolve`, {});
  },

  /**
   * Aktif WebSocket bağlantılarını getirir
   */
  async getWebSocketConnections(): Promise<WebSocketConnection[]> {
    // Test modunda mock servisi kullan
    if (getTestMode()) {
      return mockSystemService.getWebSocketConnections();
    }
    return await apiService.get<WebSocketConnection[]>('/system/websocket-connections');
  },

  /**
   * Yeniden bağlanma istatistiklerini getirir
   */
  async getReconnectStats(): Promise<ReconnectStats> {
    // Test modunda mock servisi kullan
    if (getTestMode()) {
      return mockSystemService.getReconnectStats();
    }
    return await apiService.get<ReconnectStats>('/system/reconnect-stats');
  },

  /**
   * Yeniden bağlanma stratejisini günceller
   * @param strategy Yeni strateji
   */
  async updateReconnectStrategy(strategy: ReconnectStrategy): Promise<void> {
    // Test modunda mock servisi kullan
    if (getTestMode()) {
      return mockSystemService.updateReconnectStrategy(strategy);
    }
    await apiService.post('/system/reconnect-strategy', { strategy });
  }
};

export default systemService; 