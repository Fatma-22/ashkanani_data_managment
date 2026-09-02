import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import apiClient from './services/api';
import { ConfigProvider } from 'antd';
import { AuthProvider, useAuth } from './context/AuthContext';
import { UserRole } from './types';
import { ashkananiSportTheme } from './utils/theme';
import './styles/global.css';
import './i18n';
import { useTranslation, I18nextProvider } from 'react-i18next';
import i18n from './i18n';
import enUS from 'antd/locale/en_US';
import arEG from 'antd/locale/ar_EG';
import { LoadingScreen } from './components/LoadingScreen';
import AccessRestricted from './pages/public/AccessRestricted';

// Layouts
import { MainLayout } from './layouts/MainLayout';
import { PublicLayout } from './layouts/PublicLayout';

// Pages (Lazy Load)
const LandingPage = lazy(() => import('./pages/LandingPage').then(m => ({ default: m.LandingPage })));
const Login = lazy(() => import('./pages/Login').then(m => ({ default: m.Login })));
const Register = lazy(() => import('./pages/Register').then(m => ({ default: m.Register })));
const Dashboard = lazy(() => import('./pages/admin/Dashboard').then(m => ({ default: m.Dashboard })));
const Players = lazy(() => import('./pages/admin/Players').then(m => ({ default: m.Players })));
const Agents = lazy(() => import('./pages/admin/Agents').then(m => ({ default: m.Agents })));
const Reports = lazy(() => import('./pages/admin/Reports').then(m => ({ default: m.Reports })));
const AgentPlayers = lazy(() => import('./pages/agent/AgentPlayers').then(m => ({ default: m.AgentPlayers })));
const PlayerList = lazy(() => import('./pages/PlayerList').then(m => ({ default: m.PlayerList })));
const PlayerDetails = lazy(() => import('./pages/PlayerDetails').then(m => ({ default: m.PlayerDetails })));
const Settings = lazy(() => import('./pages/Settings').then(m => ({ default: m.Settings })));
const AgentStatistics = lazy(() => import('./pages/agent/AgentStatistics').then(m => ({ default: m.AgentStatistics })));
const CompanyMedia = lazy(() => import('./pages/CompanyMedia').then(m => ({ default: m.CompanyMedia })));
const NewsListingPage = lazy(() => import('./pages/NewsListingPage').then(m => ({ default: m.NewsListingPage })));
const NewsDetailsPage = lazy(() => import('./pages/NewsDetailsPage').then(m => ({ default: m.NewsDetailsPage })));
const MemberProfile = lazy(() => import('./pages/MemberProfile').then(m => ({ default: m.MemberProfile })));
const Scouts = lazy(() => import('./pages/admin/Scouts').then(m => ({ default: m.Scouts })));

// Owner Pages (Lazy Load)
const OwnerDashboard = lazy(() => import('./pages/owner/OwnerDashboard').then(m => ({ default: m.OwnerDashboard })));
const OwnerAdmins = lazy(() => import('./pages/owner/OwnerAdmins').then(m => ({ default: m.OwnerAdmins })));
const OwnerFinancials = lazy(() => import('./pages/owner/OwnerFinancials').then(m => ({ default: m.OwnerFinancials })));
const OwnerEmployees = lazy(() => import('./pages/owner/OwnerEmployees').then(m => ({ default: m.OwnerEmployees })));
const OwnerReports = lazy(() => import('./pages/owner/OwnerReports').then(m => ({ default: m.OwnerReports })));
const OwnerPlayers = lazy(() => import('./pages/owner/OwnerPlayers').then(m => ({ default: m.OwnerPlayers })));
const OwnerAgents = lazy(() => import('./pages/owner/OwnerAgents').then(m => ({ default: m.OwnerAgents })));
const Deals = lazy(() => import('./pages/admin/Deals').then(m => ({ default: m.Deals })));
const NewsManagement = lazy(() => import('./pages/admin/NewsManagement').then(m => ({ default: m.NewsManagement })));
const LandingManagement = lazy(() => import('./pages/admin/LandingManagement').then(m => ({ default: m.LandingManagement })));
const CVRequests = lazy(() => import('./pages/admin/CVRequests').then(m => ({ default: m.CVRequests })));
const Meetings = lazy(() => import('./pages/admin/Meetings').then(m => ({ default: m.Meetings })));
const Members = lazy(() => import('./pages/admin/Members').then(m => ({ default: m.Members })));
const OwnerSponsors = lazy(() => import('./pages/owner/OwnerSponsors').then(m => ({ default: m.OwnerSponsors })));
const Nutrition = lazy(() => import('./pages/admin/Nutrition').then(m => ({ default: m.Nutrition })));
const OwnerNutrition = lazy(() => import('./pages/owner/OwnerNutrition').then(m => ({ default: m.OwnerNutrition })));
const FederationManagement = lazy(() => import('./pages/admin/FederationManagement').then(m => ({ default: m.FederationManagement })));
const ClubManagement = lazy(() => import('./pages/admin/ClubManagement').then(m => ({ default: m.ClubManagement })));

const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles: UserRole[] }> = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (!isAuthenticated && !loading) {
    return <Navigate to="/access-restricted" state={{ from: location.pathname }} replace />;
  }
  if (user && !user.isActive) return <Navigate to="/login" replace />;
  if (user && !allowedRoles.includes(user.role)) return <Navigate to="/login" replace />;

  return <>{children}</>;
};

const PublicDirectory = lazy(() => import('./pages/public/PublicDirectory').then(m => ({ default: m.PublicDirectory })));
const PublicDeals = lazy(() => import('./pages/public/PublicDeals').then(m => ({ default: m.PublicDeals })));
const PublicSponsors = lazy(() => import('./pages/public/PublicSponsors').then(m => ({ default: m.PublicSponsors })));
const PublicSponsorDetails = lazy(() => import('./pages/public/PublicSponsorDetails').then(m => ({ default: m.PublicSponsorDetails })));

const AppRoutes = () => {
  const location = useLocation();

  useEffect(() => {
    // Track site visit on route change
    // The backend recordVisit() already handles skipping internal roles (admin, owner, agent)
    const trackVisit = async () => {
      try {
        await apiClient.post('/public/track-visit');
      } catch (error) {
        // Silent error to not affect user experience
      }
    };

    trackVisit();
  }, [location.pathname]);

  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/access-restricted" element={<AccessRestricted />} />

        {/* Public Routes — no auth required */}
        <Route path="/" element={<PublicLayout />}>
          <Route index element={<LandingPage />} />
          <Route 
            path="players" 
            element={
              <ProtectedRoute allowedRoles={[UserRole.OWNER, UserRole.ADMIN, UserRole.AGENT, UserRole.MEMBER, UserRole.PUBLIC]}>
                <PublicDirectory />
              </ProtectedRoute>
            } 
          />
          <Route path="players/:id" element={<PlayerDetails />} />
          <Route path="cv/:id" element={<PlayerDetails />} />
          <Route path="deals" element={<PublicDeals />} />
          <Route path="sponsors" element={<PublicSponsors />} />
          <Route path="sponsors/:id" element={<PublicSponsorDetails />} />
          <Route path="news" element={<NewsListingPage />} />
          <Route path="news/:id" element={<NewsDetailsPage />} />
          <Route path="media" element={<CompanyMedia />} />
          <Route 
            path="profile" 
            element={
              <ProtectedRoute allowedRoles={[UserRole.OWNER, UserRole.ADMIN, UserRole.AGENT, UserRole.MEMBER]}>
                <MemberProfile />
              </ProtectedRoute>
            } 
          />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
            <MainLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="players" element={<Players />} />
          <Route path="players/:id" element={<PlayerDetails />} />
          <Route path="cv-requests" element={<CVRequests />} />
          <Route path="members" element={<Members />} />
          <Route path="agents" element={<Agents />} />
          <Route path="deals" element={<Deals />} />
          <Route path="news" element={<NewsManagement />} />
          <Route path="landing" element={<LandingManagement />} />
          <Route path="meetings" element={<Meetings />} />          <Route path="financials" element={<OwnerFinancials />} />          <Route path="financials" element={<OwnerFinancials />} />
          <Route path="reports" element={<Reports />} />
          <Route path="sponsors" element={<OwnerSponsors />} />
          <Route path="federations" element={<FederationManagement />} />
          <Route path="clubs" element={<ClubManagement />} />
          <Route path="nutrition" element={<Nutrition />} />
          <Route path="scouts" element={<Scouts />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* Agent Routes */}
        <Route path="/agent" element={
          <ProtectedRoute allowedRoles={[UserRole.AGENT]}>
            <MainLayout />
          </ProtectedRoute>
        }>
          <Route index element={<AgentStatistics />} />
          <Route path="players" element={<AgentPlayers />} />
          <Route path="players/:id" element={<PlayerDetails />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* Owner Routes */}
        <Route path="/owner" element={
          <ProtectedRoute allowedRoles={[UserRole.OWNER]}>
            <MainLayout />
          </ProtectedRoute>
        }>
          <Route index element={<OwnerDashboard />} />
          <Route path="players" element={<OwnerPlayers />} />
          <Route path="players/:id" element={<PlayerDetails />} />
          <Route path="cv-requests" element={<CVRequests />} />
          <Route path="members" element={<Members />} />
          <Route path="agents" element={<OwnerAgents />} />
          <Route path="deals" element={<Deals />} />
          <Route path="news" element={<NewsManagement />} />
          <Route path="landing" element={<LandingManagement />} />
          <Route path="meetings" element={<Meetings />} />
          <Route path="admins" element={<OwnerAdmins />} />
          <Route path="financials" element={<OwnerFinancials />} />
          <Route path="employees" element={<OwnerEmployees />} />
          <Route path="reports" element={<OwnerReports />} />
          <Route path="sponsors" element={<OwnerSponsors />} />
          <Route path="federations" element={<FederationManagement />} />
          <Route path="clubs" element={<ClubManagement />} />
          <Route path="nutrition" element={<OwnerNutrition />} />
          <Route path="scouts" element={<Scouts />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </Suspense>
  );
};

const App: React.FC = () => {
  const { i18n } = useTranslation();
  const direction = i18n.language === 'ar' ? 'rtl' : 'ltr';
  const locale = i18n.language === 'ar' ? arEG : enUS;

  return (
    <I18nextProvider i18n={i18n}>
      <ConfigProvider theme={ashkananiSportTheme} direction={direction} locale={locale}>
        <div dir={direction}>
          <AuthProvider>
            <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
              <AppRoutes />
            </Router>
          </AuthProvider>
        </div>
      </ConfigProvider>
    </I18nextProvider>
  );
};

export default App;