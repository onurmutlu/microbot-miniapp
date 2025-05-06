import { showError, clearAllToasts } from '../utils/toast';
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    console.error('Uygulama hatası:', error, errorInfo);
    
    // Önce tüm bildirimleri temizleyelim ve sonra hata mesajını gösterelim
    clearAllToasts();
    setTimeout(() => {
      showError('Bir hata oluştu. Lütfen sayfayı yenileyin.');
    }, 200);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      return (
        <div className="error-boundary p-4 bg-red-50 dark:bg-red-900/20 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-red-700 dark:text-red-400 mb-2">
            Bir şeyler yanlış gitti
          </h2>
          <p className="text-red-600 dark:text-red-300 mb-3">
            Uygulama bir hata ile karşılaştı. Lütfen sayfayı yenileyin veya daha sonra tekrar deneyin.
          </p>
          <button 
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            onClick={() => window.location.reload()}
          >
            Sayfayı Yenile
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 