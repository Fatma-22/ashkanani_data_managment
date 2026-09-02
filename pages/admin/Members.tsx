import React, { useEffect, useState } from 'react';
import { Table, Typography, Card, Tag, Space, Button, Input, Select, notification, Switch, Popconfirm, Modal, Descriptions } from 'antd';
import { UserOutlined, SearchOutlined, TeamOutlined, DeleteOutlined, QuestionCircleOutlined, StopOutlined, CheckCircleOutlined, EyeOutlined, KeyOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { User, MemberType, UserRole } from '../../types';
import apiClient from '../../services/api';
import dayjs from 'dayjs';
import { useStickyState } from '../../utils/hooks';
import { useRef } from 'react';

const { Title, Text } = Typography;
const { Option } = Select;

export const Members: React.FC = () => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [members, setMembers] = useState<User[]>([]);
    const [searchText, setSearchText] = useState('');
    const [filterType, setFilterType] = useState<string>('ALL');
    const [page, setPage] = useStickyState(1, 'Admin_Members_page');
    const [pageSize, setPageSize] = useStickyState(10, 'Admin_Members_pageSize');
    const isFirstRender = useRef(true);
    const [selectedMember, setSelectedMember] = useState<User | null>(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [resetLoadingId, setResetLoadingId] = useState<string | null>(null);

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        setPage(1);
    }, [searchText, filterType]);

    const loadMembers = async () => {
        setLoading(true);
        try {
            const response: any = await apiClient.get('/members?per_page=all');
            // Handle different data structures (Laravel resource or direct array)
            const resolvedData = response.data?.data || response.data || (Array.isArray(response) ? response : []);
            setMembers(Array.isArray(resolvedData) ? resolvedData : []);
        } catch (error) {
            console.error('Error loading members:', error);
            // notification.error({ message: t('common.error') });
            // For demo/dev purposes, if endpoint doesn't exist yet, we might mock some data
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStatus = async (record: User) => {
        try {
            await apiClient.put(`/members/${record.id}/toggle-status`);
            notification.success({ message: t('common.success') });
            loadMembers();
        } catch (error) {
            console.error('Error updating member status:', error);
            notification.error({ message: t('common.error') });
        }
    };

    const handleDeleteMember = async (id: string) => {
        try {
            await apiClient.delete(`/members/${id}`);
            notification.success({ message: t('common.success') });
            loadMembers();
        } catch (error) {
            console.error('Error deleting member:', error);
            notification.error({ message: t('common.error') });
        }
    };

    const handleResetPassword = async (record: User) => {
        setResetLoadingId(record.id);
        try {
            await apiClient.put(`/members/${record.id}/reset-password`);
            notification.success({
                message: t('admin.members.reset_password_success', { defaultValue: 'تم إعادة تعيين كلمة المرور' }),
                description: t('admin.members.reset_password_desc', { defaultValue: 'كلمة المرور الجديدة: 12345678' }),
                duration: 6,
            });
        } catch (error) {
            console.error('Error resetting password:', error);
            notification.error({ message: t('common.error') });
        } finally {
            setResetLoadingId(null);
        }
    };

    useEffect(() => {
        loadMembers();
    }, []);

    const columns = [
        {
            title: t('admin.members.table.name'),
            dataIndex: 'name',
            key: 'name',
            render: (text: string, record: User) => (
                <Space>
                    <UserOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />
                    <Text strong>{text}</Text>
                </Space>
            ),
        },
        {
            title: t('admin.members.table.country'),
            dataIndex: 'country',
            key: 'country',
            render: (country: string) => <Tag color="blue">{country}</Tag>
        },
        {
            title: t('admin.members.table.organization'),
            dataIndex: 'organization',
            key: 'organization',
            render: (org: string) => org || '-'
        },
        {
            title: t('admin.members.table.type'),
            dataIndex: 'memberType',
            key: 'memberType',
            render: (type: MemberType) => (
                <Tag color={type === MemberType.PLAYER ? 'gold' : 'purple'}>
                    {t(`member_types.${type}`)}
                </Tag>
            ),
        },
        {
            title: t('admin.members.table.date'),
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date: string) => date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '-',
        },
        {
            title: t('common.status'),
            key: 'status',
            render: (_: any, record: User) => (
                <Switch 
                    checked={record.isActive} 
                    onChange={() => handleToggleStatus(record)}
                    checkedChildren={<CheckCircleOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
                    unCheckedChildren={<StopOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
                />
            )
        },
        {
            title: t('common.actions'),
            key: 'actions',
            render: (_: any, record: User) => (
                <Space>
                    <Button 
                        type="text" 
                        icon={<EyeOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
                        onClick={() => {
                            setSelectedMember(record);
                            setIsViewModalOpen(true);
                        }}
                    />
                    <Popconfirm
                        title={t('admin.members.reset_password_confirm', { defaultValue: 'إعادة تعيين كلمة المرور إلى 12345678؟' })}
                        description={t('admin.members.reset_password_confirm_desc', { defaultValue: 'سيتم تسجيل خروج العضو من جميع الأجهزة.' })}
                        onConfirm={() => handleResetPassword(record)}
                        okText={t('common.confirm', { defaultValue: 'تأكيد' })}
                        cancelText={t('common.cancel', { defaultValue: 'إلغاء' })}
                        okButtonProps={{ danger: true }}
                        icon={<KeyOutlined style={{ color: '#faad14' }} onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
                    >
                        <Button 
                            type="text" 
                            loading={resetLoadingId === record.id}
                            icon={<KeyOutlined style={{ color: '#faad14' }} onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
                            title={t('admin.members.reset_password', { defaultValue: 'إعادة تعيين كلمة المرور' })}
                        />
                    </Popconfirm>
                    <Popconfirm
                        title={t('common.delete_confirm')}
                        onConfirm={() => handleDeleteMember(record.id)}
                        icon={<QuestionCircleOutlined style={{ color: 'red' }} onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
                    >
                        <Button 
                            danger 
                            type="text" 
                            icon={<DeleteOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
                        />
                    </Popconfirm>
                </Space>
            )
        }
    ];

    const filteredMembers = members.filter(m => {
        const matchesSearch = m.name?.toLowerCase().includes(searchText.toLowerCase()) || 
                             m.email?.toLowerCase().includes(searchText.toLowerCase());
        const matchesType = filterType === 'ALL' || m.memberType === filterType;
        return matchesSearch && matchesType;
    });

    return (
        <div className="fade-in pb-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <Title level={2} className="!m-0 !text-[#C9A24D] !font-black uppercase tracking-tight">
                        {t('admin.members.title')}
                    </Title>
                    <Text type="secondary">{t('admin.members.subtitle')}</Text>
                </div>
                <div className="flex flex-wrap gap-2 w-full md:w-auto">
                   <Input 
                     placeholder={t('common.search')} 
                     prefix={<SearchOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />} 
                     className="w-full md:w-64"
                     value={searchText}
                     onChange={e => setSearchText(e.target.value)}
                   />
                   <Select 
                     defaultValue="ALL" 
                     className="w-full md:w-40"
                     onChange={setFilterType}
                   >
                       <Option value="ALL">{t('common.all')}</Option>
                       {Object.values(MemberType).map(type => (
                           <Option key={type} value={type}>{t(`member_types.${type}`)}</Option>
                       ))}
                   </Select>
                </div>
            </div>

            <Card className="shadow-sm border-none overflow-hidden">
                <Table 
                    columns={columns} 
                    dataSource={filteredMembers} 
                    rowKey="id" 
                    loading={loading}
                    pagination={{ 
                        current: page,
                        pageSize: pageSize,
                        onChange: (p, ps) => {
                            setPage(p);
                            setPageSize(ps);
                        },
                        showSizeChanger: true
                    }}
                    locale={{ emptyText: <div className="p-10 text-center text-slate-400">No members found</div> }}
                />
            </Card>

            <Modal
                title={t('admin.members.member_details', { defaultValue: 'تفاصيل العضو' })}
                open={isViewModalOpen}
                onCancel={() => {
                    setIsViewModalOpen(false);
                    setSelectedMember(null);
                }}
                footer={[
                    <Button key="close" onClick={() => {
                        setIsViewModalOpen(false);
                        setSelectedMember(null);
                    }}>
                        {t('common.close', { defaultValue: 'إغلاق' })}
                    </Button>
                ]}
                width={600}
            >
                {selectedMember && (
                    <Descriptions bordered column={1} size="small">
                        <Descriptions.Item label={t('admin.members.table.name')}>{selectedMember.name}</Descriptions.Item>
                        <Descriptions.Item label={t('admin.members.table.email')}>{selectedMember.email || '-'}</Descriptions.Item>
                        <Descriptions.Item label={t('admin.members.table.phone')}>{selectedMember.phone || '-'}</Descriptions.Item>
                        <Descriptions.Item label={t('admin.members.table.country')}>{selectedMember.country || '-'}</Descriptions.Item>
                        <Descriptions.Item label={t('admin.members.table.organization')}>{selectedMember.organization || '-'}</Descriptions.Item>
                        <Descriptions.Item label={t('admin.members.table.type')}>
                            <Tag color={selectedMember.memberType === MemberType.PLAYER ? 'gold' : 'purple'}>
                                {t(`member_types.${selectedMember.memberType}`)}
                            </Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label={t('admin.members.table.date')}>
                            {selectedMember.createdAt ? dayjs(selectedMember.createdAt).format('YYYY-MM-DD HH:mm') : '-'}
                        </Descriptions.Item>
                        <Descriptions.Item label={t('common.status')}>
                            <Tag color={selectedMember.isActive ? 'green' : 'red'}>
                                {selectedMember.isActive ? t('common.active') : t('common.inactive')}
                            </Tag>
                        </Descriptions.Item>
                    </Descriptions>
                )}
            </Modal>
        </div>
    );
};
