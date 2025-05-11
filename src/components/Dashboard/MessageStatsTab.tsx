import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Table, Spinner } from 'react-bootstrap';
import { Pie, Line, Bar } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  ArcElement, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement,
  Title, 
  Tooltip, 
  Legend,
  Filler
} from 'chart.js';
import { dashboardService } from '../../services/dashboardService';
import { ScheduledStats } from '../../types/dashboard';

// ChartJS bileşenlerini kaydet
ChartJS.register(
  ArcElement, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement,
  Title, 
  Tooltip, 
  Legend,
  Filler
);

const MessageStatsTab: React.FC = () => {
  const [stats, setStats] = useState<ScheduledStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMessageStats = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await dashboardService.getScheduledStats();
      setStats(data);
    } catch (err) {
      setError('Mesaj istatistikleri yüklenemedi. Lütfen tekrar deneyin.');
      console.error('Mesaj istatistikleri yükleme hatası:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessageStats();
  }, []);

  // Başarı/Hata pasta grafiği
  const successRateData = {
    labels: ['Başarılı', 'Başarısız'],
    datasets: [
      {
        data: [stats?.successCount || 0, stats?.failureCount || 0],
        backgroundColor: ['rgba(75, 192, 192, 0.6)', 'rgba(255, 99, 132, 0.6)'],
        borderColor: ['rgba(75, 192, 192, 1)', 'rgba(255, 99, 132, 1)'],
        borderWidth: 1,
      },
    ],
  };

  // Saat bazlı gönderim çizgi grafiği
  const hourlyData = {
    labels: stats?.byHour.map(hour => `${hour.hour}:00`) || [],
    datasets: [
      {
        label: 'Mesaj Sayısı',
        data: stats?.byHour.map(hour => hour.count) || [],
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
        tension: 0.3,
      },
      {
        label: 'Başarı Oranı (%)',
        data: stats?.byHour.map(hour => hour.successRate) || [],
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        borderDash: [5, 5],
        tension: 0.3,
        yAxisID: 'y1',
      },
    ],
  };

  const hourlyOptions = {
    responsive: true,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      title: {
        display: true,
        text: 'Saat Bazında Gönderim ve Başarı Oranı',
      },
    },
    scales: {
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Mesaj Sayısı'
        }
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        grid: {
          drawOnChartArea: false,
        },
        min: 0,
        max: 100,
        title: {
          display: true,
          text: 'Başarı Oranı (%)'
        }
      },
    },
  };

  // Şablon performans grafiği
  const templateData = {
    labels: stats?.byTemplate.map(tpl => tpl.templateName) || [],
    datasets: [
      {
        label: 'Mesaj Sayısı',
        data: stats?.byTemplate.map(tpl => tpl.count) || [],
        backgroundColor: 'rgba(255, 159, 64, 0.5)',
        borderColor: 'rgb(255, 159, 64)',
        borderWidth: 1
      },
      {
        label: 'Başarı Oranı (%)',
        data: stats?.byTemplate.map(tpl => tpl.successRate) || [],
        backgroundColor: 'rgba(153, 102, 255, 0.5)',
        borderColor: 'rgb(153, 102, 255)',
        borderWidth: 1
      }
    ]
  };

  const templateOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Şablon Performans Analizi'
      },
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  return (
    <div className="py-4">
      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" />
          <p className="mt-2">Mesaj istatistikleri yükleniyor...</p>
        </div>
      ) : error ? (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      ) : (
        <>
          {/* Özet Bilgisi */}
          <Row className="mb-4">
            <Col md={3}>
              <Card className="h-100">
                <Card.Body className="d-flex flex-column">
                  <Card.Title className="text-muted fs-6">Toplam Zamanlanmış</Card.Title>
                  <div className="d-flex flex-grow-1 align-items-center justify-content-center">
                    <span className="display-4">{stats?.totalScheduled || 0}</span>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="h-100">
                <Card.Body className="d-flex flex-column">
                  <Card.Title className="text-muted fs-6">Başarılı Mesajlar</Card.Title>
                  <div className="d-flex flex-grow-1 align-items-center justify-content-center">
                    <span className="display-4 text-success">{stats?.successCount || 0}</span>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="h-100">
                <Card.Body className="d-flex flex-column">
                  <Card.Title className="text-muted fs-6">Başarısız Mesajlar</Card.Title>
                  <div className="d-flex flex-grow-1 align-items-center justify-content-center">
                    <span className="display-4 text-danger">{stats?.failureCount || 0}</span>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="h-100">
                <Card.Body className="d-flex flex-column">
                  <Card.Title className="text-muted fs-6">Başarı Oranı</Card.Title>
                  <div className="d-flex flex-grow-1 align-items-center justify-content-center">
                    <span className="display-4">
                      {stats && stats.totalScheduled > 0
                        ? `%${((stats.successCount / stats.totalScheduled) * 100).toFixed(1)}`
                        : '%0'}
                    </span>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Başarı/Hata ve Saatlik Grafikleri */}
          <Row className="mb-4">
            <Col md={4}>
              <Card className="h-100">
                <Card.Body>
                  <Card.Title>Başarı/Hata Oranı</Card.Title>
                  <div className="d-flex justify-content-center align-items-center h-100" style={{ minHeight: '250px' }}>
                    <Pie data={successRateData} />
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={8}>
              <Card className="h-100">
                <Card.Body>
                  <Card.Title>Saat Bazında Dağılım</Card.Title>
                  <div style={{ height: '250px' }}>
                    <Line options={hourlyOptions} data={hourlyData} />
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Şablon Performans ve Grup Analizi */}
          <Row className="mb-4">
            <Col md={12}>
              <Card>
                <Card.Body>
                  <Card.Title>Şablon Performans Analizi</Card.Title>
                  <div style={{ height: '300px' }}>
                    <Bar options={templateOptions} data={templateData} />
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Grup Başarı Tablosu */}
          <Card>
            <Card.Body>
              <Card.Title>Grup Başarı Oranları</Card.Title>
              <div className="table-responsive mt-3">
                <Table hover>
                  <thead>
                    <tr>
                      <th>Grup Adı</th>
                      <th>Mesaj Sayısı</th>
                      <th>Başarı Oranı</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats?.byGroup.map(group => (
                      <tr key={group.groupId}>
                        <td>{group.groupName}</td>
                        <td>{group.count}</td>
                        <td>
                          <div className="d-flex align-items-center">
                            <div className="flex-grow-1 me-2">
                              <div className="progress" style={{ height: '8px' }}>
                                <div 
                                  className="progress-bar bg-success" 
                                  role="progressbar" 
                                  style={{ width: `${group.successRate}%` }}
                                  aria-valuenow={group.successRate}
                                  aria-valuemin={0}
                                  aria-valuemax={100}
                                ></div>
                              </div>
                            </div>
                            <span>{group.successRate}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        </>
      )}
    </div>
  );
};

export default MessageStatsTab; 