import { useState } from 'react';
import Button from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  iCarbonRule, 
  iCarbonTime, 
  iCarbonTemplate, 
  iCarbonSettings,
  iCarbonVisualRecognition
} from 'unocss/preset-icons';
import { Cog6ToothIcon, DocumentTextIcon, ClockIcon, BeakerIcon } from '@heroicons/react/24/outline'

const CentralPanel = () => {
  const [activeTab, setActiveTab] = useState('rules');

  return (
    <div className="min-h-screen bg-dark-900 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white">MicroBot Kontrol Paneli</h1>
          <div className="flex items-center gap-4">
            <Button variant="outline" className="text-white border-dark-700 hover:bg-dark-800">
              <Cog6ToothIcon className="h-5 w-5 mr-2" />
              Ayarlar
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-4 gap-4 bg-dark-800 p-1 rounded-lg">
            <TabsTrigger 
              value="rules" 
              className="data-[state=active]:bg-blue-500 data-[state=active]:text-white"
            >
              <i-carbon-rule className="mr-2" />
              Otomatik Yanıtlar
            </TabsTrigger>
            <TabsTrigger 
              value="scheduler" 
              className="data-[state=active]:bg-blue-500 data-[state=active]:text-white"
            >
              <ClockIcon className="h-5 w-5 mr-2" />
              Zamanlayıcı
            </TabsTrigger>
            <TabsTrigger 
              value="templates" 
              className="data-[state=active]:bg-blue-500 data-[state=active]:text-white"
            >
              <DocumentTextIcon className="h-5 w-5 mr-2" />
              Şablonlar
            </TabsTrigger>
            <TabsTrigger 
              value="visual" 
              className="data-[state=active]:bg-blue-500 data-[state=active]:text-white"
            >
              <BeakerIcon className="h-5 w-5 mr-2" />
              Görsel Kural Oluşturucu
            </TabsTrigger>
          </TabsList>

          <TabsContent value="rules" className="space-y-4">
            <Card className="bg-dark-800 border-dark-700">
              <CardHeader>
                <CardTitle className="text-white">Otomatik Yanıt Kuralları</CardTitle>
              </CardHeader>
              <CardContent>
                {/* RuleWizard bileşeni buraya gelecek */}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="scheduler" className="space-y-4">
            <Card className="bg-dark-800 border-dark-700">
              <CardHeader>
                <CardTitle className="text-white">Zamanlayıcı Yönetimi</CardTitle>
              </CardHeader>
              <CardContent>
                {/* SchedulerManager bileşeni buraya gelecek */}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="templates" className="space-y-4">
            <Card className="bg-dark-800 border-dark-700">
              <CardHeader>
                <CardTitle className="text-white">Mesaj Şablonları</CardTitle>
              </CardHeader>
              <CardContent>
                {/* TemplateGallery bileşeni buraya gelecek */}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="visual" className="space-y-4">
            <Card className="bg-dark-800 border-dark-700">
              <CardHeader>
                <CardTitle className="text-white">Görsel Kural Oluşturucu</CardTitle>
              </CardHeader>
              <CardContent>
                {/* VisualRuleBuilder bileşeni buraya gelecek */}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CentralPanel; 