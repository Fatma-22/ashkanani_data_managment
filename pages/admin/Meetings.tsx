import React, { FC, useEffect, useState } from 'react';
import { Table, Button, Space, message, Popconfirm, Tag, Tooltip, ConfigProvider, Typography, Modal, Form, Input, Select, DatePicker, Row, Col, Card, AutoComplete } from 'antd';
import type { Breakpoint } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, InfoCircleOutlined, FilePdfOutlined, CalendarOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { meetingService } from '../../services/meetingService';
import { Meeting, Player } from '../../types';
import dayjs from 'dayjs';
import GenericPdfExportModal from '../../components/GenericPdfExportModal';
import { generateGenericPdf, GenericPdfFieldOption } from '../../utils/pdfExport';
import { playerService } from '../../services/playerService';
import { useStickyState } from '../../utils/hooks';
import { useRef } from 'react';

const { Title, Text } = Typography;
const { Option } = Select;

const MEETING_PDF_FIELDS: GenericPdfFieldOption[] = [
    { key: 'player_name', labelEn: 'Player Name', labelAr: 'الاسم', getValue: (row, t, isAr) => row.player ? (isAr ? (row.player.nameAr || row.player.name) : row.player.name) : (row.related_person_name || '') },
    { key: 'role', labelEn: 'Role', labelAr: 'الصفة', getValue: (row, t, isAr) => row.player ? (isAr ? 'لاعب' : 'Player') : (t(`meetings.type_${row.related_person_type || 'other'}`)) },
    { key: 'meeting_type', labelEn: 'Meeting Type', labelAr: 'نوع الاجتماع', getValue: (row) => row.meeting_type || '' },
    { key: 'meeting_time', labelEn: 'Time', labelAr: 'الوقت', getValue: (row) => row.meeting_time ? dayjs(row.meeting_time, 'HH:mm').format('h:mm A') : '' },
    { key: 'duration', labelEn: 'Duration', labelAr: 'المدة', getValue: (row) => row.duration || '' },
    { key: 'meeting_date', labelEn: 'Date', labelAr: 'التاريخ', getValue: (row, t, isAr) => {
        if (!row.meeting_date) return '';
        const d = dayjs(row.meeting_date);
        const dayName = isAr 
            ? ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'][d.day()]
            : d.format('dddd');
        return `${dayName} ${d.format('DD/MM/YYYY')}`;
    }},
    { key: 'fees', labelEn: 'Fees', labelAr: 'الرسوم', getValue: (row) => row.fees ? String(row.fees) : '0' },
];
const DEFAULT_MEETING_PDF_FIELDS = ['player_name', 'role', 'meeting_type', 'meeting_time', 'duration', 'meeting_date', 'fees'];

export const Meetings: FC = () => {
    const { t, i18n } = useTranslation();
    const isAr = i18n.language === 'ar';
    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [viewModalVisible, setViewModalVisible] = useState(false);
    const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
    const [viewingMeeting, setViewingMeeting] = useState<Meeting | null>(null);
    const [pdfModalVisible, setPdfModalVisible] = useState(false);
    
    const [players, setPlayers] = useState<Player[]>([]);

    const [filters, setFilters] = useStickyState<any>({
        status: undefined,
        month: undefined,
        year: undefined,
        search: ''
    }, 'Admin_Meetings_filters');
    const [page, setPage] = useStickyState(1, 'Admin_Meetings_page');
    const [pageSize, setPageSize] = useStickyState(15, 'Admin_Meetings_pageSize');
    const [total, setTotal] = useState(0);
    const isFirstRender = useRef(true);

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        setPage(1);
    }, [filters]);

    const [form] = Form.useForm();

    useEffect(() => {
        fetchMeetings();
    }, [filters, page, pageSize]);

    useEffect(() => {
        fetchPlayers();
    }, []);

    const fetchPlayers = async () => {
        try {
            const { players: data } = await playerService.getAll({ search: '' }, 1, 10000);
            setPlayers(data);
        } catch (error) {
            console.error('Failed to fetch players', error);
        }
    };

    const fetchMeetings = async () => {
        setLoading(true);
        try {
            const params: any = {
                page,
                per_page: pageSize,
                ...filters
            };
            const response = await meetingService.getAll(params);
            setMeetings(response.data || []);
            setTotal(response.total || response.data?.length || 0);
        } catch (error) {
            message.error(t('messages.error_load'));
        } finally {
            setLoading(false);
        }
    };

    const fetchAllDataForPdf = async () => {
        try {
            const params = { ...filters, per_page: 10000 };
            const response = await meetingService.getAll(params);
            return response.data || [];
        } catch (error) {
            message.error(t('messages.error_load'));
            return [];
        }
    };

    const handleCreate = () => {
        setEditingMeeting(null);
        form.resetFields();
        setModalVisible(true);
    };

    const handleEdit = (meeting: Meeting) => {
        setEditingMeeting(meeting);
        form.setFieldsValue({
            ...meeting,
            meeting_date: meeting.meeting_date ? dayjs(meeting.meeting_date) : null,
            meeting_time: meeting.meeting_time ? dayjs(meeting.meeting_time, 'HH:mm') : null,
        });
        setModalVisible(true);
    };

    const handleView = (meeting: Meeting) => {
        setViewingMeeting(meeting);
        setViewModalVisible(true);
    };

    const handleDelete = async (id: number) => {
        try {
            await meetingService.delete(id);
            message.success(t('messages.success_delete'));
            fetchMeetings();
        } catch (error) {
            message.error(t('messages.error_delete'));
        }
    };

    const onSubmit = async () => {
        try {
            const values = await form.validateFields();
            const formatData = {
                ...values,
                meeting_date: values.meeting_date ? values.meeting_date.format('YYYY-MM-DD') : null,
                meeting_time: values.meeting_time ? values.meeting_time.format('HH:mm') : null,
            };

            if (editingMeeting) {
                await meetingService.update(editingMeeting.id, formatData);
                message.success(t('messages.success_update'));
            } else {
                await meetingService.create(formatData);
                message.success(t('messages.success_save'));
            }
            setModalVisible(false);
            fetchMeetings();
        } catch (error: any) {
            if (error.errorFields) return;
            message.error(t('messages.error_save'));
        }
    };

    const getStatusTag = (status: string) => {
        switch (status) {
            case 'COMPLETED': return <Tag color="success">{t(`meetings.status_COMPLETED`)}</Tag>;
            case 'CANCELLED': return <Tag color="error">{t(`meetings.status_CANCELLED`)}</Tag>;
            case 'SCHEDULED':
            default: return <Tag color="processing">{t(`meetings.status_SCHEDULED`)}</Tag>;
        }
    };

    const columns: any[] = [
        {
            title: isAr ? 'الاسم' : 'Name',
            key: 'player_name',
            render: (_: any, record: Meeting) => record.player ? (isAr ? (record.player.nameAr || record.player.name) : record.player.name) : (record.related_person_name || '-'),
        },
        {
            title: isAr ? 'الصفة' : 'Role',
            key: 'role',
            responsive: ['md'] as Breakpoint[],
            render: (_: any, record: Meeting) => record.player ? (isAr ? 'لاعب' : 'Player') : (t(`meetings.type_${record.related_person_type || 'other'}`)),
        },
        {
            title: t('meetings.meeting_type'),
            dataIndex: 'meeting_type',
            key: 'meeting_type',
        },

        {
            title: t('meetings.time'),
            dataIndex: 'meeting_time',
            key: 'meeting_time',
            render: (text: string) => text ? dayjs(text, 'HH:mm').format('h:mm A') : '-',
        },
        {
            title: t('meetings.duration'),
            dataIndex: 'duration',
            key: 'duration',
            responsive: ['lg'] as Breakpoint[],
            render: (text: string) => text ? (isAr ? `${text} دقيقة` : `${text} min`) : '-',
        },
        {
            title: t('meetings.date'),
            dataIndex: 'meeting_date',
            key: 'meeting_date',
            render: (text: string) => {
                if (!text) return '-';
                const d = dayjs(text);
                const dayName = isAr 
                    ? ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'][d.day()]
                    : d.format('dddd');
                return (
                    <div className="flex flex-col">
                        <span className="font-bold text-gold-500">{dayName}</span>
                        <span className="text-[11px] opacity-70 tracking-tighter">{d.format('DD/MM/YYYY')}</span>
                    </div>
                );
            },
        },
        {
            title: t('meetings.fees'),
            dataIndex: 'fees',
            key: 'fees',
            responsive: ['xl'] as Breakpoint[],
            render: (val: number) => val ? `${val} KD` : '0',
        },
        {
            title: t('common.actions'),
            key: 'actions',
            render: (_: any, record: Meeting) => (
                <Space size="middle">
                    <Tooltip title={t('common.view_details')}>
                        <Button type="default" icon={<InfoCircleOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />} onClick={() => handleView(record)} />
                    </Tooltip>
                    <Tooltip title={t('common.edit')}>
                        <Button type="primary" icon={<EditOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />} onClick={() => handleEdit(record)} />
                    </Tooltip>
                    <Popconfirm
                        title={t('meetings.delete_confirm')}
                        onConfirm={() => handleDelete(record.id)}
                        okText={t('common.yes')}
                        cancelText={t('common.no')}
                    >
                        <Tooltip title={t('common.delete')}>
                            <Button danger icon={<DeleteOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />} />
                        </Tooltip>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <ConfigProvider direction={isAr ? 'rtl' : 'ltr'}>
            <div style={{ padding: '24px' }}>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                    <div>
                        <Title level={2} className="!m-0 flex items-center gap-3">
                            <CalendarOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />
                            {t('meetings.title')}
                        </Title>
                    </div>
                    <Space wrap className="w-full sm:w-auto">
                        <Button type="default" icon={<FilePdfOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />} onClick={() => setPdfModalVisible(true)} className="flex-1 sm:flex-none">
                            {t('common.export_pdf')}
                        </Button>
                        <Button type="primary" icon={<PlusOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />} onClick={handleCreate} className="flex-1 sm:flex-none">
                            {t('meetings.add_new')}
                        </Button>
                    </Space>
                </div>

                <Card className="glass-card mb-4">
                    <Row gutter={[12, 12]}>
                        <Col xs={24} sm={6}>
                            <Input 
                                placeholder={isAr ? "بحث بالاسم أو النوع..." : "Search by name or type..."}
                                size="large"
                                allowClear
                                prefix={<PlusOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} rotate={45} style={{ color: '#999' }} />}
                                value={filters.search}
                                onChange={(e) => setFilters({...filters, search: e.target.value})}
                            />
                        </Col>
                        <Col xs={24} sm={5}>
                            <Select 
                                style={{ width: '100%' }} 
                                placeholder={t('meetings.status')} 
                                size="large"
                                allowClear
                                value={filters.status}
                                onChange={(val) => setFilters({...filters, status: val})}
                            >
                                <Option value="SCHEDULED">{t('meetings.status_SCHEDULED')}</Option>
                                <Option value="COMPLETED">{t('meetings.status_COMPLETED')}</Option>
                                <Option value="CANCELLED">{t('meetings.status_CANCELLED')}</Option>
                            </Select>
                        </Col>
                        <Col xs={24} sm={4}>
                            <Select 
                                style={{ width: '100%' }} 
                                placeholder={isAr ? "اليوم" : "Day"} 
                                size="large"
                                allowClear
                                value={filters.day_of_week}
                                onChange={(val) => setFilters({...filters, day_of_week: val})}
                            >
                                <Option value={1}>{isAr ? 'الأحد' : 'Sunday'}</Option>
                                <Option value={2}>{isAr ? 'الاثنين' : 'Monday'}</Option>
                                <Option value={3}>{isAr ? 'الثلاثاء' : 'Tuesday'}</Option>
                                <Option value={4}>{isAr ? 'الأربعاء' : 'Wednesday'}</Option>
                                <Option value={5}>{isAr ? 'الخميس' : 'Thursday'}</Option>
                                <Option value={6}>{isAr ? 'الجمعة' : 'Friday'}</Option>
                                <Option value={7}>{isAr ? 'السبت' : 'Saturday'}</Option>
                            </Select>
                        </Col>
                        <Col xs={24} sm={5}>
                            <DatePicker 
                                picker="month" 
                                style={{ width: '100%' }} 
                                size="large"
                                placeholder={isAr ? "فلترة بالشهر" : "Filter by month"}
                                onChange={(date) => {
                                    setFilters({
                                        ...filters,
                                        month: date ? date.month() + 1 : undefined,
                                        year: date ? date.year() : undefined
                                    });
                                }}
                            />
                        </Col>
                    </Row>
                </Card>

                <Card className="glass-card">
                    <Table
                        columns={columns}
                        dataSource={meetings}
                        rowKey="id"
                        loading={loading}
                        pagination={{
                            current: page,
                            pageSize: pageSize,
                            total: total,
                            onChange: (p, s) => { setPage(p); setPageSize(s); },
                            showSizeChanger: true
                        }}
                        scroll={{ x: 'max-content' }}
                    />
                </Card>

                {/* Form Modal */}
                <Modal
                    title={editingMeeting ? t('meetings.edit') : t('meetings.add_new')}
                    open={modalVisible}
                    onCancel={() => setModalVisible(false)}
                    onOk={onSubmit}
                    width={800}
                >
                    <Form form={form} layout="vertical">
                        <Row gutter={[12, 0]}>
                            <Col xs={24} sm={8}>
                                <Form.Item name="meeting_type" label={t('meetings.meeting_type')}>
                                    <Input size="large" />
                                </Form.Item>
                            </Col>

                            <Col xs={24} sm={8}>
                                <Form.Item name="status" label={t('meetings.status')} initialValue="SCHEDULED">
                                    <Select size="large">
                                        <Option value="SCHEDULED">{t('meetings.status_SCHEDULED')}</Option>
                                        <Option value="COMPLETED">{t('meetings.status_COMPLETED')}</Option>
                                        <Option value="CANCELLED">{t('meetings.status_CANCELLED')}</Option>
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col xs={12} sm={8}>
                                <Form.Item name="meeting_date" label={t('meetings.date')} rules={[{ required: true }]}>
                                    <DatePicker style={{ width: '100%' }} size="large" format={isAr ? "dddd DD/MM/YYYY" : "dddd DD/MM/YYYY"} />
                                </Form.Item>
                            </Col>
                            <Col xs={12} sm={8}>
                                <Form.Item name="meeting_time" label={t('meetings.time')}>
                                    <DatePicker picker="time" format="HH:mm" style={{ width: '100%' }} size="large" />
                                </Form.Item>
                            </Col>
                            <Col xs={12} sm={8}>
                                <Form.Item name="duration" label={t('meetings.duration')}>
                                    <Input placeholder="e.g. 30" suffix={isAr ? 'دقيقة' : 'min'} size="large" />
                                </Form.Item>
                            </Col>
                            <Col xs={12} sm={8}>
                                <Form.Item name="fees" label={t('meetings.fees')}>
                                    <Input type="number" suffix="KD" size="large" />
                                </Form.Item>
                            </Col>
                            <Col xs={24} sm={8}>
                                <Form.Item name="related_person_type" label={t('meetings.related_person')} initialValue="player">
                                    <Select 
                                        size="large" 
                                        onChange={(val) => {
                                            form.setFieldsValue({ player_id: undefined, related_person_name: undefined });
                                        }}
                                    >
                                        <Option value="player">{t('meetings.type_player')}</Option>
                                        <Option value="coach">{t('meetings.type_coach')}</Option>
                                        <Option value="other">{t('meetings.type_other')}</Option>
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col xs={24} sm={16}>
                                <Form.Item name="player_id" hidden>
                                    <Input />
                                </Form.Item>
                                <Form.Item noStyle shouldUpdate={(prevValues, currentValues) => prevValues.related_person_type !== currentValues.related_person_type}>
                                    {({ getFieldValue, setFieldsValue }) => {
                                        const type = getFieldValue('related_person_type');
                                        const filteredPlayers = players.filter(p => {
                                            if (type === 'player') return p.role === 'PLAYER';
                                            if (type === 'coach') return p.role === 'COACH';
                                            return false;
                                        });

                                        const autoCompleteOptions = filteredPlayers.map(p => ({
                                            value: isAr ? (p.nameAr || p.name) : p.name,
                                            label: isAr ? (p.nameAr || p.name) : p.name,
                                            id: p.id
                                        }));

                                        return (
                                            <Form.Item 
                                                name="related_person_name" 
                                                label={t('meetings.related_person')}
                                                rules={[{ required: true, message: t('common.required_field') }]}
                                            >
                                                <AutoComplete 
                                                    className="w-full"
                                                    size="large"
                                                    placeholder={isAr ? "ابحث أو أدخل اسماً جديداً..." : "Search or enter a new name..."}
                                                    options={autoCompleteOptions}
                                                    onSelect={(val, option) => {
                                                        setFieldsValue({ player_id: option.id });
                                                    }}
                                                    onChange={(val) => {
                                                        const exists = filteredPlayers.find(p => (isAr ? (p.nameAr || p.name) : p.name) === val);
                                                        if (!exists) {
                                                            setFieldsValue({ player_id: undefined });
                                                        } else {
                                                            setFieldsValue({ player_id: exists.id });
                                                        }
                                                    }}
                                                    filterOption={(input, option) =>
                                                        (option?.value || '').toString().toLowerCase().includes(input.toLowerCase())
                                                    }
                                                />
                                            </Form.Item>
                                        );
                                    }}
                                </Form.Item>
                            </Col>
                        </Row>
                        <Form.Item name="location" label={t('meetings.location')}>
                            <Input size="large" />
                        </Form.Item>
                        <Form.Item name="description" label={t('meetings.description')}>
                            <Input.TextArea rows={4} />
                        </Form.Item>
                    </Form>
                </Modal>

                {/* View Modal */}
                <Modal
                    title={viewingMeeting?.meeting_type || viewingMeeting?.title}
                    open={viewModalVisible}
                    onCancel={() => setViewModalVisible(false)}
                    footer={[
                        <Button key="close" onClick={() => setViewModalVisible(false)}>{t('common.close', { defaultValue: 'Close' })}</Button>
                    ]}
                >
                    {viewingMeeting && (
                        <div>
                            <p><strong>{t('meetings.meeting_type')}:</strong> {viewingMeeting.meeting_type || '-'}</p>

                            <p><strong>{t('meetings.status')}:</strong> {getStatusTag(viewingMeeting.status)}</p>
                            <p><strong>{t('meetings.date')}:</strong> {(() => {
                                if (!viewingMeeting.meeting_date) return '-';
                                const d = dayjs(viewingMeeting.meeting_date);
                                const dayName = isAr 
                                    ? ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'][d.day()]
                                    : d.format('dddd');
                                return `${dayName} ${d.format('DD/MM/YYYY')}`;
                            })()}</p>
                            <p><strong>{t('meetings.time')}:</strong> {viewingMeeting.meeting_time ? dayjs(viewingMeeting.meeting_time, 'HH:mm').format('h:mm A') : '-'}</p>
                            <p><strong>{t('meetings.duration')}:</strong> {viewingMeeting.duration} {isAr ? 'دقيقة' : 'min'}</p>
                            <p><strong>{t('meetings.fees')}:</strong> {viewingMeeting.fees} KD</p>
                            <p><strong>{t('meetings.related_person')}:</strong> {viewingMeeting.player ? (isAr ? (viewingMeeting.player.nameAr || viewingMeeting.player.name) : viewingMeeting.player.name) : (viewingMeeting.related_person_name || '-')}</p>
                            <p><strong>{t('meetings.location')}:</strong> {viewingMeeting.location || '-'}</p>
                            <p><strong>{t('meetings.description')}:</strong> <br/>{viewingMeeting.description || '-'}</p>
                        </div>
                    )}
                </Modal>

                {/* PDF Export Modal */}
                <GenericPdfExportModal
                    open={pdfModalVisible}
                    onClose={() => setPdfModalVisible(false)}
                    rows={meetings}
                    fetchAllData={fetchAllDataForPdf}
                    fields={MEETING_PDF_FIELDS}
                    defaultFields={DEFAULT_MEETING_PDF_FIELDS}
                    groups={[{ titleKey: 'meetings', keys: DEFAULT_MEETING_PDF_FIELDS }]}
                    reportTitle={t('meetings.title')}
                    reportTitleAr="تقرير الاجتماعات"
                />
            </div>
        </ConfigProvider>
    );
};

export default Meetings;
