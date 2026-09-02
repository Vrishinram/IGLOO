import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

// Pages
import Login from './pages/Login';

// Resident Pages
import ResidentDashboard from './pages/resident/ResidentDashboard';
import ResidentMaintenance from './pages/resident/ResidentMaintenance';
import ResidentFinances from './pages/resident/ResidentFinances';
import ResidentVisitors from './pages/resident/ResidentVisitors';
import ResidentNotices from './pages/resident/ResidentNotices';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminMaintenance from './pages/admin/AdminMaintenance';
import AdminTreasury from './pages/admin/AdminTreasury';
import AdminVisitors from './pages/admin/AdminVisitors';
import AdminNotices from './pages/admin/AdminNotices';
import AdminUsers from './pages/admin/AdminUsers';

// Security Pages
import SecurityGate from './pages/security/SecurityGate';
import SecurityWalkIn from './pages/security/SecurityWalkIn';
import SecurityLiveLog from './pages/security/SecurityLiveLog';

// Technician Pages
import TechTasks from './pages/technician/TechTasks';

const RootRedirect = () => {
  const { user, loading } = useAuth();
  
  if (loading) return null;
  
  if (!user) return <Navigate to="/login" replace />;
  
  switch (user.role) {
    case 'ADMIN': return <Navigate to="/admin/dashboard" replace />;
    case 'RESIDENT': return <Navigate to="/resident/dashboard" replace />;
    case 'SECURITY': return <Navigate to="/security/gate" replace />;
    case 'TECHNICIAN': return <Navigate to="/technician/tasks" replace />;
    default: return <Navigate to="/login" replace />;
  }
};

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      <Route path="/" element={<Layout />}>
        <Route index element={<RootRedirect />} />
        
        {/* Admin Routes */}
        <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
          <Route path="admin/dashboard" element={<AdminDashboard />} />
          <Route path="admin/maintenance" element={<AdminMaintenance />} />
          <Route path="admin/treasury" element={<AdminTreasury />} />
          <Route path="admin/visitors" element={<AdminVisitors />} />
          <Route path="admin/notices" element={<AdminNotices />} />
          <Route path="admin/users" element={<AdminUsers />} />
        </Route>

        {/* Resident Routes */}
        <Route element={<ProtectedRoute allowedRoles={['RESIDENT']} />}>
          <Route path="resident/dashboard" element={<ResidentDashboard />} />
          <Route path="resident/maintenance" element={<ResidentMaintenance />} />
          <Route path="resident/finances" element={<ResidentFinances />} />
          <Route path="resident/visitors" element={<ResidentVisitors />} />
          <Route path="resident/notices" element={<ResidentNotices />} />
        </Route>

        {/* Security Routes */}
        <Route element={<ProtectedRoute allowedRoles={['SECURITY']} />}>
          <Route path="security/gate" element={<SecurityGate />} />
          <Route path="security/walk-in" element={<SecurityWalkIn />} />
          <Route path="security/live-log" element={<SecurityLiveLog />} />
        </Route>

        {/* Technician Routes */}
        <Route element={<ProtectedRoute allowedRoles={['TECHNICIAN']} />}>
          <Route path="technician/tasks" element={<TechTasks />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
