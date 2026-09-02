import React, { useEffect, useState } from 'react';
import {
    Row, Col, Typography, Empty, Spin, Button, Badge, Card, Pagination
} from 'antd';
import {
    PlusCircleOutlined,
    TeamOutlined
} from '@ant-design/icons';
import { Player, PlayerFilters, UserRole } from '../../types';
import { playerService } from '../../services/playerService';
import { useNavigate } from 'react-router-dom';
import PlayerCard from '../../components/PlayerCard';
import SearchFilters from '../../components/SearchFilters';
import { metaService } from '../../services/metaService';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import LoadingScreen from '../../components/LoadingScreen';
import { useAuth } from '../../context/AuthContext';
import profileService from '../../services/profileService';
import publicService from '../../services/publicService';import { useStickyState } from '../../utils/hooks';
import SEO from '../../components/SEO';

const { Title, Paragraph } = Typography;

export const PublicDirectory: React.FC = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const { user } = useAuth();
    
    const [filters, setFilters] = useStickyState<PlayerFilters>({}, 'PublicDirectory_filters');
    const [players, setPlayers] = useState<Player[]>([]);
    const [loading, setLoading] = useState(true);
    const [initialLoading, setInitialLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useStickyState(1, 'PublicDirectory_page');
    const [pageSize, setPageSize] = useStickyState(8, 'PublicDirectory_pageSize');
    
    const [userCVFound, setUserCVFound] = useState(false);
    const [checkingCV, setCheckingCV] = useState(false);
    const [nationalities, setNationalities] = useState<any[]>([]);

    useEffect(() => {
        publicService.trackVisit(user?.role);
    }, [user]);

    useEffect(() => {
        // Check if current user has a CV
        const nid = user?.nationalId || (user as any)?.national_id;
        if (user && nid) {
            setCheckingCV(true);
            profileService.getMyCV(nid)
                .then(cv => setUserCVFound(!!cv))
                .catch(() => setUserCVFound(false))
                .finally(() => setCheckingCV(false));
        } else {
            setUserCVFound(false);
            setCheckingCV(false);
        }
    }, [user]);

    useEffect(() => {
        metaService.getNationalities().then(setNationalities).catch(() => setNationalities([]));
    }, []);

    const prevFiltersStr = React.useRef<string | null>(null);
    useEffect(() => {
        const currentStr = JSON.stringify(filters);
        if (prevFiltersStr.current === null) {
            prevFiltersStr.current = currentStr;
            return;
        }
        if (prevFiltersStr.current !== currentStr) {
            setPage(1); 
            prevFiltersStr.current = currentStr;
        }
    }, [filters]);

    useEffect(() => {
        const loadPlayers = async () => {
            setLoading(true);
            try {
                const res = await playerService.getAll({ ...filters, isApproved: true, isVisible: true, public_view: true } as any, page, pageSize);
                const normalized = (res.players || []).map((p: any) => ({
                    ...p,
                    nameAr: p.name_ar || p.nameAr,
                    nationalityAr: p.nationality_ar || p.nationalityAr,
                    clubAr: p.club_ar || p.clubAr,
                }));
                setPlayers(normalized);
                setTotal(res.total !== undefined ? res.total : normalized.length);
            } catch (error) {
                console.error('Error loading directory:', error);
            } finally { 
                setLoading(false); 
                setInitialLoading(false);
            }
        };
        loadPlayers();
    }, [filters, page, pageSize]);

    const renderGrid = (list: any[], isLoading: boolean) => (
        <div className="relative min-h-[400px]">
            {isLoading && list.length > 0 && (
                <div className="absolute inset-0 bg-white/60 z-20 flex items-center justify-center rounded-3xl backdrop-blur-sm">
                    <Spin size="large" />
                </div>
            )}
            <AnimatePresence mode="wait">
                {isLoading && list.length === 0 ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-20 text-center">
                        <Spin size="large" tip={t('common.loading')} />
                    </motion.div>
                ) : list.length === 0 && !isLoading ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-20 text-center">
                        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-3 gap-y-8 md:gap-x-6 md:gap-y-12"
                    >
                        {list.map((player) => (
                            <PlayerCard 
                                key={player.id} 
                                player={player} 
                                variant="grid" 
                                showActions={false}
                                onClick={() => {
                                    if (!user) {
                                        navigate('/login', { state: { from: `/players/${player.id}` } });
                                        return;
                                    }
                                    navigate(`/players/${player.id}`);
                                }} 
                            />
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#f8fafc] pb-20 overflow-x-hidden">
            <SEO 
                title={t('common.players')}
                description={t('players.directory_subtitle')}
                keywords="football players directory, soccer agents, sports scouting, Ashkanani Sport"
            />
            {initialLoading && <LoadingScreen />}

            {/* Hero */}
            <div className="relative bg-[#0a0a0a] overflow-hidden pt-32 pb-24 mb-16">
                <div className="absolute inset-0">
                    <img src="/hero-bg.png" alt="" className="w-full h-full object-cover opacity-60" style={{ filter: 'brightness(0.7) contrast(1.1)' }} />
                    <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a]/60 via-transparent to-transparent" />
                </div>
                <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                        <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-[#C9A24D]/10 border border-[#C9A24D]/30 mb-8 backdrop-blur-sm">
                            <TeamOutlined className="text-[#C9A24D]" onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />
                            <span className="text-[#C9A24D] font-black text-[10px] md:text-xs uppercase tracking-[0.2em]">{t('common.players')}</span>
                        </div>
                        <Title level={1} className="!text-white !font-black !m-0 !leading-tight !text-3xl md:!text-7xl">
                            {t('players.directory_title', { defaultValue: 'Player Directory' })}
                        </Title>
                        <Paragraph className="!text-[#C9A24D] max-w-2xl mx-auto mt-6 text-base md:text-2xl font-bold italic opacity-95">
                            {t('players.directory_subtitle', { defaultValue: 'Discover our talented roster of professional players' })}
                        </Paragraph>
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }} className="mt-12">
                            <Button type="primary"
                                icon={<PlusCircleOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
                                loading={checkingCV}
                                onClick={() => { 
                                    if (!user) {
                                        navigate('/login', { state: { from: '/profile', openCV: true } });
                                    } else {
                                        navigate('/profile', { state: { openCV: true } });
                                    }
                                }}
                                className="h-16 px-12 rounded-2xl bg-[#C9A24D] border-none font-black text-lg uppercase tracking-wider shadow-2xl shadow-[#C9A24D]/30 flex items-center mx-auto transition-transform hover:scale-105 active:scale-95">
                                {userCVFound ? t('profile.update_cv') : t('directory.add_cv_btn')}
                            </Button>
                        </motion.div>
                    </motion.div>
                </div>
            </div>

            {/* Unified Directory */}
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 mb-12">
                <div className="flex items-center gap-3 mb-8">
                    <TeamOutlined className="text-[#C9A24D] text-xl" onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />
                    <span className="font-black text-lg text-gray-800">
                        {t('players.directory_heading', { defaultValue: 'دليل الرياضيين' })}
                    </span>
                    {total > 0 && (
                        <Badge
                            count={total}
                            overflowCount={999}
                            style={{ backgroundColor: '#C9A24D', fontSize: 10, minWidth: 20, height: 18, lineHeight: '18px', borderRadius: 9 }}
                        />
                    )}
                </div>

                <div className="space-y-10">
                    <Card className="rounded-3xl border-none shadow-sm overflow-hidden p-2">
                        <SearchFilters filters={filters} onChange={setFilters} availableNationalities={nationalities} isPublic={true} />
                    </Card>

                    {renderGrid(players, loading)}

                    <div className="mt-16 flex justify-center">
                        <Pagination
                            current={page}
                            pageSize={pageSize}
                            total={total}
                            onChange={(p, ps) => { 
                                if (loading) return; 
                                setPage(p); 
                                if (ps !== pageSize) setPageSize(ps); 
                            }}
                            showSizeChanger
                            showTotal={(t2) => t('common.total_results', { count: total, defaultValue: `Total ${total}` })}
                            className="premium-pagination"
                            hideOnSinglePage={false}
                        />
                    </div>
                </div>
            </div>

            <style>{`
                .premium-pagination .ant-pagination-item-active { border-color: #C9A24D !important; background: #C9A24D !important; }
                .premium-pagination .ant-pagination-item-active a { color: white !important; }
                .premium-pagination .ant-pagination-item:hover { border-color: #C9A24D !important; }
                .premium-pagination .ant-pagination-item:hover a { color: #C9A24D !important; }
                .premium-pagination .ant-pagination-next:hover .ant-pagination-item-link, 
                .premium-pagination .ant-pagination-prev:hover .ant-pagination-item-link { color: #C9A24D !important; border-color: #C9A24D !important; }
            `}</style>
        </div>
    );
};

export default PublicDirectory;
