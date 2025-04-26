interface PerformanceMetrics {
  connectionLatency: number;
  messageProcessingTime: number;
  reconnectionAttempts: number;
  messageQueueSize: number;
  lastSyncTime: number;
}

interface PerformanceMonitor {
  metrics: PerformanceMetrics;
  startMonitoring: () => void;
  updateMetric: (metric: keyof PerformanceMetrics, value: number) => void;
  reportMetrics: () => PerformanceMetrics & { timestamp: number };
}

export const PerformanceMonitor: PerformanceMonitor = {
  metrics: {
    connectionLatency: 0,
    messageProcessingTime: 0,
    reconnectionAttempts: 0,
    messageQueueSize: 0,
    lastSyncTime: 0
  },
  
  startMonitoring: () => {
    // Performans metriklerini topla
    setInterval(() => {
      console.log('Performans Metrikleri:', PerformanceMonitor.metrics);
    }, 60000); // Her dakika raporla
  },
  
  updateMetric: (metric: keyof PerformanceMetrics, value: number) => {
    PerformanceMonitor.metrics[metric] = value;
  },
  
  reportMetrics: () => {
    // Metrikleri raporla
    return {
      ...PerformanceMonitor.metrics,
      timestamp: Date.now()
    };
  }
}; 