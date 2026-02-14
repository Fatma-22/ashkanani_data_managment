import React from 'react';
import { Layout, Button, Space, Typography } from 'antd';
import { Outlet, useNavigate } from 'react-router-dom';
import { LoginOutlined, GlobalOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '../components/LanguageSwitcher';

const { Header, Content, Footer } = Layout;
const { Text } = Typography;

export const PublicLayout: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <Layout className="min-h-screen bg-gray-50">
      <Header className="flex items-center justify-between px-6 md:px-12 sticky top-0 z-50 h-20 shadow-md" style={{ background: 'rgb(63, 63, 63 / 95%)', backdropFilter: 'blur(8px)' }}>
        <div className="flex items-center cursor-pointer gap-3" onClick={() => navigate('/')}>
          <div className="inline-flex items-center justify-center">
            <img src="/logo.png" alt="Ashkanani Sport Logo" style={{ height: 42, objectFit: 'contain' }} />
          </div>
          <div>
            <span className="text-white font-black text-xl leading-tight tracking-tighter translate-y-0.5">
              {t('login.title_part1', { defaultValue: 'ASHKANANI' })} <span style={{ color: '#C9A24D' }}>{t('login.title_part2', { defaultValue: 'SPORT' })}</span>
            </span>
          </div>
        </div>
        <Space size="large">
          <LanguageSwitcher />
          <Button
            type="primary"
            icon={<LoginOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
            onClick={() => navigate('/login')}
            style={{
              background: '#C9A24D',
              color: '#3F3F3F',
              borderColor: '#C9A24D',
              fontWeight: 'bold'
            }}
            className="hover:scale-105 transition-transform"
          >
            {t('login.login_btn', { defaultValue: 'Sign In' })}
          </Button>
        </Space>
      </Header>
      <Content className="px-6 md:px-12 py-8 max-w-7xl mx-auto w-full">
        <Outlet />
      </Content>
      <Footer className="text-center bg-slate-50 text-slate-400 py-12 border-t border-slate-100">
        <div style={{ marginBottom: 8 }}>
          <strong className="text-slate-600">{t('login.title')}</strong> <span className="text-gold-500 mx-2">|</span> {t('admin.reports.subtitle')}
        </div>
        <div style={{ fontSize: 12 }} className="uppercase tracking-widest opacity-60">
          {t('common.footer_text')}
        </div>
      </Footer>
    </Layout>
  );
};
