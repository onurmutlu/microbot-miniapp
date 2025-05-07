import { mockAutoStartSettings, mockSystemStatus, mockDashboardStats, mockErrorLogs, mockErrorStats, mockWebSocketConnections, mockReconnectStats } from './testData';
import { AutoStartSettings } from '../services/settingsService';
import { SystemStatus, DashboardStats } from '../services/systemService';
import { ErrorLog, ErrorStats, WebSocketConnection, ReconnectStats, ReconnectStrategy } from '../types/system';

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
  },
  
  // Mock getErrorLogs metodu
  getErrorLogs: async (
    page = 1, 
    limit = 20, 
    category?: string, 
    severity?: string,
    resolved?: boolean
  ): Promise<{ logs: ErrorLog[], total: number }> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Filtreleme işlemlerini burada gerçekleştir
        let filteredLogs = [...mockErrorLogs];
        
        if (category) {
          filteredLogs = filteredLogs.filter(log => log.category === category);
        }
        
        if (severity) {
          filteredLogs = filteredLogs.filter(log => log.severity === severity);
        }
        
        if (resolved !== undefined) {
          filteredLogs = filteredLogs.filter(log => log.resolved === resolved);
        }
        
        // Pagination
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedLogs = filteredLogs.slice(startIndex, endIndex);
        
        resolve({
          logs: paginatedLogs,
          total: filteredLogs.length
        });
      }, 500);
    });
  },
  
  // Mock getErrorStats metodu
  getErrorStats: async (): Promise<ErrorStats> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(mockErrorStats);
      }, 500);
    });
  },
  
  // Mock resolveError metodu
  resolveError: async (errorId: string): Promise<void> => {
    return new Promise((resolve) => {
      console.log(`Hata çözüldü: ${errorId}`);
      setTimeout(() => {
        resolve();
      }, 500);
    });
  },
  
  // Mock getWebSocketConnections metodu
  getWebSocketConnections: async (): Promise<WebSocketConnection[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(mockWebSocketConnections);
      }, 500);
    });
  },
  
  // Mock getReconnectStats metodu
  getReconnectStats: async (): Promise<ReconnectStats> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(mockReconnectStats);
      }, 500);
    });
  },
  
  // Mock updateReconnectStrategy metodu
  updateReconnectStrategy: async (strategy: ReconnectStrategy): Promise<void> => {
    return new Promise((resolve) => {
      console.log(`Yeniden bağlanma stratejisi güncellendi: ${strategy}`);
      setTimeout(() => {
        resolve();
      }, 500);
    });
  }
}; 