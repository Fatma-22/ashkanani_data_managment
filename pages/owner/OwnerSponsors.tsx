import React, { useEffect, useState } from 'react';
import { Card, Button, Space, Modal, Form, Input, InputNumber, Switch, message, Typography, Tooltip, Row, Col, Tag, Avatar, List, Upload, Divider, Tabs, DatePicker, Drawer, Descriptions, Select, Radio } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, GlobalOutlined, LinkOutlined, FilePdfOutlined, UploadOutlined, EyeOutlined } from '@ant-design/icons';
import { Sponsor } from '../../types';
import { sponsorService } from '../../services/sponsorService';
import { useTranslation } from 'react-i18next';
import { translateText } from '../../utils/helpers';
import type { UploadFile } from 'antd/es/upload/interface';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;

export const OwnerSponsors: React.FC = () => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.language === 'ar';
    const [sponsors, setSponsors] = useState<Sponsor[]>([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingSponsor, setEditingSponsor] = useState<Sponsor | null>(null);
    const [form] = Form.useForm();
    const [logoFileList, setLogoFileList] = useState<UploadFile[]>([]);
    const [contractFileList, setContractFileList] = useState<UploadFile[]>([]);
    const [galleryFileList, setGalleryFileList] = useState<UploadFile[]>([]);
    const [deletedGalleryIds, setDeletedGalleryIds] = useState<number[]>([]);
    const [viewItem, setViewItem] = useState<any>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    
    // Search & Filter state
    const [searchText, setSearchText] = useState('');
    const [selectedTier, setSelectedTier] = useState<string>('all');

    useEffect(() => {
        loadSponsors();
        return () => {
            // Cleanup translation timeouts
            Object.values(translateTimeouts.current).forEach(t => clearTimeout(t));
        };
    }, []);

    const loadSponsors = async () => {
        setLoading(true);
        try {
            const response = await sponsorService.getAll();
            setSponsors(response.data || response);
        } catch (error) {
            message.error(t('messages.error_load'));
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setEditingSponsor(null);
        setLogoFileList([]);
        setContractFileList([]);
        setGalleryFileList([]);
        setDeletedGalleryIds([]);
        form.resetFields();
        form.setFieldValue('tier', 'partner');
        setModalVisible(true);
    };

    const handleEdit = (sponsor: Sponsor) => {
        setEditingSponsor(sponsor);
        setLogoFileList(sponsor.logo_url ? [{
            uid: '-1', name: 'logo.png', status: 'done',
            url: sponsor.logo_url, thumbUrl: sponsor.logo_url,
        }] : []);
        setContractFileList(sponsor.contract_url ? [{
            uid: '-2', name: 'contract.pdf', status: 'done',
            url: sponsor.contract_url, thumbUrl: sponsor.contract_url,
        }] : []);
        setGalleryFileList((sponsor.images || []).map((img: any) => ({
            uid: String(img.id), name: `img-${img.id}.jpg`, status: 'done',
            url: img.image_url, thumbUrl: img.image_url,
        })));
        setDeletedGalleryIds([]);
        
        form.setFieldsValue({
            name_en: sponsor.name_en,
            name_ar: sponsor.name_ar,
            services_en: sponsor.services_en,
            services_ar: sponsor.services_ar,
            website_url: sponsor.website_url,
            sort_order: sponsor.sort_order,
            is_active: sponsor.is_active,
            dates: (sponsor.start_date && sponsor.end_date) ? [dayjs(sponsor.start_date), dayjs(sponsor.end_date)] : undefined,
            agreement_text: sponsor.agreement_text,
            agreement_text_ar: sponsor.agreement_text_ar,
            tier: sponsor.tier || 'partner'
        });
        setModalVisible(true);
    };

    const handleDelete = (id: number) => {
        Modal.confirm({
            title: t('owner.sponsors.delete_confirm'),
            okText: t('common.delete'),
            okType: 'danger',
            cancelText: t('common.cancel'),
            onOk: async () => {
                try {
                    await sponsorService.delete(id);
                    message.success(t('messages.success_delete'));
                    loadSponsors();
                } catch (error) {
                    message.error(t('messages.error_delete'));
                }
            },
        });
    };

    const translateTimeouts = React.useRef<{ [key: string]: NodeJS.Timeout }>({});

    const handleValuesChange = (changedValues: any) => {
        const fieldsToTranslate: Record<string, string> = {
            name_ar: 'name_en',
            services_ar: 'services_en',
            agreement_text_ar: 'agreement_text'
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

                // If the English field already has a value, and it's not our placeholder, maybe don't overwrite?
                // Or overwrite but with a delay.
                
                translateTimeouts.current[arField] = setTimeout(async () => {
                    try {
                        const translated = await translateText(value, 'ar', 'en');
                        // Only update if the user hasn't typed in the English field manually in the meantime
                        // (Simplified: just update if it's currently empty or was previously translated)
                        form.setFieldsValue({ [enField]: translated });
                    } catch (err) {
                        console.error('Translation error:', err);
                    }
                }, 1000);
            }
        });
    };

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            const formData = new FormData();
            
            Object.keys(values).forEach(key => {
                if (values[key] !== undefined && values[key] !== null) {
                    let val = values[key];
                    if (typeof val === 'boolean') {
                        val = val ? 1 : 0;
                    }
                    if (key === 'dates' && Array.isArray(val)) {
                        formData.append('start_date', val[0].format('YYYY-MM-DD'));
                        formData.append('end_date', val[1].format('YYYY-MM-DD'));
                        return;
                    }
                    formData.append(key, val);
                }
            });

            if (logoFileList[0]?.originFileObj) {
                formData.append('logo', logoFileList[0].originFileObj as any);
            } else if (logoFileList.length === 0 && editingSponsor?.logo_url) {
                formData.append('remove_logo', '1');
            }

            if (contractFileList[0]?.originFileObj) {
                formData.append('contract', contractFileList[0].originFileObj as any);
            }

            // Gallery images
            galleryFileList.forEach(f => {
                if (f.originFileObj) formData.append('gallery[]', f.originFileObj as any);
            });
            if (deletedGalleryIds.length > 0) {
                deletedGalleryIds.forEach(id => formData.append('deleted_gallery_ids[]', id.toString()));
            }

            if (editingSponsor) {
                await sponsorService.update(editingSponsor.id, formData);
                message.success(t('messages.success_update'));
            } else {
                await sponsorService.create(formData);
                message.success(t('messages.success_save'));
            }

            setModalVisible(false);
            loadSponsors();
        } catch (error) {
            message.error(t('messages.error_save'));
        }
    };

    const renderDetailsDrawer = () => (
        <Modal
            title={i18n.language === 'ar' ? 'تفاصيل الراعي' : 'Sponsor Details'}
            open={isDrawerOpen}
            onCancel={() => setIsDrawerOpen(false)}
            footer={null}
            width={700}
            centered
        >
            {viewItem && (
                <div style={{ maxHeight: '65vh', overflowY: 'auto', padding: '8px 0' }}>
                    <Descriptions bordered column={1} size="small">
                        <Descriptions.Item label={t('owner.sponsors.fields.logo')}>
                            <Avatar src={viewItem.logo_url} shape="square" size={80} />
                        </Descriptions.Item>
                        <Descriptions.Item label={t('owner.sponsors.fields.name_ar')}>{viewItem.name_ar}</Descriptions.Item>
                        <Descriptions.Item label={t('owner.sponsors.fields.name_en')}>{viewItem.name_en}</Descriptions.Item>
                        <Descriptions.Item label={isRtl ? 'نوع الراعي' : 'Tier'}>
                            <Tag color={viewItem.tier === 'diamond' ? 'purple' : viewItem.tier === 'gold' ? 'gold' : viewItem.tier === 'silver' ? 'blue' : viewItem.tier === 'legal' ? 'default' : 'green'}>
                                {viewItem.tier ? (viewItem.tier === 'legal' ? (isRtl ? 'شريك قانوني' : 'Legal Partner') : t(`common.tiers.${viewItem.tier}`)) : t('common.tiers.partner')}
                            </Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label={t('owner.sponsors.fields.is_active')}>
                            <Tag color={viewItem.is_active ? 'green' : 'red'}>{viewItem.is_active ? t('common.active') : t('common.inactive')}</Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label={t('owner.sponsors.fields.website')}>
                            {viewItem.website_url ? <a href={viewItem.website_url} target="_blank" rel="noreferrer">{viewItem.website_url}</a> : '-'}
                        </Descriptions.Item>
                        <Descriptions.Item label={t('owner.sponsors.fields.contract')}>
                            {viewItem.contract_url ? <a href={viewItem.contract_url} target="_blank" rel="noreferrer">{t('owner.sponsors.contract_view')}</a> : '-'}
                        </Descriptions.Item>
                        <Descriptions.Item label={t('owner.sponsors.fields.services_ar')}>{viewItem.services_ar || '-'}</Descriptions.Item>
                        <Descriptions.Item label={t('owner.sponsors.fields.services_en')}>{viewItem.services_en || '-'}</Descriptions.Item>
                        <Descriptions.Item label={isRtl ? 'تفاصيل الاتفاقية' : 'Agreement Details'}>
                            {viewItem.agreement_text_ar || viewItem.agreement_text || '-'}
                        </Descriptions.Item>
                        <Descriptions.Item label={t('common.gallery')}>
                            <Space wrap>
                                {viewItem.images?.map((img: any) => (
                                    <img 
                                        key={img.id} 
                                        src={img.image_url} 
                                        className="w-20 h-20 object-cover rounded shadow-sm" 
                                        alt="gallery"
                                        onError={(e) => { e.currentTarget.src = 'https://placehold.co/80x80?text=Error'; }}
                                    />
                                ))}
                                {(!viewItem.images || viewItem.images.length === 0) && <Text type="secondary">{t('common.none')}</Text>}
                            </Space>
                        </Descriptions.Item>
                    </Descriptions>
                </div>
            )}
        </Modal>
    );

    return (
        <div className="fade-in p-6 bg-slate-50/30 min-h-screen">
            <div className="mb-8 flex justify-between items-end">
                <div>
                    <Title level={2} className="mb-1 font-black text-slate-800">{t('admin.sponsors_management')}</Title>
                    <Text type="secondary" className="text-lg">{t('owner.sponsors.subtitle')}</Text>
                </div>
                <Button 
                    type="primary" 
                    icon={<PlusOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />} 
                    onClick={handleCreate}
                    size="large"
                    className="h-12 px-8 rounded-xl shadow-lg shadow-gold-500/20"
                    style={{ background: '#3F3F3F' }}
                >
                    {t('common.add_new')}
                </Button>
            </div>

            {/* Tabs removed as per user request to merge Sponsor/Partner */}
            <div className="bg-white p-6 rounded-2xl shadow-sm mb-8 border border-slate-100">
                <Row gutter={[24, 24]} align="middle">
                    <Col xs={24} md={8}>
                        <div className="text-slate-500 mb-2 font-medium">{isRtl ? 'البحث بالاسم' : 'Search by Name'}</div>
                        <Input 
                            placeholder={isRtl ? 'أدخل اسم الراعي للبحث...' : 'Enter sponsor name to search...'} 
                            prefix={<GlobalOutlined className="text-slate-300" onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
                            className="h-12 rounded-xl border-slate-200"
                            onChange={e => setSearchText(e.target.value)}
                            allowClear
                        />
                    </Col>
                    <Col xs={24} md={16}>
                        <div className="text-slate-500 mb-2 font-medium">{isRtl ? 'التصنيف حسب الفئة' : 'Filter by Category'}</div>
                        <Space wrap size={[8, 8]}>
                            {[
                                { value: 'all', label: isRtl ? 'الكل' : 'All' },
                                { value: 'diamond', label: t('common.tiers.diamond') },
                                { value: 'gold', label: t('common.tiers.gold') },
                                { value: 'silver', label: t('common.tiers.silver') },
                                { value: 'partner', label: t('common.tiers.partner') },
                                { value: 'legal', label: isRtl ? 'شريك قانوني' : 'Legal Partner' }
                            ].map(tier => (
                                <Button 
                                    key={tier.value}
                                    onClick={() => setSelectedTier(tier.value)}
                                    className={`h-11 px-6 rounded-xl font-medium transition-all ${selectedTier === tier.value ? 'bg-slate-800 text-white border-slate-800 shadow-md' : 'bg-slate-50 text-slate-600 border-slate-100 hover:border-slate-300'}`}
                                >
                                    {tier.label}
                                </Button>
                            ))}
                        </Space>
                    </Col>
                </Row>
            </div>

            <List
                grid={{ gutter: 24, xs: 1, sm: 2, md: 2, lg: 3, xl: 3, xxl: 4 }}
                loading={loading}
                dataSource={sponsors.filter(s => {
                    const matchSearch = (s.name_ar || '').toLowerCase().includes(searchText.toLowerCase()) || 
                                      (s.name_en || '').toLowerCase().includes(searchText.toLowerCase());
                    const matchTier = selectedTier === 'all' || s.tier === selectedTier;
                    return matchSearch && matchTier;
                })}
                renderItem={(sponsor) => (
                    <List.Item className="h-full flex w-full">
                        <Card 
                            hoverable
                            className="h-full rounded-2xl overflow-hidden border-none shadow-sm hover:shadow-xl transition-all duration-500 group flex flex-col w-full"
                            bodyStyle={{ flex: 1, display: 'flex', flexDirection: 'column' }}
                            styles={{ body: { flex: 1, display: 'flex', flexDirection: 'column' } }}
                            actions={[
                                <Tooltip title={t('common.view')} key="view">
                                    <Button type="text" icon={<EyeOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />} onClick={() => { setViewItem(sponsor); setIsDrawerOpen(true); }} className="hover:text-gold-600" />
                                </Tooltip>,
                                <Tooltip title={t('common.edit')} key="edit">
                                    <Button type="text" icon={<EditOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />} onClick={() => handleEdit(sponsor)} className="group-hover:text-gold-600" />
                                </Tooltip>,
                                <Tooltip title={t('common.delete')} key="delete">
                                    <Button type="text" danger icon={<DeleteOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />} onClick={() => handleDelete(sponsor.id)} />
                                </Tooltip>
                            ]}
                        >
                            <div className="flex flex-col items-center flex-1 w-full">
                                <div className="relative mb-6">
                                    <Avatar 
                                        size={120} 
                                        src={sponsor.logo_url} 
                                        shape="square" 
                                        className="bg-white p-2 border border-slate-100 shadow-sm"
                                    />
                                    {!sponsor.is_active && (
                                        <Tag color="error" className="absolute -top-2 -right-2 m-0 rounded-full px-3">
                                            {t('common.inactive')}
                                        </Tag>
                                    )}
                                </div>
                                    <Title level={4} className="mb-0 text-center">{i18n.language === 'ar' ? sponsor.name_ar : sponsor.name_en}</Title>
                                    <Tag color={sponsor.tier === 'diamond' ? 'purple' : sponsor.tier === 'gold' ? 'gold' : sponsor.tier === 'silver' ? 'blue' : sponsor.tier === 'legal' ? 'default' : 'green'} className="mt-2 text-[10px] bg-gold-50/50 border-gold-200 text-gold-700">
                                        {sponsor.tier ? (sponsor.tier === 'legal' ? (isRtl ? 'شريك قانوني' : 'Legal Partner') : t(`common.tiers.${sponsor.tier}`)) : t('common.tiers.partner')}
                                    </Tag>
                                    {sponsor.start_date && (
                                        <Text type="secondary" className="block text-xs mt-1">
                                            {dayjs(sponsor.start_date).format('YYYY')} - {sponsor.end_date ? dayjs(sponsor.end_date).format('YYYY') : 'Present'}
                                        </Text>
                                    )}
                                
                                <Divider className="my-4 opacity-50" />
                                
                                <div className="w-full mt-auto flex flex-col justify-end">
                                    <Text strong className="text-[10px] text-gray-400 uppercase tracking-widest block mb-1">
                                        {t('owner.sponsors.fields.services_ar', { defaultValue: 'Services & Benefits' })}
                                    </Text>
                                    <div className="min-h-[44px]">
                                        <Paragraph ellipsis={{ rows: 2 }} className="text-slate-600 mb-4 whitespace-pre-wrap">
                                            {i18n.language === 'ar' ? sponsor.services_ar : sponsor.services_en}
                                        </Paragraph>
                                    </div>

                                    <div className="h-[36px] w-full mt-auto flex items-end">
                                        {sponsor.contract_url ? (
                                            <Button 
                                                block 
                                                icon={<FilePdfOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />} 
                                                href={sponsor.contract_url} 
                                                target="_blank"
                                                className="rounded-lg bg-slate-50 border-slate-200 text-slate-700 hover:text-gold-600 hover:border-gold-600 h-full"
                                            >
                                                {t('owner.sponsors.contract_view')}
                                            </Button>
                                        ) : (
                                            <div className="w-full h-full border border-dashed border-slate-300 rounded-lg flex items-center justify-center bg-slate-50/50">
                                                <Text className="text-xs text-slate-400">{t('owner.sponsors.no_contract')}</Text>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </List.Item>
                )}
            />

            <Modal
                title={editingSponsor ? t('owner.sponsors.edit_sponsor') : t('owner.sponsors.add_sponsor')}
                open={modalVisible}
                onOk={handleSubmit}
                onCancel={() => setModalVisible(false)}
                okText={t('common.save')}
                cancelText={t('common.cancel')}
                width={800}
                className="rounded-3xl overflow-hidden"
                okButtonProps={{ className: 'h-10 px-8 rounded-lg bg-gold-600 border-gold-600' }}
            >
                <Form form={form} layout="vertical" className="mt-6" onValuesChange={handleValuesChange}>
                    <Row gutter={24}>
                        <Col span={24}>
                            <Form.Item name="tier" label={i18n.language === 'ar' ? 'نوع الراعي / الفئة' : 'Sponsor Type / Tier'} initialValue="partner">
                                <Select className="h-10 rounded-lg">
                                    <Select.Option value="diamond">{t('common.tiers.diamond')}</Select.Option>
                                    <Select.Option value="gold">{t('common.tiers.gold')}</Select.Option>
                                    <Select.Option value="silver">{t('common.tiers.silver')}</Select.Option>
                                    <Select.Option value="partner">{t('common.tiers.partner')}</Select.Option>
                                    <Select.Option value="legal">{t('common.tiers.legal')}</Select.Option>
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="name_ar" label={t('owner.sponsors.fields.name_ar')}>
                                <Input placeholder="مثال: نايكي الشرق الأوسط" className="h-10 rounded-lg text-right" dir="rtl" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="name_en" label={t('owner.sponsors.fields.name_en')}>
                                <Input placeholder="Example: Nike Middle East" className="h-10 rounded-lg" />
                            </Form.Item>
                        </Col>
                        <Col span={24}>
                            <Form.Item name="services_ar" label={t('owner.sponsors.fields.services_ar')}>
                                <Input.TextArea rows={2} placeholder="تفاصيل الرعاية، الملابس، الأدوات الرياضية..." className="rounded-lg text-right" dir="rtl" />
                            </Form.Item>
                        </Col>
                        <Col span={24}>
                            <Form.Item name="services_en" label={t('owner.sponsors.fields.services_en')}>
                                <Input.TextArea rows={2} placeholder="Sponsorship details, kits, equipment..." className="rounded-lg" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="website_url" label={t('owner.sponsors.fields.website')}>
                                <Input prefix={<LinkOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />} placeholder="https://..." className="h-10 rounded-lg" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="dates" label={i18n.language === 'ar' ? 'مدة العقد / الاتفاقية' : 'Contract Duration'}>
                                <DatePicker.RangePicker className="w-full h-10 rounded-lg" />
                            </Form.Item>
                        </Col>
                        <Col span={6}>
                            <Form.Item name="sort_order" label={t('common.sort_order')} initialValue={0}>
                                <InputNumber min={0} className="w-full h-10 rounded-lg" />
                            </Form.Item>
                        </Col>
                        <Col span={6}>
                            <Form.Item name="is_active" label={t('owner.sponsors.fields.is_active')} valuePropName="checked" initialValue={true}>
                                <Switch className="mt-2" />
                            </Form.Item>
                        </Col>
                        <Col span={24}>
                            <Form.Item name="agreement_text_ar" label={i18n.language === 'ar' ? 'تفاصيل الاتفاقية (بالعربي)' : 'Agreement Details (Arabic)'}>
                                <Input.TextArea rows={3} placeholder="..." className="rounded-lg text-right" dir="rtl" />
                            </Form.Item>
                        </Col>
                        <Col span={24}>
                            <Form.Item name="agreement_text" label={i18n.language === 'ar' ? 'تفاصيل الاتفاقية (بالإنجليزي)' : 'Agreement Details (English)'}>
                                <Input.TextArea rows={3} placeholder="..." className="rounded-lg" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item label={t('owner.sponsors.fields.logo')}>
                                <Upload
                                    listType="picture-card"
                                    fileList={logoFileList}
                                    onChange={({ fileList }) => setLogoFileList(fileList)}
                                    beforeUpload={() => false}
                                    maxCount={1}
                                    className="sponsor-logo-upload"
                                >
                                    {logoFileList.length >= 1 ? null : (
                                        <div>
                                            <PlusOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />
                                            <div style={{ marginTop: 8 }}>{t('common.upload')}</div>
                                        </div>
                                    )}
                                </Upload>
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item label={t('owner.sponsors.fields.contract')}>
                                <Upload
                                    fileList={contractFileList}
                                    onChange={({ fileList }) => setContractFileList(fileList)}
                                    beforeUpload={() => false}
                                    maxCount={1}
                                    accept=".pdf"
                                >
                                    <Button icon={<UploadOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />} className="h-10 rounded-lg w-full flex items-center justify-center">
                                        {t('common.upload')} (PDF)
                                    </Button>
                                </Upload>
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={24}>
                        <Col span={24}>
                            <Form.Item label={isRtl ? 'معرض الصور' : 'Gallery Images'}>
                                <Upload
                                    listType="picture-card"
                                    fileList={galleryFileList}
                                    onChange={({ file, fileList: newList }) => {
                                        if (file.status === 'removed' && file.uid && !file.uid.startsWith('-')) {
                                            const imgId = parseInt(file.uid);
                                            if (!isNaN(imgId)) setDeletedGalleryIds(prev => [...prev, imgId]);
                                        }
                                        setGalleryFileList(newList);
                                    }}
                                    beforeUpload={() => false}
                                    multiple
                                    accept="image/*"
                                >
                                    <div>
                                        <PlusOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />
                                        <div style={{ marginTop: 8 }}>{isRtl ? 'أضف صورة' : 'Add Photo'}</div>
                                    </div>
                                </Upload>
                            </Form.Item>
                        </Col>
                    </Row>
                </Form>
            </Modal>
            {renderDetailsDrawer()}
        </div>
    );
};

export default OwnerSponsors;
