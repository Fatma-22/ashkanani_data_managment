import React, { useEffect, useState } from 'react';
import { Card, Button, Space, Typography, Row, Col, Statistic, Spin, Table, Tag, DatePicker, Select, message } from 'antd';
import { BarChartOutlined, LineChartOutlined, PieChartOutlined, FileTextOutlined, DownloadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

export const OwnerReports: React.FC = () => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [reportType, setReportType] = useState('financial');
    const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>([null, null]);
    const [reportData, setReportData] = useState<any>(null);

    useEffect(() => {
        generateReport();
    }, [reportType, dateRange]);

    const generateReport = async () => {
        setLoading(true);
        try {
            // Mock report generation
            const mockData = {
                financial: {
                    summary: {
                        totalIncome: 150000,
                        totalExpense: 85000,
                        netProfit: 65000,
                        monthlyGrowth: 12.5,
                    },
                    incomeByCategory: [
                        { category: 'Player Transfers', amount: 85000 },
                        { category: 'Sponsorships', amount: 35000 },
                        { category: 'Merchandise', amount: 20000 },
                        { category: 'Other', amount: 10000 },
                    ],
                    expenseByCategory: [
                        { category: 'Player Salaries', amount: 45000 },
                        { category: 'Staff Salaries', amount: 20000 },
                        { category: 'Operations', amount: 12000 },
                        { category: 'Marketing', amount: 8000 },
                    ],
                },
                performance: {
                    summary: {
                        totalPlayers: 45,
                        activePlayers: 38,
                        injuredPlayers: 5,
                        averageRating: 7.2,
                    },
                    playerStats: [
                        { name: 'Player 1', rating: 8.5, matches: 25, goals: 12 },
                        { name: 'Player 2', rating: 7.8, matches: 28, goals: 8 },
                        { name: 'Player 3', rating: 7.2, matches: 22, goals: 15 },
                    ],
                },
                contracts: {
                    summary: {
                        totalContracts: 25,
                        expiringSoon: 8,
                        activeContracts: 17,
                        totalValue: 2500000,
                    },
                    contractDetails: [
                        { player: 'Player A', type: 'Transfer', value: 500000, status: 'Active' },
                        { player: 'Player B', type: 'Loan', value: 150000, status: 'Active' },
                        { player: 'Player C', type: 'Transfer', value: 750000, status: 'Expiring' },
                    ],
                },
            };

            setReportData(mockData[reportType as keyof typeof mockData]);
        } catch (error) {
            message.error(t('owner.reports.generate_failed'));
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = () => {
        message.success(t('owner.reports.download_success'));
    };

    const renderFinancialReport = () => (
        <div>
            {/* Financial Summary */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={12} lg={6}>
                    <Card className="card-hover">
                        <Statistic
                            title={t('owner.reports.total_income')}
                            value={reportData?.summary.totalIncome}
                            prefix={<BarChartOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} className="text-[#52c41a]" />}
                            valueStyle={{ color: '#3F3F3F', fontWeight: 'bold' }}
                            formatter={(value) => `$${(value as number).toLocaleString()}`}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card className="card-hover">
                        <Statistic
                            title={t('owner.reports.total_expense')}
                            value={reportData?.summary.totalExpense}
                            prefix={<LineChartOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} className="text-[#f5222d]" />}
                            valueStyle={{ color: '#3F3F3F', fontWeight: 'bold' }}
                            formatter={(value) => `$${(value as number).toLocaleString()}`}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card className="card-hover">
                        <Statistic
                            title={t('owner.reports.net_profit')}
                            value={reportData?.summary.netProfit}
                            prefix={<PieChartOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} className="text-[#52c41a]" />}
                            valueStyle={{ color: '#3F3F3F', fontWeight: 'bold' }}
                            formatter={(value) => `$${(value as number).toLocaleString()}`}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card className="card-hover">
                        <Statistic
                            title={t('owner.reports.monthly_growth')}
                            value={reportData?.summary.monthlyGrowth}
                            prefix={<BarChartOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} className="text-[#C9A24D]" />}
                            valueStyle={{ color: '#3F3F3F', fontWeight: 'bold' }}
                            suffix="%"
                        />
                    </Card>
                </Col>
            </Row>

            {/* Income by Category */}
            <Card title={t('owner.reports.income_by_category')} className="card-hover" style={{ marginBottom: 24 }}>
                <Table
                    dataSource={reportData?.incomeByCategory || []}
                    columns={[
                        {
                            title: t('owner.reports.category'),
                            dataIndex: 'category',
                            key: 'category',
                            render: (category: string) => t(`owner.reports.categories.${category.replace(/\s+/g, '_')}`, { defaultValue: category })
                        },
                        {
                            title: t('owner.reports.amount'),
                            dataIndex: 'amount',
                            key: 'amount',
                            render: (amount: number) => `$${amount.toLocaleString()}`
                        },
                    ]}
                    pagination={false}
                    rowKey="category"
                />
            </Card>

            {/* Expense by Category */}
            <Card title={t('owner.reports.expense_by_category')} className="card-hover">
                <Table
                    dataSource={reportData?.expenseByCategory || []}
                    columns={[
                        {
                            title: t('owner.reports.category'),
                            dataIndex: 'category',
                            key: 'category',
                            render: (category: string) => t(`owner.reports.categories.${category.replace(/\s+/g, '_')}`, { defaultValue: category })
                        },
                        {
                            title: t('owner.reports.amount'),
                            dataIndex: 'amount',
                            key: 'amount',
                            render: (amount: number) => `$${amount.toLocaleString()}`
                        },
                    ]}
                    pagination={false}
                    rowKey="category"
                />
            </Card>
        </div>
    );

    const renderPerformanceReport = () => (
        <div>
            {/* Performance Summary */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={12} lg={6}>
                    <Card className="card-hover">
                        <Statistic
                            title={t('owner.reports.total_players')}
                            value={reportData?.summary.totalPlayers}
                            prefix={<BarChartOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} className="text-[#3F3F3F]" />}
                            valueStyle={{ color: '#3F3F3F', fontWeight: 'bold' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card className="card-hover">
                        <Statistic
                            title={t('owner.reports.active_players')}
                            value={reportData?.summary.activePlayers}
                            prefix={<LineChartOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} className="text-[#52c41a]" />}
                            valueStyle={{ color: '#3F3F3F', fontWeight: 'bold' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card className="card-hover">
                        <Statistic
                            title={t('owner.reports.injured_players')}
                            value={reportData?.summary.injuredPlayers}
                            prefix={<PieChartOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} className="text-[#f5222d]" />}
                            valueStyle={{ color: '#3F3F3F', fontWeight: 'bold' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card className="card-hover">
                        <Statistic
                            title={t('owner.reports.average_rating')}
                            value={reportData?.summary.averageRating}
                            prefix={<BarChartOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} className="text-[#C9A24D]" />}
                            valueStyle={{ color: '#3F3F3F', fontWeight: 'bold' }}
                            precision={1}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Player Statistics */}
            <Card title={t('owner.reports.player_statistics')} className="card-hover">
                <Table
                    dataSource={reportData?.playerStats || []}
                    columns={[
                        { title: t('common.name'), dataIndex: 'name', key: 'name' },
                        { title: t('owner.reports.rating'), dataIndex: 'rating', key: 'rating' },
                        { title: t('owner.reports.matches'), dataIndex: 'matches', key: 'matches' },
                        { title: t('owner.reports.goals'), dataIndex: 'goals', key: 'goals' },
                    ]}
                    pagination={false}
                    rowKey="name"
                />
            </Card>
        </div>
    );

    const renderContractsReport = () => (
        <div>
            {/* Contracts Summary */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={12} lg={6}>
                    <Card className="card-hover">
                        <Statistic
                            title={t('owner.reports.total_contracts')}
                            value={reportData?.summary.totalContracts}
                            prefix={<BarChartOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} className="text-[#3F3F3F]" />}
                            valueStyle={{ color: '#3F3F3F', fontWeight: 'bold' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card className="card-hover">
                        <Statistic
                            title={t('owner.reports.expiring_soon')}
                            value={reportData?.summary.expiringSoon}
                            prefix={<LineChartOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} className="text-[#f5222d]" />}
                            valueStyle={{ color: '#3F3F3F', fontWeight: 'bold' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card className="card-hover">
                        <Statistic
                            title={t('owner.reports.active_contracts')}
                            value={reportData?.summary.activeContracts}
                            prefix={<PieChartOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} className="text-[#52c41a]" />}
                            valueStyle={{ color: '#3F3F3F', fontWeight: 'bold' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card className="card-hover">
                        <Statistic
                            title={t('owner.reports.total_value')}
                            value={reportData?.summary.totalValue}
                            prefix={<BarChartOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} className="text-[#C9A24D]" />}
                            valueStyle={{ color: '#3F3F3F', fontWeight: 'bold' }}
                            formatter={(value) => `$${(value as number).toLocaleString()}`}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Contract Details */}
            <Card title={t('owner.reports.contract_details')} className="card-hover">
                <Table
                    dataSource={reportData?.contractDetails || []}
                    columns={[
                        { title: t('owner.reports.player'), dataIndex: 'player', key: 'player' },
                        {
                            title: t('owner.reports.type'),
                            dataIndex: 'type',
                            key: 'type',
                            render: (type: string) => t(`owner.reports.contract_types.${type.replace(/\s+/g, '_')}`, { defaultValue: type })
                        },
                        {
                            title: t('owner.reports.value'),
                            dataIndex: 'value',
                            key: 'value',
                            render: (value: number) => `$${value.toLocaleString()}`
                        },
                        {
                            title: t('owner.reports.status'),
                            dataIndex: 'status',
                            key: 'status',
                            render: (status: string) => (
                                <Tag color={status === 'Active' ? 'green' : 'orange'}>
                                    {t(`enums.ContractStatus.${status}`, { defaultValue: status })}
                                </Tag>
                            )
                        },
                    ]}
                    pagination={false}
                    rowKey="player"
                />
            </Card>
        </div>
    );

    const renderReportContent = () => {
        switch (reportType) {
            case 'financial':
                return renderFinancialReport();
            case 'performance':
                return renderPerformanceReport();
            case 'contracts':
                return renderContractsReport();
            default:
                return null;
        }
    };

    return (
        <div className="fade-in">
            <div style={{ marginBottom: 24 }}>
                <Title level={2}>{t('owner.reports.title')}</Title>
                <Text type="secondary">{t('owner.reports.subtitle')}</Text>
            </div>

            <Space direction="vertical" size="large" style={{ width: '100%' }}>
                {/* Report Controls */}
                <Card>
                    <Row justify="space-between" align="middle">
                        <Col>
                            <Space size="large">
                                <div>
                                    <Text strong className="block mb-2 text-slate-400 uppercase text-[10px] tracking-widest">
                                        {t('owner.reports.report_type')}
                                    </Text>
                                    <Select
                                        value={reportType}
                                        onChange={setReportType}
                                        style={{ width: 200 }}
                                    >
                                        <Option value="financial">{t('owner.reports.financial')}</Option>
                                        <Option value="performance">{t('owner.reports.performance')}</Option>
                                        <Option value="contracts">{t('owner.reports.contracts')}</Option>
                                    </Select>
                                </div>
                                <div>
                                    <Text strong className="block mb-2 text-slate-400 uppercase text-[10px] tracking-widest">
                                        {t('owner.reports.date_range')}
                                    </Text>
                                    <RangePicker
                                        value={dateRange}
                                        onChange={setDateRange}
                                        style={{ width: 300 }}
                                    />
                                </div>
                            </Space>
                        </Col>
                        <Col>
                            <Button
                                type="primary"
                                icon={<DownloadOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
                                onClick={handleDownload}
                                style={{ background: '#3F3F3F' }}
                            >
                                {t('owner.reports.download_report')}
                            </Button>
                        </Col>
                    </Row>
                </Card>

                {/* Report Content */}
                <Spin spinning={loading}>
                    {renderReportContent()}
                </Spin>
            </Space>
        </div>
    );
};