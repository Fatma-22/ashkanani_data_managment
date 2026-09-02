import React, { useEffect, useState } from 'react';
import { Card, Button, Space, Modal, Form, Input, InputNumber, Select, DatePicker, message, Typography, Row, Col, Statistic, Spin, Table, Tag, Divider, Radio, Result } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, DollarOutlined, BarChartOutlined, PieChartOutlined, FilePdfOutlined, EyeOutlined, SwapOutlined } from '@ant-design/icons';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import { FinancialRecord, FinancialStats, UserRole } from '../../types';
import { ownerService } from '../../services/ownerService';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n';
import dayjs from 'dayjs';
import { formatCurrency, formatDate, translateText } from '../../utils/helpers';
import { sportsColors, ashkananiSportTheme } from '../../utils/theme';
import { useAuth } from '../../context/AuthContext';
import { canViewFinancials } from '../../utils/permissionHelpers';

import DynamicTranslate from '../../components/DynamicTranslate';
import GenericPdfExportModal from '../../components/GenericPdfExportModal';
import { FINANCIAL_PDF_FIELDS, DEFAULT_FINANCIAL_PDF_FIELDS } from '../../utils/pdfExport';

const { Title, Text } = Typography;

const isArabicText = (text?: string) => {
    if (!text) return false;
    const arabicPattern = /[\u0600-\u06FF]/;
    return arabicPattern.test(text);
};
const { Option } = Select;

export const OwnerFinancials: React.FC = () => {
    const { t, i18n } = useTranslation();
    const { user } = useAuth();
    const [records, setRecords] = useState<FinancialRecord[]>([]);
    const [stats, setStats] = useState<FinancialStats>({
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
    const [loading, setLoading] = useState(false);
    const [incomeExpenseSeries, setIncomeExpenseSeries] = useState<any[]>([]);
    const [categorySeries, setCategorySeries] = useState<any[]>([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingRecord, setEditingRecord] = useState<FinancialRecord | null>(null);
    const [viewModalVisible, setViewModalVisible] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState<FinancialRecord | null>(null);
    const [pdfModalVisible, setPdfModalVisible] = useState(false);
    const [filters, setFilters] = useState({
        type: undefined as 'income' | 'expense' | 'arrears' | undefined,
        start_date: undefined as string | undefined,
        end_date: undefined as string | undefined,
    });
    const [form] = Form.useForm();

    const [displayCurrency, setDisplayCurrency] = useState<'USD' | 'KWD'>('USD');
    const [rates, setRates] = useState<Record<string, number>>({ USD: 1, KWD: 0.308, EUR: 0.92 });
    const [isFetchingRate, setIsFetchingRate] = useState(false);

    useEffect(() => {
        const fetchRates = async () => {
            setIsFetchingRate(true);
            try {
                const res = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
                const data = await res.json();
                if (data?.rates) {
                    setRates(data.rates);
                }
            } catch (err) {
                console.error('Failed to fetch rates', err);
            } finally {
                setIsFetchingRate(false);
            }
        };
        fetchRates();
    }, []);

    const convertAmount = (amount: number, fromCurrency: string = 'USD') => {
        if (!amount) return 0;
        const rateFrom = rates[fromCurrency] || 1;
        const rateTo = rates[displayCurrency] || 1;
        const inUSD = amount / rateFrom;
        return inUSD * rateTo;
    };

    useEffect(() => {
        loadFinancials();
    }, [filters, i18n.language]);

    const loadFinancials = async () => {
        setLoading(true);
        try {
            const [recordsData, statsData] = await Promise.all([
                ownerService.getFinancialRecords(filters),
                ownerService.getFinancialStats(),
            ]);
            // Backend returns uppercase enums, frontend expects lowercase for Tag colors or consistent display
            const normalizedRecords = recordsData.map((r: any) => {
                const amount = typeof r.amount === 'string' ? parseFloat(r.amount.replace(/[^\d.-]/g, '')) : Number(r.amount);
                return {
                    ...r,
                    amount: isNaN(amount) ? 0 : amount,
                    type: (r.type || '').trim().toLowerCase(),
                    date: r.transaction_date || r.date,
                    categoryAr: r.category_ar || r.categoryAr,
                    descriptionAr: r.description_ar || r.descriptionAr,
                };
            });
            setRecords(normalizedRecords);
            setStats(statsData);
            buildCharts(normalizedRecords);
        } catch (error) {
            message.error(t('messages.error_load', { defaultValue: 'Failed to load data' }));
        } finally {
            setLoading(false);
        }
    };

    const fetchAllDataForPdf = async () => {
        try {
            const fetchFilters = { ...filters, per_page: 10000 };
            const recordsData = await ownerService.getFinancialRecords(fetchFilters);
            return recordsData.map((r: any) => {
                const amount = typeof r.amount === 'string' ? parseFloat(r.amount.replace(/[^\d.-]/g, '')) : Number(r.amount);
                return {
                    ...r,
                    amount: isNaN(amount) ? 0 : amount,
                    type: (r.type || '').trim().toLowerCase(),
                    date: r.transaction_date || r.date,
                    categoryAr: r.category_ar || r.categoryAr,
                    descriptionAr: r.description_ar || r.descriptionAr,
                };
            });
        } catch (error) {
            message.error(t('messages.error_load', { defaultValue: 'Failed to load data for export' }));
            return [];
        }
    };

    const buildCharts = (records: any[]) => {
        // Build last 6 months series
        const series = [];
        const now = dayjs().startOf('month');

        for (let i = 5; i >= 0; i--) {
            const date = now.subtract(i, 'month');
            series.push({
                month: date.format('MMM YYYY'),
                dateKey: date.format('YYYY-MM'),
                income: 0,
                expense: 0,
                arrears: 0
            });
        }

        records.forEach((r) => {
            const amount = Number(r.amount) || 0;
            const dateValue = r.date;

            if (amount === 0 || !dateValue) return;

            const recordDate = dayjs(dateValue);
            if (!recordDate.isValid()) return;

            const recordMonthKey = recordDate.format('YYYY-MM');
            const type = (r.type || '').toLowerCase();

            const match = series.find(s => s.dateKey === recordMonthKey);
            if (match) {
                if (type === 'income') match.income += amount;
                else if (type === 'expense') match.expense += amount;
                else if (type === 'arrears') match.arrears += amount;
            }
        });

        setIncomeExpenseSeries(series);

        // Category breakdown
        const catMap: Record<string, { nameEn: string, nameAr: string, value: number }> = {};
        records.forEach((r) => {
            const amount = Number(r.amount) || 0;
            if (amount === 0) return;

            const key = r.category || 'Other';
            if (!catMap[key]) {
                catMap[key] = {
                    nameEn: key,
                    nameAr: r.categoryAr || r.category_ar || key,
                    value: 0
                };
            }
            catMap[key].value += amount;
        });
        const cats = Object.values(catMap).map(item => ({
            nameEn: item.nameEn,
            nameAr: item.nameAr,
            name: i18n.language === 'ar'
                ? (t(`owner.financials.categories.${item.nameEn}`, { defaultValue: item.nameAr || item.nameEn }))
                : item.nameEn,
            value: item.value
        }));
        setCategorySeries(cats);
    };

    const handleCreate = () => {
        setEditingRecord(null);
        form.resetFields();
        form.setFieldsValue({
            type: 'income',
            currency: 'USD',
        });
        setModalVisible(true);
    };

    const handleEdit = (record: FinancialRecord) => {
        setEditingRecord(record);
        form.setFieldsValue({
            ...record,
            date: record.date ? dayjs(record.date) : undefined,
        });
        setModalVisible(true);
    };

    const handleView = (record: FinancialRecord) => {
        setSelectedRecord(record);
        setViewModalVisible(true);
    };

    const handleDelete = (record: FinancialRecord) => {
        Modal.confirm({
            title: t('owner.financials.delete_record_title'),
            content: t('owner.financials.delete_record_confirm', { description: record.description }),
            okText: t('common.delete'),
            okType: 'primary',
            onOk: async () => {
                try {
                    await ownerService.deleteFinancialRecord(record.id as any);
                    message.success(t('messages.success_delete'));
                    loadFinancials();
                } catch (error) {
                    message.error(t('messages.error_delete'));
                }
            },
        });
    };

    const handleValuesChange = async (changedValues: any) => {
        if (changedValues.descriptionAr) {
            const translated = await translateText(changedValues.descriptionAr, 'ar', 'en');
            if (translated && !form.getFieldValue('description')) {
                form.setFieldsValue({ description: translated });
            }
        }
    };

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();

            if (editingRecord) {
                await ownerService.updateFinancialRecord(editingRecord.id as any, {
                    ...values,
                    type: values.type.toUpperCase(),
                    description_ar: values.descriptionAr,
                    transaction_date: values.date ? values.date.format('YYYY-MM-DD') : undefined,
                });
                message.success(t('messages.success_update'));
            } else {
                await ownerService.createFinancialRecord({
                    ...values,
                    type: values.type.toUpperCase(),
                    description_ar: values.descriptionAr,
                    transaction_date: values.date ? values.date.format('YYYY-MM-DD') : undefined,
                });
                message.success(t('messages.success_save'));
            }

            setModalVisible(false);
            loadFinancials();
        } catch (error) {
            message.error(t('messages.error_save'));
        }
    };

    const columns = [
        {
            title: t('owner.financials.type'),
            dataIndex: 'type',
            key: 'type',
            render: (type: string) => (
                <Tag color={type === 'income' ? sportsColors.gold[500] : (type === 'expense' ? sportsColors.primary[500] : '#FF4D4F')}>
                    {type === 'income' ? t('owner.financials.income') : (type === 'expense' ? t('owner.financials.expense') : (type === 'arrears' ? t('owner.financials.arrears') : '-'))}
                </Tag>
            ),
        },
        {
            title: t('owner.financials.category'),
            dataIndex: 'category',
            key: 'category',
            responsive: ['lg'] as any,
            render: (_: string, record: FinancialRecord) => {
                const currentLang = i18n.language;
                if (!record.category) return '-';
                if (currentLang === 'ar') {
                    return t(`owner.financials.categories.${record.category}`, { defaultValue: record.categoryAr || record.category });
                }
                return record.category;
            },
        },
        {
            title: t('owner.financials.description'),
            dataIndex: 'description',
            key: 'description',
            render: (_: string, record: FinancialRecord) => {
                const currentLang = i18n.language;
                const displayDescription = currentLang === 'ar' ? (record.descriptionAr || record.description) : (record.description || record.descriptionAr);
                
                if (!displayDescription) return '-';
                
                return (
                    <DynamicTranslate 
                        text={displayDescription} 
                        sourceLang={isArabicText(displayDescription) ? 'ar' : 'en'} 
                    />
                );
            },
        },
        {
            title: t('owner.financials.amount'),
            dataIndex: 'amount',
            key: 'amount',
            render: (amount: number, record: FinancialRecord) => formatCurrency(convertAmount(amount, record.currency || 'USD'), displayCurrency, true),
        },
        {
            title: t('owner.financials.related_to'),
            dataIndex: 'related_to',
            key: 'related_to',
        },
        {
            title: t('owner.financials.date'),
            dataIndex: 'date',
            key: 'date',
            responsive: ['md'] as any,
            render: (date: string) => date ? formatDate(date) : '-',
        },
        {
            title: t('owner.financials.actions'),
            key: 'actions',
            render: (_: any, record: FinancialRecord) => (
                <Space size="middle">
                    <Button
                        type="link"
                        icon={<EyeOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
                        onClick={() => handleView(record)}
                        style={{ color: sportsColors.gold[500] }}
                    >
                        {t('common.view_details')}
                    </Button>
                    <Button
                        type="link"
                        icon={<EditOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
                        onClick={() => handleEdit(record)}
                    >
                        {t('common.edit')}
                    </Button>
                    <Button
                        type="link"
                        icon={<DeleteOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
                        onClick={() => handleDelete(record)}
                        style={{ color: sportsColors.primary[500] }}
                    >
                        {t('common.delete')}
                    </Button>
                </Space>
            ),
        },
    ];

    return (
        <>
            {user?.role !== UserRole.OWNER && !canViewFinancials(user) ? (
                <Result
                    status="403"
                    title={t('common.forbidden')}
                    subTitle={t('common.access_denied', { defaultValue: 'You do not have permission to view financials' })}
                    extra={<Button type="primary" href="/">{t('common.back_home', { defaultValue: 'Back to Home' })}</Button>}
                />
            ) : (
                <div className="fade-in">
                    <div style={{ marginBottom: 24 }}>
                        <Title level={2}>{t('owner.financials.title')}</Title>
                        <Text type="secondary">{t('owner.financials.subtitle')}</Text>
                    </div>

                    <Space direction="vertical" size="large" style={{ width: '100%' }}>
                        {/* KPI Cards */}
                        <Row gutter={[16, 16]}>
                            <Col xs={24} sm={12} lg={4}>
                                <Card className="card-hover">
                                    <Statistic
                                        title={t('owner.financials.total_income')}
                                        value={stats.totalIncome}
                                        prefix={<DollarOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} style={{ color: sportsColors.gold[500] }} />}
                                        valueStyle={{ color: sportsColors.gold[500], fontWeight: 'bold' }}
                                        formatter={(value) => formatCurrency(convertAmount(value as number, 'USD'), displayCurrency, true)}
                                        loading={loading}
                                    />
                                </Card>
                            </Col>
                            <Col xs={24} sm={12} lg={4}>
                                <Card className="card-hover">
                                    <Statistic
                                        title={t('owner.financials.total_expense')}
                                        value={stats.totalExpense}
                                        prefix={<DollarOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} style={{ color: sportsColors.primary[500] }} />}
                                        valueStyle={{ color: '#3F3F3F', fontWeight: 'bold' }}
                                        formatter={(value) => formatCurrency(convertAmount(value as number, 'USD'), displayCurrency, true)}
                                        loading={loading}
                                    />
                                </Card>
                            </Col>
                            <Col xs={24} sm={12} lg={4}>
                                <Card className="card-hover">
                                    <Statistic
                                        title={t('owner.financials.total_arrears')}
                                        value={stats.totalArrears}
                                        prefix={<DollarOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} style={{ color: '#FF4D4F' }} />}
                                        valueStyle={{ color: '#FF4D4F', fontWeight: 'bold' }}
                                        formatter={(value) => formatCurrency(convertAmount(value as number, 'USD'), displayCurrency, true)}
                                        loading={loading}
                                    />
                                </Card>
                            </Col>
                            <Col xs={24} sm={12} lg={4}>
                                <Card className="card-hover">
                                    <Statistic
                                        title={t('owner.financials.net_profit')}
                                        value={stats.netProfit}
                                        prefix={<DollarOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} style={{ color: stats.netProfit >= 0 ? sportsColors.gold[500] : ashkananiSportTheme.token.colorError }} />}
                                        valueStyle={{ color: stats.netProfit >= 0 ? sportsColors.gold[500] : ashkananiSportTheme.token.colorError, fontWeight: 'bold' }}
                                        formatter={(value) => formatCurrency(convertAmount(value as number, 'USD'), displayCurrency, true)}
                                        loading={loading}
                                    />
                                </Card>
                            </Col>
                            <Col xs={24} sm={12} lg={4}>
                                <Card className="card-hover">
                                    <Statistic
                                        title={t('owner.financials.monthly_profit')}
                                        value={stats.monthlyIncome - stats.monthlyExpense}
                                        prefix={<DollarOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} style={{ color: (stats.monthlyIncome - stats.monthlyExpense) >= 0 ? sportsColors.gold[500] : ashkananiSportTheme.token.colorError }} />}
                                        valueStyle={{ color: (stats.monthlyIncome - stats.monthlyExpense) >= 0 ? sportsColors.gold[500] : ashkananiSportTheme.token.colorError, fontWeight: 'bold' }}
                                        formatter={(value) => formatCurrency(convertAmount(value as number, 'USD'), displayCurrency, true)}
                                        loading={loading}
                                    />
                                </Card>
                            </Col>
                            <Col xs={24} sm={12} lg={4}>
                                <Card className="card-hover">
                                    <Statistic
                                        title={t('owner.financials.monthly_arrears')}
                                        value={stats.monthlyArrears}
                                        prefix={<DollarOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} style={{ color: '#FF4D4F' }} />}
                                        valueStyle={{ color: '#FF4D4F', fontWeight: 'bold' }}
                                        formatter={(value) => formatCurrency(convertAmount(value as number, 'USD'), displayCurrency, true)}
                                        loading={loading}
                                    />
                                </Card>
                            </Col>
                        </Row>

                        {/* Filters and Actions */}
                        <Card>
                            <Row gutter={[16, 16]} justify="space-between" align="bottom">
                                <Col xs={24} lg={14}>
                                    <Row gutter={[16, 16]}>
                                        <Col xs={24} sm={10}>
                                            <Text strong className="block mb-2 text-slate-400 uppercase text-[10px] tracking-widest">
                                                {t('common.type')}
                                            </Text>
                                            <Radio.Group
                                                value={filters.type}
                                                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                                                className="w-full"
                                            >
                                                <Radio.Button value={undefined}>{t('common.all')}</Radio.Button>
                                                <Radio.Button value="income">{t('owner.financials.income')}</Radio.Button>
                                                <Radio.Button value="expense">{t('owner.financials.expense')}</Radio.Button>
                                                <Radio.Button value="arrears">{t('owner.financials.arrears')}</Radio.Button>
                                            </Radio.Group>
                                        </Col>
                                        <Col xs={24} sm={14}>
                                            <Text strong className="block mb-2 text-slate-400 uppercase text-[10px] tracking-widest">
                                                {t('common.date_range')}
                                            </Text>
                                            <Space className="w-full">
                                                <DatePicker
                                                    placeholder={t('common.start_date')}
                                                    onChange={(date) => setFilters({ ...filters, start_date: date ? date.format('YYYY-MM-DD') : undefined })}
                                                    className="w-full"
                                                />
                                                <DatePicker
                                                    placeholder={t('common.end_date')}
                                                    onChange={(date) => setFilters({ ...filters, end_date: date ? date.format('YYYY-MM-DD') : undefined })}
                                                    className="w-full"
                                                />
                                            </Space>
                                        </Col>
                                    </Row>
                                </Col>
                                <Col xs={24} lg={10}>
                                    <Space wrap size="middle" style={{ width: '100%', justifyContent: 'flex-end' }}>
                                        <Button
                                            icon={<SwapOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
                                            onClick={() => setDisplayCurrency(prev => prev === 'USD' ? 'KWD' : 'USD')}
                                            loading={isFetchingRate}
                                            className="h-10 grow lg:grow-0"
                                            style={{ 
                                                background: displayCurrency === 'KWD' ? sportsColors.gold[500] : '#3F3F3F', 
                                                color: 'white', 
                                                border: 'none' 
                                            }}
                                        >
                                            {displayCurrency === 'USD' 
                                                ? (i18n.language === 'ar' ? 'عرض بالدينار (KWD)' : 'Show in KWD') 
                                                : (i18n.language === 'ar' ? 'عرض بالدولار (USD)' : 'Show in USD')
                                            }
                                        </Button>
                                        <Button
                                            type="primary"
                                            icon={<PlusOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
                                            onClick={handleCreate}
                                            style={{ background: sportsColors.primary[500] }}
                                            className="h-10 grow lg:grow-0"
                                        >
                                            {t('owner.financials.add_record')}
                                        </Button>
                                        <Button
                                            icon={<FilePdfOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
                                            onClick={() => setPdfModalVisible(true)}
                                            className="h-10 grow lg:grow-0"
                                        >
                                            {t('common.pdf_export.export_btn', { defaultValue: 'Export PDF' })}
                                        </Button>
                                    </Space>
                                </Col>
                            </Row>
                        </Card>

                        {/* Records Table */}
                        <Card title={t('owner.financials.records_title')} className="card-hover">
                            <Spin spinning={loading}>
                                <Table
                                    dataSource={records}
                                    columns={columns}
                                    rowKey="id"
                                    scroll={{ x: 700 }}
                                    pagination={{
                                        pageSize: 10,
                                        showTotal: (total) => `${t('common.total')}: ${total}`,
                                        position: ['bottom' as any],
                                    }}
                                />
                            </Spin>
                        </Card>

                        {/* Charts Placeholder */}
                        <Row gutter={[16, 16]}>
                            <Col xs={24} lg={12}>
                                <Card title={t('owner.financials.income_expense_chart')} className="card-hover">
                                    <div style={{ height: 320 }} dir="ltr">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={incomeExpenseSeries} margin={{ top: 20, right: 30, left: 10, bottom: 20 }} barGap={4}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                                                <YAxis 
                                                    width={60} 
                                                    orientation="left"
                                                    tickFormatter={(v) => {
                                                        const val = convertAmount(v as number, 'USD');
                                                        if (val === 0) return '0';
                                                        if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
                                                        if (val >= 1000) return `${(val / 1000).toFixed(1)}K`;
                                                        return val.toFixed(0);
                                                    }} 
                                                    tickMargin={10}
                                                />
                                                <Tooltip formatter={(value: any) => formatCurrency(convertAmount(value as number, 'USD'), displayCurrency)} />
                                                <Legend wrapperStyle={{ direction: i18n.language === 'ar' ? 'rtl' : 'ltr' }} />
                                                <Bar dataKey="income" name={t('owner.financials.income')} fill={sportsColors.gold[500]} minPointSize={10} barSize={25} />
                                                <Bar dataKey="expense" name={t('owner.financials.expense')} fill={sportsColors.primary[500]} minPointSize={10} barSize={25} />
                                                <Bar dataKey="arrears" name={t('owner.financials.arrears')} fill="#FF4D4F" minPointSize={10} barSize={25} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </Card>
                            </Col>
                            <Col xs={24} lg={12}>
                                <Card title={t('owner.financials.category_breakdown')} className="card-hover">
                                    <div style={{ height: 320 }} dir="ltr">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Tooltip
                                                    formatter={(value: any) => formatCurrency(convertAmount(value as number, 'USD'), displayCurrency)}
                                                    contentStyle={{ direction: i18n.language === 'ar' ? 'rtl' : 'ltr' }}
                                                />
                                                <Legend
                                                    wrapperStyle={{ direction: i18n.language === 'ar' ? 'rtl' : 'ltr' }}
                                                    iconType="circle"
                                                />
                                                <Pie
                                                    data={categorySeries}
                                                    dataKey="value"
                                                    nameKey="name"
                                                    cx="50%"
                                                    cy="45%"
                                                    outerRadius={80}
                                                    innerRadius={40}
                                                    paddingAngle={2}
                                                >
                                                    {categorySeries.map((entry, index) => (
                                                        <Cell
                                                            key={`cell-${index}`}
                                                            fill={
                                                                index === 0 ? sportsColors.gold[500] :
                                                                    index === 1 ? sportsColors.primary[500] :
                                                                        index === 2 ? '#8B5CF6' :
                                                                            '#10B981'
                                                            }
                                                        />
                                                    ))}
                                                </Pie>
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </Card>
                            </Col>
                        </Row>

                        {/* Financial Record Modal */}
                        <Modal
                            title={editingRecord ? t('owner.financials.edit_record') : t('owner.financials.add_record')}
                            open={modalVisible}
                            onOk={handleSubmit}
                            onCancel={() => setModalVisible(false)}
                            width={600}
                            okText={t('common.save')}
                            cancelText={t('common.cancel')}
                        >
                            <Form form={form} layout="vertical" onValuesChange={handleValuesChange}>
                                <Row gutter={16}>
                                    <Col span={12}>
                                        <Form.Item
                                            name="type"
                                            label={t('owner.financials.type')}
                                        >
                                            <Select
                                                showSearch
                                                placeholder={t('owner.financials.select_type')}
                                                optionFilterProp="label"
                                            >
                                                <Option value="income" label={t('owner.financials.income')}>{t('owner.financials.income')}</Option>
                                                <Option value="expense" label={t('owner.financials.expense')}>{t('owner.financials.expense')}</Option>
                                                <Option value="arrears" label={t('owner.financials.arrears')}>{t('owner.financials.arrears')}</Option>
                                            </Select>
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item
                                            name="category"
                                            label={t('owner.financials.category')}
                                        >
                                            <Select
                                                placeholder={t('owner.financials.category_placeholder')}
                                                showSearch
                                            >
                                                <Option value="Commission" label={t('owner.financials.categories.Commission')}>{t('owner.financials.categories.Commission')}</Option>
                                                <Option value="Marketing" label={t('owner.financials.categories.Marketing')}>{t('owner.financials.categories.Marketing')}</Option>
                                                <Option value="Consultation" label={t('owner.financials.categories.Consultation')}>{t('owner.financials.categories.Consultation')}</Option>
                                                <Option value="Salary" label={t('owner.financials.categories.Salary')}>{t('owner.financials.categories.Salary')}</Option>
                                                <Option value="Bonus" label={t('owner.financials.categories.Bonus')}>{t('owner.financials.categories.Bonus')}</Option>
                                                <Option value="Sponsorship" label={t('owner.financials.categories.Sponsorship')}>{t('owner.financials.categories.Sponsorship')}</Option>
                                                <Option value="Other" label={t('owner.financials.categories.Other')}>{t('owner.financials.categories.Other')}</Option>
                                            </Select>
                                        </Form.Item>
                                    </Col>
                                </Row>

                                <Row gutter={16}>
                                    <Col span={12}>
                                        <Form.Item
                                            name="amount"
                                            label={t('owner.financials.amount')}
                                        >
                                            <InputNumber
                                                style={{ width: '100%' }}
                                                placeholder={t('owner.financials.amount_placeholder')}
                                                formatter={(value) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                                parser={(value) => value!.replace(/\$\s?|(,*)/g, '')}
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item
                                            name="currency"
                                            label={t('owner.financials.currency')}
                                        >
                                            <Select
                                                showSearch
                                                placeholder={t('owner.financials.currency_placeholder')}
                                                optionFilterProp="label"
                                            >
                                                <Option value="USD" label="USD">USD</Option>
                                                <Option value="EUR" label="EUR">EUR</Option>
                                                <Option value="KWD" label="KWD">KWD</Option>
                                            </Select>
                                        </Form.Item>
                                    </Col>
                                </Row>

                                <Form.Item
                                    name="descriptionAr"
                                    label={`${t('owner.financials.description')} (العربية)`}
                                >
                                    <Input.TextArea rows={2} placeholder="الوصف بالعربية" />
                                </Form.Item>

                                <Form.Item
                                    name="description"
                                    label={t('owner.financials.description')}
                                >
                                    <Input.TextArea rows={2} placeholder={t('owner.financials.description_placeholder')} />
                                </Form.Item>

                                <Form.Item
                                    name="date"
                                    label={t('owner.financials.date')}
                                >
                                    <DatePicker style={{ width: '100%' }} />
                                </Form.Item>

                                <Form.Item
                                    name="related_to"
                                    label={t('owner.financials.related_to')}
                                >
                                    <Input placeholder={t('owner.financials.related_to_placeholder')} />
                                </Form.Item>
                            </Form>
                        </Modal>

                        {/* View Details Modal */}
                        <Modal
                            title={t('owner.financials.record_details')}
                            open={viewModalVisible}
                            onCancel={() => setViewModalVisible(false)}
                            footer={[
                                <Button key="close" onClick={() => setViewModalVisible(false)}>
                                    {t('common.close')}
                                </Button>
                            ]}
                            width={500}
                            centered
                        >
                            {selectedRecord && (
                                <div className="space-y-4">
                                    <Row gutter={[16, 16]}>
                                        <Col span={12}>
                                            <Text type="secondary" className="block">{t('owner.financials.type')}</Text>
                                            <Tag color={selectedRecord.type === 'income' ? sportsColors.gold[500] : (selectedRecord.type === 'expense' ? sportsColors.primary[500] : '#FF4D4F')}>
                                                {selectedRecord.type === 'income' ? t('owner.financials.income') : (selectedRecord.type === 'expense' ? t('owner.financials.expense') : (selectedRecord.type === 'arrears' ? t('owner.financials.arrears') : '-'))}
                                            </Tag>
                                        </Col>
                                        <Col span={12}>
                                            <Text type="secondary" className="block">{t('owner.financials.category')}</Text>
                                            <Text strong>
                                                {i18n.language === 'ar' 
                                                    ? (t(`owner.financials.categories.${selectedRecord.category}`, { defaultValue: selectedRecord.categoryAr || selectedRecord.category }))
                                                    : selectedRecord.category
                                                }
                                            </Text>
                                        </Col>
                                        <Col span={12}>
                                            <Text type="secondary" className="block">{t('owner.financials.amount')}</Text>
                                            <Text strong className="text-lg" style={{ color: selectedRecord.type === 'income' ? sportsColors.gold[500] : (selectedRecord.type === 'expense' ? sportsColors.primary[500] : '#FF4D4F') }}>
                                                {formatCurrency(convertAmount(selectedRecord.amount, selectedRecord.currency || 'USD'), displayCurrency)}
                                            </Text>
                                        </Col>
                                        <Col span={12}>
                                            <Text type="secondary" className="block">{t('owner.financials.date')}</Text>
                                            <Text strong>{selectedRecord.date ? formatDate(selectedRecord.date) : '-'}</Text>
                                        </Col>
                                        <Col span={24}>
                                            <Divider style={{ margin: '8px 0' }} />
                                            <Text type="secondary" className="block">{t('owner.financials.description')}</Text>
                                            <div className="mt-2 p-3 bg-slate-50 rounded">
                                                <DynamicTranslate 
                                                    text={i18n.language === 'ar' ? (selectedRecord.descriptionAr || selectedRecord.description) : (selectedRecord.description || selectedRecord.descriptionAr) || '-'} 
                                                    sourceLang={isArabicText(i18n.language === 'ar' ? (selectedRecord.descriptionAr || selectedRecord.description) : (selectedRecord.description || selectedRecord.descriptionAr)) ? 'ar' : 'en'} 
                                                />
                                            </div>
                                        </Col>
                                        {selectedRecord.related_to && (
                                            <Col span={24}>
                                                <Text type="secondary" className="block">{t('owner.financials.related_to')}</Text>
                                                <Text strong>{selectedRecord.related_to}</Text>
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
                            rows={records}
                            fetchAllData={fetchAllDataForPdf}
                            fields={FINANCIAL_PDF_FIELDS}
                            defaultFields={DEFAULT_FINANCIAL_PDF_FIELDS}
                            groups={[
                                { titleKey: 'basic', keys: ['type', 'category', 'description'] },
                                { titleKey: 'contract', keys: ['amount', 'date', 'related_to'] },
                            ]}
                            reportTitle="Financial Report"
                            reportTitleAr="التقرير المالي"
                        />
                    </Space>
                </div >
            )}
        </>
    );
};