import axios from 'axios';
import { getTestMode } from '../utils/testMode';
import { 
  DashboardStatistics, 
  GroupActivity, 
  OptimalInterval, 
  CooledGroup, 
  ScheduledStats 
} from '../types/dashboard';

const API_URL = import.meta.env.VITE_API_URL || '/api';

/**
 * Test modu için sahte veriler
 */
const mockData = {
  getStatistics: (): DashboardStatistics => ({
    last24hMessages: 1250,
    successRate: 87.5,
    activeGroupCount: 34,
    activeTemplateCount: 18,
    schedulerStatus: {
      isActive: true,
      nextScheduledTime: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      pendingMessages: 23
    }
  }),

  getGroupActivity: (): GroupActivity => ({
    categories: [
      { name: 'Kripto', count: 12 },
      { name: 'Spor', count: 8 },
      { name: 'Finans', count: 6 },
      { name: 'Eğlence', count: 5 },
      { name: 'Diğer', count: 3 }
    ],
    groups: Array(15).fill(null).map((_, index) => ({
      id: `grp-${index + 1}`,
      name: `Grup #${index + 1}`,
      category: ['Kripto', 'Spor', 'Finans', 'Eğlence', 'Diğer'][Math.floor(Math.random() * 5)],
      memberCount: Math.floor(Math.random() * 1500) + 500,
      messagesLast24h: Math.floor(Math.random() * 120) + 10,
      successRate: Math.floor(Math.random() * 30) + 70,
      lastActivity: new Date(Date.now() - Math.floor(Math.random() * 24 * 60 * 60 * 1000)).toISOString()
    }))
  }),

  getOptimalIntervals: (): OptimalInterval[] => {
    return Array(8).fill(null).map((_, index) => ({
      groupId: `grp-${index + 1}`,
      groupName: `Grup #${index + 1}`,
      optimalInterval: Math.floor(Math.random() * 120) + 60, // 60-180 dakika arası
      averageResponseRate: Math.random() * 0.4 + 0.5, // 0.5-0.9 arası
      confidenceScore: Math.random() * 0.7 + 0.3 // 0.3-1.0 arası
    }));
  },

  getCooledGroups: (): CooledGroup[] => {
    const reasons = [
      'Aşırı mesaj gönderimi',
      'Düşük yanıt oranı',
      'Grup kuralları ihlali',
      'Otomatik soğutma'
    ];
    
    return Array(4).fill(null).map((_, index) => ({
      id: `grp-${index + 100}`,
      name: `Soğutulmuş Grup #${index + 1}`,
      cooldownUntil: new Date(Date.now() + (Math.random() * 48 + 2) * 60 * 60 * 1000).toISOString(),
      cooldownReason: reasons[Math.floor(Math.random() * reasons.length)],
      failedAttempts: Math.floor(Math.random() * 8) + 3
    }));
  },

  getScheduledStats: (): ScheduledStats => {
    const totalScheduled = 1250;
    const successCount = 1080;
    const failureCount = totalScheduled - successCount;
    
    // Saat bazlı dağılım
    const byHour = Array(24).fill(null).map((_, hour) => {
      // İş saatleri daha yoğun olsun
      const countMultiplier = (hour >= 9 && hour <= 18) ? 2.5 : 1;
      const count = Math.floor(Math.random() * 30 * countMultiplier) + 5;
      return {
        hour,
        count,
        successRate: Math.floor(Math.random() * 25) + 75 // 75-100 arası
      };
    });
    
    // Şablon bazlı istatistikler
    const templateNames = [
      'Günlük Bildirim', 
      'Hoş Geldin Mesajı', 
      'Haftalık Özet',
      'Özel Teklif',
      'Anket',
      'Etkinlik Duyurusu'
    ];
    
    const byTemplate = templateNames.map((name, index) => ({
      templateId: `tpl-${index + 1}`,
      templateName: name,
      count: Math.floor(Math.random() * 150) + 50,
      successRate: Math.floor(Math.random() * 20) + 80
    }));
    
    // Grup bazlı istatistikler
    const byGroup = Array(10).fill(null).map((_, index) => ({
      groupId: `grp-${index + 1}`,
      groupName: `Grup #${index + 1}`,
      count: Math.floor(Math.random() * 100) + 20,
      successRate: Math.floor(Math.random() * 25) + 75
    }));
    
    return {
      totalScheduled,
      successCount,
      failureCount,
      byHour,
      byTemplate,
      byGroup
    };
  }
};

/**
 * Dashboard verilerini çekmek için kullanılan servis
 */
export const dashboardService = {
  /**
   * Genel dashboard istatistiklerini getirir
   */
  getStatistics: async () => {
    try {
      // Test modunda ise mock veri döndür
      if (getTestMode()) {
        console.log('Test modu: Dashboard istatistikleri mock veri kullanıyor');
        return mockData.getStatistics();
      }
      
      const response = await axios.get(`${API_URL}/dashboard/statistics`);
      return response.data;
    } catch (error) {
      console.error('Dashboard istatistikleri alınamadı:', error);
      throw error;
    }
  },

  /**
   * Grup aktivite analizini getirir
   */
  getGroupActivity: async () => {
    try {
      // Test modunda ise mock veri döndür
      if (getTestMode()) {
        console.log('Test modu: Grup aktivite analizi mock veri kullanıyor');
        return mockData.getGroupActivity();
      }
      
      const response = await axios.get(`${API_URL}/dashboard/group-activity`);
      return response.data;
    } catch (error) {
      console.error('Grup aktivite analizi alınamadı:', error);
      throw error;
    }
  },

  /**
   * Optimal mesaj gönderme aralıklarını getirir
   */
  getOptimalIntervals: async () => {
    try {
      // Test modunda ise mock veri döndür
      if (getTestMode()) {
        console.log('Test modu: Optimal aralıklar mock veri kullanıyor');
        return mockData.getOptimalIntervals();
      }
      
      const response = await axios.get(`${API_URL}/dashboard/optimal-intervals`);
      return response.data;
    } catch (error) {
      console.error('Optimal aralıklar alınamadı:', error);
      throw error;
    }
  },

  /**
   * Soğutma modundaki grupları getirir
   */
  getCooledGroups: async () => {
    try {
      // Test modunda ise mock veri döndür
      if (getTestMode()) {
        console.log('Test modu: Soğutma grupları mock veri kullanıyor');
        return mockData.getCooledGroups();
      }
      
      const response = await axios.get(`${API_URL}/dashboard/cooled-groups`);
      return response.data;
    } catch (error) {
      console.error('Soğutma grupları alınamadı:', error);
      throw error;
    }
  },

  /**
   * Grup soğutmasını sıfırlar
   * @param groupId Soğutması sıfırlanacak grubun ID'si
   */
  resetCooldown: async (groupId: string) => {
    try {
      // Test modunda ise asenkron simülasyon
      if (getTestMode()) {
        console.log(`Test modu: Grup soğutması sıfırlama simülasyonu (${groupId})`);
        // 1 saniyelik yapay gecikme
        await new Promise(resolve => setTimeout(resolve, 1000));
        return { success: true, message: 'Grup soğutması başarıyla sıfırlandı' };
      }
      
      const response = await axios.post(`${API_URL}/dashboard/reset-cooldown/${groupId}`);
      return response.data;
    } catch (error) {
      console.error(`Grup soğutması sıfırlanamadı (${groupId}):`, error);
      throw error;
    }
  },

  /**
   * Zamanlanmış mesaj istatistiklerini getirir
   */
  getScheduledStats: async () => {
    try {
      // Test modunda ise mock veri döndür
      if (getTestMode()) {
        console.log('Test modu: Zamanlanmış mesaj istatistikleri mock veri kullanıyor');
        return mockData.getScheduledStats();
      }
      
      const response = await axios.get(`${API_URL}/dashboard/scheduled-stats`);
      return response.data;
    } catch (error) {
      console.error('Zamanlanmış mesaj istatistikleri alınamadı:', error);
      throw error;
    }
  },

  /**
   * Zamanlayıcı durum bilgisini getirir
   */
  getSchedulerStatus: async () => {
    try {
      // Test modunda ise mock veri döndür
      if (getTestMode()) {
        console.log('Test modu: Zamanlayıcı durumu mock veri kullanıyor');
        return {
          isActive: true,
          nextScheduledTime: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
          pendingMessages: 23,
          lastError: null
        };
      }
      
      const response = await axios.get(`${API_URL}/dashboard/scheduler-status`);
      return response.data;
    } catch (error) {
      console.error('Zamanlayıcı durumu alınamadı:', error);
      throw error;
    }
  }
}; 