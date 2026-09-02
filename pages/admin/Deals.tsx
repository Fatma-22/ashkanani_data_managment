import { useEffect, useState, useRef, FC } from 'react';
import {
    Table,
    Button,
    Space,
    Typography,
    Card,
    Row,
    Col,
    Input,
    DatePicker,
    Select,
    message,
    Tooltip,
    Modal,
    Tag,
    Grid,
} from 'antd';
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    SearchOutlined,
    EyeOutlined,
    StockOutlined,
    RiseOutlined,
    FallOutlined,
    FieldTimeOutlined,
    ArrowLeftOutlined,
    ArrowRightOutlined,
    FilePdfOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { Deal, Player } from '../../types';
import { dealService } from '../../services/dealService';
import { playerService } from '../../services/playerService';
import { formatCurrency, formatDate, normalizeArabic, translateToEnglish, translateToArabic } from '../../utils/helpers';
import DealModal from '../../components/DealModal';
import showConfirmModal from '../../components/ConfirmModal';
import { useAuth } from '../../context/AuthContext';
import { canAddDeals, canEditDeals, canDeleteDeals } from '../../utils/permissionHelpers';
import DynamicTranslate from '../../components/DynamicTranslate';
import GenericPdfExportModal from '../../components/GenericPdfExportModal';
import { DEAL_PDF_FIELDS, DEFAULT_DEAL_PDF_FIELDS } from '../../utils/pdfExport';
import { useStickyState } from '../../utils/hooks';

const { Title } = Typography;
const { RangePicker } = DatePicker;

export const Deals: FC = () => {
    const { t, i18n } = useTranslation();
    const { user } = useAuth();
    const isAr = i18n.language === 'ar';
    const screens = Grid.useBreakpoint();
    const isMobile = !screens.md;
    
    const isArabicText = (text?: string) => {
        if (!text) return false;
        const arabicPattern = /[\u0600-\u06FF]/;
        return arabicPattern.test(text);
    };

    const [deals, setDeals] = useState<Deal[]>([]);
    const [loading, setLoading] = useState(false);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useStickyState(1, 'Admin_Deals_page');
    const [pageSize, setPageSize] = useStickyState(15, 'Admin_Deals_pageSize');
    const [allPlayers, setAllPlayers] = useState<Player[]>([]);
    const [stats, setStats] = useState<any>(null);

    const [modalVisible, setModalVisible] = useState(false);
    const [viewModalVisible, setViewModalVisible] = useState(false);
    const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
    const [selectedDealForView, setSelectedDealForView] = useState<Deal | null>(null);
    const [pdfModalVisible, setPdfModalVisible] = useState(false);

    const [filters, setFilters] = useState({
        search: '',
        player_id: undefined,
        start_date: undefined,
        end_date: undefined,
        year: undefined,
        from_club: undefined,
        to_club: undefined,
    });
    const [uniqueClubs, setUniqueClubs] = useState<{ from_clubs: any[]; to_clubs: any[] }>({
        from_clubs: [],
        to_clubs: []
    });
    
    const tickerRef = useRef<HTMLDivElement>(null);

    const scrollTicker = (direction: 'left' | 'right') => {
        if (tickerRef.current) {
            const scrollAmount = 300;
            tickerRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    const isFirstRender = useRef(true);
    const handleFilterChange = (newFilters: any) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
        if (!isFirstRender.current) {
            setPage(1);
        }
    };
    
    useEffect(() => {
        isFirstRender.current = false;
    }, []);

    const [localSearch, setLocalSearch] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => {
            handleFilterChange({ search: localSearch });
        }, 500);
        return () => clearTimeout(timer);
    }, [localSearch]);

    useEffect(() => {
        fetchPlayers();
        fetchStats();
        fetchUniqueClubs();
    }, []);

    useEffect(() => {
        fetchDeals();
    }, [filters, page, pageSize]);

    const fetchUniqueClubs = async () => {
        try {
            const data = await dealService.getClubs();
            setUniqueClubs(data || { from_clubs: [], to_clubs: [] });
        } catch (error) {
            console.error('Failed to fetch unique clubs', error);
        }
    };

    const fetchStats = async () => {
        try {
            const data = await dealService.getStats();
            setStats(data);
        } catch (error) {
            console.error('Failed to fetch deal stats', error);
        }
    };

    const fetchDeals = async () => {
        setLoading(true);
        try {
            const params: any = {
                page,
                per_page: pageSize,
            };

            // Only add filters that have values
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    params[key] = value;
                }
            });

            const response: any = await dealService.getAll(params);
            const resultData = response.data;
            setDeals(resultData.data || []);
            setTotal(resultData.meta?.total || resultData.data?.length || 0);
        } catch (error) {
            console.error('Fetch deals error:', error);
            message.error(t('messages.error_load'));
        } finally {
            setLoading(false);
        }
    };

    const fetchAllDataForPdf = async () => {
        try {
            const params: any = {
                page: 1,
                per_page: 10000, // Fetch max
            };

            // Only add filters that have values
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    params[key] = value;
                }
            });

            const response: any = await dealService.getAll(params);
            const resultData = response.data;
            return resultData.data || [];
        } catch (error) {
            console.error('Fetch all deals error:', error);
            message.error(t('messages.error_load'));
            return [];
        }
    };

    const fetchPlayers = async () => {
        try {
            const { players } = await playerService.getAll({ search: '' }, 1, -1);
            setAllPlayers(players);
        } catch (error) {
            console.error('Failed to fetch players', error);
        }
    };

    const handleAdd = () => {
        setEditingDeal(null);
        setModalVisible(true);
    };

    const handleEdit = (deal: Deal) => {
        setEditingDeal(deal);
        setModalVisible(true);
    };

    const handleView = (deal: Deal) => {
        setSelectedDealForView(deal);
        setViewModalVisible(true);
    };

    const handleDelete = (deal: Deal) => {
        showConfirmModal({
            title: t('messages.confirm_delete_title'),
            content: t('messages.confirm_delete_content'),
            okText: t('common.delete'),
            okType: 'danger',
            onConfirm: async () => {
                try {
                    await dealService.delete(deal.id);
                    message.success(t('messages.success_delete'));
                    fetchDeals();
                } catch (error) {
                    message.error(t('messages.error_delete'));
                }
            },
        });
    };

    const columns: ColumnsType<Deal> = [
        {
            title: t('admin.deals.player'),
            key: 'player',
            render: (_, record) => {
                const nameToDisplay = record.player
                    ? (isAr ? (record.player.nameAr || record.player.name) : (record.player.name || record.player.nameAr))
                    : (isAr ? (record.manualPlayerNameAr || record.manualPlayerName) : (record.manualPlayerName || record.manualPlayerNameAr));
                
                return (
                    <Space direction="vertical" size={0}>
                        <Typography.Text strong>
                            <DynamicTranslate text={nameToDisplay} sourceLang={isArabicText(nameToDisplay) ? 'ar' : 'en'} />
                        </Typography.Text>
                        {!record.player && (
                            <Typography.Text type="secondary" style={{ fontSize: '10px', textTransform: 'uppercase' }}>
                                {t(record.manualPlayerRole === 'COACH' ? 'admin.deals.external_coach' : 'admin.deals.external_player')}
                            </Typography.Text>
                        )}
                    </Space>
                );
            },
        },
        {
            title: t('admin.players.role'),
            key: 'role',
            responsive: ['md'],
            render: (_, record) => {
                const role = record.player?.role || record.manualPlayerRole;
                return role ? t(`enums.ProfileRole.${role}`, { defaultValue: role }) : '-';
            }
        },
        {
            title: t('admin.players.sport'),
            key: 'sport',
            responsive: ['md'],
            render: (_, record) => {
                const sport = record.player?.sport || record.manualPlayerSport;
                return sport ? t(`enums.Sport.${sport}`, { defaultValue: sport }) : '-';
            }
        },
        {
            title: t('admin.deals.from_club'),
            key: 'fromClub',
            responsive: ['lg'],
            render: (_, record) => <DynamicTranslate text={record.fromClub || ''} sourceLang={isArabicText(record.fromClub || '') ? 'ar' : 'en'} />,
        },
        {
            title: t('admin.deals.to_club'),
            key: 'toClub',
            responsive: ['lg'],
            render: (_, record) => <DynamicTranslate text={record.toClub || ''} sourceLang={isArabicText(record.toClub || '') ? 'ar' : 'en'} />,
        },
        {
            title: t('admin.deals.deal_date'),
            dataIndex: 'dealDate',
            key: 'dealDate',
            render: (date) => date ? dayjs(date).year() : '-',
        },
        {
            title: t('admin.deals.type'),
            dataIndex: 'type',
            key: 'type',
            render: (type) => type ? t(`admin.deals.${type.toLowerCase()}`, { defaultValue: type }) : '-',
        },
        {
            title: t('common.actions'),
            key: 'actions',
            width: 120,
            render: (_, record) => (
                <Space>
                    <Tooltip title={t('common.view')}>
                        <Button
                            shape="circle"
                            icon={<EyeOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
                            onClick={() => handleView(record)}
                        />
                    </Tooltip>
                    {canEditDeals(user) && (
                        <Tooltip title={t('common.edit')}>
                            <Button
                                shape="circle"
                                icon={<EditOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
                                onClick={() => handleEdit(record)}
                            />
                        </Tooltip>
                    )}
                    {canDeleteDeals(user) && (
                        <Tooltip title={t('common.delete')}>
                            <Button
                                shape="circle"
                                danger
                                icon={<DeleteOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
                                onClick={() => handleDelete(record)}
                            />
                        </Tooltip>
                    )}
                </Space>
            ),
        },
    ];

    return (
        <div className="fade-in">
            <Row gutter={[16, 16]} justify="space-between" align="middle" style={{ marginBottom: 24 }}>
                <Col xs={24} md={12}>
                    <Title level={screens.xs ? 3 : 2} className="!m-0">{t('admin.deals.title')}</Title>
                </Col>
                <Col xs={24} md={12}>
                    <Space className="w-full justify-start md:justify-end flex-wrap">
                        <Button
                            icon={<FilePdfOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
                            onClick={() => setPdfModalVisible(true)}
                            size={screens.xs ? "middle" : "large"}
                            className="flex-1 md:flex-none"
                        >
                            {t('common.pdf_export.export_btn', { defaultValue: 'Export PDF' })}
                        </Button>
                        {canAddDeals(user) && (
                            <Button
                                type="primary"
                                icon={<PlusOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
                                onClick={handleAdd}
                                size={screens.xs ? "middle" : "large"}
                                style={{ background: '#3F3F3F' }}
                                className="flex-1 md:flex-none"
                            >
                                {t('admin.deals.add_deal')}
                            </Button>
                        )}
                    </Space>
                </Col>
            </Row>

            {/* Premium Stats Dashboard - Elite Portfolio Theme */}
            <div className="mb-8 p-1 bg-gradient-to-r from-[#C9A24D]/20 via-slate-800 to-[#C9A24D]/20 rounded-[2rem] shadow-2xl">
                <div className="bg-[#0B101B] rounded-[1.9rem] p-6 flex flex-col items-stretch overflow-hidden">
                    
                    <div className="flex flex-col lg:flex-row gap-6 items-stretch w-full mb-6 lg:mb-0">
                        {/* Perspective Total Card */}
                        <div className="relative group overflow-hidden w-full lg:w-1/4 bg-gradient-to-br from-[#1A1F2B] to-[#0F1420] rounded-3xl p-6 border border-white/5 flex flex-col justify-between min-h-[140px] sm:min-h-[160px]">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[#C9A24D]/10 blur-[50px] rounded-full -mr-10 -mt-10"></div>
                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="p-2 rounded-xl bg-[#C9A24D]/10 text-[#C9A24D]">
                                        <StockOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} className="text-xl" />
                                    </span>
                                    <span className="text-[14px] font-bold tracking-wide text-slate-400">{t('admin.deals.stat_total_deals')}</span>
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-4xl sm:text-5xl font-black text-white tracking-tighter">{total ?? 0}</span>
                                    {stats && (
                                        <div className={`text-sm font-bold ${stats.trend === 'up' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                            {stats.trend === 'up' ? '↑' : '↓'}{stats.percentage}%
                                        </div>
                                    )}
                                </div>
                            </div>

                        </div>

                        {/* Dynamic Market Ticker with Carousel Controls */}
                        <div className="w-full lg:w-3/4 relative group/carousel">
                            {/* Navigation Arrows */}
                            {!isMobile && (
                                <>
                                    <div 
                                        onClick={() => scrollTicker('right')}
                                        className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-black/40 hover:bg-[#C9A24D] text-white rounded-full flex items-center justify-center cursor-pointer opacity-0 group-hover/carousel:opacity-100 transition-all duration-300 -mr-5 border border-white/10 backdrop-blur-md"
                                    >
                                        <ArrowRightOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />
                                    </div>
                                    <div 
                                        onClick={() => scrollTicker('left')}
                                        className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-black/40 hover:bg-[#C9A24D] text-white rounded-full flex items-center justify-center cursor-pointer opacity-0 group-hover/carousel:opacity-100 transition-all duration-300 -ml-5 border border-white/10 backdrop-blur-md"
                                    >
                                        <ArrowLeftOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />
                                    </div>
                                </>
                            )}

                            <div 
                                ref={tickerRef}
                                className="flex flex-row overflow-x-auto gap-4 py-2 no-scrollbar relative" 
                                style={{ direction: isAr ? 'rtl' : 'ltr', scrollSnapType: 'x mandatory' }}
                            >
                                {(stats?.yearlyBreakdown || []).map((item: any, index: number, array: any[]) => {
                                    const prevYearData = array[index + 1];
                                    const isUp = !prevYearData || item.count >= prevYearData.count;
                                    
                                    return (
                                        <div 
                                            key={item.year}
                                            className="relative min-w-[150px] sm:min-w-[180px] bg-white/5 hover:bg-white/10 border border-white/10 rounded-3xl p-4 sm:p-5 transition-all duration-300 group cursor-default backdrop-blur-sm scroll-snap-align-start"
                                        >
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] sm:text-xs font-bold text-slate-500 mb-1">{t('admin.deals.stat_year_stats')}</span>
                                                    <span className="text-lg sm:text-xl font-black text-white group-hover:text-[#C9A24D] transition-colors">{item.year}</span>
                                                </div>
                                                <div className={`p-1.5 sm:p-2 rounded-xl ${isUp ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                                                    <span className="text-xs sm:text-sm font-bold">{isUp ? '↑' : '↓'}</span>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-baseline gap-2 mb-3">
                                                <span className="text-2xl sm:text-3xl font-black text-white tabular-nums">{item.count}</span>
                                                <span className="text-[10px] sm:text-[11px] font-bold text-slate-500">{t('admin.deals.stat_deal_unit')}</span>
                                            </div>

                                            {/* Mini visualization bar */}
                                            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                                <div 
                                                    className={`h-full rounded-full transition-all duration-1000 ${isUp ? 'bg-emerald-400' : 'bg-rose-400'}`}
                                                    style={{ width: `${Math.min(100, (item.count / (total || 1)) * 100 * 2)}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Card className="mb-6 shadow-sm overflow-hidden" bodyStyle={{ padding: screens.xs ? 12 : 24 }}>
                <Row gutter={[12, 12]}>
                    <Col xs={24} sm={12} md={5}>
                        <Input
                            placeholder={t('common.search')}
                            size="large"
                            className="rounded-xl"
                            prefix={<SearchOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
                            value={localSearch}
                            onChange={(e) => setLocalSearch(e.target.value)}
                            allowClear
                        />
                    </Col>
                    <Col xs={24} sm={12} md={5}>
                        <Select
                            style={{ width: '100%' }}
                            size="large"
                            className="rounded-xl"
                            placeholder={t('admin.deals.all_players')}
                            allowClear
                            showSearch
                            optionFilterProp="label"
                            filterOption={(input, option) => {
                                const normalizedInput = normalizeArabic(input).toLowerCase();
                                const normalizedLabel = normalizeArabic(String(option?.label ?? '')).toLowerCase();
                                return normalizedLabel.startsWith(normalizedInput);
                            }}
                            onChange={(val) => handleFilterChange({ player_id: val })}
                            options={allPlayers.map(p => ({
                                value: p.id,
                                label: isAr ? (p.nameAr || p.name) : (p.name || p.nameAr)
                            }))}
                        />
                    </Col>
                    <Col xs={24} sm={12} md={5}>
                        <Select
                            style={{ width: '100%' }}
                            size="large"
                            className="rounded-xl"
                            placeholder={t('admin.deals.filter_from_club')}
                            allowClear
                            showSearch
                            optionFilterProp="label"
                            filterOption={(input, option) => {
                                const normalizedInput = normalizeArabic(input).toLowerCase();
                                const normalizedLabel = normalizeArabic(String(option?.label ?? '')).toLowerCase();
                                return normalizedLabel.startsWith(normalizedInput);
                            }}
                            onChange={(val) => handleFilterChange({ from_club: val })}
                            options={uniqueClubs.from_clubs.map(c => ({
                                value: c.name || c.name_ar,
                                label: isAr ? (c.name_ar || c.name) : (c.name || c.name_ar)
                            }))}
                        />
                    </Col>
                    <Col xs={24} sm={12} md={5}>
                        <Select
                            style={{ width: '100%' }}
                            size="large"
                            className="rounded-xl"
                            placeholder={t('admin.deals.filter_to_club')}
                            allowClear
                            showSearch
                            optionFilterProp="label"
                            filterOption={(input, option) => {
                                const normalizedInput = normalizeArabic(input).toLowerCase();
                                const normalizedLabel = normalizeArabic(String(option?.label ?? '')).toLowerCase();
                                return normalizedLabel.startsWith(normalizedInput);
                            }}
                            onChange={(val) => handleFilterChange({ to_club: val })}
                            options={uniqueClubs.to_clubs.map(c => ({
                                value: c.name || c.name_ar,
                                label: isAr ? (c.name_ar || c.name) : (c.name || c.name_ar)
                            }))}
                        />
                    </Col>
                    <Col xs={24} sm={12} md={4}>
                        <DatePicker
                            picker="year"
                            size="large"
                            className="rounded-xl w-full"
                            style={{ width: '100%' }}
                            placeholder={t('admin.deals.filter_year')}
                            onChange={(date) => handleFilterChange({ year: date ? date.year() : undefined })}
                        />
                    </Col>
                </Row>
            </Card>

            <Table
                columns={columns}
                dataSource={deals}
                loading={loading}
                rowKey="id"
                pagination={{
                    current: page,
                    pageSize: pageSize,
                    total: total,
                    onChange: (p, ps) => {
                        setPage(p);
                        setPageSize(ps);
                    },
                    showTotal: (total) => `${t('common.total')}: ${total}`,
                }}
                scroll={{ x: 'max-content' }}
                className="shadow-sm rounded-lg overflow-hidden border border-slate-100"
            />

            <DealModal
                visible={modalVisible}
                deal={editingDeal}
                onCancel={() => setModalVisible(false)}
                onSuccess={() => {
                    setModalVisible(false);
                    fetchDeals();
                }}
                players={allPlayers}
            />

            <Modal
                title={t('admin.deals.view_deal')}
                open={viewModalVisible}
                onCancel={() => setViewModalVisible(false)}
                footer={[
                    <Button key="close" onClick={() => setViewModalVisible(false)}>
                        {t('common.close')}
                    </Button>
                ]}
                width={700}
            >
                {selectedDealForView && (
                    <div className="py-4">
                        <Row gutter={[12, 16]}>
                            <Col xs={24} sm={12}>
                                <Typography.Text type="secondary" className="text-xs uppercase tracking-wider">{t('admin.deals.player')}</Typography.Text>
                                <div className="text-base font-bold text-[#334155] mt-1">
                                    {(() => {
                                        const nameToDisplay = selectedDealForView.player
                                            ? (isAr ? (selectedDealForView.player.nameAr || selectedDealForView.player.name) : (selectedDealForView.player.name || selectedDealForView.player.nameAr))
                                            : (isAr ? (selectedDealForView.manualPlayerNameAr || selectedDealForView.manualPlayerName) : (selectedDealForView.manualPlayerName || selectedDealForView.manualPlayerNameAr));
                                        return <DynamicTranslate text={nameToDisplay} sourceLang={isArabicText(nameToDisplay) ? 'ar' : 'en'} />;
                                    })()}
                                    {!selectedDealForView.player && (
                                        <Tag className="ml-2 border-none bg-slate-100 text-slate-500 text-[10px] align-middle">
                                            {t(selectedDealForView.manualPlayerRole === 'COACH' ? 'admin.deals.external_coach' : 'admin.deals.external_player')}
                                        </Tag>
                                    )}
                                </div>
                            </Col>
                            <Col xs={12} sm={6}>
                                <Typography.Text type="secondary" className="text-xs uppercase tracking-wider">{t('admin.players.role')}</Typography.Text>
                                <div className="text-base font-bold text-[#334155] mt-1">
                                    {(() => {
                                        const role = selectedDealForView.player?.role || selectedDealForView.manualPlayerRole;
                                        return role ? t(`enums.ProfileRole.${role}`, { defaultValue: role }) : '-';
                                    })()}
                                </div>
                            </Col>
                            <Col xs={12} sm={6}>
                                <Typography.Text type="secondary" className="text-xs uppercase tracking-wider">{t('admin.players.sport')}</Typography.Text>
                                <div className="text-base font-bold text-[#334155] mt-1">
                                    {(() => {
                                        const sport = selectedDealForView.player?.sport || selectedDealForView.manualPlayerSport;
                                        return sport ? t(`enums.Sport.${sport}`, { defaultValue: sport }) : '-';
                                    })()}
                                </div>
                            </Col>
                            <Col xs={12} sm={12}>
                                <Typography.Text type="secondary" className="text-xs uppercase tracking-wider">{t('admin.deals.deal_date')}</Typography.Text>
                                <div className="text-base font-bold text-[#334155] mt-1">{selectedDealForView.dealDate ? dayjs(selectedDealForView.dealDate).year() : '-'}</div>
                            </Col>
                            <Col xs={24} sm={12}>
                                <Typography.Text type="secondary" className="text-xs uppercase tracking-wider">{t('admin.deals.from_club_ar')}</Typography.Text>
                                <div className="text-base font-bold text-[#334155] mt-1">{selectedDealForView.fromClubAr || '-'}</div>
                            </Col>
                            <Col xs={24} sm={12}>
                                <Typography.Text type="secondary" className="text-xs uppercase tracking-wider">{t('admin.deals.from_club')}</Typography.Text>
                                <div className="text-base font-bold text-[#334155] mt-1">{selectedDealForView.fromClub || '-'}</div>
                            </Col>
                            <Col xs={24} sm={12}>
                                <Typography.Text type="secondary" className="text-xs uppercase tracking-wider">{t('admin.deals.to_club_ar')}</Typography.Text>
                                <div className="text-base font-bold text-[#334155] mt-1">{selectedDealForView.toClubAr || '-'}</div>
                            </Col>
                            <Col xs={24} sm={12}>
                                <Typography.Text type="secondary" className="text-xs uppercase tracking-wider">{t('admin.deals.to_club')}</Typography.Text>
                                <div className="text-base font-bold text-[#334155] mt-1">{selectedDealForView.toClub || '-'}</div>
                            </Col>
                            <Col xs={12} sm={12}>
                                <Typography.Text type="secondary" className="text-xs uppercase tracking-wider">{t('admin.deals.amount')}</Typography.Text>
                                <div className="text-base font-bold text-[#C9A24D] mt-1">
                                    {selectedDealForView.amount ? formatCurrency(selectedDealForView.amount, selectedDealForView.currency || 'USD') : '-'}
                                </div>
                            </Col>
                            <Col xs={12} sm={12}>
                                <Typography.Text type="secondary" className="text-xs uppercase tracking-wider">{t('admin.deals.type')}</Typography.Text>
                                <div className="text-base font-bold text-[#334155] mt-1">
                                    {selectedDealForView.type ? t(`admin.deals.${selectedDealForView.type.toLowerCase()}`, { defaultValue: selectedDealForView.type }) : '-'}
                                </div>
                            </Col>
                            <Col xs={24}>
                                <Typography.Text type="secondary" className="text-xs uppercase tracking-wider">{t('admin.deals.notes')}</Typography.Text>
                                <div className="mt-2 p-4 bg-[#F8FAFC] rounded-2xl border border-slate-100 text-slate-700 min-h-[80px]">
                                    <div className="whitespace-pre-wrap leading-relaxed">
                                        <DynamicTranslate text={selectedDealForView.notes || '-'} sourceLang={isArabicText(selectedDealForView.notes) ? 'ar' : 'en'} />
                                    </div>
                                </div>
                            </Col>
                            {(selectedDealForView.contractStartDate || selectedDealForView.contractEndDate || selectedDealForView.contractUrl) && (
                                <Col xs={24}>
                                    <div className="mt-4 p-4 bg-blue-50/50 rounded-2xl border border-blue-100/50">
                                        <Typography.Text type="secondary" className="block mb-4 text-[10px] uppercase tracking-wider font-bold text-blue-600">
                                            {t('admin.deals.contract_details_private')}
                                        </Typography.Text>
                                        <Row gutter={[12, 16]}>
                                            <Col xs={12} sm={8}>
                                                <Typography.Text type="secondary" className="text-xs">{t('admin.deals.contract_start_date')}</Typography.Text>
                                                <div className="text-sm font-bold text-[#334155] mt-1">{selectedDealForView.contractStartDate ? formatDate(selectedDealForView.contractStartDate) : '-'}</div>
                                            </Col>
                                            <Col xs={12} sm={8}>
                                                <Typography.Text type="secondary" className="text-xs">{t('admin.deals.contract_end_date')}</Typography.Text>
                                                <div className="text-sm font-bold text-[#334155] mt-1">{selectedDealForView.contractEndDate ? formatDate(selectedDealForView.contractEndDate) : '-'}</div>
                                            </Col>
                                            {selectedDealForView.contractUrl && (
                                                <Col xs={24} sm={8}>
                                                    <Typography.Text type="secondary" className="text-xs">{t('admin.deals.contract_file')}</Typography.Text>
                                                    <div className="mt-1">
                                                        <Button 
                                                            type="link" 
                                                            size="small" 
                                                            icon={<FilePdfOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
                                                            onClick={() => {
                                                                if (!selectedDealForView.contractUrl) return;
                                                                const link = document.createElement('a');
                                                                link.href = selectedDealForView.contractUrl;
                                                                link.download = `contract-${selectedDealForView.id}.pdf`;
                                                                document.body.appendChild(link);
                                                                link.click();
                                                                document.body.removeChild(link);
                                                            }}
                                                            className="p-0 h-auto text-blue-600 hover:text-blue-700 font-bold"
                                                        >
                                                            {t('common.view_details')}
                                                        </Button>
                                                    </div>
                                                </Col>
                                            )}
                                        </Row>
                                    </div>
                                </Col>
                            )}
                        </Row>
                    </div>
                )}
            </Modal>

            {/* PDF Export Modal */}
            <GenericPdfExportModal
                open={pdfModalVisible}
                onClose={() => setPdfModalVisible(false)}
                rows={deals}
                fetchAllData={fetchAllDataForPdf}
                fields={DEAL_PDF_FIELDS}
                defaultFields={DEFAULT_DEAL_PDF_FIELDS}
                groups={[
                    { titleKey: 'basic', keys: ['player', 'type', 'status', 'club'] },
                    { titleKey: 'contract', keys: ['amount', 'startDate', 'endDate'] },
                    { titleKey: 'contact', keys: ['agent', 'notes'] },
                ]}
                reportTitle="Deals Report"
                reportTitleAr="تقرير الصفقات"
            />
        </div>
    );
};
