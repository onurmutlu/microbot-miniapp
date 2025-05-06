import React, { useState } from 'react';
import { CheckCircleIcon, KeyIcon, LockClosedIcon, PhoneIcon } from '@heroicons/react/24/outline';
import SessionForm from './SessionForm';
import CodeConfirmForm from './CodeConfirmForm';
import PasswordConfirmForm from './PasswordConfirmForm';

interface SessionManagerProps {
  onSessionStarted?: () => void;
  initialData?: {
    phone?: string;
    api_id?: string;
    api_hash?: string;
    phone_code_hash?: string;
  };
}

enum SessionStep {
  START = 'START',
  CODE_CONFIRM = 'CODE_CONFIRM',
  PASSWORD_CONFIRM = 'PASSWORD_CONFIRM',
  COMPLETED = 'COMPLETED'
}

// Adım ikonunu görüntülemek için yardımcı bileşen
interface StepIconProps {
  step: SessionStep;
  currentStep: SessionStep;
  icon: React.ReactNode;
  label: string;
}

const StepIcon: React.FC<StepIconProps> = ({ step, currentStep, icon, label }) => {
  const isActive = step === currentStep;
  const isCompleted = getStepIndex(currentStep) > getStepIndex(step);
  
  return (
    <div className="flex flex-col items-center">
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center ${
          isActive ? 'glass-gradient-primary' : 
          isCompleted ? 'glass-gradient-success' : 'bg-gray-200 dark:bg-gray-700'
        }`}
      >
        {icon}
      </div>
      <span className={`text-xs mt-1 ${
        isActive ? 'text-[#3f51b5] dark:text-[#5c6bc0] font-medium' : 
        isCompleted ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500 dark:text-gray-400'
      }`}>
        {label}
      </span>
    </div>
  );
};

function getStepIndex(step: SessionStep): number {
  const steps = [
    SessionStep.START,
    SessionStep.CODE_CONFIRM,
    SessionStep.PASSWORD_CONFIRM,
    SessionStep.COMPLETED
  ];
  return steps.indexOf(step);
}

const SessionManager: React.FC<SessionManagerProps> = ({ onSessionStarted, initialData }) => {
  const [currentStep, setCurrentStep] = useState<SessionStep>(
    initialData?.phone && initialData?.phone_code_hash ? 
      SessionStep.CODE_CONFIRM : 
      SessionStep.START
  );
  
  const [sessionData, setSessionData] = useState({
    phone: initialData?.phone || '',
    api_id: initialData?.api_id || '',
    api_hash: initialData?.api_hash || '',
    phone_code_hash: initialData?.phone_code_hash || ''
  });
  
  // Telefon numarası ile oturum başlatıldığında
  const handleCodeRequested = (phone: string, api_id: string, api_hash: string, phone_code_hash: string) => {
    setSessionData({
      phone,
      api_id,
      api_hash,
      phone_code_hash
    });
    setCurrentStep(SessionStep.CODE_CONFIRM);
  };
  
  // Doğrulama kodu onaylandığında
  const handleCodeConfirmed = (requires2FA: boolean) => {
    if (requires2FA) {
      setCurrentStep(SessionStep.PASSWORD_CONFIRM);
    } else {
      setCurrentStep(SessionStep.COMPLETED);
      
      if (onSessionStarted) {
        onSessionStarted();
      }
    }
  };
  
  // 2FA şifresi onaylandığında
  const handleSessionStarted = () => {
    setCurrentStep(SessionStep.COMPLETED);
    
    if (onSessionStarted) {
      onSessionStarted();
    }
  };
  
  // Bir önceki adıma dönüş
  const handleBackToStart = () => {
    setCurrentStep(SessionStep.START);
  };
  
  // 2FA adımından kod doğrulama adımına dönüş
  const handleBackToCodeConfirm = () => {
    setCurrentStep(SessionStep.CODE_CONFIRM);
  };
  
  // Adım göstergesi
  const renderStepIndicator = () => {
    return (
      <div className="flex justify-center mb-6 space-x-2">
        <StepIcon 
          step={SessionStep.START} 
          currentStep={currentStep} 
          icon={<PhoneIcon className="w-5 h-5 text-white" />}
          label="Başlangıç" 
        />
        <div className="w-8 h-0.5 self-center bg-gray-200 dark:bg-gray-700"></div>
        
        <StepIcon 
          step={SessionStep.CODE_CONFIRM} 
          currentStep={currentStep} 
          icon={<KeyIcon className="w-5 h-5 text-white" />}
          label="Kod Doğrulama" 
        />
        
        <div className="w-8 h-0.5 self-center bg-gray-200 dark:bg-gray-700"></div>
        
        <StepIcon 
          step={SessionStep.PASSWORD_CONFIRM} 
          currentStep={currentStep} 
          icon={<LockClosedIcon className="w-5 h-5 text-white" />}
          label="Şifre Doğrulama" 
        />
        
        <div className="w-8 h-0.5 self-center bg-gray-200 dark:bg-gray-700"></div>
        <StepIcon 
          step={SessionStep.COMPLETED} 
          currentStep={currentStep} 
          icon={<CheckCircleIcon className="w-5 h-5 text-white" />}
          label="Tamamlandı" 
        />
      </div>
    );
  };
  
  return (
    <div className="container mx-auto max-w-md px-4 py-8 animate-fade-in">
      {renderStepIndicator()}
      
      {currentStep === SessionStep.START && (
        <SessionForm onCodeRequested={handleCodeRequested} />
      )}
      
      {currentStep === SessionStep.CODE_CONFIRM && (
        <CodeConfirmForm 
          phone={sessionData.phone}
          api_id={sessionData.api_id}
          api_hash={sessionData.api_hash}
          phone_code_hash={sessionData.phone_code_hash}
          onBackClick={handleBackToStart} 
          onCodeConfirmed={handleCodeConfirmed} 
        />
      )}
      
      {currentStep === SessionStep.PASSWORD_CONFIRM && (
        <PasswordConfirmForm
          phone={sessionData.phone}
          api_id={sessionData.api_id}
          api_hash={sessionData.api_hash}
          phone_code_hash={sessionData.phone_code_hash}
          onBackClick={handleBackToCodeConfirm}
          onSessionStarted={handleSessionStarted}
        />
      )}
      
      {currentStep === SessionStep.COMPLETED && (
        <div className="glass-card p-6 animate-fade-in">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto glass-gradient-success rounded-full flex items-center justify-center mb-4">
              <CheckCircleIcon className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-2 glass-gradient">Oturum Başarıyla Başlatıldı</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Telegram oturumunuz başarıyla başlatıldı. Şimdi işlemlerinize devam edebilirsiniz.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SessionManager; 