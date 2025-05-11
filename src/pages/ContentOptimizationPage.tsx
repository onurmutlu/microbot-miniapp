import React, { useState, useEffect } from 'react';
import { useMutation } from '@apollo/client';
import { Card, Row, Col, Form, Button, Spinner, Badge, ProgressBar } from 'react-bootstrap';
import { OPTIMIZE_MESSAGE } from '../api/graphql/mutations';
import { aiService } from '../api/rest/endpoints';
import { getTestMode } from '../utils/testMode';

// Mock grup listesi
const MOCK_GROUPS = [
  { id: 1, name: 'Kripto Topluluğu' },
  { id: 2, name: 'Yazılım Geliştiricileri' },
  { id: 3, name: 'Finansal Özgürlük' },
  { id: 4, name: 'MicroBot Destek' },
];

// Öneri tipi
interface Recommendation {
  type: string;
  message: string;
}

// Performans tahmini tipi
interface PerformancePrediction {
  engagement_rate: number;
  visibility_score: number;
  quality_rating: string;
}

const ContentOptimizationPage: React.FC = () => {
  const [selectedGroupId, setSelectedGroupId] = useState<number>(1);
  const [message, setMessage] = useState<string>('');
  const [optimizedMessage, setOptimizedMessage] = useState<string>('');
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [predictions, setPredictions] = useState<PerformancePrediction | null>(null);
  const [confidence, setConfidence] = useState<number>(0);
  const [isGraphQL, setIsGraphQL] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Apollo Client Mutation Hook'u
  const [optimizeMessageMutation] = useMutation(OPTIMIZE_MESSAGE);

  // GraphQL API ile mesaj optimizasyonu
  const optimizeWithGraphQL = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data } = await optimizeMessageMutation({
        variables: {
          message,
          groupId: selectedGroupId
        }
      });
      
      setOptimizedMessage(data.optimize_message.optimized_message);
      setRecommendations(data.optimize_message.recommendations);
      setConfidence(data.optimize_message.confidence_score);
      setPredictions(data.optimize_message.performance_predictions);
    } catch (err: any) {
      console.error('GraphQL mesaj optimizasyonu hatası:', err);
      setError('Mesaj optimizasyonu başarısız: ' + (err.message || 'Bilinmeyen hata'));
    } finally {
      setLoading(false);
    }
  };

  // REST API ile mesaj optimizasyonu
  const optimizeWithREST = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await aiService.optimizeMessage(message, selectedGroupId);
      
      setOptimizedMessage(data.optimized_message);
      setRecommendations(data.recommendations || []);
      setConfidence(data.confidence_score || 0.8);
      setPredictions({
        engagement_rate: data.engagement_rate || 0.78,
        visibility_score: data.visibility_score || 0.82,
        quality_rating: data.quality_rating || 'Çok İyi'
      });
    } catch (err: any) {
      console.error('REST mesaj optimizasyonu hatası:', err);
      setError('Mesaj optimizasyonu başarısız: ' + (err.message || 'Bilinmeyen hata'));
    } finally {
      setLoading(false);
    }
  };

  // Ana optimizasyon işlevi
  const handleOptimize = async () => {
    if (!message.trim()) {
      setError('Lütfen optimize edilecek bir mesaj girin');
      return;
    }

    // Test modunda mock veri kullan
    if (getTestMode()) {
      setLoading(true);
      setTimeout(() => {
        setOptimizedMessage('AI tarafından optimize edilmiş mesaj: ' + message.trim() + 
          '\n\nGrubunuzun ilgisini çekecek bir soru ekledim ve daha etkileşimli hale getirdim. ' + 
          'Bu şekilde daha fazla yanıt alabilirsiniz. Emojiler ekleyerek görsel çekicilik de ekledim.');
        
        setRecommendations([
          { type: 'length', message: 'Mesaj uzunluğu hedef kitle için ideal boyuta getirildi' },
          { type: 'language', message: 'Dil daha açık ve anlaşılır hale getirildi' },
          { type: 'engagement', message: 'Etkileşimi artırmak için soru eklenmiştir' }
        ]);
        
        setConfidence(0.92);
        
        setPredictions({
          engagement_rate: 0.78,
          visibility_score: 0.82,
          quality_rating: 'Çok İyi'
        });
        
        setLoading(false);
      }, 1500);
      return;
    }

    // GraphQL veya REST API kullan
    if (isGraphQL) {
      await optimizeWithGraphQL();
    } else {
      await optimizeWithREST();
    }
  };

  // Optimizasyon sıfırlama
  const resetOptimization = () => {
    setOptimizedMessage('');
    setRecommendations([]);
    setPredictions(null);
    setConfidence(0);
  };

  // Optimizasyon sonucunu kullan
  const useOptimizedMessage = () => {
    setMessage(optimizedMessage);
    resetOptimization();
  };

  // Güven puanı rengi
  const getConfidenceColor = () => {
    if (confidence >= 0.8) return 'success';
    if (confidence >= 0.5) return 'warning';
    return 'danger';
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">İçerik Optimizasyonu</h1>
      
      <div className="mb-4">
        <div className="flex items-center mb-2">
          <div className="mr-4">
            <Form.Check
              type="radio"
              label="GraphQL API"
              name="apiType"
              id="graphql"
              checked={isGraphQL}
              onChange={() => setIsGraphQL(true)}
            />
          </div>
          <div>
            <Form.Check
              type="radio"
              label="REST API"
              name="apiType"
              id="rest"
              checked={!isGraphQL}
              onChange={() => setIsGraphQL(false)}
            />
          </div>
        </div>
      </div>
      
      <Row>
        <Col md={6}>
          <Card className="mb-4 shadow-sm">
            <Card.Body>
              <Card.Title>Mesaj Optimizasyonu</Card.Title>
              
              <Form.Group className="mb-3">
                <Form.Label>Grup Seçimi</Form.Label>
                <Form.Select 
                  value={selectedGroupId}
                  onChange={(e) => setSelectedGroupId(parseInt(e.target.value))}
                >
                  {MOCK_GROUPS.map(group => (
                    <option key={group.id} value={group.id}>{group.name}</option>
                  ))}
                </Form.Select>
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>Mesajınız</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={6}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Optimize edilecek mesajı girin..."
                />
              </Form.Group>
              
              <Button 
                variant="primary" 
                onClick={handleOptimize}
                disabled={loading || !message.trim()}
              >
                {loading ? (
                  <>
                    <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="mr-2" />
                    Optimize Ediliyor...
                  </>
                ) : (
                  'Mesajı Optimize Et'
                )}
              </Button>
              
              {error && (
                <div className="text-danger mt-3">{error}</div>
              )}
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6}>
          <Card className="mb-4 shadow-sm">
            <Card.Body>
              <Card.Title>Optimizasyon Sonuçları</Card.Title>
              
              {!optimizedMessage && !loading ? (
                <div className="text-center py-5 text-muted">
                  <p>Henüz bir optimizasyon sonucu yok</p>
                </div>
              ) : loading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" />
                  <p className="mt-3">AI modeliyle mesajınız optimize ediliyor...</p>
                </div>
              ) : (
                <>
                  <div className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span>Güven Puanı</span>
                      <Badge bg={getConfidenceColor()}>{Math.round(confidence * 100)}%</Badge>
                    </div>
                    <ProgressBar 
                      variant={getConfidenceColor()} 
                      now={confidence * 100} 
                      className="mb-2"
                    />
                  </div>
                
                  <div className="mb-4 p-3 bg-light rounded">
                    <h5 className="mb-2">Optimize Edilmiş Mesaj</h5>
                    <p style={{ whiteSpace: 'pre-line' }}>{optimizedMessage}</p>
                  </div>
                  
                  {recommendations.length > 0 && (
                    <div className="mb-4">
                      <h5 className="mb-2">Önerilen İyileştirmeler</h5>
                      <ul className="list-group">
                        {recommendations.map((rec, index) => (
                          <li key={index} className="list-group-item">
                            <Badge bg="info" className="me-2">{rec.type}</Badge>
                            {rec.message}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  <div className="d-flex gap-2">
                    <Button 
                      variant="success" 
                      onClick={useOptimizedMessage}
                    >
                      Bu Versiyonu Kullan
                    </Button>
                    <Button 
                      variant="secondary" 
                      onClick={resetOptimization}
                    >
                      Temizle
                    </Button>
                  </div>
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {optimizedMessage && predictions && (
        <Card className="shadow-sm">
          <Card.Body>
            <Card.Title>Performans Tahminleri</Card.Title>
            
            <Row className="mt-3">
              <Col md={4}>
                <Card className="text-center bg-light">
                  <Card.Body>
                    <h5>Tahmini Etkileşim</h5>
                    <div className="h4 text-primary">%{Math.round(predictions.engagement_rate * 100)}</div>
                    <Card.Text className="text-muted">Önceki: %65</Card.Text>
                  </Card.Body>
                </Card>
              </Col>
              
              <Col md={4}>
                <Card className="text-center bg-light">
                  <Card.Body>
                    <h5>Görünürlük Tahmini</h5>
                    <div className="h4 text-primary">%{Math.round(predictions.visibility_score * 100)}</div>
                    <Card.Text className="text-muted">Önceki: %70</Card.Text>
                  </Card.Body>
                </Card>
              </Col>
              
              <Col md={4}>
                <Card className="text-center bg-light">
                  <Card.Body>
                    <h5>İçerik Kalitesi</h5>
                    <div className="h4 text-primary">{predictions.quality_rating}</div>
                    <Card.Text className="text-muted">Önceki: Orta</Card.Text>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      )}
    </div>
  );
};

export default ContentOptimizationPage; 