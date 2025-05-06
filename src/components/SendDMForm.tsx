import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import GlassCard from './ui/GlassCard';
import Spinner from './ui/Spinner';
import { sendDM } from '../utils/api';

interface SendDMFormProps {
  selectedUserIds: number[];
  sessionId: number;
}

interface SendResult {
  success: {
    user_ids: number[];
    usernames: string[];
  };
  failed: {
    user_ids: number[];
    usernames: string[];
  };
}

const SendDMForm: React.FC<SendDMFormProps> = ({ selectedUserIds, sessionId }) => {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [progress, setProgress] = useState(0);
  const [displayProgress, setDisplayProgress] = useState(0);
  const [stats, setStats] = useState({ success: 0, failed: 0 });
  const [showProgress, setShowProgress] = useState(false);
  const [sendResults, setSendResults] = useState<SendResult | null>(null);
  const [showSuccessList, setShowSuccessList] = useState(false);
  const [showFailedList, setShowFailedList] = useState(false);
  const [lastCheckpoint, setLastCheckpoint] = useState(0);

  useEffect(() => {
    let animationFrame: number;
    
    const animateProgress = () => {
      const diff = progress - displayProgress;
      
      if (Math.abs(diff) < 0.1) {
        setDisplayProgress(progress);
        return;
      }
      
      const step = diff * 0.08;
      setDisplayProgress(prev => prev + step);
      animationFrame = requestAnimationFrame(animateProgress);
    };
    
    if (progress !== displayProgress) {
      animationFrame = requestAnimationFrame(animateProgress);
    }
    
    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [progress, displayProgress]);

  const handleSend = async () => {
    if (!message.trim() || selectedUserIds.length === 0) return;

    setIsSending(true);
    setProgress(0);
    setDisplayProgress(0);
    setStats({ success: 0, failed: 0 });
    setShowProgress(true);
    setSendResults(null);
    setLastCheckpoint(0);
    
    try {
      const response = await sendDM(sessionId, selectedUserIds, message);
      const { success_count, failure_count, success_list, failed_list, progressive_status } = response.data;
      
      if (progressive_status && Array.isArray(progressive_status)) {
        let currentSuccessCount = 0;
        
        for (const status of progressive_status) {
          if (status.success) {
            currentSuccessCount++;
            
            if (currentSuccessCount % 10 === 0 && currentSuccessCount > lastCheckpoint) {
              toast.info(`🎯 ${currentSuccessCount} mesaj gönderildi!`, {
                className: 'bg-blue-600 text-white font-medium',
                progressClassName: 'bg-blue-300'
              });
              setLastCheckpoint(currentSuccessCount);
            }
            
            const progressPercentage = Math.round((currentSuccessCount / selectedUserIds.length) * 100);
            setProgress(progressPercentage > 100 ? 100 : progressPercentage);
            setStats(prev => ({ ...prev, success: currentSuccessCount }));
          } else {
            setStats(prev => ({ ...prev, failed: prev.failed + 1 }));
          }
        }
      } else {
        setStats({ 
          success: success_count, 
          failed: failure_count 
        });
        
        if (success_count >= 10 && Math.floor(success_count / 10) > lastCheckpoint / 10) {
          const checkpointCount = Math.floor(success_count / 10) * 10;
          toast.info(`🎯 ${checkpointCount} mesaj gönderildi!`, {
            className: 'bg-blue-600 text-white font-medium',
            progressClassName: 'bg-blue-300'
          });
        }
        
        setProgress(100);
      }
      
      setSendResults({
        success: {
          user_ids: success_list?.user_ids || [],
          usernames: success_list?.usernames || []
        },
        failed: {
          user_ids: failed_list?.user_ids || [],
          usernames: failed_list?.usernames || []
        }
      });
      
      toast.success(`✅ ${success_count} mesaj başarıyla iletildi!`, {
        className: 'bg-green-600 text-white font-medium',
        progressClassName: 'bg-green-300'
      });
      
      if (failure_count > 0) {
        toast.error(`⚠️ ${failure_count} mesaj gönderilemedi!`, {
          className: 'bg-red-600 text-white font-medium',
          progressClassName: 'bg-red-300'
        });
      }
      
      setMessage('');
    } catch (error) {
      let errorMessage = "Mesaj gönderimi başarısız!";
      
      if (error instanceof Error) {
        errorMessage = `${errorMessage} ${error.message.includes("network") ? "(Ağ hatası - yeniden deneme başarısız)" : ""}`;
      }
      
      toast.error(`❌ ${errorMessage}`, {
        className: 'bg-red-600 text-white font-medium',
        progressClassName: 'bg-red-300'
      });
      console.error('Mesaj gönderme hatası:', error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <GlassCard className="p-6">
      <div className="space-y-4">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Göndermek istediğiniz mesajı yazın..."
          disabled={isSending}
          className="w-full h-32 p-3 rounded-lg bg-white/5 border border-white/10 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        />
        
        <button
          onClick={handleSend}
          disabled={isSending || !message.trim() || selectedUserIds.length === 0}
          className="w-full py-2 px-4 rounded-lg bg-blue-500 text-white font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          {isSending ? (
            <div className="flex items-center justify-center gap-2">
              <Spinner size="sm" />
              <span>Gönderiliyor...</span>
            </div>
          ) : (
            'Mesajları Gönder'
          )}
        </button>
        
        {showProgress && (
          <div className="mt-4 space-y-2">
            <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full shadow-inner"
                style={{ 
                  width: `${displayProgress}%`,
                  transition: 'none'
                }}
              ></div>
            </div>
            
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center">
                <span className="inline-block w-3 h-3 mr-2 bg-green-500 rounded-full"></span>
                <span>Başarılı: {stats.success}</span>
              </div>
              <div className="flex items-center">
                <span className="inline-block w-3 h-3 mr-2 bg-red-500 rounded-full"></span>
                <span>Başarısız: {stats.failed}</span>
              </div>
              <div>
                <span className="font-medium">{displayProgress}%</span>
              </div>
            </div>
          </div>
        )}
        
        {(stats.success > 0 || stats.failed > 0) && (
          <div className="mt-4 p-4 bg-blue-50/30 dark:bg-blue-900/20 rounded-lg border border-blue-100/40 dark:border-blue-700/30 flex justify-between items-center">
            <div className="space-y-1">
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full bg-green-400/80 mr-2 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="text-sm font-medium text-green-700 dark:text-green-300">
                  Toplam Başarılı: {stats.success}
                </div>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full bg-red-400/80 mr-2 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="text-sm font-medium text-red-700 dark:text-red-300">
                  Toplam Başarısız: {stats.failed}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-blue-600 dark:text-blue-300">
                Toplam: {stats.success + stats.failed}/{selectedUserIds.length}
              </div>
            </div>
          </div>
        )}
        
        {sendResults && (
          <div className="mt-4 space-y-4">
            {sendResults.success.user_ids.length > 0 && (
              <div className="border border-green-200 dark:border-green-900 rounded-lg overflow-hidden">
                <button 
                  onClick={() => setShowSuccessList(!showSuccessList)}
                  className="w-full flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 text-left"
                >
                  <span className="font-medium">Başarılı Gönderimler ({sendResults.success.user_ids.length})</span>
                  <span>{showSuccessList ? '▲' : '▼'}</span>
                </button>
                
                {showSuccessList && (
                  <div className="p-3 bg-white/5 max-h-40 overflow-y-auto">
                    <ul className="space-y-1">
                      {sendResults.success.user_ids.map((id, index) => (
                        <li key={id} className="text-sm py-1 px-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
                          {sendResults.success.usernames[index] || `Kullanıcı #${id}`}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
            
            {sendResults.failed.user_ids.length > 0 && (
              <div className="border border-red-200 dark:border-red-900 rounded-lg overflow-hidden">
                <button 
                  onClick={() => setShowFailedList(!showFailedList)}
                  className="w-full flex justify-between items-center p-3 bg-red-50 dark:bg-red-900/20 text-left"
                >
                  <span className="font-medium">Başarısız Gönderimler ({sendResults.failed.user_ids.length})</span>
                  <span>{showFailedList ? '▲' : '▼'}</span>
                </button>
                
                {showFailedList && (
                  <div className="p-3 bg-white/5 max-h-40 overflow-y-auto">
                    <ul className="space-y-1">
                      {sendResults.failed.user_ids.map((id, index) => (
                        <li key={id} className="text-sm py-1 px-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
                          {sendResults.failed.usernames[index] || `Kullanıcı #${id}`}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </GlassCard>
  );
};

export default SendDMForm; 