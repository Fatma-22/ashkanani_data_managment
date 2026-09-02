import { useState, useEffect, FC } from 'react';
import { Table, Button, Space, Modal, Form, Input, Image, message, Popconfirm, Card, Typography, Upload, Select } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, UploadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import apiClient from '../../services/api';
import { federationService } from '../../services/federationService';
import { Federation } from '../../types';

const { Title } = Typography;

export const FederationManagement: FC = () => {
    const { t } = useTranslation();
    const [federations, setFederations] = useState<Federation[]>([]);
    const [loading, setLoading] = useState(false);
    const [sportsOptions, setSportsOptions] = useState<{ value: string, label: string }[]>([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingFederation, setEditingFederation] = useState<Federation | null>(null);
    const [form] = Form.useForm();
    const [fileList, setFileList] = useState<any[]>([]);

    useEffect(() => {
        loadFederations();
        loadSports();
    }, []);

    const loadSports = async () => {
        try {
            const response: any = await apiClient.get('/players/sports');
            // The api.ts interceptor might return the array directly or wrap it in data.
            const sportsArray = Array.isArray(response) ? response : (response.data || []);
            const options = sportsArray.map((sport: string) => ({ 
                value: sport,
                label: t(`enums.Sport.${sport}`, { defaultValue: sport })
            }));
            setSportsOptions(options);
        } catch (error) {
            console.error('Failed to load sports', error);
        }
    };

    const loadFederations = async () => {
        setLoading(true);
        try {
            const data = await federationService.getAll();
            setFederations(data);
        } catch (error) {
            message.error(t('messages.error_load'));
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = () => {
        setEditingFederation(null);
        form.resetFields();
        setFileList([]);
        setModalVisible(true);
    };

    const handleEdit = (federation: any) => {
        setEditingFederation(federation);
        form.setFieldsValue(federation);
        if (federation.logo_url) {
            setFileList([{
                uid: '-1',
                name: 'logo.png',
                status: 'done',
                url: federation.logo_url
            }]);
        } else {
            setFileList([]);
        }
        setModalVisible(true);
    };

    const handleDelete = async (id: number) => {
        try {
            await federationService.delete(id);
            message.success(t('messages.success_delete'));
            loadFederations();
        } catch (error) {
            message.error(t('messages.error_delete'));
        }
    };

    const handleModalOk = async () => {
        try {
            const values = await form.validateFields();
            const formData = new FormData();
            formData.append('sport_name', values.sport_name);
            if (fileList[0]?.originFileObj) {
                formData.append('logo', fileList[0].originFileObj);
            } else if (fileList.length === 0 && editingFederation?.logo_url) {
                formData.append('remove_logo', '1');
            }

            if (editingFederation) {
                await federationService.update(editingFederation.id, formData);
                message.success(t('messages.success_update'));
            } else {
                await federationService.create(formData);
                message.success(t('messages.success_create'));
            }
            setModalVisible(false);
            loadFederations();
        } catch (error) {
            message.error(t('messages.error_save'));
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
            title: t('common.sport'),
            dataIndex: 'sport_name',
            key: 'sport_name',
            render: (sport: string) => t(`enums.Sport.${sport}`, { defaultValue: sport })
        },
        {
            title: t('common.actions'),
            key: 'actions',
            render: (_: any, record: Federation) => (
                <Space>
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
                    <Title level={4}>{t('menu.federations', { defaultValue: 'Sports Federations' })}</Title>
                    <Button type="primary" icon={<PlusOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />} onClick={handleAdd}>
                        {t('common.add_new')}
                    </Button>
                </div>

                <Table
                    columns={columns}
                    dataSource={federations}
                    rowKey="id"
                    loading={loading}
                />
            </Card>

            <Modal
                title={editingFederation ? t('common.edit') : t('common.add_new')}
                open={modalVisible}
                onOk={handleModalOk}
                onCancel={() => setModalVisible(false)}
                destroyOnClose
            >
                <Form form={form} layout="vertical" className="mt-4">
                    <Form.Item
                        name="sport_name"
                        label={t('common.sport')}
                        rules={[{ required: true }]}
                    >
                        <Select
                            showSearch
                            options={sportsOptions}
                            optionFilterProp="label"
                            placeholder={t('common.sport')}
                            className="w-full"
                        />
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
        </div>
    );
};
