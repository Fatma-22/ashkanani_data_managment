import { useState, useEffect, FC } from 'react';
import { Table, Button, Space, Modal, Form, Input, Image, message, Popconfirm, Card, Typography, Upload, Select, Drawer, List, Avatar, Tag, Divider } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, UploadOutlined, TeamOutlined, UserOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { clubService } from '../../services/clubService';
import { Club, Player } from '../../types';
import { WORLD_COUNTRIES } from '../../utils/countries';
import { translateText } from '../../utils/helpers';

const { Title, Text } = Typography;

export const ClubManagement: FC = () => {
    const { t, i18n } = useTranslation();
    const isAr = i18n.language === 'ar';
    const [clubs, setClubs] = useState<Club[]>([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingClub, setEditingClub] = useState<Club | null>(null);
    const [form] = Form.useForm();
    const [fileList, setFileList] = useState<any[]>([]);
    const [selectedClubPlayers, setSelectedClubPlayers] = useState<Player[]>([]);
    const [playersModalVisible, setPlayersModalVisible] = useState(false);
    const [viewingClub, setViewingClub] = useState<Club | null>(null);
    const navigate = useNavigate();
    const location = useLocation();
    const isOwner = location.pathname.startsWith('/owner');

    useEffect(() => {
        loadClubs();
    }, []);

    const loadClubs = async () => {
        setLoading(true);
        try {
            const data = await clubService.getAll();
            setClubs(data);
        } catch (error) {
            message.error(t('messages.error_load'));
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = () => {
        setEditingClub(null);
        form.resetFields();
        setFileList([]);
        setModalVisible(true);
    };

    const handleEdit = (club: any) => {
        setEditingClub(club);
        form.setFieldsValue({
            ...club,
            is_active: !!club.is_active
        });
        if (club.logo_url) {
            setFileList([{
                uid: '-1',
                name: 'logo.png',
                status: 'done',
                url: club.logo_url
            }]);
        } else {
            setFileList([]);
        }
        setModalVisible(true);
    };

    const handleDelete = async (id: number) => {
        try {
            await clubService.delete(id);
            message.success(t('messages.success_delete'));
            loadClubs();
        } catch (error) {
            message.error(t('messages.error_delete'));
        }
    };
    
    const handleViewPlayers = async (record: Club) => {
        setViewingClub(record);
        setLoading(true);
        try {
            const data = await clubService.getById(record.id);
            // clubService.getById returns { club, players } because of our controller update
            setSelectedClubPlayers((data as any).players || []);
            setPlayersModalVisible(true);
        } catch (error) {
            message.error(t('messages.error_load'));
        } finally {
            setLoading(false);
        }
    };

    const handleModalOk = async () => {
        try {
            const values = await form.validateFields();
            const formData = new FormData();
            // If English name is empty but Arabic name exists, auto-translate
            let englishName = values.name || '';
            if (!englishName && values.name_ar) {
                try {
                    englishName = await translateText(values.name_ar, 'ar', 'en');
                } catch (_) {
                    englishName = values.name_ar;
                }
            }
            if (englishName) formData.append('name', englishName);
            if (values.name_ar) formData.append('name_ar', values.name_ar);
            if (values.country) formData.append('country', values.country);
            if (fileList[0]?.originFileObj) {
                formData.append('logo', fileList[0].originFileObj);
            } else if (fileList.length === 0 && editingClub?.logo_url) {
                formData.append('remove_logo', '1');
            }

            if (editingClub) {
                await clubService.update(editingClub.id, formData);
                message.success(t('messages.success_update'));
            } else {
                await clubService.create(formData);
                message.success(t('messages.success_create'));
            }
            setModalVisible(false);
            loadClubs();
        } catch (error) {
            message.error(t('messages.error_save'));
        }
    };

    const handleFormValuesChange = async (changedValues: any) => {
        // Auto-translate Arabic name to English
        if (changedValues.name_ar && changedValues.name_ar.trim()) {
            try {
                const translated = await translateText(changedValues.name_ar, 'ar', 'en');
                if (translated && !form.getFieldValue('name')) {
                    form.setFieldValue('name', translated);
                }
            } catch (_) {}
        }
    };

    const columns = [
        {
            title: t('common.logo'),
            dataIndex: 'logo_url',
            key: 'logo_url',
            render: (url: string) => url ? <Image src={url} width={50} height={50} style={{ objectFit: 'contain' }} /> : null,
        },
        {
            title: t('common.name'),
            dataIndex: isAr ? 'name_ar' : 'name',
            key: 'name',
            render: (text: string, record: Club) => text || record.name,
        },
        {
            title: t('common.country'),
            dataIndex: 'country',
            key: 'country',
            render: (country: string) => {
                if (!country) return null;
                const found = WORLD_COUNTRIES.find(c => c.value === country);
                return found ? (isAr ? found.labelAr : found.labelEn) : country;
            },
        },
        {
            title: t('common.actions'),
            key: 'actions',
            render: (_: any, record: Club) => (
                <Space>
                    <Button 
                        icon={<TeamOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />} 
                        onClick={() => handleViewPlayers(record)}
                        title={t('common.view_details')}
                    />
                    <Button icon={<EditOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />} onClick={() => handleEdit(record)} />
                    <Popconfirm title={t('common.confirm_delete')} onConfirm={() => handleDelete(record.id)}>
                        <Button icon={<DeleteOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />} danger />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div className="p-6">
            <Card>
                <div className="flex justify-between items-center mb-6">
                    <Title level={4}>{t('menu.clubs', { defaultValue: 'Sports Clubs' })}</Title>
                    <Button type="primary" icon={<PlusOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />} onClick={handleAdd}>
                        {t('common.add_new')}
                    </Button>
                </div>

                <Table
                    columns={columns}
                    dataSource={clubs}
                    rowKey="id"
                    loading={loading}
                />
            </Card>

            <Modal
                title={editingClub ? t('common.edit') : t('common.add_new')}
                open={modalVisible}
                onOk={handleModalOk}
                onCancel={() => setModalVisible(false)}
                destroyOnClose
            >
                <Form form={form} layout="vertical" className="mt-4" onValuesChange={handleFormValuesChange}>
                    <Form.Item
                        name="name_ar"
                        label={t('common.name_ar', { defaultValue: 'Name (AR)' })}
                        rules={[{ required: true }]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        name="name"
                        label={t('common.name_en', { defaultValue: 'Name (EN) - Auto-translated' })}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        name="country"
                        label={t('common.country')}
                    >
                        <Select
                            showSearch
                            placeholder={t('common.country')}
                            optionFilterProp="label"
                        >
                            {WORLD_COUNTRIES.map(c => (
                                <Select.Option key={c.value} value={c.value} label={isAr ? c.labelAr : c.labelEn}>
                                    {isAr ? c.labelAr : c.labelEn}
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item label={t('common.logo')}>
                        <Upload
                            listType="picture-card"
                            fileList={fileList}
                            onChange={({ fileList }) => setFileList(fileList)}
                            beforeUpload={() => false}
                            maxCount={1}
                        >
                            {fileList.length < 1 && (
                                <div>
                                    <UploadOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />
                                    <div style={{ marginTop: 8 }}>{t('common.upload')}</div>
                                </div>
                            )}
                        </Upload>
                    </Form.Item>
                </Form>
            </Modal>

            <Modal
                title={`${t('common.players')}: ${viewingClub ? (isAr ? viewingClub.name_ar || viewingClub.name : viewingClub.name) : ''}`}
                onCancel={() => setPlayersModalVisible(false)}
                open={playersModalVisible}
                footer={null}
                width={600}
                centered
                destroyOnClose
            >
                <List
                    itemLayout="horizontal"
                    dataSource={selectedClubPlayers}
                    renderItem={(player) => (
                        <List.Item
                            actions={[
                                <Button 
                                    type="link" 
                                    onClick={() => {
                                        const path = isOwner ? `/owner/players/${player.id}` : `/admin/players/${player.id}`;
                                        navigate(path);
                                    }}
                                >
                                    {t('common.view_details')}
                                </Button>
                            ]}
                        >
                            <List.Item.Meta
                                avatar={<Avatar src={player.mainPhoto?.url} icon={<UserOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />} />}
                                title={
                                    <Space>
                                        <span className="font-bold">{isAr ? player.nameAr || player.name : player.name}</span>
                                        <Tag color="blue" style={{ fontSize: '10px' }}>
                                            {t(`enums.ProfileRole.${player.role}`, { defaultValue: player.role })}
                                        </Tag>
                                    </Space>
                                }
                                description={
                                    <Space split={<Divider type="vertical" />}>
                                        <Text type="secondary" style={{ fontSize: '12px' }}>
                                            {t(`enums.Sport.${player.sport}`, { defaultValue: player.sport })}
                                        </Text>
                                        {player.positions?.[0] && (
                                            <Text type="secondary" style={{ fontSize: '12px' }}>
                                                {t(`enums.Position.${player.positions[0]}`, { defaultValue: player.positions[0] })}
                                            </Text>
                                        )}
                                    </Space>
                                }
                            />
                        </List.Item>
                    )}
                />
            </Modal>
        </div>
    );
};
