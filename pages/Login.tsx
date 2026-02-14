import React, { useState, useEffect } from 'react';
import { Card, Button, Typography, Space, Divider, Form, Input, Select, Alert } from 'antd';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { useNavigate } from 'react-router-dom';
import {
  LockOutlined,
  UserOutlined,
  LoginOutlined,
  GlobalOutlined,
  SafetyCertificateOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;
import { useTranslation } from 'react-i18next';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const onFinish = async (values: any) => {
    setLoading(true);
    setError(null);

    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));

      const { email, password, role } = values;

      // Basic mock validation
      if (password.length < 4) {
        throw new Error('Password must be at least 4 characters');
      }

      login(role, email, password);

      if (role === UserRole.OWNER) {
        navigate('/owner');
      } else if (role === UserRole.ADMIN) {
        navigate('/admin');
      } else if (role === UserRole.AGENT) {
        navigate('/agent');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handlePublicAccess = () => {
    login(UserRole.PUBLIC);
    navigate('/players');
  };

  if (showSplash) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-[#3F3F3F]">
        <style>
          {`
            @keyframes pulse-gold {
              0% { transform: scale(1); opacity: 0.8; }
              50% { transform: scale(1.1); opacity: 1; }
              100% { transform: scale(1); opacity: 0.8; }
            }
            .animate-pulse-gold {
              animation: pulse-gold 2s infinite ease-in-out;
            }
            @keyframes fade-in {
              from { opacity: 0; transform: translateY(10px); }
              to { opacity: 1; transform: translateY(0); }
            }
            .animate-fade-in {
              animation: fade-in 0.8s ease-out forwards;
            }
          `}
        </style>
        <div className="animate-pulse-gold flex flex-col items-center text-center">
          <img src="/logo.png" alt="Ashkanani Sport" className="h-40 object-contain mb-6" />
          <Title level={1} className="!text-white !m-0 !text-5xl !font-black tracking-tighter uppercase">
            {t('login.title_part1', { defaultValue: 'ASHKANANI' })} <span style={{ color: '#C9A24D' }}>{t('login.title_part2', { defaultValue: 'SPORT' })}</span>
          </Title>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden animate-fade-in" style={{ background: '#3F3F3F' }}>
      {/* Background decorative elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full opacity-10 bg-gold-500 blur-[100px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full opacity-10 bg-blue-400 blur-[100px]"></div>



      <Card
        className="w-full max-w-md shadow-[0_20px_50px_rgba(0,0,0,0.3)] rounded-2xl border-0 overflow-hidden relative z-10"
        bodyStyle={{ padding: '40px 32px' }}
      >
        <div className="text-center mb-10">
          <Title level={2} className="!m-0 !text-3xl !font-black tracking-tight" style={{ color: '#3F3F3F' }}>
            {t('login.title_part1', { defaultValue: 'ASHKANANI' })} <span style={{ color: '#C9A24D' }}>{t('login.title_part2', { defaultValue: 'SPORT' })}</span>
          </Title>
          <Text type="secondary" className="mt-2 block font-medium uppercase tracking-wide opacity-60">
            {t('login.welcome')}
          </Text>
          <div className="flex justify-center mt-4">
            <img src="/logo2.png" alt="Ashkanani Sport" className="h-12 object-contain" />
          </div>
        </div>

        {error && (
          <Alert
            message={error}
            type="error"
            showIcon
            className="mb-6 rounded-lg"
          />
        )}

        <Form
          name="login_form"
          layout="vertical"
          initialValues={{ role: UserRole.AGENT }}
          onFinish={onFinish}
          autoComplete="off"
          size="large"
        >
          <Form.Item
            label={t('common.email')}
            name="email"
            rules={[
              { required: true, message: t('login.email_required', { defaultValue: 'Please enter your email' }) },
              { type: 'email', message: t('login.email_invalid', { defaultValue: 'Please enter a valid email' }) }
            ]}
          >
            <Input
              prefix={<UserOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} className="text-gray-300" />}
              placeholder={t('login.email_placeholder')}
              className="rounded-lg h-12"
            />
          </Form.Item>

          <Form.Item
            label={t('login.password_label', { defaultValue: 'Security Password' })}
            name="password"
            rules={[{ required: true, message: t('login.password_required', { defaultValue: 'Please enter your password' }) }]}
          >
            <Input.Password
              prefix={<LockOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} className="text-gray-300" />}
              placeholder="••••••••"
              className="rounded-lg h-12"
            />
          </Form.Item>

          <Form.Item
            label={t('login.portal_label', { defaultValue: 'Access Portal' })}
            name="role"
            rules={[{ required: true, message: t('login.portal_required', { defaultValue: 'Please select a portal' }) }]}
          >
            <Select className="rounded-lg h-12">
              <Option value={UserRole.OWNER}>{t('roles.owner', { defaultValue: 'Owner' })}</Option>
              <Option value={UserRole.ADMIN}>{t('roles.admin', { defaultValue: 'Administrator' })}</Option>
              <Option value={UserRole.AGENT}>{t('roles.agent', { defaultValue: 'Certified Agent' })}</Option>
            </Select>
          </Form.Item>

          <Form.Item className="mt-8 mb-4">
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={loading}
              icon={<LoginOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
              className="h-12 text-lg font-bold rounded-lg"
              style={{ background: '#C9A24D', borderColor: '#C9A24D' }}
            >
              {t('login.login_btn')}
            </Button>
          </Form.Item>

          <Divider plain>{t('login.secure_access_label', { defaultValue: 'Secure Access' })}</Divider>

          <Button
            type="link"
            block
            icon={<GlobalOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
            onClick={handlePublicAccess}
            className="text-gray-400 hover:text-gold-500 flex items-center justify-center gap-2"
          >
            {t('login.public_access_btn', { defaultValue: 'Access Public Directory' })}
          </Button>
        </Form>
      </Card>
    </div>
  );
};
