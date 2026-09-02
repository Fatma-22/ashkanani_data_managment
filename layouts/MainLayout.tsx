import React, { useState } from 'react';
import { Layout, Menu, Button, Dropdown, Avatar, Space, Typography, Grid, Drawer } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  DashboardOutlined,
  UserOutlined,
  FileTextOutlined,
  TeamOutlined,
  BarChartOutlined,
  SettingOutlined,
  LogoutOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  GlobalOutlined,
  NotificationOutlined,
  SoundOutlined,
  TrophyOutlined,
  ReadOutlined,
  LayoutOutlined,
  ThunderboltOutlined,
  CalendarOutlined,
  SafetyCertificateOutlined,
  ContactsOutlined,
  DollarOutlined,
  PieChartOutlined,
  StarOutlined,
  MedicineBoxOutlined,
} from '@ant-design/icons';
import { Badge } from 'antd';
import { playerService } from '../services/playerService';

// Fix for icon pointer capture warnings/errors
const Icon = (Component: any) => (props: any) => <Component onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} {...props} />;
const DashboardIcon = Icon(DashboardOutlined);
const UserIcon = Icon(UserOutlined);
const TeamIcon = Icon(TeamOutlined);
const BarChartIcon = Icon(BarChartOutlined);
const SettingIcon = Icon(SettingOutlined);
const LogoutIcon = Icon(LogoutOutlined);
const MenuUnfoldIcon = Icon(MenuUnfoldOutlined);
const MenuFoldIcon = Icon(MenuFoldOutlined);
const GlobalIcon = Icon(GlobalOutlined);
const FileTextIcon = Icon(FileTextOutlined);
const NewsIcon = Icon(ReadOutlined);
const LandingIcon = Icon(LayoutOutlined);
const ThunderboltIcon = Icon(ThunderboltOutlined);
const CalendarIcon = Icon(CalendarOutlined);
const AdminIcon = Icon(SafetyCertificateOutlined);
const EmployeeIcon = Icon(ContactsOutlined);
const FinancialIcon = Icon(DollarOutlined);
const ReportsIcon = Icon(PieChartOutlined);
const SponsorIcon = Icon(StarOutlined);
const NutritionIcon = Icon(MedicineBoxOutlined);

import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { canViewReports, canViewFinancials, canManageNews, canManageLanding, canManageCVRequests, canManageMeetings, canAddDeals, canEditDeals, canDeleteDeals, canManageMembers, canManageNutrition } from '../utils/permissionHelpers';
import { NotificationBell } from '../components/NotificationBell';

const { Header, Sider, Content, Footer } = Layout;
const { Text } = Typography;

export const MainLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [cvRequestsCount, setCvRequestsCount] = useState(0);
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const isAdmin = user?.role === UserRole.ADMIN;
  const isOwner = user?.role === UserRole.OWNER;

  React.useEffect(() => {
    const fetchCvCount = async () => {
      if (isAdmin || isOwner) {
        try {
          const { total } = await playerService.getAll({ isApproved: false }, 1, 1);
          setCvRequestsCount(total);
        } catch (error) {
          console.error('Error fetching CV count:', error);
        }
      }
    };

    fetchCvCount();
    const interval = setInterval(fetchCvCount, 1 * 60 * 1000); // تحديث كل دقيقة بدلاً من 5 دقائق

    // Listen to custom event to update count immediately
    window.addEventListener('cv-requests-updated', fetchCvCount);

    return () => {
      clearInterval(interval);
      window.removeEventListener('cv-requests-updated', fetchCvCount);
    };
  }, [isAdmin, isOwner]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const menuItems = [
    {
      key: isOwner ? '/owner' : (isAdmin ? '/admin' : '/agent'),
      icon: <DashboardIcon />,
      label: isOwner ? t('owner.dashboard.title') : (isAdmin ? t('common.dashboard') : t('agent_dashboard.statistics')),
    },
    
    // ═══════════════ Athletes & Members ═══════════════
    {
      key: 'grp_athletes',
      icon: <TeamIcon />,
      label: t('common.athletes_management'),
      children: [
        {
          key: isOwner ? '/owner/players' : (isAdmin ? '/admin/players' : '/agent/players'),
          label: t('common.players'),
        },
        ...(isOwner || canManageCVRequests(user) ? [{
          key: isOwner ? '/owner/cv-requests' : '/admin/cv-requests',
          label: (
            <span className="flex items-center justify-between w-full pr-2">
              <span className="truncate">{t('players.cv_requests', { defaultValue: 'CV Requests' })}</span>
              {cvRequestsCount > 0 && (
                <Badge 
                  count={cvRequestsCount} 
                  overflowCount={99}
                  style={{ 
                    backgroundColor: '#C9A24D', 
                    color: '#fff', 
                    boxShadow: '0 2px 4px rgba(201, 162, 77, 0.3)',
                    border: 'none'
                  }} 
                />
              )}
            </span>
          ),
        }] : []),
        ...(isOwner || canManageMembers(user) ? [{
          key: isOwner ? '/owner/members' : '/admin/members',
          label: t('admin.members.title'),
        }] : []),
        ...(isOwner || canManageNutrition(user) ? [{
          key: isOwner ? '/owner/nutrition' : '/admin/nutrition',
          label: t('owner.nutrition.title'),
        }] : []),
      ]
    },

    // ═══════════════ Operations ═══════════════
    {
      key: 'grp_operations',
      icon: <ThunderboltIcon />,
      label: t('common.operations'),
      children: [
        ...(isOwner || isAdmin ? [{
          key: isOwner ? '/owner/agents' : '/admin/agents',
          label: t('common.agents'),
        }] : []),
        ...(isOwner || isAdmin ? [{
          key: isOwner ? '/owner/scouts' : '/admin/scouts',
          label: t('scouts.scouts'),
        }] : []),
        ...(isOwner || canAddDeals(user) || canEditDeals(user) || canDeleteDeals(user) ? [{
          key: isOwner ? '/owner/deals' : '/admin/deals',
          label: t('admin.deals.title'),
        }] : []),
        ...(isOwner || canManageMeetings(user) ? [{
          key: isOwner ? '/owner/meetings' : '/admin/meetings',
          label: t('meetings.title', { defaultValue: 'Meetings' }),
        }] : []),
      ]
    },

    // ═══════════════ Content Management ═══════════════
    ...(isOwner || (isAdmin && (canManageNews(user) || canManageLanding(user))) ? [
      {
        key: 'grp_content',
        icon: <LandingIcon />,
        label: t('common.content_management'),
        children: [
          ...(isOwner || canManageNews(user) ? [{
            key: isOwner ? '/owner/news' : '/admin/news',
            label: t('common.news_management'),
          }] : []),
          ...(isOwner || isAdmin ? [{
            key: isOwner ? '/owner/federations' : '/admin/federations',
            label: t('menu.federations', { defaultValue: 'Sports Federations' }),
          }] : []),
          ...(isOwner || isAdmin ? [{
            key: isOwner ? '/owner/clubs' : '/admin/clubs',
            label: t('common.clubs', { defaultValue: 'Sports Clubs' }),
          }] : []),


          ...(isOwner || canManageLanding(user) ? [{
            key: isOwner ? '/owner/landing' : '/admin/landing',
            label: t('admin.landing_management', { defaultValue: 'إدارة الصفحة الرئيسية' }),
          }] : []),
        ]
      }
    ] : []),

    // ═══════════════ Administrative (Owner Only / Finance Access) ═══════════════
    ...(isOwner || canViewFinancials(user) ? [
      {
        key: 'grp_admin_settings',
        icon: <AdminIcon />,
        label: t('common.administrative_management'),
        children: [
          ...(isOwner ? [{
            key: '/owner/admins',
            label: t('owner.admins.title'),
          }] : []),
          ...(isOwner ? [{
            key: '/owner/employees',
            label: t('owner.employees.title'),
          }] : []),
          {
            key: isOwner ? '/owner/financials' : '/admin/financials',
            label: t('owner.financials.title'),
          },
        ]
      }
    ] : []),

    // ═══════════════ Analytics ═══════════════
    ...(isOwner || canViewReports(user) ? [
      {
        key: 'grp_analytics',
        icon: <ReportsIcon />,
        label: t('common.analytics'),
        children: [
          {
            key: isOwner ? '/owner/reports' : '/admin/reports',
            label: t('owner.reports.title'),
          }
        ]
      }
    ] : []),

    {
      key: isOwner ? '/owner/settings' : (isAdmin ? '/admin/settings' : '/agent/settings'),
      icon: <SettingIcon />,
      label: t('common.settings'),
    },
  ];

  const sidebarContent = (
    <div className="h-full flex flex-col bg-[#3F3F3F]">
      <div className="h-16 flex items-center px-4 gap-2 bg-[#3F3F3F] z-20">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="ASM Logo" className="h-10 w-auto" />
          {(!collapsed || isMobile) && (
            <div className="flex flex-col">
              <span className="text-white font-black text-lg leading-tight tracking-tighter">
                {t('login.title')}
              </span>
            </div>
          )}
        </div>
      </div>

      <Menu
        mode="inline"
        theme="dark"
        selectedKeys={[location.pathname]}
        defaultOpenKeys={(() => {
          const path = location.pathname;
          if (path.includes('players') || path.includes('cv-requests') || path.includes('members')) return ['grp_athletes'];
          if (path.includes('agents') || path.includes('deals') || path.includes('meetings')) return ['grp_operations'];
          if (path.includes('news') || path.includes('landing') || path.includes('sponsors')) return ['grp_content'];
          if (path.includes('admins') || path.includes('employees') || path.includes('financials')) return ['grp_admin_settings'];
          if (path.includes('reports')) return ['grp_analytics'];
          return [];
        })()}
        items={menuItems}
        onClick={({ key }) => {
          if (key.startsWith('/')) {
            navigate(key);
            if (isMobile) setDrawerVisible(false);
          }
        }}
        className="bg-[#3F3F3F] border-none flex-1 mt-2"
      />
    </div>
  );

  return (
    <Layout className="min-h-screen">
      {!isMobile && (
        <Sider
          trigger={null}
          collapsible
          collapsed={collapsed}
          width={240}
          theme="dark"
          className="bg-[#3F3F3F] border-r border-[#ffffff10]"
          style={{
            overflow: 'auto',
            height: '100vh',
            position: 'fixed',
            left: isRTL ? 'auto' : 0,
            right: isRTL ? 0 : 'auto',
            top: 0,
            bottom: 0,
            zIndex: 1001,
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}
        >
          {sidebarContent}
        </Sider>
      )}

      <Drawer
        placement={isRTL ? 'right' : 'left'}
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        styles={{ body: { padding: 0, background: '#3F3F3F' } }}
        width={240}
        closable={false}
      >
        {sidebarContent}
      </Drawer>

      <Layout style={{
        marginLeft: isMobile ? 0 : (isRTL ? 0 : (collapsed ? 80 : 240)),
        marginRight: isMobile ? 0 : (isRTL ? (collapsed ? 80 : 240) : 0),
        transition: 'all 0.2s cubic-bezier(0.2, 0, 0, 1)'
      }}>
        <Header className="px-4 md:px-6 flex items-center justify-between shadow-sm sticky top-0 z-[1000] !bg-[#3F3F3F]">
          <Button
            type="text"
            icon={isMobile ? <MenuUnfoldIcon /> : (
              collapsed ?
                (isRTL ? <MenuFoldIcon /> : <MenuUnfoldIcon />) :
                (isRTL ? <MenuUnfoldIcon /> : <MenuFoldIcon />)
            )}
            onClick={() => isMobile ? setDrawerVisible(true) : setCollapsed(!collapsed)}
            className="text-lg w-10 h-10 !text-white hover:!text-[#C9A24D]"
          />
          <div className="flex items-center gap-4">
            {(isAdmin || isOwner) && <NotificationBell />}

            <Dropdown menu={{
              onClick: ({ key }) => i18n.changeLanguage(key),
              selectedKeys: [i18n.language],
              items: [
                { key: 'ar', label: 'العربية' },
                { key: 'en', label: 'English' }
              ]
            }} placement="bottomRight" arrow>
              <Button type="text" icon={<GlobalIcon style={{ color: '#fff', fontSize: '18px' }} />} className="text-white hover:text-gold-500" style={{ color: '#fff' }} />
            </Dropdown>

            <Dropdown menu={{
              items: [
                {
                  key: 'logout',
                  icon: <LogoutIcon />,
                  label: t('common.logout'),
                  onClick: handleLogout
                }
              ]
            }} placement="bottomRight" arrow>
              <Space className="cursor-pointer hover:bg-white/10 px-2 py-1 rounded-md transition-colors">
                <Avatar src={user?.avatar} icon={<UserIcon />} className="bg-gold-500 border-2 border-white/20" />
                {!isMobile && <span className="text-sm font-medium text-white">{user?.name}</span>}
              </Space>
            </Dropdown>
          </div>
        </Header>
        <Content className="overflow-auto bg-[#F2F2F2] min-h-[calc(100vh-64px)] p-4 md:p-6 lg:p-8">
          <Outlet />
        </Content>
        <Footer className="text-center py-4 bg-gray-50 text-gray-400 border-t border-gray-100">
          <div className="mb-1">
            <strong className="text-slate-600 text-[10px] md:text-xs">{t('login.title')}</strong>
          </div>
          <Text className="text-xs opacity-60 tracking-widest">{t('common.footer_text')}</Text>
        </Footer>
      </Layout>
    </Layout>
  );
};
