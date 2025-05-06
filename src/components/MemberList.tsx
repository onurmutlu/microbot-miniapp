import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { toast } from 'react-toastify';
import GlassCard from './ui/GlassCard';
import Spinner from './ui/Spinner';
import { useSession } from '../context/SessionContext';
import { listMembers } from '../utils/api';

interface Member {
  user_id: string;
  username: string;
  first_name: string;
  last_name: string;
  status: string;
}

interface MemberListProps {
  groupId: string;
  onSelectionChange: (selectedIds: string[]) => void;
}

type FilterOption = 'all' | 'with-username' | 'online';

const PAGE_SIZE = 50;

const MemberList: React.FC<MemberListProps> = ({ groupId, onSelectionChange }) => {
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [filterOption, setFilterOption] = useState<FilterOption>(() => {
    const savedFilter = localStorage.getItem('memberListFilter');
    return (savedFilter as FilterOption) || 'all';
  });
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const { sessionId } = useSession();
  
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (sessionId && groupId) {
      fetchMembers();
    }
  }, [sessionId, groupId]);

  useEffect(() => {
    localStorage.setItem('memberListFilter', filterOption);
  }, [filterOption]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setDisplayCount(PAGE_SIZE);
  }, [filterOption]);

  const members = useMemo(() => {
    return allMembers.filter(member => {
      if (filterOption === 'with-username') {
        return !!member.username;
      } else if (filterOption === 'online') {
        return member.status === 'active';
      }
      return true;
    });
  }, [allMembers, filterOption]);

  const visibleMembers = useMemo(() => 
    members.slice(0, displayCount)
  , [members, displayCount]);

  const loadMore = useCallback(() => {
    if (displayCount < members.length && !isLoadingMore) {
      setIsLoadingMore(true);
      setTimeout(() => {
        setDisplayCount(prev => Math.min(prev + PAGE_SIZE, members.length));
        setIsLoadingMore(false);
      }, 300);
    }
  }, [displayCount, members.length, isLoadingMore]);

  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    if (loadMoreRef.current) {
      observerRef.current = new IntersectionObserver(
        entries => {
          if (entries[0].isIntersecting) {
            loadMore();
          }
        },
        { threshold: 0.1 }
      );
      
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loadMore]);

  const fetchMembers = async () => {
    if (!sessionId) return;
    
    setIsLoading(true);
    try {
      const response = await listMembers(sessionId, groupId);
      setAllMembers(response.data);
    } catch (error) {
      toast.error('Üyeler yüklenirken bir hata oluştu');
      console.error('Üyeleri getirme hatası:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectMember = (userId: string) => {
    setSelectedMembers(prev => {
      const newSelection = prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId];
      onSelectionChange(newSelection);
      return newSelection;
    });
  };

  const toggleSelectAll = () => {
    const newSelection = selectedMembers.length === visibleMembers.length
      ? []
      : visibleMembers.map(m => m.user_id);
    setSelectedMembers(newSelection);
    onSelectionChange(newSelection);
  };

  const EmptyStateMessage = () => (
    <div className="py-8 px-4 flex flex-col items-center justify-center text-center">
      <div className="rounded-full w-12 h-12 bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mb-3">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">Üye bulunamadı</p>
      <p className="text-gray-400 dark:text-gray-500 text-xs">Yenilemeyi deneyin veya filtreleri değiştirin</p>
    </div>
  );

  if (!sessionId) {
    return (
      <GlassCard className="p-6 text-center">
        <div className="text-yellow-500 py-8">
          Lütfen önce bir Telegram hesabı seçin.
        </div>
      </GlassCard>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Spinner size="xl" />
      </div>
    );
  }

  return (
    <GlassCard className="p-6">
      <div className="mb-4 flex items-center justify-between flex-wrap gap-2">
        <div className="text-sm font-medium">Toplam {members.length} üye</div>
        <div className="relative">
          <select
            value={filterOption}
            onChange={(e) => setFilterOption(e.target.value as FilterOption)}
            className="bg-white/10 border border-white/20 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-40 p-2.5 dark:bg-gray-800/50 dark:border-gray-600"
          >
            <option value="all">Tüm üyeler</option>
            <option value="with-username">Kullanıcı adı olanlar</option>
            <option value="online">Sadece çevrimiçi</option>
          </select>
        </div>
      </div>
      
      {selectedMembers.length > 0 && (
        <div className="mb-4 py-2 px-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800/30 text-blue-700 dark:text-blue-300 text-sm flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{selectedMembers.length} üye seçildi ({members.length} üye içinden)</span>
        </div>
      )}
      
      {/* Masaüstü Görünümü */}
      <div className="hidden md:block">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectedMembers.length === visibleMembers.length && visibleMembers.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Kullanıcı Adı</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ad</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Soyad</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Durum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {members.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4">
                    <EmptyStateMessage />
                  </td>
                </tr>
              ) : (
                <>
                  {visibleMembers.map((member) => (
                    <tr key={member.user_id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedMembers.includes(member.user_id)}
                          onChange={() => handleSelectMember(member.user_id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium">{member.username || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">{member.first_name || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">{member.last_name || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          member.status === 'active'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                        }`}>
                          {member.status === 'active' ? 'Aktif' : 'Pasif'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </>
              )}
            </tbody>
          </table>
          
          {visibleMembers.length > 0 && visibleMembers.length < members.length && (
            <div ref={loadMoreRef} className="py-4 flex justify-center">
              {isLoadingMore ? (
                <Spinner size="sm" />
              ) : (
                <button 
                  onClick={loadMore}
                  className="text-blue-500 text-sm hover:text-blue-700 focus:outline-none"
                >
                  Daha fazla yükle
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Mobil Görünümü */}
      <div className="md:hidden">
        <div className="flex items-center justify-between mb-4">
          <label className="inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={selectedMembers.length === visibleMembers.length && visibleMembers.length > 0}
              onChange={toggleSelectAll}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
            />
            <span className="text-sm">{selectedMembers.length > 0 ? `${selectedMembers.length} seçili` : 'Hepsini seç'}</span>
          </label>
        </div>
        
        {members.length === 0 ? (
          <EmptyStateMessage />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {visibleMembers.map(member => (
                <div 
                  key={member.user_id} 
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-white/5 hover:bg-white/10 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <div className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      checked={selectedMembers.includes(member.user_id)}
                      onChange={() => handleSelectMember(member.user_id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div className="font-medium">{member.username || member.first_name || `Kullanıcı #${member.user_id}`}</div>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          member.status === 'active'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                        }`}>
                          {member.status === 'active' ? 'Aktif' : 'Pasif'}
                        </span>
                      </div>
                      {member.username && <div className="text-sm text-gray-500 dark:text-gray-400">@{member.username}</div>}
                      <div className="text-sm mt-1">
                        {member.first_name} {member.last_name}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {visibleMembers.length > 0 && visibleMembers.length < members.length && (
              <div ref={loadMoreRef} className="py-4 flex justify-center">
                {isLoadingMore ? (
                  <Spinner size="sm" />
                ) : (
                  <button 
                    onClick={loadMore}
                    className="text-blue-500 text-sm hover:text-blue-700 focus:outline-none"
                  >
                    Daha fazla yükle
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </GlassCard>
  );
};

export default MemberList; 