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
  MenuFoldOutlined
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '../components/LanguageSwitcher';

const { Header, Sider, Content, Footer } = Layout;
const { Text } = Typography;

export const MainLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Define menu items based on role
  const isAdmin = user?.role === UserRole.ADMIN;
  const isOwner = user?.role === UserRole.OWNER;

  const menuItems = [
    {
      key: isOwner ? '/owner' : (isAdmin ? '/admin' : '/agent'),
      icon: <DashboardOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />,
      label: isOwner ? t('owner.dashboard.title') : (isAdmin ? t('common.dashboard') : t('agent_dashboard.statistics')),
    },
    {
      key: isOwner ? '/owner/players' : (isAdmin ? '/admin/players' : '/agent/players'),
      icon: <UserOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />,
      label: t('common.players'),
    },
    // Owner only items
    ...(isOwner ? [
      {
        key: '/owner/admins',
        icon: <TeamOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />,
        label: t('owner.admins.title'),
      },
      {
        key: '/owner/financials',
        icon: <BarChartOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />,
        label: t('owner.financials.title'),
      },
      {
        key: '/owner/employees',
        icon: <TeamOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />,
        label: t('owner.employees.title'),
      },
      {
        key: '/owner/reports',
        icon: <BarChartOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />,
        label: t('owner.reports.title'),
      },
    ] : []),
    // Admin only items
    ...(isAdmin ? [
      {
        key: '/admin/agents',
        icon: <TeamOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />,
        label: t('common.agents'),
      },
      {
        key: '/admin/reports',
        icon: <BarChartOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />,
        label: t('common.reports'),
      },
    ] : []),
    {
      key: '/settings',
      icon: <SettingOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />,
      label: t('common.settings'),
    },
  ];

  const userMenu = (
    <Menu items={[
      {
        key: 'logout',
        icon: <LogoutOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />,
        label: t('common.logout'),
        onClick: handleLogout
      }
    ]} />
  );

  const sidebarContent = (
    <div className="h-full flex flex-col bg-[#3F3F3F]">
      <div className="h-16 flex items-center px-4 gap-2 bg-[#3F3F3F] z-20">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="ASM Logo" className="h-10 w-auto" />
          {(!collapsed || isMobile) && (
            <div className="flex flex-col">
              <span className="text-white font-black text-lg leading-tight tracking-tighter">
                {t('login.title_part1', { defaultValue: 'ASHKANANI' })}<span style={{ color: '#C9A24D' }}> {t('login.title_part2', { defaultValue: 'SPORT' })}</span>
              </span>
            </div>
          )}
        </div>
      </div>

      <Menu
        mode="inline"
        theme="dark"
        selectedKeys={[location.pathname]}
        items={menuItems}
        onClick={({ key }) => {
          navigate(key);
          if (isMobile) setDrawerVisible(false);
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
        bodyStyle={{ padding: 0, background: '#3F3F3F' }}
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
        <Header className="px-4 md:px-6 flex items-center justify-between shadow-sm sticky top-0 z-10" style={{ background: 'rgb(63, 63, 63 / 95%)', backdropFilter: 'blur(8px)' }}>
          <Button
            type="text"
            icon={isMobile ? <MenuUnfoldOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} /> : (
              collapsed ?
                (isRTL ? <MenuFoldOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} /> : <MenuUnfoldOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />) :
                (isRTL ? <MenuUnfoldOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} /> : <MenuFoldOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />)
            )}
            onClick={() => isMobile ? setDrawerVisible(true) : setCollapsed(!collapsed)}
            className="text-lg w-10 h-10 text-white hover:text-[#C9A24D]"
          />
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <Dropdown overlay={userMenu} placement="bottomRight" arrow>
              <Space className="cursor-pointer hover:bg-white/10 px-2 py-1 rounded-md transition-colors">
                <Avatar src={user?.avatar} icon={<UserOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />} className="bg-gold-500 border-2 border-white/20" />
                {!isMobile && <span className="text-sm font-medium text-white">{user?.name}</span>}
              </Space>
            </Dropdown>
          </div>
        </Header>
        <Content className="m-3 md:m-6 p-4 md:p-6 bg-white rounded-lg shadow-sm overflow-auto">
          <Outlet />
        </Content>
        <Footer className="text-center py-4 bg-gray-50 text-gray-400 border-t border-gray-100">
          <div className="mb-1">
            <strong className="text-slate-600 text-xs">{t('login.title')}</strong>
          </div>
          <Text className="text-xs opacity-60 tracking-widest">{t('common.footer_text')}</Text>
        </Footer>
      </Layout>
    </Layout>
  );
};
