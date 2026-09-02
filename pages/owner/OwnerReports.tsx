import React, { useEffect, useState, useMemo } from 'react';
import { Card, Button, Space, Typography, Row, Col, Statistic, Spin, Table, Tag, DatePicker, Select, message, Result, Checkbox, Popover } from 'antd';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { ownerService } from '../../services/ownerService';
import { dashboardService } from '../../services/dashboardService';
import { playerService } from '../../services/playerService';
import { formatCurrency, exportToCSV, triggerPrint } from '../../utils/helpers';
import {
    BarChartOutlined,
    LineChartOutlined,
    PieChartOutlined,
    FileTextOutlined,
    FilePdfOutlined,
    FileExcelOutlined,
    TrophyOutlined,
    CalendarOutlined,
    DollarOutlined
} from '@ant-design/icons';
import { SettingOutlined } from '@ant-design/icons';
import { PrintableReport } from '../../components/PrintableReport';
import { useAuth } from '../../context/AuthContext';
import { canViewReports } from '../../utils/permissionHelpers';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

import DynamicTranslate from '../../components/DynamicTranslate';

const isArabicText = (text?: string) => {
    if (!text) return false;
    const arabicPattern = /[\u0600-\u06FF]/;
    return arabicPattern.test(text);
};

export const OwnerReports: React.FC = () => {
    const { t, i18n } = useTranslation();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [reportType, setReportType] = useState('financial');
    const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>([null, null]);
    const [reportData, setReportData] = useState<any>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const [isExporting, setIsExporting] = useState(false);
    const [selectedFields, setSelectedFields] = useState<Record<string, string[]>>({});
    const pageSize = 10;

    // Define all available columns per report type
    const allColumnDefs: Record<string, { key: string; label: string }[]> = useMemo(() => ({
        financial: [
            { key: 'category', label: t('owner.reports.category') },
            { key: 'amount', label: t('owner.reports.amount') },
        ],
        performance: [
            { key: 'name', label: t('common.name') },
            { key: 'email', label: t('common.email') },
            { key: 'jerseyNumber', label: t('common.jersey_number') },
            { key: 'previousClubs', label: t('players.previous_clubs') },
            { key: 'matches', label: t('owner.reports.matches') },
            { key: 'goals', label: t('owner.reports.goals') },
        ],
        contracts: [
            { key: 'player', label: t('owner.reports.player') },
            { key: 'fees', label: t('players.contract_fees', { defaultValue: i18n.language === 'ar' ? 'الرسوم' : 'Fees' }) },
            { key: 'feesType', label: t('players.contract_fees_type', { defaultValue: i18n.language === 'ar' ? 'نوع الرسوم' : 'Fees Type' }) },
            { key: 'startDate', label: t('players.contract_start_date', { defaultValue: i18n.language === 'ar' ? 'بداية العقد' : 'Start Date' }) },
            { key: 'endDate', label: t('players.contract_end_date', { defaultValue: i18n.language === 'ar' ? 'نهاية العقد' : 'End Date' }) },
            { key: 'status', label: t('owner.reports.status') },
        ],
        deals: [
            { key: 'type', label: t('owner.reports.type') },
            { key: 'count', label: t('common.count') },
        ],
    }), [t, i18n.language]);

    // Initialize selected fields with all columns for each report type
    useEffect(() => {
        const defaults: Record<string, string[]> = {};
        Object.entries(allColumnDefs).forEach(([type, cols]) => {
            defaults[type] = cols.map(c => c.key);
        });
        setSelectedFields(defaults);
    }, []);

    const getActiveFields = () => selectedFields[reportType] || allColumnDefs[reportType]?.map(c => c.key) || [];

    useEffect(() => {
        if (reportType !== 'performance' && reportType !== 'contracts') {
            setCurrentPage(1);
        }
        generateReport();
    }, [reportType, dateRange, currentPage, i18n.language]);

    const generateReport = async () => {
        setLoading(true);
        try {
            if (reportType === 'financial') {
                const filters = {
                    start_date: dateRange?.[0]?.format('YYYY-MM-DD'),
                    end_date: dateRange?.[1]?.format('YYYY-MM-DD'),
                    sport: (user as any)?.sport || undefined
                };
                const [stats, records] = await Promise.all([
                    ownerService.getFinancialStats(filters),
                    ownerService.getFinancialRecords(filters)
                ]);

                setReportData({
                    summary: {
                        totalIncome: stats.totalIncome,
                        totalExpense: stats.totalExpense,
                        netProfit: stats.netProfit,
                        monthlyGrowth: 0, // Not provided by API yet
                    },
                    incomeByCategory: Object.entries(
                        records.filter((r: any) => r.type.toUpperCase() === 'INCOME').reduce((acc: any, curr: any) => {
                            acc[curr.category] = (acc[curr.category] || 0) + Number(curr.amount || 0);
                            return acc;
                        }, {})
                    ).map(([category, amount]) => ({ category, amount })),
                    expenseByCategory: Object.entries(
                        records.filter((r: any) => r.type.toUpperCase() === 'EXPENSE').reduce((acc: any, curr: any) => {
                            acc[curr.category] = (acc[curr.category] || 0) + Number(curr.amount || 0);
                            return acc;
                        }, {})
                    ).map(([category, amount]) => ({ category, amount })),
                });
            } else if (reportType === 'performance') {
                const filters = {
                    start_date: dateRange?.[0]?.format('YYYY-MM-DD'),
                    end_date: dateRange?.[1]?.format('YYYY-MM-DD'),
                    sport: (user as any)?.sport || undefined
                };
                const [stats, { players, total }] = await Promise.all([
                    dashboardService.getStats(filters),
                    playerService.getAll(filters as any, currentPage, pageSize)
                ]);
                setTotalRecords(total || 0);

                setReportData({
                    summary: {
                        totalPlayers: stats.totalPlayers,
                        activePlayers: stats.activeContracts, // Approximation
                        injuredPlayers: 0,
                        averageRating: 7.0,
                    },
                    playerStats: players.map((p: any) => {
                        const displayName = i18n.language === 'ar' ? (p.nameAr || p.name) : (p.name || p.nameAr);
                        return {
                            name: <DynamicTranslate text={displayName} sourceLang={isArabicText(displayName) ? 'ar' : 'en'} />,
                            email: p.email || '-',
                            jerseyNumber: p.jerseyNumber || '-',
                            previousClubs: p.previousClubs ? (Array.isArray(p.previousClubs) ? p.previousClubs.join(', ') : p.previousClubs) : '-',
                            rating: 7.0,
                            matches: p.stats?.appearances || 0,
                            goals: p.stats?.goals || 0
                        };
                    }),

                });
            } else if (reportType === 'contracts') {
                const filters = {
                    start_date: dateRange?.[0]?.format('YYYY-MM-DD'),
                    end_date: dateRange?.[1]?.format('YYYY-MM-DD'),
                    sport: (user as any)?.sport || undefined
                };
                const [stats, { players, total }] = await Promise.all([
                    dashboardService.getStats(filters),
                    playerService.getAll(filters as any, currentPage, pageSize)
                ]);
                setTotalRecords(total || 0);

                const activePlayers = players.filter((p: any) => p.contractStatus === 'ACTIVE' || p.contract_status === 'ACTIVE');
                const expiredPlayers = players.filter((p: any) => p.contractStatus === 'EXPIRED' || p.contract_status === 'EXPIRED');

                setReportData({
                    summary: {
                        totalContracts: total || players.length,
                        expiringSoon: stats.expiringSoon,
                        activeContracts: activePlayers.length,
                        totalValue: stats.totalMarketValue,
                    },
                    contractDetails: players.map((p: any) => {
                        const playerDisplayName = i18n.language === 'ar' ? (p.nameAr || p.name) : (p.name || p.nameAr);
                        return {
                            player: <DynamicTranslate text={playerDisplayName} sourceLang={isArabicText(playerDisplayName) ? 'ar' : 'en'} />,
                            fees: p.contractFees ?? p.contract_fees,
                            feesType: p.contractFeesType ?? p.contract_fees_type,
                            startDate: p.contractStartDate ?? p.contract_start_date,
                            endDate: p.contractEndDate ?? p.contract_end_date,
                            status: p.contractStatus ?? p.contract_status ?? 'UNKNOWN',
                        };
                    }),
                });
            } else if (reportType === 'deals') {
                const filters = {
                    startDate: dateRange?.[0]?.format('YYYY-MM-DD'),
                    endDate: dateRange?.[1]?.format('YYYY-MM-DD'),
                    sport: (user as any)?.sport || undefined
                };
                const [stats, dealTypeData] = await Promise.all([
                    dashboardService.getStats(filters),
                    dashboardService.getDealTypeStats(filters),
                ]);

                setReportData({
                    summary: {
                        totalDeals: stats.totalDeals,
                        dealsThisMonth: stats.dealsThisMonth,
                        totalAmount: stats.totalDealsAmount,
                    },
                    typeBreakdown: dealTypeData,
                });
            }
        } catch (error) {
            message.error(t('owner.reports.generate_failed'));
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async (type: 'PDF' | 'CSV') => {
        setIsExporting(true);
        const hide = message.loading(t('common.preparing_report', { defaultValue: 'Preparing report...' }), 0);

        try {
            let fullData: any[] = [];
            let fullSummary = reportData?.summary || {};

            if (reportType === 'financial') {
                const filters = {
                    start_date: dateRange?.[0]?.format('YYYY-MM-DD'),
                    end_date: dateRange?.[1]?.format('YYYY-MM-DD'),
                    sport: (user as any)?.sport || undefined
                };
                const [stats, records] = await Promise.all([
                    ownerService.getFinancialStats(filters),
                    ownerService.getFinancialRecords(filters)
                ]);

                fullSummary = stats;
                const income = Object.entries(
                    records.filter((r: any) => r.type.toUpperCase() === 'INCOME').reduce((acc: any, curr: any) => {
                        acc[curr.category] = (acc[curr.category] || 0) + Number(curr.amount || 0);
                        return acc;
                    }, {})
                ).map(([category, amount]) => ({ category, amount }));

                const expense = Object.entries(
                    records.filter((r: any) => r.type.toUpperCase() === 'EXPENSE').reduce((acc: any, curr: any) => {
                        acc[curr.category] = (acc[curr.category] || 0) + Number(curr.amount || 0);
                        return acc;
                    }, {})
                ).map(([category, amount]) => ({ category, amount }));

                if (type === 'PDF') {
                    // For PDF we just use the grouped data
                    fullData = income; // This is a bit tricky since PDF expects one array but we have two tables. 
                    // However, we'll keep the logic consistent with how renderReportContent does it or just fetch the raw records for CSV.
                } else {
                    fullData = [
                        { Category: t('owner.reports.total_income'), Amount: stats.totalIncome },
                        { Category: t('owner.reports.total_expense'), Amount: stats.totalExpense },
                        { Category: t('owner.reports.net_profit'), Amount: stats.netProfit },
                        {},
                        { Category: t('owner.reports.income_breakdown'), Amount: '' },
                        ...income.map((i: any) => ({ Category: i.category, Amount: i.amount })),
                        {},
                        { Category: t('owner.reports.expense_breakdown'), Amount: '' },
                        ...expense.map((e: any) => ({ Category: e.category, Amount: e.amount })),
                    ];
                }
            } else if (reportType === 'performance') {
                const filters = {
                    start_date: dateRange?.[0]?.format('YYYY-MM-DD'),
                    end_date: dateRange?.[1]?.format('YYYY-MM-DD'),
                    sport: (user as any)?.sport || undefined
                };
                const { players } = await playerService.getAll(filters as any, 1, 1000);
                fullData = players.map((p: any) => ({
                    name: p.nameAr && i18n.language === 'ar' ? p.nameAr : p.name,
                    email: p.email || '-',
                    jerseyNumber: p.jersey_number || '-',
                    previousClubs: p.previous_clubs ? (Array.isArray(p.previous_clubs) ? p.previous_clubs.join(', ') : p.previous_clubs) : '-',
                    rating: 7.0,
                    matches: p.appearances || 0,
                    goals: p.goals || 0
                }));
            } else if (reportType === 'contracts') {
                const filters = {
                    start_date: dateRange?.[0]?.format('YYYY-MM-DD'),
                    end_date: dateRange?.[1]?.format('YYYY-MM-DD'),
                    sport: (user as any)?.sport || undefined
                };
                const { players } = await playerService.getAll(filters as any, 1, 1000);
                fullData = players.map((p: any) => ({
                    player: (i18n.language === 'ar' && p.nameAr) ? p.nameAr : p.name,
                    fees: p.contractFees ?? p.contract_fees,
                    feesType: p.contractFeesType ?? p.contract_fees_type,
                    startDate: p.contractStartDate ?? p.contract_start_date,
                    endDate: p.contractEndDate ?? p.contract_end_date,
                    status: p.contractStatus ?? p.contract_status ?? 'UNKNOWN',
                }));
            } else if (reportType === 'deals') {
                const filters = {
                    startDate: dateRange?.[0]?.format('YYYY-MM-DD'),
                    endDate: dateRange?.[1]?.format('YYYY-MM-DD'),
                    sport: (user as any)?.sport || undefined
                };
                const [stats, dealTypeData] = await Promise.all([
                    dashboardService.getStats(filters),
                    dashboardService.getDealTypeStats(filters),
                ]);

                fullSummary = stats;
                fullData = dealTypeData.map(d => ({
                    Type: t(`admin.deals.${d.type.toLowerCase()}`, { defaultValue: d.type }),
                    Count: d.count
                }));
            }

            if (type === 'PDF') {
                // We need to temporarily set the report data to full data or have PrintableReport use a separate prop
                // To avoid UI flickering/jerkiness, we'll just trigger print if the component can handle it.
                // But PrintableReport uses props from the parent.
                // I'll update PrintableReport to accept its own data prop which we set here.
                setReportData((prev: any) => ({ ...prev, fullExportData: fullData, summary: fullSummary }));
                setTimeout(() => {
                    triggerPrint();
                    setIsExporting(false);
                    hide();
                }, 500);
            } else {
                exportToCSV(fullData, `Owner_Report_${reportType}_${new Date().toISOString().split('T')[0]}`);
                setIsExporting(false);
                hide();
            }
        } catch (error) {
            message.error(t('owner.reports.export_failed', { defaultValue: 'Export failed' }));
            setIsExporting(false);
            hide();
        }
    };

    const renderFinancialReport = () => (
        <div>
            {/* Financial Summary */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={12} lg={6}>
                    <Card className="card-hover" loading={loading}>
                        <Statistic
                            title={t('owner.reports.total_income')}
                            value={reportData?.summary.totalIncome}
                            prefix={<BarChartOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} className="text-[#52c41a]" />}
                            valueStyle={{ color: '#3F3F3F', fontWeight: 'bold' }}
                            formatter={(value) => formatCurrency(value as number, i18n.language)}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card className="card-hover" loading={loading}>
                        <Statistic
                            title={t('owner.reports.total_expense')}
                            value={reportData?.summary.totalExpense}
                            prefix={<LineChartOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} className="text-[#f5222d]" />}
                            valueStyle={{ color: '#3F3F3F', fontWeight: 'bold' }}
                            formatter={(value) => formatCurrency(value as number, i18n.language)}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card className="card-hover" loading={loading}>
                        <Statistic
                            title={t('owner.reports.net_profit')}
                            value={reportData?.summary.netProfit}
                            prefix={<PieChartOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} className="text-[#52c41a]" />}
                            valueStyle={{ color: '#3F3F3F', fontWeight: 'bold' }}
                            formatter={(value) => formatCurrency(value as number, i18n.language)}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card className="card-hover" loading={loading}>
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
            <Card title={t('owner.reports.income_by_category')} className="card-hover" style={{ marginBottom: 24 }} loading={loading}>
                <Table
                    dataSource={reportData?.incomeByCategory || []}
                    scroll={{ x: 600 }}
                    columns={[
                        {
                            title: t('owner.reports.category'),
                            dataIndex: 'category',
                            key: 'category',
                            render: (category: string) => t(`owner.financials.categories.${category}`, { defaultValue: category })
                        },
                        {
                            title: t('owner.reports.amount'),
                            dataIndex: 'amount',
                            key: 'amount',
                            render: (amount: number) => formatCurrency(amount, i18n.language)
                        },
                    ].filter(c => getActiveFields().includes(c.key as string))}
                    pagination={false}
                    rowKey="category"
                />
            </Card>

            {/* Expense by Category */}
            <Card title={t('owner.reports.expense_by_category')} className="card-hover" loading={loading}>
                <Table
                    dataSource={reportData?.expenseByCategory || []}
                    scroll={{ x: 600 }}
                    columns={[
                        {
                            title: t('owner.reports.category'),
                            dataIndex: 'category',
                            key: 'category',
                            render: (category: string) => t(`owner.financials.categories.${category}`, { defaultValue: category })
                        },
                        {
                            title: t('owner.reports.amount'),
                            dataIndex: 'amount',
                            key: 'amount',
                            render: (amount: number) => formatCurrency(amount, i18n.language)
                        },
                    ].filter(c => getActiveFields().includes(c.key as string))}
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
                    scroll={{ x: 800 }}
                    columns={[
                        { title: t('common.name'), dataIndex: 'name', key: 'name' },
                        { title: t('common.email'), dataIndex: 'email', key: 'email' },
                        { title: t('common.jersey_number'), dataIndex: 'jerseyNumber', key: 'jerseyNumber' },
                        { title: t('players.previous_clubs'), dataIndex: 'previousClubs', key: 'previousClubs' },

                        { title: t('owner.reports.matches'), dataIndex: 'matches', key: 'matches' },
                        { title: t('owner.reports.goals'), dataIndex: 'goals', key: 'goals' },

                    ].filter(c => getActiveFields().includes(c.key as string))}
                    pagination={{
                        current: currentPage,
                        pageSize: pageSize,
                        total: totalRecords,
                        onChange: (page) => setCurrentPage(page),
                        size: 'small',
                        showSizeChanger: false
                    }}
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
                            formatter={(value) => formatCurrency(value as number, i18n.language)}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Contract Details */}
            <Card title={t('owner.reports.contract_details')} className="card-hover">
                <Table
                    dataSource={reportData?.contractDetails || []}
                    scroll={{ x: 900 }}
                    columns={[
                        { title: t('owner.reports.player'), dataIndex: 'player', key: 'player' },
                        {
                            title: t('players.contract_fees', { defaultValue: i18n.language === 'ar' ? 'الرسوم' : 'Fees' }),
                            dataIndex: 'fees',
                            key: 'fees',
                            render: (fees: any) => fees ? formatCurrency(Number(fees), i18n.language) : '—'
                        },
                        {
                            title: t('players.contract_fees_type', { defaultValue: i18n.language === 'ar' ? 'نوع الرسوم' : 'Fees Type' }),
                            dataIndex: 'feesType',
                            key: 'feesType',
                            render: (ft: string) => {
                                if (!ft) return '—';
                                const map: Record<string, string> = {
                                    FIXED: i18n.language === 'ar' ? 'ثابت' : 'Fixed',
                                    PERCENTAGE: i18n.language === 'ar' ? 'نسبة مئوية' : 'Percentage',
                                };
                                return map[ft?.toUpperCase()] || ft;
                            }
                        },
                        {
                            title: t('players.contract_start_date', { defaultValue: i18n.language === 'ar' ? 'بداية العقد' : 'Start Date' }),
                            dataIndex: 'startDate',
                            key: 'startDate',
                            render: (d: string) => d ? dayjs(d).format('YYYY-MM-DD') : '—'
                        },
                        {
                            title: t('players.contract_end_date', { defaultValue: i18n.language === 'ar' ? 'نهاية العقد' : 'End Date' }),
                            dataIndex: 'endDate',
                            key: 'endDate',
                            render: (d: string) => d ? dayjs(d).format('YYYY-MM-DD') : '—'
                        },
                        {
                            title: t('owner.reports.status'),
                            dataIndex: 'status',
                            key: 'status',
                            render: (status: string) => (
                                <Tag color={status === 'ACTIVE' ? 'green' : status === 'EXPIRED' ? 'red' : 'default'}>
                                    {t(`enums.ContractStatus.${status}`, { defaultValue: status })}
                                </Tag>
                            )
                        },
                    ].filter(c => getActiveFields().includes(c.key as string))}
                    pagination={{
                        current: currentPage,
                        pageSize: pageSize,
                        total: totalRecords,
                        onChange: (page) => setCurrentPage(page),
                        size: 'small',
                        showSizeChanger: false
                    }}
                    rowKey={(record, index) => `${record.player}-${index}`}
                />
            </Card>
        </div>
    );

    const renderDealsReport = () => (
        <div>
            {/* Deals Summary */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={8}>
                    <Card className="card-hover">
                        <Statistic
                            title={t('admin.deals.total_deals')}
                            value={reportData?.summary.totalDeals}
                            prefix={<TrophyOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} className="text-[#C9A24D]" />}
                            valueStyle={{ color: '#3F3F3F', fontWeight: 'bold' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card className="card-hover">
                        <Statistic
                            title={t('admin.deals.deals_this_month')}
                            value={reportData?.summary.dealsThisMonth}
                            prefix={<CalendarOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} className="text-blue-500" />}
                            valueStyle={{ color: '#3F3F3F', fontWeight: 'bold' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card className="card-hover">
                        <Statistic
                            title={t('admin.deals.total_deals_amount')}
                            value={reportData?.summary.totalAmount}
                            prefix={<DollarOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} className="text-green-500" />}
                            valueStyle={{ color: '#3F3F3F', fontWeight: 'bold' }}
                            formatter={(value) => formatCurrency(value as number, i18n.language)}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Deal Type Distribution Table */}
            <Card title={t('admin.deals.deal_type_dist')} className="card-hover">
                <Table
                    dataSource={reportData?.typeBreakdown || []}
                    scroll={{ x: 600 }}
                    columns={[
                        {
                            title: t('owner.reports.type'),
                            dataIndex: 'type',
                            key: 'type',
                            render: (type: string) => t(`admin.deals.${type.toLowerCase()}`, { defaultValue: type })
                        },
                        {
                            title: t('common.count'),
                            dataIndex: 'count',
                            key: 'count'
                        },
                    ]}
                    pagination={false}
                    rowKey="type"
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
            case 'deals':
                return renderDealsReport();
            default:
                return null;
        }
    };

    return (
        <>
            {!canViewReports(user) ? (
                <Result
                    status="403"
                    title={t('common.forbidden')}
                    subTitle={t('common.access_denied', { defaultValue: 'You do not have permission to view reports' })}
                    extra={<Button type="primary" href="/">{t('common.back_home', { defaultValue: 'Back to Home' })}</Button>}
                />
            ) : (
                <div className="fade-in">
                    <div style={{ marginBottom: 24 }}>
                        <Title level={2}>{t('owner.reports.title')}</Title>
                        <Text type="secondary">{t('owner.reports.subtitle')}</Text>
                    </div>

                    <Space direction="vertical" size="large" style={{ width: '100%' }}>
                        {/* Report Controls */}
                        <Card>
                            <Row gutter={[16, 16]} justify="space-between" align="bottom">
                                <Col xs={24} lg={16}>
                                    <Row gutter={[16, 16]}>
                                        <Col xs={24} sm={10}>
                                            <Text strong className="block mb-2 text-slate-400 uppercase text-[10px] tracking-widest">
                                                {t('owner.reports.report_type')}
                                            </Text>
                                            <Select
                                                showSearch
                                                value={reportType}
                                                onChange={setReportType}
                                                className="w-full"
                                                optionFilterProp="label"
                                            >
                                                <Option value="financial" label={t('owner.reports.financial')}>{t('owner.reports.financial')}</Option>
                                                <Option value="performance" label={t('owner.reports.performance')}>{t('owner.reports.performance')}</Option>
                                                <Option value="contracts" label={t('owner.reports.contracts')}>{t('owner.reports.contracts')}</Option>
                                                <Option value="deals" label={t('admin.deals.deal_reports', { defaultValue: 'Deals Report' })}>{t('admin.deals.deal_reports', { defaultValue: 'Deals Report' })}</Option>
                                            </Select>
                                        </Col>
                                        <Col xs={24} sm={14}>
                                            <Text strong className="block mb-2 text-slate-400 uppercase text-[10px] tracking-widest">
                                                {t('owner.reports.date_range')}
                                            </Text>
                                            <RangePicker
                                                value={dateRange}
                                                onChange={setDateRange}
                                                className="w-full"
                                            />
                                        </Col>
                                    </Row>
                                </Col>
                                <Col xs={24} lg={8}>
                                    <div className="flex gap-2 items-center flex-wrap sm:flex-nowrap justify-start lg:justify-end">
                                        <Popover
                                            trigger="click"
                                            placement="bottomRight"
                                            title={i18n.language === 'ar' ? 'اختر الحقول للتصدير' : 'Select Export Fields'}
                                            content={
                                                <div style={{ maxWidth: 250 }}>
                                                    <Checkbox.Group
                                                        value={getActiveFields()}
                                                        onChange={(checkedValues) => {
                                                            setSelectedFields(prev => ({
                                                                ...prev,
                                                                [reportType]: checkedValues as string[]
                                                            }));
                                                        }}
                                                        style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
                                                    >
                                                        {(allColumnDefs[reportType] || []).map(col => (
                                                            <Checkbox key={col.key} value={col.key}>
                                                                 {col.label}
                                                            </Checkbox>
                                                        ))}
                                                    </Checkbox.Group>
                                                </div>
                                            }
                                        >
                                            <Button
                                                icon={<SettingOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
                                                style={{ borderColor: '#C9A24D', color: '#C9A24D' }}
                                                className="hover:!border-[#B68F3F] hover:!text-[#B68F3F] h-10 grow sm:grow-0"
                                            >
                                                {i18n.language === 'ar' ? 'الحقول' : 'Fields'}
                                            </Button>
                                        </Popover>
                                        <Button
                                            icon={<FilePdfOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
                                            onClick={() => handleDownload('PDF')}
                                            loading={isExporting}
                                            style={{ borderColor: '#C9A24D', color: '#C9A24D' }}
                                            className="hover:!border-[#B68F3F] hover:!text-[#B68F3F] h-10 grow sm:grow-0"
                                        >
                                            {t('common.pdf_export.export_btn', { defaultValue: 'PDF' })}
                                        </Button>
                                        <Button
                                            icon={<FileExcelOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
                                            onClick={() => handleDownload('CSV')}
                                            loading={isExporting}
                                            style={{ borderColor: '#C9A24D', color: '#C9A24D' }}
                                            className="hover:!border-[#B68F3F] hover:!text-[#B68F3F] h-10 grow sm:grow-0"
                                        >
                                            {t('common.excel_export.export_btn', { defaultValue: 'Excel' })}
                                        </Button>
                                    </div>
                                </Col>
                            </Row>
                        </Card>

                        {/* Report Content */}
                        <div>
                            {!reportData && !loading ? (
                                <Card style={{ textAlign: 'center', padding: '40px' }}>
                                    <Text type="secondary">{t('owner.reports.select_type_and_generate')}</Text>
                                </Card>
                            ) : (
                                renderReportContent()
                            )}
                        </div>

                        {/* Printable Report Integration */}
                        <PrintableReport
                            title={t('owner.reports.title', { defaultValue: 'Owner Report' })}
                            subtitle={`${t('owner.reports.report_type')}: ${reportType?.toUpperCase()} | ${dayjs().format('YYYY-MM-DD')}`}
                            data={
                                reportData?.fullExportData ? reportData.fullExportData :
                                    reportType === 'financial' && reportData?.incomeByCategory ? reportData.incomeByCategory :
                                        reportType === 'performance' && reportData?.playerStats ? reportData.playerStats :
                                            reportType === 'contracts' && reportData?.contractDetails ? reportData.contractDetails :
                                                reportType === 'deals' && reportData?.typeBreakdown ? reportData.typeBreakdown : []
                            }
                            columns={
                                (() => {
                                    const active = getActiveFields();
                                    const allCols: Record<string, any[]> = {
                                        financial: [
                                            {
                                                title: t('owner.reports.category'),
                                                dataIndex: 'category',
                                                key: 'category',
                                                render: (category: string) => t(`owner.financials.categories.${category}`, { defaultValue: category })
                                            },
                                            { title: t('owner.reports.amount'), dataIndex: 'amount', key: 'amount', render: (val: any) => formatCurrency(val, i18n.language) }
                                        ],
                                        performance: [
                                            { title: t('common.name'), dataIndex: 'name', key: 'name' },
                                            { title: t('common.email'), dataIndex: 'email', key: 'email' },
                                            { title: t('common.jersey_number'), dataIndex: 'jerseyNumber', key: 'jerseyNumber' },
                                            { title: t('players.previous_clubs'), dataIndex: 'previousClubs', key: 'previousClubs' },
                                            { title: t('owner.reports.matches'), dataIndex: 'matches', key: 'matches' },
                                            { title: t('owner.reports.goals'), dataIndex: 'goals', key: 'goals' }
                                        ],
                                        contracts: [
                                            { title: t('owner.reports.player'), dataIndex: 'player', key: 'player' },
                                            {
                                                title: t('players.contract_fees', { defaultValue: i18n.language === 'ar' ? 'الرسوم' : 'Fees' }),
                                                dataIndex: 'fees', key: 'fees',
                                                render: (fees: any) => fees ? formatCurrency(Number(fees), i18n.language) : '—'
                                            },
                                            {
                                                title: t('players.contract_fees_type', { defaultValue: i18n.language === 'ar' ? 'نوع الرسوم' : 'Fees Type' }),
                                                dataIndex: 'feesType', key: 'feesType',
                                                render: (ft: string) => {
                                                    if (!ft) return '—';
                                                    const map: Record<string, string> = {
                                                        FIXED: i18n.language === 'ar' ? 'ثابت' : 'Fixed',
                                                        PERCENTAGE: i18n.language === 'ar' ? 'نسبة مئوية' : 'Percentage',
                                                    };
                                                    return map[ft?.toUpperCase()] || ft;
                                                }
                                            },
                                            {
                                                title: t('players.contract_start_date', { defaultValue: i18n.language === 'ar' ? 'بداية العقد' : 'Start Date' }),
                                                dataIndex: 'startDate', key: 'startDate',
                                                render: (d: string) => d ? dayjs(d).format('YYYY-MM-DD') : '—'
                                            },
                                            {
                                                title: t('players.contract_end_date', { defaultValue: i18n.language === 'ar' ? 'نهاية العقد' : 'End Date' }),
                                                dataIndex: 'endDate', key: 'endDate',
                                                render: (d: string) => d ? dayjs(d).format('YYYY-MM-DD') : '—'
                                            },
                                            {
                                                title: t('owner.reports.status'), dataIndex: 'status', key: 'status',
                                                render: (status: string) => t(`enums.ContractStatus.${status}`, { defaultValue: status })
                                            },
                                        ],
                                        deals: [
                                            {
                                                title: t('owner.reports.type'), dataIndex: 'type', key: 'type',
                                                render: (type: string) => t(`admin.deals.${type.toLowerCase()}`, { defaultValue: type })
                                            },
                                            { title: t('common.count'), dataIndex: 'count', key: 'count' }
                                        ],
                                    };
                                    return (allCols[reportType] || []).filter((c: any) => active.includes(c.key));
                                })()
                            }
                            summary={
                                reportData?.summary ? (() => {
                                    const summaryLabelMap: Record<string, string> = {
                                        totalIncome: t('owner.reports.total_income'),
                                        totalExpense: t('owner.reports.total_expense'),
                                        netProfit: t('owner.reports.net_profit'),
                                        monthlyGrowth: t('owner.reports.monthly_growth'),
                                        monthlyIncome: i18n.language === 'ar' ? 'الدخل الشهري' : 'Monthly Income',
                                        monthlyExpense: i18n.language === 'ar' ? 'المصروفات الشهرية' : 'Monthly Expense',
                                        yearlyIncome: i18n.language === 'ar' ? 'الدخل السنوي' : 'Yearly Income',
                                        yearlyExpense: i18n.language === 'ar' ? 'المصروفات السنوية' : 'Yearly Expense',
                                        totalPlayers: t('owner.reports.total_players'),
                                        activePlayers: t('owner.reports.active_players'),
                                        injuredPlayers: t('owner.reports.injured_players'),
                                        averageRating: t('owner.reports.average_rating'),
                                        totalContracts: t('owner.reports.total_contracts'),
                                        expiringSoon: t('owner.reports.expiring_soon'),
                                        activeContracts: t('owner.reports.active_contracts'),
                                        totalValue: t('owner.reports.total_value'),
                                        totalDeals: t('admin.deals.total_deals'),
                                        dealsThisMonth: t('admin.deals.deals_this_month'),
                                        totalAmount: t('admin.deals.total_deals_amount'),
                                        totalDealsAmount: i18n.language === 'ar' ? 'إجمالي مبالغ الصفقات' : 'Total Deals Amount',
                                    };
                                    return Object.entries(reportData.summary)
                                        .filter(([key]) => key !== 'fullExportData')
                                        .map(([key, value]) => ({
                                            label: summaryLabelMap[key] || key,
                                            value: typeof value === 'number' && (key.toLowerCase().includes('income') || key.toLowerCase().includes('expense') || key.toLowerCase().includes('profit') || key.toLowerCase().includes('value') || key.toLowerCase().includes('amount'))
                                                ? formatCurrency(value, i18n.language)
                                                : String(value ?? '-')
                                        }));
                                })() : []
                            }
                        />
                    </Space>
                </div>
            )}
        </>
    );
};