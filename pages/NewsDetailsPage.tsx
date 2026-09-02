import React, { useEffect, useState } from 'react';
import { Row, Col, Typography, Tag, Space, Divider, Button, Card, Image, Spin, Carousel } from 'antd';
import { CalendarOutlined, ArrowLeftOutlined, TagOutlined, ShareAltOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { publicService } from '../services/publicService';
import { News } from '../types';
import { useAuth } from '../context/AuthContext';

import DynamicTranslate from '../components/DynamicTranslate';
import SEO from '../components/SEO';

const { Title, Text, Paragraph } = Typography;

export const NewsDetailsPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    const isRtl = i18n.language === 'ar';
    const { user } = useAuth();
    const [news, setNews] = useState<News | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        publicService.trackVisit(user?.role);
    }, []);

    const isArabicText = (text?: string) => {
        if (!text) return false;
        const arabicPattern = /[\u0600-\u06FF]/;
        return arabicPattern.test(text);
    };

    useEffect(() => {
        const fetchDetails = async () => {
            if (!id) return;
            setLoading(true);
            try {
                const data = await publicService.getNewsDetails(parseInt(id));
                setNews(data);
            } catch (err) {
                console.error("Failed to fetch news details", err);
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [id]);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <Spin size="large" />
            </div>
        );
    }

    if (!news) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Title level={2}>{t('messages.item_not_found')}</Title>
                <Button type="primary" onClick={() => navigate('/news')}>{t('landing.view_all_news')}</Button>
            </div>
        );
    }

    const categoryToDisplay = isRtl ? (news.category_ar || news.category_en) : (news.category_en || news.category_ar);
    const titleToDisplay = isRtl ? (news.title_ar || news.title_en) : (news.title_en || news.title_ar);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-12"
        >
            <SEO 
                title={titleToDisplay}
                description={isRtl ? news.content_ar.replace(/<[^>]*>?/gm, '').substring(0, 160) : news.content_en.replace(/<[^>]*>?/gm, '').substring(0, 160)}
                image={news.main_image_url}
                type="article"
            />
            <div className="max-w-4xl mx-auto">
                <Button
                    type="link"
                    icon={<ArrowLeftOutlined className={`${isRtl ? 'rotate-180' : ''}`} onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
                    onClick={() => navigate(-1)}
                    className="mb-8 p-0 text-[#C9A24D] font-bold"
                >
                    {t('common.back')}
                </Button>

                <div className="mb-8">
                    <Space size="middle" className="mb-4">
                        <Tag color="#C9A24D" className="border-none px-4 py-1 rounded-md font-bold text-xs uppercase">
                            <DynamicTranslate text={categoryToDisplay} sourceLang={isArabicText(categoryToDisplay) ? 'ar' : 'en'} />
                        </Tag>
                        <Text type="secondary" className="text-sm">
                            <CalendarOutlined className="mr-1" onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />
                            {new Date(news.published_at).toLocaleDateString(isRtl ? 'ar-EG' : 'en-US')}
                        </Text>
                    </Space>
                    <Title className="!text-3xl md:!text-5xl !font-black !m-0 !leading-tight tracking-tight">
                        <DynamicTranslate text={titleToDisplay} sourceLang={isArabicText(titleToDisplay) ? 'ar' : 'en'} />
                    </Title>
                </div>

                <div className="rounded-3xl overflow-hidden mb-12 shadow-2xl">
                    <Image
                        src={news.main_image_url}
                        alt={news.title_en}
                        className="w-full h-auto object-cover max-h-[500px]"
                        preview={true}
                    />
                </div>

                <div className="bg-white p-8 md:p-12 rounded-[2rem] shadow-sm mb-12 text-lg leading-relaxed text-slate-700">
                    <div
                        dangerouslySetInnerHTML={{ __html: isRtl ? news.content_ar : news.content_en }}
                        className="prose prose-slate max-w-none"
                    />
                </div>

                {news.gallery_image_urls && news.gallery_image_urls.length > 0 && (
                    <div className="mb-12">
                        <Divider orientation={isRtl ? 'right' : 'left'}>
                            <Title level={3} className="!m-0 !font-bold">
                                {t('media.photo_gallery')}
                            </Title>
                        </Divider>
                        <Row gutter={[16, 16]}>
                            {news.gallery_image_urls.map((img, idx) => (
                                <Col key={idx} xs={12} md={8}>
                                    <div className="rounded-2xl overflow-hidden aspect-square shadow-sm hover:shadow-lg transition-all duration-300">
                                        <Image
                                            src={img}
                                            alt={`Gallery image ${idx + 1}`}
                                            className="w-full h-full object-cover"
                                            preview={true}
                                        />
                                    </div>
                                </Col>
                            ))}
                        </Row>
                    </div>
                )}

                <div className="border-t border-slate-100 pt-12 flex justify-between items-center">
                    <Space size="large">
                        <Button
                            shape="circle"
                            size="large"
                            icon={<ShareAltOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
                            className="text-slate-400 hover:!text-[#C9A24D]"
                        />
                    </Space>
                    <Button
                        type="primary"
                        size="large"
                        onClick={() => navigate('/news')}
                        className="bg-[#C9A24D] border-none rounded-xl font-bold h-12 px-8"
                    >
                        {t('landing.view_all_news')}
                    </Button>
                </div>
            </div>

            <style>{`
                .prose p { margin-bottom: 1.5em; }
                .prose h1, .prose h2, .prose h3 { font-weight: 800; color: #1a1a1a; margin-top: 2em; margin-bottom: 1em; }
                .prose img { border-radius: 1.5rem; margin: 2rem 0; }
                .prose ul, .prose ol { margin-left: 1.5rem; margin-bottom: 2rem; }
                .prose li { margin-bottom: 0.5rem; }
            `}</style>
        </motion.div>
    );
};
