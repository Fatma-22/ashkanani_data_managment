import React, { useEffect, useState, useMemo } from 'react';
import { Typography, Row, Col, Card, Spin, Empty, Button, Tabs, Pagination, Badge, Divider } from 'antd';
const { Title, Paragraph, Text } = Typography;
import { 
    GlobalOutlined, 
    ArrowLeftOutlined, 
    StarFilled, 
    TrophyFilled, 
    CrownFilled, 
    SafetyCertificateFilled, 
    TeamOutlined,
    RightOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { publicService } from '../../services/publicService';
import { Sponsor } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import SEO from '../../components/SEO';

const TIER_CONFIG: Record<string, { icon: React.ReactNode, color: string, labelAr: string, labelEn: string }> = {
    'diamond': { icon: <CrownFilled onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />, color: '#B9F2FF', labelAr: 'الراعي الماسي', labelEn: 'Diamond Sponsor' },
    'gold': { icon: <TrophyFilled onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />, color: '#FFD700', labelAr: 'الراعي الذهبي', labelEn: 'Gold Sponsor' },
    'silver': { icon: <SafetyCertificateFilled onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />, color: '#C0C0C0', labelAr: 'الراعي الفضي', labelEn: 'Silver Sponsor' },
    'partner': { icon: <TeamOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />, color: '#52C41A', labelAr: 'شريك استراتيجي', labelEn: 'Strategic Partner' },
    'legal': { icon: <SafetyCertificateFilled onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />, color: '#000000', labelAr: 'شريك قانوني', labelEn: 'Legal Partner' },
};

export const PublicSponsors: React.FC = () => {
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    const isAr = i18n.language === 'ar';
    const [sponsors, setSponsors] = useState<Sponsor[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<string>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 12;

    useEffect(() => {
        publicService.getLandingPageData().then(res => {
            setSponsors(res.sponsors || []);
        }).catch(err => {
            console.error('Failed to fetch sponsors', err);
        }).finally(() => {
            setLoading(false);
        });
    }, []);

    const filteredSponsors = useMemo(() => {
        if (activeTab === 'all') return sponsors;
        return sponsors.filter(s => s.tier === activeTab);
    }, [sponsors, activeTab]);

    const paginatedSponsors = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredSponsors.slice(start, start + pageSize);
    }, [filteredSponsors, currentPage]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-[#0a0a0a]">
                <Spin size="large" />
            </div>
        );
    }

    const tabItems = [
        { key: 'all', label: isAr ? 'جميع الفئات' : 'All Tiers' },
        ...Object.entries(TIER_CONFIG).map(([key, config]) => ({
            key,
            label: isAr ? config.labelAr : config.labelEn,
        }))
    ];

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-20">
            <SEO 
                title={t('common.official_sponsors')}
                description={isAr ? 'نفخر بالتعاون مع كبرى الشركات والجهات الرياضية عالمياً' : 'We take pride in collaborating with leading companies and sports entities worldwide'}
                keywords="sports sponsors, athletic partners, sports marketing, Ashkanani Sport partners"
            />
            {/* Elegant Hero Header */}
            <div className="relative bg-[#0a0a0a] pt-32 pb-48 overflow-hidden">
                <div className="absolute inset-0">
                    <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] via-transparent to-[#F8FAFC]" />
                </div>
                
                <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }} 
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center"
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#C9A24D]/10 border border-[#C9A24D]/20 mb-8">
                            <StarFilled className="text-[#C9A24D]" onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />
                            <span className="text-[#C9A24D] text-xs font-black uppercase tracking-[0.2em]">
                                {t('common.success_partners')}
                            </span>
                        </div>
                        <Title level={1} className="!text-[#C9A24D] !font-black !m-0 !leading-tight !text-4xl md:!text-6xl lg:!text-8xl">
                            {t('common.official_sponsors')}
                        </Title>
                        <Paragraph className="!text-[#C9A24D]/60 max-w-2xl mx-auto mt-8 text-sm md:text-lg font-medium leading-relaxed">
                            {isAr ? 'نفخر بالتعاون مع كبرى الشركات والجهات الرياضية عالمياً لتقديم أفضل الفرص لرياضيينا' : 'We take pride in collaborating with leading companies and sports entities worldwide to provide the best opportunities for our athletes'}
                        </Paragraph>
                    </motion.div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 -mt-12 relative z-20">
                {/* Search & Filter Bar */}
                <Card className="rounded-3xl border-none shadow-xl mb-24 overflow-hidden bg-white/90 backdrop-blur-md">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <Tabs 
                            activeKey={activeTab} 
                            onChange={(key) => { setActiveTab(key); setCurrentPage(1); }}
                            items={tabItems}
                            className="premium-tabs flex-1"
                        />
                        <div className="hidden md:flex flex-col items-end">
                            <Text className="text-gray-400 text-[10px] uppercase font-black tracking-widest">{t('common.total')}</Text>
                            <Text className="text-2xl font-black text-[#1a1a1a]">{filteredSponsors.length}</Text>
                        </div>
                    </div>
                </Card>

                {paginatedSponsors.length === 0 ? (
                    <div className="py-20 text-center bg-white rounded-3xl shadow-sm border border-gray-100">
                        <Empty description={isAr ? 'لا يوجد رعاة في هذه الفئة حالياً' : 'No sponsors found in this category'} />
                    </div>
                ) : (
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab + currentPage}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.3 }}
                            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mt-16"
                        >
                            {paginatedSponsors.map((sponsor, index) => {
                                const tierInfo = sponsor.tier ? TIER_CONFIG[sponsor.tier] : TIER_CONFIG['partner'];
                                return (
                                    <motion.div
                                        key={sponsor.id}
                                        whileHover={{ y: -10 }}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        onClick={() => navigate(`/sponsors/${sponsor.id}`)}
                                    >
                                        <Card
                                            hoverable
                                            className="h-full rounded-2xl overflow-hidden border-none shadow-xl hover:shadow-2xl transition-all duration-500 bg-white group"
                                            styles={{ body: { padding: '24px' } }}
                                        >
                                            <div className="flex flex-col items-center">
                                                {/* Tier Bagde */}
                                                <div className="absolute top-4 right-4 z-10">
                                                    <Badge 
                                                        count={isAr ? tierInfo.labelAr : tierInfo.labelEn} 
                                                        style={{ backgroundColor: tierInfo.color, color: '#1a1a1a', fontWeight: 'bold', fontSize: '10px' }}
                                                    />
                                                </div>

                                                <div className="w-full aspect-square bg-[#f8f9fa] rounded-2xl flex items-center justify-center p-6 mb-6 group-hover:bg-[#f1f3f5] transition-colors duration-500 relative">
                                                    <img 
                                                        alt={isAr ? sponsor.name_ar : sponsor.name_en} 
                                                        src={sponsor.logo_url} 
                                                        className="max-h-full max-w-full object-contain filter drop-shadow-md group-hover:scale-110 transition-transform duration-500"
                                                    />
                                                    <div className="absolute bottom-2 right-2 opacity-20 group-hover:opacity-100 transition-opacity duration-500">
                                                        <span style={{ color: tierInfo.color, fontSize: '24px' }}>
                                                            {tierInfo.icon}
                                                        </span>
                                                    </div>
                                                </div>
                                                
                                                <Title level={4} className="!font-black !m-0 mb-6 text-center text-[#1a1a1a] group-hover:text-[#C9A24D] transition-colors leading-relaxed">
                                                    {isAr ? sponsor.name_ar : sponsor.name_en}
                                                </Title>
                                                
                                                <div className="w-full pt-4 border-t border-gray-100 flex items-center justify-between group-hover:border-[#C9A24D]/20 transition-colors">
                                                    <Text className="text-[10px] text-gray-400 font-bold uppercase tracking-widest group-hover:text-[#C9A24D]">
                                                        {isAr ? 'استعراض التفاصيل' : 'View Details'}
                                                    </Text>
                                                    <div className="h-8 w-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-[#C9A24D] group-hover:text-white transition-all duration-300">
                                                        <RightOutlined rotate={isAr ? 180 : 0} onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />
                                                    </div>
                                                </div>
                                            </div>
                                        </Card>
                                    </motion.div>
                                );
                            })}
                        </motion.div>
                    </AnimatePresence>
                )}

                {/* Pagination */}
                <div className="mt-20 flex justify-center">
                    <Pagination
                        current={currentPage}
                        pageSize={pageSize}
                        total={filteredSponsors.length}
                        onChange={(page) => setCurrentPage(page)}
                        className="premium-pagination shadow-xl p-4 bg-white rounded-2xl"
                        showSizeChanger={false}
                    />
                </div>
            </div>

            <style>{`
                .premium-tabs .ant-tabs-nav::before { border-bottom: none !important; }
                .premium-tabs .ant-tabs-tab { padding: 4px 0 !important; margin-right: 48px !important; }
                .premium-tabs .ant-tabs-tab:last-child { margin-right: 0 !important; }
                .premium-tabs .ant-tabs-tab-btn { font-weight: 900 !important; color: #BFBFBF !important; font-size: 14px !important; text-transform: uppercase; letter-spacing: 0.1em; transition: all 0.3s !important; }
                .premium-tabs .ant-tabs-tab-active .ant-tabs-tab-btn { color: #1a1a1a !important; }
                .premium-tabs .ant-tabs-ink-bar { background: #C9A24D !important; height: 4px !important; border-radius: 4px; bottom: -2px !important; }
                
                [dir='rtl'] .premium-tabs .ant-tabs-tab { margin-left: 48px !important; margin-right: 0 !important; }
                [dir='rtl'] .premium-tabs .ant-tabs-tab:last-child { margin-left: 0 !important; }
                
                .premium-pagination .ant-pagination-item-active { border-color: #C9A24D !important; background: #C9A24D !important; }
                .premium-pagination .ant-pagination-item-active a { color: white !important; }
                .premium-pagination .ant-pagination-item:hover { border-color: #C9A24D !important; }
                .premium-pagination .ant-pagination-item:hover a { color: #C9A24D !important; }
            `}</style>
        </div>
    );
};

export default PublicSponsors;
