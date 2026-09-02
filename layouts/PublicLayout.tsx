import React from 'react';
import { Layout, Button, Space, Typography, Dropdown, Avatar, Spin } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LoginOutlined, LogoutOutlined, UserOutlined, DashboardOutlined, HomeOutlined, TeamOutlined, ReadOutlined, MenuOutlined, TrophyOutlined, IdcardOutlined, GlobalOutlined, StarOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { useAuth } from '../context/AuthContext';


const { Header, Content, Footer } = Layout;
const { Text } = Typography;

export const PublicLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const isAr = i18n.language === 'ar';

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navLinks = [
    { path: '/', label: t('common.home', { defaultValue: 'الرئيسية' }), icon: <HomeOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} /> },
    { path: '/players', label: t('common.players'), icon: <TeamOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} /> },
    { path: '/deals', label: t('public_deals.title'), icon: <TrophyOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} /> },
    { path: '/sponsors', label: t('common.sponsors', { defaultValue: 'الرعاة' }), icon: <StarOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} /> },
    { path: '/media', label: t('common.media_center'), icon: <ReadOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} /> },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <Layout className="min-h-screen bg-white">
      <Header
        className="flex items-center justify-between px-4 md:px-10 sticky top-0 z-[1000] shadow-lg !bg-[#141414]"
        style={{ backdropFilter: 'none', height: 72, borderBottom: '1px solid rgba(201,162,77,0.15)' }}
      >
        {/* Logo */}
        <div className="flex items-center cursor-pointer gap-3 flex-shrink-0" onClick={() => navigate('/')}>
          <img src="/logo.png" alt="Ashkanani Sport Logo" style={{ height: 40, objectFit: 'contain' }} />
          <div className="hidden sm:flex flex-col">
            <span className="text-white font-black text-base md:text-lg leading-tight tracking-tighter uppercase">
              {t('login.title_part1')} <span style={{ color: '#C9A24D' }}>{t('login.title_part2')}</span>
            </span>
          </div>
        </div>

        {/* Center Nav Links - Desktop Only */}
        <nav className="hidden lg:flex items-center gap-1">
          {navLinks.map(link => (
            <button
              key={link.path}
              onClick={() => navigate(link.path)}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all duration-200"
              style={{
                color: isActive(link.path) ? '#C9A24D' : 'rgba(255,255,255,0.75)',
                background: isActive(link.path) ? 'rgba(201,162,77,0.12)' : 'transparent',
                border: isActive(link.path) ? '1px solid rgba(201,162,77,0.3)' : '1px solid transparent',
              }}
            >
              {link.icon}
              {link.label}
            </button>
          ))}
        </nav>

        {/* Right Actions */}
        <Space size="middle" align="center">
          <LanguageSwitcher />

          <div className="flex items-center">
            {user ? (
              <Dropdown
                menu={{
                  items: [
                    ...(user.role === 'PUBLIC' ? [{
                      key: 'profile',
                      icon: <IdcardOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />,
                      label: t('profile.page_title'),
                      onClick: () => navigate('/profile'),
                    }] : [{
                      key: 'dashboard',
                      icon: <DashboardOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />,
                      label: t('common.dashboard'),
                      onClick: () => {
                        if (user.role === 'OWNER') navigate('/owner');
                        else if (user.role === 'ADMIN') navigate('/admin');
                        else if (user.role === 'AGENT') navigate('/agent');
                        else navigate('/profile');
                      }
                    }]),
                    { type: 'divider' as const },
                    {
                      key: 'logout',
                      icon: <LogoutOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />,
                      label: t('common.logout'),
                      onClick: handleLogout,
                      danger: true
                    }
                  ]
                }}
              >
                <Avatar
                  size={38}
                  src={user?.avatar}
                  icon={<UserOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
                  className="cursor-pointer hover:opacity-80 transition-opacity border border-white/20"
                  style={{ background: '#C9A24D', color: '#1a1a1a', fontWeight: 'bold' }}
                >
                  {!user?.avatar && user.name?.charAt(0).toUpperCase()}
                </Avatar>
              </Dropdown>
            ) : (
              <Button
                type="primary"
                icon={<LoginOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
                onClick={() => navigate('/login')}
                style={{ background: '#C9A24D', borderColor: '#C9A24D', color: '#1a1a1a', fontWeight: 'bold' }}
                className="rounded-xl h-10 px-4 md:px-5"
              >
                <span>{t('login.login_btn')}</span>
              </Button>
            )}
          </div>

          {/* Mobile menu button - lg:hidden ensures it only shows on smaller screens */}
          <div className="lg:hidden flex items-center">
            <Dropdown
              trigger={['click']}
              placement={location.pathname.startsWith('/ar') || i18n.language === 'ar' ? 'bottomLeft' : 'bottomRight'}
              menu={{
                items: navLinks.map(link => ({
                  key: link.path,
                  icon: link.icon,
                  label: link.label,
                  onClick: () => navigate(link.path),
                }))
              }}
            >
              <Button
                type="text"
                size="large"
                icon={<MenuOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} style={{ fontSize: 24 }} />}
                className="text-white p-0 flex items-center justify-center hover:text-[#C9A24D]"
              />
            </Dropdown>
          </div>
        </Space>
      </Header>

      <Content>
        <Outlet />
      </Content>

      <Footer
        className="text-center py-12 border-t"
        style={{ background: '#0a0a0a', borderColor: 'rgba(201,162,77,0.15)' }}
      >
        <img src="/logo.png" alt="Logo" className="h-10 mx-auto mb-5" style={{ opacity: 0.7 }} />
        <div className="text-sm font-bold mb-2" style={{ color: 'rgba(255,255,255,0.7)' }}>
          {t('login.title_part1')} <span style={{ color: '#C9A24D' }}>{t('login.title_part2')}</span>
        </div>
        <div className="mt-8 flex flex-col items-center gap-4">
          <Button
            type="link"
            className="text-white hover:text-[#C9A24D] font-bold flex items-center gap-2"
            onClick={() => window.open('https://ashkananisport.com/', '_blank')}
          >
            <GlobalOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />
            {isAr ? 'الموقع الرسمي' : 'Official Website'}
          </Button>
          <div className="text-xs tracking-widest uppercase whitespace-pre-line" style={{ color: 'rgba(255,255,255,0.3)' }}>
            {t('common.footer_text')}
          </div>
        </div>
      </Footer>
    </Layout>
  );
};
