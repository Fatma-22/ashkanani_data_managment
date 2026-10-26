import { FC, useEffect, useState } from 'react';
import {
    Card, Button, Space, Modal, Form, Input, InputNumber, Select, DatePicker,
    message, Typography, Row, Col, Statistic, Table, Tag, Upload, Tooltip, Popconfirm, Alert
} from 'antd';
import {
    PlusOutlined, EditOutlined, DeleteOutlined, LockOutlined,
    UploadOutlined, PaperClipOutlined, DollarOutlined, LinkOutlined, SwapOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { PlayerPayment } from '../types';
import { playerService } from '../services/playerService';
import { formatCurrency, formatDate, getCurrencySymbol } from '../utils/helpers';

const { Title, Text } = Typography;
const { Option } = Select;

interface PlayerPaymentsSectionProps {
    playerId: string;
}

const PAYMENT_STATUS_COLORS: Record<string, string> = {
    PENDING: 'orange',
    PARTIAL: 'blue',
    PAID: 'green',
    OVERDUE: 'red',
};

const PlayerPaymentsSection: FC<PlayerPaymentsSectionProps> = ({ playerId }) => {
    const { t, i18n } = useTranslation();
    const [payments, setPayments] = useState<PlayerPayment[]>([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [editing, setEditing] = useState<PlayerPayment | null>(null);
    const [receiptFile, setReceiptFile] = useState<any>(null);
    const [removeReceipt, setRemoveReceipt] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form] = Form.useForm();
    const [displayCurrency, setDisplayCurrency] = useState<'USD' | 'KWD'>('USD');
    const [rates, setRates] = useState<Record<string, number>>({ USD: 1, KWD: 0.307, EUR: 0.92 });
    const [isFetchingRate, setIsFetchingRate] = useState(false);

    const formCurrency = Form.useWatch('currency', form) || 'USD';
    const symbol = getCurrencySymbol(formCurrency);

    const loadPayments = async () => {
        setLoading(true);
        try {
            const data = await playerService.getPayments(playerId);
            setPayments(Array.isArray(data) ? data : []);
        } catch (error) {
            message.error(t('player_payments.load_error'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (playerId) loadPayments();
    }, [playerId]);

    useEffect(() => {
        const fetchRates = async () => {
            setIsFetchingRate(true);
            try {
                const res = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
                const data = await res.json();
                if (data?.rates) {
                    setRates(data.rates);
                }
            } catch (error) {
                console.warn('Failed to fetch exchange rates', error);
            } finally {
                setIsFetchingRate(false);
            }
        };
        fetchRates();
    }, []);

    const convertAmount = (amount: number, fromCurrency?: string) => {
        if (!amount) return 0;
        const from = (fromCurrency || 'USD').toUpperCase();
        const rateFrom = rates[from] || 1;
        const rateTo = rates[displayCurrency] || 1;
        return (amount / rateFrom) * rateTo;
    };

    const totals = payments.reduce(
        (acc, p) => {
            const currency = p.currency || 'USD';
            acc.total += convertAmount(Number(p.total_amount) || 0, currency);
            acc.paid += convertAmount(Number(p.paid_amount) || 0, currency);
            acc.remaining += convertAmount(Number(p.remaining_amount ?? (Number(p.total_amount) - Number(p.paid_amount))) || 0, currency);
            return acc;
        },
        { total: 0, paid: 0, remaining: 0 }
    );

    const handleCreate = () => {
        setEditing(null);
        form.resetFields();
        setReceiptFile(null);
        setRemoveReceipt(false);
        form.setFieldsValue({ currency: 'USD', status: 'PENDING', paid_amount: 0 });
        setModalVisible(true);
    };

    const handleEdit = (record: PlayerPayment) => {
        setEditing(record);
        setReceiptFile(null);
        setRemoveReceipt(false);
        form.setFieldsValue({
            title: record.title,
            total_amount: Number(record.total_amount),
            paid_amount: Number(record.paid_amount),
            currency: record.currency || 'USD',
            status: record.status || 'PENDING',
            due_date: record.due_date ? dayjs(record.due_date) : undefined,
            payment_date: record.payment_date ? dayjs(record.payment_date) : undefined,
            notes: record.notes,
        });
        setModalVisible(true);
    };

    const handleDelete = async (record: PlayerPayment) => {
        try {
            await playerService.deletePayment(playerId, record.id);
            message.success(t('messages.success_delete'));
            loadPayments();
        } catch (error) {
            message.error(t('messages.error_delete'));
        }
    };

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            setSaving(true);

            const fd = new FormData();
            const append = (k: string, v: any) => {
                if (v !== undefined && v !== null && v !== '') fd.append(k, v);
            };
            append('title', values.title);
            append('total_amount', values.total_amount);
            append('paid_amount', values.paid_amount ?? 0);
            append('currency', values.currency);
            append('status', values.status);
            append('due_date', values.due_date ? values.due_date.format('YYYY-MM-DD') : '');
            append('payment_date', values.payment_date ? values.payment_date.format('YYYY-MM-DD') : '');
            append('notes', values.notes);
            if (receiptFile) fd.append('receipt', receiptFile);
            if (removeReceipt) fd.append('remove_receipt', '1');

            if (editing) {
                await playerService.updatePayment(playerId, editing.id, fd);
                message.success(t('messages.success_update'));
            } else {
                await playerService.createPayment(playerId, fd);
                message.success(t('messages.success_save'));
            }

            setModalVisible(false);
            setReceiptFile(null);
            setRemoveReceipt(false);
            loadPayments();
        } catch (error: any) {
            if (error?.errorFields) return; // validation error
            message.error(t('messages.error_save'));
        } finally {
            setSaving(false);
        }
    };

    const renderMoney = (amount: number, currency?: string, color?: string) => {
        const originalCurrency = (currency || 'USD').toUpperCase();
        const converted = convertAmount(amount, originalCurrency);
        const isDifferent = originalCurrency !== displayCurrency;

        return (
            <Space direction="vertical" size={0}>
                <Text strong style={color ? { color } : undefined}>
                    {formatCurrency(converted, displayCurrency, true)}
                </Text>
                {isDifferent && (
                    <Text type="secondary" style={{ fontSize: 10 }}>
                        {formatCurrency(amount, originalCurrency, true)}
                    </Text>
                )}
            </Space>
        );
    };

    const columns = [
        {
            title: t('player_payments.title_col', { defaultValue: 'Title' }),
            dataIndex: 'title',
            key: 'title',
            render: (v: string) => v || '-',
        },
        {
            title: t('player_payments.total', { defaultValue: 'Total' }),
            key: 'total_amount',
            render: (_: any, r: PlayerPayment) => renderMoney(Number(r.total_amount) || 0, r.currency),
        },
        {
            title: t('player_payments.paid', { defaultValue: 'Paid' }),
            key: 'paid_amount',
            render: (_: any, r: PlayerPayment) => renderMoney(Number(r.paid_amount) || 0, r.currency, '#52c41a'),
        },
        {
            title: t('player_payments.remaining', { defaultValue: 'Remaining' }),
            key: 'remaining_amount',
            render: (_: any, r: PlayerPayment) => {
                const remaining = Number(r.remaining_amount ?? (Number(r.total_amount) - Number(r.paid_amount)));
                return renderMoney(remaining, r.currency, remaining > 0 ? '#ff4d4f' : '#52c41a');
            },
        },
        {
            title: t('player_payments.due_date', { defaultValue: 'Due Date' }),
            dataIndex: 'due_date',
            key: 'due_date',
            render: (v: string) => v ? formatDate(v) : '-',
        },
        {
            title: t('player_payments.payment_date', { defaultValue: 'Payment Date' }),
            dataIndex: 'payment_date',
            key: 'payment_date',
            render: (v: string) => v ? formatDate(v) : '-',
        },
        {
            title: t('player_payments.status', { defaultValue: 'Status' }),
            dataIndex: 'status',
            key: 'status',
            render: (v: string) => (
                <Tag color={PAYMENT_STATUS_COLORS[v] || 'default'}>
                    {t(`player_payments.statuses.${v}`, { defaultValue: v || '-' })}
                </Tag>
            ),
        },
        {
            title: t('player_payments.ledger', { defaultValue: 'Financial ledger' }),
            key: 'ledger',
            render: (_: any, r: PlayerPayment) => (
                r.is_synced ? (
                    <Tooltip title={t('player_payments.synced_notice', { defaultValue: 'Synced with the financial ledger' })}>
                        <Tag color="green" icon={<LinkOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}>
                            {t('player_payments.synced_badge', { defaultValue: 'Linked' })}
                        </Tag>
                    </Tooltip>
                ) : <Text type="secondary">-</Text>
            ),
        },
        {
            title: t('player_payments.receipt', { defaultValue: 'Receipt' }),
            key: 'receipt',
            render: (_: any, r: PlayerPayment) => (
                r.receipt_url ? (
                    <Button type="link" size="small" icon={<PaperClipOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />} href={r.receipt_url} target="_blank" rel="noopener noreferrer">
                        {t('player_payments.view', { defaultValue: 'View' })}
                    </Button>
                ) : <Text type="secondary">-</Text>
            ),
        },
        {
            title: t('player_payments.notes', { defaultValue: 'Notes' }),
            dataIndex: 'notes',
            key: 'notes',
            render: (v: string) => v ? <Tooltip title={v}><span>{v.length > 20 ? v.slice(0, 20) + '…' : v}</span></Tooltip> : '-',
        },
        {
            title: t('common.actions', { defaultValue: 'Actions' }),
            key: 'actions',
            render: (_: any, r: PlayerPayment) => (
                <Space>
                    <Button type="link" size="small" icon={<EditOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />} onClick={() => handleEdit(r)} />
                    <Popconfirm
                        title={t('player_payments.delete_confirm', { defaultValue: 'Delete this payment?' })}
                        description={r.is_synced ? t('player_payments.delete_synced_confirm', { defaultValue: 'The linked financial ledger record will be deleted too.' }) : undefined}
                        onConfirm={() => handleDelete(r)}
                        okText={t('common.yes', { defaultValue: 'Yes' })}
                        cancelText={t('common.no', { defaultValue: 'No' })}
                    >
                        <Button type="link" size="small" danger icon={<DeleteOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />} />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <Card
            className="mt-6"
            title={
                <Space>
                    <LockOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} style={{ color: '#C9A24D' }} />
                    <span>{t('player_payments.section_title', { defaultValue: 'Payments (Confidential — Management Only)' })}</span>
                </Space>
            }
            extra={
                <Space wrap>
                    <Button
                        icon={<SwapOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
                        loading={isFetchingRate}
                        onClick={() => setDisplayCurrency(prev => prev === 'USD' ? 'KWD' : 'USD')}
                    >
                        {displayCurrency === 'USD'
                            ? (i18n.language === 'ar' ? 'عرض بالدينار (KWD)' : 'Show in KWD')
                            : (i18n.language === 'ar' ? 'عرض بالدولار (USD)' : 'Show in USD')}
                    </Button>
                    <Button type="primary" icon={<PlusOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />} onClick={handleCreate} style={{ background: '#C9A24D', borderColor: '#C9A24D' }}>
                        {t('player_payments.add', { defaultValue: 'Add Payment' })}
                    </Button>
                </Space>
            }
        >
            <Row gutter={[16, 16]} className="mb-4">
                <Col xs={24} sm={8}>
                    <Statistic
                        title={t('player_payments.total_amount', { defaultValue: 'Total Amount' })}
                        value={totals.total}
                        prefix={<DollarOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
                        formatter={(value) => formatCurrency(Number(value), displayCurrency, true)}
                    />
                </Col>
                <Col xs={24} sm={8}>
                    <Statistic
                        title={t('player_payments.total_paid', { defaultValue: 'Total Paid' })}
                        value={totals.paid}
                        valueStyle={{ color: '#52c41a' }}
                        formatter={(value) => formatCurrency(Number(value), displayCurrency, true)}
                    />
                </Col>
                <Col xs={24} sm={8}>
                    <Statistic
                        title={t('player_payments.total_remaining', { defaultValue: 'Total Remaining' })}
                        value={totals.remaining}
                        valueStyle={{ color: totals.remaining > 0 ? '#ff4d4f' : '#52c41a' }}
                        formatter={(value) => formatCurrency(Number(value), displayCurrency, true)}
                    />
                </Col>
            </Row>

            <Alert
                type="info"
                showIcon
                icon={<LinkOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
                message={
                    <span>
                        {t('player_payments.synced_notice', { defaultValue: 'Payments are automatically synced with the financial ledger.' })}
                        <br />
                        {t('player_payments.currency_notice', {
                            defaultValue: 'Amounts are converted according to each payment currency and the current USD-based exchange rate; the original entry currency is preserved.',
                        })}
                    </span>
                }
                style={{ marginBottom: 16 }}
            />

            <Table
                rowKey="id"
                loading={loading}
                columns={columns as any}
                dataSource={payments}
                size="small"
                scroll={{ x: 'max-content' }}
                pagination={false}
            />

            <Modal
                title={editing ? t('player_payments.edit', { defaultValue: 'Edit Payment' }) : t('player_payments.add', { defaultValue: 'Add Payment' })}
                open={modalVisible}
                onOk={handleSubmit}
                confirmLoading={saving}
                onCancel={() => setModalVisible(false)}
                okText={t('common.save', { defaultValue: 'Save' })}
                cancelText={t('common.cancel', { defaultValue: 'Cancel' })}
                width={620}
            >
                <Form form={form} layout="vertical">
                    <Form.Item name="title" label={t('player_payments.title_col', { defaultValue: 'Title' })}>
                        <Input placeholder={t('player_payments.title_placeholder', { defaultValue: 'e.g. Signing fee, Monthly salary' })} />
                    </Form.Item>
                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item name="total_amount" label={t('player_payments.total', { defaultValue: 'Total Amount' })} rules={[{ required: true }]}>
                                <InputNumber style={{ width: '100%' }} min={0} prefix={symbol} formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={(v) => v!.replace(/[^\d.]/g, '')} />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="paid_amount" label={t('player_payments.paid', { defaultValue: 'Paid Amount' })}>
                                <InputNumber style={{ width: '100%' }} min={0} prefix={symbol} formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={(v) => v!.replace(/[^\d.]/g, '')} />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="currency" label={t('player_payments.currency', { defaultValue: 'Currency' })}>
                                <Select>
                                    <Option value="USD">USD</Option>
                                    <Option value="EUR">EUR</Option>
                                    <Option value="KWD">KWD</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item name="due_date" label={t('player_payments.due_date', { defaultValue: 'Due Date' })}>
                                <DatePicker style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="payment_date" label={t('player_payments.payment_date', { defaultValue: 'Payment Date' })}>
                                <DatePicker style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="status" label={t('player_payments.status', { defaultValue: 'Status' })}>
                                <Select>
                                    <Option value="PENDING">{t('player_payments.statuses.PENDING', { defaultValue: 'Pending' })}</Option>
                                    <Option value="PARTIAL">{t('player_payments.statuses.PARTIAL', { defaultValue: 'Partial' })}</Option>
                                    <Option value="PAID">{t('player_payments.statuses.PAID', { defaultValue: 'Paid' })}</Option>
                                    <Option value="OVERDUE">{t('player_payments.statuses.OVERDUE', { defaultValue: 'Overdue' })}</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>
                    <Form.Item name="notes" label={t('player_payments.notes', { defaultValue: 'Notes' })}>
                        <Input.TextArea rows={2} />
                    </Form.Item>
                    <Form.Item label={t('player_payments.receipt', { defaultValue: 'Payment Receipt (PDF/Image)' })}>
                        {editing?.receipt_url && !receiptFile && !removeReceipt && (
                            <div style={{ marginBottom: 8 }}>
                                <Space>
                                    <Button type="link" size="small" icon={<PaperClipOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />} href={editing.receipt_url} target="_blank" rel="noopener noreferrer">
                                        {t('player_payments.view_current', { defaultValue: 'View current receipt' })}
                                    </Button>
                                    <Button type="link" size="small" danger icon={<DeleteOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />} onClick={() => setRemoveReceipt(true)}>
                                        {t('common.remove', { defaultValue: 'Remove' })}
                                    </Button>
                                </Space>
                            </div>
                        )}
                        {removeReceipt && (
                            <div style={{ marginBottom: 8 }}>
                                <Text type="secondary">{t('player_payments.receipt_will_be_removed', { defaultValue: 'Receipt will be removed on save.' })}</Text>{' '}
                                <Button type="link" size="small" onClick={() => setRemoveReceipt(false)}>{t('common.cancel', { defaultValue: 'Cancel' })}</Button>
                            </div>
                        )}
                        <Upload
                            maxCount={1}
                            accept=".pdf,.jpg,.jpeg,.png"
                            beforeUpload={(file) => { setReceiptFile(file); setRemoveReceipt(false); return false; }}
                            onRemove={() => setReceiptFile(null)}
                            fileList={receiptFile ? [receiptFile] : []}
                        >
                            <Button icon={<UploadOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}>
                                {t('player_payments.upload_receipt', { defaultValue: 'Upload Receipt' })}
                            </Button>
                        </Upload>
                    </Form.Item>
                </Form>
            </Modal>
        </Card>
    );
};

export default PlayerPaymentsSection;
