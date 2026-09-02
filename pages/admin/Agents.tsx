import { useEffect, useState, FC } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Table,
    Button,
    Space,
    Modal,
    Form,
    Input,
    message,
    Row,
    Col,
    Typography,
    Card,
    Avatar,
    Select,
    Tag,
    Tooltip,
    Divider,
    Grid,
    Upload,
} from 'antd';
import type { Breakpoint } from 'antd';

import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    UserOutlined,
    MailOutlined,
    PhoneOutlined,
    BankOutlined,
    SearchOutlined,
    LockOutlined,
    UploadOutlined,
    EyeOutlined,
} from '@ant-design/icons';

import type { ColumnsType } from 'antd/es/table';
import { Agent, Player } from '../../types';
import { agentService } from '../../services/agentService';
import { playerService } from '../../services/playerService';
import showConfirmModal from '../../components/ConfirmModal';
import { useAuth } from '../../context/AuthContext';
import { canAddAgents, canEditAgents, canDeleteAgents } from '../../utils/permissionHelpers';
import { translateText, normalizeArabic } from '../../utils/helpers';
import { useRef } from 'react';
import { useStickyState } from '../../utils/hooks';
import DynamicTranslate from '../../components/DynamicTranslate';

const { Title, Text } = Typography;

const isArabicText = (text?: string) => {
    if (!text) return false;
    const arabicPattern = /[\u0600-\u06FF]/;
    return arabicPattern.test(text);
};

export const Agents: FC = () => {
    const { t, i18n } = useTranslation();
    const { user } = useAuth();
    const isAr = i18n.language === 'ar';
    const [agents, setAgents] = useState<Agent[]>([]);
    const [players, setPlayers] = useState<Player[]>([]);
    const [filteredAgents, setFilteredAgents] = useState<Agent[]>([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [viewModalVisible, setViewModalVisible] = useState(false);
    const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
    const [viewingAgent, setViewingAgent] = useState<Agent | null>(null);
    const [searchText, setSearchText] = useStickyState('', 'Admin_Agents_search');
    const [total, setTotal] = useState(0);
    const [page, setPage] = useStickyState(1, 'Admin_Agents_page');
    const [pageSize, setPageSize] = useStickyState(10, 'Admin_Agents_pageSize');
    const [fileList, setFileList] = useState<any[]>([]);
    const prevSearchTextRef = useRef<string | null>(null);
    useEffect(() => {
        if (prevSearchTextRef.current === null) {
            prevSearchTextRef.current = searchText;
            return;
        }
        if (prevSearchTextRef.current !== searchText) {
            setPage(1);
            prevSearchTextRef.current = searchText;
        }
    }, [searchText]);
    const [form] = Form.useForm();
    const screens = Grid.useBreakpoint();
    const isMobile = !screens.md;
    const translateTimeouts = useRef<{ [key: string]: NodeJS.Timeout }>({});

    const handleValuesChange = (changedValues: any) => {
        const fieldsToTranslate: Record<string, string> = {
            nameAr: 'name',
            companyAr: 'company'
        };

        Object.keys(changedValues).forEach(arField => {
            const enField = fieldsToTranslate[arField];
            if (enField) {
                const value = changedValues[arField];
                if (translateTimeouts.current[arField]) {
                    clearTimeout(translateTimeouts.current[arField]);
                }
                translateTimeouts.current[arField] = setTimeout(async () => {
                    if (!value) return;
                    // Only translate if English field is empty
                    if (!form.getFieldValue(enField)) {
                        const translated = await translateText(value, 'ar', 'en');
                        form.setFieldsValue({ [enField]: translated });
                    }
                }, 800);
            }
        });
    };

    useEffect(() => {
        loadData();
    }, [page, pageSize]);

    useEffect(() => {
        const filtered = agents.filter(agent => {
            if (!agent) return false;
            return (
                (agent.name && agent.name.toLowerCase().includes(searchText.toLowerCase())) ||
                (agent.nameAr && agent.nameAr.includes(searchText)) ||
                (agent.company && agent.company.toLowerCase().includes(searchText.toLowerCase())) ||
                (agent.companyAr && agent.companyAr.includes(searchText))
            );
        });
        setFilteredAgents(filtered);
    }, [agents, searchText]);

    const loadData = async () => {
        setLoading(true);
        try {
            const params = {
                page,
                per_page: pageSize,
                search: searchText
            };
            const [{ agents: aData, total: aTotal }, { players: pData }] = await Promise.all([
                agentService.getAll(params),
                playerService.getAll(undefined, 1, 1000)
            ]);

            setAgents(aData);
            setTotal(aTotal);
            setPlayers(pData);
        } catch (error) {
            message.error(t('messages.error_load', { defaultValue: 'Failed to load data' }));
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setEditingAgent(null);
        form.resetFields();
        setFileList([]);
        setModalVisible(true);
    };

    const handleEdit = async (agent: Agent) => {
        setEditingAgent(agent);
        const data = { ...agent };
        
        // Auto-translate if English is empty and Arabic exists
        if (!data.name && data.nameAr) {
            data.name = await translateText(data.nameAr, 'ar', 'en');
        }
        if (!data.company && data.companyAr) {
            data.company = await translateText(data.companyAr, 'ar', 'en');
        }

        form.setFieldsValue(data);
        setFileList(agent.avatar ? [{
            uid: '-1',
            name: 'avatar.png',
            status: 'done',
            url: agent.avatar
        }] : []);
        setModalVisible(true);
    };

    const handleView = (agent: Agent) => {
        setViewingAgent(agent);
        setViewModalVisible(true);
    };

    const handleDelete = (agent: Agent) => {
        showConfirmModal({
            title: t('messages.confirm_delete_title'),
            content: t('admin.players.delete_player_confirm', { name: agent.name }),
            okText: t('common.delete'),
            okType: 'danger',
            onConfirm: async () => {
                try {
                    await agentService.delete(agent.id);
                    message.success(t('messages.success_delete'));
                    loadData();
                } catch (error) {
                    message.error(t('messages.error_delete'));
                }
            },
        });
    };

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();

            const formData = new FormData();
            formData.append('name', values.name);
            if (values.nameAr) formData.append('name_ar', values.nameAr);
            formData.append('email', values.email);
            if (values.phone) formData.append('phone', values.phone);
            if (values.company) formData.append('company', values.company);
            if (values.companyAr) formData.append('company_ar', values.companyAr);
            if (values.password) formData.append('password', values.password);

            if (values.assignedPlayerIds) {
                values.assignedPlayerIds.forEach((id: string) => {
                    formData.append('assigned_player_ids[]', id);
                });
            }

            if (fileList[0]?.originFileObj) {
                formData.append('avatar', fileList[0].originFileObj);
            } else if (fileList.length === 0 && editingAgent?.avatar) {
                formData.append('remove_avatar', '1');
            }

            if (editingAgent) {
                await agentService.update(editingAgent.id, formData);
                message.success(t('messages.success_update'));
            } else {
                await agentService.create(formData);
                message.success(t('messages.success_save'));
            }
            setModalVisible(false);
            loadData();
        } catch (error: any) {
            console.error('Submission error:', error);

            // Handle different types of errors
            if (error.response?.data?.message) {
                // API error with custom message
                message.error(error.response.data.message);
            } else if (error.response?.data?.errors) {
                // API validation errors
                const errors = error.response.data.errors;
                const errorMessages = Object.entries(errors)
                    .map(([field, messages]: any) => {
                        return Array.isArray(messages) ? messages[0] : messages;
                    })
                    .join(' | ');
                message.error(errorMessages || t('messages.validation_error'));
            } else if (error.message) {
                // Generic error with message
                message.error(error.message);
            } else {
                // Fallback generic message
                message.error(t('messages.validation_error'));
            }
        }
    };


    const columns: ColumnsType<Agent> = [
        {
            title: t('common.agents'),
            key: 'agent',
            sorter: (a, b) => a.name.localeCompare(b.name),
            render: (_, record) => {
                const name = isAr ? (record.nameAr || record.name) : (record.name || record.nameAr);
                return (
                    <Space size="middle">
                        <Avatar
                            src={record.avatar}
                            icon={<UserOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
                            size={48}
                            className="border-2 border-slate-100"
                        />
                        <div>
                            <div className="font-bold text-[#3F3F3F] text-base">
                                <DynamicTranslate text={name} sourceLang={isArabicText(name) ? 'ar' : 'en'} />
                            </div>
                        </div>
                    </Space>
                );
            },
        },
        {
            title: t('common.company'),
            key: 'company',
            responsive: ['md'] as Breakpoint[],
            render: (_, record) => {
                const company = isAr ? (record.companyAr || record.company) : (record.company || record.companyAr);
                return (
                    <Space className="text-slate-600">
                        <BankOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />
                        {company ? <DynamicTranslate text={company} sourceLang={isArabicText(company) ? 'ar' : 'en'} /> : t('common.independent', { defaultValue: 'Independent' })}
                    </Space>
                );
            },
        },
        {
            title: t('agents.contact_info'),
            key: 'contact',
            responsive: ['lg'] as Breakpoint[],
            render: (_, record) => (
                <Space direction="vertical" size={0}>
                    <div className="text-xs text-slate-500">
                        <MailOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} className="mr-1" />
                        {record.email}
                    </div>
                    <div className="text-xs text-slate-500">
                        <PhoneOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} className="mr-1" />
                        {record.phone}
                    </div>
                </Space>
            ),
        },
        {
            title: t('agents.assigned_players'),
            key: 'players',
            render: (_, record) => (
                <Tooltip title={record.assignedPlayerIds.length > 0 ? t('agents.manage_assignments') : t('agents.no_players')}>
                    <Tag
                        bordered={false}
                        className={`font-bold rounded-full px-3 ${record.assignedPlayerIds.length > 0 ? 'bg-[#C9A24D] text-[#3F3F3F]' : 'bg-slate-100 text-slate-500'}`}
                    >
                        {record.assignedPlayerIds.length} {t('common.players')}
                    </Tag>
                </Tooltip>
            ),
        },
        {
            title: t('common.actions'),
            key: 'actions',
            render: (_, record) => (
                <Space size="small">
                    <Button
                        type="text"
                        icon={<EyeOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
                        onClick={() => handleView(record)}
                        className="text-[#C9A24D] hover:bg-slate-100"
                    />
                    {canEditAgents(user) && (
                        <Button
                            type="text"
                            icon={<EditOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
                            onClick={() => handleEdit(record)}
                            className="text-[#3F3F3F] hover:bg-slate-100"
                        />
                    )}
                    {canDeleteAgents(user) && (
                        <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
                            onClick={() => handleDelete(record)}
                        />
                    )}
                </Space>
            ),
        },
    ];

    return (
        <div className="fade-in">
            <Row justify="space-between" align="middle" style={{ marginBottom: 24 }} gutter={[16, 16]}>
                <Col xs={24} md={12}>
                    <Title level={isMobile ? 3 : 2} style={{ margin: 0, color: '#3F3F3F' }}>{t('admin.agents.title')}</Title>
                </Col>
                <Col xs={24} md={12}>
                    <div className="flex justify-start md:justify-end">
                        {canAddAgents(user) && (
                            <Button
                                type="primary"
                                icon={<PlusOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
                                onClick={handleCreate}
                                size="large"
                                className="bg-[#3F3F3F] hover:bg-[#B68F3F] border-none shadow-md h-12 px-8 rounded-lg font-bold w-full md:w-auto"
                            >
                                {t('admin.agents.add_btn')}
                            </Button>
                        )}
                    </div>
                </Col>
            </Row>

            <Space direction="vertical" size="large" style={{ width: '100%' }}>
                {/* Filters Panel */}
                <Card className="border-none shadow-sm rounded-xl">
                    <Row gutter={16} align="middle">
                        <Col xs={24} lg={12}>
                            <Input
                                placeholder={t('agents.search_agents')}
                                prefix={<SearchOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} className="text-gray-300" />}
                                className="h-11 rounded-lg border-slate-200"
                                value={searchText}
                                onChange={e => setSearchText(e.target.value)}
                                allowClear
                            />
                        </Col>
                    </Row>
                </Card>

                {/* Agents Table */}
                <Card className="border-none shadow-sm rounded-xl overflow-hidden">
                    <Table
                        columns={columns}
                        dataSource={filteredAgents}
                        loading={loading}
                        rowKey="id"
                        scroll={{ x: 800 }}
                        pagination={{
                            current: page,
                            pageSize: pageSize,
                            total: total,
                            onChange: (p, ps) => {
                                setPage(p);
                                setPageSize(ps);
                            },
                            showSizeChanger: true,
                            showTotal: (total) => `${t('common.total')}: ${total} ${t('common.agents').toLowerCase()}`,
                        }}
                    />
                </Card>
            </Space>

            {/* Create/Edit Modal */}
            <Modal
                title={editingAgent ? t('admin.agents.edit_title') : t('admin.agents.register_title')}
                open={modalVisible}
                onOk={handleSubmit}
                onCancel={() => setModalVisible(false)}
                width={700}
                okText={t('common.save')}
                cancelText={t('common.cancel')}
                className="premium-modal"
            >
                <Form form={form} layout="vertical" className="mt-4" onValuesChange={handleValuesChange}>
                    <Row gutter={[12, 0]}>
                        <Col xs={24} sm={12}>
                            <Form.Item
                                name="nameAr"
                                label={t('admin.agents.name_ar')}
                            >
                                <Input placeholder="مثلاً: خورخي مينديز" className="h-11 rtl text-right" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                            <Form.Item
                                name="name"
                                label={t('admin.agents.name_en')}
                            >
                                <Input placeholder="e.g., Jorge Mendes" className="h-11" />
                            </Form.Item>
                        </Col>
                        <Col xs={24}>
                            <Form.Item
                                name="phone"
                                label={t('agents.phone_number')}
                            >
                                <Input prefix={<PhoneOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />} placeholder="+00 000 0000" className="h-11" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={8}>
                            <Form.Item
                                name="companyAr"
                                label={t('agents.agency_ar')}
                            >
                                <Input placeholder="مثلاً: جيستيفوت" className="h-11 rtl text-right" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={8}>
                            <Form.Item
                                name="company"
                                label={t('agents.agency_en')}
                            >
                                <Input prefix={<BankOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />} placeholder="e.g., Gestifute" className="h-11" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={8}>
                            <Form.Item
                                label={t('agents.avatar_url', { defaultValue: 'Avatar' })}
                            >
                                <Upload
                                    maxCount={1}
                                    beforeUpload={() => false}
                                    listType="picture-card"
                                    fileList={fileList}
                                    onChange={({ fileList }) => setFileList(fileList)}
                                >
                                    {fileList.length < 1 && (
                                        <div>
                                            <PlusOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />
                                            <div style={{ marginTop: 8 }}>{t('players.upload_photo', { defaultValue: 'Upload Photo' })}</div>
                                        </div>
                                    )}
                                </Upload>
                            </Form.Item>
                        </Col>
                    </Row>

                    <Divider orientation="left" style={{ margin: '8px 0 24px' }}>
                        <span className="text-slate-400 text-xs uppercase tracking_widest font-bold">{t('admin.agents.login_credentials')}</span>
                    </Divider>

                    <Row gutter={[12, 0]}>
                        <Col xs={24} sm={12}>
                            <Form.Item
                                name="email"
                                label={t('agents.login_email')}
                                rules={[
                                    { type: 'email', message: t('login.email_invalid') }
                                ]}
                            >
                                <Input prefix={<MailOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />} placeholder="agent@example.com" className="h-11" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                            <Form.Item
                                name="password"
                                label={editingAgent ? t('agents.new_password') : t('agents.password_label')}
                            >
                                <Input.Password prefix={<LockOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />} placeholder="••••••••" className="h-11" />
                            </Form.Item>
                        </Col>
                        <Col xs={24}>
                            <Form.Item
                                name="assignedPlayerIds"
                                label={<span className="font-bold text-[#3F3F3F]">{t('agents.assign_players')}</span>}
                                tooltip={t('agents.assign_hint')}
                            >
                                <Select
                                    mode="multiple"
                                    placeholder={t('common.players')}
                                    className="w-full"
                                    allowClear
                                    showSearch
                                    filterOption={(input, option) => {
                                        const normalizedInput = normalizeArabic(input).toLowerCase();
                                        const normalizedLabel = normalizeArabic(String(option?.label ?? '')).toLowerCase();
                                        return normalizedLabel.startsWith(normalizedInput);
                                    }}
                                    options={players.map(p => ({
                                        value: p.id,
                                        label: (i18n.language === 'ar' && p.nameAr ? p.nameAr : p.name) + ' - ' + t('enums.Sport.' + p.sport, { defaultValue: p.sport }),
                                    }))}
                                />
                            </Form.Item>
                        </Col>
                    </Row>
                </Form>
            </Modal>

            {/* View Modal */}
            <Modal
                title={t('agents.view_agent')}
                open={viewModalVisible}
                onCancel={() => setViewModalVisible(false)}
                footer={[
                    <Button key="close" onClick={() => setViewModalVisible(false)} type="primary" className="bg-[#3F3F3F]">
                        {t('common.close')}
                    </Button>
                ]}
                width={600}
                className="premium-modal"
            >
                {viewingAgent && (
                    <div className="py-4">
                        <div className="flex items-center space-x-4 mb-8">
                            <Avatar size={80} src={viewingAgent.avatar} icon={<UserOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />} className="border-4 border-slate-50 shadow-sm" />
                            <div className="ml-4">
                                <Title level={3} style={{ margin: 0 }}>
                                    <DynamicTranslate 
                                        text={i18n.language === 'ar' ? (viewingAgent.nameAr || viewingAgent.name) : (viewingAgent.name || viewingAgent.nameAr)} 
                                        sourceLang={isArabicText(i18n.language === 'ar' ? (viewingAgent.nameAr || viewingAgent.name) : (viewingAgent.name || viewingAgent.nameAr)) ? 'ar' : 'en'} 
                                    />
                                </Title>
                                <Text type="secondary" className="text-lg">
                                    {(() => {
                                        const company = i18n.language === 'ar' ? (viewingAgent.companyAr || viewingAgent.company) : (viewingAgent.company || viewingAgent.companyAr);
                                        return company ? <DynamicTranslate text={company} sourceLang={isArabicText(company) ? 'ar' : 'en'} /> : t('common.independent');
                                    })()}
                                </Text>
                            </div>
                        </div>

                        <Divider />

                        <Row gutter={[12, 16]}>
                            <Col xs={12} sm={12}>
                                <Space direction="vertical" size={0}>
                                    <Text type="secondary" className="text-[10px] uppercase tracking-wider font-bold">{t('common.email')}</Text>
                                    <div className="flex items-center mt-1">
                                        <MailOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} className="mr-2 text-[#C9A24D]" />
                                        <Text className="text-sm sm:text-base break-all">{viewingAgent.email}</Text>
                                    </div>
                                </Space>
                            </Col>
                            <Col xs={12} sm={12}>
                                <Space direction="vertical" size={0}>
                                    <Text type="secondary" className="text-[10px] uppercase tracking-wider font-bold">{t('common.phone')}</Text>
                                    <div className="flex items-center mt-1">
                                        <PhoneOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} className="mr-2 text-[#C9A24D]" />
                                        <Text className="text-sm sm:text-base">{viewingAgent.phone}</Text>
                                    </div>
                                </Space>
                            </Col>
                        </Row>

                        <Divider />

                        <div className="mt-4">
                            <Text type="secondary" className="text-xs uppercase tracking-wider font-bold block mb-4">{t('agents.assigned_players')}</Text>
                            <div className="flex flex-wrap gap-2">
                                {viewingAgent.assignedPlayerIds.length > 0 ? (
                                    viewingAgent.assignedPlayerIds.map(playerId => {
                                        const player = players.find(p => p.id === playerId);
                                        return (
                                            <Tag key={playerId} color="gold" className="rounded-full px-4 py-1 text-sm border-none bg-gold-50 text-[#3F3F3F]">
                                                {player ? (
                                                    <DynamicTranslate 
                                                        text={i18n.language === 'ar' ? (player.nameAr || player.name) : (player.name || player.nameAr)} 
                                                        sourceLang={isArabicText(i18n.language === 'ar' ? (player.nameAr || player.name) : (player.name || player.nameAr)) ? 'ar' : 'en'} 
                                                    />
                                                ) : playerId}
                                            </Tag>
                                        );
                                    })
                                ) : (
                                    <Text className="text-slate-400 italic">{t('agents.no_players')}</Text>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};
