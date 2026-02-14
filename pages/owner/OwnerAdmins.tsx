import React, { useEffect, useState } from 'react';
import { Card, Button, Space, Modal, Form, Input, InputNumber, Switch, message, Typography, Tooltip, Row, Col, Tag, Avatar, List, Divider, Select, Spin } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, SearchOutlined, UserOutlined } from '@ant-design/icons';
import { Admin, AdminPermissions } from '../../types';
import { mockAdminApi } from '../../services/mockOwnerApi';
import { useTranslation } from 'react-i18next';

const { Title, Text } = Typography;
const { Option } = Select;

export const OwnerAdmins: React.FC = () => {
    const { t } = useTranslation();
    const [admins, setAdmins] = useState<Admin[]>([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);
    const [form] = Form.useForm();

    useEffect(() => {
        loadAdmins();
    }, []);

    const loadAdmins = async () => {
        setLoading(true);
        try {
            const data = await mockAdminApi.getAll();
            setAdmins(data);
        } catch (error) {
            message.error(t('owner.admins.load_failed'));
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setEditingAdmin(null);
        form.resetFields();
        form.setFieldsValue({
            permissions: {
                canAddPlayers: false,
                canEditPlayers: false,
                canDeletePlayers: false,
                canAddAgents: false,
                canEditAgents: false,
                canDeleteAgents: false,
                canViewReports: false,
                canViewFinancials: false,
            },
            isActive: true,
        });
        setModalVisible(true);
    };

    const handleEdit = (admin: Admin) => {
        setEditingAdmin(admin);
        form.setFieldsValue(admin);
        setModalVisible(true);
    };

    const handleDelete = (admin: Admin) => {
        Modal.confirm({
            title: t('owner.admins.delete_admin_title'),
            content: t('owner.admins.delete_admin_confirm', { name: admin.name }),
            okText: t('common.delete'),
            okType: 'danger',
            onOk: async () => {
                try {
                    await mockAdminApi.delete(admin.id);
                    message.success(t('owner.admins.delete_success'));
                    loadAdmins();
                } catch (error) {
                    message.error(t('owner.admins.delete_failed'));
                }
            },
        });
    };

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();

            if (editingAdmin) {
                await mockAdminApi.update(editingAdmin.id, values);
                message.success(t('owner.admins.updated_success'));
            } else {
                await mockAdminApi.create(values);
                message.success(t('owner.admins.created_success'));
            }

            setModalVisible(false);
            loadAdmins();
        } catch (error) {
            message.error(t('owner.admins.save_failed'));
        }
    };

    const PermissionTag: React.FC<{ label: string; value: boolean }> = ({ label, value }) => (
        <Tag color={value ? 'green' : 'default'}>
            {label}: {value ? '✓' : '✗'}
        </Tag>
    );

    return (
        <div className="fade-in">
            <div style={{ marginBottom: 24 }}>
                <Title level={2}>{t('owner.admins.title')}</Title>
                <Text type="secondary">{t('owner.admins.subtitle')}</Text>
            </div>

            <Space direction="vertical" size="large" style={{ width: '100%' }}>
                {/* Header Actions */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <Text strong style={{ color: '#666' }}>
                            {t('owner.admins.total_admins', { count: admins.length })}
                        </Text>
                    </div>
                    <Button
                        type="primary"
                        icon={<PlusOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
                        onClick={handleCreate}
                        style={{ background: '#3F3F3F' }}
                    >
                        {t('owner.admins.add_admin')}
                    </Button>
                </div>

                {/* Admins List */}
                <Spin spinning={loading}>
                    <List
                        dataSource={admins}
                        pagination={{
                            pageSize: 8,
                            showTotal: (total) => `${t('common.total')}: ${total}`,
                            position: 'bottom',
                            align: 'center',
                        }}
                        renderItem={(admin) => (
                            <Card className="mb-4 hover:shadow-md transition-all border-slate-100 group" style={{ marginBottom: 16 }}>
                                <Row align="middle" gutter={24}>
                                    {/* Profile Section */}
                                    <Col xs={24} sm={8} lg={6}>
                                        <Space size="middle">
                                            <Avatar
                                                size={64}
                                                src={admin.avatar}
                                                icon={<UserOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
                                                className="border-2 border-slate-100 shadow-sm"
                                            />
                                            <Space direction="vertical" size={0}>
                                                <Typography.Text className="text-lg font-black text-[#3F3F3F] uppercase tracking-tight leading-none">
                                                    {admin.name}
                                                </Typography.Text>
                                                <Typography.Text className="text-gray-400 font-medium">
                                                    {admin.email}
                                                </Typography.Text>
                                            </Space>
                                        </Space>
                                    </Col>

                                    {/* Permissions Section */}
                                    <Col xs={24} sm={12} lg={14}>
                                        <div style={{ marginBottom: 8 }}>
                                            <Text strong className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-2">
                                                {t('owner.admins.permissions')}
                                            </Text>
                                        </div>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                            <PermissionTag label={t('owner.admins.add_players')} value={admin.permissions.canAddPlayers} />
                                            <PermissionTag label={t('owner.admins.edit_players')} value={admin.permissions.canEditPlayers} />
                                            <PermissionTag label={t('owner.admins.delete_players')} value={admin.permissions.canDeletePlayers} />
                                            <PermissionTag label={t('owner.admins.add_agents')} value={admin.permissions.canAddAgents} />
                                            <PermissionTag label={t('owner.admins.edit_agents')} value={admin.permissions.canEditAgents} />
                                            <PermissionTag label={t('owner.admins.delete_agents')} value={admin.permissions.canDeleteAgents} />
                                            <PermissionTag label={t('owner.admins.view_reports')} value={admin.permissions.canViewReports} />
                                            <PermissionTag label={t('owner.admins.view_financials')} value={admin.permissions.canViewFinancials} />
                                        </div>
                                    </Col>

                                    {/* Actions Section */}
                                    <Col xs={24} lg={4} className="flex justify-end">
                                        <Space size="middle">
                                            <Tooltip title={t('owner.admins.edit_admin')}>
                                                <Button
                                                    shape="circle"
                                                    icon={<EditOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
                                                    onClick={() => handleEdit(admin)}
                                                    className="flex items-center justify-center text-slate-400 hover:text-gold-600 hover:border-gold-600"
                                                />
                                            </Tooltip>
                                            <Tooltip title={t('owner.admins.delete_admin')}>
                                                <Button
                                                    shape="circle"
                                                    danger
                                                    icon={<DeleteOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
                                                    onClick={() => handleDelete(admin)}
                                                    className="flex items-center justify-center opacity-40 hover:opacity-100"
                                                />
                                            </Tooltip>
                                        </Space>
                                    </Col>
                                </Row>
                            </Card>
                        )}
                    />
                </Spin>

                {/* Admin Management Modal */}
                <Modal
                    title={editingAdmin ? t('owner.admins.edit_admin_title') : t('owner.admins.add_admin_title')}
                    open={modalVisible}
                    onOk={handleSubmit}
                    onCancel={() => setModalVisible(false)}
                    width={700}
                    okText={t('common.save')}
                    cancelText={t('common.cancel')}
                >
                    <Form form={form} layout="vertical">
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item
                                            name="name"
                                            label={t('common.name')}
                                            rules={editingAdmin ? [{ required: true }] : undefined}
                                        >
                                            <Input placeholder={t('owner.admins.name_placeholder')} />
                                        </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    name="email"
                                    label={t('common.email')}
                                    rules={editingAdmin ? [{ required: true, type: 'email' }] : [{ type: 'email' }]}
                                >
                                    <Input placeholder={t('owner.admins.email_placeholder')} />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item
                                    name="phone"
                                    label={t('common.phone_number')}
                                >
                                    <Input placeholder={t('owner.admins.phone_placeholder')} />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    name="password"
                                    label={t('common.password')}
                                    rules={editingAdmin ? [{ required: true, min: 4 }] : [{ min: 4 }]}
                                >
                                    <Input.Password placeholder={t('owner.admins.password_placeholder')} />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Divider />

                        <Title level={5} style={{ marginTop: 0 }}>{t('owner.admins.permissions_title')}</Title>

                        <Row gutter={[16, 16]}>
                            <Col span={12}>
                                <Form.Item
                                    name={['permissions', 'canAddPlayers']}
                                    valuePropName="checked"
                                >
                                    <Switch checkedChildren={t('common.yes')} unCheckedChildren={t('common.no')} />
                                    <span style={{ marginLeft: 8 }}>{t('owner.admins.add_players')}</span>
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    name={['permissions', 'canEditPlayers']}
                                    valuePropName="checked"
                                >
                                    <Switch checkedChildren={t('common.yes')} unCheckedChildren={t('common.no')} />
                                    <span style={{ marginLeft: 8 }}>{t('owner.admins.edit_players')}</span>
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    name={['permissions', 'canDeletePlayers']}
                                    valuePropName="checked"
                                >
                                    <Switch checkedChildren={t('common.yes')} unCheckedChildren={t('common.no')} />
                                    <span style={{ marginLeft: 8 }}>{t('owner.admins.delete_players')}</span>
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    name={['permissions', 'canAddAgents']}
                                    valuePropName="checked"
                                >
                                    <Switch checkedChildren={t('common.yes')} unCheckedChildren={t('common.no')} />
                                    <span style={{ marginLeft: 8 }}>{t('owner.admins.add_agents')}</span>
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    name={['permissions', 'canEditAgents']}
                                    valuePropName="checked"
                                >
                                    <Switch checkedChildren={t('common.yes')} unCheckedChildren={t('common.no')} />
                                    <span style={{ marginLeft: 8 }}>{t('owner.admins.edit_agents')}</span>
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    name={['permissions', 'canDeleteAgents']}
                                    valuePropName="checked"
                                >
                                    <Switch checkedChildren={t('common.yes')} unCheckedChildren={t('common.no')} />
                                    <span style={{ marginLeft: 8 }}>{t('owner.admins.delete_agents')}</span>
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    name={['permissions', 'canViewReports']}
                                    valuePropName="checked"
                                >
                                    <Switch checkedChildren={t('common.yes')} unCheckedChildren={t('common.no')} />
                                    <span style={{ marginLeft: 8 }}>{t('owner.admins.view_reports')}</span>
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    name={['permissions', 'canViewFinancials']}
                                    valuePropName="checked"
                                >
                                    <Switch checkedChildren={t('common.yes')} unCheckedChildren={t('common.no')} />
                                    <span style={{ marginLeft: 8 }}>{t('owner.admins.view_financials')}</span>
                                </Form.Item>
                            </Col>
                        </Row>

                        <Form.Item
                            name="isActive"
                            label={t('owner.admins.status')}
                            valuePropName="checked"
                        >
                            <Switch checkedChildren={t('common.active')} unCheckedChildren={t('common.inactive')} />
                        </Form.Item>
                    </Form>
                </Modal>
            </Space>
        </div>
    );
};