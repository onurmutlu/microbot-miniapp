import React, { useState } from 'react';
import { Tabs, Tab } from 'react-bootstrap';
import GroupActivityTab from './GroupActivityTab';
import OptimalIntervalsTab from './OptimalIntervalsTab';
import CooledGroupsTab from './CooledGroupsTab';
import MessageStatsTab from './MessageStatsTab';

const DashboardTabs: React.FC = () => {
  const [key, setKey] = useState('groupActivity');

  return (
    <Tabs
      id="dashboard-tabs"
      activeKey={key}
      onSelect={(k) => k && setKey(k)}
      className="mb-4"
    >
      <Tab eventKey="groupActivity" title="Grup Aktivite Analizi">
        <GroupActivityTab />
      </Tab>
      
      <Tab eventKey="optimalIntervals" title="Optimal Mesaj Aralıkları">
        <OptimalIntervalsTab />
      </Tab>
      
      <Tab eventKey="cooledGroups" title="Soğutma Yönetimi">
        <CooledGroupsTab />
      </Tab>
      
      <Tab eventKey="messageStats" title="Mesaj İstatistikleri">
        <MessageStatsTab />
      </Tab>
    </Tabs>
  );
};

export default DashboardTabs; 