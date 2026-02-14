import React from 'react';
import { Typography, Button, Row, Col, Card } from 'antd';
import { ArrowRightOutlined, StarFilled, TrophyFilled, TeamOutlined, GlobalOutlined, RocketFilled, SafetyCertificateFilled, WhatsAppOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, Variants } from 'framer-motion';

const { Title, Text, Paragraph } = Typography;

export const LandingPage: React.FC = () => {
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    const isRtl = i18n.language === 'ar';

    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2
            }
        }
    };

    const itemVariants: Variants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.6,
                ease: "easeOut"
            }
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 overflow-x-hidden">
            {/* Hero Section */}
            <div className="relative bg-[#1a1a1a] text-white min-h-[90vh] flex items-center justify-center overflow-hidden">
                {/* Abstract Background */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-24 -right-24 w-[600px] h-[600px] bg-[#C9A24D] opacity-10 rounded-full blur-[100px]" />
                    <div className="absolute -bottom-24 -left-24 w-[600px] h-[600px] bg-[#C9A24D] opacity-5 rounded-full blur-[100px]" />
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5" />
                </div>

                <div className="relative z-10 max-w-7xl mx-auto px-6 w-full">
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="text-center"
                    >
                        <motion.div variants={itemVariants} className="inline-block mb-6">
                            <span className="px-4 py-2 rounded-full bg-[#C9A24D]/10 border border-[#C9A24D]/30 text-[#C9A24D] font-bold tracking-widest uppercase text-xs md:text-sm backdrop-blur-sm">
                                {t('landing.premium_agency')}
                            </span>
                        </motion.div>

                        <motion.div variants={itemVariants}>
                            <Title level={1} className="!text-5xl md:!text-7xl !font-black mb-6 !leading-tight text-white tracking-tight">
                                {t('landing.hero_title_1')}
                                <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#C9A24D] to-[#F2D07E]">
                                    {t('landing.hero_title_2')}
                                </span>
                            </Title>
                        </motion.div>

                        <motion.div variants={itemVariants}>
                            <Paragraph className="text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed text-gray-400 font-light">
                                {t('landing.hero_subtitle')}
                            </Paragraph>
                        </motion.div>

                        <motion.div variants={itemVariants} className="flex justify-center gap-4 flex-wrap">
                            <Button
                                type="primary"
                                size="large"
                                className="bg-[#C9A24D] hover:!bg-[#B68F3F] border-none h-14 px-10 rounded-full text-lg font-bold shadow-lg shadow-[#C9A24D]/20 flex items-center gap-2 transform hover:scale-105 transition-all duration-300"
                                onClick={() => navigate('/players')}
                            >
                                {t('landing.cta_primary')}
                                {isRtl ? <ArrowRightOutlined rotate={180} onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} /> : <ArrowRightOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
                            </Button>
                            <Button
                                size="large"
                                className="bg-white/5 border-white/10 text-white hover:!bg-white/10 hover:!border-[#C9A24D]/50 hover:!text-[#C9A24D] h-14 px-10 rounded-full text-lg font-bold backdrop-blur-sm transition-all duration-300"
                                onClick={() => navigate('/login')}
                            >
                                {t('landing.cta_secondary')}
                            </Button>
                        </motion.div>
                    </motion.div>
                </div>
            </div>

            {/* Statistics Section - Floating Card */}
            <div className="max-w-7xl mx-auto px-6 -mt-24 relative z-20">
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="bg-white rounded-3xl shadow-2xl shadow-black/5 p-8 md:p-12 border border-gray-100"
                >
                    <Row gutter={[24, 24]} justify="center">
                        {[
                            { icon: <TeamOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />, value: '+150', label: 'landing.stats_players' },
                            { icon: <GlobalOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />, value: '12', label: 'landing.stats_countries' },
                            { icon: <TrophyFilled onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />, value: '$450M', label: 'landing.stats_value' },
                            { icon: <StarFilled onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />, value: '25', label: 'landing.stats_awards' },
                        ].map((stat, index) => (
                            <Col key={index} xs={12} md={6}>
                                <div className="text-center group p-4 rounded-xl hover:bg-slate-50 transition-colors duration-300">
                                    <div className="text-4xl text-[#C9A24D] mb-4 opacity-80 group-hover:scale-110 group-hover:opacity-100 transition-all duration-300">
                                        {stat.icon}
                                    </div>
                                    <div className="text-3xl font-black text-[#3F3F3F] mb-1 font-mono tracking-tighter">{stat.value}</div>
                                    <div className="text-slate-400 font-bold uppercase tracking-widest text-[10px] md:text-xs">
                                        {t(stat.label)}
                                    </div>
                                </div>
                            </Col>
                        ))}
                    </Row>
                </motion.div>
            </div>

            {/* Features Section */}
            <div className="py-24 bg-slate-50 relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-6">
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="text-center mb-16"
                    >
                        <Text className="text-[#C9A24D] font-bold tracking-[0.2em] uppercase block mb-3">{t('landing.why_us')}</Text>
                        <Title level={2} className="text-[#3F3F3F] !text-4xl md:!text-5xl font-black m-0 tracking-tight">
                            {t('landing.features_title')}
                        </Title>
                    </motion.div>

                    <Row gutter={[32, 32]}>
                        {[
                            {
                                icon: <RocketFilled onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />,
                                title: 'landing.feat_1_title',
                                desc: 'landing.feat_1_desc',
                                delay: 0
                            },
                            {
                                icon: <SafetyCertificateFilled onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />,
                                title: 'landing.feat_2_title',
                                desc: 'landing.feat_2_desc',
                                delay: 0.2
                            },
                            {
                                icon: <GlobalOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />,
                                title: 'landing.feat_3_title',
                                desc: 'landing.feat_3_desc',
                                delay: 0.4
                            }
                        ].map((feature, index) => (
                            <Col key={index} xs={24} md={12} lg={8}>
                                <motion.div
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.6, delay: feature.delay }}
                                >
                                    <Card className="h-full border-none shadow-lg hover:shadow-2xl transition-all duration-500 bg-white rounded-2xl overflow-hidden group">
                                        <div className="p-4">
                                            <div className="w-16 h-16 rounded-2xl bg-[#3F3F3F] text-[#C9A24D] flex items-center justify-center text-3xl mb-6 shadow-lg shadow-[#3F3F3F]/30 group-hover:rotate-6 transition-transform duration-300">
                                                {feature.icon}
                                            </div>
                                            <Title level={4} className="text-[#3F3F3F] mb-4 !font-bold group-hover:text-[#C9A24D] transition-colors">
                                                {t(feature.title)}
                                            </Title>
                                            <Paragraph className="text-slate-500 mb-0 leading-relaxed text-base">
                                                {t(feature.desc)}
                                            </Paragraph>
                                        </div>
                                    </Card>
                                </motion.div>
                            </Col>
                        ))}
                    </Row>
                </div>
            </div>

            {/* WhatsApp Floating Button */}
            <a
                href="https://wa.me/96597131223"
                target="_blank"
                rel="noreferrer"
                className="fixed bottom-8 right-8 z-50 bg-[#25D366] hover:bg-[#128C7E] text-white w-16 h-16 rounded-full shadow-2xl hover:shadow-green-500/30 transition-all duration-300 flex items-center justify-center group hover:-translate-y-1"
                title="Contact us on WhatsApp"
            >
                <WhatsAppOutlined className="text-4xl" onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />
            </a>
        </div>
    );
};
