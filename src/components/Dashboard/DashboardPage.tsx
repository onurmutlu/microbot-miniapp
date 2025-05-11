import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button, Spinner, Badge } from 'react-bootstrap';
import { FaSync, FaChartLine, FaUsers, FaFileAlt, FaClock } from 'react-icons/fa';
import { dashboardService } from '../../services/dashboardService';
import { DashboardStatistics } from '../../types/dashboard';
import DashboardTabs from './DashboardTabs';

const DashboardPage: React.FC = () => {
  const [statistics, setStatistics] = useState<DashboardStatistics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const stats = await dashboardService.getStatistics();
      setStatistics(stats);
      setLastRefresh(new Date());
    } catch (err) {
      setError('Dashboard verileri yüklenemedi. Lütfen tekrar deneyin.');
      console.error('Dashboard veri yükleme hatası:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    
    // 30 saniyede bir otomatik yenileme
    const refreshInterval = setInterval(() => {
      fetchDashboardData();
    }, 30000);
    
    return () => clearInterval(refreshInterval);
  }, []);

  return (
    <Container fluid className="p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 mb-0">MicroBot Dashboard</h1>
        <div>
          <Button 
            variant="outline-primary" 
            onClick={fetchDashboardData} 
            disabled={loading}
          >
            {loading ? (
              <>
                <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                Yükleniyor...
              </>
            ) : (
              <>
                <FaSync className="me-2" /> Yenile
              </>
            )}
          </Button>
          <small className="text-muted ms-3">
            Son güncelleme: {lastRefresh.toLocaleTimeString()}
          </small>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {/* Özet Kartları */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="h-100">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <Card.Title className="text-muted fs-6">Son 24 Saat Mesaj</Card.Title>
                  <Card.Text className="fs-3 fw-bold">
                    {loading ? <Spinner animation="border" size="sm" /> : statistics?.last24hMessages || 0}
                  </Card.Text>
                </div>
                <div className="rounded-circle bg-light p-3">
                  <FaChartLine className="text-primary" size={24} />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="h-100">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <Card.Title className="text-muted fs-6">Başarı Oranı</Card.Title>
                  <Card.Text className="fs-3 fw-bold">
                    {loading ? (
                      <Spinner animation="border" size="sm" />
                    ) : (
                      `%${(statistics?.successRate || 0).toFixed(1)}`
                    )}
                  </Card.Text>
                </div>
                <div className="rounded-circle bg-light p-3">
                  <FaChartLine className="text-success" size={24} />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="h-100">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <Card.Title className="text-muted fs-6">Aktif Gruplar</Card.Title>
                  <Card.Text className="fs-3 fw-bold">
                    {loading ? <Spinner animation="border" size="sm" /> : statistics?.activeGroupCount || 0}
                  </Card.Text>
                </div>
                <div className="rounded-circle bg-light p-3">
                  <FaUsers className="text-info" size={24} />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="h-100">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <Card.Title className="text-muted fs-6">Aktif Şablonlar</Card.Title>
                  <Card.Text className="fs-3 fw-bold">
                    {loading ? <Spinner animation="border" size="sm" /> : statistics?.activeTemplateCount || 0}
                  </Card.Text>
                </div>
                <div className="rounded-circle bg-light p-3">
                  <FaFileAlt className="text-warning" size={24} />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Zamanlayıcı Durum Kartı */}
      <Row className="mb-4">
        <Col md={12}>
          <Card>
            <Card.Body>
              <div className="d-flex align-items-center">
                <FaClock className="text-primary me-2" size={24} />
                <Card.Title className="mb-0">Zamanlayıcı Durumu</Card.Title>
              </div>
              <hr />
              {loading ? (
                <div className="text-center py-3">
                  <Spinner animation="border" />
                </div>
              ) : (
                <Row>
                  <Col md={4}>
                    <div className="d-flex align-items-center">
                      <Badge bg={statistics?.schedulerStatus.isActive ? 'success' : 'danger'} className="me-2 p-2">
                        {statistics?.schedulerStatus.isActive ? 'Aktif' : 'Pasif'}
                      </Badge>
                      <span className="fs-5">Zamanlayıcı Durumu</span>
                    </div>
                  </Col>
                  <Col md={4}>
                    <div className="d-flex flex-column">
                      <small className="text-muted">Sonraki Zamanlanmış Gönderim</small>
                      <span>
                        {statistics?.schedulerStatus.nextScheduledTime ? 
                          new Date(statistics.schedulerStatus.nextScheduledTime).toLocaleString() : 
                          'Planlanan gönderim yok'}
                      </span>
                    </div>
                  </Col>
                  <Col md={4}>
                    <div className="d-flex flex-column">
                      <small className="text-muted">Bekleyen Mesajlar</small>
                      <span>{statistics?.schedulerStatus.pendingMessages || 0}</span>
                    </div>
                  </Col>
                </Row>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Sekme Yapısı */}
      <DashboardTabs />
    </Container>
  );
};

export default DashboardPage; 