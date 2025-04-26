import { apiService } from './api';
import { getTestMode } from '../utils/testMode';
import { mockSettingsService } from '../mocks/mockServices';

export interface AutoStartSettings {
  auto_start_bots: boolean;
  auto_start_scheduling: boolean;
}

export const settingsService = {
  /**
   * Otomatik başlatma ayarlarını getirir
   */
  async getAutoStartSettings(): Promise<AutoStartSettings> {
    // Test modunda mock servisi kullan
    if (getTestMode()) {
      return mockSettingsService.getAutoStartSettings();
    }
    return await apiService.get<AutoStartSettings>('/api/scheduler/auto-start-settings');
  },

  /**
   * Otomatik başlatma ayarlarını günceller
   */
  async updateAutoStartSettings(settings: AutoStartSettings): Promise<void> {
    // Test modunda mock servisi kullan
    if (getTestMode()) {
      return mockSettingsService.updateAutoStartSettings(settings);
    }
    await apiService.post('/api/scheduler/auto-start-settings', settings);
  }
};

export default settingsService; 