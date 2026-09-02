import React, { useEffect, useState, useRef } from 'react';
import {
    Table, Button, Space, Typography, Modal, Form, Input,
    Switch, Upload, message, Popconfirm, Card, Select, Tag, Row, Col
} from 'antd';
import {
    PlusOutlined, EditOutlined, DeleteOutlined,
    EyeOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { newsService } from '../../services/newsService';
import { translateText } from '../../utils/helpers';
import { News } from '../../types';
import type { ColumnsType } from 'antd/es/table';
import type { UploadFile } from 'antd/es/upload/interface';
import DynamicTranslate from '../../components/DynamicTranslate';
import { useStickyState } from '../../utils/hooks';

const { Title, Text } = Typography;
const { Option } = Select;

const isArabicText = (text?: string) => {
    if (!text) return false;
    const arabicPattern = /[\u0600-\u06FF]/;
    return arabicPattern.test(text);
};

export const NewsManagement: React.FC = () => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.language === 'ar';
    const [loading, setLoading] = useState(false);
    const [news, setNews] = useState<News[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useStickyState(1, 'Admin_News_page');
    const [pageSize, setPageSize] = useStickyState(15, 'Admin_News_pageSize');

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<News | null>(null);
    const [form] = Form.useForm();
    const [mainImage, setMainImage] = useState<any[]>([]);
    const [gallery, setGallery] = useState<UploadFile[]>([]);
    const translateTimeouts = useRef<{ [key: string]: NodeJS.Timeout }>({});

    const fetchData = async (p: number) => {
        setLoading(true);
        try {
            const res = await newsService.getAll(p);
            setNews(res.data.data || res.data || []);
            setTotal(res.data.meta?.total || 0);
        } catch (err) {
            message.error(t('messages.error_load'));
        } finally {
            setLoading(false);
        }
    };

    const handleValuesChange = (changedValues: any) => {
        const fieldsToTranslate: Record<string, string> = {
            title_ar: 'title_en',
            content_ar: 'content_en',
            category_ar: 'category_en'
        };

        Object.keys(changedValues).forEach(arField => {
            const enField = fieldsToTranslate[arField];
            if (enField) {
                const value = changedValues[arField];
                if (translateTimeouts.current[arField]) {
                    clearTimeout(translateTimeouts.current[arField]);
                }

                if (!value || value.trim() === '') {
                    return;
                }

                translateTimeouts.current[arField] = setTimeout(async () => {
                    // Only translate if English field is empty
                    if (!form.getFieldValue(enField)) {
                        const translated = await translateText(value, 'ar', 'en');
                        form.setFieldsValue({ [enField]: translated });
                    }
                }, 1000);
            }
        });
    };

    useEffect(() => {
        fetchData(page);
    }, [page]);

    const handleOpenModal = async (item: News | null = null) => {
        setEditingItem(item);
        if (item) {
            const data = { ...item };
            
            // Auto-translate if English is empty and Arabic exists
            if (!data.title_en && data.title_ar) {
                data.title_en = await translateText(data.title_ar, 'ar', 'en');
            }
            if (!data.content_en && data.content_ar) {
                data.content_en = await translateText(data.content_ar, 'ar', 'en');
            }
            if (!data.category_en && data.category_ar) {
                data.category_en = await translateText(data.category_ar, 'ar', 'en');
            }

            form.setFieldsValue(data);
            setMainImage([{
                uid: '-1',
                name: 'image.png',
                status: 'done',
                url: item.main_image_url
            }]);
            setGallery(item.gallery_image_urls?.map((url, idx) => ({
                uid: idx.toString(),
                name: `image-${idx}.png`,
                status: 'done',
                url: url
            })) || []);
        } else {
            form.resetFields();
            form.setFieldValue('is_active', true);
            form.setFieldValue('is_featured', false);
            setMainImage([]);
            setGallery([]);
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            const formData = new FormData();

            Object.keys(values).forEach(key => {
                if (values[key] !== undefined && values[key] !== null) {
                    // Convert boolean to 0/1 for backend compatibility
                    if (typeof values[key] === 'boolean') {
                        formData.append(key, values[key] ? '1' : '0');
                    } else {
                        formData.append(key, values[key]);
                    }
                }
            });

            // Handle main image upload
            const mFile = mainImage[0];
            if (mFile) {
                const fileToUpload = mFile.originFileObj || (mFile instanceof File ? mFile : null);
                if (fileToUpload) {
                    formData.append('main_image', fileToUpload);
                }
            } else if (editingItem && editingItem.main_image_url) {
                formData.append('remove_main_image', '1');
            }

            // Handle gallery upload
            gallery.forEach((file, idx) => {
                const fileToUpload = file.originFileObj || (file instanceof File ? file : null);
                if (fileToUpload) {
                    formData.append(`gallery[${idx}]`, fileToUpload);
                }
            });

            setLoading(true);
            if (editingItem) {
                await newsService.update(editingItem.id, formData);
                message.success(t('messages.success_update'));
            } else {
                await newsService.create(formData);
                message.success(t('messages.success_save'));
            }
            setIsModalOpen(false);
            fetchData(page);
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
            await newsService.delete(id);
            message.success(t('messages.success_delete'));
            fetchData(page);
        } catch (err) {
            message.error(t('messages.error_delete'));
        } finally {
            setLoading(false);
        }
    };

    const columns: ColumnsType<News> = [
        {
            title: t('common.image'),
            dataIndex: 'main_image_url',
            key: 'image',
            render: (url: string) => <img src={url} alt="News" className="w-16 h-10 object-cover rounded shadow-sm" />
        },
        {
            title: t('common.title'),
            key: 'title',
            render: (_: any, record: News) => {
                const text = isRtl ? (record.title_ar || record.title_en) : (record.title_en || record.title_ar);
                return (
                    <Text strong ellipsis={{ tooltip: text }}>
                        <DynamicTranslate text={text} sourceLang={isArabicText(text) ? 'ar' : 'en'} />
                    </Text>
                );
            }
        },
        {
            title: t('common.category'),
            key: 'category',
            responsive: ['md'] as any,
            render: (_: any, record: News) => {
                const cat = isRtl ? (record.category_ar || record.category_en) : (record.category_en || record.category_ar);
                return cat ? <Tag color="blue"><DynamicTranslate text={cat} sourceLang={isArabicText(cat) ? 'ar' : 'en'} /></Tag> : null;
            }
        },
        {
            title: t('common.status'),
            dataIndex: 'is_active',
            key: 'status',
            responsive: ['lg'] as any,
            render: (active: boolean, record: News) => (
                <Space>
                    <Tag color={active ? 'green' : 'red'}>{active ? t('common.active') : t('common.inactive')}</Tag>
                    {record.is_featured && <Tag color="gold">{t('common.featured')}</Tag>}
                </Space>
            )
        },
        {
            title: t('common.actions'),
            key: 'actions',
            render: (_: any, record: News) => (
                <Space>
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
                <div>
                    <Title level={4} className="!m-0">{t('common.news_management')}</Title>
                    <Text type="secondary" className="text-sm">{t('common.news_subtitle')}</Text>
                </div>
                <Button
                    type="primary"
                    icon={<PlusOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
                    onClick={() => handleOpenModal()}
                    className="bg-[#C9A24D] border-none rounded-xl font-bold h-10 px-6 shadow-md shadow-[#C9A24D]/20 w-full sm:w-auto"
                >
                    {t('common.add_new')}
                </Button>
            </div>

            <Table
                columns={columns}
                dataSource={news}
                rowKey="id"
                loading={loading}
                pagination={{
                    current: page,
                    total: total,
                    pageSize: pageSize,
                    onChange: (p, ps) => {
                        setPage(p);
                        setPageSize(ps);
                    },
                    showSizeChanger: true
                }}
                scroll={{ x: 800 }}
            />

            <Modal
                title={(editingItem ? t('common.edit') : t('common.add')) + ' ' + t('common.news_article')}
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                onOk={handleSubmit}
                confirmLoading={loading}
                width={900}
                className="rounded-2xl"
                style={{ top: 20 }}
            >
                <Form form={form} layout="vertical" className="mt-6" onValuesChange={handleValuesChange}>
                    <Row gutter={[12, 0]}>
                        <Col xs={24} sm={12}>
                            <Form.Item name="title_ar" label={t('common.title') + ' (AR)'}>
                                <Input className="rounded-xl h-11" dir="rtl" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                            <Form.Item name="title_en" label={t('common.title') + ' (EN)'}>
                                <Input className="rounded-xl h-11" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                            <Form.Item name="category_ar" label={t('common.category') + ' (AR)'} initialValue="أخبار">
                                <Select
                                    className="w-full rounded-xl h-11"
                                    showSearch
                                    optionFilterProp="label"
                                >
                                    <Option value="أخبار" label="أخبار">أخبار</Option>
                                    <Option value="بيان صحفي" label="بيان صحفي">بيان صحفي</Option>
                                    <Option value="إعلان" label="إعلان">إعلان</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                            <Form.Item name="category_en" label={t('common.category') + ' (EN)'} initialValue="News">
                                <Select
                                    className="w-full rounded-xl h-11"
                                    showSearch
                                    optionFilterProp="label"
                                >
                                    <Option value="News" label="News">News</Option>
                                    <Option value="Press Release" label="Press Release">Press Release</Option>
                                    <Option value="Announcement" label="Announcement">Announcement</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                            <Form.Item name="content_ar" label={t('common.content') + ' (AR)'}>
                                <Input.TextArea className="rounded-xl" rows={4} dir="rtl" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                            <Form.Item name="content_en" label={t('common.content') + ' (EN)'}>
                                <Input.TextArea className="rounded-xl" rows={4} />
                            </Form.Item>
                        </Col>
                        <Col xs={12} sm={8}>
                            <Form.Item name="is_featured" label={t('common.featured')} valuePropName="checked">
                                <Switch checkedChildren={t('common.yes')} unCheckedChildren={t('common.no')} />
                            </Form.Item>
                        </Col>
                        <Col xs={12} sm={8}>
                            <Form.Item name="is_active" label={t('common.status')} valuePropName="checked">
                                <Switch checkedChildren={t('common.active')} unCheckedChildren={t('common.inactive')} />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={8}>
                            <Form.Item name="published_at" label={t('common.publish_date')}>
                                <Input type="datetime-local" className="rounded-xl h-11" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={[12, 0]}>
                        <Col xs={24} sm={12}>
                            <Form.Item label={t('common.main_image')}>
                                <Upload
                                    listType="picture-card"
                                    fileList={mainImage}
                                    onRemove={() => setMainImage([])}
                                    beforeUpload={(file) => {
                                        setMainImage([file]);
                                        return false;
                                    }}
                                    maxCount={1}
                                    className="news-image-upload"
                                >
                                    {mainImage.length < 1 && (
                                        <div>
                                            <PlusOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />
                                            <div style={{ marginTop: 8 }}>{t('common.upload')}</div>
                                        </div>
                                    )}
                                </Upload>
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                            <Form.Item label={t('common.gallery')}>
                                <Upload
                                    listType="picture-card"
                                    fileList={gallery}
                                    beforeUpload={(file) => {
                                        setGallery([...gallery, file]);
                                        return false;
                                    }}
                                    onRemove={(file) => {
                                        setGallery(gallery.filter(f => f.uid !== file.uid));
                                    }}
                                    multiple
                                    className="news-image-upload"
                                >
                                    <div>
                                        <PlusOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />
                                        <div style={{ marginTop: 8 }}>{t('common.upload')}</div>
                                    </div>
                                </Upload>
                            </Form.Item>
                        </Col>
                    </Row>
                </Form>
            </Modal>
        </Card>
    );
};
