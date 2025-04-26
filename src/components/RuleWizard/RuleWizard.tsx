import React, { useState } from 'react';
import { WizardProvider, useWizard } from './WizardContext';
import StepIndicator from './StepIndicator';
import StepTriggerType from './StepTriggerType';
import StepTriggerValue from './StepTriggerValue';
import StepResponseType from './StepResponseType';
import StepResponseValue from './StepResponseValue';
import StepTestRule from './StepTestRule';
import { Button } from '../ui/button';
import api from '../../utils/api';
import { showSuccess, handleApiError } from '../../utils/toast';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { iCarbonAdd, iCarbonTrash } from 'unocss/preset-icons';

interface RuleWizardProps {
  onComplete?: (data: any) => void;
  onCancel?: () => void;
}

interface Rule {
  id: string;
  trigger: string;
  response: string;
  isActive: boolean;
}

const WizardContent: React.FC = () => {
  const { currentStep, nextStep, prevStep, isLastStep, isFirstStep, data } = useWizard();
  const [rules, setRules] = useState<Rule[]>([]);
  const [newRule, setNewRule] = useState<Partial<Rule>>({
    trigger: '',
    response: '',
    isActive: true,
  });
  
  // Determine which step component to render
  const renderStep = () => {
    switch (currentStep) {
      case 'trigger-type':
        return <StepTriggerType />;
      case 'trigger-value':
        return <StepTriggerValue />;
      case 'response-type':
        return <StepResponseType />;
      case 'response-value':
        return <StepResponseValue />;
      case 'test':
        return <StepTestRule />;
      default:
        return null;
    }
  };

  // Form submission handler
  const handleSubmit = async () => {
    try {
      const payload = {
        keyword: data.triggerValue,
        response: data.responseValue,
        match_type: data.triggerType === 'text' ? 'contains' : 'regex',
        priority: data.priority
      };
      
      await api.post('/api/auto-replies', payload);
      showSuccess('Otomatik yanıt kuralı başarıyla oluşturuldu');
      
      // Here you might want to navigate away or reset the form
    } catch (error) {
      handleApiError(error, 'Kural oluşturulurken hata oluştu');
    }
  };

  const handleAddRule = () => {
    if (newRule.trigger && newRule.response) {
      setRules([
        ...rules,
        {
          id: Date.now().toString(),
          trigger: newRule.trigger,
          response: newRule.response,
          isActive: newRule.isActive || true,
        },
      ]);
      setNewRule({ trigger: '', response: '', isActive: true });
    }
  };

  const handleDeleteRule = (id: string) => {
    setRules(rules.filter((rule) => rule.id !== id));
  };

  const handleToggleRule = (id: string) => {
    setRules(
      rules.map((rule) =>
        rule.id === id ? { ...rule, isActive: !rule.isActive } : rule
      )
    );
  };

  return (
    <div className="space-y-6">
      <Card className="bg-dark-800 border-dark-700">
        <CardHeader>
          <CardTitle className="text-white">Yeni Kural Ekle</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="trigger" className="text-white">
                Tetikleyici
              </Label>
              <Input
                id="trigger"
                value={newRule.trigger}
                onChange={(e) =>
                  setNewRule({ ...newRule, trigger: e.target.value })
                }
                className="bg-dark-700 border-dark-600 text-white"
                placeholder="Tetikleyici metin veya regex"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="response" className="text-white">
                Yanıt
              </Label>
              <Textarea
                id="response"
                value={newRule.response}
                onChange={(e) =>
                  setNewRule({ ...newRule, response: e.target.value })
                }
                className="bg-dark-700 border-dark-600 text-white"
                placeholder="Yanıt metni"
              />
            </div>
          </div>
          <Button
            onClick={handleAddRule}
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            <i-carbon-add className="mr-2" />
            Kural Ekle
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-dark-800 border-dark-700">
        <CardHeader>
          <CardTitle className="text-white">Mevcut Kurallar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className="flex items-center justify-between p-4 bg-dark-700 rounded-lg"
              >
                <div className="space-y-1">
                  <p className="text-white font-medium">{rule.trigger}</p>
                  <p className="text-gray-400 text-sm">{rule.response}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleRule(rule.id)}
                    className={`${
                      rule.isActive
                        ? 'bg-green-500/10 text-green-400'
                        : 'bg-red-500/10 text-red-400'
                    }`}
                  >
                    {rule.isActive ? 'Aktif' : 'Pasif'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteRule(rule.id)}
                    className="text-red-400 hover:bg-red-500/10"
                  >
                    <i-carbon-trash className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            {rules.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                Henüz kural eklenmemiş
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="border rounded-lg bg-white dark:bg-gray-800 p-6">
        <StepIndicator />
        
        <div className="mt-6 min-h-[300px]">
          {renderStep()}
        </div>
        
        <div className="mt-6 pt-4 border-t flex justify-between">
          {!isFirstStep ? (
            <Button variant="outline" onClick={prevStep}>
              ← Geri
            </Button>
          ) : (
            <div></div> // Placeholder for flex spacing
          )}
          
          {isLastStep ? (
            <Button onClick={handleSubmit}>
              Kuralı Kaydet
            </Button>
          ) : (
            <Button onClick={nextStep}>
              İleri →
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

const RuleWizard: React.FC<RuleWizardProps> = () => {
  return (
    <WizardProvider>
      <WizardContent />
    </WizardProvider>
  );
};

export default RuleWizard; 