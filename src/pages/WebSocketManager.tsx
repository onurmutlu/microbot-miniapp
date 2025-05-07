import React, { useState, useEffect } from 'react';
import {
  ArrowPathIcon, 
  SignalIcon, 
  XCircleIcon, 
  ClockIcon,
  ComputerDesktopIcon,
  ArrowsRightLeftIcon,
  ChartBarIcon,
  ChevronUpDownIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';
import { systemService } from '../services/systemService';
import { ReconnectStrategy, WebSocketConnection, ReconnectStats } from '../types/system';
import Spinner from '../components/ui/Spinner';
import { Link } from 'react-router-dom';
import webSocketClient from '../services/WebSocketClient';

const WebSocketManager: React.FC = () => {
  const [connections, setConnections] = useState<WebSocketConnection[]>([]);
  const [reconnectStats, setReconnectStats] = useState<ReconnectStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedStrategy, setSelectedStrategy] = useState<ReconnectStrategy>(ReconnectStrategy.EXPONENTIAL);
  const [isUpdatingStrategy, setIsUpdatingStrategy] = useState<boolean>(false);
  const [selectedConnection, setSelectedConnection] = useState<WebSocketConnection | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<any>(null);

  useEffect(() => {
    fetchData();
    
    // WebSocket istemcisinden performans metriklerini al
    const metrics = webSocketClient.getPerformanceMetrics();
    setPerformanceMetrics(metrics);
    
    // 30 saniyede bir verileri yenile
    const interval = setInterval(() => {
      fetchData();
      
      // Performans metriklerini güncelle
      const updatedMetrics = webSocketClient.getPerformanceMetrics();
      setPerformanceMetrics(updatedMetrics);
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // WebSocket bağlantıları ve yeniden bağlanma istatistiklerini al
      const [connectionsData, statsData] = await Promise.all([
        systemService.getWebSocketConnections(),
        systemService.getReconnectStats()
      ]);
      
      setConnections(connectionsData);
      setReconnectStats(statsData);
      setSelectedStrategy(statsData.current_strategy);
    } catch (error) {
      console.error('WebSocket verileri yüklenirken sorun oluştu:', error);
      toast.error('WebSocket verileri yüklenirken bir sorun oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const updateReconnectStrategy = async (strategy: ReconnectStrategy) => {
    try {
      setIsUpdatingStrategy(true);
      await systemService.updateReconnectStrategy(strategy);
      
      // Yerel WebSocket istemcisini de güncelle
      webSocketClient.setReconnectStrategy(strategy);
      
      setSelectedStrategy(strategy);
      toast.success(`Yeniden bağlanma stratejisi "${strategy}" olarak güncellendi`);
      
      // Verileri yenile
      fetchData();
    } catch (error) {
      console.error('Yeniden bağlanma stratejisi güncellenirken sorun oluştu:', error);
      toast.error('Yeniden bağlanma stratejisi güncellenirken bir sorun oluştu');
    } finally {
      setIsUpdatingStrategy(false);
    }
  };

  const formatTimeDifference = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    
    const seconds = Math.floor(diffMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours} saat ${minutes % 60} dakika önce`;
    } else if (minutes > 0) {
      return `${minutes} dakika ${seconds % 60} saniye önce`;
    } else {
      return `${seconds} saniye önce`;
    }
  };

  const renderStrategyDescription = (strategy: ReconnectStrategy) => {
    switch (strategy) {
      case ReconnectStrategy.LINEAR:
        return 'Her denemede gecikme doğrusal olarak artar. (Örn: 3s, 6s, 9s, 12s...)';
      case ReconnectStrategy.EXPONENTIAL:
        return 'Her denemede gecikme katlanarak artar. (Örn: 3s, 6s, 12s, 24s...)';
      case ReconnectStrategy.FIBONACCI:
        return 'Fibonacci dizisine göre artar. (Örn: 3s, 3s, 6s, 9s, 15s...)';
      case ReconnectStrategy.RANDOM:
        return 'Gecikme, belirli bir aralıkta rastgele belirlenir.';
      default:
        return 'Strateji açıklaması bulunamadı.';
    }
  };

  return (
    <div className="container mx-auto max-w-6xl py-6 animate-fade-in">
      <div className="glass-card p-8 rounded-xl shadow-lg border border-blue-200/30">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <SignalIcon className="h-8 w-8 text-blue-500 mr-3" />
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white glass-gradient">WebSocket Yönetimi</h1>
          </div>
          <div className="flex space-x-2">
            <Link
              to="/system-status"
              className="glass-btn p-2 rounded-lg hover:bg-indigo-100/30 dark:hover:bg-indigo-700/30 transition-colors"
            >
              <span className="text-sm">Sistem Durumu</span>
            </Link>
            <button
              onClick={fetchData}
              className="glass-btn p-2 rounded-lg hover:bg-indigo-100/30 dark:hover:bg-indigo-700/30 transition-colors"
              title="Yenile"
            >
              <ArrowPathIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-300" />
            </button>
          </div>
        </div>

        {isLoading && !reconnectStats ? (
          <div className="flex justify-center items-center py-16">
            <Spinner isLoading={true} size="xl" variant="glassEffect" />
          </div>
        ) : (
          <div className="space-y-8">
            {/* İstatistik Kartları */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="glass-card glass-gradient-primary p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Aktif Bağlantılar</h3>
                  <SignalIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{connections.length}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Aktif istemci sayısı</p>
              </div>
              
              <div className="glass-card glass-gradient-secondary p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Yeniden Bağlanmalar</h3>
                  <ArrowsRightLeftIcon className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">{reconnectStats?.total_reconnects || 0}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Toplam yeniden bağlanma sayısı</p>
              </div>
              
              <div className="glass-card glass-gradient-success p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Başarı Oranı</h3>
                  <ChartBarIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                  {reconnectStats ? Math.round(reconnectStats.reconnect_success_rate * 100) : 0}%
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Yeniden bağlanma başarı oranı</p>
              </div>
              
              <div className="glass-card glass-gradient-danger p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Ort. Gecikme</h3>
                  <ClockIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                  {reconnectStats ? (reconnectStats.average_reconnect_time / 1000).toFixed(2) : 0} sn
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Ortalama yeniden bağlanma süresi</p>
              </div>
            </div>

            {/* Yeniden Bağlanma Stratejisi */}
            <div className="glass-card p-6 rounded-lg shadow-lg mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Yeniden Bağlanma Stratejisi</h3>
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100">
                  {selectedStrategy}
                </span>
              </div>
              
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                {renderStrategyDescription(selectedStrategy)}
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {Object.values(ReconnectStrategy).map((strategy) => (
                  <button
                    key={strategy}
                    onClick={() => updateReconnectStrategy(strategy)}
                    disabled={isUpdatingStrategy || strategy === selectedStrategy}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
                      ${strategy === selectedStrategy 
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100 shadow-inner' 
                        : 'glass-btn hover:bg-gray-100/30 dark:hover:bg-gray-700/30'
                      }
                      disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {strategy}
                  </button>
                ))}
              </div>
            </div>

            {/* Bağlantı Performansı */}
            <div className="glass-card p-6 rounded-lg shadow-lg mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Bağlantı Performansı</h3>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Son {performanceMetrics?.latencies.length || 0} ölçüm
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Ortalama Gecikme</p>
                  <div className="flex items-baseline">
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {performanceMetrics?.avgLatency ? Math.round(performanceMetrics.avgLatency) : 0}
                    </p>
                    <span className="ml-1 text-sm text-gray-500 dark:text-gray-400">ms</span>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Minimum Gecikme</p>
                  <div className="flex items-baseline">
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {performanceMetrics?.minLatency || 0}
                    </p>
                    <span className="ml-1 text-sm text-gray-500 dark:text-gray-400">ms</span>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Maksimum Gecikme</p>
                  <div className="flex items-baseline">
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {performanceMetrics?.maxLatency || 0}
                    </p>
                    <span className="ml-1 text-sm text-gray-500 dark:text-gray-400">ms</span>
                  </div>
                </div>
              </div>
              
              {/* Gecikmeler için görsel grafik */}
              {performanceMetrics?.latencies.length > 0 && (
                <div className="h-20 flex items-end space-x-1">
                  {performanceMetrics.latencies.map((perf: any, index: number) => {
                    const height = Math.min(100, Math.max(10, (perf.latency / performanceMetrics.maxLatency) * 100));
                    return (
                      <div 
                        key={index}
                        className={`
                          w-full h-[${height}%] min-h-[4px] rounded-t 
                          ${perf.successful 
                            ? height > 70 ? 'bg-red-500/70' : height > 40 ? 'bg-amber-500/70' : 'bg-green-500/70'
                            : 'bg-gray-500/50'
                          }
                          hover:opacity-80 transition-opacity
                        `}
                        style={{ height: `${height}%` }}
                        title={`${perf.latency}ms - ${new Date(perf.timestamp).toLocaleTimeString()}`}
                      />
                    );
                  })}
                </div>
              )}
            </div>

            {/* Aktif Bağlantılar */}
            <div className="glass-card p-6 rounded-lg shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Aktif Bağlantılar</h3>
                {!isLoading && (
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Toplam {connections.length} bağlantı
                  </span>
                )}
              </div>
              
              {isLoading ? (
                <div className="flex justify-center items-center py-8">
                  <Spinner isLoading={true} size="md" variant="glassEffect" />
                </div>
              ) : connections.length === 0 ? (
                <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                  Aktif WebSocket bağlantısı bulunamadı
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left border-collapse">
                    <thead className="text-xs uppercase bg-gray-100/50 dark:bg-gray-800/50">
                      <tr>
                        <th className="px-4 py-3 rounded-tl-lg">
                          <div className="flex items-center">
                            Client ID
                            <ChevronUpDownIcon className="h-4 w-4 ml-1" />
                          </div>
                        </th>
                        <th className="px-4 py-3">IP Adresi</th>
                        <th className="px-4 py-3">Bağlantı Süresi</th>
                        <th className="px-4 py-3">Son Aktivite</th>
                        <th className="px-4 py-3">Yeniden Bağlanma</th>
                        <th className="px-4 py-3 rounded-tr-lg">Durum</th>
                      </tr>
                    </thead>
                    <tbody>
                      {connections.map((connection) => (
                        <tr 
                          key={connection.id}
                          className="bg-white/30 dark:bg-gray-900/30 border-b dark:border-gray-700 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors"
                          onClick={() => setSelectedConnection(connection)}
                        >
                          <td className="px-4 py-3 font-medium whitespace-nowrap">
                            <div className="flex items-center">
                              <ComputerDesktopIcon className="h-4 w-4 mr-2 text-blue-500" />
                              {connection.client_id.substring(0, 10)}...
                            </div>
                          </td>
                          <td className="px-4 py-3">{connection.ip_address}</td>
                          <td className="px-4 py-3">{formatTimeDifference(connection.connected_at)}</td>
                          <td className="px-4 py-3">{formatTimeDifference(connection.last_activity)}</td>
                          <td className="px-4 py-3">{connection.reconnect_count}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full 
                              ${connection.status === 'connected' 
                                ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' 
                                : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                              }`}
                            >
                              {connection.status === 'connected' ? 'Aktif' : 'Kopuk'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Bağlantı Detay Modalı */}
            {selectedConnection && (
              <div className="fixed inset-0 z-50 flex justify-center items-center p-4 overflow-x-hidden overflow-y-auto">
                <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setSelectedConnection(null)}></div>
                <div className="glass-card rounded-lg shadow-lg p-6 w-full max-w-2xl z-10">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Bağlantı Detayı</h3>
                    <button 
                      onClick={() => setSelectedConnection(null)}
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      <XCircleIcon className="h-6 w-6" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Client ID</p>
                        <p className="font-medium">{selectedConnection.client_id}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Durum</p>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full 
                          ${selectedConnection.status === 'connected' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' 
                            : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                          }`}
                        >
                          {selectedConnection.status === 'connected' ? 'Aktif' : 'Kopuk'}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">IP Adresi</p>
                        <p className="font-medium">{selectedConnection.ip_address}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Yeniden Bağlanma Sayısı</p>
                        <p className="font-medium">{selectedConnection.reconnect_count}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Bağlantı Zamanı</p>
                        <p className="font-medium">{new Date(selectedConnection.connected_at).toLocaleString('tr-TR')}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Son Aktivite</p>
                        <p className="font-medium">{new Date(selectedConnection.last_activity).toLocaleString('tr-TR')}</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Kullanıcı Tarayıcısı</p>
                      <p className="text-sm font-medium break-words">{selectedConnection.user_agent}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default WebSocketManager; 