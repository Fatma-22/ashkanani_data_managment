
import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import { AuthProvider, useAuth } from './context/AuthContext';
import { UserRole } from './types';
import { ashkananiSportTheme } from './utils/theme';
import './styles/global.css';
import './i18n'; // Import i18n configuration
import { useTranslation, I18nextProvider } from 'react-i18next';
import i18n from './i18n';
import enUS from 'antd/locale/en_US';
import arEG from 'antd/locale/ar_EG';

// Layouts
import { MainLayout } from './layouts/MainLayout';
import { PublicLayout } from './layouts/PublicLayout';

// Pages
import { Login } from './pages/Login';
import { Dashboard } from './pages/admin/Dashboard';
import { Players } from './pages/admin/Players';
import { Contracts } from './pages/admin/Contracts';
import { Agents } from './pages/admin/Agents';
import { Reports } from './pages/admin/Reports';
import { AgentPlayers } from './pages/agent/AgentPlayers';
import { PlayerList } from './pages/PlayerList';
import { PlayerDetails } from './pages/PlayerDetails';
import { Settings } from './pages/Settings';
import { AgentStatistics } from './pages/agent/AgentStatistics';

const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles: UserRole[] }> = ({ children, allowedRoles }) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user && !allowedRoles.includes(user.role)) return <Navigate to="/login" replace />;

  return <>{children}</>;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/players" replace />} />
      <Route path="/login" element={<Login />} />

      {/* Public Routes */}
      <Route path="/" element={<PublicLayout />}>
        <Route path="players" element={<PlayerList />} />
        <Route path="players/:id" element={<PlayerDetails />} />
      </Route>

      {/* Admin Routes */}
      <Route path="/admin" element={
        <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
          <MainLayout />
        </ProtectedRoute>
      }>
        <Route index element={<Dashboard />} />
        <Route path="players" element={<Players />} />
        <Route path="contracts" element={<Contracts />} />
        <Route path="agents" element={<Agents />} />
        <Route path="reports" element={<Reports />} />
      </Route>

      {/* Agent Routes */}
      <Route path="/agent" element={
        <ProtectedRoute allowedRoles={[UserRole.AGENT]}>
          <MainLayout />
        </ProtectedRoute>
      }>
        <Route index element={<AgentStatistics />} />
        <Route path="players" element={<AgentPlayers />} />
      </Route>

      {/* Shared Authenticated Routes */}
      <Route element={
        <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.AGENT]}>
          <MainLayout />
        </ProtectedRoute>
      }>
        <Route path="/settings" element={<Settings />} />
      </Route>
    </Routes>
  );
};

const App: React.FC = () => {
  const { i18n } = useTranslation();
  const direction = i18n.language === 'ar' ? 'rtl' : 'ltr';
  const locale = i18n.language === 'ar' ? arEG : enUS;

  return (
    <I18nextProvider i18n={i18n}>
      <ConfigProvider theme={ashkananiSportTheme} direction={direction} locale={locale}>
        <AuthProvider>
          <Router>
            <AppRoutes />
          </Router>
        </AuthProvider>
      </ConfigProvider>
    </I18nextProvider>
  );
};

export default App;
