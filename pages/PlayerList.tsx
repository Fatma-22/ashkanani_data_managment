import { useEffect, useState, FC } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    TrophyOutlined, 
    TeamOutlined, 
    HistoryOutlined, 
    PlusCircleOutlined, 
    WhatsAppOutlined,
    UserOutlined,
    GlobalOutlined,
    ThunderboltOutlined,
    CameraOutlined,
    CheckCircleOutlined 
} from '@ant-design/icons';
import { 
    Row, 
    Col, 
    Typography, 
    Space, 
    Empty, 
    Spin, 
    Pagination, 
    Tabs, 
    Badge, 
    Modal, 
    Form, 
    Input, 
    InputNumber,
    Select, 
    Divider, 
    Button as AntButton,
    notification
} from 'antd';
import { useNavigate } from 'react-router-dom';
import { Player, PlayerFilters, Sport, UserRole } from '../types';
import { useAuth } from '../context/AuthContext';
import { playerService } from '../services/playerService';
import profileService from '../services/profileService';
import PlayerCard from '../components/PlayerCard';
import SearchFilters from '../components/SearchFilters';
import { CLUB_MAP } from '../utils/translation';
import { debounce, translateToArabic, fixNationalityAr } from '../utils/helpers';
import { metaService } from '../services/metaService';
import publicService from '../services/publicService';
import { useStickyState } from '../utils/hooks';
import { useRef } from 'react';

const { Title } = Typography;

export const PlayerList: FC = () => {
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    const isRtl = i18n.language === 'ar';
    const { user } = useAuth();
    const isAdmin = user?.role === UserRole.ADMIN || user?.role === UserRole.OWNER;

    const [players, setPlayers] = useState<Player[]>([]);
    const [archivedPlayers, setArchivedPlayers] = useState<Player[]>([]);
    const [requestedPlayers, setRequestedPlayers] = useState<Player[]>([]);

    const [total, setTotal] = useState(0);
    const [archivedTotal, setArchivedTotal] = useState(0);
    const [requestedTotal, setRequestedTotal] = useState(0);

    const [loading, setLoading] = useState(true);
    const [archivedLoading, setArchivedLoading] = useState(false);
    const [requestedLoading, setRequestedLoading] = useState(false);

    const [activeTab, setActiveTab] = useState<'active' | 'archive' | 'requests'>('active');
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [userCVFound, setUserCVFound] = useState(false);
    const [checkingCV, setCheckingCV] = useState(false);

    const [filters, setFilters] = useStickyState<PlayerFilters>({ search: '', sport: [], positions: [] }, 'PlayerList_filters');
    const [archivedFilters, setArchivedFilters] = useStickyState<PlayerFilters>({ search: '', sport: [], positions: [] }, 'PlayerList_archivedFilters');
    const [requestedFilters, setRequestedFilters] = useStickyState<PlayerFilters>({ search: '', sport: [], positions: [] }, 'PlayerList_requestedFilters');

    const [page, setPage] = useStickyState(1, 'PlayerList_page');
    const [pageSize, setPageSize] = useStickyState(8, 'PlayerList_pageSize');
    const [archivedPage, setArchivedPage] = useStickyState(1, 'PlayerList_archivedPage');
    const [archivedPageSize, setArchivedPageSize] = useStickyState(8, 'PlayerList_archivedPageSize');
    const [requestedPage, setRequestedPage] = useStickyState(1, 'PlayerList_requestedPage');
    const [requestedPageSize, setRequestedPageSize] = useStickyState(8, 'PlayerList_requestedPageSize');

    useEffect(() => {
        publicService.trackVisit(user?.role);
    }, [user]);

    useEffect(() => {
        // Check if current user has a CV
        if (user) {
            const nid = user?.nationalId || (user as any)?.national_id;
            const phone = user?.phone;
            setCheckingCV(true);
            
            const checkCV = async () => {
                try {
                    let cv = nid ? await profileService.getMyCV(nid) : null;
                    if (!cv && phone) {
                        cv = await profileService.getMyCV(undefined, phone);
                    }
                    setUserCVFound(!!cv);
                } catch (e) {
                    setUserCVFound(false);
                } finally {
                    setCheckingCV(false);
                }
            };
            checkCV();
        } else {
            setUserCVFound(false);
            setCheckingCV(false);
        }
    }, [user]);

    useEffect(() => {
        const fetchPlayers = async () => {
            setLoading(true);
            try {
                const { players: data, total: count } = await playerService.getAll({ ...filters, isApproved: true } as any, page, pageSize);
                const normalized = data.map((p: any) => ({
                    ...p,
                    nameAr: p.name_ar || p.nameAr,
                    nationalityAr: fixNationalityAr(p.nationality_ar || p.nationalityAr),
                    clubAr: p.club_ar || p.clubAr,
                    jerseyNumber: p.jersey_number || p.jerseyNumber,
                    marketValue: p.market_value || p.marketValue,
                }));
                setPlayers(normalized);
                setTotal(count);
            } catch (error) {
                console.error('Failed to fetch players:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchPlayers();
    }, [filters, page, pageSize, refreshTrigger]);

    useEffect(() => {
        const fetchArchived = async () => {
            setArchivedLoading(true);
            try {
                const { players: data, total: count } = await playerService.getArchived(archivedFilters, archivedPage, archivedPageSize);
                const normalized = data.map((p: any) => ({
                    ...p,
                    nameAr: p.name_ar || p.nameAr,
                    nationalityAr: fixNationalityAr(p.nationality_ar || p.nationalityAr),
                    clubAr: p.club_ar || p.clubAr,
                    jerseyNumber: p.jersey_number || p.jerseyNumber,
                    marketValue: p.market_value || p.marketValue,
                }));
                setArchivedPlayers(normalized);
                setArchivedTotal(count);
            } catch (error) {
                console.error('Failed to fetch archived players:', error);
            } finally {
                setArchivedLoading(false);
            }
        };
        fetchArchived();
    }, [archivedFilters, archivedPage, archivedPageSize]);

    useEffect(() => {
        if (!isAdmin) return;
        const fetchRequests = async () => {
            setRequestedLoading(true);
            try {
                const { players: data, total: count } = await playerService.getAll({ ...requestedFilters, isApproved: false } as any, requestedPage, requestedPageSize);
                const normalized = data.map((p: any) => ({
                    ...p,
                    nameAr: p.name_ar || p.nameAr,
                    nationalityAr: fixNationalityAr(p.nationality_ar || p.nationalityAr),
                    clubAr: p.club_ar || p.clubAr,
                    jerseyNumber: p.jersey_number || p.jerseyNumber,
                    marketValue: p.market_value || p.marketValue,
                }));
                setRequestedPlayers(normalized);
                setRequestedTotal(count);
            } catch (error) {
                console.error('Failed to fetch CV requests:', error);
            } finally {
                setRequestedLoading(false);
            }
        };
        fetchRequests();
    }, [requestedFilters, requestedPage, requestedPageSize, isAdmin, refreshTrigger]);

    const prevFiltersStr = useRef<string | null>(null);
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

    const prevArchivedFiltersStr = useRef<string | null>(null);
    useEffect(() => { 
        const currentStr = JSON.stringify(archivedFilters);
        if (prevArchivedFiltersStr.current === null) {
            prevArchivedFiltersStr.current = currentStr;
            return;
        }
        if (prevArchivedFiltersStr.current !== currentStr) {
            setArchivedPage(1); 
            prevArchivedFiltersStr.current = currentStr;
        }
    }, [archivedFilters]);


    const handleApprove = async (playerId: string) => {
        try {
            await playerService.update(playerId, { is_approved: true, is_visible: true, contract_status: 'PENDING' });
            notification.success({ 
                message: t('common.approved'), 
                description: t('players.approve_success', { defaultValue: 'Player application approved successfully.' }) 
            });
            // Refresh counts and lists
            setRefreshTrigger(prev => prev + 1);
            setPage(1); // Refresh active
            setRequestedPage(1); // Refresh requests
            window.dispatchEvent(new CustomEvent('cv-requests-updated'));
        } catch (error) {
            notification.error({ message: t('common.error'), description: t('players.approve_failed') });
        }
    };

    const handleDelete = (playerId: string) => {
        Modal.confirm({
            title: t('common.are_you_sure'),
            content: t('players.delete_confirm'),
            okText: t('common.delete'),
            okType: 'danger',
            cancelText: t('common.cancel'),
            onOk: async () => {
                try {
                    await playerService.delete(playerId);
                    notification.success({ message: t('common.deleted') });
                    setRequestedPage(1);
                    setPage(1);
                    window.dispatchEvent(new CustomEvent('cv-requests-updated'));
                } catch (error) {
                    notification.error({ message: t('common.delete_failed') });
                }
            }
        });
    };

    const [nationalities, setNationalities] = useState<{ value: string; label: string }[]>([]);
    useEffect(() => {
        metaService.getNationalities()
            .then(setNationalities)
            .catch(() => setNationalities([]));
    }, []);
    const clubs = Object.keys(CLUB_MAP);

    const tabItems = [
        {
            key: 'active',
            label: (
                <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
                    <TeamOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />
                    {t('players.active_tab', { defaultValue: 'Active Players' })}
                    {total > 0 && (
                        <Badge count={total} overflowCount={999}
                            style={{ backgroundColor: '#C9A24D', fontSize: 11, minWidth: 22, height: 20, lineHeight: '20px', borderRadius: 10, padding: '0 6px' }} />
                    )}
                </span>
            ),
            children: (
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                    <SearchFilters filters={filters} onChange={setFilters} availableNationalities={nationalities} availableClubs={clubs} isPublic={true} />
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '60px 0' }}><Spin size="large" /></div>
                    ) : players.length === 0 ? (
                        <Empty description={t('players.no_players_found', { defaultValue: 'No players found' })} style={{ padding: '60px 0' }} />
                    ) : (
                        <Row gutter={[{ xs: 12, sm: 16, md: 24 }, { xs: 12, sm: 16, md: 24 }]}>
                            {players.map((player) => (
                                <Col key={player.id} xs={12} sm={12} md={8} lg={6}>
                                    <PlayerCard player={player} variant="grid" showActions={false} onClick={() => navigate(`/players/${player.id}`)} />
                                </Col>
                            ))}
                        </Row>
                    )}
                    <div style={{ textAlign: 'center', marginTop: 32 }}>
                        <Pagination current={page} pageSize={pageSize} total={total}
                            onChange={(p, ps) => { setPage(p); setPageSize(ps); }}
                            showSizeChanger pageSizeOptions={['4', '8', '12', '24']} />
                    </div>
                </Space>
            ),
        },
        {
            key: 'archive',
            label: (
                <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
                    <HistoryOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />
                    {t('players.archive_tab', { defaultValue: 'Archive' })}
                    {archivedTotal > 0 && (
                        <Badge count={archivedTotal} overflowCount={999}
                            style={{ backgroundColor: '#8C8C8C', fontSize: 11, minWidth: 22, height: 20, lineHeight: '20px', borderRadius: 10, padding: '0 6px' }} />
                    )}
                </span>
            ),
            children: (
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                    <div style={{ background: 'linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 100%)', borderRadius: 12, padding: '20px 28px', display: 'flex', alignItems: 'center', gap: 16, border: '1px solid rgba(201,162,77,0.25)' }}>
                        <TrophyOutlined style={{ fontSize: 32, color: '#C9A24D' }} onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />
                        <div>
                            <div style={{ color: '#fff', fontWeight: 700, fontSize: 16, lineHeight: 1.3 }}>
                                {t('players.archive_banner_title', { defaultValue: 'Players Archive' })}
                            </div>
                            <div style={{ color: '#fff', fontSize: 13, marginTop: 4 }}>
                                {t('players.archive_banner_desc', { defaultValue: 'Former players whose contracts have expired.' })}
                            </div>
                        </div>
                    </div>
                    <SearchFilters filters={archivedFilters} onChange={setArchivedFilters} availableNationalities={nationalities} availableClubs={clubs} isPublic={true} />
                    {archivedLoading ? (
                        <div style={{ textAlign: 'center', padding: '60px 0' }}><Spin size="large" /></div>
                    ) : archivedPlayers.length === 0 ? (
                        <Empty description={t('players.no_archived_players', { defaultValue: 'No archived players found' })} style={{ padding: '60px 0' }} />
                    ) : (
                        <Row gutter={[{ xs: 12, sm: 16, md: 24 }, { xs: 12, sm: 16, md: 24 }]}>
                            {archivedPlayers.map((player) => (
                                <Col key={player.id} xs={12} sm={12} md={8} lg={6}>
                                    <PlayerCard player={player} variant="grid" showActions={false} onClick={() => navigate(`/players/${player.id}`)} />
                                </Col>
                            ))}
                        </Row>
                    )}
                    <div style={{ textAlign: 'center', marginTop: 32 }}>
                        <Pagination current={archivedPage} pageSize={archivedPageSize} total={archivedTotal}
                            onChange={(p, ps) => { setArchivedPage(p); setArchivedPageSize(ps); }}
                            showSizeChanger pageSizeOptions={['4', '8', '12', '24']} />
                    </div>
                </Space>
            ),
        },
        ...(isAdmin ? [{
            key: 'requests',
            label: (
                <span className="flex items-center gap-2 overflow-hidden">
                    <ThunderboltOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />
                    <span className="truncate">{t('admin.dashboard.tabs.cv_requests', { defaultValue: 'CV Requests' })}</span>
                    {requestedTotal > 0 && (
                        <Badge 
                            count={requestedTotal} 
                            overflowCount={999}
                            style={{ backgroundColor: '#C9A24D', color: '#fff', fontSize: 11, minWidth: 22, height: 20, lineHeight: '20px', borderRadius: 10, padding: '0 6px', marginLeft: 8 }} 
                        />
                    )}
                </span>
            ),
            children: (
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                    <SearchFilters filters={requestedFilters} onChange={setRequestedFilters} availableNationalities={nationalities} availableClubs={clubs} isPublic={false} />
                    {requestedLoading ? (
                        <div style={{ textAlign: 'center', padding: '60px 0' }}><Spin size="large" /></div>
                    ) : requestedPlayers.length === 0 ? (
                        <Empty description={t('players.no_requests_found', { defaultValue: 'No pending requests' })} style={{ padding: '60px 0' }} />
                    ) : (
                        <Row gutter={[{ xs: 12, sm: 16, md: 24 }, { xs: 12, sm: 16, md: 24 }]}>
                            {requestedPlayers.map((player) => (
                                <Col key={player.id} xs={12} sm={12} md={8} lg={6}>
                                    <div className="relative group">
                                        <PlayerCard 
                                            player={player} 
                                            variant="grid" 
                                            showActions={false} 
                                            onClick={() => navigate(`/players/${player.id}`)} 
                                        />
                                        <div className="mt-2 flex gap-1">
                                            <AntButton 
                                                block
                                                type="primary" 
                                                size="small"
                                                icon={<CheckCircleOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
                                                onClick={(e) => { e.stopPropagation(); handleApprove(player.id); }}
                                                className="bg-green-600 border-none hover:bg-green-700 rounded-lg h-8 text-[10px] font-bold"
                                            >
                                                {t('common.approve', { defaultValue: 'Approve' })}
                                            </AntButton>
                                            <AntButton 
                                                danger
                                                size="small"
                                                icon={<HistoryOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
                                                onClick={(e) => { e.stopPropagation(); handleDelete(player.id); }}
                                                className="rounded-lg h-8 w-8 flex items-center justify-center"
                                            />
                                        </div>
                                    </div>
                                </Col>
                            ))}
                        </Row>
                    )}
                    <div style={{ textAlign: 'center', marginTop: 32 }}>
                        <Pagination current={requestedPage} pageSize={requestedPageSize} total={requestedTotal}
                            onChange={(p, ps) => { setRequestedPage(p); setRequestedPageSize(ps); }}
                            showSizeChanger pageSizeOptions={['4', '8', '12', '24']} />
                    </div>
                </Space>
            ),
        }] : []),
    ];

    return (
        <div className="fade-in">
            {/* ═══════════ Hero Section ═══════════ */}
            <div style={{ position: 'relative', background: '#0a0a0a', overflow: 'hidden' }} className="pt-20 md:pt-32 pb-16 md:pb-24">
                <div style={{ position: 'absolute', inset: 0 }}>
                    <img src="/hero-bg.png" alt=""
                        style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6, filter: 'brightness(0.7) contrast(1.1)' }} />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(10,10,10,0.6), transparent, transparent)' }} />
                </div>
                <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', padding: '0 1.5rem' }}>
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                        <div style={{
                            display: 'inline-flex', alignItems: 'center', gap: 10,
                            padding: '8px 20px', borderRadius: 999, marginBottom: 24,
                            background: 'rgba(201,162,77,0.12)', border: '1px solid rgba(201,162,77,0.3)'
                        }}>
                            <TeamOutlined style={{ color: '#C9A24D' }} onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />
                            <span style={{ color: '#C9A24D', fontWeight: 700, fontSize: 12, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                                {t('common.players')}
                            </span>
                        </div>
                        <Title level={1} style={{ color: '#fff', fontWeight: 900, margin: 0, fontSize: 'clamp(2rem, 5vw, 4rem)', lineHeight: 1.1 }}>
                            {t('players.directory_title', { defaultValue: 'Player Directory' })}
                        </Title>
                        <p style={{ color: '#C9A24D', maxWidth: 480, margin: '1.2rem auto 0', fontSize: 18, fontStyle: 'italic', fontWeight: 700 }}>
                            {t('players.directory_subtitle', { defaultValue: 'Discover our talented roster of professional players' })}
                        </p>
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }} 
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.3 }}
                            style={{ marginTop: 32 }}
                        >
                            <AntButton 
                                type="primary" 
                                size="large"
                                icon={<PlusCircleOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
                                style={{ 
                                    background: '#C9A24D', 
                                    borderColor: '#C9A24D', 
                                    height: 54, 
                                    padding: '0 40px', 
                                    borderRadius: 14, 
                                    fontWeight: 800,
                                    fontSize: 16,
                                    boxShadow: '0 10px 25px rgba(201,162,77,0.3)'
                                }}
                                onClick={() => {
                                    if (!user) {
                                        navigate('/login', { state: { from: '/profile', openCV: true } });
                                    } else {
                                        navigate('/profile', { state: { openCV: true } });
                                    }
                                }}
                            >
                                {userCVFound ? t('profile.update_cv') : t('directory.add_cv_btn')}
                            </AntButton>
                        </motion.div>
                    </motion.div>
                </div>
            </div>

            {/* ═══════════ Content ═══════════ */}
            <div style={{ padding: '40px 24px', maxWidth: 1400, margin: '0 auto' }}>
                <Tabs
                    activeKey={activeTab}
                    onChange={(key) => setActiveTab(key as 'active' | 'archive')}
                    items={tabItems}
                    size="large"
                    style={{ width: '100%' }}
                    tabBarStyle={{ marginBottom: 32, borderBottom: '2px solid #f0f0f0' }}
                    tabBarGutter={32}
                />
            </div>
        </div>
    );
};

export default PlayerList;
