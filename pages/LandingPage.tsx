import React, { useEffect, useState } from 'react';
import { Typography, Button, Row, Col, Card, Space, Empty, Spin } from 'antd';
import {
    ArrowRightOutlined,
    StarFilled,
    TrophyFilled,
    TeamOutlined,
    GlobalOutlined,
    RocketFilled,
    SafetyCertificateFilled,
    WhatsAppOutlined,
    YoutubeOutlined,
    StarOutlined,
    FilePdfOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { motion, Variants } from 'framer-motion';
import { playerService } from '../services/playerService';
import { Player } from '../types';
import { publicService, LandingPageData } from '../services/publicService';
import profileService from '../services/profileService';
import PlayerCard from '../components/PlayerCard';
import { PlayerTicker } from '../components/PlayerTicker';
import Flag from 'react-world-flags';
import { getCountryCode } from '../utils/flags';
import { SponsorMarquee } from '../components/SponsorMarquee';
import SEO from '../components/SEO';

const { Title, Text, Paragraph } = Typography;

export const LandingPage: React.FC = () => {
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    const isRtl = i18n.language === 'ar';
    const { user } = useAuth();
    const [userCVFound, setUserCVFound] = useState(false);
    const [checkingCV, setCheckingCV] = useState(false);
    const [landingData, setLandingData] = useState<LandingPageData | null>(null);

    useEffect(() => {
        publicService.trackVisit(user?.role);
        
        // Fetch Landing Page data (Sponsors, etc)
        publicService.getLandingPageData().then(res => {
            setLandingData(res);
        }).catch(err => console.error('Failed to fetch landing data', err));

        // Check if current user has a CV
        if (user) {
            const phone = user?.phone;
            setCheckingCV(true);
            
            const checkCV = async () => {
                if (!phone) {
                    setCheckingCV(false);
                    return;
                }
                try {
                    let cv = await profileService.getMyCV(phone);
                    setUserCVFound(!!cv);
                } catch (e) {
                    setUserCVFound(false);
                } finally {
                    setCheckingCV(false);
                }
            };
            checkCV();
        }
    }, [user]);

    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.2 } }
    };

    const itemVariants: Variants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
    };

    return (
        <div className="min-h-screen bg-white">
            <SEO 
                title={t('login.title_part1')} 
                description={t('landing.hero_subtitle')}
                keywords="sports agency, football players, athlete management, Ashkanani Sport, وكالة لاعبين, كرة قدم"
            />
            {/* Players Ticker */}
            <PlayerTicker />

            {/* Hero Section */}
            <div className="relative bg-[#0a0a0a] text-white min-h-[90vh] flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <img
                        src="/hero-bg.png"
                        alt="Background"
                        className="w-full h-full object-cover opacity-60 scale-105"
                        style={{ filter: 'brightness(0.7) contrast(1.1)' }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a]/60 via-transparent to-transparent" />
                </div>

                <div className="relative z-10 max-w-7xl mx-auto px-6 w-full pt-10 pb-20">
                    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="text-center">
                        <motion.div variants={itemVariants} className="flex flex-col items-center mb-8">
                            <div className="relative mb-6">
                                <img src="/logo.png" alt="Logo" className="h-28 md:h-40 relative z-10" />
                            </div>

                            <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-white/10 border border-white/20 mb-6">
                                <span className="text-white font-bold tracking-widest text-[10px] md:text-xs uppercase">
                                    {t('landing.premium_agency')}
                                </span>
                            </div>

                            <Title level={1} className="!text-white !font-black !m-0 !leading-[1.1] tracking-tighter">
                                <span className="block text-4xl md:text-7xl mb-4">{t('login.title_part1')}</span>
                                <span className="block text-2xl md:text-6xl font-bold text-[#C9A24D] tracking-[0.1em]" style={{ fontFamily: "'Cairo', sans-serif" }}>
                                    {t('login.title_part2')}
                                </span>
                            </Title>

                            <Paragraph className="!text-white max-w-2xl mt-8 text-base font-medium">
                                {t('landing.hero_subtitle')}
                            </Paragraph>
                        </motion.div>

                        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row flex-wrap justify-center gap-4">
                            <Button
                                type="primary"
                                size="large"
                                className="bg-[#C9A24D] border-none h-14 px-10 rounded-xl font-bold"
                                onClick={() => navigate('/players')}
                            >
                                {t('landing.cta_primary')}
                            </Button>
                            
                            <Button
                                type="default"
                                size="large"
                                className="bg-white text-[#1a1a1a] border-none hover:bg-slate-200 h-14 px-8 rounded-xl font-bold flex items-center justify-center gap-2"
                                onClick={() => {
                                    if (!user) {
                                        navigate('/login', { state: { from: '/profile', openCV: true } });
                                    } else {
                                        navigate('/profile', { state: { openCV: true } });
                                    }
                                }}
                            >
                                <FilePdfOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />
                                {userCVFound ? t('profile.update_cv') : t('landing.add_cv')}
                            </Button>

                            <Button
                                type="default"
                                size="large"
                                className="bg-white/10 border-white/20 text-white hover:!bg-white/20 hover:!border-white/40 h-14 px-10 rounded-xl font-bold flex items-center justify-center gap-2"
                                onClick={() => navigate('/media')}
                            >
                                {t('common.media_center')}
                            </Button>

                            <Button
                                type="default"
                                size="large"
                                className="bg-[#C9A24D22] border-[#C9A24D44] text-[#C9A24D] hover:!bg-[#C9A24D33] h-14 px-10 rounded-xl font-bold flex items-center justify-center gap-2"
                                onClick={() => window.open('https://ashkananisport.com/', '_blank')}
                            >
                                <GlobalOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />
                                {t('landing.official_website')}
                            </Button>
                        </motion.div>

                        {/* Sponsors Scrolling Line */}
                        {landingData && landingData.sponsors && landingData.sponsors.length > 0 && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                                className="w-full mt-8"
                            >
                                <SponsorMarquee sponsors={landingData.sponsors} isRtl={isRtl} />
                            </motion.div>
                        )}
                    </motion.div>
                </div>
            </div>

            {/* Statistics */}
            <div className="max-w-7xl mx-auto px-6 py-24">
                <Row gutter={[48, 48]} justify="center">
                    {[
                        { icon: <TeamOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />, value: '+150', label: t('landing.stats_players') },
                        { icon: <GlobalOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />, value: '12', label: t('landing.stats_countries') },
                        { icon: <TrophyFilled onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />, value: '$450M', label: t('landing.stats_value') },
                        { icon: <StarFilled onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />, value: '25', label: t('landing.stats_awards') },
                    ].map((stat, i) => (
                        <Col key={i} xs={12} md={6}>
                            <div className="text-center">
                                <div className="text-4xl text-[#C9A24D] mb-4">{stat.icon}</div>
                                <div className="text-4xl font-black text-[#1a1a1a]">{stat.value}</div>
                                <div className="text-[#C9A24D] font-bold uppercase text-xs opacity-70">{stat.label}</div>
                            </div>
                        </Col>
                    ))}
                </Row>
            </div>

            {/* Features */}
            <div className="py-24 bg-slate-50">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-20">
                        <Text className="text-[#C9A24D] font-bold tracking-[0.1em] uppercase block mb-3 text-lg md:text-xl" style={{ fontFamily: "'Almarai', sans-serif" }}>
                            {t('landing.why_us')}
                        </Text>
                        <Title level={2} className="!text-4xl md:!text-6xl font-black">{t('landing.features_title')}</Title>
                    </div>
                    <Row gutter={[40, 40]}>
                        {[
                            { icon: <RocketFilled onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />, title: t('landing.feat_1_title'), desc: t('landing.feat_1_desc') },
                            { icon: <SafetyCertificateFilled onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />, title: t('landing.feat_2_title'), desc: t('landing.feat_2_desc') },
                            { icon: <GlobalOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />, title: t('landing.feat_3_title'), desc: t('landing.feat_3_desc') },
                        ].map((feature, i) => (
                            <Col key={i} xs={24} md={8}>
                                <Card className="h-full border-none shadow-sm rounded-3xl p-4">
                                    <div className="w-16 h-16 rounded-2xl bg-slate-900 text-[#C9A24D] flex items-center justify-center text-3xl mb-8">
                                        {feature.icon}
                                    </div>
                                    <Title level={3} className="!font-bold mb-6">{feature.title}</Title>
                                    <Paragraph className="text-slate-800 text-lg leading-relaxed">{feature.desc}</Paragraph>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                </div>
            </div>

            {/* Media Center CTA */}
            <div className="py-20 overflow-hidden relative" style={{ background: '#0a0a0a' }}>
                <div className="absolute inset-0">
                    <img src="/hero-bg.png" alt="" className="w-full h-full object-cover"
                        style={{ opacity: 0.5, filter: 'brightness(0.6) contrast(1.1)' }} />
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(10,10,10,0.5), rgba(10,10,10,0.7))' }} />
                </div>
                <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
                    <Title level={2} className="!text-white !text-3xl md:!text-5xl !font-black mb-6">
                        {t('common.media_center')}
                    </Title>
                    <Paragraph className="!text-white text-lg md:text-xl max-w-2xl mx-auto mb-10">
                        {t('common.media_center_subtitle')}
                    </Paragraph>
                    <Button
                        type="primary"
                        size="large"
                        className="border-none h-14 px-12 rounded-xl font-bold text-lg"
                        style={{ background: '#C9A24D', color: '#0a0a0a' }}
                        onClick={() => navigate('/media')}
                    >
                        {t('landing.visit_media_center')}
                        {isRtl ? <ArrowRightOutlined rotate={180} onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} /> : <ArrowRightOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
                    </Button>
                </div>
            </div>




            {/* WhatsApp */}
            <a
                href="https://wa.me/96597131223"
                target="_blank"
                rel="noreferrer"
                className="fixed bottom-8 right-8 z-50 bg-[#25D366] text-white w-16 h-16 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 duration-300"
            >
                <WhatsAppOutlined className="text-4xl" onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />
            </a>

            {/* YouTube */}
            <a
                href="https://youtube.com/@ashkananisport?si=yO4vK-zuSOC4Fu3e"
                target="_blank"
                rel="noreferrer"
                className="fixed bottom-8 right-28 z-50 bg-[#FF0000] text-white w-16 h-16 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 duration-300"
            >
                <YoutubeOutlined className="text-4xl" onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />
            </a>
        </div>
    );
};

export default LandingPage;
