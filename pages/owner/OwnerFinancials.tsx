import React, { useEffect, useState } from 'react';
import { Card, Button, Space, Modal, Form, Input, InputNumber, Select, DatePicker, message, Typography, Row, Col, Statistic, Spin, Table, Tag, Divider, Radio } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, DollarOutlined, BarChartOutlined, PieChartOutlined } from '@ant-design/icons';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import { FinancialRecord, FinancialStats } from '../../types';
import { mockFinancialApi } from '../../services/mockOwnerApi';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n';
import dayjs from 'dayjs';
import { sportsColors, ashkananiSportTheme } from '../../utils/theme';

const { Title, Text } = Typography;
const { Option } = Select;

export const OwnerFinancials: React.FC = () => {
    const { t } = useTranslation();
    const [records, setRecords] = useState<FinancialRecord[]>([]);
    const [stats, setStats] = useState<FinancialStats>({
        totalIncome: 0,
        totalExpense: 0,
        netProfit: 0,
        monthlyIncome: 0,
        monthlyExpense: 0,
        yearlyIncome: 0,
        yearlyExpense: 0,
    });
    const [loading, setLoading] = useState(false);
    const [incomeExpenseSeries, setIncomeExpenseSeries] = useState<any[]>([]);
    const [categorySeries, setCategorySeries] = useState<any[]>([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingRecord, setEditingRecord] = useState<FinancialRecord | null>(null);
    const [filters, setFilters] = useState({
        type: undefined as 'income' | 'expense' | undefined,
        startDate: undefined as string | undefined,
        endDate: undefined as string | undefined,
    });
    const [form] = Form.useForm();

    useEffect(() => {
        loadFinancials();
    }, [filters]);

    const loadFinancials = async () => {
        setLoading(true);
        try {
            const [recordsData, statsData] = await Promise.all([
                mockFinancialApi.getAll(filters),
                mockFinancialApi.getStats(),
            ]);
            setRecords(recordsData);
            setStats(statsData);
            buildCharts(recordsData);
        } catch (error) {
            message.error(t('owner.financials.load_failed'));
        } finally {
            setLoading(false);
        }
    };

    const buildCharts = (records: any[]) => {
        // Build last 6 months series
        const months: string[] = [];
        for (let i = 5; i >= 0; i--) {
            months.push(dayjs().subtract(i, 'month').format('MMM YYYY'));
        }

        const series = months.map((m) => ({ month: m, income: 0, expense: 0 }));

        records.forEach((r) => {
            const m = dayjs(r.date).format('MMM YYYY');
            const idx = series.findIndex(s => s.month === m);
            if (idx !== -1) {
                if (r.type === 'income') series[idx].income += r.amount;
                else series[idx].expense += r.amount;
            }
        });

        setIncomeExpenseSeries(series);

        // Category breakdown
        const catMap: Record<string, { nameEn: string, nameAr: string, value: number }> = {};
        records.forEach((r) => {
            const key = r.category; // Use English as key
            if (!catMap[key]) {
                catMap[key] = {
                    nameEn: r.category,
                    nameAr: r.categoryAr || r.category,
                    value: 0
                };
            }
            catMap[key].value += r.amount;
        });
        const cats = Object.values(catMap).map(item => ({
            nameEn: item.nameEn,
            nameAr: item.nameAr,
            name: i18n.language === 'ar' ? item.nameAr : item.nameEn,
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

    const handleDelete = (record: FinancialRecord) => {
        Modal.confirm({
            title: t('owner.financials.delete_record_title'),
            content: t('owner.financials.delete_record_confirm', { description: record.description }),
            okText: t('common.delete'),
            okType: 'primary',
            onOk: async () => {
                try {
                    await mockFinancialApi.delete(record.id);
                    message.success(t('owner.financials.delete_success'));
                    loadFinancials();
                } catch (error) {
                    message.error(t('owner.financials.delete_failed'));
                }
            },
        });
    };

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();

            if (editingRecord) {
                await mockFinancialApi.update(editingRecord.id, {
                    ...values,
                    date: values.date ? values.date.format('YYYY-MM-DD') : undefined,
                });
                message.success(t('owner.financials.updated_success'));
            } else {
                await mockFinancialApi.create({
                    ...values,
                    date: values.date ? values.date.format('YYYY-MM-DD') : undefined,
                });
                message.success(t('owner.financials.created_success'));
            }

            setModalVisible(false);
            loadFinancials();
        } catch (error) {
            message.error(t('owner.financials.save_failed'));
        }
    };

    const columns = [
        {
            title: t('owner.financials.type'),
            dataIndex: 'type',
            key: 'type',
            render: (type: string) => (
                <Tag color={type === 'income' ? sportsColors.gold[500] : sportsColors.primary[500]}>
                    {type === 'income' ? t('owner.financials.income') : t('owner.financials.expense')}
                </Tag>
            ),
        },
        {
            title: t('owner.financials.category'),
            dataIndex: 'category',
            key: 'category',
            render: (_: string, record: FinancialRecord) => {
                const currentLang = i18n.language;
                return currentLang === 'ar' && record.categoryAr ? record.categoryAr : record.category;
            },
        },
        {
            title: t('owner.financials.description'),
            dataIndex: 'description',
            key: 'description',
            render: (_: string, record: FinancialRecord) => {
                const currentLang = i18n.language;
                return currentLang === 'ar' && record.descriptionAr ? record.descriptionAr : record.description;
            },
        },
        {
            title: t('owner.financials.amount'),
            dataIndex: 'amount',
            key: 'amount',
            render: (amount: number) => `$${amount.toLocaleString()}`,
        },
        {
            title: t('owner.financials.date'),
            dataIndex: 'date',
            key: 'date',
        },
        {
            title: t('owner.financials.actions'),
            key: 'actions',
            render: (_: any, record: FinancialRecord) => (
                <Space size="middle">
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
        <div className="fade-in">
            <div style={{ marginBottom: 24 }}>
                <Title level={2}>{t('owner.financials.title')}</Title>
                <Text type="secondary">{t('owner.financials.subtitle')}</Text>
            </div>

            <Space direction="vertical" size="large" style={{ width: '100%' }}>
                {/* KPI Cards */}
                <Row gutter={[16, 16]}>
                    <Col xs={24} sm={12} lg={6}>
                        <Card className="card-hover">
                            <Statistic
                                title={t('owner.financials.total_income')}
                                value={stats.totalIncome}
                                prefix={<DollarOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} style={{ color: sportsColors.gold[500] }} />}
                                valueStyle={{ color: sportsColors.gold[500], fontWeight: 'bold' }}
                                formatter={(value) => `$${(value as number).toLocaleString()}`}
                                loading={loading}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Card className="card-hover">
                            <Statistic
                                title={t('owner.financials.total_expense')}
                                value={stats.totalExpense}
                                prefix={<DollarOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} style={{ color: sportsColors.primary[500] }} />}
                                valueStyle={{ color: '#3F3F3F', fontWeight: 'bold' }}
                                formatter={(value) => `$${(value as number).toLocaleString()}`}
                                loading={loading}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Card className="card-hover">
                            <Statistic
                                title={t('owner.financials.net_profit')}
                                value={stats.netProfit}
                                prefix={<DollarOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} style={{ color: stats.netProfit >= 0 ? sportsColors.gold[500] : ashkananiSportTheme.token.colorError }} />}
                                valueStyle={{ color: stats.netProfit >= 0 ? sportsColors.gold[500] : ashkananiSportTheme.token.colorError, fontWeight: 'bold' }}
                                formatter={(value) => `$${(value as number).toLocaleString()}`}
                                loading={loading}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Card className="card-hover">
                            <Statistic
                                title={t('owner.financials.monthly_profit')}
                                value={stats.monthlyIncome - stats.monthlyExpense}
                                prefix={<DollarOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} style={{ color: (stats.monthlyIncome - stats.monthlyExpense) >= 0 ? sportsColors.gold[500] : ashkananiSportTheme.token.colorError }} />}
                                valueStyle={{ color: (stats.monthlyIncome - stats.monthlyExpense) >= 0 ? sportsColors.gold[500] : ashkananiSportTheme.token.colorError, fontWeight: 'bold' }}
                                formatter={(value) => `$${(value as number).toLocaleString()}`}
                                loading={loading}
                            />
                        </Card>
                    </Col>
                </Row>

                {/* Filters and Actions */}
                <Card>
                    <Row justify="space-between" align="middle">
                        <Col>
                            <Space size="large">
                                <div>
                                    <Text strong className="block mb-2 text-slate-400 uppercase text-[10px] tracking-widest">
                                        {t('common.type')}
                                    </Text>
                                    <Radio.Group
                                        value={filters.type}
                                        onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                                    >
                                        <Radio.Button value={undefined}>{t('common.all')}</Radio.Button>
                                        <Radio.Button value="income">{t('owner.financials.income')}</Radio.Button>
                                        <Radio.Button value="expense">{t('owner.financials.expense')}</Radio.Button>
                                    </Radio.Group>
                                </div>
                                <div>
                                    <Text strong className="block mb-2 text-slate-400 uppercase text-[10px] tracking-widest">
                                        {t('common.date_range')}
                                    </Text>
                                    <Space>
                                        <DatePicker
                                            placeholder={t('common.start_date')}
                                            onChange={(date) => setFilters({ ...filters, startDate: date ? date.format('YYYY-MM-DD') : undefined })}
                                        />
                                        <DatePicker
                                            placeholder={t('common.end_date')}
                                            onChange={(date) => setFilters({ ...filters, endDate: date ? date.format('YYYY-MM-DD') : undefined })}
                                        />
                                    </Space>
                                </div>
                            </Space>
                        </Col>
                        <Col>
                            <Button
                                type="primary"
                                icon={<PlusOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
                                onClick={handleCreate}
                                style={{ background: '#3F3F3F' }}
                            >
                                {t('owner.financials.add_record')}
                            </Button>
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
                            <div style={{ height: 320 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={incomeExpenseSeries} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                                        <YAxis tickFormatter={(v) => `$${(v as number).toLocaleString()}`} />
                                        <Tooltip formatter={(value: any) => `$${(value as number).toLocaleString()}`} />
                                        <Legend />
                                        <Bar dataKey="income" name={t('owner.financials.income')} fill={sportsColors.gold[500]} />
                                        <Bar dataKey="expense" name={t('owner.financials.expense')} fill={sportsColors.primary[500]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>
                    </Col>
                    <Col xs={24} lg={12}>
                        <Card title={t('owner.financials.category_breakdown')} className="card-hover">
                            <div style={{ height: 320 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Tooltip
                                            formatter={(value: any) => `$${(value as number).toLocaleString()}`}
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
                    <Form form={form} layout="vertical">
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item
                                    name="type"
                                    label={t('owner.financials.type')}
                                >
                                    <Select placeholder={t('owner.financials.select_type')}>
                                        <Option value="income">{t('owner.financials.income')}</Option>
                                        <Option value="expense">{t('owner.financials.expense')}</Option>
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    name="category"
                                    label={t('owner.financials.category')}
                                >
                                    <Input placeholder={t('owner.financials.category_placeholder')} />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item
                                    name="amount"
                                    label={t('owner.financials.amount')}
                                    rules={[{ type: 'number', min: 0 }]}
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
                                    <Select placeholder={t('owner.financials.currency_placeholder')}>
                                        <Option value="USD">USD</Option>
                                        <Option value="EUR">EUR</Option>
                                        <Option value="KWD">KWD</Option>
                                    </Select>
                                </Form.Item>
                            </Col>
                        </Row>

                        <Form.Item
                            name="description"
                            label={t('owner.financials.description')}
                        >
                            <Input.TextArea rows={3} placeholder={t('owner.financials.description_placeholder')} />
                        </Form.Item>

                        <Form.Item
                            name="date"
                            label={t('owner.financials.date')}
                        >
                            <DatePicker style={{ width: '100%' }} />
                        </Form.Item>

                        <Form.Item
                            name="relatedTo"
                            label={t('owner.financials.related_to')}
                        >
                            <Input placeholder={t('owner.financials.related_to_placeholder')} />
                        </Form.Item>
                    </Form>
                </Modal>
            </Space>
        </div>
    );
};