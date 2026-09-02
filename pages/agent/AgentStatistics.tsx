import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Typography, Statistic, Spin, Tag, Button, Select, Space, DatePicker } from 'antd';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import {
    UserOutlined,
    DollarOutlined,
    CheckCircleOutlined,
    PieChartOutlined,
    AreaChartOutlined,
    BarChartOutlined,
    TrophyOutlined,
    FileExcelOutlined,
    FilePdfOutlined
} from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import { dashboardService } from '../../services/dashboardService';
import { playerService } from '../../services/playerService';
import { Player, Sport, DealStatus } from '../../types';
import { translateToArabic, formatCurrency, exportToCSV, triggerPrint } from '../../utils/helpers';
import { PrintableReport } from '../../components/PrintableReport';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

export const AgentStatistics: React.FC = () => {
    const { t, i18n } = useTranslation();
    const { user } = useAuth();
    const [stats, setStats] = useState<any>(null);
    const [players, setPlayers] = useState<Player[]>([]);
    const [totalPlayers, setTotalPlayers] = useState(0);
    const [filteredPlayers, setFilteredPlayers] = useState<Player[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingSport, setLoadingSport] = useState(false);
    const [selectedSport, setSelectedSport] = useState<Sport | 'All'>('All');
    const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>([null, null]);

    useEffect(() => {
        loadInitialData();
    }, []);

    useEffect(() => {
        loadSportData();
    }, [selectedSport, dateRange]);

    useEffect(() => {
        if (selectedSport === 'All') {
            setFilteredPlayers(players);
        } else {
            setFilteredPlayers(players.filter(p => p.sport === selectedSport));
        }
    }, [selectedSport, players]);

    const loadInitialData = async () => {
        setLoading(true);
        try {
            const { players: myPlayers, total: tCount } = await playerService.getAll({}, 1, 1000);
            const normalized = myPlayers.map((p: any) => ({
                ...p,
                nameAr: p.name_ar || p.nameAr,
                nationalityAr: p.nationality_ar || p.nationalityAr,
                clubAr: p.club_ar || p.clubAr,
                marketValue: p.market_value || p.marketValue,
                dealStatus: p.deal_status || p.dealStatus,
            }));
            setPlayers(normalized);
            setTotalPlayers(tCount);
            setFilteredPlayers(normalized);
        } catch (error) {
            console.error('Failed to load initial data:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadSportData = async () => {
        setLoadingSport(true);
        try {
            const filters = {
                sport: selectedSport,
                start_date: dateRange?.[0]?.format('YYYY-MM-DD'),
                end_date: dateRange?.[1]?.format('YYYY-MM-DD')
            };
            const stats = await dashboardService.getStats(filters);
            setStats(stats);
        } catch (error) {
            console.error('Failed to load sport stats:', error);
        } finally {
            setLoadingSport(false);
        }
    };

    const handleGenerateReport = () => {
        if (!filteredPlayers.length) return;

        const reportData = filteredPlayers.map(p => ({
            [t('common.name')]: i18n.language.startsWith('ar') && p.nameAr ? p.nameAr : p.name,
            [t('common.position')]: p.positions?.[0] ? t(`enums.Position.${p.positions[0]}`, { defaultValue: p.positions[0] }) : 'N/A',
            [t('common.age')]: p.age,
            [t('common.nationality')]: i18n.language.startsWith('ar') && p.nationalityAr ? p.nationalityAr : p.nationality,
            [t('common.club_label')]: i18n.language.startsWith('ar') && p.clubAr ? p.clubAr : p.club,
            [t('common.value')]: p.marketValue ? formatCurrency(p.marketValue) : 'N/A',
            [t('common.status')]: p.dealStatus
        }));

        const sportLabel = selectedSport === 'All' ? 'All' : selectedSport;
        exportToCSV(reportData, `Agent_Report_${sportLabel}_${new Date().toISOString().split('T')[0]}`);
    };

    if (loading) {
        return <div className="flex items-center justify-center min-h-[400px]"><Spin size="large" /></div>;
    }

    const totalValue = filteredPlayers.reduce((sum, p) => sum + (p.marketValue || 0), 0);
    const activeDeals = filteredPlayers.filter(p => p.dealStatus === DealStatus.SIGNED).length;

    return (
        <div className="fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <Title level={2}>{t('agent_dashboard.statistics_title')}</Title>
                    <Text type="secondary">{t('agent_dashboard.statistics_subtitle')}</Text>
                </div>
                <div className="flex gap-4 w-full md:w-auto">
                    <div className="w-full md:w-64">
                        <Text strong className="block mb-2 text-slate-400 uppercase text-[10px] tracking-widest">
                            {t('common.sport')}
                        </Text>
                        <Select
                            className="w-full custom-select"
                            value={selectedSport}
                            onChange={setSelectedSport}
                        >
                            <Option value="All">{t('common.all_sports')}</Option>
                            {Object.values(Sport).map(s => (
                                <Option key={s} value={s}>{t(`enums.Sport.${s}`)}</Option>
                            ))}
                        </Select>
                    </div>
                    <div className="w-full md:w-64">
                        <Text strong className="block mb-2 text-slate-400 uppercase text-[10px] tracking-widest">
                            {t('owner.reports.date_range')}
                        </Text>
                        <RangePicker
                            className="w-full custom-select"
                            value={dateRange}
                            onChange={setDateRange}
                        />
                    </div>
                </div>
            </div>

            <Row gutter={[24, 24]}>
                <Col xs={24} sm={8}>
                    <Card className="shadow-sm rounded-xl border-none">
                        <Statistic
                            title={t('agent_dashboard.total_players')}
                            value={totalPlayers}
                            prefix={<UserOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
                            valueStyle={{ color: '#C9A24D', fontWeight: 'bold' }}
                            loading={loading}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card className="shadow-sm rounded-xl border-none">
                        <Statistic
                            title={t('agent_dashboard.total_value')}
                            value={formatCurrency(stats?.totalMarketValue || 0, i18n.language)}
                            prefix={<DollarOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
                            valueStyle={{ color: '#C9A24D', fontWeight: 'bold' }}
                            loading={loading || loadingSport}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card className="shadow-sm rounded-xl border-none">
                        <Statistic
                            title={t('agent_dashboard.active_deals')}
                            value={stats?.activeContracts || 0}
                            prefix={<CheckCircleOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
                            valueStyle={{ color: '#C9A24D', fontWeight: 'bold' }}
                            loading={loading || loadingSport}
                        />
                    </Card>
                </Col>

                <Col xs={24} md={12}>
                    <Card
                        title={<div className="flex items-center gap-2"><PieChartOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} /> {t('agent_dashboard.position_dist')}</div>}
                        className="shadow-sm rounded-xl min-h-[300px]"
                        loading={loading || loadingSport}
                    >
                        <div className="space-y-4">
                            {Array.from(new Set(filteredPlayers.map(p => p.positions?.[0]))).filter(Boolean).map(pos => {
                                const count = filteredPlayers.filter(p => p.positions?.[0] === pos).length;
                                const percent = filteredPlayers.length > 0 ? (count / filteredPlayers.length) * 100 : 0;
                                return (
                                    <div key={pos} className="space-y-1">
                                        <div className="flex justify-between text-sm">
                                            <Text strong>{i18n.language.startsWith('ar') ? translateToArabic(pos, 'position') : (t(`enums.Position.${pos}`, { defaultValue: pos }))}</Text>
                                            <Text type="secondary">{t('agent_dashboard.players_count', { count: count })}</Text>
                                        </div>
                                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                            <div className="bg-[#C9A24D] h-full transition-all duration-1000" style={{ width: `${percent}%` }}></div>
                                        </div>
                                    </div>
                                );
                            })}
                            {filteredPlayers.length === 0 && <div className="text-center py-8 text-slate-300">{t('players.no_players_found')}</div>}
                        </div>
                    </Card>
                </Col>

                <Col xs={24} md={12}>
                    <Card
                        title={<div className="flex items-center gap-2"><BarChartOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} /> {t('agent_dashboard.nat_breakdown')}</div>}
                        className="shadow-sm rounded-xl min-h-[300px]"
                        loading={loading || loadingSport}
                    >
                        <div className="space-y-4">
                            {Array.from(new Set(filteredPlayers.map(p => p.nationality))).slice(0, 5).map(nat => {
                                const count = filteredPlayers.filter(p => p.nationality === nat).length;
                                const playerWithNat = filteredPlayers.find(p => p.nationality === nat);
                                const label = i18n.language.startsWith('ar') && playerWithNat?.nationalityAr
                                    ? playerWithNat.nationalityAr
                                    : (i18n.language.startsWith('ar') ? translateToArabic(nat, 'country') : nat);

                                return (
                                    <div key={nat} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                        <Text strong>{label}</Text>
                                        <Tag color="gold" className="m-0">{count}</Tag>
                                    </div>
                                );
                            })}
                            {filteredPlayers.length === 0 && <div className="text-center py-8 text-slate-300">{t('players.no_players_found')}</div>}
                        </div>
                    </Card>
                </Col>

                <Col xs={24}>
                    <Card
                        title={<div className="flex items-center gap-2"><AreaChartOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} /> {t('agent_dashboard.dev_insight')}</div>}
                        className="shadow-sm rounded-xl text-center py-12"
                        loading={loading || loadingSport}
                    >
                        <div className="max-w-md mx-auto">
                            <Text type="secondary" className="block mb-4">
                                {t('agent_dashboard.u23_insight', {
                                    youngCount: filteredPlayers.filter(p => p.age < 23).length,
                                    percentage: filteredPlayers.length > 0 ? Math.round((filteredPlayers.filter(p => p.age < 23).length / filteredPlayers.length) * 100) : 0
                                })}
                            </Text>
                            <div className="flex gap-4 justify-center">
                                <Button
                                    icon={<FilePdfOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
                                    size="large"
                                    onClick={triggerPrint}
                                    style={{ borderColor: '#C9A24D', color: '#C9A24D' }}
                                    className="hover:!border-[#B68F3F] hover:!text-[#B68F3F]"
                                    disabled={filteredPlayers.length === 0}
                                >
                                    {t('common.pdf_export.export_btn', { defaultValue: 'Export PDF' })}
                                </Button>
                                <Button
                                    type="primary"
                                    icon={<FileExcelOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
                                    style={{ background: '#C9A24D', borderColor: '#C9A24D' }}
                                    size="large"
                                    className="hover:!bg-[#B68F3F]"
                                    onClick={handleGenerateReport}
                                    disabled={filteredPlayers.length === 0}
                                >
                                    {t('common.export_csv', { defaultValue: 'Export CSV' })}
                                </Button>
                            </div>
                        </div>
                    </Card>
                </Col>
            </Row>

            {/* Hidden Printable Report */}
            <PrintableReport
                title={t('agent_dashboard.title', { defaultValue: 'Agent Dashboard' })}
                subtitle={`${t('common.generated_by')}: ${user?.name} | ${t('common.sport')}: ${selectedSport === 'All' ? t('common.all_sports') : t(`enums.Sport.${selectedSport}`)}`}
                data={filteredPlayers}
                columns={[
                    { title: t('common.name'), dataIndex: i18n.language.startsWith('ar') ? 'nameAr' : 'name', key: 'name' },
                    { title: t('common.position'), dataIndex: 'positions', key: 'position', render: (val: any) => val?.[0] ? t(`enums.Position.${val[0]}`, { defaultValue: val[0] }) : 'N/A' },
                    { title: t('common.age'), dataIndex: 'age', key: 'age' },
                    { title: t('common.nationality'), dataIndex: i18n.language.startsWith('ar') ? 'nationalityAr' : 'nationality', key: 'nationality' },
                    { title: t('common.club_label'), dataIndex: i18n.language.startsWith('ar') ? 'clubAr' : 'club', key: 'club' },
                    { title: t('common.value'), dataIndex: 'marketValue', key: 'marketValue', render: (val: any) => val ? formatCurrency(val) : 'N/A' },
                    { title: t('common.status'), dataIndex: 'dealStatus', key: 'dealStatus', render: (val: any) => t(`enums.DealStatus.${val}`, { defaultValue: val }) }
                ]}
                summary={[
                    { label: t('agent_dashboard.total_players'), value: filteredPlayers.length },
                    { label: t('agent_dashboard.total_value'), value: formatCurrency(filteredPlayers.reduce((sum, p) => sum + Number(p.marketValue || 0), 0), i18n.language) }
                ]}
            />
        </div >
    );
};
