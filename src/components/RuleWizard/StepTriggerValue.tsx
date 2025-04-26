import React from 'react';
import { useWizard } from './WizardContext';
import { FormField } from '../../components/ui/FormField';
import { useForm } from 'react-hook-form';
import { VALIDATION_RULES } from '../../utils/validation';
import RegexBuilder from '../VisualRuleBuilder/RegexBuilder';

interface FormData {
  triggerValue: string;
}

const StepTriggerValue: React.FC = () => {
  const { data, updateData } = useWizard();
  
  const { register, formState: { errors }, setValue, watch } = useForm<FormData>({
    defaultValues: {
      triggerValue: data.triggerValue
    }
  });
  
  const triggerValue = watch('triggerValue');
  
  // Update wizard data when form changes
  React.useEffect(() => {
    updateData({ triggerValue });
  }, [triggerValue, updateData]);
  
  // Handle regex builder updates
  const handleRegexChange = (pattern: string) => {
    setValue('triggerValue', pattern);
  };
  
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">
        {data.triggerType === 'text' ? 'Aranan Metni Girin' : 'Regex Paterni Oluşturun'}
      </h2>
      
      <p className="mb-6 text-gray-600 dark:text-gray-300">
        {data.triggerType === 'text' 
          ? 'Mesajlarda aranacak metni yazın. Mesaj bu metni içerdiğinde kural tetiklenecek.' 
          : 'Regex paterni oluşturun. Mesaj bu kalıba uyduğunda kural tetiklenecek.'}
      </p>
      
      {data.triggerType === 'text' ? (
        <FormField
          name="triggerValue"
          label="Aranacak Metin"
          placeholder="Örn: merhaba, sipariş, yardım"
          register={register}
          rules={{ 
            required: VALIDATION_RULES.REQUIRED,
            minLength: { value: 2, message: VALIDATION_RULES.MIN_LENGTH(2) }
          }}
          errors={errors}
        />
      ) : (
        <div>
          <RegexBuilder
            pattern={data.triggerValue}
            onChange={handleRegexChange}
          />
          
          <div className="mt-4">
            <h3 className="font-medium mb-2">Test Metinleri</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
              Aşağıdaki test metinlerinden herhangi biri regex paterninize uyuyor mu görün.
            </p>
            
            <div className="space-y-2">
              {['Merhaba, nasılsınız?', 'Sipariş #12345 hakkında bilgi almak istiyorum', 'Yardıma ihtiyacım var!'].map((text, i) => {
                let matches = false;
                try {
                  const regex = new RegExp(data.triggerValue);
                  matches = regex.test(text);
                } catch (e) {
                  // Invalid regex
                }
                
                return (
                  <div key={i} className={`p-2 rounded ${
                    matches 
                      ? 'bg-green-100 dark:bg-green-900/30' 
                      : 'bg-gray-100 dark:bg-gray-800'
                  }`}>
                    <div className="flex items-center">
                      <span className="mr-2 text-lg">{matches ? '✅' : '❌'}</span>
                      <p>{text}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StepTriggerValue; 