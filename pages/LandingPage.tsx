import React from 'react';
import { Typography, Button, Row, Col, Space, Card } from 'antd';
import { ArrowRightOutlined, StarFilled, TrophyFilled, TeamOutlined, GlobalOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const { Title, Text, Paragraph } = Typography;

export const LandingPage: React.FC = () => {
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    const isRtl = i18n.language === 'ar';

    return (
        <div className="fade-in">
            {/* Hero Section */}
            <div className="relative overflow-hidden bg-[#3F3F3F] text-white py-20 md:py-32 px-6 rounded-3xl mb-16 shadow-2xl">
                {/* Abstract Background Shapes */}
                <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-[#C9A24D] opacity-10 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-black opacity-20 rounded-full blur-3xl pointer-events-none"></div>

                <div className="relative z-10 max-w-7xl mx-auto text-center">
                    <div className="inline-block mb-4 px-4 py-1.5 rounded-full bg-[#C9A24D] bg-opacity-20 border border-[#C9A24D] border-opacity-30 backdrop-blur-sm">
                        <Text className="text-[#C9A24D] font-bold tracking-widest uppercase text-xs md:text-sm">
                            {t('landing.premium_agency', { defaultValue: 'OFFICIAL PLAYER DIRECTORY' })}
                        </Text>
                    </div>

                    <Title level={1} className="!text-4xl md:!text-6xl !font-black mb-6 !leading-tight" style={{ color: 'white' }}>
                        {t('landing.hero_title_1', { defaultValue: 'ASHKANANI SPORT' })}
                        <br />
                        <span style={{ color: '#C9A24D' }}>
                            {t('landing.hero_title_2', { defaultValue: 'CONTRACTED PLAYERS' })}
                        </span>
                    </Title>

                    <Paragraph className="text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed font-medium" style={{ color: '#E0E0E0' }}>
                        {t('landing.hero_subtitle', { defaultValue: 'Browse our exclusive roster of professional athletes.' })}
                    </Paragraph>

                    <div className="flex justify-center gap-4 flex-wrap">
                        <Button
                            type="primary"
                            size="large"
                            className="bg-[#C9A24D] hover:!bg-[#B68F3F] border-none h-14 px-8 rounded-full text-lg font-bold shadow-lg shadow-[#C9A24D]/20 flex items-center gap-2"
                            onClick={() => navigate('/players')}
                        >
                            {t('landing.cta_primary', { defaultValue: 'Browse Directory' })}
                            {isRtl ? <ArrowRightOutlined rotate={180} onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} /> : <ArrowRightOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
                        </Button>
                        <Button
                            size="large"
                            className="bg-transparent border-2 border-white/20 text-white hover:!border-[#C9A24D] hover:!text-[#C9A24D] h-14 px-8 rounded-full text-lg font-bold backdrop-blur-sm"
                            onClick={() => navigate('/login')}
                        >
                            {t('landing.cta_secondary', { defaultValue: 'Admin Login' })}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Stats / Trust Section */}
            <div className="max-w-7xl mx-auto px-6 mb-24">
                <Row gutter={[24, 24]} justify="center">
                    {[
                        { icon: <TeamOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />, value: '+150', label: 'landing.stats_players', defaultLabel: 'Pro Players' },
                        { icon: <GlobalOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />, value: '12', label: 'landing.stats_countries', defaultLabel: 'Countries' },
                        { icon: <TrophyFilled onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />, value: '$450M', label: 'landing.stats_value', defaultLabel: 'Market Value' },
                        { icon: <StarFilled onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />, value: '25', label: 'landing.stats_awards', defaultLabel: 'Major Awards' },
                    ].map((stat, index) => (
                        <Col key={index} xs={12} md={6}>
                            <Card className="text-center border-none shadow-sm hover:shadow-md transition-all duration-300 bg-white group hover:-translate-y-1">
                                <div className="text-4xl text-[#C9A24D] mb-4 opacity-80 group-hover:scale-110 transition-transform duration-300">
                                    {stat.icon}
                                </div>
                                <div className="text-3xl font-black text-[#3F3F3F] mb-1">{stat.value}</div>
                                <div className="text-slate-400 font-bold uppercase tracking-wider text-xs">{t(stat.label, { defaultValue: stat.defaultLabel })}</div>
                            </Card>
                        </Col>
                    ))}
                </Row>
            </div>

            {/* Featured Features Section */}
            <div className="max-w-7xl mx-auto px-6 mb-24">
                <div className="text-center mb-16">
                    <Text className="text-[#C9A24D] font-bold tracking-widest uppercase block mb-2">{t('landing.why_us', { defaultValue: 'WHY CHOOSE US' })}</Text>
                    <Title level={2} className="text-[#3F3F3F] !text-3xl md:!text-4xl font-black m-0">
                        {t('landing.features_title', { defaultValue: 'Elevating Sports Management' })}
                    </Title>
                </div>

                <Row gutter={[40, 40]}>
                    <Col xs={24} md={12} lg={8}>
                        <div className="p-8 rounded-2xl bg-slate-50 hover:bg-white hover:shadow-xl transition-all duration-300 h-full border border-slate-100">
                            <div className="w-14 h-14 rounded-xl bg-[#3F3F3F] text-[#C9A24D] flex items-center justify-center text-2xl mb-6 shadow-lg shadow-[#3F3F3F]/20">
                                <StarFilled onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />
                            </div>
                            <Title level={4} className="text-[#3F3F3F] mb-4">{t('landing.feat_1_title', { defaultValue: 'Elite Talent Scouting' })}</Title>
                            <Paragraph className="text-slate-500 mb-0">
                                {t('landing.feat_1_desc', { defaultValue: 'Our global network of scouts identifies potential stars early, ensuring we represent the future of the sport.' })}
                            </Paragraph>
                        </div>
                    </Col>
                    <Col xs={24} md={12} lg={8}>
                        <div className="p-8 rounded-2xl bg-slate-50 hover:bg-white hover:shadow-xl transition-all duration-300 h-full border border-slate-100">
                            <div className="w-14 h-14 rounded-xl bg-[#3F3F3F] text-[#C9A24D] flex items-center justify-center text-2xl mb-6 shadow-lg shadow-[#3F3F3F]/20">
                                <TrophyFilled onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />
                            </div>
                            <Title level={4} className="text-[#3F3F3F] mb-4">{t('landing.feat_2_title', { defaultValue: 'Career Management' })}</Title>
                            <Paragraph className="text-slate-500 mb-0">
                                {t('landing.feat_2_desc', { defaultValue: 'From contract negotiations to brand building, we provide 360-degree management for our athletes.' })}
                            </Paragraph>
                        </div>
                    </Col>
                    <Col xs={24} md={12} lg={8}>
                        <div className="p-8 rounded-2xl bg-slate-50 hover:bg-white hover:shadow-xl transition-all duration-300 h-full border border-slate-100">
                            <div className="w-14 h-14 rounded-xl bg-[#3F3F3F] text-[#C9A24D] flex items-center justify-center text-2xl mb-6 shadow-lg shadow-[#3F3F3F]/20">
                                <GlobalOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />
                            </div>
                            <Title level={4} className="text-[#3F3F3F] mb-4">{t('landing.feat_3_title', { defaultValue: 'Global Reach' })}</Title>
                            <Paragraph className="text-slate-500 mb-0">
                                {t('landing.feat_3_desc', { defaultValue: 'With connections in top leagues worldwide, we create opportunities across borders and continents.' })}
                            </Paragraph>
                        </div>
                    </Col>
                </Row>
            </div>
        </div>
    );
};
