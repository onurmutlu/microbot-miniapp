import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { User, Users, Clock, Zap, MessageSquare } from 'lucide-react';

interface Stats {
  remainingDays: number;
  invitedUsers: number;
  activeTasks: number;
  totalMessages: number;
}

const UserPanel: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [stats, setStats] = React.useState<Stats>({
    remainingDays: 0,
    invitedUsers: 0,
    activeTasks: 0,
    totalMessages: 0
  });

  React.useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/stats');
        setStats(response.data);
      } catch (error) {
        console.error('Stats fetch error:', error);
      }
    };

    if (user) {
      fetchStats();
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="card animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="card">
      <div className="flex items-center gap-4">
        {user.photo_url ? (
          <img 
            src={user.photo_url} 
            alt={user.username || user.first_name} 
            className="w-16 h-16 rounded-full"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center">
            <User className="w-8 h-8 text-white" />
          </div>
        )}
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {user.first_name} {user.last_name}
          </h2>
          {user.username && (
            <p className="text-gray-600 dark:text-gray-300">@{user.username}</p>
          )}
        </div>
      </div>
      
      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="bg-primary/10 dark:bg-primary/20 p-4 rounded-lg">
          <div className="flex items-center gap-2 text-primary">
            <Clock className="w-5 h-5" />
            <p className="text-sm">Kalan Gün</p>
          </div>
          <p className="text-2xl font-bold mt-1">{stats.remainingDays}</p>
        </div>
        
        <div className="bg-secondary/10 dark:bg-secondary/20 p-4 rounded-lg">
          <div className="flex items-center gap-2 text-secondary">
            <Users className="w-5 h-5" />
            <p className="text-sm">Davet Edilen</p>
          </div>
          <p className="text-2xl font-bold mt-1">{stats.invitedUsers}</p>
        </div>
        
        <div className="bg-accent/10 dark:bg-accent/20 p-4 rounded-lg">
          <div className="flex items-center gap-2 text-accent">
            <Zap className="w-5 h-5" />
            <p className="text-sm">Aktif Görev</p>
          </div>
          <p className="text-2xl font-bold mt-1">{stats.activeTasks}</p>
        </div>
        
        <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
            <MessageSquare className="w-5 h-5" />
            <p className="text-sm">Toplam Mesaj</p>
          </div>
          <p className="text-2xl font-bold mt-1">{stats.totalMessages}</p>
        </div>
      </div>
    </div>
  );
};

export default UserPanel; 