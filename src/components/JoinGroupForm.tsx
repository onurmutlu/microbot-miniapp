import React, { useState } from 'react';
import { useSession } from '../context/SessionContext';
import { toast } from 'react-toastify';
import GlassCard from './ui/GlassCard';
import Spinner from './ui/Spinner';
import { joinGroup } from '../utils/api';

const JoinGroupForm: React.FC = () => {
  const [groupLink, setGroupLink] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { sessionId } = useSession();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionId) {
      toast.error('Lütfen önce bir Telegram hesabı seçin');
      return;
    }

    setIsLoading(true);
    try {
      await joinGroup(sessionId, groupLink);
      toast.success('Gruba başarıyla katıldınız');
      setGroupLink('');
    } catch (error) {
      toast.error('Gruba katılırken bir hata oluştu');
      console.error('Grup katılma hatası:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <GlassCard className="p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="groupLink" className="block text-sm font-medium mb-2">
            Grup Linki
          </label>
          <input
            type="text"
            id="groupLink"
            value={groupLink}
            onChange={(e) => setGroupLink(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://t.me/groupname"
            required
          />
        </div>
        <button
          type="submit"
          disabled={isLoading || !sessionId}
          className="w-full py-2 px-4 rounded-lg bg-blue-500 text-white font-medium hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? <Spinner size="sm" /> : 'Gruba Katıl'}
        </button>
      </form>
    </GlassCard>
  );
};

export default JoinGroupForm; 