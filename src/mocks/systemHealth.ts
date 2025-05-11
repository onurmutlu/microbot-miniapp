/**
 * Sistem sağlık durumu için mock veri
 */
export default {
  status: 'healthy',
  uptime: 843600, // saniye cinsinden (9.75 gün)
  version: '1.6.0',
  services: {
    database: {
      status: 'connected',
      latency: 12 // ms
    },
    cache: {
      status: 'connected',
      latency: 2 // ms
    },
    messaging: {
      status: 'connected',
      latency: 28 // ms
    },
    ai: {
      status: 'connected',
      latency: 180 // ms
    }
  },
  messages_processed: {
    today: 12450,
    total: 5872340
  }
}; 