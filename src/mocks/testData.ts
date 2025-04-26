import { AutoStartSettings } from '../services/settingsService';
import { SystemStatus, DashboardStats } from '../services/systemService';

// Mock data for testing
export const mockAutoStartSettings: AutoStartSettings = {
  auto_start_bots: true,
  auto_start_scheduling: false
};

export const mockSystemStatus: SystemStatus = {
  active_handlers: 12,
  active_schedulers: 5,
  system_uptime: '5 gün, 7 saat, 22 dakika',
  memory_usage: '1.2 GB / 8 GB (%15)',
  cpu_usage: '%22',
  is_admin: true
};

export const mockDashboardStats: DashboardStats = {
  active_users: 156,
  active_handlers: 12,
  active_schedulers: 5,
  messages_sent_today: 1250,
  active_groups: 34,
  total_templates: 87
}; 