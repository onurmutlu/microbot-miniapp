import React, { useState, useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { Card, Row, Col, Form, Button, Spinner, Badge, Tabs, Tab } from 'react-bootstrap';
import { GET_GROUP_INSIGHTS } from '../api/graphql/queries';
import { aiService } from '../api/rest/endpoints';
import { getTestMode } from '../utils/testMode';
import { Pie, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';

// ChartJS bileşenlerini kaydet
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

// Mock grup listesi
const MOCK_GROUPS = [
  { 
    id: 1, 
    name: 'Kripto Topluluğu', 
    memberCount: 1250, 
    activityScore: 8.5, 
    successRate: 87,
    category: 'Kripto'
  },
  { 
    id: 2, 
    name: 'Yazılım Geliştiricileri', 
    memberCount: 980, 
    activityScore: 7.2, 
    successRate: 92,
    category: 'Teknoloji'
  },
  { 
    id: 3, 
    name: 'Finansal Özgürlük', 
    memberCount: 2450, 
    activityScore: 9.1, 
    successRate: 84,
    category: 'Finans'
  },
  { 
    id: 4, 
    name: 'MicroBot Destek', 
    memberCount: 560, 
    activityScore: 6.8, 
    successRate: 95,
    category: 'Destek'
  },
];

// Mock kategori verileri
const MOCK_CATEGORIES = [
  { name: 'Kripto', count: 12 },
  { name: 'Teknoloji', count: 8 },
  { name: 'Finans', count: 6 },
  { name: 'Destek', count: 5 },
  { name: 'Diğer', count: 3 }
];

// Mock saatlik aktivite verileri
const MOCK_HOURLY_ACTIVITY = Array(24).fill(0).map((_, hour) => {
  // İş saatleri daha yoğun olsun
  const factor = (hour >= 9 && hour <= 18) ? Math.random() * 50 + 70 : Math.random() * 30 + 20;
  return {
    hour,
    count: Math.floor(factor)
  };
});

// İçgörü tipi
interface GroupInsight {
  status: string;
  content_analysis: {
    avg_message_length: number;
    media_rate: number;
    interaction_rate?: number;
    top_keywords?: string[];
  };
  recommendations: {
    type: string;
    message: string;
  }[];
}

// Grup bilgisi tipi
interface Group {
  id: number;
  name: string;
  memberCount: number;
  activityScore: number;
  successRate: number;
  category: string;
}

const GroupAnalysisPage: React.FC = () => {
  const [selectedGroupId, setSelectedGroupId] = useState<number>(1);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [groupInsights, setGroupInsights] = useState<GroupInsight | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('overview');

  // Apollo Client Query Hook'u
  const { data: graphqlData, loading: graphqlLoading, error: graphqlError } = 
    useQuery(GET_GROUP_INSIGHTS, {
      variables: { groupId: selectedGroupId },
      skip: getTestMode() // Test modunda GraphQL atla
    });

  // Grupları filtrele
  const filteredGroups = MOCK_GROUPS.filter(group => 
    group.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Grup seçme
  const handleSelectGroup = (group: Group) => {
    setSelectedGroupId(group.id);
    setSelectedGroup(group);
    loadGroupInsights(group.id);
  };

  // REST API'den grup içgörülerini yükle
  const loadGroupInsights = async (groupId: number) => {
    setLoading(true);
    setError(null);

    // Test modunda mock veri kullan
    if (getTestMode()) {
      setTimeout(() => {
        setGroupInsights({
          status: 'success',
          content_analysis: {
            avg_message_length: Math.floor(Math.random() * 150) + 50,
            media_rate: Math.random() * 0.4 + 0.1,
            interaction_rate: Math.random() * 0.3 + 0.4,
            top_keywords: ['kripto', 'bitcoin', 'ethereum', 'yatırım', 'token']
          },
          recommendations: [
            { 
              type: 'content', 
              message: 'Mesajlara görsel eklemek etkileşimi %30 artırabilir'
            },
            { 
              type: 'timing', 
              message: 'Mesajları 18:00-20:00 arası göndermek daha yüksek görüntülenme sağlayabilir'
            },
            {
              type: 'engagement',
              message: 'Sorular sormak grup etkileşimini artıracaktır'
            }
          ]
        });
        setLoading(false);
      }, 1000);
      return;
    }

    try {
      const data = await aiService.getGroupInsights(groupId);
      setGroupInsights(data);
    } catch (err: any) {
      console.error('Grup içgörüleri yükleme hatası:', err);
      setError('Grup içgörüleri alınamadı: ' + (err.message || 'Bilinmeyen hata'));
    } finally {
      setLoading(false);
    }
  };

  // GraphQL verisi değiştiğinde içgörüleri güncelle
  useEffect(() => {
    if (graphqlData?.group_content_insights) {
      setGroupInsights(graphqlData.group_content_insights);
    }
  }, [graphqlData]);

  // İlk yüklemede seçili grubu ayarla
  useEffect(() => {
    const initialGroup = MOCK_GROUPS.find(g => g.id === selectedGroupId) || null;
    setSelectedGroup(initialGroup);
    
    if (initialGroup) {
      loadGroupInsights(initialGroup.id);
    }
  }, []);

  // Kategori pasta grafiği verileri
  const categoryChartData = {
    labels: MOCK_CATEGORIES.map(cat => cat.name),
    datasets: [
      {
        data: MOCK_CATEGORIES.map(cat => cat.count),
        backgroundColor: [
          'rgba(255, 99, 132, 0.7)',
          'rgba(54, 162, 235, 0.7)',
          'rgba(255, 206, 86, 0.7)',
          'rgba(75, 192, 192, 0.7)',
          'rgba(153, 102, 255, 0.7)',
        ],
        borderWidth: 1,
      }
    ]
  };

  // Saatlik aktivite çubuk grafiği
  const hourlyActivityData = {
    labels: MOCK_HOURLY_ACTIVITY.map(h => `${h.hour}:00`),
    datasets: [
      {
        label: 'Mesaj Sayısı',
        data: MOCK_HOURLY_ACTIVITY.map(h => h.count),
        backgroundColor: 'rgba(54, 162, 235, 0.7)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1
      }
    ]
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Grup Analizi</h1>
      
      <Row>
        <Col md={4} lg={3}>
          <Card className="mb-4 shadow-sm">
            <Card.Body>
              <Card.Title>Gruplar</Card.Title>
              
              <Form.Group className="mb-3">
                <Form.Control
                  type="text"
                  placeholder="Grup ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </Form.Group>
              
              <div className="overflow-auto" style={{ maxHeight: '400px' }}>
                <div className="list-group">
                  {filteredGroups.map(group => (
                    <button
                      key={group.id}
                      type="button"
                      className={`list-group-item list-group-item-action ${selectedGroupId === group.id ? 'active' : ''}`}
                      onClick={() => handleSelectGroup(group)}
                    >
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <div className="fw-bold">{group.name}</div>
                          <small>{group.category}</small>
                        </div>
                        <Badge bg="primary" pill>{group.memberCount}</Badge>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </Card.Body>
          </Card>
          
          <Card className="shadow-sm">
            <Card.Body>
              <Card.Title>Kategoriler</Card.Title>
              <div style={{ height: '220px' }}>
                <Pie data={categoryChartData} options={{ maintainAspectRatio: false }} />
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={8} lg={9}>
          {!selectedGroup ? (
            <div className="text-center p-5 bg-light rounded">
              <p className="text-muted">Lütfen analiz için bir grup seçin</p>
            </div>
          ) : loading ? (
            <div className="text-center p-5 bg-light rounded">
              <Spinner animation="border" />
              <p className="mt-3">Grup içgörüleri yükleniyor...</p>
            </div>
          ) : error ? (
            <div className="alert alert-danger">
              {error}
            </div>
          ) : (
            <>
              <Card className="mb-4 shadow-sm">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h3 className="card-title">{selectedGroup.name}</h3>
                    <Button 
                      variant="outline-primary" 
                      size="sm"
                      onClick={() => loadGroupInsights(selectedGroup.id)}
                    >
                      Yenile
                    </Button>
                  </div>
                  
                  <Row className="mb-4">
                    <Col md={4}>
                      <div className="border rounded p-3 text-center">
                        <div className="text-muted mb-1">Üye Sayısı</div>
                        <div className="h4">{selectedGroup.memberCount}</div>
                      </div>
                    </Col>
                    <Col md={4}>
                      <div className="border rounded p-3 text-center">
                        <div className="text-muted mb-1">Aktivite Skoru</div>
                        <div className="h4">{selectedGroup.activityScore}/10</div>
                      </div>
                    </Col>
                    <Col md={4}>
                      <div className="border rounded p-3 text-center">
                        <div className="text-muted mb-1">Başarı Oranı</div>
                        <div className="h4">%{selectedGroup.successRate}</div>
                      </div>
                    </Col>
                  </Row>
                  
                  <Tabs
                    activeKey={activeTab}
                    onSelect={(k) => k && setActiveTab(k)}
                    className="mb-3"
                  >
                    <Tab eventKey="overview" title="Genel Bakış">
                      <Row>
                        <Col md={6}>
                          <h5 className="mb-3">Grup İçgörüleri</h5>
                          
                          {groupInsights && (
                            <div className="list-group mb-4">
                              <div className="list-group-item">
                                <div className="d-flex justify-content-between">
                                  <div>Ortalama Mesaj Uzunluğu</div>
                                  <strong>{groupInsights.content_analysis.avg_message_length} karakter</strong>
                                </div>
                              </div>
                              <div className="list-group-item">
                                <div className="d-flex justify-content-between">
                                  <div>Medya Kullanım Oranı</div>
                                  <strong>%{Math.round(groupInsights.content_analysis.media_rate * 100)}</strong>
                                </div>
                              </div>
                              {groupInsights.content_analysis.interaction_rate && (
                                <div className="list-group-item">
                                  <div className="d-flex justify-content-between">
                                    <div>Etkileşim Oranı</div>
                                    <strong>%{Math.round(groupInsights.content_analysis.interaction_rate * 100)}</strong>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                          
                          {groupInsights?.content_analysis?.top_keywords && (
                            <div className="mb-4">
                              <h6>Popüler Anahtar Kelimeler</h6>
                              <div>
                                {groupInsights.content_analysis.top_keywords.map((keyword, index) => (
                                  <Badge key={index} bg="secondary" className="me-2 mb-2">{keyword}</Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </Col>
                        
                        <Col md={6}>
                          <h5 className="mb-3">AI Önerileri</h5>
                          
                          {groupInsights?.recommendations?.length ? (
                            <div className="list-group">
                              {groupInsights.recommendations.map((rec, index) => (
                                <div key={index} className="list-group-item">
                                  <div className="d-flex">
                                    <Badge bg={rec.type === 'content' ? 'info' : 'success'} className="me-2">{rec.type}</Badge>
                                    <div>{rec.message}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-muted">Henüz öneri bulunmuyor</p>
                          )}
                        </Col>
                      </Row>
                    </Tab>
                    <Tab eventKey="activity" title="Aktivite Analizi">
                      <h5 className="mb-3">Saatlik Aktivite</h5>
                      <div style={{ height: '300px' }}>
                        <Bar 
                          data={hourlyActivityData} 
                          options={{ 
                            maintainAspectRatio: false,
                            plugins: {
                              title: {
                                display: true,
                                text: 'Saatlik Mesaj Aktivitesi'
                              }
                            },
                            scales: {
                              y: {
                                beginAtZero: true,
                                title: {
                                  display: true,
                                  text: 'Mesaj Sayısı'
                                }
                              },
                              x: {
                                title: {
                                  display: true,
                                  text: 'Saat'
                                }
                              }
                            }
                          }} 
                        />
                      </div>
                      
                      <div className="mt-4 p-3 bg-light rounded">
                        <h6>En Aktif Saatler</h6>
                        <p>
                          Bu grupta en yüksek aktivite <strong>18:00-21:00</strong> saatleri arasında görülmektedir. 
                          Bu saatlerde mesaj göndermek daha yüksek görünürlük ve etkileşim sağlayabilir.
                        </p>
                      </div>
                    </Tab>
                  </Tabs>
                </Card.Body>
              </Card>
            </>
          )}
        </Col>
      </Row>
    </div>
  );
};

export default GroupAnalysisPage; 