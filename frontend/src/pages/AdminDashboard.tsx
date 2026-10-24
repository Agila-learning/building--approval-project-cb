import React from 'react';
import KpiCards from '../components/admin/KpiCards';
import ApplicationStatusChart from '../components/admin/ApplicationStatusChart';
import CurrentMonthStatus from '../components/admin/CurrentMonthStatus';
import RecentApplicationsTable from '../components/admin/RecentApplicationsTable';
import UpcomingFollowups from '../components/admin/UpcomingFollowups';
import ActivityTimeline from '../components/admin/ActivityTimeline';
import MonthlyOverview from '../components/admin/MonthlyOverview';

const AdminDashboard: React.FC = () => {
  return (
    <div style={{ paddingBottom: '2rem' }}>
      
      {/* Top Overview Cards */}
      <KpiCards />

      {/* Main Content Area */}
      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
        <div style={{ flex: '1 1 600px' }}>
          <CurrentMonthStatus />
          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
             <RecentApplicationsTable />
          </div>
        </div>
        <div style={{ flex: '1 1 350px', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <ApplicationStatusChart />
          <UpcomingFollowups />
        </div>
      </div>

      {/* Bottom Area */}
      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
        <ActivityTimeline />
        <MonthlyOverview />
      </div>

    </div>
  );
};

export default AdminDashboard;
