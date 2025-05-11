import React, { useEffect, useState } from 'react';
import { Card, Table, Spinner, Badge } from 'react-bootstrap';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { dashboardService } from '../../services/dashboardService';
import { OptimalInterval } from '../../types/dashboard';

// ChartJS bileşenlerini kaydet
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const OptimalIntervalsTab: React.FC = () => {
  const [intervals, setIntervals] = useState<OptimalInterval[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOptimalIntervals = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await dashboardService.getOptimalIntervals();
      setIntervals(data);
    } catch (err) {
      setError('Optimal aralık verileri yüklenemedi. Lütfen tekrar deneyin.');
      console.error('Optimal aralık verileri yükleme hatası:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOptimalIntervals();
  }, []);

  // Güven derecesi rengi belirleme
  const getConfidenceColor = (score: number) => {
    if (score >= 0.7) return 'success';
    if (score >= 0.4) return 'warning';
    return 'danger';
  };

  // Bar grafik verileri
  const chartData = {
    labels: intervals.map(interval => interval.groupName),
    datasets: [
      {
        label: 'Optimal Gönderim Aralığı (dakika)',
        data: intervals.map(interval => interval.optimalInterval),
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
        borderColor: 'rgba(53, 162, 235, 1)',
        borderWidth: 1
      },
      {
        label: 'Ortalama Yanıt Oranı (%)',
        data: intervals.map(interval => interval.averageResponseRate * 100),
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Grup Bazlı Optimal Gönderim Aralıkları'
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Değer'
        }
      }
    }
  };

  return (
    <div className="py-4">
      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" />
          <p className="mt-2">Optimal aralık verileri yükleniyor...</p>
        </div>
      ) : error ? (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      ) : (
        <>
          <Card className="mb-4">
            <Card.Body>
              <Card.Title>Grup Bazlı Optimal Gönderim Aralıkları</Card.Title>
              <div className="my-4" style={{ height: '400px' }}>
                <Bar data={chartData} options={chartOptions} />
              </div>
            </Card.Body>
          </Card>

          <Card>
            <Card.Body>
              <Card.Title>Optimal Aralık Tablosu</Card.Title>
              <div className="table-responsive mt-3">
                <Table hover>
                  <thead>
                    <tr>
                      <th>Grup Adı</th>
                      <th>Optimal Aralık (dk)</th>
                      <th>Yanıt Oranı (%)</th>
                      <th>Güven Derecesi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {intervals.map(interval => (
                      <tr key={interval.groupId}>
                        <td>{interval.groupName}</td>
                        <td>{interval.optimalInterval}</td>
                        <td>{(interval.averageResponseRate * 100).toFixed(1)}%</td>
                        <td>
                          <Badge 
                            bg={getConfidenceColor(interval.confidenceScore)}
                          >
                            {(interval.confidenceScore * 100).toFixed(0)}%
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
              <div className="mt-3">
                <p className="text-muted small">
                  <strong>Güven Derecesi:</strong> Yeşil = Yüksek güven (%70+), Sarı = Orta güven (%40-70), Kırmızı = Düşük güven (0-40%)
                </p>
              </div>
            </Card.Body>
          </Card>
        </>
      )}
    </div>
  );
};

export default OptimalIntervalsTab; 