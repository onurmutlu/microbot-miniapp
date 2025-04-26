import React from 'react';
import SchedulerManager from '../components/SchedulerManager';

const Scheduler: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Zamanlayıcı Yönetimi</h1>
      <SchedulerManager />
    </div>
  );
};

export default Scheduler; 