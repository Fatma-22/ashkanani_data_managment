import React, { useEffect, useState, useRef } from 'react';
import { Card, Button, Space, Modal, Form, Input, InputNumber, Switch, message, Typography, Tooltip, Row, Col, Tag, Avatar, List, Divider, Select, Spin } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, SearchOutlined, UserOutlined } from '@ant-design/icons';
import { Admin, AdminPermissions } from '../../types';
import { ownerService } from '../../services/ownerService';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';

const { Title, Text } = Typography;
const { Option } = Select;

import DynamicTranslate from '../../components/DynamicTranslate';
import { useStickyState } from '../../utils/hooks';

const isArabicText = (text?: string) => {
    if (!text) return false;
    const arabicPattern = /[\u0600-\u06FF]/;
    return arabicPattern.test(text);
};

export const OwnerAdmins: React.FC = () => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [admins, setAdmins] = useState<Admin[]>([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);
    const [page, setPage] = useStickyState(1, 'Owner_Admins_page');
    const [pageSize, setPageSize] = useStickyState(8, 'Owner_Admins_pageSize');
    const [form] = Form.useForm();
    const isFirstRender = useRef(true);

    useEffect(() => {
        loadAdmins();
    }, []);

    const normalizeAdmin = (admin: any) => {
        // Ensure permissions is always an object with all keys
        const basePermissions = {
            canAddPlayers: false,
            canEditPlayers: false,
            canDeletePlayers: false,
            canAddAgents: false,
            canEditAgents: false,
            canDeleteAgents: false,
            canViewReports: false,
            canViewFinancials: false,
            canAddDeals: false,
            canEditDeals: false,
            canDeleteDeals: false,
            canManageNews: false,
            canManageLanding: false,
            canManageCVRequests: false,
            canManageMeetings: false,
            canManageMembers: false,
            canManageSponsors: false,
            canManageNutrition: false,
            canManageFederations: false,
            canManageClubs: false,
            canManageScouts: false,
        };

        const normalizedAdmin = {
            ...admin,
            id: admin.id || admin.user_id,
            isActive: !!(admin.is_active ?? admin.isActive ?? true),
            permissions: {
                ...basePermissions,
                ...(typeof admin.permissions === 'object' ? admin.permissions : {})
            },
            isScout: !!(admin.is_scout ?? admin.isScout ?? false),
            scoutedPlayersCount: admin.scouted_players_count ?? admin.scoutedPlayersCount ?? 0
        };

        return normalizedAdmin;
    };

    const loadAdmins = async () => {
        setLoading(true);
        try {
            const data = await ownerService.getAdmins();

            const normalized = Array.isArray(data)
                ? data.map(normalizeAdmin)
                : [normalizeAdmin(data)];

            setAdmins(normalized);
        } catch (error) {
            message.error(t('messages.error_load', { defaultValue: 'Failed to load data' }));
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setEditingAdmin(null);
        form.resetFields();

        // Set initial values for new admin with flat field names
        setTimeout(() => {
            form.setFieldsValue({
                permissions_canAddPlayers: false,
                permissions_canEditPlayers: false,
                permissions_canDeletePlayers: false,
                permissions_canAddAgents: false,
                permissions_canEditAgents: false,
                permissions_canDeleteAgents: false,
                permissions_canViewReports: false,
                permissions_canViewFinancials: false,
                permissions_canAddDeals: false,
                permissions_canEditDeals: false,
                permissions_canDeleteDeals: false,
                permissions_canManageNews: false,
                permissions_canManageLanding: false,
                permissions_canManageCVRequests: false,
                permissions_canManageMeetings: false,
                permissions_canManageMembers: false,
                permissions_canManageSponsors: false,
                permissions_canManageNutrition: false,
                permissions_canManageFederations: false,
                permissions_canManageClubs: false,
                permissions_canManageScouts: false,
                isActive: true,
                isScout: false,
            });
        }, 50);

        setModalVisible(true);
    };

    const handleEditFieldsChange = (changedFields: any, allFields: any) => {
        // Log changes only if needed for dev
    };

    const handleEdit = (admin: Admin) => {
        setEditingAdmin(admin);

        // Reset form first to clear previous values
        form.resetFields();

        // Wait for form reset then set values
        setTimeout(() => {
            // Ensure ALL permission values are proper booleans
            const permissions: any = {
                canAddPlayers: !!admin.permissions?.canAddPlayers,
                canEditPlayers: !!admin.permissions?.canEditPlayers,
                canDeletePlayers: !!admin.permissions?.canDeletePlayers,
                canAddAgents: !!admin.permissions?.canAddAgents,
                canEditAgents: !!admin.permissions?.canEditAgents,
                canDeleteAgents: !!admin.permissions?.canDeleteAgents,
                canViewReports: !!admin.permissions?.canViewReports,
                canViewFinancials: !!admin.permissions?.canViewFinancials,
                canAddDeals: !!admin.permissions?.canAddDeals,
                canEditDeals: !!admin.permissions?.canEditDeals,
                canDeleteDeals: !!admin.permissions?.canDeleteDeals,
                canManageNews: !!admin.permissions?.canManageNews,
                canManageLanding: !!admin.permissions?.canManageLanding,
                canManageCVRequests: !!admin.permissions?.canManageCVRequests,
                canManageMeetings: !!admin.permissions?.canManageMeetings,
                canManageMembers: !!admin.permissions?.canManageMembers,
                canManageSponsors: !!admin.permissions?.canManageSponsors,
                canManageNutrition: !!admin.permissions?.canManageNutrition,
                canManageFederations: !!admin.permissions?.canManageFederations,
                canManageClubs: !!admin.permissions?.canManageClubs,
                canManageScouts: !!admin.permissions?.canManageScouts,
            };

            // Set each permission field individually
            const fieldValues: any = {
                name: admin.name,
                email: admin.email,
                phone: admin.phone || '',
                isActive: admin.isActive,
                isScout: admin.isScout,
            };

            // Add each permission separately to ensure they're set
            Object.keys(permissions).forEach(key => {
                fieldValues[`permissions_${key}`] = permissions[key];
            });

            form.setFieldsValue(fieldValues);
        }, 50);

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
                    await ownerService.deleteAdmin(admin.id);
                    message.success(t('messages.success_delete'));
                    loadAdmins();
                } catch (error) {
                    message.error(t('messages.error_delete'));
                }
            },
        });
    };

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();

            // Convert flat permission fields back to nested object
            const permissions = {
                canAddPlayers: values.permissions_canAddPlayers || false,
                canEditPlayers: values.permissions_canEditPlayers || false,
                canDeletePlayers: values.permissions_canDeletePlayers || false,
                canAddAgents: values.permissions_canAddAgents || false,
                canEditAgents: values.permissions_canEditAgents || false,
                canDeleteAgents: values.permissions_canDeleteAgents || false,
                canViewReports: values.permissions_canViewReports || false,
                canViewFinancials: values.permissions_canViewFinancials || false,
                canAddDeals: values.permissions_canAddDeals || false,
                canEditDeals: values.permissions_canEditDeals || false,
                canDeleteDeals: values.permissions_canDeleteDeals || false,
                canManageNews: values.permissions_canManageNews || false,
                canManageLanding: values.permissions_canManageLanding || false,
                canManageCVRequests: values.permissions_canManageCVRequests || false,
                canManageMeetings: values.permissions_canManageMeetings || false,
                canManageMembers: values.permissions_canManageMembers || false,
                canManageSponsors: values.permissions_canManageSponsors || false,
                canManageNutrition: values.permissions_canManageNutrition || false,
                canManageFederations: values.permissions_canManageFederations || false,
                canManageClubs: values.permissions_canManageClubs || false,
                canManageScouts: values.permissions_canManageScouts || false,
            };

            // Ensure permissions is properly structured
            let submitData: any = {
                name: values.name,
                email: values.email,
                phone: values.phone || null,
                is_active: values.isActive !== undefined ? values.isActive : true,
                is_scout: values.isScout !== undefined ? values.isScout : false,
                permissions: permissions
            };

            // Only include password if it's provided (not empty string)
            if (values.password && values.password.trim()) {
                submitData.password = values.password;
            }

            if (editingAdmin) {
                // Update existing admin
                await ownerService.updateAdmin(editingAdmin.id, submitData);
                message.success(t('messages.success_update'));
            } else {
                // Create new admin
                await ownerService.createAdmin(submitData);
                message.success(t('messages.success_save'));
            }

            // Close modal and reset form
            setModalVisible(false);
            setEditingAdmin(null);
            form.resetFields();

            // Reload admins list
            await loadAdmins();
        } catch (error: any) {
            console.error('Submission error:', error);
            const errorMessage = error?.response?.data?.message || error?.message || 'Unknown error';
            message.error(t('messages.error_save') + ': ' + errorMessage);
        }
    };

    const handleSelectAllPermissions = (value: boolean) => {
        const permissionKeys = [
            'canAddPlayers', 'canEditPlayers', 'canDeletePlayers',
            'canAddAgents', 'canEditAgents', 'canDeleteAgents',
            'canViewReports', 'canViewFinancials', 'canAddDeals', 'canEditDeals', 'canDeleteDeals',
            'canManageNews', 'canManageLanding', 'canManageCVRequests',
            'canManageMeetings', 'canManageMembers', 'canManageSponsors',
            'canManageNutrition', 'canManageFederations', 'canManageClubs',
            'canManageScouts'
        ];
        const newValues: any = {};
        permissionKeys.forEach(key => {
            newValues[`permissions_${key}`] = value;
        });
        form.setFieldsValue(newValues);
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
                            current: page,
                            pageSize: pageSize,
                            onChange: (p, ps) => {
                                setPage(p);
                                setPageSize(ps);
                            },
                            showTotal: (total) => `${t('common.total')}: ${total}`,
                            position: 'bottom',
                            align: 'center',
                            showSizeChanger: true,
                        }}
                        renderItem={(admin) => (
                            <Card className="mb-4 hover:shadow-md transition-all border-slate-100 group" style={{ marginBottom: 16 }}>
                                <Row align="middle" gutter={24}>
                                    {/* Profile Section */}
                                    <Col xs={24} sm={8} lg={6} className="mb-4 sm:mb-0">
                                        <Space size="middle">
                                            <Avatar
                                                size={64}
                                                src={admin.avatar}
                                                icon={<UserOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
                                                className="border-2 border-slate-100 shadow-sm"
                                            />
                                            <Space direction="vertical" size={0}>
                                                <Typography.Text className="text-lg font-black text-[#3F3F3F] uppercase tracking-tight leading-none">
                                                    <DynamicTranslate text={admin.name} sourceLang={isArabicText(admin.name) ? 'ar' : 'en'} />
                                                </Typography.Text>
                                                <Typography.Text className="text-gray-400 font-medium">
                                                    {admin.email}
                                                </Typography.Text>
                                                {admin.phone && (
                                                    <Typography.Text className="text-gray-400 font-medium text-xs">
                                                        {admin.phone}
                                                    </Typography.Text>
                                                )}
                                                {admin.isScout && (
                                                    <Tag color="gold" className="mt-1 w-fit rounded-full px-3 text-[10px] font-bold border-none uppercase tracking-wider">
                                                        {t('scouts.scout')}
                                                    </Tag>
                                                )}
                                            </Space>
                                        </Space>
                                    </Col>

                                    {/* Permissions Section */}
                                    <Col xs={24} sm={12} lg={14} className="mb-4 sm:mb-0">
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
                <PermissionTag label={t('owner.admins.add_deals')} value={admin.permissions.canAddDeals} />
                <PermissionTag label={t('owner.admins.edit_deals')} value={admin.permissions.canEditDeals} />
                <PermissionTag label={t('owner.admins.delete_deals')} value={admin.permissions.canDeleteDeals} />
                                            <PermissionTag label={t('common.news_management')} value={admin.permissions.canManageNews} />
                                            <PermissionTag label={t('common.landing_management')} value={admin.permissions.canManageLanding} />
                                            <PermissionTag label={t('players.cv_requests')} value={admin.permissions.canManageCVRequests} />
                                            <PermissionTag label={t('meetings.title')} value={admin.permissions.canManageMeetings} />
                                            <PermissionTag label={t('owner.admins.manage_members')} value={admin.permissions.canManageMembers} />
                                            <PermissionTag label={t('owner.admins.manage_nutrition')} value={admin.permissions.canManageNutrition} />
                                            <PermissionTag label={t('owner.admins.manage_federations')} value={admin.permissions.canManageFederations} />
                                            <PermissionTag label={t('owner.admins.manage_clubs')} value={admin.permissions.canManageClubs} />
                                            <PermissionTag label={t('owner.admins.manage_scouts')} value={admin.permissions.canManageScouts} />
                                        </div>
                                    </Col>

                                    {/* Actions Section */}
                                    <Col xs={24} lg={4} className="flex justify-start lg:justify-end mt-4 lg:mt-0">
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
                    onCancel={() => {
                        setModalVisible(false);
                        setEditingAdmin(null);
                        form.resetFields();
                    }}
                    width={700}
                    okText={t('common.save')}
                    cancelText={t('common.cancel')}
                >
                    <Form
                        form={form}
                        layout="vertical"
                        onFieldsChange={handleEditFieldsChange}
                    >
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item
                                    name="name"
                                    label={t('common.name')}
                                >
                                    <Input placeholder={t('owner.admins.name_placeholder')} autoComplete="off" />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    name="email"
                                    label={t('common.email')}
                                >
                                    <Input placeholder={t('owner.admins.email_placeholder')} autoComplete="off" />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item
                                    name="phone"
                                    label={t('common.phone_number')}
                                >
                                    <Input placeholder={t('owner.admins.phone_placeholder')} autoComplete="off" />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    name="password"
                                    label={t('common.password')}
                                >
                                    <Input.Password placeholder={editingAdmin ? t('owner.admins.leave_empty_to_keep', { defaultValue: 'Leave empty to keep current' }) : t('owner.admins.password_placeholder')} autoComplete="new-password" />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Divider />

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <Title level={5} style={{ margin: 0 }}>{t('owner.admins.permissions_title')}</Title>
                            <Space>
                                <Button size="small" onClick={() => handleSelectAllPermissions(true)} style={{ fontSize: '12px' }}>
                                    {t('owner.admins.select_all')}
                                </Button>
                                <Button size="small" onClick={() => handleSelectAllPermissions(false)} style={{ fontSize: '12px' }}>
                                    {t('owner.admins.deselect_all')}
                                </Button>
                            </Space>
                        </div>

                        <Row gutter={[16, 16]}>
                            <Col span={12}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Form.Item
                                        name="permissions_canAddPlayers"
                                        valuePropName="checked"
                                        style={{ margin: 0 }}
                                    >
                                        <Switch checkedChildren={t('common.yes')} unCheckedChildren={t('common.no')} />
                                    </Form.Item>
                                    <span>{t('owner.admins.add_players')}</span>
                                </div>
                            </Col>
                            <Col span={12}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Form.Item
                                        name="permissions_canEditPlayers"
                                        valuePropName="checked"
                                        style={{ margin: 0 }}
                                    >
                                        <Switch checkedChildren={t('common.yes')} unCheckedChildren={t('common.no')} />
                                    </Form.Item>
                                    <span>{t('owner.admins.edit_players')}</span>
                                </div>
                            </Col>
                            <Col span={12}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Form.Item
                                        name="permissions_canDeletePlayers"
                                        valuePropName="checked"
                                        style={{ margin: 0 }}
                                    >
                                        <Switch checkedChildren={t('common.yes')} unCheckedChildren={t('common.no')} />
                                    </Form.Item>
                                    <span>{t('owner.admins.delete_players')}</span>
                                </div>
                            </Col>
                            <Col span={12}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Form.Item
                                        name="permissions_canAddAgents"
                                        valuePropName="checked"
                                        style={{ margin: 0 }}
                                    >
                                        <Switch checkedChildren={t('common.yes')} unCheckedChildren={t('common.no')} />
                                    </Form.Item>
                                    <span>{t('owner.admins.add_agents')}</span>
                                </div>
                            </Col>
                            <Col span={12}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Form.Item
                                        name="permissions_canEditAgents"
                                        valuePropName="checked"
                                        style={{ margin: 0 }}
                                    >
                                        <Switch checkedChildren={t('common.yes')} unCheckedChildren={t('common.no')} />
                                    </Form.Item>
                                    <span>{t('owner.admins.edit_agents')}</span>
                                </div>
                            </Col>
                            <Col span={12}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Form.Item
                                        name="permissions_canDeleteAgents"
                                        valuePropName="checked"
                                        style={{ margin: 0 }}
                                    >
                                        <Switch checkedChildren={t('common.yes')} unCheckedChildren={t('common.no')} />
                                    </Form.Item>
                                    <span>{t('owner.admins.delete_agents')}</span>
                                </div>
                            </Col>
                            <Col span={12}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Form.Item
                                        name="permissions_canViewReports"
                                        valuePropName="checked"
                                        style={{ margin: 0 }}
                                    >
                                        <Switch checkedChildren={t('common.yes')} unCheckedChildren={t('common.no')} />
                                    </Form.Item>
                                    <span>{t('owner.admins.view_reports')}</span>
                                </div>
                            </Col>
                            <Col span={12}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Form.Item
                                        name="permissions_canViewFinancials"
                                        valuePropName="checked"
                                        style={{ margin: 0 }}
                                    >
                                        <Switch checkedChildren={t('common.yes')} unCheckedChildren={t('common.no')} />
                                    </Form.Item>
                                    <span>{t('owner.admins.view_financials')}</span>
                                </div>
                            </Col>
                            <Col span={12}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Form.Item
                                        name="permissions_canAddDeals"
                                        valuePropName="checked"
                                        style={{ margin: 0 }}
                                    >
                                        <Switch checkedChildren={t('common.yes')} unCheckedChildren={t('common.no')} />
                                    </Form.Item>
                                    <span>{t('owner.admins.add_deals')}</span>
                                </div>
                            </Col>
                            <Col span={12}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Form.Item
                                        name="permissions_canEditDeals"
                                        valuePropName="checked"
                                        style={{ margin: 0 }}
                                    >
                                        <Switch checkedChildren={t('common.yes')} unCheckedChildren={t('common.no')} />
                                    </Form.Item>
                                    <span>{t('owner.admins.edit_deals')}</span>
                                </div>
                            </Col>
                             <Col span={12}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Form.Item
                                        name="permissions_canDeleteDeals"
                                        valuePropName="checked"
                                        style={{ margin: 0 }}
                                    >
                                        <Switch checkedChildren={t('common.yes')} unCheckedChildren={t('common.no')} />
                                    </Form.Item>
                                    <span>{t('owner.admins.delete_deals')}</span>
                                </div>
                            </Col>
                            <Col span={12}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Form.Item
                                        name="permissions_canManageNews"
                                        valuePropName="checked"
                                        style={{ margin: 0 }}
                                    >
                                        <Switch checkedChildren={t('common.yes')} unCheckedChildren={t('common.no')} />
                                    </Form.Item>
                                    <span>{t('common.news_management')}</span>
                                </div>
                            </Col>
                            <Col span={12}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Form.Item
                                        name="permissions_canManageLanding"
                                        valuePropName="checked"
                                        style={{ margin: 0 }}
                                    >
                                        <Switch checkedChildren={t('common.yes')} unCheckedChildren={t('common.no')} />
                                    </Form.Item>
                                    <span>{t('common.landing_management')}</span>
                                </div>
                            </Col>
                            <Col span={12}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Form.Item
                                        name="permissions_canManageCVRequests"
                                        valuePropName="checked"
                                        style={{ margin: 0 }}
                                    >
                                        <Switch checkedChildren={t('common.yes')} unCheckedChildren={t('common.no')} />
                                    </Form.Item>
                                    <span>{t('players.cv_requests')}</span>
                                </div>
                            </Col>
                            <Col span={12}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Form.Item
                                        name="permissions_canManageMeetings"
                                        valuePropName="checked"
                                        style={{ margin: 0 }}
                                    >
                                        <Switch checkedChildren={t('common.yes')} unCheckedChildren={t('common.no')} />
                                    </Form.Item>
                                    <span>{t('meetings.title')}</span>
                                </div>
                            </Col>
                            <Col span={12}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Form.Item
                                        name="permissions_canManageMembers"
                                        valuePropName="checked"
                                        style={{ margin: 0 }}
                                    >
                                        <Switch checkedChildren={t('common.yes')} unCheckedChildren={t('common.no')} />
                                    </Form.Item>
                                    <span>{t('owner.admins.manage_members')}</span>
                                </div>
                            </Col>

                            <Col span={12}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Form.Item
                                        name="permissions_canManageNutrition"
                                        valuePropName="checked"
                                        style={{ margin: 0 }}
                                    >
                                        <Switch checkedChildren={t('common.yes')} unCheckedChildren={t('common.no')} />
                                    </Form.Item>
                                    <span>{t('owner.admins.manage_nutrition')}</span>
                                </div>
                            </Col>
                            <Col span={12}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Form.Item
                                        name="permissions_canManageFederations"
                                        valuePropName="checked"
                                        style={{ margin: 0 }}
                                    >
                                        <Switch checkedChildren={t('common.yes')} unCheckedChildren={t('common.no')} />
                                    </Form.Item>
                                    <span>{t('owner.admins.manage_federations')}</span>
                                </div>
                            </Col>
                            <Col span={12}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Form.Item
                                        name="permissions_canManageClubs"
                                        valuePropName="checked"
                                        style={{ margin: 0 }}
                                    >
                                        <Switch checkedChildren={t('common.yes')} unCheckedChildren={t('common.no')} />
                                    </Form.Item>
                                    <span>{t('owner.admins.manage_clubs')}</span>
                                </div>
                            </Col>
                            <Col span={12}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Form.Item
                                        name="permissions_canManageScouts"
                                        valuePropName="checked"
                                        style={{ margin: 0 }}
                                    >
                                        <Switch checkedChildren={t('common.yes')} unCheckedChildren={t('common.no')} />
                                    </Form.Item>
                                    <span>{t('owner.admins.manage_scouts')}</span>
                                </div>
                            </Col>
                        </Row>

                        <Form.Item
                            name="isActive"
                            label={t('owner.admins.status')}
                            valuePropName="checked"
                        >
                            <Switch checkedChildren={t('common.active')} unCheckedChildren={t('common.inactive')} />
                        </Form.Item>

                        <Form.Item
                            name="isScout"
                            label={t('scouts.scout')}
                            valuePropName="checked"
                        >
                            <Switch checkedChildren={t('common.yes')} unCheckedChildren={t('common.no')} />
                        </Form.Item>
                    </Form>
                </Modal>
            </Space>
        </div>
    );
};