import React from 'react';
import { Link } from 'react-router-dom';
import DashboardPage from '../components/Dashboard/DashboardPage';

const Dashboard: React.FC = () => {
  return (
    <div className="dashboard-container">
      <DashboardPage />
    </div>
  );
};

export default Dashboard; 