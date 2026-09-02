import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Spin, Typography, Space, Button, Select, Grid, Divider, Tabs, Empty, message, Badge, notification, Modal, Avatar, Table, Tag } from 'antd';
import { useNavigate } from 'react-router-dom';
import {
    UserOutlined,
    DollarOutlined,
    TeamOutlined,
    FileTextOutlined,
    BarChartOutlined,
    PieChartOutlined,
    LineChartOutlined,
    AreaChartOutlined,
    TrophyOutlined,
    CalendarOutlined,
    RiseOutlined,
    HistoryOutlined,
    MedicineBoxOutlined,
    CheckCircleOutlined,
    DeleteOutlined,
    ThunderboltOutlined,
} from '@ant-design/icons';
import apiClient from '../../services/api';
import { dashboardService } from '../../services/dashboardService';
import { ownerService } from '../../services/ownerService';
import { playerService } from '../../services/playerService';
import { DashboardStats, MarketValueDistribution, ContractStatusData, ContractExpiryData, FinancialStats, Sport, User } from '../../types';
import {
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import { formatCurrency } from '../../utils/helpers';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import 'dayjs/locale/ar';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

const { Title, Text } = Typography;
const { Option } = Select;
const { useBreakpoint } = Grid;

export const OwnerDashboard: React.FC = () => {
    const { t, i18n } = useTranslation();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [loadingSport, setLoadingSport] = useState(false);

    // CV Requests state
    const [requestedPlayers, setRequestedPlayers] = useState<any[]>([]);
    const [requestedLoading, setRequestedLoading] = useState(false);
    const [requestedTotal, setRequestedTotal] = useState(0);

    // Members/Analytics state
    const [recentMembers, setRecentMembers] = useState<User[]>([]);
    const [membersLoading, setMembersLoading] = useState(false);

    const [stats, setStats] = useState<DashboardStats>({
        totalPlayers: 0,
        activeContracts: 0,
        expiringSoon: 0,
        totalMarketValue: 0,
        totalDeals: 0,
        dealsThisMonth: 0,
        totalDealsAmount: 0,
        youthPlayersCount: 0,
        proPlayersCount: 0,
        contractStability: 0,
        topAgentConcentration: 0,
        signingCount: 0,
        authorizationCount: 0,
        notJoinedCount: 0,
        // Member & Visit stats
        totalMembers: 0,
        playersMemberCount: 0,
        coachesMemberCount: 0,
        scoutsMemberCount: 0,
        clubsMemberCount: 0,
        othersMemberCount: 0,
        guestVisits: 0,
        registeredVisits: 0,
        dailyStats: [],
    });
    const [nutritionStats, setNutritionStats] = useState<any>({
        reports_count: 0,
        nutrition_programs_count: 0,
        training_programs_count: 0,
        progress_photos_count: 0,
        active_players_count: 0,
    });
    const [financialStats, setFinancialStats] = useState<FinancialStats>({
        totalIncome: 0,
        totalExpense: 0,
        totalArrears: 0,
        netProfit: 0,
        monthlyIncome: 0,
        monthlyExpense: 0,
        monthlyArrears: 0,
        yearlyIncome: 0,
        yearlyExpense: 0,
        yearlyArrears: 0,
        totalDeals: 0,
        totalDealsAmount: 0,
    });
    const [adminCount, setAdminCount] = useState(0);
    const [employeeCount, setEmployeeCount] = useState(0);
    const [avgSalary, setAvgSalary] = useState(0);
    const [avgSalaryKWD, setAvgSalaryKWD] = useState(0);
    const [marketValueDist, setMarketValueDist] = useState<MarketValueDistribution[]>([]);
    const [dealTypeDist, setDealTypeDist] = useState<{ type: string, count: number }[]>([]);
    const [contractStatus, setContractStatus] = useState<ContractStatusData[]>([]);
    const [contractExpiry, setContractExpiry] = useState<ContractExpiryData[]>([]);
    const [monthlyFinancialData, setMonthlyFinancialData] = useState<Array<{ month: string; income: number; expense: number }>>([]);
    const [selectedSport, setSelectedSport] = useState<Sport | 'All'>('All');
    const screens = useBreakpoint();
    const isMobile = !screens.md;

    useEffect(() => {
        loadRequestedPlayers();
        loadGlobalData();
        loadRecentMembers();
    }, []);

    useEffect(() => {
        loadSportData();
    }, [selectedSport]);

    const loadRequestedPlayers = async () => {
        setRequestedLoading(true);
        try {
            const { players: data, total: count } = await playerService.getAll({ isApproved: false } as any);
            const normalized = (data || []).map((p: any) => ({
                ...p,
                nameAr: p.name_ar || p.nameAr,
            }));
            setRequestedPlayers(normalized);
            setRequestedTotal(count || normalized.length);
        } catch { } finally { setRequestedLoading(false); }
    };

    const loadRecentMembers = async () => {
        setMembersLoading(true);
        try {
            const response: any = await apiClient.get('/members');
            const data = response.data?.data || response.data || (Array.isArray(response) ? response : []);
            setRecentMembers(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error loading members:', error);
        } finally {
            setMembersLoading(false);
        }
    };

    const loadGlobalData = async () => {
        setLoading(true);
        try {
            const [financialData, adminData, employeeData, allFinRecords, dashboardData, nutritionData] = await Promise.all([
                ownerService.getFinancialStats(),
                ownerService.getAdmins(),
                ownerService.getEmployees(),
                ownerService.getFinancialRecords(),
                dashboardService.getStats(), 
                dashboardService.getNutritionStats(),
            ]);

            setFinancialStats(financialData);
            setAdminCount(adminData.length);
            setEmployeeCount(employeeData.length);
            setNutritionStats(nutritionData);
            // Merge global stats (visits, members) with existing stats
            setStats(prev => ({
                ...prev,
                ...dashboardData
            }));

            if (employeeData.length > 0) {
                const usdEmployees = employeeData.filter((emp: any) => emp.currency === 'USD' || !emp.currency);
                const kwdEmployees = employeeData.filter((emp: any) => emp.currency === 'KWD');
                
                const totalSalaryUSD = usdEmployees.reduce((sum: number, emp: any) => sum + Number(emp.salary || 0), 0);
                const totalSalaryKWD = kwdEmployees.reduce((sum: number, emp: any) => sum + Number(emp.salary || 0), 0);
                
                setAvgSalary(usdEmployees.length > 0 ? totalSalaryUSD / usdEmployees.length : 0);
                setAvgSalaryKWD(kwdEmployees.length > 0 ? totalSalaryKWD / kwdEmployees.length : 0);
            } else {
                setAvgSalary(0);
                setAvgSalaryKWD(0);
            }

            try {
                const months = Array.from({ length: 6 }, (_, i) => dayjs().subtract(5 - i, 'month'));
                const series = months.map(m => {
                    const monthKey = m.format('MMM YYYY');
                    const prefix = m.format('YYYY-MM');
                    const income = allFinRecords.filter(r => r.type?.toLowerCase() === 'income' && (r.transaction_date || r.date)?.startsWith(prefix)).reduce((s, r) => s + (r.amount || 0), 0);
                    const expense = allFinRecords.filter(r => r.type?.toLowerCase() === 'expense' && (r.transaction_date || r.date)?.startsWith(prefix)).reduce((s, r) => s + (r.amount || 0), 0);
                    const arrears = allFinRecords.filter(r => r.type?.toLowerCase() === 'arrears' && (r.transaction_date || r.date)?.startsWith(prefix)).reduce((s, r) => s + (r.amount || 0), 0);
                    return { month: monthKey, income, expense, arrears };
                });
                setMonthlyFinancialData(series);
            } catch (err) {
                console.warn('Failed to compute monthly financial data', err);
                setMonthlyFinancialData([]);
            }
        } catch (error) {
            console.error('Error loading global dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadSportData = async () => {
        setLoadingSport(true);
        try {
            const sportParam = selectedSport === 'All' ? undefined : selectedSport;
            const [statsData, marketData, statusData, expiryData, dealTypeData] = await Promise.all([
                dashboardService.getStats({ sport: sportParam }),
                dashboardService.getMarketValueDistribution({ sport: sportParam }),
                dashboardService.getContractStatusData({ sport: sportParam }),
                dashboardService.getContractExpiryTimeline({ sport: sportParam }),
                dashboardService.getDealTypeStats({ sport: sportParam }),
            ]);

            setStats(statsData);
            setMarketValueDist(marketData);
            setContractStatus(statusData);
            setContractExpiry(expiryData);
            setDealTypeDist(dealTypeData);
        } catch (error) {
            console.error('Error loading sport dashboard data:', error);
        } finally {
            setLoadingSport(false);
        }
    };

    const COLORS = ['#C9A24D', '#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1'];
    const screensGrid = Grid.useBreakpoint();

    const hasMarketData = marketValueDist.some(item => item.count > 0);
    const hasStatusData = contractStatus.some(item => item.count > 0);
    const hasExpiryData = contractExpiry.some(item => item.count > 0);

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '100px 0' }}>
                <Spin size="large" />
            </div>
        );
    }

    return (
        <div className="fade-in pb-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <Title level={isMobile ? 3 : 2} style={{ margin: 0 }}>{t('owner.dashboard.title', { defaultValue: 'Owner Dashboard' })}</Title>
                    <Text type="secondary">{t('owner.dashboard.subtitle', { defaultValue: 'Complete overview of your sports agency operations' })}</Text>
                </div>
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
                        {Object.values(Sport).filter((v) => typeof v === 'string').map((s) => (
                            <Option key={s} value={s as string}>{t(`enums.Sport.${s}`, { defaultValue: s })}</Option>
                        ))}
                    </Select>
                </div>
            </div>

            <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <Tabs
                    defaultActiveKey="players"
                    type="card"
                    className="dashboard-tabs"
                    items={[
                        {
                            key: 'players',
                            label: (
                                <span className="flex items-center gap-2">
                                    <UserOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />
                                    {t('owner.dashboard.tabs.players')}
                                </span>
                            ),
                            children: (
                                <div className="pt-4">
                                    <Row gutter={[16, 16]}>
                                        <Col xs={24} sm={8}>
                                            <Card className="card-hover">
                                                <Statistic
                                                    title={t('admin.dashboard.total_players')}
                                                    value={stats.totalPlayers}
                                                    prefix={<UserOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} className="text-[#3F3F3F]" />}
                                                    valueStyle={{ color: '#3F3F3F', fontWeight: 'bold' }}
                                                    loading={loading || loadingSport}
                                                />
                                                <div className="mt-2 pt-2 border-t border-slate-100 flex flex-col gap-1">
                                                    <div className="flex justify-between items-center text-[10px]">
                                                        <Text type="secondary">{t('admin.dashboard.signing_count')}</Text>
                                                        <Tag color="gold" className="m-0 text-[9px] font-bold border-none bg-gold-50">{stats.signingCount || 0}</Tag>
                                                    </div>
                                                    <div className="flex justify-between items-center text-[10px]">
                                                        <Text type="secondary">{t('admin.dashboard.authorization_count')}</Text>
                                                        <Tag color="blue" className="m-0 text-[9px] font-bold border-none bg-blue-50">{stats.authorizationCount || 0}</Tag>
                                                    </div>
                                                    <div className="flex justify-between items-center text-[10px]">
                                                        <Text type="secondary">{t('admin.dashboard.not_joined_count')}</Text>
                                                        <Tag color="default" className="m-0 text-[9px] font-bold border-none bg-slate-50">{stats.notJoinedCount || 0}</Tag>
                                                    </div>
                                                </div>
                                            </Card>
                                        </Col>
                                        <Col xs={24} sm={8}>
                                            <Card className="card-hover">
                                                <Statistic
                                                    title={t('admin.dashboard.active_contracts')}
                                                    value={stats.activeContracts}
                                                    prefix={<FileTextOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} className="text-[#52c41a]" />}
                                                    valueStyle={{ color: '#3F3F3F', fontWeight: 'bold' }}
                                                    loading={loading || loadingSport}
                                                />
                                            </Card>
                                        </Col>
                                        <Col xs={24} sm={8}>
                                            <Card className="card-hover">
                                                <Statistic
                                                    title={t('admin.dashboard.expiring_soon')}
                                                    value={stats.expiringSoon}
                                                    prefix={<CalendarOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} className="text-[#faad14]" />}
                                                    valueStyle={{ color: '#3F3F3F', fontWeight: 'bold' }}
                                                    suffix={<span className="text-xs font-normal text-slate-400 ml-1"> {t('admin.dashboard.contracts_suffix')}</span>}
                                                    loading={loading || loadingSport}
                                                />
                                            </Card>
                                        </Col>

                                        <Col xs={24} lg={12}>
                                            <Card
                                                title={t('admin.dashboard.market_dist_title')}
                                                className="card-hover"
                                                loading={loading || loadingSport}
                                            >
                                                {hasMarketData ? (
                                                    <ResponsiveContainer width="100%" height={300}>
                                                        <PieChart>
                                                            <Pie
                                                                data={marketValueDist}
                                                                dataKey="count"
                                                                nameKey="range"
                                                                cx="50%"
                                                                cy="45%"
                                                                outerRadius={80}
                                                                innerRadius={40}
                                                                paddingAngle={2}
                                                            >
                                                                {marketValueDist.map((entry, index) => (
                                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                                ))}
                                                            </Pie>
                                                            <Tooltip
                                                                contentStyle={{ direction: i18n.language === 'ar' ? 'rtl' : 'ltr' }}
                                                                formatter={(value, name) => [value, t(`admin.dashboard.${name}`, { defaultValue: name as string })]}
                                                            />
                                                            <Legend
                                                                iconType="circle"
                                                                formatter={(label) => label ? t(`admin.dashboard.${label}`, { defaultValue: label }) : ''}
                                                                wrapperStyle={{ paddingTop: '20px', direction: i18n.language === 'ar' ? 'rtl' : 'ltr' }}
                                                            />
                                                        </PieChart>
                                                    </ResponsiveContainer>
                                                ) : (
                                                    <div className="flex flex-col items-center justify-center h-[300px]">
                                                        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('common.no_data', { defaultValue: 'No data available' })} />
                                                    </div>
                                                )}
                                            </Card>
                                        </Col>

                                        <Col xs={24} lg={12}>
                                            <Card
                                                title={t('admin.dashboard.contract_status_title')}
                                                className="card-hover"
                                                loading={loading || loadingSport}
                                            >
                                                {hasStatusData ? (
                                                    <ResponsiveContainer width="100%" height={300}>
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
                                                                radius={[4, 4, 0, 0]}
                                                                barSize={40}
                                                            >
                                                                {contractStatus.map((entry, index) => (
                                                                    <Cell
                                                                        key={`cell-${index}`}
                                                                        fill={entry.status === 'ACTIVE' ? '#C9A24D' : '#3F3F3F'}
                                                                    />
                                                                ))}
                                                            </Bar>
                                                        </BarChart>
                                                    </ResponsiveContainer>
                                                ) : (
                                                    <div className="flex flex-col items-center justify-center h-[300px]">
                                                        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('common.no_data', { defaultValue: 'No data available' })} />
                                                    </div>
                                                )}
                                            </Card>
                                        </Col>

                                        <Col xs={24}>
                                            <Card
                                                title={t('admin.dashboard.expiry_timeline_title')}
                                                className="card-hover"
                                                loading={loading || loadingSport}
                                            >
                                                {hasExpiryData ? (
                                                    <ResponsiveContainer width="100%" height={300}>
                                                        <LineChart data={contractExpiry}>
                                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                                            <XAxis
                                                                dataKey="month"
                                                                axisLine={false}
                                                                tickLine={false}
                                                                tickFormatter={(val) => dayjs(val).locale(i18n.language).format('MMM YYYY')}
                                                            />
                                                            <YAxis axisLine={false} tickLine={false} />
                                                            <Tooltip
                                                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                                                labelFormatter={(val) => dayjs(val).locale(i18n.language).format('MMMM YYYY')}
                                                            />
                                                            <Legend iconType="circle" wrapperStyle={{ paddingTop: '10px' }} />
                                                            <Line
                                                                name={t('common.count')}
                                                                type="monotone"
                                                                dataKey="count"
                                                                stroke="#C9A24D"
                                                                strokeWidth={3}
                                                                dot={{ fill: '#C9A24D', r: 4, strokeWidth: 2, stroke: '#fff' }}
                                                                activeDot={{ r: 6, strokeWidth: 0 }}
                                                            />
                                                        </LineChart>
                                                    </ResponsiveContainer>
                                                ) : (
                                                    <div className="flex flex-col items-center justify-center h-[300px]">
                                                        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('common.no_data', { defaultValue: 'No data available' })} />
                                                    </div>
                                                )}
                                            </Card>
                                        </Col>
                                    </Row>
                                </div>
                            )
                        },
                        {
                            key: 'deals',
                            label: (
                                <span className="flex items-center gap-2">
                                    <TrophyOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />
                                    {t('owner.dashboard.tabs.deals')}
                                </span>
                            ),
                            children: (
                                <div className="pt-4">
                                    <Row gutter={[16, 16]}>
                                        <Col xs={24} lg={10}>
                                            <Row gutter={[16, 16]}>
                                                <Col xs={24} sm={12}>
                                                    <Card className="card-hover">
                                                        <Statistic
                                                            title={t('admin.deals.total_deals')}
                                                            value={stats.totalDeals}
                                                            prefix={<TrophyOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} className="text-[#C9A24D]" />}
                                                            valueStyle={{ color: '#3F3F3F', fontWeight: 'bold' }}
                                                            loading={loading || loadingSport}
                                                        />
                                                    </Card>
                                                </Col>
                                                <Col xs={24} sm={12}>
                                                    <Card className="card-hover">
                                                        <Statistic
                                                            title={t('admin.deals.deals_this_month')}
                                                            value={stats.dealsThisMonth}
                                                            prefix={<CalendarOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} className="text-blue-500" />}
                                                            valueStyle={{ color: '#3F3F3F', fontWeight: 'bold' }}
                                                            loading={loading || loadingSport}
                                                        />
                                                    </Card>
                                                </Col>
                                                <Col xs={24}>
                                                    <Card className="card-hover">
                                                        <Statistic
                                                            title={t('admin.deals.total_deals_amount')}
                                                            value={formatCurrency(stats.totalDealsAmount, i18n.language)}
                                                            prefix={<RiseOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} className="text-green-500" />}
                                                            valueStyle={{ color: '#3F3F3F', fontWeight: 'bold' }}
                                                            loading={loading || loadingSport}
                                                        />
                                                    </Card>
                                                </Col>
                                            </Row>
                                        </Col>

                                        <Col xs={24} lg={14}>
                                            <Card title={t('admin.deals.deal_type_dist')} className="card-hover h-full" loading={loading || loadingSport}>
                                                <ResponsiveContainer width="100%" height={250}>
                                                    <BarChart data={dealTypeDist}>
                                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                                        <XAxis
                                                            dataKey="type"
                                                            tickFormatter={(val) => t(`admin.deals.${val.toLowerCase()}`)}
                                                            axisLine={false}
                                                            tickLine={false}
                                                        />
                                                        <YAxis axisLine={false} tickLine={false} />
                                                        <Tooltip
                                                            cursor={{ fill: '#f8fafc' }}
                                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                                            labelFormatter={(val) => t(`admin.deals.${val.toLowerCase()}`)}
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
                                            </Card>
                                        </Col>
                                    </Row>
                                </div>
                            )
                        },
                        {
                            key: 'members',
                            label: (
                                <span className="flex items-center gap-2">
                                    <TeamOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />
                                    {t('admin.dashboard.tabs.members')}
                                </span>
                            ),
                            children: (
                                <div className="pt-4">
                                    <Row gutter={[16, 16]}>
                                        <Col xs={24} sm={12} lg={6}>
                                            <Card className="card-hover border-l-4 border-l-[#C9A24D]">
                                                <Statistic
                                                    title={t('admin.dashboard.total_members')}
                                                    value={stats.totalMembers || 0}
                                                    prefix={<UserOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} className="text-[#C9A24D]" />}
                                                    valueStyle={{ color: '#3F3F3F', fontWeight: 'bold' }}
                                                    loading={loading}
                                                />
                                                <div className="mt-2 flex flex-col gap-1">
                                                    <div className="flex justify-between text-[10px]">
                                                        <Text type="secondary">{t('admin.members.today_registrations')}:</Text>
                                                        <Text strong>{recentMembers.filter(m => dayjs(m.createdAt).isSame(dayjs(), 'day')).length}</Text>
                                                    </div>
                                                    <div className="flex justify-between text-[10px]">
                                                        <Text type="secondary">{t('admin.members.monthly_members')}:</Text>
                                                        <Text strong>{recentMembers.filter(m => dayjs(m.createdAt).isSame(dayjs(), 'month')).length}</Text>
                                                    </div>
                                                </div>
                                            </Card>
                                        </Col>
                                        <Col xs={24} sm={12} lg={6}>
                                            <Card className="card-hover border-l-4 border-l-blue-500">
                                                <Statistic
                                                    title={t('admin.dashboard.guest_visits')}
                                                    value={stats.guestVisits || 0}
                                                    prefix={<ThunderboltOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} className="text-blue-500" />}
                                                    valueStyle={{ color: '#3F3F3F', fontWeight: 'bold' }}
                                                    loading={loading}
                                                />
                                                <div className="mt-2 flex flex-col gap-1">
                                                    <div className="flex justify-between text-[10px]">
                                                        <Text type="secondary">{t('admin.members.today_visits')}:</Text>
                                                        <Text strong>{(stats.dailyStats?.[stats.dailyStats.length - 1]?.guest || 0) + (stats.dailyStats?.[stats.dailyStats.length - 1]?.registered || 0)}</Text>
                                                    </div>
                                                </div>
                                            </Card>
                                        </Col>
                                        <Col xs={24} sm={12} lg={6}>
                                            <Card className="card-hover border-l-4 border-l-green-500">
                                                <Statistic
                                                    title={t('admin.dashboard.registered_visits')}
                                                    value={stats.registeredVisits || 0}
                                                    prefix={<CheckCircleOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} className="text-green-500" />}
                                                    valueStyle={{ color: '#3F3F3F', fontWeight: 'bold' }}
                                                    loading={loading}
                                                />
                                                <div className="mt-2 flex flex-col gap-1">
                                                    <div className="flex justify-between text-[10px]">
                                                        <Text type="secondary">{t('admin.members.monthly_visits')}:</Text>
                                                        <Text strong>{stats.dailyStats?.reduce((acc, curr) => acc + (curr.guest || 0) + (curr.registered || 0), 0) || 0}</Text>
                                                    </div>
                                                </div>
                                            </Card>
                                        </Col>
                                        <Col xs={24} sm={12} lg={6}>
                                            <Card className="card-hover border-l-4 border-l-purple-500">
                                                <Statistic
                                                    title={t('admin.dashboard.registrations')}
                                                    value={stats.dailyStats?.reduce((acc, curr) => acc + (curr.registrations || 0), 0) || 0}
                                                    prefix={<HistoryOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} className="text-purple-500" />}
                                                    suffix={<span className="text-xs font-normal"> / 7d</span>}
                                                    valueStyle={{ color: '#3F3F3F', fontWeight: 'bold' }}
                                                    loading={loading}
                                                />
                                            </Card>
                                        </Col>

                                        <Col xs={24} lg={14}>
                                            <Card
                                                title={
                                                    <div className="flex items-center gap-2">
                                                        <TeamOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} style={{ color: '#C9A24D' }} />
                                                        <span>{t('admin.members.recent_registrations')}</span>
                                                    </div>
                                                }
                                                className="card-hover overflow-hidden"
                                                styles={{ body: { padding: 0 } }}
                                                extra={<Button type="link" onClick={() => navigate('/owner/members')} className="!text-[#C9A24D]">{t('common.view_details')}</Button>}
                                            >
                                                <Table<User>
                                                    dataSource={recentMembers.slice(0, 6)}
                                                    pagination={false}
                                                    loading={membersLoading}
                                                    rowKey="id"
                                                    size="middle"
                                                    columns={[
                                                        {
                                                            title: t('admin.members.table.name'),
                                                            dataIndex: 'name',
                                                            key: 'name',
                                                            render: (name, record) => (
                                                                <div className="flex items-center gap-3">
                                                                    <Avatar size="small" src={record.avatar} icon={<UserOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />} />
                                                                    <div className="flex flex-col">
                                                                        <Text strong className="text-xs">{name}</Text>
                                                                        <Text type="secondary" className="text-[10px]">{record.email}</Text>
                                                                    </div>
                                                                </div>
                                                            )
                                                        },
                                                        {
                                                            title: t('admin.members.table.type'),
                                                            dataIndex: 'memberType',
                                                            key: 'memberType',
                                                            render: (type) => (
                                                                <Tag color={type === 'PLAYER' ? 'gold' : 'blue'} className="text-[10px] m-0 border-none font-bold">
                                                                    {t(`member_types.${type}`)}
                                                                </Tag>
                                                            )
                                                        },
                                                        {
                                                            title: t('admin.members.registration_time'),
                                                            dataIndex: 'createdAt',
                                                            key: 'createdAt',
                                                            render: (date) => (
                                                                <div className="flex flex-col">
                                                                    <Text className="text-[10px]">{dayjs(date).format('YYYY-MM-DD')}</Text>
                                                                    <Text type="secondary" className="text-[9px]">{dayjs(date).format('HH:mm')}</Text>
                                                                </div>
                                                            )
                                                        }
                                                    ]}
                                                />
                                            </Card>
                                        </Col>

                                        <Col xs={24} lg={10}>
                                            <Card
                                                title={t('admin.dashboard.member_breakdown')}
                                                className="card-hover h-full"
                                                loading={loading}
                                            >
                                                <ResponsiveContainer width="100%" height={250}>
                                                    <PieChart>
                                                        <Pie
                                                            data={[
                                                                { name: t('member_types.PLAYER'), value: stats.playersMemberCount || 0 },
                                                                { name: t('member_types.COACH'), value: stats.coachesMemberCount || 0 },
                                                                { name: t('member_types.SCOUT'), value: stats.scoutsMemberCount || 0 },
                                                                { name: t('member_types.CLUB'), value: stats.clubsMemberCount || 0 },
                                                                { name: t('member_types.ADMINISTRATOR'), value: stats.administratorsMemberCount || 0 },
                                                                { name: t('member_types.REFEREE'), value: stats.refereesMemberCount || 0 },
                                                                { name: t('member_types.PHOTOGRAPHER'), value: stats.photographersMemberCount || 0 },
                                                                { name: t('member_types.OTHER'), value: stats.othersMemberCount || 0 },
                                                            ].filter(d => d.value > 0)}
                                                            dataKey="value"
                                                            nameKey="name"
                                                            cx="50%"
                                                            cy="50%"
                                                            outerRadius={70}
                                                            innerRadius={35}
                                                            paddingAngle={5}
                                                        >
                                                            {COLORS.map((_, index) => (
                                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                            ))}
                                                        </Pie>
                                                        <Tooltip />
                                                        <Legend layout="vertical" align="right" verticalAlign="middle" iconType="circle" />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            </Card>
                                        </Col>

                                        <Col xs={24}>
                                            <Card
                                                title={
                                                    <div className="flex items-center gap-2">
                                                        <ThunderboltOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} style={{ color: '#1890ff' }} />
                                                        <span>{t('admin.dashboard.daily_activity')}</span>
                                                    </div>
                                                }
                                                className="card-hover"
                                                loading={loading}
                                            >
                                                <ResponsiveContainer width="100%" height={300}>
                                                    <LineChart data={stats.dailyStats || []}>
                                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                                        <XAxis
                                                            dataKey="date"
                                                            axisLine={false}
                                                            tickLine={false}
                                                            tickFormatter={(val) => dayjs(val).locale(i18n.language).format('DD MMM')}
                                                        />
                                                        <YAxis axisLine={false} tickLine={false} />
                                                        <Tooltip
                                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                                        />
                                                        <Legend iconType="circle" />
                                                        <Line
                                                            name={t('admin.dashboard.guest_visits')}
                                                            type="monotone"
                                                            dataKey="guest"
                                                            stroke="#3F3F3F"
                                                            strokeWidth={2}
                                                            dot={{ r: 3 }}
                                                        />
                                                        <Line
                                                            name={t('admin.dashboard.registered_visits')}
                                                            type="monotone"
                                                            dataKey="registered"
                                                            stroke="#1890ff"
                                                            strokeWidth={2}
                                                            dot={{ r: 3 }}
                                                        />
                                                        <Line
                                                            name={t('admin.dashboard.registrations')}
                                                            type="monotone"
                                                            dataKey="registrations"
                                                            stroke="#C9A24D"
                                                            strokeWidth={3}
                                                            dot={{ r: 4, fill: '#C9A24D' }}
                                                        />
                                                    </LineChart>
                                                </ResponsiveContainer>
                                            </Card>
                                        </Col>
                                    </Row>
                                </div>
                            )
                        },
                        {
                            key: 'financials',
                            label: (
                                <span className="flex items-center gap-2">
                                    <RiseOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />
                                    {t('owner.dashboard.tabs.financials')}
                                </span>
                            ),
                            children: (
                                <div className="pt-4">
                                    <Row gutter={[16, 16]}>
                                        <Col xs={24} sm={12} lg={4}>
                                            <Card className="card-hover">
                                                <Statistic
                                                    title={t('owner.dashboard.total_income')}
                                                    value={formatCurrency(financialStats.totalIncome, i18n.language)}
                                                    prefix={<DollarOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} className="text-[#C9A24D]" />}
                                                    valueStyle={{ color: '#C9A24D', fontWeight: 'bold' }}
                                                    loading={loading}
                                                />
                                            </Card>
                                        </Col>
                                        <Col xs={24} sm={12} lg={4}>
                                            <Card className="card-hover">
                                                <Statistic
                                                    title={t('owner.dashboard.total_expense')}
                                                    value={formatCurrency(financialStats.totalExpense, i18n.language)}
                                                    prefix={<DollarOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} className="text-[#f5222d]" />}
                                                    valueStyle={{ color: '#f5222d', fontWeight: 'bold' }}
                                                    loading={loading}
                                                />
                                            </Card>
                                        </Col>
                                        <Col xs={24} sm={12} lg={4}>
                                            <Card className="card-hover">
                                                <Statistic
                                                    title={t('owner.dashboard.total_arrears')}
                                                    value={formatCurrency(financialStats.totalArrears || 0, i18n.language)}
                                                    prefix={<HistoryOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} className="text-[#faad14]" />}
                                                    valueStyle={{ color: '#faad14', fontWeight: 'bold' }}
                                                    loading={loading}
                                                />
                                            </Card>
                                        </Col>
                                        <Col xs={24} sm={12} lg={4}>
                                            <Card className="card-hover">
                                                <Statistic
                                                    title={t('owner.dashboard.net_profit')}
                                                    value={formatCurrency(financialStats.netProfit, i18n.language)}
                                                    prefix={<DollarOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} className={financialStats.netProfit >= 0 ? "text-[#52c41a]" : "text-[#f5222d]"} />}
                                                    valueStyle={{ color: financialStats.netProfit >= 0 ? '#52c41a' : '#f5222d', fontWeight: 'bold' }}
                                                    loading={loading}
                                                />
                                            </Card>
                                        </Col>
                                        <Col xs={24} sm={12} lg={4}>
                                            <Card className="card-hover">
                                                <Statistic
                                                    title={t('owner.dashboard.monthly_profit')}
                                                    value={formatCurrency(financialStats.monthlyIncome - financialStats.monthlyExpense, i18n.language)}
                                                    prefix={<RiseOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} className={financialStats.monthlyIncome - financialStats.monthlyExpense >= 0 ? "text-[#52c41a]" : "text-[#f5222d]"} />}
                                                    valueStyle={{ color: financialStats.monthlyIncome - financialStats.monthlyExpense >= 0 ? '#52c41a' : '#f5222d', fontWeight: 'bold' }}
                                                    loading={loading}
                                                />
                                            </Card>
                                        </Col>

                                        <Col xs={24}>
                                            <Card title={t('owner.dashboard.financial_overview')} className="card-hover" loading={loading}>
                                                <ResponsiveContainer width="100%" height={300}>
                                                    <LineChart data={monthlyFinancialData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                                        <XAxis dataKey="month" />
                                                        <YAxis />
                                                        <Tooltip formatter={(value: number) => formatCurrency(value, i18n.language)} />
                                                        <Legend iconType="circle" />
                                                        <Line type="monotone" dataKey="income" name={t('owner.dashboard.total_income')} stroke="#52c41a" strokeWidth={2} dot={{ r: 3 }} />
                                                        <Line type="monotone" dataKey="expense" name={t('owner.dashboard.total_expense')} stroke="#f5222d" strokeWidth={2} dot={{ r: 3 }} />
                                                        <Line type="monotone" dataKey="arrears" name={t('owner.dashboard.total_arrears', { defaultValue: 'Total Arrears' })} stroke="#faad14" strokeWidth={2} dot={{ r: 3 }} strokeDasharray="5 5" />
                                                    </LineChart>
                                                </ResponsiveContainer>
                                            </Card>
                                        </Col>
                                    </Row>
                                </div>
                            )
                        },
                        {
                            key: 'nutrition',
                            label: (
                                <span className="flex items-center gap-2">
                                    <MedicineBoxOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />
                                    {t('owner.nutrition.title')}
                                </span>
                            ),
                            children: (
                                <div className="pt-4">
                                     <Row gutter={[16, 16]}>
                                        <Col xs={24}>
                                            <Card 
                                                className="premium-card overflow-hidden" 
                                                style={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)' }}
                                                title={
                                                    <div className="flex items-center gap-3 py-2">
                                                        <div className="w-12 h-12 rounded-xl bg-gold-100 flex items-center justify-center text-gold-600 text-xl shadow-inner">
                                                            <MedicineBoxOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />
                                                        </div>
                                                        <div>
                                                            <div className="text-lg font-bold text-slate-800">{t('owner.nutrition.title')}</div>
                                                            <div className="text-xs text-slate-400 font-normal uppercase tracking-wider">{t('owner.nutrition.subtitle')}</div>
                                                        </div>
                                                    </div>
                                                }
                                            >
                                                 <div className="max-w-5xl">
                                                    <Row gutter={[16, 16]} className="mb-8">
                                                        <Col xs={24} sm={12} lg={8}>
                                                            <Card className="card-hover border-t-4 border-t-gold-500">
                                                                <Statistic 
                                                                    title={t('admin.dashboard.total_players')} 
                                                                    value={nutritionStats.active_players_count || 0}
                                                                    prefix={<UserOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} className="text-gold-500" />}
                                                                    valueStyle={{ fontWeight: 'bold' }}
                                                                />
                                                            </Card>
                                                        </Col>
                                                        <Col xs={24} sm={12} lg={8}>
                                                            <Card className="card-hover border-t-4 border-t-blue-500">
                                                                <Statistic 
                                                                    title={t('owner.nutrition.physical_reports')} 
                                                                    value={nutritionStats.reports_count || 0}
                                                                    prefix={<MedicineBoxOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} className="text-blue-500" />}
                                                                    valueStyle={{ fontWeight: 'bold' }}
                                                                />
                                                            </Card>
                                                        </Col>
                                                        <Col xs={24} sm={12} lg={8}>
                                                            <Card className="card-hover border-t-4 border-t-green-500">
                                                                <Statistic 
                                                                    title={t('owner.nutrition.nutrition_plans')} 
                                                                    value={nutritionStats.nutrition_programs_count || 0}
                                                                    prefix={<CheckCircleOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} className="text-green-500" />}
                                                                    valueStyle={{ fontWeight: 'bold' }}
                                                                />
                                                            </Card>
                                                        </Col>
                                                        <Col xs={24} sm={12} lg={8}>
                                                            <Card className="card-hover border-t-4 border-t-purple-500">
                                                                <Statistic 
                                                                    title={t('owner.nutrition.training_plans')} 
                                                                    value={nutritionStats.training_programs_count || 0}
                                                                    prefix={<ThunderboltOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} className="text-purple-500" />}
                                                                    valueStyle={{ fontWeight: 'bold' }}
                                                                />
                                                            </Card>
                                                        </Col>
                                                        <Col xs={24} sm={12} lg={8}>
                                                            <Card className="card-hover border-t-4 border-t-slate-400">
                                                                <Statistic 
                                                                    title={t('owner.nutrition.progress_photos')} 
                                                                    value={nutritionStats.progress_photos_count || 0}
                                                                    prefix={<RiseOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} className="text-slate-400" />}
                                                                    valueStyle={{ fontWeight: 'bold' }}
                                                                />
                                                            </Card>
                                                        </Col>
                                                    </Row>
                                                    
                                                    <Divider className="my-8" />
                                                    
                                                    <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100 relative overflow-hidden">
                                                        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6 text-center md:text-left">
                                                            <div>
                                                                <Title level={4} className="m-0 text-slate-800 mb-2">
                                                                    {t('owner.nutrition.title')}
                                                                </Title>
                                                                <Text className="text-slate-500 block max-w-md">
                                                                    {t('owner.nutrition.subtitle')}
                                                                </Text>
                                                            </div>
                                                            <Button 
                                                                type="primary" 
                                                                size="large" 
                                                                className="bg-[#C9A24D] hover:bg-gold-500 border-none px-10 h-12 rounded-xl font-bold shadow-lg shadow-gold-900/20"
                                                                onClick={() => navigate('/owner/nutrition')}
                                                            >
                                                                {t('common.view_details')}
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </Card>
                                        </Col>
                                     </Row>
                                </div>
                            )
                        },
                        {
                            key: 'team',
                            label: (
                                <span className="flex items-center gap-2">
                                    <TeamOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />
                                    {t('owner.dashboard.tabs.team')}
                                </span>
                            ),
                            children: (
                                <div className="pt-4">
                                    <Row gutter={[16, 16]}>
                                        <Col xs={24} sm={12} lg={6}>
                                            <Card className="card-hover">
                                                <Statistic
                                                    title={t('owner.dashboard.admins')}
                                                    value={adminCount}
                                                    prefix={<TeamOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} className="text-[#3F3F3F]" />}
                                                    valueStyle={{ color: '#3F3F3F', fontWeight: 'bold' }}
                                                    loading={loading}
                                                />
                                            </Card>
                                        </Col>
                                        <Col xs={24} sm={12} lg={6}>
                                            <Card className="card-hover">
                                                <Statistic
                                                    title={t('owner.dashboard.employees')}
                                                    value={employeeCount}
                                                    prefix={<MedicineBoxOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} className="text-[#C9A24D]" />}
                                                    valueStyle={{ color: '#3F3F3F', fontWeight: 'bold' }}
                                                    loading={loading}
                                                />
                                            </Card>
                                        </Col>
                                        <Col xs={24} sm={12} lg={6}>
                                            <Card className="card-hover">
                                                <Statistic
                                                    title={t('owner.dashboard.avg_salary')}
                                                    value={avgSalary}
                                                    formatter={(value) => (
                                                        <div className="flex flex-col">
                                                            <span>{formatCurrency(value as number, 'USD')}</span>
                                                            {avgSalaryKWD > 0 && <span className="text-xs text-slate-400 font-normal">{formatCurrency(avgSalaryKWD, 'KWD')}</span>}
                                                        </div>
                                                    )}
                                                    prefix={<DollarOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} className="text-[#C9A24D]" />}
                                                    valueStyle={{ color: '#3F3F3F', fontWeight: 'bold' }}
                                                    loading={loading}
                                                />
                                            </Card>
                                        </Col>
                                        <Col xs={24} sm={12} lg={6}>
                                            <Card className="card-hover">
                                                <Statistic
                                                    title={t('owner.dashboard.total_team')}
                                                    value={adminCount + employeeCount}
                                                    prefix={<TeamOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} className="text-[#3F3F3F]" />}
                                                    valueStyle={{ color: '#3F3F3F', fontWeight: 'bold' }}
                                                    loading={loading}
                                                />
                                            </Card>
                                        </Col>

                                        <Col xs={24}>
                                            <Card title={t('owner.dashboard.team_overview')} className="card-hover" loading={loading}>
                                                <ResponsiveContainer width="100%" height={300}>
                                                    <PieChart>
                                                        <Pie
                                                            data={[{ key: 'admins', value: adminCount }, { key: 'employees', value: employeeCount }]}
                                                            dataKey="value"
                                                            nameKey="key"
                                                            cx="50%"
                                                            cy="45%"
                                                            outerRadius={80}
                                                            innerRadius={40}
                                                            paddingAngle={2}
                                                        >
                                                            {[adminCount, employeeCount].map((_, idx) => (
                                                                <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                                                            ))}
                                                        </Pie>
                                                        <Tooltip
                                                            formatter={(value: number) => `${formatCurrency(value, i18n.language)}`}
                                                            labelFormatter={(label) => label ? t(`owner.dashboard.${label}`) : ''}
                                                            contentStyle={{ direction: i18n.language === 'ar' ? 'rtl' : 'ltr' }}
                                                        />
                                                        <Legend
                                                            formatter={(label) => label ? t(`owner.dashboard.${label}`) : ''}
                                                            wrapperStyle={{ direction: i18n.language === 'ar' ? 'rtl' : 'ltr' }}
                                                            iconType="circle"
                                                        />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            </Card>
                                        </Col>
                                    </Row>
                                </div>
                            )
                        }
                    ]}
                />
            </Space>
        </div>
    );
};
