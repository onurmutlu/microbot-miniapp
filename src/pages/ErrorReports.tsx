import React, { useState, useEffect } from 'react';
import { ChartBarIcon, ArrowPathIcon, ExclamationTriangleIcon, FunnelIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';
import { systemService } from '../services/systemService';
import { ErrorLog, ErrorCategory, ErrorSeverity, ErrorStats } from '../types/system';
import Spinner from '../components/ui/Spinner';
import { Link } from 'react-router-dom';

const ErrorReports: React.FC = () => {
  const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([]);
  const [errorStats, setErrorStats] = useState<ErrorStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedError, setSelectedError] = useState<ErrorLog | null>(null);
  const [totalErrors, setTotalErrors] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(20);
  const [filters, setFilters] = useState({
    category: '',
    severity: '',
    resolved: undefined as boolean | undefined
  });
  const [isResolvingError, setIsResolvingError] = useState<boolean>(false);

  useEffect(() => {
    fetchErrorData();
  }, [page, filters]);

  const fetchErrorData = async () => {
    try {
      setIsLoading(true);
      
      // Hata logları ve istatistiklerini al
      const [logsResponse, statsResponse] = await Promise.all([
        systemService.getErrorLogs(page, limit, filters.category, filters.severity, filters.resolved),
        systemService.getErrorStats()
      ]);
      
      setErrorLogs(logsResponse.logs);
      setTotalErrors(logsResponse.total);
      setErrorStats(statsResponse);
    } catch (error) {
      console.error('Hata verileri yüklenirken sorun oluştu:', error);
      toast.error('Hata raporları yüklenirken bir sorun oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const resolveError = async (errorId: string) => {
    try {
      setIsResolvingError(true);
      await systemService.resolveError(errorId);
      toast.success('Hata çözüldü olarak işaretlendi');
      
      // Hata durumunu güncelle
      setErrorLogs(prev => prev.map(error => 
        error.id === errorId ? { ...error, resolved: true } : error
      ));
      
      // İstatistikleri güncelle
      if (errorStats) {
        setErrorStats({
          ...errorStats,
          resolved_count: errorStats.resolved_count + 1,
          unresolved_count: Math.max(0, errorStats.unresolved_count - 1)
        });
      }
      
      // Seçili hata bu ise, onu da güncelle
      if (selectedError?.id === errorId) {
        setSelectedError({ ...selectedError, resolved: true });
      }
    } catch (error) {
      console.error('Hata çözülürken sorun oluştu:', error);
      toast.error('Hata çözülürken bir sorun oluştu');
    } finally {
      setIsResolvingError(false);
    }
  };

  const handleFilterChange = (key: string, value: string | boolean | undefined) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1); // Filtre değiştiğinde ilk sayfaya dön
  };

  const resetFilters = () => {
    setFilters({
      category: '',
      severity: '',
      resolved: undefined
    });
    setPage(1);
  };

  const getSeverityColor = (severity: ErrorSeverity) => {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
        return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30';
      case ErrorSeverity.ERROR:
        return 'text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30';
      case ErrorSeverity.WARNING:
        return 'text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30';
      case ErrorSeverity.INFO:
        return 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30';
      case ErrorSeverity.DEBUG:
        return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800';
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800';
    }
  };

  const getCategoryColor = (category: ErrorCategory) => {
    switch (category) {
      case ErrorCategory.SYSTEM:
        return 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30';
      case ErrorCategory.DATABASE:
        return 'text-cyan-600 dark:text-cyan-400 bg-cyan-100 dark:bg-cyan-900/30';
      case ErrorCategory.NETWORK:
        return 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30';
      case ErrorCategory.WEBSOCKET:
        return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30';
      case ErrorCategory.API:
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30';
      case ErrorCategory.SCHEDULER:
        return 'text-pink-600 dark:text-pink-400 bg-pink-100 dark:bg-pink-900/30';
      case ErrorCategory.HANDLER:
        return 'text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/30';
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800';
    }
  };

  const renderPagination = () => {
    const totalPages = Math.ceil(totalErrors / limit);
    
    return (
      <div className="flex items-center justify-between mt-4">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Toplam {totalErrors} hata, Sayfa {page}/{totalPages}
        </p>
        <div className="flex space-x-2">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="glass-btn p-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Önceki
          </button>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages || totalPages === 0}
            className="glass-btn p-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Sonraki
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto max-w-6xl py-6 animate-fade-in">
      <div className="glass-card p-8 rounded-xl shadow-lg border border-red-200/30">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-8 w-8 text-red-500 mr-3" />
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white glass-gradient">Hata Raporları</h1>
          </div>
          <div className="flex space-x-2">
            <Link
              to="/system-status"
              className="glass-btn p-2 rounded-lg hover:bg-indigo-100/30 dark:hover:bg-indigo-700/30 transition-colors"
            >
              <span className="text-sm">Sistem Durumu</span>
            </Link>
            <button
              onClick={fetchErrorData}
              className="glass-btn p-2 rounded-lg hover:bg-indigo-100/30 dark:hover:bg-indigo-700/30 transition-colors"
              title="Yenile"
            >
              <ArrowPathIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-300" />
            </button>
          </div>
        </div>

        {isLoading && !errorStats ? (
          <div className="flex justify-center items-center py-16">
            <Spinner isLoading={true} size="xl" variant="glassEffect" />
          </div>
        ) : (
          <div className="space-y-8">
            {/* Hata İstatistikleri */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="glass-card p-4 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Toplam Hatalar</p>
                <div className="flex items-baseline">
                  <h3 className="text-2xl font-bold text-gray-800 dark:text-white">{errorStats?.total_errors || 0}</h3>
                  <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">kayıt</span>
                </div>
              </div>
              
              <div className="glass-card p-4 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Çözülmemiş</p>
                <div className="flex items-baseline">
                  <h3 className="text-2xl font-bold text-red-500 dark:text-red-400">{errorStats?.unresolved_count || 0}</h3>
                  <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">kayıt</span>
                </div>
              </div>
              
              <div className="glass-card p-4 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Kritik Hatalar</p>
                <div className="flex items-baseline">
                  <h3 className="text-2xl font-bold text-orange-500 dark:text-orange-400">
                    {errorStats?.by_severity[ErrorSeverity.CRITICAL] || 0}
                  </h3>
                  <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">kayıt</span>
                </div>
              </div>
              
              <div className="glass-card p-4 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Çözüm Oranı</p>
                <div className="flex items-baseline">
                  <h3 className="text-2xl font-bold text-emerald-500 dark:text-emerald-400">
                    {errorStats ? Math.round((errorStats.resolved_count / Math.max(1, errorStats.total_errors)) * 100) : 0}%
                  </h3>
                  <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">tamamlandı</span>
                </div>
              </div>
            </div>

            {/* Filtreler */}
            <div className="glass-card p-4 rounded-lg mb-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4">
                <div className="flex items-center mb-4 sm:mb-0">
                  <FunnelIcon className="h-5 w-5 text-gray-500 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Filtreler</h3>
                </div>
                <button
                  onClick={resetFilters}
                  className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Filtreleri Sıfırla
                </button>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="category-filter">
                    Kategori
                  </label>
                  <select
                    id="category-filter"
                    className="glass-input w-full rounded-lg py-2 px-3 text-gray-700 dark:text-gray-300"
                    value={filters.category}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                  >
                    <option value="">Tüm Kategoriler</option>
                    {Object.values(ErrorCategory).map((category) => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="severity-filter">
                    Şiddet
                  </label>
                  <select
                    id="severity-filter"
                    className="glass-input w-full rounded-lg py-2 px-3 text-gray-700 dark:text-gray-300"
                    value={filters.severity}
                    onChange={(e) => handleFilterChange('severity', e.target.value)}
                  >
                    <option value="">Tüm Şiddet Seviyeleri</option>
                    {Object.values(ErrorSeverity).map((severity) => (
                      <option key={severity} value={severity}>{severity}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="resolved-filter">
                    Durum
                  </label>
                  <select
                    id="resolved-filter"
                    className="glass-input w-full rounded-lg py-2 px-3 text-gray-700 dark:text-gray-300"
                    value={filters.resolved === undefined ? '' : filters.resolved ? 'true' : 'false'}
                    onChange={(e) => {
                      const val = e.target.value;
                      handleFilterChange('resolved', val === '' ? undefined : val === 'true');
                    }}
                  >
                    <option value="">Tüm Durumlar</option>
                    <option value="true">Çözüldü</option>
                    <option value="false">Çözülmedi</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Hata Listesi */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead className="text-xs uppercase bg-gray-100/50 dark:bg-gray-800/50">
                  <tr>
                    <th className="px-4 py-3 rounded-tl-lg">Tarih</th>
                    <th className="px-4 py-3">Kategori</th>
                    <th className="px-4 py-3">Şiddet</th>
                    <th className="px-4 py-3">Mesaj</th>
                    <th className="px-4 py-3">Durum</th>
                    <th className="px-4 py-3 rounded-tr-lg text-right">İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {errorLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                        {isLoading ? 
                          <div className="flex justify-center">
                            <Spinner isLoading={true} size="md" variant="glassEffect" />
                          </div> : 
                          'Filtrelere uygun hata bulunamadı'
                        }
                      </td>
                    </tr>
                  ) : (
                    errorLogs.map((error) => (
                      <tr 
                        key={error.id} 
                        className="bg-white/30 dark:bg-gray-900/30 border-b dark:border-gray-700 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors"
                        onClick={() => setSelectedError(error)}
                      >
                        <td className="px-4 py-3 whitespace-nowrap">
                          {new Date(error.timestamp).toLocaleString('tr-TR')}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(error.category)}`}>
                            {error.category}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(error.severity)}`}>
                            {error.severity}
                          </span>
                        </td>
                        <td className="px-4 py-3 max-w-xs truncate">{error.message}</td>
                        <td className="px-4 py-3">
                          {error.resolved ? (
                            <span className="flex items-center text-green-600 dark:text-green-400">
                              <CheckCircleIcon className="h-4 w-4 mr-1" />
                              <span>Çözüldü</span>
                            </span>
                          ) : (
                            <span className="flex items-center text-red-600 dark:text-red-400">
                              <XCircleIcon className="h-4 w-4 mr-1" />
                              <span>Çözülmedi</span>
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {!error.resolved && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                resolveError(error.id);
                              }}
                              className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                              disabled={isResolvingError}
                            >
                              Çözüldü İşaretle
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Sayfalama */}
            {renderPagination()}

            {/* Hata Detay Modalı */}
            {selectedError && (
              <div className="fixed inset-0 z-50 flex justify-center items-center p-4 overflow-x-hidden overflow-y-auto">
                <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setSelectedError(null)}></div>
                <div className="glass-card rounded-lg shadow-lg p-6 w-full max-w-3xl z-10 max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Hata Detayı</h3>
                    <button 
                      onClick={() => setSelectedError(null)}
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      <XCircleIcon className="h-6 w-6" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Tarih</p>
                        <p className="font-medium">{new Date(selectedError.timestamp).toLocaleString('tr-TR')}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Durum</p>
                        {selectedError.resolved ? (
                          <span className="flex items-center text-green-600 dark:text-green-400">
                            <CheckCircleIcon className="h-4 w-4 mr-1" />
                            <span>Çözüldü</span>
                          </span>
                        ) : (
                          <span className="flex items-center text-red-600 dark:text-red-400">
                            <XCircleIcon className="h-4 w-4 mr-1" />
                            <span>Çözülmedi</span>
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Kategori</p>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(selectedError.category)}`}>
                          {selectedError.category}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Şiddet</p>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(selectedError.severity)}`}>
                          {selectedError.severity}
                        </span>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Mesaj</p>
                      <p className="font-medium">{selectedError.message}</p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Kaynak</p>
                      <code className="block p-2 my-1 bg-gray-100 dark:bg-gray-800 rounded overflow-x-auto text-xs font-mono">
                        {selectedError.source}
                      </code>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Detaylar</p>
                      <pre className="block p-4 my-1 bg-gray-100 dark:bg-gray-800 rounded overflow-x-auto text-xs font-mono whitespace-pre-wrap">
                        {selectedError.details}
                      </pre>
                    </div>

                    {!selectedError.resolved && (
                      <div className="pt-4 flex justify-end">
                        <button
                          onClick={() => resolveError(selectedError.id)}
                          className="glass-btn px-4 py-2 bg-green-500/70 hover:bg-green-600/70 text-white rounded-lg shadow-md transition-colors"
                          disabled={isResolvingError}
                        >
                          {isResolvingError ? (
                            <div className="flex items-center">
                              <Spinner isLoading={true} size="sm" className="mr-2" />
                              <span>İşleniyor...</span>
                            </div>
                          ) : (
                            'Çözüldü Olarak İşaretle'
                          )}
                        </button>
                      </div>
                    )}
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

export default ErrorReports; 