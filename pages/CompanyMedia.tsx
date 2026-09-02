import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Typography, Tag, Empty, Button, message, Divider, Modal, Carousel, Tooltip } from 'antd';
import {
    CalendarOutlined,
    FireOutlined,
    CopyOutlined,
    SoundOutlined,
    TrophyOutlined,
    ReadOutlined,
    CloseOutlined,
    GlobalOutlined,
    PlayCircleFilled,
    RightOutlined,
    LeftOutlined,
    StarFilled,
    ArrowLeftOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { publicService, LandingPageData } from '../services/publicService';
import { LoadingScreen } from '../components/LoadingScreen';
import { News } from '../types';
import DynamicTranslate from '../components/DynamicTranslate';
import SEO from '../components/SEO';

const isArabicText = (text?: string) => {
    if (!text) return false;
    const arabicPattern = /[\u0600-\u06FF]/;
    return arabicPattern.test(text);
};

const { Title, Text, Paragraph } = Typography;

/* ─── Scrolling News Marquee ─── */
const NewsMarquee: React.FC<{ items: News[]; isRtl: boolean; onSelect: (n: News) => void }> = ({ items, isRtl, onSelect }) => {
    const { t } = useTranslation();
    if (!items.length) return null;
    // Double the items for seamless loop
    const doubled = [...items, ...items];
    return (
        <div className="relative overflow-hidden py-3" style={{ background: 'rgba(201,162,77,0.08)', borderTop: '1px solid rgba(201,162,77,0.15)', borderBottom: '1px solid rgba(201,162,77,0.15)' }}>
            <div className={`flex items-center gap-2 px-4 absolute ${isRtl ? 'right-0' : 'left-0'} top-0 bottom-0 z-10`} style={{ background: `linear-gradient(${isRtl ? 'to left' : 'to right'}, #0a0a0a 70%, transparent)` }}>
                <div className="flex items-center gap-2 px-3 py-1 rounded-full" style={{ background: '#C9A24D' }}>
                    <SoundOutlined style={{ color: '#0a0a0a', fontSize: 11 }} onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />
                    <span style={{ color: '#0a0a0a', fontWeight: 800, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                        {t('media.live')}
                    </span>
                </div>
            </div>
            <div className="marquee-track" style={{ display: 'flex', gap: 48, whiteSpace: 'nowrap', animation: `marquee-scroll ${items.length * 8}s linear infinite`, direction: isRtl ? 'rtl' : 'ltr' }}>
                {doubled.map((n, i) => (
                    <span
                        key={`${n.id}-${i}`}
                        className="inline-flex items-center gap-3 cursor-pointer group"
                        onClick={() => onSelect(n)}
                    >
                        <span className="w-1.5 h-1.5 rounded-full bg-[#C9A24D] flex-shrink-0" />
                        <span className="text-white/70 group-hover:text-[#C9A24D] transition-colors font-semibold text-sm" style={{ whiteSpace: 'nowrap' }}>
                            <DynamicTranslate
                                text={isRtl ? (n.title_ar || n.title_en) : (n.title_en || n.title_ar)}
                                sourceLang={isArabicText(isRtl ? (n.title_ar || n.title_en) : (n.title_en || n.title_ar)) ? 'ar' : 'en'}
                            />
                        </span>
                        <span className="text-white/30 text-xs font-mono">
                            {new Date(n.published_at).toLocaleDateString(isRtl ? 'ar-EG' : 'en-US', { month: 'short', day: 'numeric' })}
                        </span>
                    </span>
                ))}
            </div>
            <style>{`
                @keyframes marquee-scroll {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(${isRtl ? '50%' : '-50%'}); }
                }
                .marquee-track:hover { animation-play-state: paused; }
            `}</style>
        </div>
    );
};

/* ─── Horizontal Scroll Container ─── */
const HorizontalScroll: React.FC<{ children: React.ReactNode; title: string; icon: React.ReactNode }> = ({ children, title, icon }) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const scroll = (dir: number) => {
        if (scrollRef.current) {
            scrollRef.current.scrollBy({ left: dir * 340, behavior: 'smooth' });
        }
    };
    return (
        <div className="mb-16">
            <div className="flex items-center justify-between mb-6 px-4 md:px-12">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(201,162,77,0.12)', border: '1px solid rgba(201,162,77,0.2)' }}>
                        {icon}
                    </div>
                    <Title level={4} style={{ margin: 0, color: '#fff', fontWeight: 800 }}>{title}</Title>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => scroll(-1)} className="w-9 h-9 rounded-full border border-white/10 bg-white/5 text-white/60 hover:bg-[#C9A24D] hover:text-black hover:border-[#C9A24D] transition-all flex items-center justify-center">
                        <LeftOutlined style={{ fontSize: 12 }} onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />
                    </button>
                    <button onClick={() => scroll(1)} className="w-9 h-9 rounded-full border border-white/10 bg-white/5 text-white/60 hover:bg-[#C9A24D] hover:text-black hover:border-[#C9A24D] transition-all flex items-center justify-center">
                        <RightOutlined style={{ fontSize: 12 }} onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />
                    </button>
                </div>
            </div>
            <div ref={scrollRef} className="flex gap-5 overflow-x-auto px-4 md:px-12 pb-4 scroll-smooth" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                <style>{`.flex::-webkit-scrollbar { display: none; }`}</style>
                {children}
            </div>
        </div>
    );
};


export const CompanyMedia: React.FC = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const isRtl = i18n.language === 'ar';
    const [data, setData] = useState<LandingPageData | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedNews, setSelectedNews] = useState<News | null>(null);
    const [selectedDiscount, setSelectedDiscount] = useState<any>(null);
    const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
    const [featuredIdx, setFeaturedIdx] = useState(0);

    useEffect(() => {
        publicService.getLandingPageData()
            .then(res => {
                setData(res);
            })
            .catch(err => console.error('Failed to fetch landing data', err))
            .finally(() => setLoading(false));
    }, []);

    // Auto-rotate featured news
    const featuredNews = data?.news?.filter(n => n.is_featured) || [];
    const allNews = data?.news || [];
    const heroItems = featuredNews.length > 0 ? featuredNews : allNews.slice(0, 3);

    useEffect(() => {
        if (heroItems.length <= 1) return;
        const interval = setInterval(() => {
            setFeaturedIdx(prev => (prev + 1) % heroItems.length);
        }, 6000);
        return () => clearInterval(interval);
    }, [heroItems.length]);

    const copyToClipboard = (text: string) => {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text);
        } else {
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.style.position = 'fixed';
            ta.style.left = '-9999px';
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
        }
        message.success(t('messages.link_copied', { defaultValue: isRtl ? 'تم نسخ الكود!' : 'Code copied!' }));
    };

    if (loading) return <LoadingScreen />;

    const hasSponsors = data?.sponsors && data.sponsors.length > 0;
    const hasNews = allNews.length > 0;
    const hasDiscounts = data?.discounts && data.discounts.length > 0;
    const currentHero = heroItems[featuredIdx];

    const getNewsTitle = (n: News) => isRtl ? (n.title_ar || n.title_en) : (n.title_en || n.title_ar);
    const getNewsCategory = (n: News) => isRtl ? (n.category_ar || n.category_en) : (n.category_en || n.category_ar);
    const getNewsContent = (n: News) => isRtl ? (n.content_ar || n.content_en) : (n.content_en || n.content_ar);

    return (
        <div className="min-h-screen" style={{ background: '#0a0a0a' }}>
            <SEO 
                title={t('common.media_center')}
                description={t('common.media_center_subtitle')}
                keywords="sports media, agency news, athletic discounts, sports gallery, Ashkanani Sport media"
            />

            {/* ═══ CSS Injections ═══ */}
            <style>{`
                .media-page * { box-sizing: border-box; }
                .news-card-hover { transition: all 0.4s cubic-bezier(0.22, 1, 0.36, 1); }
                .news-card-hover:hover { transform: translateY(-6px) scale(1.02); }
                .news-card-hover:hover .card-image { transform: scale(1.08); }
                .card-image { transition: transform 0.6s cubic-bezier(0.22, 1, 0.36, 1); }
                .glass-card { background: rgba(255,255,255,0.04); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.06); }
                .gold-glow { box-shadow: 0 0 60px rgba(201,162,77,0.15); }
                .hero-dot { transition: all 0.3s ease; }
                .hero-dot.active { width: 32px; background: #C9A24D; }
                .discount-card { transition: all 0.3s ease; }
                .discount-card:hover { border-color: rgba(201,162,77,0.4); transform: translateY(-2px); }
                .sponsor-logo { transition: all 0.4s ease; opacity: 0.7; }
                .sponsor-logo:hover { opacity: 1; transform: scale(1.1); box-shadow: 0 8px 24px rgba(201,162,77,0.2); }
                .ad-banner { transition: all 0.4s ease; }
                .ad-banner:hover { transform: scale(1.02); box-shadow: 0 20px 40px rgba(0,0,0,0.4); }
                @media (max-width: 768px) {
                    .hero-grid { flex-direction: column !important; }
                    .hero-main { min-height: 50vh !important; }
                    .hero-sidebar { flex-direction: row !important; overflow-x: auto !important; }
                    .hero-sidebar > div { min-width: 200px !important; flex-shrink: 0 !important; }
                }
            `}</style>

            {/* ═══ News Ticker Marquee ═══ */}
            {hasNews && (
                <div className="pt-16">
                    <NewsMarquee items={allNews} isRtl={isRtl} onSelect={setSelectedNews} />
                </div>
            )}

            {/* ═══ Featured Hero Section ═══ */}
            {heroItems.length > 0 && (
                <div className="px-4 md:px-12 pt-8 pb-4">
                    <div className="max-w-[1600px] mx-auto">
                        <div className="flex gap-4 hero-grid" style={{ minHeight: '65vh' }}>
                            {/* Main Featured */}
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={currentHero?.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.6 }}
                                    className="relative flex-[3] rounded-3xl overflow-hidden cursor-pointer group hero-main gold-glow"
                                    style={{ minHeight: '65vh' }}
                                    onClick={() => currentHero && setSelectedNews(currentHero)}
                                >
                                    {currentHero?.main_image_url ? (
                                        <img src={currentHero.main_image_url} alt="" className="absolute inset-0 w-full h-full object-cover card-image" />
                                    ) : (
                                        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #1a1a2e, #0a0a0a)' }} />
                                    )}
                                    <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.3) 40%, transparent 70%)' }} />
                                    <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-12">
                                        <div className="flex items-center gap-3 mb-4">
                                            {currentHero && (
                                                <Tag className="border-none font-bold rounded-lg px-3 py-1 text-xs" style={{ background: '#C9A24D', color: '#0a0a0a' }}>
                                                    <DynamicTranslate
                                                        text={getNewsCategory(currentHero) || ''}
                                                        sourceLang={isArabicText(getNewsCategory(currentHero)) ? 'ar' : 'en'}
                                                    />
                                                </Tag>
                                            )}
                                            {currentHero?.is_featured && (
                                                <Tag className="border-none font-bold rounded-lg px-3 py-1 text-xs" style={{ background: 'rgba(255,215,0,0.15)', color: '#FFD700', border: '1px solid rgba(255,215,0,0.3)' }}>
                                                    <StarFilled onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} /> {t('media.featured')}
                                                </Tag>
                                            )}
                                        </div>
                                        <Title level={2} style={{ color: '#fff', fontWeight: 900, margin: 0, fontSize: 'clamp(1.5rem, 3.5vw, 2.8rem)', lineHeight: 1.15 }}>
                                            {currentHero && (
                                                <DynamicTranslate
                                                    text={getNewsTitle(currentHero)}
                                                    sourceLang={isArabicText(getNewsTitle(currentHero)) ? 'ar' : 'en'}
                                                />
                                            )}
                                        </Title>
                                        <div className="flex items-center gap-4 mt-4">
                                            <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>
                                                <CalendarOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} className="mr-2" />
                                                {currentHero && new Date(currentHero.published_at).toLocaleDateString(isRtl ? 'ar-EG' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                                            </Text>
                                        </div>
                                        {/* Dots */}
                                        {heroItems.length > 1 && (
                                            <div className="flex gap-2 mt-6">
                                                {heroItems.map((_, i) => (
                                                    <button
                                                        key={i}
                                                        className={`hero-dot h-1.5 rounded-full ${i === featuredIdx ? 'active' : 'bg-white/20 w-6'}`}
                                                        onClick={(e) => { e.stopPropagation(); setFeaturedIdx(i); }}
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            </AnimatePresence>

                            {/* Side Cards Stack */}
                            {allNews.length > 1 && (
                                <div className="flex-1 flex flex-col gap-4 hero-sidebar" style={{ minWidth: 280 }}>
                                    {allNews.slice(0, 4).map((n, i) => (
                                        <motion.div
                                            key={n.id}
                                            initial={{ opacity: 0, x: isRtl ? -20 : 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.1, duration: 0.4 }}
                                            className="relative flex-1 rounded-2xl overflow-hidden cursor-pointer group glass-card"
                                            style={{ minHeight: 120 }}
                                            onClick={() => setSelectedNews(n)}
                                        >
                                            {n.main_image_url ? (
                                                <div className="absolute inset-0 bg-[#000]">
                                                    <img src={n.main_image_url} alt="" className="w-full h-full object-contain card-image opacity-40 group-hover:opacity-60" />
                                                </div>
                                            ) : null}
                                            <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.9) 20%, transparent)' }} />
                                            <div className="relative h-full flex flex-col justify-end p-4">
                                                <Tag className="border-none font-bold rounded-md px-2 py-0 text-[10px] w-fit mb-2" style={{ background: 'rgba(201,162,77,0.15)', color: '#C9A24D' }}>
                                                    <DynamicTranslate
                                                        text={getNewsCategory(n) || ''}
                                                        sourceLang={isArabicText(getNewsCategory(n)) ? 'ar' : 'en'}
                                                    />
                                                </Tag>
                                                <Text style={{ color: '#fff', fontWeight: 700, fontSize: 13, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                    <DynamicTranslate
                                                        text={getNewsTitle(n)}
                                                        sourceLang={isArabicText(getNewsTitle(n)) ? 'ar' : 'en'}
                                                    />
                                                </Text>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ═══ All News - Horizontal Scroll ═══ */}
            {hasNews && allNews.length > 4 && (
                <HorizontalScroll
                    title={t('media.all_news')}
                    icon={<ReadOutlined style={{ color: '#C9A24D', fontSize: 16 }} onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
                >
                    {allNews.map((n, i) => (
                        <motion.div
                            key={n.id}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.05 }}
                            className="flex-shrink-0 w-[300px] rounded-2xl overflow-hidden cursor-pointer news-card-hover glass-card"
                            onClick={() => setSelectedNews(n)}
                        >
                            <div className="relative h-44 overflow-hidden">
                                {n.main_image_url ? (
                                    <img src={n.main_image_url} alt="" className="w-full h-full object-cover card-image" />
                                ) : (
                                    <div className="w-full h-full" style={{ background: 'linear-gradient(135deg, #1a1a2e, #16213e)' }} />
                                )}
                                <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)' }} />
                                <Tag className="absolute top-3 left-3 border-none font-bold rounded-lg px-3 py-0.5 text-[11px]" style={{ background: '#C9A24D', color: '#0a0a0a' }}>
                                    <DynamicTranslate
                                        text={getNewsCategory(n) || ''}
                                        sourceLang={isArabicText(getNewsCategory(n)) ? 'ar' : 'en'}
                                    />
                                </Tag>
                            </div>
                            <div className="p-5">
                                <Text className="block mb-3" style={{ color: '#fff', fontWeight: 700, fontSize: 14, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                    <DynamicTranslate
                                        text={getNewsTitle(n)}
                                        sourceLang={isArabicText(getNewsTitle(n)) ? 'ar' : 'en'}
                                    />
                                </Text>
                                <div className="flex items-center justify-between">
                                    <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11 }}>
                                        <CalendarOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} className="mr-1" />
                                        {new Date(n.published_at).toLocaleDateString(isRtl ? 'ar-EG' : 'en-US', { month: 'short', day: 'numeric' })}
                                    </Text>
                                    <span className="text-[#C9A24D] text-xs font-bold">
                                        {t('media.read_more')}
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </HorizontalScroll>
            )}

            {/* ═══ Discounts & Offers Section ═══ */}
            {hasDiscounts && (
                <HorizontalScroll
                    title={t('media.exclusive_offers')}
                    icon={<FireOutlined style={{ color: '#C9A24D', fontSize: 16 }} onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
                >
                    {data!.discounts.map((d, i) => (
                        <motion.div
                            key={d.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.08 }}
                            className="flex-shrink-0 w-[300px] h-[340px] rounded-2xl overflow-hidden discount-card flex flex-col cursor-pointer"
                            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(201,162,77,0.12)' }}
                            onClick={() => {
                                setSelectedDiscount(d);
                                setIsDiscountModalOpen(true);
                            }}
                        >
                            {d.sponsor && (
                                <div className="px-4 py-2.5 flex items-center gap-2.5" style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center p-1 flex-shrink-0">
                                        <img src={d.sponsor.logo_url} alt="" className="w-full h-full object-contain" />
                                    </div>
                                    <span className="text-[11px] font-bold text-[#C9A24D] truncate">
                                        {isRtl ? d.sponsor.name_ar : d.sponsor.name_en}
                                    </span>
                                </div>
                            )}
                            <div className="h-40 overflow-hidden flex-shrink-0 bg-[#000]">
                                {d.image_url ? (
                                    <img src={d.image_url} alt="" className="w-full h-full object-contain" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(201,162,77,0.1), rgba(201,162,77,0.03))' }}>
                                        <FireOutlined style={{ color: 'rgba(201,162,77,0.3)', fontSize: 40 }} onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />
                                    </div>
                                )}
                            </div>
                            <div className="p-5 flex flex-col flex-1">
                                <Text className="block font-bold mb-2" style={{ color: '#fff', fontSize: 14, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                    <DynamicTranslate
                                        text={isRtl ? (d.title_ar || d.title_en) : (d.title_en || d.title_ar)}
                                        sourceLang={isArabicText(isRtl ? (d.title_ar || d.title_en) : (d.title_en || d.title_ar)) ? 'ar' : 'en'}
                                    />
                                </Text>
                                <div className="mt-auto">
                                    <Button
                                        block
                                        type="primary"
                                        className="h-10 rounded-xl bg-[#C9A24D] border-none text-black font-bold"
                                    >
                                        {isRtl ? 'عرض التفاصيل' : 'View Details'}
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </HorizontalScroll>
            )}

            {/* ═══ Sponsors & Partners (Unified) ═══ */}
            {hasSponsors && (
                <div className="px-4 md:px-12 pb-20">
                    <div className="max-w-[1600px] mx-auto">
                        <Divider style={{ borderColor: 'rgba(255,255,255,0.06)', margin: '0 0 48px 0' }} />
                        <div className="text-center mb-12">
                            <TrophyOutlined style={{ color: '#C9A24D', fontSize: 28 }} onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />
                            <Title level={4} style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 800, margin: '12px 0 0', letterSpacing: '0.2em', textTransform: 'uppercase', fontSize: 12 }}>
                                {isRtl ? 'الرعاة والشركاء' : 'Sponsors & Partners'}
                            </Title>
                        </div>
                        <div className="flex items-center justify-center flex-wrap gap-10 md:gap-14">
                            {data!.sponsors.map(s => (
                                <Tooltip key={s.id} title={isRtl ? s.name_ar : s.name_en}>
                                    <motion.div
                                        whileHover={{ scale: 1.1 }}
                                        className="cursor-pointer sponsor-logo rounded-2xl flex items-center justify-center bg-white shadow-sm"
                                        style={{
                                            padding: '12px',
                                            width: 110,
                                            height: 110,
                                        }}
                                        onClick={() => navigate(`/sponsors/${s.id}`)}
                                    >
                                        <img src={s.logo_url} alt={s.name_en} className="h-full w-auto object-contain max-h-[50px]" />
                                    </motion.div>
                                </Tooltip>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* No Content Fallback */}
            {!hasNews && !hasDiscounts && !hasSponsors && (
                <div className="flex items-center justify-center py-40">
                    <Empty
                        description={<Text style={{ color: 'rgba(255,255,255,0.4)' }}>{t('media.no_content')}</Text>}
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                    />
                </div>
            )}

            {/* ═══ NEWS DETAILS MODAL ═══ */}
            <Modal
                open={!!selectedNews}
                onCancel={() => setSelectedNews(null)}
                footer={null}
                width={900}
                centered
                className="news-details-modal"
                closeIcon={<CloseOutlined className="bg-white/20 hover:bg-white/40 text-white rounded-full p-2 transition-all" onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
                styles={{ content: { padding: 0, borderRadius: 24, overflow: 'hidden', background: '#111' } }}
            >
                {selectedNews && (
                    <div className="overflow-hidden">
                        {(selectedNews.gallery_image_urls && selectedNews.gallery_image_urls.length > 0) ? (
                            <div className="relative group/carousel">
                                <Carousel
                                    arrows
                                    infinite
                                    adaptiveHeight={false}
                                    draggable
                                    className="news-carousel h-[300px] md:h-[500px] bg-black shadow-inner"
                                >
                                    {[selectedNews.main_image_url, ...selectedNews.gallery_image_urls].map((url, idx) => (
                                        <div key={idx} className="h-[300px] md:h-[500px] outline-none">
                                            <img src={url} alt="" className="w-full h-full object-contain" />
                                        </div>
                                    ))}
                                </Carousel>
                                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/40 backdrop-blur-md text-white px-4 py-1.5 rounded-full text-xs font-bold border border-white/20">
                                    {t('media.swipe_hint')}
                                </div>
                            </div>
                        ) : selectedNews.main_image_url ? (
                            <div className="h-[350px] md:h-[450px] bg-black">
                                <img src={selectedNews.main_image_url} alt="" className="w-full h-full object-contain" />
                            </div>
                        ) : null}
                        <div className="p-8 md:p-10" style={{ background: '#111' }}>
                            <div className="flex items-center gap-2 mb-4">
                                <Tag className="border-none font-bold rounded-lg px-3" style={{ background: '#C9A24D', color: '#0a0a0a' }}>
                                    <DynamicTranslate
                                        text={getNewsCategory(selectedNews) || ''}
                                        sourceLang={isArabicText(getNewsCategory(selectedNews)) ? 'ar' : 'en'}
                                    />
                                </Tag>
                                <Text style={{ color: 'rgba(255,255,255,0.4)' }} className="flex items-center gap-2">
                                    <CalendarOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />
                                    {new Date(selectedNews.published_at).toLocaleDateString(isRtl ? 'ar-EG' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </Text>
                            </div>
                            <Title level={2} style={{ color: '#fff', fontWeight: 900, margin: 0, lineHeight: 1.3 }} className="mb-6">
                                <DynamicTranslate
                                    text={getNewsTitle(selectedNews)}
                                    sourceLang={isArabicText(getNewsTitle(selectedNews)) ? 'ar' : 'en'}
                                />
                            </Title>
                            <Divider style={{ borderColor: 'rgba(255,255,255,0.06)', margin: '24px 0' }} />
                            <div
                                className="text-lg leading-relaxed whitespace-pre-wrap"
                                style={{ color: 'rgba(255,255,255,0.65)' }}
                                dir={isRtl ? 'rtl' : 'ltr'}
                            >
                                <DynamicTranslate
                                    text={getNewsContent(selectedNews)}
                                    sourceLang={isArabicText(getNewsContent(selectedNews)) ? 'ar' : 'en'}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

            {/* ═══ DISCOUNT DETAILS MODAL ═══ */}
            <Modal
                open={isDiscountModalOpen}
                onCancel={() => setIsDiscountModalOpen(false)}
                footer={null}
                width={700}
                centered
                className="discount-details-modal"
                closeIcon={<CloseOutlined className="bg-white/20 hover:bg-white/40 text-white rounded-full p-2 transition-all" onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
                styles={{ content: { padding: 0, borderRadius: 24, overflow: 'hidden', background: '#111' } }}
            >
                {selectedDiscount && (
                    <div className="overflow-hidden">
                        <div className="h-80 md:h-96 bg-[#0a0a0a] relative group flex items-center justify-center overflow-hidden">
                            {(() => {
                                const images = [selectedDiscount.image_url, ...(selectedDiscount.gallery_image_urls || [])].filter(Boolean);
                                if (images.length > 1) {
                                    return (
                                        <div className="relative h-full w-full gallery-carousel">
                                            <Carousel
                                                arrows={true}
                                                infinite={true}
                                                autoplay={false}
                                                draggable={true}
                                                className="news-carousel h-full"
                                            >
                                                {images.map((url, idx) => (
                                                    <div key={idx} className="h-80 md:h-96 flex items-center justify-center bg-black">
                                                        <img
                                                            src={url}
                                                            alt={`Offer Image ${idx}`}
                                                            className="w-full h-full object-contain"
                                                        />
                                                    </div>
                                                ))}
                                            </Carousel>
                                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md text-white px-3 py-1 rounded-full text-[10px] font-bold border border-white/20">
                                                {isRtl ? 'اسحب لمشاهدة الصور' : 'Swipe to see more'}
                                            </div>
                                        </div>
                                    );
                                } else if (images.length === 1) {
                                    return (
                                        <img src={images[0]} alt="" className="w-full h-full object-contain" />
                                    );
                                } else {
                                    return (
                                        <FireOutlined className="text-[#C9A24D] text-6xl opacity-20" onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />
                                    );
                                }
                            })()}
                            <div className="absolute top-4 left-4 z-10">
                                <Tag color="#C9A24D" style={{ color: '#000', fontWeight: 'bold', borderRadius: '6px', border: 'none' }}>
                                    {isRtl ? 'عرض حصري' : 'Exclusive Offer'}
                                </Tag>
                            </div>
                        </div>

                        <div className="p-8 md:p-10" style={{ background: '#111' }}>
                            <div className="flex items-center gap-4 mb-4">
                                {selectedDiscount.sponsor && (
                                    <Tag className="border-none font-bold rounded-lg px-3 py-1 flex items-center gap-2" style={{ background: 'rgba(255,255,255,0.05)', color: '#C9A24D' }}>
                                        <div className="w-4 h-4 rounded-full bg-white p-0.5">
                                            <img src={selectedDiscount.sponsor.logo_url} alt="" className="w-full h-full object-contain" />
                                        </div>
                                        {isRtl ? selectedDiscount.sponsor.name_ar : selectedDiscount.sponsor.name_en}
                                    </Tag>
                                )}

                            </div>

                            <Title level={2} style={{ color: '#fff', fontWeight: 900, margin: 0, lineHeight: 1.3 }} className="mb-6">
                                <DynamicTranslate
                                    text={isRtl ? (selectedDiscount.title_ar || selectedDiscount.title_en) : (selectedDiscount.title_en || selectedDiscount.title_ar)}
                                    sourceLang={isArabicText(isRtl ? (selectedDiscount.title_ar || selectedDiscount.title_en) : (selectedDiscount.title_en || selectedDiscount.title_ar)) ? 'ar' : 'en'}
                                />
                            </Title>

                            <Divider style={{ borderColor: 'rgba(255,255,255,0.06)', margin: '24px 0' }} />

                            <div className="mb-8">
                                <Text className="block mb-3" style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                    {isRtl ? 'وصف العرض الكامل' : 'FULL OFFER DESCRIPTION'}
                                </Text>
                                <div className="text-lg leading-relaxed whitespace-pre-wrap" style={{ color: 'rgba(255,255,255,0.65)' }} dir={isRtl ? 'rtl' : 'ltr'}>
                                    <DynamicTranslate
                                        text={isRtl ? (selectedDiscount.description_ar || selectedDiscount.description_en) : (selectedDiscount.description_en || selectedDiscount.description_ar)}
                                        sourceLang={isArabicText(isRtl ? (selectedDiscount.description_ar || selectedDiscount.description_en) : (selectedDiscount.description_en || selectedDiscount.description_ar)) ? 'ar' : 'en'}
                                    />
                                </div>
                            </div>

                            {selectedDiscount.code && (
                                <div className="bg-white/5 rounded-2xl p-6 border border-white/10 relative overflow-hidden">
                                    <div className="relative z-10">
                                        <Text className="block text-white/30 font-bold text-[10px] uppercase tracking-[0.2em] mb-4 text-center" style={{ textTransform: 'uppercase' }}>
                                            {isRtl ? 'كود الخصم الحصري' : 'EXCLUSIVE PROMO CODE'}
                                        </Text>
                                        <div className="flex flex-col sm:flex-row items-center gap-4">
                                            <div className="flex-1 bg-black/40 border-2 border-dashed border-[#C9A24D]/30 rounded-xl px-6 py-4 flex items-center justify-center w-full">
                                                <Text className="font-mono font-black text-2xl tracking-[0.3em] text-[#C9A24D]">{selectedDiscount.code}</Text>
                                            </div>
                                            <Button
                                                type="primary"
                                                size="large"
                                                icon={<CopyOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
                                                className="bg-[#C9A24D] border-none h-14 px-8 rounded-xl font-bold text-black w-full sm:w-auto"
                                                onClick={() => copyToClipboard(selectedDiscount.code!)}
                                            >
                                                {isRtl ? 'نسخ الكود' : 'Copy Code'}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <Button
                                block
                                size="large"
                                className="mt-10 h-14 rounded-xl font-bold bg-white/5 text-white border border-white/10 hover:!bg-white/10"
                                onClick={() => setIsDiscountModalOpen(false)}
                            >
                                {isRtl ? 'إغلاق' : 'Close'}
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default CompanyMedia;
