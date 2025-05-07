// Sistem durumu tanımlamaları
export interface SystemStatus {
  active_handlers: number;
  active_schedulers: number;
  system_uptime: string;
  memory_usage: string;
  cpu_usage: string;
  is_admin: boolean;
  // V1.5.0 için yeni alanlar
  error_count: number;
  reconnect_count: number;
  websocket_connections: number;
  last_error_time: string;
}

// Hata log kategorileri
export enum ErrorCategory {
  SYSTEM = 'SYSTEM',
  DATABASE = 'DATABASE',
  NETWORK = 'NETWORK',
  WEBSOCKET = 'WEBSOCKET',
  API = 'API',
  SCHEDULER = 'SCHEDULER',
  HANDLER = 'HANDLER',
  OTHER = 'OTHER'
}

// Hata log şiddet seviyeleri
export enum ErrorSeverity {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL'
}

// Hata log kaydı
export interface ErrorLog {
  id: string;
  timestamp: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  message: string;
  details: string;
  source: string;
  resolved: boolean;
}

// Hata istatistikleri
export interface ErrorStats {
  total_errors: number;
  by_category: Record<ErrorCategory, number>;
  by_severity: Record<ErrorSeverity, number>;
  resolved_count: number;
  unresolved_count: number;
}

// WebSocket bağlantısı
export interface WebSocketConnection {
  id: string;
  client_id: string;
  ip_address: string;
  connected_at: string;
  last_activity: string;
  user_agent: string;
  status: 'connected' | 'disconnected';
  reconnect_count: number;
}

// Yeniden bağlanma stratejileri
export enum ReconnectStrategy {
  LINEAR = 'LINEAR',
  EXPONENTIAL = 'EXPONENTIAL',
  FIBONACCI = 'FIBONACCI',
  RANDOM = 'RANDOM'
}

// Yeniden bağlanma istatistikleri
export interface ReconnectStats {
  total_reconnects: number;
  successful_reconnects: number;
  failed_reconnects: number;
  average_reconnect_time: number; // milisaniye
  reconnect_success_rate: number; // 0-1 arası
  current_strategy: ReconnectStrategy;
  by_client: Record<string, number>;
} 