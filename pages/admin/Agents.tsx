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
} from 'antd';
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    UserOutlined,
    MailOutlined,
    PhoneOutlined,
    BankOutlined,
    SearchOutlined,
    LockOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { Agent, Player } from '../../types';
import { mockAgentApi, mockPlayerApi } from '../../services/mockApi';
import showConfirmModal from '../../components/ConfirmModal';

const { Title, Text } = Typography;

export const Agents: FC = () => {
    const { t, i18n } = useTranslation();
    const [agents, setAgents] = useState<Agent[]>([]);
    const [players, setPlayers] = useState<Player[]>([]);
    const [filteredAgents, setFilteredAgents] = useState<Agent[]>([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
    const [searchText, setSearchText] = useState('');
    const [form] = Form.useForm();
    const screens = Grid.useBreakpoint();
    const isMobile = !screens.md;

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        const filtered = agents.filter(agent =>
            agent.name.toLowerCase().includes(searchText.toLowerCase()) ||
            (agent.nameAr && agent.nameAr.includes(searchText)) ||
            (agent.company && agent.company.toLowerCase().includes(searchText.toLowerCase())) ||
            (agent.companyAr && agent.companyAr.includes(searchText))
        );
        setFilteredAgents(filtered);
    }, [agents, searchText]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [agentsData, playersData] = await Promise.all([
                mockAgentApi.getAll(),
                mockPlayerApi.getAll()
            ]);
            setAgents(agentsData);
            setPlayers(playersData);
        } catch (error) {
            message.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setEditingAgent(null);
        form.resetFields();
        setModalVisible(true);
    };

    const handleEdit = (agent: Agent) => {
        setEditingAgent(agent);
        form.setFieldsValue({
            ...agent,
        });
        setModalVisible(true);
    };

    const handleDelete = (agent: Agent) => {
        showConfirmModal({
            title: t('common.delete') + ' ' + t('common.agents'),
            content: t('players.delete_player_confirm', { defaultValue: `Are you sure you want to delete ${agent.name}? This action cannot be undone.`, name: agent.name }),
            okText: t('common.delete'),
            okType: 'danger',
            onConfirm: async () => {
                try {
                    await mockAgentApi.delete(agent.id);
                    message.success('Agent deleted successfully');
                    loadData();
                } catch (error) {
                    message.error('Failed to delete agent');
                }
            },
        });
    };

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            if (editingAgent) {
                await mockAgentApi.update(editingAgent.id, values);
                message.success('Agent updated successfully');
            } else {
                await mockAgentApi.create(values);
                message.success('Agent created successfully');
            }
            setModalVisible(false);
            loadData();
        } catch (error) {
            message.error('Please fix the errors in the form');
        }
    };

    const columns: ColumnsType<Agent> = [
        {
            title: t('common.agents'),
            key: 'agent',
            sorter: (a, b) => a.name.localeCompare(b.name),
            render: (_, record) => (
                <Space size="middle">
                    <Avatar
                        src={record.avatar}
                        icon={<UserOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
                        size={48}
                        className="border-2 border-slate-100"
                    />
                    <div>
                        <div className="font-bold text-[#01153e] text-base">
                            {i18n.language === 'ar' && record.nameAr ? record.nameAr : record.name}
                        </div>
                        {i18n.language !== 'ar' && record.nameAr && <div className="text-slate-400 text-sm mt-[-4px]">{record.nameAr}</div>}
                    </div>
                </Space>
            ),
        },
        {
            title: t('common.company'),
            dataIndex: 'company',
            key: 'company',
            render: (_, record) => (
                <Space className="text-slate-600">
                    <BankOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />
                    {(i18n.language === 'ar' && record.companyAr ? record.companyAr : record.company) || t('common.independent', { defaultValue: 'Independent' })}
                </Space>
            ),
        },
        {
            title: t('agents.contact_info'),
            key: 'contact',
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
                    <Tag color={record.assignedPlayerIds.length > 0 ? 'blue' : 'default'} className="font-bold rounded-full px-3">
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
                        icon={<EditOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
                        onClick={() => handleEdit(record)}
                        className="text-navy-500 hover:bg-slate-100"
                    />
                    <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
                        onClick={() => handleDelete(record)}
                    />
                </Space>
            ),
        },
    ];

    return (
        <div className="fade-in">
            <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
                <Col xs={24} md={12}>
                    <Title level={isMobile ? 3 : 2} style={{ margin: 0, color: '#01153e' }}>{t('admin.agents.title')}</Title>
                </Col>
                <Col xs={24} md={12} className="text-left md:text-right mt-4 md:mt-0">
                    <Button
                        type="primary"
                        icon={<PlusOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
                        onClick={handleCreate}
                        size="large"
                        className="bg-[#01153e] hover:bg-[#022569] border-none shadow-md h-12 px-8 rounded-lg font-bold"
                    >
                        {t('admin.agents.add_btn')}
                    </Button>
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
                            pageSize: 10,
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
                <Form form={form} layout="vertical" className="mt-4">
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name="name"
                                label={t('admin.agents.name_en')}
                                rules={[{ required: true, message: t('login.name_required', { defaultValue: 'Name is required' }) }]}
                            >
                                <Input placeholder="e.g., Jorge Mendes" className="h-11" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="nameAr"
                                label={t('admin.agents.name_ar')}
                            >
                                <Input placeholder="مثلاً: خورخي مينديز" className="h-11 rtl text-right" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={24}>
                            <Form.Item
                                name="phone"
                                label={t('agents.phone_number')}
                                rules={[{ required: true, message: t('login.phone_required', { defaultValue: 'Phone number is required' }) }]}
                            >
                                <Input prefix={<PhoneOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />} placeholder="+00 000 0000" className="h-11" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item
                                name="company"
                                label={t('agents.agency_en')}
                            >
                                <Input prefix={<BankOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />} placeholder="e.g., Gestifute" className="h-11" />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item
                                name="companyAr"
                                label={t('agents.agency_ar')}
                            >
                                <Input placeholder="مثلاً: جيستيفوت" className="h-11 rtl text-right" />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item
                                name="avatar"
                                label={t('agents.avatar_url')}
                            >
                                <Input prefix={<UserOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />} placeholder="https://..." className="h-11" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Divider orientation="left" style={{ margin: '8px 0 24px' }}>
                        <span className="text-slate-400 text-xs uppercase tracking_widest font-bold">{t('admin.agents.login_credentials')}</span>
                    </Divider>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name="email"
                                label={t('agents.login_email')}
                                rules={[
                                    { required: true, message: t('login.email_required') },
                                    { type: 'email', message: t('login.email_invalid') }
                                ]}
                            >
                                <Input prefix={<MailOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />} placeholder="agent@example.com" className="h-11" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="password"
                                label={editingAgent ? t('agents.new_password') : t('agents.password_label')}
                                rules={[{ required: !editingAgent, message: t('login.password_required') }]}
                            >
                                <Input.Password prefix={<LockOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />} placeholder="••••••••" className="h-11" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item
                        name="assignedPlayerIds"
                        label={<span className="font-bold text-[#01153e]">{t('agents.assign_players')}</span>}
                        tooltip={t('agents.assign_hint')}
                    >
                        <Select
                            mode="multiple"
                            placeholder={t('common.players')}
                            className="w-full"
                            allowClear
                            showSearch
                            filterOption={(input, option) =>
                                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                            }
                            options={players.map(p => ({
                                value: p.id,
                                label: `${i18n.language === 'ar' && p.nameAr ? p.nameAr : p.name} ${i18n.language !== 'ar' && p.nameAr ? `(${p.nameAr})` : ''} - ${i18n.language === 'ar' && p.clubAr ? p.clubAr : p.club}`,
                            }))}
                        />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};
