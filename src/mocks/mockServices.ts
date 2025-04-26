import { mockAutoStartSettings, mockSystemStatus, mockDashboardStats } from './testData';
import { AutoStartSettings } from '../services/settingsService';
import { SystemStatus, DashboardStats } from '../services/systemService';

// Mock SettingsService
export const mockSettingsService = {
  // Mock getAutoStartSettings metodu
  getAutoStartSettings: async (): Promise<AutoStartSettings> => {
    return new Promise((resolve) => {
      // API çağrısını simüle etmek için küçük bir gecikme ekliyoruz
      setTimeout(() => {
        resolve(mockAutoStartSettings);
      }, 500);
    });
  },

  // Mock updateAutoStartSettings metodu
  updateAutoStartSettings: async (settings: AutoStartSettings): Promise<void> => {
    return new Promise((resolve) => {
      // API çağrısını simüle etmek için küçük bir gecikme ekliyoruz
      console.log('Ayarlar güncellendi:', settings);
      setTimeout(() => {
        resolve();
      }, 500);
    });
  }
};

// Mock SystemService
export const mockSystemService = {
  // Mock getSystemStatus metodu
  getSystemStatus: async (): Promise<SystemStatus> => {
    return new Promise((resolve) => {
      // API çağrısını simüle etmek için küçük bir gecikme ekliyoruz
      setTimeout(() => {
        resolve(mockSystemStatus);
      }, 500);
    });
  },

  // Mock restartHandlers metodu
  restartHandlers: async (): Promise<void> => {
    return new Promise((resolve) => {
      // API çağrısını simüle etmek için küçük bir gecikme ekliyoruz
      console.log('Handler\'lar yeniden başlatıldı');
      setTimeout(() => {
        resolve();
      }, 1000);
    });
  },

  // Mock getDashboardStats metodu
  getDashboardStats: async (): Promise<DashboardStats> => {
    return new Promise((resolve) => {
      // API çağrısını simüle etmek için küçük bir gecikme ekliyoruz
      setTimeout(() => {
        resolve(mockDashboardStats);
      }, 500);
    });
  }
}; 