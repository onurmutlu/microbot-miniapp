import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Table, Button, Modal, Spinner } from 'react-bootstrap';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { dashboardService } from '../../services/dashboardService';
import { GroupActivity, GroupInfo } from '../../types/dashboard';

// ChartJS bileşenlerini kaydet
ChartJS.register(ArcElement, Tooltip, Legend);

// Rastgele renk paleti oluşturma
const generateColors = (count: number) => {
  const colors = [];
  for (let i = 0; i < count; i++) {
    colors.push(`hsla(${Math.random() * 360}, 70%, 60%, 0.8)`);
  }
  return colors;
};

const GroupActivityTab: React.FC = () => {
  const [groupActivity, setGroupActivity] = useState<GroupActivity | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [selectedGroup, setSelectedGroup] = useState<GroupInfo | null>(null);

  const fetchGroupActivity = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await dashboardService.getGroupActivity();
      setGroupActivity(data);
    } catch (err) {
      setError('Grup aktivite verileri yüklenemedi. Lütfen tekrar deneyin.');
      console.error('Grup aktivite verileri yükleme hatası:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroupActivity();
  }, []);

  const handleShowDetails = (group: GroupInfo) => {
    setSelectedGroup(group);
    setShowModal(true);
  };

  // Pasta grafik verileri
  const pieChartData = {
    labels: groupActivity?.categories.map(cat => cat.name) || [],
    datasets: [
      {
        data: groupActivity?.categories.map(cat => cat.count) || [],
        backgroundColor: generateColors(groupActivity?.categories.length || 0),
        borderWidth: 1,
      },
    ],
  };

  const pieChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right' as const,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.raw || 0;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = Math.round((value / total) * 100);
            return `${label}: ${value} (%${percentage})`;
          }
        }
      }
    },
  };

  return (
    <div className="py-4">
      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" />
          <p className="mt-2">Grup aktivite verileri yükleniyor...</p>
        </div>
      ) : error ? (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      ) : (
        <>
          <Row>
            {/* Kategori Pasta Grafiği */}
            <Col md={5}>
              <Card className="h-100">
                <Card.Body>
                  <Card.Title>Grup Kategorileri</Card.Title>
                  <div className="mt-3" style={{ height: '300px' }}>
                    <Pie data={pieChartData} options={pieChartOptions} />
                  </div>
                </Card.Body>
              </Card>
            </Col>

            {/* Grup Listesi */}
            <Col md={7}>
              <Card>
                <Card.Body>
                  <Card.Title>Gruplar</Card.Title>
                  <div className="table-responsive mt-3">
                    <Table hover>
                      <thead>
                        <tr>
                          <th>Grup Adı</th>
                          <th>Kategori</th>
                          <th>Üye Sayısı</th>
                          <th>Başarı Oranı</th>
                          <th>İşlemler</th>
                        </tr>
                      </thead>
                      <tbody>
                        {groupActivity?.groups.map(group => (
                          <tr key={group.id}>
                            <td>{group.name}</td>
                            <td>{group.category}</td>
                            <td>{group.memberCount}</td>
                            <td>{group.successRate}%</td>
                            <td>
                              <Button 
                                size="sm" 
                                variant="outline-info"
                                onClick={() => handleShowDetails(group)}
                              >
                                Detaylar
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Grup Detay Modalı */}
          <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
            <Modal.Header closeButton>
              <Modal.Title>{selectedGroup?.name}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {selectedGroup && (
                <Row>
                  <Col md={6}>
                    <h5>Grup Bilgileri</h5>
                    <hr />
                    <p><strong>ID:</strong> {selectedGroup.id}</p>
                    <p><strong>Kategori:</strong> {selectedGroup.category}</p>
                    <p><strong>Üye Sayısı:</strong> {selectedGroup.memberCount}</p>
                    <p><strong>Son 24 Saatteki Mesajlar:</strong> {selectedGroup.messagesLast24h}</p>
                    <p><strong>Başarı Oranı:</strong> {selectedGroup.successRate}%</p>
                    <p><strong>Son Aktivite:</strong> {new Date(selectedGroup.lastActivity).toLocaleString()}</p>
                  </Col>
                  <Col md={6}>
                    <h5>Aktivite Grafiği</h5>
                    <hr />
                    <div className="text-center p-5">
                      <p className="text-muted">
                        Aktivite saatleri grafiği henüz uygulanmadı.
                      </p>
                    </div>
                  </Col>
                </Row>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowModal(false)}>
                Kapat
              </Button>
            </Modal.Footer>
          </Modal>
        </>
      )}
    </div>
  );
};

export default GroupActivityTab; 