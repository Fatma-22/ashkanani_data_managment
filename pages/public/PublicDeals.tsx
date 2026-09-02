import React, { useEffect, useState } from 'react';
import {
    Row, Col, Typography, Empty, Spin, Button, Card, Badge, Pagination, Select, Space, Statistic, Divider
} from 'antd';
import {
    TrophyOutlined,
    CalendarOutlined,
    SwapOutlined,
    UserOutlined,
    RiseOutlined
} from '@ant-design/icons';
import { Deal, Sport, UserRole } from '../../types';
import { dealService } from '../../services/dealService';
import apiClient from '../../services/api';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import LoadingScreen from '../../components/LoadingScreen';
import DynamicTranslate from '../../components/DynamicTranslate';
import dayjs from 'dayjs';
import publicService from '../../services/publicService';
import { useStickyState } from '../../utils/hooks';
import { useRef } from 'react';
import SEO from '../../components/SEO';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

export const PublicDeals: React.FC = () => {
    const { t, i18n } = useTranslation();
    const isAr = i18n.language === 'ar';
    const { user } = useAuth();

    const [deals, setDeals] = useState<Deal[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useStickyState(1, 'PublicDeals_page');
    const [pageSize, setPageSize] = useStickyState(12, 'PublicDeals_pageSize');
    const [selectedYear, setSelectedYear] = useStickyState<number | 'all'>('all', 'PublicDeals_selectedYear');
    const [yearStats, setYearStats] = useState<{ year: number; count: number }[]>([]);

    useEffect(() => {
        publicService.trackVisit(user?.role);
        loadStats();
    }, []);

    const prevYearRef = useRef<number | 'all' | null>(null);
    useEffect(() => {
        if (prevYearRef.current === null) {
            prevYearRef.current = selectedYear;
            return;
        }
        if (prevYearRef.current !== selectedYear) {
            setPage(1);
            prevYearRef.current = selectedYear;
        }
    }, [selectedYear]);

    useEffect(() => {
        loadDeals();
    }, [page, pageSize, selectedYear]);

    const loadStats = async () => {
        try {
            const res: any = await apiClient.get('/public/deals', { params: { per_page: 1000 } });
            const allDeals: Deal[] = res.data?.data || [];
            
            const statsMap: Record<number, number> = {};
            allDeals.forEach(deal => {
                const year = deal.dealDate ? dayjs(deal.dealDate).year() : 2024;
                statsMap[year] = (statsMap[year] || 0) + 1;
            });

            const sortedStats = Object.keys(statsMap)
                .map(year => ({ year: parseInt(year), count: statsMap[parseInt(year)] }))
                .sort((a, b) => b.year - a.year);
            
            setYearStats(sortedStats);
        } catch (error) {
            console.error('Error loading deal stats:', error);
        }
    };

    const loadDeals = async () => {
        setLoading(true);
        try {
            const params: any = {
                page,
                per_page: pageSize,
                year: selectedYear === 'all' ? undefined : selectedYear,
            };
            const res: any = await apiClient.get('/public/deals', { params });
            const dealsArray = res.data?.data || [];
            setDeals(dealsArray);
            setTotal(res.data?.meta?.total || dealsArray.length || 0);
        } catch (error) {
            console.error('Error loading deals:', error);
        } finally {
            setLoading(false);
        }
    };

    const availableYears = [2026, 2025, 2024, 2023, 2022, 2021, 2020];

    const DealCard: React.FC<{ deal: Deal }> = ({ deal }) => {
        const playerName = isAr 
            ? (deal.manualPlayerNameAr || deal.player?.nameAr || deal.player?.name || deal.manualPlayerName)
            : (deal.manualPlayerName || deal.player?.name || deal.player?.nameAr || deal.manualPlayerNameAr);
        
        const playerPhoto = (typeof deal.player?.mainPhoto === 'string' ? deal.player?.mainPhoto : deal.player?.mainPhoto?.url) 
            || deal.player?.photos?.find(p => p.isMain)?.url;
        const dealYear = deal.dealDate ? dayjs(deal.dealDate).year() : 2024;

        return (
            <motion.div
                whileHover={{ y: -10 }}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="h-full transition-all duration-300"
            >
                <Card 
                    className="h-full rounded-2xl overflow-hidden border-none shadow-xl hover:shadow-2xl transition-all duration-300"
                    styles={{ body: { padding: 0 } }}
                >
                    {/* Header with Player and Year */}
                    <div className="bg-[#1a1a1a] p-3 px-4 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <TrophyOutlined style={{ fontSize: 60, color: '#C9A24D' }} onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />
                        </div>
                        <div className="relative z-10 flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full border-2 border-[#C9A24D] overflow-hidden bg-[#3F3F3F] flex-shrink-0">
                                {playerPhoto ? (
                                    <img 
                                        src={playerPhoto} 
                                        alt={playerName || ''} 
                                        className="w-full h-full object-cover" 
                                        onError={(e) => {
                                            e.currentTarget.onerror = null;
                                            e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(playerName || 'P')}&background=1a1a1a&color=C9A24D&bold=true&length=1`;
                                        }}
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <img 
                                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(playerName || 'P')}&background=1a1a1a&color=C9A24D&bold=true&length=1`} 
                                            alt={playerName || ''} 
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                )}
                            </div>
                            <div>
                                <Title level={5} className="!text-white !mb-0 leading-tight">
                                    {playerName}
                                </Title>
                                <span className="bg-[#C9A24D] text-[#1a1a1a] text-[11px] font-bold px-3 py-1 rounded-full shadow-sm">
                                    {dealYear}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Transfer Logic */}
                    <div className="p-4 bg-white flex-1 flex flex-col justify-between">
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center justify-between gap-1 p-2 bg-gray-50 rounded-xl border border-gray-100">
                                <div className="flex-1 text-center min-h-[40px] flex flex-col justify-center">
                                    <Text type="secondary" className="block text-[10px] uppercase font-bold mb-1">{t('public_deals.transfer_from')}</Text>
                                    <Text strong className="text-xs sm:text-sm block text-[#3F3F3F] leading-tight">
                                        {deal.fromClub || '-'}
                                    </Text>
                                </div>
                                <div className="flex items-center justify-center px-1">
                                    <div className="bg-[#C9A24D] p-1.5 rounded-full shadow-lg shadow-[#C9A24D]/20">
                                        <SwapOutlined className="text-white text-base" onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />
                                    </div>
                                </div>
                                <div className="flex-1 text-center min-h-[40px] flex flex-col justify-center">
                                    <Text type="secondary" className="block text-[10px] uppercase font-bold mb-1">{t('public_deals.transfer_to')}</Text>
                                    <Text strong className="text-xs sm:text-sm block text-[#C9A24D] leading-tight">
                                        {deal.toClub || '-'}
                                    </Text>
                                </div>
                            </div>
                            
                            <Divider className="!m-0 opacity-50" />
                            
                            <div className="flex justify-center items-center">
                                {deal.amount && (
                                    <Text className="text-[#C9A24D] font-black text-sm">
                                        {deal.amount.toLocaleString()} {deal.currency || '$'}
                                    </Text>
                                )}
                            </div>
                        </div>
                    </div>
                </Card>
            </motion.div>
        );
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-20">
            <SEO 
                title={t('public_deals.title')}
                description={t('public_deals.subtitle')}
                keywords="football transfer deals, player contracts, sports negotiations, Ashkanani Sport success"
            />
            {/* Elegant Hero Header */}
            <div className="relative bg-[#0a0a0a] overflow-hidden pt-32 pb-24 mb-12">
                <div className="absolute inset-0">
                    <img src="/hero-bg.png" alt="" className="w-full h-full object-cover opacity-30" />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0a0a0a]/50 to-[#0a0a0a]" />
                </div>
                <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                        <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-[#C9A24D]/10 border border-[#C9A24D]/30 mb-8 backdrop-blur-sm">
                            <TrophyOutlined className="text-[#C9A24D]" onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />
                            <span className="text-[#C9A24D] font-black text-[10px] md:text-xs uppercase tracking-[0.2em]">{t('admin.deals.title')}</span>
                        </div>
                        <Title level={1} className="!text-white !font-black !m-0 !leading-tight !text-4xl md:!text-7xl">
                            {t('public_deals.title')}
                        </Title>
                        <Paragraph className="!text-gray-400 max-w-2xl mx-auto mt-6 text-base md:text-lg">
                            {t('public_deals.subtitle')}
                        </Paragraph>
                    </motion.div>
                </div>
            </div>

            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
                {/* Year Selection & Stats */}
                <Card className="rounded-3xl border-none shadow-sm mb-12 overflow-hidden bg-white/80 backdrop-blur-md">
                    <Row gutter={[32, 32]} align="middle">
                        <Col xs={24} md={12}>
                            <Title level={4} className="!mb-6 flex items-center gap-2">
                                <RiseOutlined className="text-[#C9A24D]" onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />
                                {t('public_deals.stats_title')}
                            </Title>
                            <div className="flex flex-wrap gap-4">
                                <Button 
                                    onClick={() => setSelectedYear('all')}
                                    type={selectedYear === 'all' ? 'primary' : 'default'}
                                    className={`h-12 px-6 rounded-xl font-bold transition-all ${selectedYear === 'all' ? 'bg-[#C9A24D] border-none shadow-lg' : 'hover:border-[#C9A24D] hover:text-[#C9A24D]'}`}
                                >
                                    {t('public_deals.all_years')}
                                </Button>
                                {yearStats.map(stat => (
                                    <Button
                                        key={stat.year}
                                        onClick={() => setSelectedYear(stat.year)}
                                        className={`h-12 px-6 rounded-xl font-bold transition-all relative ${selectedYear === stat.year ? 'bg-[#3F3F3F] text-white border-none shadow-lg' : 'hover:border-[#C9A24D] hover:text-[#C9A24D]'}`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <span>{stat.year}</span>
                                            <Badge 
                                                count={stat.count} 
                                                style={{ backgroundColor: selectedYear === stat.year ? '#C9A24D' : '#F0F0F0', color: selectedYear === stat.year ? '#1a1a1a' : '#8C8C8C' }} 
                                            />
                                        </div>
                                    </Button>
                                ))}
                            </div>
                        </Col>
                        
                        <Col xs={24} md={12} className="flex md:justify-end">
                            <div className="grid grid-cols-2 gap-8 p-6 bg-gray-50 rounded-3xl border border-gray-100">
                                <Statistic 
                                    title={<span className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">{t('admin.deals.total_deals')}</span>}
                                    value={total}
                                    valueStyle={{ color: '#1a1a1a', fontWeight: 900, fontSize: '2.5rem' }}
                                    suffix={<span className="text-[#C9A24D] text-xs font-black">{t('public_deals.deals_count')}</span>}
                                />
                                <div className="h-16 w-16 bg-[#C9A24D]/10 rounded-full flex items-center justify-center">
                                    <TrophyOutlined style={{ fontSize: 32, color: '#C9A24D' }} onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />
                                </div>
                            </div>
                        </Col>
                    </Row>
                </Card>

                {/* Grid */}
                {loading ? (
                    <div className="py-20 text-center">
                        <Spin size="large" />
                    </div>
                ) : (
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={selectedYear}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
                        >
                            {deals.length === 0 ? (
                                <div className="col-span-full py-20 text-center">
                                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('public_deals.no_deals')} />
                                </div>
                            ) : (
                                deals.map(deal => (
                                    <DealCard key={deal.id} deal={deal} />
                                ))
                            )}
                        </motion.div>
                    </AnimatePresence>
                )}

                {/* Pagination */}
                <div className="mt-20 flex justify-center">
                    <Pagination
                        current={page}
                        pageSize={pageSize}
                        total={total}
                        onChange={(p, ps) => { setPage(p); if (ps !== pageSize) setPageSize(ps); }}
                        className="premium-pagination"
                    />
                </div>
            </div>

            <style>{`
                .premium-pagination .ant-pagination-item-active { border-color: #C9A24D !important; background: #C9A24D !important; }
                .premium-pagination .ant-pagination-item-active a { color: white !important; }
                .premium-pagination .ant-pagination-item:hover { border-color: #C9A24D !important; }
                .premium-pagination .ant-pagination-item:hover a { color: #C9A24D !important; }
            `}</style>
        </div>
    );
};

export default PublicDeals;
