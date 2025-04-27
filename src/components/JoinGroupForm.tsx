import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import GlassCard from './ui/GlassCard';
import Spinner from './ui/Spinner';
import { useSession } from '../context/SessionContext';

const JoinGroupForm: React.FC = () => {
  const [groupLink, setGroupLink] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { sessionId } = useSession();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGroupLink(e.target.value);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!sessionId) {
      toast.error('Lütfen önce bir Telegram hesabı seçin.');
      return;
    }
    
    // Basit doğrulama
    if (!groupLink) {
      setError('Lütfen bir grup bağlantısı girin.');
      return;
    }
    
    // @ ile başlamazsa ekle
    let formattedLink = groupLink;
    if (!formattedLink.startsWith('@')) {
      formattedLink = `@${formattedLink}`;
    }

    setIsLoading(true);

    try {
      const response = await axios.post('/join-group', { 
        session_id: sessionId,
        group_link: formattedLink 
      });
      toast.success('Gruba başarıyla katıldınız!');
      setGroupLink('');
    } catch (error) {
      console.error('Gruba katılma hatası:', error);
      toast.error(
        axios.isAxiosError(error) && error.response?.data?.message
          ? error.response.data.message
          : 'Gruba katılırken bir hata oluştu.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <GlassCard className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-center">
          Telegram Grubuna Katıl
        </h1>

        {!sessionId ? (
          <div className="text-yellow-500 mb-4 p-3 bg-yellow-100/10 rounded-md text-center">
            Lütfen önce bir Telegram hesabı seçin.
          </div>
        ) : null}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label 
              htmlFor="groupLink" 
              className="block text-sm font-medium mb-1"
            >
              Grup Bağlantısı
            </label>
            <input
              id="groupLink"
              type="text"
              value={groupLink}
              onChange={handleInputChange}
              placeholder="@grupadi"
              className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500"
              disabled={isLoading || !sessionId}
            />
            {error && (
              <p className="mt-1 text-sm text-red-600">{error}</p>
            )}
          </div>
          
          <div className="flex justify-center">
            <button
              type="submit"
              disabled={isLoading || !sessionId}
              className="glass-btn px-4 py-2 rounded-lg"
            >
              {isLoading ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Katılınıyor...
                </>
              ) : (
                'Gruba Katıl'
              )}
            </button>
          </div>
        </form>
      </GlassCard>
    </div>
  );
};

export default JoinGroupForm; 