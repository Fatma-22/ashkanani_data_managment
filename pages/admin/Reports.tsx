import { useEffect, useState, FC } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Row,
    Col,
    Card,
    Typography,
    Statistic,
    Space,
    Button,
    message,
    Divider,
    Tag,
    Select,
    Grid,
} from 'antd';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    AreaChart,
    Area,
} from 'recharts';
import {
    DownloadOutlined,
    RiseOutlined,
    TeamOutlined,
    FileProtectOutlined,
    HistoryOutlined,
    DollarOutlined,
    MedicineBoxOutlined,
} from '@ant-design/icons';
import { mockDashboardApi, mockPlayerApi } from '../../services/mockApi';
import { formatCurrency } from '../../utils/helpers';
import {
    DashboardStats,
    MarketValueDistribution,
    ContractStatusData,
    ContractExpiryData,
    Player,
    Sport
} from '../../types';

const { Title, Text } = Typography;
const { Option } = Select;

const COLORS = ['#C9A24D', '#3F3F3F', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#B68F3F', '#3F3F3F'];

export const Reports: FC = () => {
    const { t, i18n } = useTranslation();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [valueDist, setValueDist] = useState<MarketValueDistribution[]>([]);
    const [contractStatus, setContractStatus] = useState<ContractStatusData[]>([]);
    const [expiryTimeline, setExpiryTimeline] = useState<ContractExpiryData[]>([]);
    const [positionData, setPositionData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSport, setSelectedSport] = useState<Sport | 'All'>('All');
    const screens = Grid.useBreakpoint();
    const isMobile = !screens.md;

    useEffect(() => {
        loadData();
    }, [selectedSport]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [
                statsData,
                distData,
                statusData,
                expiryData,
                allPlayers
            ] = await Promise.all([
                mockDashboardApi.getStats(selectedSport),
                mockDashboardApi.getMarketValueDistribution(selectedSport),
                mockDashboardApi.getContractStatusData(selectedSport),
                mockDashboardApi.getContractExpiryTimeline(selectedSport),
                mockPlayerApi.getAll()
            ]);

            setStats(statsData);
            setValueDist(distData);
            setContractStatus(statusData);
            setExpiryTimeline(expiryTimelineMapper(expiryData));

            // Filter players based on selected sport
            const filteredPlayers = selectedSport === 'All'
                ? allPlayers
                : allPlayers.filter(p => p.sport === selectedSport);

            // Process position data with localized names
            const posGroups = filteredPlayers.reduce((acc: any, p: Player) => {
                const localizedPos = t(`enums.Position.${p.position}`, { defaultValue: p.position });
                acc[localizedPos] = (acc[localizedPos] || 0) + 1;
                return acc;
            }, {});

            setPositionData(Object.entries(posGroups).map(([name, value]) => ({ name, value })));

        } catch (error) {
            message.error(t('settings_page.update_failed', { defaultValue: 'Failed to load reports data' }));
        } finally {
            setLoading(false);
        }
    };

    const expiryTimelineMapper = (data: ContractExpiryData[]) => {
        return data.map(item => {
            // Localize month if it's in a recognizable format like "Jan 2026"
            let displayMonth = item.month;
            const parts = item.month.split(' ');
            if (parts.length === 2 && i18n.language === 'ar') {
                const monthMap: any = {
                    'Jan': 'يناير', 'Feb': 'فبراير', 'Mar': 'مارس', 'Apr': 'أبريل',
                    'May': 'مايو', 'Jun': 'يونيو', 'Jul': 'يوليو', 'Aug': 'أغسطس',
                    'Sep': 'سبتمبر', 'Oct': 'أكتوبر', 'Nov': 'نوفمبر', 'Dec': 'ديسمبر'
                };
                if (monthMap[parts[0]]) {
                    displayMonth = `${monthMap[parts[0]]} ${parts[1]}`;
                }
            }
            return {
                ...item,
                displayMonth
            };
        });
    };

    const handleExport = (type: 'PDF' | 'Excel') => {
        message.success(`${type} Report is being generated...`);
    };

    return (
        <div className="fade-in pb-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <Title level={4} className="!m-0 !text-[#C9A24D] !font-black uppercase tracking-tight">{t('admin.reports.indicators')}</Title>
                    <Text type="secondary" className="text-sm">{t('admin.reports.subtitle')}</Text>
                </div>
                <Space wrap size="middle" className="w-full md:w-auto">
                    <div className="flex flex-col w-full md:w-48">
                        <Text strong className="text-slate-400 uppercase text-[10px] tracking-widest mb-1">
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
                    <div className="flex items-end gap-2 w-full md:w-auto">
                        <Button
                            icon={<DownloadOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
                            onClick={() => handleExport('PDF')}
                            className="flex-1 md:flex-none rounded-lg h-10 border-[#C9A24D] text-[#C9A24D] hover:text-[#B68F3F] hover:border-[#B68F3F]"
                        >
                            {t('admin.reports.export_pdf')}
                        </Button>
                        <Button
                            type="primary"
                            icon={<DownloadOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
                            onClick={() => handleExport('Excel')}
                            className="flex-1 md:flex-none bg-[#C9A24D] hover:bg-[#B68F3F] border-none shadow-md h-10 px-6 rounded-lg font-bold"
                        >
                            {t('admin.reports.export_excel')}
                        </Button>
                    </div>
                </Space>
            </div>

            {/* Top Level Key Stats */}
            <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={12} lg={6}>
                    <Card bordered={false} className="shadow-sm rounded-xl" loading={loading}>
                        <Statistic
                            title={<span className="text-slate-500 font-medium">{t('admin.dashboard.market_value').toUpperCase()}</span>}
                            value={stats?.totalMarketValue || 0}
                            formatter={(val) => formatCurrency(Number(val), i18n.language)}
                            prefix={<DollarOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} className="text-green-500 mr-2" />}
                            valueStyle={{ color: '#3F3F3F', fontWeight: 800 }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card bordered={false} className="shadow-sm rounded-xl" loading={loading}>
                        <Statistic
                            title={<span className="text-slate-500 font-medium">{t('admin.dashboard.active_contracts').toUpperCase()}</span>}
                            value={stats?.activeContracts || 0}
                            prefix={<FileProtectOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} className="text-blue-500 mr-2" />}
                            valueStyle={{ color: '#3F3F3F', fontWeight: 800 }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card bordered={false} className="shadow-sm rounded-xl" loading={loading}>
                        <Statistic
                            title={<span className="text-slate-500 font-medium">{t('admin.dashboard.expiring_soon').toUpperCase()}</span>}
                            value={stats?.expiringSoon || 0}
                            prefix={<HistoryOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} className="text-orange-500 mr-2" />}
                            valueStyle={{ color: '#f5222d', fontWeight: 800 }}
                            suffix={<span className="text-xs font-normal text-slate-400"> (6m)</span>}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card bordered={false} className="shadow-sm rounded-xl" loading={loading}>
                        <Statistic
                            title={<span className="text-slate-500 font-medium">{t('admin.dashboard.total_players').toUpperCase()}</span>}
                            value={stats?.totalPlayers || 0}
                            prefix={<TeamOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} className="text-[#3F3F3F] mr-2" />}
                            valueStyle={{ color: '#3F3F3F', fontWeight: 800 }}
                        />
                    </Card>
                </Col>
            </Row>

            <Row gutter={[24, 24]}>
                {/* Market Value Distribution */}
                <Col xs={24} lg={16}>
                    <Card
                        title={<span className="text-[#3F3F3F] font-bold">{t('admin.dashboard.market_dist_title')}</span>}
                        className="shadow-sm rounded-xl h-full"
                        extra={<RiseOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} className="text-blue-500" />}
                        loading={loading}
                    >
                        <div style={{ height: 350 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={valueDist}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                    <XAxis dataKey="range" axisLine={false} tickLine={false} />
                                    <YAxis axisLine={false} tickLine={false} />
                                    <Tooltip
                                        cursor={{ fill: '#f8fafc' }}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '10px' }} />
                                    <Bar
                                        name={t('common.count')}
                                        dataKey="count"
                                        fill="#C9A24D"
                                        radius={[6, 6, 0, 0]}
                                        barSize={60}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </Col>

                <Col xs={24} lg={8}>
                    <Card
                        title={<span className="text-[#3F3F3F] font-bold">{t('admin.reports.composition')}</span>}
                        className="shadow-sm rounded-xl h-full"
                        loading={loading}
                    >
                        <div style={{ height: 350 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={positionData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={screens.xs ? 40 : 60}
                                        outerRadius={screens.xs ? 70 : 100}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {positionData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            borderRadius: '12px',
                                            border: 'none',
                                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                            direction: i18n.language === 'ar' ? 'rtl' : 'ltr'
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex flex-wrap justify-center gap-4 mt-2">
                            {positionData.map((entry, index) => (
                                <div key={entry.name} className="flex items-center">
                                    <div className="w-3 h-3 rounded-full me-2" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                    <span className="text-xs text-slate-500 font-medium uppercase">{entry.name}</span>
                                </div>
                            ))}
                        </div>
                    </Card>
                </Col>

                {/* Contract Expiry Timeline */}
                <Col xs={24}>
                    <Card
                        title={<span className="text-[#3F3F3F] font-bold">{t('admin.reports.expiry_timeline')}</span>}
                        className="shadow-sm rounded-xl"
                        loading={loading}
                    >
                        <div style={{ height: 300 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={expiryTimeline}>
                                    <defs>
                                        <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#C9A24D" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#C9A24D" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                    <XAxis dataKey="displayMonth" axisLine={false} tickLine={false} />
                                    <YAxis axisLine={false} tickLine={false} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '10px' }} />
                                    <Area
                                        name={t('common.count')}
                                        type="monotone"
                                        dataKey="count"
                                        stroke="#C9A24D"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorCount)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </Col>

                {/* Contract Status Overview */}
                <Col xs={24} lg={12}>
                    <Card
                        title={<span className="text-[#3F3F3F] font-bold">{t('admin.dashboard.contract_status_title')}</span>}
                        className="shadow-sm rounded-xl h-full"
                        loading={loading}
                    >
                        <div style={{ height: 300 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={contractStatus}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                    <XAxis
                                        dataKey="status"
                                        tickFormatter={(val) => t(`enums.ContractStatus.${val}`, { defaultValue: val })}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <YAxis axisLine={false} tickLine={false} />
                                    <Tooltip
                                        cursor={{ fill: '#f8fafc' }}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        labelFormatter={(val) => t(`enums.ContractStatus.${val}`, { defaultValue: val })}
                                    />
                                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '10px' }} />
                                    <Bar
                                        name={t('common.count')}
                                        dataKey="count"
                                        fill="#C9A24D"
                                        radius={[4, 4, 0, 0]}
                                        barSize={40}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </Col>

                {/* Key Indicators */}
                <Col xs={24} lg={12}>
                    <Card
                        title={<span className="text-[#C9A24D] font-bold">{t('admin.reports.indicators')}</span>}
                        className="shadow-sm rounded-xl h-full"
                        loading={loading}
                    >
                        <Space direction="vertical" style={{ width: '100%' }} split={<Divider style={{ margin: '12px 0' }} />}>
                            <div className="flex justify-between items-center">
                                <Text strong>{t('admin.reports.market_participation')}</Text>
                                <Tag color="success" className="font-bold border-none">{t('common.high')}</Tag>
                            </div>
                            <div className="flex justify-between items-center">
                                <Text strong>{t('admin.reports.contract_stability')}</Text>
                                <Text type="secondary">78.5%</Text>
                            </div>
                            <div className="flex justify-between items-center">
                                <Text strong>{t('admin.reports.roster_balance')}</Text>
                                <Text type="secondary">40 / 60</Text>
                            </div>
                            <div className="flex justify-between items-center">
                                <Text strong>{t('admin.reports.agency_concentration')}</Text>
                                <Tag color="warning" className="font-bold border-none">{t('common.medium')}</Tag>
                            </div>
                            <div className="flex justify-between items-center">
                                <Text strong>{t('admin.reports.avg_player_value')}</Text>
                                <Text className="font-bold">
                                    {stats && stats.totalPlayers > 0 ? formatCurrency(stats.totalMarketValue / stats.totalPlayers, i18n.language) : '$0'}
                                </Text>
                            </div>
                        </Space>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};
