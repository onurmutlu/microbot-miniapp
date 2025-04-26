import React, { createContext, useContext, useState } from 'react';

export type WizardStep = 'trigger-type' | 'trigger-value' | 'response-type' | 'response-value' | 'test';

export interface WizardData {
  triggerType: 'text' | 'regex';
  triggerValue: string;
  responseType: 'simple' | 'template';
  responseValue: string;
  priority: number;
}

interface WizardContextType {
  currentStep: WizardStep;
  data: WizardData;
  updateData: (updates: Partial<WizardData>) => void;
  goToStep: (step: WizardStep) => void;
  nextStep: () => void;
  prevStep: () => void;
  isLastStep: boolean;
  isFirstStep: boolean;
  reset: () => void;
}

const WizardContext = createContext<WizardContextType | undefined>(undefined);

const steps: WizardStep[] = ['trigger-type', 'trigger-value', 'response-type', 'response-value', 'test'];

const initialData: WizardData = {
  triggerType: 'text',
  triggerValue: '',
  responseType: 'simple',
  responseValue: '',
  priority: 10
};

export const WizardProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  const [currentStep, setCurrentStep] = useState<WizardStep>(steps[0]);
  const [data, setData] = useState<WizardData>(initialData);

  const currentStepIndex = steps.indexOf(currentStep);
  const isLastStep = currentStepIndex === steps.length - 1;
  const isFirstStep = currentStepIndex === 0;

  const updateData = (updates: Partial<WizardData>) => {
    setData(prevData => ({ ...prevData, ...updates }));
  };

  const goToStep = (step: WizardStep) => {
    setCurrentStep(step);
  };

  const nextStep = () => {
    if (!isLastStep) {
      setCurrentStep(steps[currentStepIndex + 1]);
    }
  };

  const prevStep = () => {
    if (!isFirstStep) {
      setCurrentStep(steps[currentStepIndex - 1]);
    }
  };

  const reset = () => {
    setData(initialData);
    setCurrentStep(steps[0]);
  };

  const value = {
    currentStep,
    data,
    updateData,
    goToStep,
    nextStep,
    prevStep,
    isLastStep,
    isFirstStep,
    reset
  };

  return (
    <WizardContext.Provider value={value}>
      {children}
    </WizardContext.Provider>
  );
};

export const useWizard = () => {
  const context = useContext(WizardContext);
  if (!context) {
    throw new Error('useWizard must be used within a WizardProvider');
  }
  return context;
}; 