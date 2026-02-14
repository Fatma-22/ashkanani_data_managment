import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Spin, Typography, Space, Button, Select, Grid } from 'antd';
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
} from '@ant-design/icons';
import { mockDashboardApi } from '../../services/mockApi';
import { mockAdminApi, mockFinancialApi, mockEmployeeApi } from '../../services/mockOwnerApi';
import { DashboardStats, MarketValueDistribution, ContractStatusData, ContractExpiryData, FinancialStats, Sport } from '../../types';
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
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

const { Title, Text } = Typography;
const { Option } = Select;
const { useBreakpoint } = Grid;

export const OwnerDashboard: React.FC = () => {
    const { t, i18n } = useTranslation();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<DashboardStats>({
        totalPlayers: 0,
        activeContracts: 0,
        expiringSoon: 0,
        totalMarketValue: 0,
    });
    const [financialStats, setFinancialStats] = useState<FinancialStats>({
        totalIncome: 0,
        totalExpense: 0,
        netProfit: 0,
        monthlyIncome: 0,
        monthlyExpense: 0,
        yearlyIncome: 0,
        yearlyExpense: 0,
    });
    const [adminCount, setAdminCount] = useState(0);
    const [employeeCount, setEmployeeCount] = useState(0);
    const [marketValueDist, setMarketValueDist] = useState<MarketValueDistribution[]>([]);
    const [contractStatus, setContractStatus] = useState<ContractStatusData[]>([]);
    const [contractExpiry, setContractExpiry] = useState<ContractExpiryData[]>([]);
    const [monthlyFinancialData, setMonthlyFinancialData] = useState<Array<{ month: string; income: number; expense: number }>>([]);
    const [selectedSport, setSelectedSport] = useState<Sport | 'All'>('All');
    const screens = useBreakpoint();
    const isMobile = !screens.md;

    useEffect(() => {
        loadDashboardData();
    }, [selectedSport]);

    const loadDashboardData = async () => {
        setLoading(true);
        try {
            const [statsData, financialData, adminData, employeeData] = await Promise.all([
                mockDashboardApi.getStats(selectedSport),
                mockFinancialApi.getStats(),
                mockAdminApi.getAll(),
                mockEmployeeApi.getAll(),
            ]);

            setStats(statsData);
            setFinancialStats(financialData);
            setAdminCount(adminData.length);
            setEmployeeCount(employeeData.length);

            // Load charts data
            const [marketData, statusData, expiryData, allFinRecords] = await Promise.all([
                mockDashboardApi.getMarketValueDistribution(selectedSport),
                mockDashboardApi.getContractStatusData(selectedSport),
                mockDashboardApi.getContractExpiryTimeline(selectedSport),
                mockFinancialApi.getAll(),
            ]);

            setMarketValueDist(marketData);
            setContractStatus(statusData);
            setContractExpiry(expiryData);

            // Build monthly financial series for last 6 months
            try {
                const months = Array.from({ length: 6 }, (_, i) => dayjs().subtract(5 - i, 'month'));
                const series = months.map(m => {
                    const monthKey = m.format('MMM YYYY');
                    const prefix = m.format('YYYY-MM');
                    const income = allFinRecords.filter(r => r.type === 'income' && r.date.startsWith(prefix)).reduce((s, r) => s + r.amount, 0);
                    const expense = allFinRecords.filter(r => r.type === 'expense' && r.date.startsWith(prefix)).reduce((s, r) => s + r.amount, 0);
                    return { month: monthKey, income, expense };
                });
                setMonthlyFinancialData(series);
            } catch (err) {
                console.warn('Failed to compute monthly financial data', err);
                setMonthlyFinancialData([]);
            }
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const COLORS = ['#C9A24D', '#3F3F3F', '#52c41a', '#faad14', '#f5222d', '#722ed1'];
    const screensGrid = Grid.useBreakpoint();
    const isMobileGrid = !screensGrid.md;

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
                {/* KPI Cards */}
                <Row gutter={[16, 16]}>
                    <Col xs={24} sm={12} lg={6}>
                        <Card className="card-hover">
                            <Statistic
                                title={t('admin.dashboard.total_players')}
                                value={stats.totalPlayers}
                                prefix={<UserOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} className="text-[#3F3F3F]" />}
                                valueStyle={{ color: '#3F3F3F', fontWeight: 'bold' }}
                                loading={loading}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Card className="card-hover">
                            <Statistic
                                title={t('admin.dashboard.active_contracts')}
                                value={stats.activeContracts}
                                prefix={<FileTextOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} className="text-[#52c41a]" />}
                                valueStyle={{ color: '#3F3F3F', fontWeight: 'bold' }}
                                loading={loading}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Card className="card-hover">
                            <Statistic
                                title={t('admin.dashboard.expiring_soon')}
                                value={stats.expiringSoon}
                                prefix={<CalendarOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} className="text-[#faad14]" />}
                                valueStyle={{ color: '#3F3F3F', fontWeight: 'bold' }}
                                suffix={<span className="text-xs font-normal text-slate-400 ml-1"> {t('admin.dashboard.contracts_suffix')}</span>}
                                loading={loading}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Card className="card-hover">
                            <Statistic
                                title={t('admin.dashboard.market_value')}
                                value={formatCurrency(stats.totalMarketValue, i18n.language)}
                                prefix={<DollarOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} className="text-[#C9A24D]" />}
                                valueStyle={{
                                    color: '#C9A24D',
                                    fontWeight: 800
                                }}
                                loading={loading}
                            />
                        </Card>
                    </Col>
                </Row>

                {/* Financial KPI Cards */}
                <Row gutter={[16, 16]}>
                    <Col xs={24} sm={12} lg={6}>
                        <Card className="card-hover">
                            <Statistic
                                title={t('owner.dashboard.total_income')}
                                value={formatCurrency(financialStats.totalIncome, i18n.language)}
                                prefix={<RiseOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} className="text-[#52c41a]" />}
                                valueStyle={{ color: '#3F3F3F', fontWeight: 'bold' }}
                                loading={loading}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Card className="card-hover">
                            <Statistic
                                title={t('owner.dashboard.total_expense')}
                                value={formatCurrency(financialStats.totalExpense, i18n.language)}
                                prefix={<HistoryOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} className="text-[#f5222d]" />}
                                valueStyle={{ color: '#3F3F3F', fontWeight: 'bold' }}
                                loading={loading}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
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
                    <Col xs={24} sm={12} lg={6}>
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
                </Row>

                {/* Team KPI Cards */}
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
                                value={employeeCount > 0 ? formatCurrency(
                                    (employeeCount * 5000), // Mock average calculation
                                    i18n.language
                                ) : '$0'}
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
                </Row>

                {/* Charts Row 1 */}
                <Row gutter={[16, 16]}>
                    {/* Market Value Distribution */}
                        <Col xs={24} lg={12}>
                            <Card title={t('admin.dashboard.market_dist_title', { defaultValue: 'Market Value Distribution' })} className="card-hover">
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={marketValueDist}
                                            dataKey="count"
                                            nameKey="range"
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={screens.xs ? 80 : 100}
                                            label={screens.xs ? false : (entry) => i18n.language === 'ar' ? `${entry.count} :${entry.range}` : `${entry.range}: ${entry.count}`}
                                        >
                                            {marketValueDist.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </Card>
                        </Col>

                        {/* Contract Status Breakdown */}
                        <Col xs={24} lg={12}>
                            <Card
                                title={t('admin.dashboard.contract_status_title')}
                                className="card-hover"
                                loading={loading}
                            >
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
                                            fill="#3F3F3F"
                                            radius={[4, 4, 0, 0]}
                                            barSize={40}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </Card>
                        </Col>
                </Row>

                {/* Charts Row 2 */}
                <Row gutter={[16, 16]}>
                    {/* Contract Expiry Timeline */}
                    <Col xs={24}>
                        <Card
                            title={t('admin.dashboard.expiry_timeline_title')}
                            className="card-hover"
                            loading={loading}
                        >
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={contractExpiry}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                    <XAxis dataKey="month" axisLine={false} tickLine={false} />
                                    <YAxis axisLine={false} tickLine={false} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
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
                        </Card>
                    </Col>
                </Row>

                {/* Financial Overview */}
                <Row gutter={[16, 16]}>
                    <Col xs={24} lg={12}>
                        <Card title={t('owner.dashboard.financial_overview')} className="card-hover">
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={monthlyFinancialData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                    <XAxis dataKey="month" />
                                    <YAxis />
                                    <Tooltip formatter={(value: number) => formatCurrency(value, i18n.language)} />
                                    <Legend iconType="circle" />
                                    <Line type="monotone" dataKey="income" name={t('owner.dashboard.total_income')} stroke="#52c41a" strokeWidth={2} dot={{ r: 3 }} />
                                    <Line type="monotone" dataKey="expense" name={t('owner.dashboard.total_expense')} stroke="#f5222d" strokeWidth={2} dot={{ r: 3 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </Card>
                    </Col>

                    <Col xs={24} lg={12}>
                        <Card title={t('owner.dashboard.team_overview')} className="card-hover">
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    {/** build translated labels for slice names here */}
                                    <Pie
                                        data={[{ key: 'admins', value: adminCount }, { key: 'employees', value: employeeCount }]}
                                        dataKey="value"
                                        nameKey="key"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={screens.xs ? 80 : 100}
                                        label={(entry) => `${t(`owner.dashboard.${entry.key}`)}: ${entry.value}`}
                                    >
                                        {[adminCount, employeeCount].map((_, idx) => (
                                            <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value: number) => `${formatCurrency(value, i18n.language)}`} labelFormatter={(label) => t(`owner.dashboard.${label}`)} />
                                    <Legend formatter={(label) => t(`owner.dashboard.${label}`)} />
                                </PieChart>
                            </ResponsiveContainer>
                        </Card>
                    </Col>
                </Row>
            </Space>
        </div >
    );
};