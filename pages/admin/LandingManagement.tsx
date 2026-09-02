import React, { useEffect, useState, useRef } from 'react';
import {
    Table, Button, Space, Typography, Modal, Form, Input,
    InputNumber, Switch, Upload, message, Popconfirm, Card, Tag, Row, Col, Tabs, Select, DatePicker, Avatar, Drawer, Descriptions, Radio
} from 'antd';
import {
    PlusOutlined, EditOutlined, DeleteOutlined,
    GlobalOutlined, LinkOutlined, UploadOutlined, EyeOutlined, ShareAltOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { discountService } from '../../services/discountService';
import { sponsorService } from '../../services/sponsorService';
import { Discount, Sponsor, SponsorImage } from '../../types';
import type { ColumnsType } from 'antd/es/table';
import { translateText } from '../../utils/helpers';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

export const LandingManagement: React.FC = () => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.language === 'ar';
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('sponsors');

    // Data states
    const [discounts, setDiscounts] = useState<Discount[]>([]);
    const [sponsors, setSponsors] = useState<Sponsor[]>([]);

    // Shared Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);
    const [form] = Form.useForm();
    
    // File states
    const [fileList, setFileList] = useState<any[]>([]); // For logo or discount image
    const [contractFileList, setContractFileList] = useState<any[]>([]); // For contract file
    const [galleryFileList, setGalleryFileList] = useState<any[]>([]); // For gallery
    const [deletedGalleryIds, setDeletedGalleryIds] = useState<number[]>([]);
    
    // View state
    const [viewItem, setViewItem] = useState<any>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    
    // Search & Filter state
    const [searchText, setSearchText] = useState('');
    const [selectedTier, setSelectedTier] = useState<string>('all');
    
    const translateTimeouts = useRef<{ [key: string]: NodeJS.Timeout }>({});

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'discounts') {
                const res = await discountService.getAll();
                setDiscounts(res.data || res);
                // Also fetch sponsors for the dropdown
                const sRes = await sponsorService.getAll();
                setSponsors(sRes.data || sRes);
            } else {
                const res = await sponsorService.getAll();
                setSponsors(res.data || res);
            }
        } catch (err) {
            message.error(t('messages.error_load'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab]);

    const handleValuesChange = (changedValues: any) => {
        const fieldsToTranslate: Record<string, string> = {
            name_ar: 'name_en',
            title_ar: 'title_en',
            description_ar: 'description_en',
            agreement_text_ar: 'agreement_text',
            services_ar: 'services_en'
        };

        Object.keys(changedValues).forEach(arField => {
            const enField = fieldsToTranslate[arField];
            if (enField) {
                const value = changedValues[arField];
                if (translateTimeouts.current[arField]) {
                    clearTimeout(translateTimeouts.current[arField]);
                }

                if (!value || value.trim() === '') {
                    form.setFieldValue(enField, '');
                    return;
                }

                translateTimeouts.current[arField] = setTimeout(async () => {
                    const translated = await translateText(value, 'ar', 'en');
                    if (!form.getFieldValue(enField)) {
                        form.setFieldsValue({ [enField]: translated });
                    }
                }, 1000);
            }
        });
    };

    const handleOpenModal = (item: any = null) => {
        setEditingItem(item);
        setDeletedGalleryIds([]);
        if (item) {
            // Mapping dates if sponsor
            const values = { ...item };
            if (activeTab === 'sponsors' && item.start_date && item.end_date) {
                values.dates = [dayjs(item.start_date), dayjs(item.end_date)];
            }
            // For discounts: restore sponsor_id from the sponsor object
            if (activeTab === 'discounts' && item.sponsor) {
                values.sponsor_id = item.sponsor.id;
            }
            form.setFieldsValue(values);
            
            // Main image (logo or discount image)
            const mainUrl = activeTab === 'sponsors' ? item.logo_url : item.image_url;
            setFileList(mainUrl ? [{
                uid: '-1',
                name: 'image.png',
                status: 'done',
                url: mainUrl
            }] : []);

            // Contract file
            setContractFileList(item.contract_url ? [{
                uid: '-2',
                name: 'contract.pdf',
                status: 'done',
                url: item.contract_url
            }] : []);

            // Gallery (only for sponsors)
            if (activeTab === 'sponsors' && item.images) {
                setGalleryFileList(item.images.map((img: SponsorImage) => ({
                    uid: img.id.toString(),
                    name: `gallery-${img.id}.png`,
                    status: 'done',
                    url: img.image_url
                })));
            } else {
                setGalleryFileList([]);
            }
        } else {
            form.resetFields();
            form.setFieldValue('is_active', true);
            form.setFieldValue('sort_order', 0);
            if (activeTab === 'sponsors') {
                form.setFieldValue('type', 'SPONSOR');
                form.setFieldValue('tier', 'partner');
            }
            setFileList([]);
            setContractFileList([]);
            setGalleryFileList([]);
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            const formData = new FormData();

            Object.keys(values).forEach(key => {
                if (key === 'dates' && Array.isArray(values[key])) {
                    formData.append('start_date', values[key][0].format('YYYY-MM-DD'));
                    formData.append('end_date', values[key][1].format('YYYY-MM-DD'));
                } else if (typeof values[key] === 'boolean') {
                    formData.append(key, values[key] ? '1' : '0');
                } else if (values[key] !== undefined && values[key] !== null) {
                    formData.append(key, String(values[key]));
                }
            });

            // Explicitly send sponsor_id as empty string when cleared, so backend can unlink it
            if (activeTab === 'discounts' && (values.sponsor_id === undefined || values.sponsor_id === null)) {
                formData.append('sponsor_id', '');
            }

            // Handle main file
            if (activeTab === 'sponsors') {
                if (fileList[0]?.originFileObj) {
                    formData.append('logo', fileList[0].originFileObj);
                } else if (fileList.length === 0 && editingItem && editingItem.logo_url) {
                    formData.append('remove_logo', '1');
                }
            } else {
                if (fileList[0]?.originFileObj) {
                    formData.append('image', fileList[0].originFileObj);
                } else if (fileList.length === 0 && editingItem && editingItem.image_url) {
                    formData.append('remove_image', '1');
                }
            }

            // Handle contract file
            if (activeTab === 'sponsors') {
                if (contractFileList[0]?.originFileObj) {
                    formData.append('contract', contractFileList[0].originFileObj);
                } else if (contractFileList.length === 0 && editingItem && editingItem.contract_url) {
                    formData.append('remove_contract', '1');
                }
            }

            // Handle gallery if sponsor
            if (activeTab === 'sponsors') {
                galleryFileList.forEach((file) => {
                    if (file.originFileObj) {
                        formData.append('gallery[]', file.originFileObj);
                    }
                });
                
                if (deletedGalleryIds.length > 0) {
                    deletedGalleryIds.forEach(id => formData.append('deleted_gallery_ids[]', id.toString()));
                }
            }

            setLoading(true);
            if (activeTab === 'sponsors') {
                if (editingItem) {
                    await sponsorService.update(editingItem.id, formData);
                    message.success(t('messages.success_update'));
                } else {
                    await sponsorService.create(formData);
                    message.success(t('messages.success_save'));
                }
            } else {
                if (editingItem) {
                    await discountService.update(editingItem.id, formData);
                    message.success(t('messages.success_update'));
                } else {
                    await discountService.create(formData);
                    message.success(t('messages.success_save'));
                }
            }
            setIsModalOpen(false);
            fetchData();
        } catch (err) {
            console.error(err);
            message.error(t('messages.error_save'));
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        try {
            setLoading(true);
            if (activeTab === 'sponsors') {
                await sponsorService.delete(id);
            } else {
                await discountService.delete(id);
            }
            message.success(t('messages.success_delete'));
            fetchData();
        } catch (err) {
            message.error(t('messages.error_delete'));
        } finally {
            setLoading(false);
        }
    };

    const renderDetailsDrawer = () => (
        <Modal
            title={activeTab === 'sponsors' ? t('landing.sponsor_details') : t('landing.discount_details')}
            open={isDrawerOpen}
            onCancel={() => setIsDrawerOpen(false)}
            footer={null}
            width={700}
            centered
        >
            {viewItem && (
                <div style={{ maxHeight: '65vh', overflowY: 'auto', padding: '8px 0' }}>
                    {activeTab === 'sponsors' ? (
                        <Descriptions bordered column={1} size="small">
                            <Descriptions.Item label={t('common.logo')}>
                                <Avatar src={viewItem.logo_url} shape="square" size={80} />
                            </Descriptions.Item>
                            <Descriptions.Item label={t('common.name_ar')}>{viewItem.name_ar}</Descriptions.Item>
                            <Descriptions.Item label={t('common.name_en')}>{viewItem.name_en}</Descriptions.Item>
                            <Descriptions.Item label={t('common.tier')}>
                                <Tag color="gold">{viewItem.tier ? t(`common.tiers.${viewItem.tier}`) : t('common.tiers.null')}</Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label={t('common.status')}>
                                <Tag color={viewItem.is_active ? 'green' : 'red'}>{viewItem.is_active ? t('common.active') : t('common.inactive')}</Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label={t('common.website_url')}>
                                {viewItem.website_url ? <a href={viewItem.website_url} target="_blank" rel="noreferrer">{viewItem.website_url}</a> : '-'}
                            </Descriptions.Item>
                            <Descriptions.Item label={t('common.contract_file')}>
                                {viewItem.contract_url ? <a href={viewItem.contract_url} target="_blank" rel="noreferrer">{t('common.download')}</a> : '-'}
                            </Descriptions.Item>
                            <Descriptions.Item label={t('common.services_provided_ar')}>{viewItem.services_ar || '-'}</Descriptions.Item>
                            <Descriptions.Item label={t('common.services_provided_en')}>{viewItem.services_en || '-'}</Descriptions.Item>
                            <Descriptions.Item label={t('common.agreement_details_ar')}>{viewItem.agreement_text_ar || '-'}</Descriptions.Item>
                            <Descriptions.Item label={t('common.agreement_details_en')}>{viewItem.agreement_text || '-'}</Descriptions.Item>
                            <Descriptions.Item label={t('common.gallery')}>
                                <Space wrap>
                                    {viewItem.images?.map((img: any) => (
                                        <img key={img.id} src={img.image_url} className="w-20 h-20 object-cover rounded" alt="gallery" />
                                    ))}
                                    {(!viewItem.images || viewItem.images.length === 0) && <Text type="secondary">{t('common.none')}</Text>}
                                </Space>
                            </Descriptions.Item>
                        </Descriptions>
                    ) : (
                        <Descriptions bordered column={1} size="small">
                            <Descriptions.Item label={t('common.image')}>
                                {viewItem.image_url && <img src={viewItem.image_url} className="w-32 h-32 object-cover rounded" alt="discount" />}
                            </Descriptions.Item>
                            <Descriptions.Item label={t('common.title_ar')}>{viewItem.title_ar}</Descriptions.Item>
                            <Descriptions.Item label={t('common.title_en')}>{viewItem.title_en}</Descriptions.Item>
                            <Descriptions.Item label={t('common.code')}>{viewItem.code}</Descriptions.Item>
                            <Descriptions.Item label={t('common.sponsor')}>
                                {viewItem.sponsor ? (isRtl ? viewItem.sponsor.name_ar : viewItem.sponsor.name_en) : t('common.none')}
                            </Descriptions.Item>
                            <Descriptions.Item label={t('common.description_ar')}>{viewItem.description_ar || '-'}</Descriptions.Item>
                            <Descriptions.Item label={t('common.description_en')}>{viewItem.description_en || '-'}</Descriptions.Item>
                        </Descriptions>
                    )}
                </div>
            )}
        </Modal>
    );

    const sponsorColumns: ColumnsType<Sponsor> = [
        {
            title: t('owner.sponsors.fields.logo'),
            dataIndex: 'logo_url',
            key: 'logo',
            render: (url: string) => <Avatar src={url} shape="square" size={50} />
        },
        { title: t('common.name'), dataIndex: isRtl ? 'name_ar' : 'name_en', key: 'name' },
        { 
            title: t('common.tier'), 
            dataIndex: 'tier', 
            key: 'tier',
            render: (tier: string) => (
                <Tag color={
                    tier === 'diamond' ? 'purple' : 
                    tier === 'gold' ? 'gold' : 
                    tier === 'silver' ? 'blue' : 
                    tier === 'legal' ? 'default' : 
                    'green'
                }>
                    {tier ? t(`common.tiers.${tier}`) : t('common.tiers.null')}
                </Tag>
            )
        },
        {
            title: t('common.contract_file'),
            dataIndex: 'contract_url',
            key: 'contract',
            render: (url: string) => url ? (
                <Button 
                    type="link" 
                    icon={<LinkOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />} 
                    href={url} 
                    target="_blank"
                >
                    {t('common.download')}
                </Button>
            ) : <Text type="secondary">-</Text>
        },
        {
            title: t('common.actions'),
            key: 'actions',
            render: (_: any, record: Sponsor) => (
                <Space>
                    <Button 
                        icon={<EyeOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />} 
                        onClick={() => { setViewItem(record); setIsDrawerOpen(true); }} 
                    />
                    <Button 
                        icon={<ShareAltOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />} 
                        onClick={() => {
                            const url = `${window.location.origin}/sponsors/${record.id}`;
                            navigator.clipboard.writeText(url).then(() => {
                                message.success(t('landing.share_link_copied'));
                            }).catch(() => {
                                message.error(t('landing.share_link_failed'));
                            });
                        }}
                    />
                    <Button icon={<EditOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />} onClick={() => handleOpenModal(record)} />
                    <Popconfirm title={t('messages.confirm_delete_content')} onConfirm={() => handleDelete(record.id)}>
                        <Button danger icon={<DeleteOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />} />
                    </Popconfirm>
                </Space>
            )
        }
    ];

    const discountColumns: ColumnsType<Discount> = [
        {
            title: t('common.image'),
            dataIndex: 'image_url',
            key: 'image',
            render: (url: string) => url ? <img src={url} alt="Discount" className="w-12 h-12 object-cover rounded" /> : null
        },
        { title: t('common.title'), dataIndex: isRtl ? 'title_ar' : 'title_en', key: 'title' },
        { title: t('common.code'), dataIndex: 'code', key: 'code', render: (code: string) => <Text code>{code}</Text> },
        { 
            title: t('common.sponsor'), 
            dataIndex: 'sponsor', 
            key: 'sponsor',
            render: (sponsor: any) => sponsor ? (
                <Space>
                    <Avatar src={sponsor.logo_url} size="small" />
                    <span>{isRtl ? sponsor.name_ar : sponsor.name_en}</span>
                </Space>
            ) : <Tag>{t('landing.general')}</Tag>
        },
        {
            title: t('common.actions'),
            key: 'actions',
            render: (_: any, record: Discount) => (
                <Space>
                    <Button 
                        icon={<EyeOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />} 
                        onClick={() => { setViewItem(record); setIsDrawerOpen(true); }} 
                    />
                    <Button icon={<EditOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />} onClick={() => handleOpenModal(record)} />
                    <Popconfirm title={t('messages.confirm_delete_content')} onConfirm={() => handleDelete(record.id)}>
                        <Button danger icon={<DeleteOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />} />
                    </Popconfirm>
                </Space>
            )
        }
    ];

    return (
        <Card className="rounded-2xl shadow-sm border-none">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <Title level={4} className="!m-0">{t('admin.sponsors_management')}</Title>
                <Button
                    type="primary"
                    icon={<PlusOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
                    onClick={() => handleOpenModal()}
                    className="bg-[#C9A24D] border-none rounded-xl font-bold w-full sm:w-auto h-10 px-6"
                >
                    {t('common.add_new')}
                </Button>
            </div>

            <Tabs activeKey={activeTab} onChange={setActiveTab} className="sponsor-tabs">
                <TabPane tab={t('landing.tabs.sponsors')} key="sponsors">
                    <div className="mb-6 space-y-4">
                        <Row gutter={16} align="middle">
                            <Col xs={24} md={8}>
                                <Input.Search 
                                    placeholder={t('landing.search_placeholder')} 
                                    className="rounded-xl h-11"
                                    onChange={e => setSearchText(e.target.value)}
                                    allowClear
                                />
                            </Col>
                            <Col xs={24} md={16}>
                                <Space wrap>
                                    <Text strong className="mr-2">{t('landing.filter_tier')}</Text>
                                    <Radio.Group 
                                        value={selectedTier} 
                                        onChange={e => setSelectedTier(e.target.value)}
                                        buttonStyle="solid"
                                        className="sponsor-filter-group"
                                    >
                                        <Radio.Button value="all">{t('common.all')}</Radio.Button>
                                        <Radio.Button value="diamond">{t('common.tiers.diamond')}</Radio.Button>
                                        <Radio.Button value="gold">{t('common.tiers.gold')}</Radio.Button>
                                        <Radio.Button value="silver">{t('common.tiers.silver')}</Radio.Button>
                                        <Radio.Button value="partner">{t('common.tiers.partner')}</Radio.Button>
                                        <Radio.Button value="legal">{t('common.tiers.legal')}</Radio.Button>
                                    </Radio.Group>
                                </Space>
                            </Col>
                        </Row>
                    </div>
                    <Table
                        columns={sponsorColumns as any}
                        dataSource={sponsors.filter(s => {
                            const matchSearch = (s.name_ar || '').toLowerCase().includes(searchText.toLowerCase()) || 
                                              (s.name_en || '').toLowerCase().includes(searchText.toLowerCase());
                            const matchTier = selectedTier === 'all' || s.tier === selectedTier;
                            return matchSearch && matchTier;
                        })}
                        rowKey="id"
                        loading={loading}
                        pagination={{ pageSize: 10 }}
                        scroll={{ x: 800 }}
                    />
                </TabPane>
                <TabPane tab={t('landing.tabs.discounts')} key="discounts">
                    <Table
                        columns={discountColumns as any}
                        dataSource={discounts}
                        rowKey="id"
                        loading={loading}
                        pagination={{ pageSize: 10 }}
                        scroll={{ x: 800 }}
                    />
                </TabPane>
            </Tabs>

            <Modal
                title={(editingItem ? t('common.edit') : t('common.add')) + ' ' + (activeTab === 'sponsors' ? t('common.sponsor') : t('landing.discounts_offers'))}
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                onOk={handleSubmit}
                confirmLoading={loading}
                width={800}
                className="rounded-2xl"
            >
                <Form form={form} layout="vertical" className="mt-6" onValuesChange={handleValuesChange}>
                   {activeTab === 'sponsors' ? (
                       <>
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item name="name_ar" label={t('common.name_ar')} rules={[{ required: true }]}>
                                    <Input className="rounded-xl h-11" dir="rtl" />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item name="name_en" label={t('common.name_en')} rules={[{ required: true }]}>
                                    <Input className="rounded-xl h-11" />
                                </Form.Item>
                            </Col>
                        </Row>
                        <Row gutter={16}>
                            <Col span={24}>
                                <Form.Item name="tier" label={t('common.tier')} initialValue="partner">
                                    <Select className="h-11 rounded-xl">
                                        <Select.Option value="diamond">{t('common.tiers.diamond')}</Select.Option>
                                        <Select.Option value="gold">{t('common.tiers.gold')}</Select.Option>
                                        <Select.Option value="silver">{t('common.tiers.silver')}</Select.Option>
                                        <Select.Option value="partner">{t('common.tiers.partner')}</Select.Option>
                                        <Select.Option value="legal">{t('common.tiers.legal')}</Select.Option>
                                    </Select>
                                </Form.Item>
                            </Col>
                        </Row>
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item name="website_url" label={t('owner.sponsors.fields.website')}>
                                    <Input prefix={<LinkOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />} className="rounded-xl h-11" />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item name="dates" label={t('landing.contract_duration')}>
                                    <DatePicker.RangePicker className="w-full h-11 rounded-xl" />
                                </Form.Item>
                            </Col>
                        </Row>
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item name="services_ar" label={t('common.services_provided_ar')} rules={[{ required: true }]}>
                                    <Input.TextArea rows={3} className="rounded-xl" dir="rtl" />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item name="services_en" label={t('common.services_provided_en')}>
                                    <Input.TextArea rows={3} className="rounded-xl" />
                                </Form.Item>
                            </Col>
                        </Row>
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item name="agreement_text_ar" label={t('common.agreement_details_ar')}>
                                    <Input.TextArea rows={3} className="rounded-xl" dir="rtl" />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item name="agreement_text" label={t('common.agreement_details_en')}>
                                    <Input.TextArea rows={3} className="rounded-xl" />
                                </Form.Item>
                            </Col>
                        </Row>
                        <Row gutter={16}>
                            <Col span={8}>
                                <Form.Item label={t('owner.sponsors.fields.logo')}>
                                    <Upload
                                        listType="picture-card"
                                        fileList={fileList}
                                        onRemove={() => setFileList([])}
                                        beforeUpload={(file) => {
                                            const uploadFile = {
                                                uid: file.uid || String(Date.now()),
                                                name: file.name,
                                                status: 'done' as const,
                                                originFileObj: file,
                                            };
                                            setFileList([uploadFile]);
                                            return false;
                                        }}
                                        maxCount={1}
                                    >
                                        {fileList.length < 1 && <PlusOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
                                    </Upload>
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item label={t('common.contract_file')}>
                                    <Upload
                                        listType="picture"
                                        fileList={contractFileList}
                                        onRemove={() => setContractFileList([])}
                                        beforeUpload={(file) => {
                                            const uploadFile = {
                                                uid: file.uid || String(Date.now()),
                                                name: file.name,
                                                status: 'done' as const,
                                                originFileObj: file,
                                            };
                                            setContractFileList([uploadFile]);
                                            return false;
                                        }}
                                        maxCount={1}
                                    >
                                        {contractFileList.length < 1 && <Button icon={<UploadOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}>{t('common.upload')}</Button>}
                                    </Upload>
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item label={t('common.gallery')}>
                                    <Upload
                                        listType="picture-card"
                                        fileList={galleryFileList}
                                        onRemove={(file) => {
                                            // Track existing gallery images for deletion on the server
                                            if (file.uid && !file.originFileObj) {
                                                setDeletedGalleryIds(prev => [...prev, parseInt(file.uid)]);
                                            }
                                            // Remove from the UI list regardless
                                            setGalleryFileList(prev => prev.filter(f => f.uid !== file.uid));
                                        }}
                                        beforeUpload={(file) => {
                                            const uploadFile = {
                                                uid: file.uid || String(Date.now()),
                                                name: file.name,
                                                status: 'done' as const,
                                                originFileObj: file,
                                            };
                                            setGalleryFileList(prev => [...prev, uploadFile]);
                                            return false;
                                        }}
                                        multiple
                                    >
                                        <PlusOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />
                                    </Upload>
                                </Form.Item>
                            </Col>
                        </Row>
                       </>
                   ) : (
                       <>
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item name="title_ar" label={t('common.title_ar')} rules={[{ required: true }]}>
                                    <Input className="rounded-xl h-11" dir="rtl" />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item name="title_en" label={t('common.title_en')} rules={[{ required: true }]}>
                                    <Input className="rounded-xl h-11" />
                                </Form.Item>
                            </Col>
                        </Row>
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item name="code" label={t('common.code')}>
                                    <Input className="rounded-xl h-11" />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item name="sponsor_id" label={t('common.select_sponsor')}>
                                    <Select className="h-11 rounded-xl" allowClear>
                                        {sponsors.map(s => (
                                            <Select.Option key={s.id} value={s.id}>
                                                {isRtl ? s.name_ar : s.name_en}
                                            </Select.Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Col>
                        </Row>
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item name="description_ar" label={t('common.description_ar')}>
                                    <Input.TextArea rows={3} className="rounded-xl" dir="rtl" />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item name="description_en" label={t('common.description_en')}>
                                    <Input.TextArea rows={3} className="rounded-xl" />
                                </Form.Item>
                            </Col>
                        </Row>
                        <Form.Item label={t('common.image')}>
                            <Upload
                                listType="picture-card"
                                fileList={fileList}
                                onRemove={() => setFileList([])}
                                beforeUpload={(file) => {
                                    const uploadFile = {
                                        uid: file.uid || String(Date.now()),
                                        name: file.name,
                                        status: 'done' as const,
                                        originFileObj: file,
                                    };
                                    setFileList([uploadFile]);
                                    return false;
                                }}
                                maxCount={1}
                            >
                                {fileList.length < 1 && <PlusOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
                            </Upload>
                        </Form.Item>
                       </>
                   )}

                   <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="sort_order" label={t('common.sort_order')}>
                                <InputNumber className="w-full rounded-xl h-11" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="is_active" label={t('common.status')} valuePropName="checked">
                                <Switch checkedChildren={t('common.active')} unCheckedChildren={t('common.inactive')} />
                            </Form.Item>
                        </Col>
                   </Row>
                </Form>
            </Modal>
            {renderDetailsDrawer()}
        </Card>
    );
};
