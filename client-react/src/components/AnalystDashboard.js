import React from 'react';
import AnalystHomePage from './AnalystHomePage';

// Re-export AnalystHomePage as AnalystDashboard for consistency
function AnalystDashboard({ user, onLogout }) {
  return <AnalystHomePage user={user} onLogout={onLogout} />;
}

export default AnalystDashboard;
