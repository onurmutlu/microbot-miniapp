import { AutoStartSettings } from '../services/settingsService';
import { SystemStatus, DashboardStats } from '../services/systemService';
import { 
  ErrorLog, 
  ErrorCategory, 
  ErrorSeverity, 
  ErrorStats, 
  WebSocketConnection, 
  ReconnectStats, 
  ReconnectStrategy 
} from '../types/system';

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
  is_admin: true,
  // V1.5.0 için yeni alanlar
  error_count: 23,
  reconnect_count: 12,
  websocket_connections: 4,
  last_error_time: '2024-07-13T14:23:45Z'
};

export const mockDashboardStats: DashboardStats = {
  active_users: 156,
  active_handlers: 12,
  active_schedulers: 5,
  messages_sent_today: 1250,
  active_groups: 34,
  total_templates: 87
};

// Hata logları için mock veriler
export const mockErrorLogs: ErrorLog[] = [
  {
    id: '1',
    timestamp: '2024-07-13T14:23:45Z',
    category: ErrorCategory.WEBSOCKET,
    severity: ErrorSeverity.ERROR,
    message: 'WebSocket bağlantısı beklenmedik şekilde kapandı',
    details: 'Kod: 1006, Neden: Bağlantı beklenmedik şekilde kapandı',
    source: 'ws_server.py:124',
    resolved: false
  },
  {
    id: '2',
    timestamp: '2024-07-13T12:15:32Z',
    category: ErrorCategory.DATABASE,
    severity: ErrorSeverity.CRITICAL,
    message: 'Veritabanı bağlantısı kurulamadı',
    details: 'OperationalError: (psycopg2.OperationalError) connection refused',
    source: 'db_manager.py:45',
    resolved: true
  },
  {
    id: '3',
    timestamp: '2024-07-12T22:01:15Z',
    category: ErrorCategory.API,
    severity: ErrorSeverity.WARNING,
    message: 'API rate limit aşıldı',
    details: 'Telegram API: 429 Too Many Requests',
    source: 'telegram_client.py:215',
    resolved: true
  },
  {
    id: '4',
    timestamp: '2024-07-12T18:45:30Z',
    category: ErrorCategory.SCHEDULER,
    severity: ErrorSeverity.ERROR,
    message: 'Zamanlayıcı görev çalıştırma hatası',
    details: 'TaskExecutionError: Zamanlanan görev başarısız oldu: TimeoutError',
    source: 'scheduler.py:87',
    resolved: false
  },
  {
    id: '5',
    timestamp: '2024-07-11T09:12:44Z',
    category: ErrorCategory.SYSTEM,
    severity: ErrorSeverity.ERROR,
    message: 'Sistem belleği yetersiz',
    details: 'MemoryError: Bellek tahsis etme hatası',
    source: 'app.py:302',
    resolved: true
  },
  {
    id: '6',
    timestamp: '2024-07-10T15:33:20Z',
    category: ErrorCategory.NETWORK,
    severity: ErrorSeverity.WARNING,
    message: 'Ağ bağlantısı kararsız',
    details: 'Paket kaybı oranı: %15',
    source: 'network_monitor.py:56',
    resolved: false
  },
  {
    id: '7',
    timestamp: '2024-07-10T11:05:12Z',
    category: ErrorCategory.HANDLER,
    severity: ErrorSeverity.INFO,
    message: 'Handler yeniden başlatıldı',
    details: 'Bellek sızıntısı nedeniyle handler yeniden başlatıldı',
    source: 'handler_manager.py:122',
    resolved: true
  }
];

// Hata istatistikleri için mock veriler
export const mockErrorStats: ErrorStats = {
  total_errors: 23,
  by_category: {
    [ErrorCategory.SYSTEM]: 3,
    [ErrorCategory.DATABASE]: 5,
    [ErrorCategory.NETWORK]: 2,
    [ErrorCategory.WEBSOCKET]: 8,
    [ErrorCategory.API]: 3,
    [ErrorCategory.SCHEDULER]: 1,
    [ErrorCategory.HANDLER]: 1,
    [ErrorCategory.OTHER]: 0
  },
  by_severity: {
    [ErrorSeverity.DEBUG]: 0,
    [ErrorSeverity.INFO]: 2,
    [ErrorSeverity.WARNING]: 5,
    [ErrorSeverity.ERROR]: 12,
    [ErrorSeverity.CRITICAL]: 4
  },
  resolved_count: 15,
  unresolved_count: 8
};

// WebSocket bağlantıları için mock veriler
export const mockWebSocketConnections: WebSocketConnection[] = [
  {
    id: 'ws_1',
    client_id: 'client_123abc',
    ip_address: '192.168.1.101',
    connected_at: '2024-07-13T10:15:32Z',
    last_activity: '2024-07-13T14:22:45Z',
    user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    status: 'connected',
    reconnect_count: 2
  },
  {
    id: 'ws_2',
    client_id: 'client_456def',
    ip_address: '192.168.1.105',
    connected_at: '2024-07-13T11:05:21Z',
    last_activity: '2024-07-13T14:21:15Z',
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    status: 'connected',
    reconnect_count: 0
  },
  {
    id: 'ws_3',
    client_id: 'client_789ghi',
    ip_address: '192.168.1.110',
    connected_at: '2024-07-13T12:30:45Z',
    last_activity: '2024-07-13T14:15:30Z',
    user_agent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)',
    status: 'connected',
    reconnect_count: 3
  },
  {
    id: 'ws_4',
    client_id: 'client_101jkl',
    ip_address: '192.168.1.115',
    connected_at: '2024-07-13T13:45:10Z',
    last_activity: '2024-07-13T14:20:05Z',
    user_agent: 'Mozilla/5.0 (Linux; Android 12)',
    status: 'connected',
    reconnect_count: 1
  }
];

// Yeniden bağlanma istatistikleri için mock veriler
export const mockReconnectStats: ReconnectStats = {
  total_reconnects: 25,
  successful_reconnects: 21,
  failed_reconnects: 4,
  average_reconnect_time: 2350, // 2.35 saniye
  reconnect_success_rate: 0.84, // %84
  current_strategy: ReconnectStrategy.EXPONENTIAL,
  by_client: {
    'client_123abc': 3,
    'client_456def': 0,
    'client_789ghi': 5,
    'client_101jkl': 2,
    'client_other': 15
  }
}; 