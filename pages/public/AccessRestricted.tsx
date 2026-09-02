import React from 'react';
import { Typography, Button, Space } from 'antd';
import { 
  LockOutlined, 
  UserAddOutlined, 
  LoginOutlined, 
  HomeOutlined,
  TeamOutlined,
  SafetyCertificateOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

const { Title, Paragraph, Text } = Typography;

export const AccessRestricted: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const isRtl = i18n.language === 'ar';
  
  // Get the redirect path from state or query
  const from = location.state?.from || '/';

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-[#0a0a0a]">
      {/* Background with overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src="/hero-bg.png" 
          alt="Athletic background" 
          className="w-full h-full object-cover opacity-40 scale-110"
          style={{ filter: 'brightness(0.5) contrast(1.2) grayscale(0.3)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-[#0a0a0a] via-transparent to-[#C9A24D]/10" />
      </div>

      {/* Content Container */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 max-w-2xl px-6 py-12 text-center"
      >
        {/* Branding Icon */}
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mb-10 inline-flex items-center justify-center w-28 h-28 rounded-3xl bg-[#C9A24D]/10 border border-[#C9A24D]/40 backdrop-blur-md shadow-2xl shadow-[#C9A24D]/20 transition-all hover:scale-105"
        >
          <LockOutlined 
            style={{ color: '#C9A24D', fontSize: '60px' }} 
            onPointerEnterCapture={undefined} 
            onPointerLeaveCapture={undefined} 
          />
        </motion.div>

        {/* Title */}
        <Title level={1} className="!text-white !font-black !text-4xl md:!text-6xl !mb-6 tracking-tight">
          {t('access_restricted.title', { defaultValue: 'Exclusive Content' })}
        </Title>

        {/* Subtitle / Call to Action */}
        <Paragraph className="!text-white/80 text-lg md:text-xl leading-relaxed mb-10 max-w-lg mx-auto font-medium">
          {t('access_restricted.subtitle', { 
            defaultValue: 'To view this profile and access our complete player directory, please join the Ashkanani Transfer community.' 
          })}
        </Paragraph>

        {/* Ashkanani Branding Hint */}
        <div className="flex items-center justify-center gap-2 mb-12">
            <div className="h-[1px] w-12 bg-[#C9A24D]/40"></div>
            <Text 
                style={{ color: '#C9A24D' }}
                className="font-black uppercase tracking-[0.3em] text-sm md:text-md"
            >
                {t('access_restricted.join_us', { defaultValue: 'JOIN US AT ASHKANANI TRANSFER' })}
            </Text>
            <div className="h-[1px] w-12 bg-[#C9A24D]/40"></div>
        </div>

        {/* Action Buttons */}
        <Space direction="vertical" size="large" className="w-full md:w-auto">
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <Button 
              type="primary" 
              size="large"
              icon={<UserAddOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
              onClick={() => navigate('/register')}
              className="h-16 px-10 rounded-2xl bg-[#C9A24D] border-none text-[#0a0a0a] font-black text-lg shadow-2xl shadow-[#C9A24D]/40 transition-all hover:scale-105 active:scale-95 flex items-center justify-center"
            >
              {t('access_restricted.register_btn', { defaultValue: 'Get Membership Now' })}
            </Button>
            
            <Button 
              size="large"
              icon={<LoginOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
              onClick={() => navigate('/login', { state: { from } })}
              className="h-16 px-10 rounded-2xl bg-white/5 border border-white/10 text-white font-bold text-lg backdrop-blur-md transition-all hover:bg-white/10 flex items-center justify-center"
            >
              {t('access_restricted.login_btn', { defaultValue: 'Sign In' })}
            </Button>
          </div>

          <Button 
            type="link" 
            icon={<HomeOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
            onClick={() => navigate('/')}
            className="text-white/40 hover:text-[#C9A24D] font-medium mt-4"
          >
            {t('access_restricted.back_home', { defaultValue: 'Back to Home' })}
          </Button>
        </Space>
      </motion.div>

      {/* Decorative Blur Elements */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-[#C9A24D]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-[#C9A24D]/5 rounded-full blur-[120px] pointer-events-none" />
    </div>
  );
};

export default AccessRestricted;
