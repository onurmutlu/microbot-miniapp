import React, { useEffect, useState } from 'react';
import { Card, Table, Button, Spinner, Badge, Alert } from 'react-bootstrap';
import { dashboardService } from '../../services/dashboardService';
import { CooledGroup } from '../../types/dashboard';

const CooledGroupsTab: React.FC = () => {
  const [cooledGroups, setCooledGroups] = useState<CooledGroup[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);
  const [resetLoading, setResetLoading] = useState<string | null>(null);

  const fetchCooledGroups = async () => {
    setLoading(true);
    setError(null);
    setResetSuccess(null);
    
    try {
      const data = await dashboardService.getCooledGroups();
      setCooledGroups(data);
    } catch (err) {
      setError('Soğutma grupları yüklenemedi. Lütfen tekrar deneyin.');
      console.error('Soğutma grupları yükleme hatası:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCooledGroups();
    
    // 30 saniyede bir otomatik yenileme
    const refreshInterval = setInterval(() => {
      fetchCooledGroups();
    }, 30000);
    
    return () => clearInterval(refreshInterval);
  }, []);

  const handleResetCooldown = async (groupId: string, groupName: string) => {
    setResetLoading(groupId);
    setResetSuccess(null);
    
    try {
      await dashboardService.resetCooldown(groupId);
      setResetSuccess(`"${groupName}" grubunun soğutma süresi başarıyla sıfırlandı.`);
      
      // Yeni listeyi yükle
      fetchCooledGroups();
    } catch (err) {
      setError(`"${groupName}" grubunun soğutma süresi sıfırlanamadı. Lütfen tekrar deneyin.`);
      console.error('Soğutma sıfırlama hatası:', err);
    } finally {
      setResetLoading(null);
    }
  };

  // Kalan süreyi hesaplama
  const getRemainingTime = (cooldownUntil: string) => {
    const cooldownDate = new Date(cooldownUntil);
    const now = new Date();
    
    if (cooldownDate <= now) {
      return 'Sona erdi';
    }
    
    const diffMs = cooldownDate.getTime() - now.getTime();
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${diffHrs}s ${diffMins}dk`;
  };

  return (
    <div className="py-4">
      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" />
          <p className="mt-2">Soğutma grupları yükleniyor...</p>
        </div>
      ) : (
        <>
          {error && (
            <Alert variant="danger" className="mb-4" onClose={() => setError(null)} dismissible>
              {error}
            </Alert>
          )}
          
          {resetSuccess && (
            <Alert variant="success" className="mb-4" onClose={() => setResetSuccess(null)} dismissible>
              {resetSuccess}
            </Alert>
          )}
          
          <Card>
            <Card.Body>
              <Card.Title>Soğutma Modundaki Gruplar</Card.Title>
              {cooledGroups.length === 0 ? (
                <div className="text-center py-5">
                  <p className="text-muted">Soğutma modunda grup bulunmamaktadır.</p>
                </div>
              ) : (
                <div className="table-responsive mt-3">
                  <Table hover>
                    <thead>
                      <tr>
                        <th>Grup Adı</th>
                        <th>Soğutma Nedeni</th>
                        <th>Başarısız Denemeler</th>
                        <th>Bitiş Zamanı</th>
                        <th>Kalan Süre</th>
                        <th>İşlemler</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cooledGroups.map(group => (
                        <tr key={group.id}>
                          <td>{group.name}</td>
                          <td>{group.cooldownReason}</td>
                          <td>
                            <Badge 
                              bg={group.failedAttempts > 5 ? 'danger' : 'warning'}
                            >
                              {group.failedAttempts}
                            </Badge>
                          </td>
                          <td>{new Date(group.cooldownUntil).toLocaleString()}</td>
                          <td>{getRemainingTime(group.cooldownUntil)}</td>
                          <td>
                            <Button 
                              size="sm" 
                              variant="outline-danger"
                              onClick={() => handleResetCooldown(group.id, group.name)}
                              disabled={resetLoading === group.id}
                            >
                              {resetLoading === group.id ? (
                                <>
                                  <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-1" />
                                  Sıfırlanıyor...
                                </>
                              ) : (
                                'Soğutmayı Sıfırla'
                              )}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
              <div className="mt-3">
                <p className="text-muted small">
                  <strong>Not:</strong> Soğutma süresini sıfırlamak, gruba hemen mesaj gönderilmesine izin verir. Bu işlemi sadece gerekli durumlarda kullanın.
                </p>
              </div>
            </Card.Body>
          </Card>
        </>
      )}
    </div>
  );
};

export default CooledGroupsTab; 