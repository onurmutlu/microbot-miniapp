import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  TrashIcon, 
  ArrowPathIcon,
  PlusCircleIcon,
  ShieldCheckIcon,
  ArrowLeftOnRectangleIcon,
} from '@heroicons/react/24/outline';
import { License, licenseService } from '../services/licenseService';
import { adminService, AdminRole } from '../services/adminService';

const AdminLicenses: React.FC = () => {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [adminRole, setAdminRole] = useState<AdminRole | null>(null);
  const [newLicense, setNewLicense] = useState({
    type: 'TRIAL',
    validityDays: 7
  });
  
  const navigate = useNavigate();

  useEffect(() => {
    // Admin girişi ve rol kontrolü
    if (!adminService.isLoggedIn()) {
      navigate('/admin-login');
      return;
    }
    
    setAdminRole(adminService.getRole());
    fetchLicenses();
  }, [navigate]);

  const fetchLicenses = async () => {
    try {
      setIsLoading(true);
      
      // Root admin için fake lisans verisi gösterelim (Backend bağlantısı olmadığı durumda)
      if (adminService.getRole() === 'root') {
        // Geçici lisans verileri (gerçek projede API'den çekilmelidir)
        const demoLicenses: License[] = [
          {
            id: '1',
            key: 'TRIAL-1234-ABCD',
            type: 'TRIAL',
            expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            isActive: true,
            createdAt: new Date().toISOString(),
            usedBy: null
          },
          {
            id: '2',
            key: 'PRO-5678-EFGH',
            type: 'PRO',
            expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            isActive: true,
            createdAt: new Date().toISOString(),
            usedBy: 'user@example.com'
          }
        ];
        
        setLicenses(demoLicenses);
      } else {
        // Normal admin için API üzerinden lisansları çek
        const licenses = await licenseService.getAdminLicenses();
        setLicenses(licenses);
      }
    } catch (error) {
      console.error('Lisanslar alınamadı:', error);
      toast.error('Lisanslar yüklenirken bir hata oluştu');
      
      // Yetkisiz erişim durumunda login sayfasına yönlendir
      if ((error as any).response?.status === 401) {
        adminService.logout();
        navigate('/admin-login');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateLicense = async () => {
    try {
      setIsCreating(true);
      
      // Root admin için fake lisans oluşturalım
      if (adminService.getRole() === 'root') {
        // Rastgele bir lisans anahtarı oluştur
        const generateKey = () => {
          const prefix = newLicense.type;
          const randomChars = Math.random().toString(36).substring(2, 8).toUpperCase();
          return `${prefix}-${randomChars}`;
        };
        
        const newLicenseData: License = {
          id: Date.now().toString(),
          key: generateKey(),
          type: newLicense.type as 'TRIAL' | 'PRO' | 'VIP',
          expiryDate: new Date(Date.now() + newLicense.validityDays * 24 * 60 * 60 * 1000).toISOString(),
          isActive: true,
          createdAt: new Date().toISOString(),
          usedBy: null
        };
        
        // Lisans listesine ekle
        setLicenses(prev => [newLicenseData, ...prev]);
        
        toast.success('Lisans oluşturuldu');
      } else {
        // Normal admin için API üzerinden lisans oluştur
        const newLicenseData = await licenseService.createLicense(
          newLicense.type as 'TRIAL' | 'PRO' | 'VIP',
          newLicense.validityDays
        );
        
        if (newLicenseData) {
          setLicenses(prev => [newLicenseData, ...prev]);
          toast.success('Lisans oluşturuldu');
        }
      }
      
      // Form alanını sıfırla
      setNewLicense({
        type: 'TRIAL',
        validityDays: 7
      });
    } catch (error) {
      console.error('Lisans oluşturulamadı:', error);
      toast.error('Lisans oluşturulurken bir hata oluştu');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteLicense = async (id: string) => {
    if (!window.confirm('Bu lisansı silmek istediğinizden emin misiniz?')) {
      return;
    }
    
    try {
      setIsDeletingId(id);
      
      // Root admin için fake silme işlemi
      if (adminService.getRole() === 'root') {
        // Lisans listesinden kaldır
        setLicenses(prev => prev.filter(license => license.id !== id));
        toast.success('Lisans silindi');
      } else {
        // Normal admin için API üzerinden lisans sil
        const success = await licenseService.deleteLicense(id);
        
        if (success) {
          setLicenses(prev => prev.filter(license => license.id !== id));
          toast.success('Lisans silindi');
        }
      }
    } catch (error) {
      console.error('Lisans silinemedi:', error);
      toast.error('Lisans silinirken bir hata oluştu');
    } finally {
      setIsDeletingId(null);
    }
  };

  const handleLogout = () => {
    adminService.logout();
    toast.info('Admin oturumu kapatıldı');
    navigate('/admin-login');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center">
            <ShieldCheckIcon className="h-8 w-8 text-purple-500 mr-3" />
            <div>
              <h1 className="text-2xl font-bold">Admin Paneli</h1>
              {adminRole && (
                <p className="text-sm text-gray-400">
                  Rol: {adminRole === 'root' ? 'Root Admin' : 
                      adminRole === 'superadmin' ? 'Süper Admin' : 'Admin'}
                </p>
              )}
            </div>
          </div>
          
          <button 
            onClick={handleLogout}
            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            <ArrowLeftOnRectangleIcon className="h-5 w-5 mr-2" />
            Çıkış Yap
          </button>
        </div>
        
        {/* Lisans Oluştur */}
        <div className="bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Yeni Lisans Oluştur</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Lisans Tipi
              </label>
              <select
                value={newLicense.type}
                onChange={(e) => setNewLicense({ ...newLicense, type: e.target.value as 'TRIAL' | 'PRO' | 'VIP' })}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="TRIAL">TRIAL</option>
                <option value="PRO">PRO</option>
                <option value="VIP">VIP</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Geçerlilik (gün)
              </label>
              <input
                type="number"
                min="1"
                max="365"
                value={newLicense.validityDays}
                onChange={(e) => setNewLicense({ ...newLicense, validityDays: parseInt(e.target.value) })}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            
            <div className="flex items-end">
              <button
                onClick={handleCreateLicense}
                disabled={isCreating}
                className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium rounded-md shadow-sm transition-colors flex items-center justify-center"
              >
                {isCreating ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Oluşturuluyor...
                  </>
                ) : (
                  <>
                    <PlusCircleIcon className="h-5 w-5 mr-2" />
                    Lisans Oluştur
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
        
        {/* Lisans Listesi */}
        <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          <div className="p-4 bg-gray-700 border-b border-gray-600 flex justify-between items-center">
            <h2 className="text-xl font-semibold">Mevcut Lisanslar</h2>
            
            <button
              onClick={fetchLicenses}
              disabled={isLoading}
              className="flex items-center text-sm text-gray-300 hover:text-white"
            >
              <ArrowPathIcon className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
              Yenile
            </button>
          </div>
          
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500 mr-2"></div>
              <span className="text-gray-400">Lisanslar yükleniyor...</span>
            </div>
          ) : licenses.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              Henüz lisans bulunmuyor. Yeni bir lisans oluşturun.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Lisans Anahtarı
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Tip
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Son Geçerlilik
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Durum
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Kullanıcı
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                      İşlem
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {licenses.map((license) => (
                    <tr key={license.id} className="hover:bg-gray-750">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-mono text-sm">{license.key}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                          ${license.type === 'TRIAL' ? 'bg-gray-600 text-gray-100' : 
                            license.type === 'PRO' ? 'bg-blue-600 text-blue-100' : 
                            'bg-purple-600 text-purple-100'}`}
                        >
                          {license.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {formatDate(license.expiryDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {license.isActive ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-600 text-green-100">
                            Aktif
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-600 text-red-100">
                            Pasif
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {license.usedBy || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleDeleteLicense(license.id)}
                          disabled={isDeletingId === license.id}
                          className="text-red-400 hover:text-red-300"
                        >
                          {isDeletingId === license.id ? (
                            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          ) : (
                            <TrashIcon className="h-5 w-5" />
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminLicenses; 