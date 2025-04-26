import React from 'react';
import { useWizard, WizardStep } from './WizardContext';

const StepIndicator: React.FC = () => {
  const { currentStep, goToStep } = useWizard();
  
  const steps: Array<{ id: WizardStep, label: string }> = [
    { id: 'trigger-type', label: 'Tetikleyici Tipi' },
    { id: 'trigger-value', label: 'Tetikleyici Değeri' },
    { id: 'response-type', label: 'Yanıt Tipi' },
    { id: 'response-value', label: 'Yanıt İçeriği' },
    { id: 'test', label: 'Test' }
  ];
  
  const currentStepIndex = steps.findIndex(s => s.id === currentStep);
  
  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            {/* Step indicator */}
            <div className="flex flex-col items-center">
              <button
                onClick={() => goToStep(step.id)}
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  index <= currentStepIndex 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                }`}
              >
                {index + 1}
              </button>
              <span className={`mt-1 text-xs ${
                index <= currentStepIndex 
                  ? 'text-blue-600 dark:text-blue-400 font-medium' 
                  : 'text-gray-500 dark:text-gray-400'
              }`}>
                {step.label}
              </span>
            </div>
            
            {/* Connector line between steps */}
            {index < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 ${
                index < currentStepIndex 
                  ? 'bg-blue-600 dark:bg-blue-500' 
                  : 'bg-gray-200 dark:bg-gray-700'
              }`}></div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default StepIndicator; 