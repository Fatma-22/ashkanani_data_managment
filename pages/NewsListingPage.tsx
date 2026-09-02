import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Card, Typography, Carousel, Tag, Empty, Spin } from 'antd';
import { CalendarOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { publicService } from '../services/publicService';
import { News } from '../types';
import { useAuth } from '../context/AuthContext';
import SEO from '../components/SEO';

const { Title, Text, Paragraph } = Typography;

export const NewsListingPage: React.FC = () => {
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    const isRtl = i18n.language === 'ar';
    const { user } = useAuth();
    const [news, setNews] = useState<News[]>([]);
    const [loading, setLoading] = useState(true);
    const [trackVisitDone, setTrackVisitDone] = useState(false);

    // Track visit only once
    useEffect(() => {
        if (!trackVisitDone) {
            publicService.trackVisit(user?.role);
            setTrackVisitDone(true);
        }
    }, [trackVisitDone, user?.role]);

    // Fetch all news only once on mount
    const fetchNews = useCallback(async () => {
        setLoading(true);
        try {
            const data = await publicService.getAllNews(1, 1000); // Fetch all news
            setNews(data.data);
        } catch (err) {
            console.error("Failed to fetch news", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchNews();
    }, [fetchNews]);

    // Memoize news items rendering to avoid unnecessary re-renders
    const newsCards = useMemo(() => {
        return news.map((n, i) => {
            const categoryToDisplay = isRtl ? (n.category_ar || n.category_en) : (n.category_en || n.category_ar);
            const titleToDisplay = isRtl ? (n.title_ar || n.title_en) : (n.title_en || n.title_ar);
            const contentToDisplay = isRtl ? (n.content_ar || n.content_en) : (n.content_en || n.content_ar);
            const plainContent = contentToDisplay.replace(/<[^>]*>?/gm, '').substring(0, 150);

            return (
                <motion.div
                    key={`${n.id}-${i}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                >
                    <Card
                        hoverable
                        className="h-full border-none shadow-sm hover:shadow-xl transition-all duration-300 rounded-2xl overflow-hidden bg-white group mx-auto"
                        cover={
                            <div className="aspect-[16/10] overflow-hidden">
                                <img
                                    src={n.main_image_url}
                                    alt={n.title_en}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    loading="lazy"
                                />
                            </div>
                        }
                        onClick={() => navigate(`/news/${n.id}`)}
                    >
                        <div className="mb-3">
                            <Tag color="#C9A24D" className="border-none px-3 py-1 rounded-md font-bold uppercase text-[10px]">
                                {categoryToDisplay}
                            </Tag>
                            <Text type="secondary" className="text-xs">
                                <CalendarOutlined className="mr-1" onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />
                                {new Date(n.published_at).toLocaleDateString(isRtl ? 'ar-EG' : 'en-US')}
                            </Text>
                        </div>
                        <Title level={4} className="!font-bold line-clamp-2 group-hover:text-[#C9A24D] transition-colors mb-4">
                            {titleToDisplay}
                        </Title>
                        <Paragraph className="text-slate-500 line-clamp-3 mb-6">
                            {plainContent}...
                        </Paragraph>
                        <div className="mt-auto">
                            <Text className="text-[#C9A24D] font-bold flex items-center gap-2">
                                {t('landing.read_more')}
                                <ArrowRightOutlined className={`${isRtl ? 'rotate-180' : ''}`} onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />
                            </Text>
                        </div>
                    </Card>
                </motion.div>
            );
        });
    }, [news, isRtl, navigate, t]);

    if (loading && news.length === 0) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <Spin size="large" />
            </div>
        );
    }

    return (
        <div className="py-12">
            <SEO 
                title={t('landing.latest_news')} 
                description={t('landing.view_all_news')}
                keywords="sports news, football transfers, athlete updates, Ashkanani Sport news"
            />
            <div className="mb-12">
                <Text className="text-[#C9A24D] font-bold tracking-[0.2em] uppercase block mb-2">{t('landing.latest_news')}</Text>
                <Title level={1} className="!text-4xl md:!text-5xl font-black">{t('landing.view_all_news')}</Title>
            </div>

            {news.length > 0 ? (
                <Carousel
                    autoplay
                    autoplaySpeed={5000}
                    infinite
                    dots
                    slidesToShow={3}
                    slidesToScroll={1}
                    responsive={[
                        {
                            breakpoint: 1024,
                            settings: {
                                slidesToShow: 2,
                                slidesToScroll: 1
                            }
                        },
                        {
                            breakpoint: 640,
                            settings: {
                                slidesToShow: 1,
                                slidesToScroll: 1
                            }
                        }
                    ]}
                    lazyLoad="progressive"
                    pauseOnHover
                    style={{ padding: '0 16px' }}
                >
                    {newsCards}
                </Carousel>
            ) : (
                <Empty description={t('landing.news_empty')} />
            )}
        </div>
    );
};
