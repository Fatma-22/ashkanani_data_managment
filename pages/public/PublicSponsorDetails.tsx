import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Typography, Row, Col, Card, Spin, Empty, Button,
    Tag, Divider, Image, List, Badge, Descriptions, Space, Carousel, Modal, message
} from 'antd';
const { Title, Paragraph, Text } = Typography;
import {
    GlobalOutlined,
    ArrowLeftOutlined,
    CalendarOutlined,
    SafetyCertificateOutlined,
    CheckCircleFilled,
    PictureOutlined,
    TagOutlined,
    StarFilled,
    CrownFilled,
    TrophyFilled,
    SafetyCertificateFilled,
    TeamOutlined,
    FireOutlined,
    CopyOutlined,
    ShareAltOutlined
} from '@ant-design/icons';
import { publicService } from '../../services/publicService';
import { Sponsor, Discount } from '../../types';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import DynamicTranslate from '../../components/DynamicTranslate';
import SEO from '../../components/SEO';

const isArabicText = (text?: string) => {
    if (!text) return false;
    const arabicPattern = /[\u0600-\u06FF]/;
    return arabicPattern.test(text);
};

const TIER_CONFIG: Record<string, { icon: React.ReactNode, color: string, labelAr: string, labelEn: string }> = {
    'diamond': { icon: <CrownFilled onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />, color: '#B9F2FF', labelAr: 'الراعي الماسي', labelEn: 'Diamond Sponsor' },
    'gold': { icon: <TrophyFilled onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />, color: '#FFD700', labelAr: 'الراعي الذهبي', labelEn: 'Gold Sponsor' },
    'silver': { icon: <SafetyCertificateFilled onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />, color: '#C0C0C0', labelAr: 'الراعي الفضي', labelEn: 'Silver Sponsor' },
    'partner': { icon: <TeamOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />, color: '#52C41A', labelAr: 'شريك استراتيجي', labelEn: 'Strategic Partner' },
    'legal': { icon: <SafetyCertificateFilled onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />, color: '#000000', labelAr: 'شريك قانوني', labelEn: 'Legal Partner' },
};

export const PublicSponsorDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    const isAr = i18n.language === 'ar';
    const [sponsor, setSponsor] = useState<Sponsor | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedDiscount, setSelectedDiscount] = useState<any>(null);
    const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);

    useEffect(() => {
        if (id) {
            publicService.getSponsorDetails(parseInt(id)).then(res => {
                setSponsor(res);
            }).catch(err => {
                console.error('Failed to fetch sponsor details', err);
            }).finally(() => {
                setLoading(false);
            });
        }
    }, [id]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-[#0a0a0a]">
                <Spin size="large" />
            </div>
        );
    }

    if (!sponsor) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC]">
                <Empty description={isAr ? 'لم يتم العثور على بيانات الراعي' : 'Sponsor data not found'} />
                <Button onClick={() => navigate('/sponsors')} className="mt-4">{isAr ? 'العودة للقائمة' : 'Back to Listing'}</Button>
            </div>
        );
    }

    const tierInfo = sponsor.tier ? TIER_CONFIG[sponsor.tier] : TIER_CONFIG['partner'];

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-20">
            <SEO 
                title={isAr ? sponsor.name_ar : sponsor.name_en}
                description={isAr ? (sponsor.services_ar || sponsor.services_en) : (sponsor.services_en || sponsor.services_ar)}
                image={sponsor.logo_url}
            />
            {/* Top Navigation Bar */}
            <div className="bg-[#0a0a0a] pt-12 pb-4 px-6 border-b border-white/5">
                <div className="max-w-7xl mx-auto">
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
                        <Button
                            icon={<ArrowLeftOutlined rotate={isAr ? 180 : 0} onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
                            onClick={() => navigate('/sponsors')}
                            className="bg-white border-none text-black hover:!bg-[#C9A24D] hover:!text-black h-10 px-6 rounded-xl font-black flex items-center transition-all shadow-lg"
                        >
                            {isAr ? 'العودة لقائمة الرعاة' : 'Back to Sponsors'}
                        </Button>
                        <Button
                            icon={<ShareAltOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
                            onClick={() => {
                                const apiDomain = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'https://api.ashkananitransfer.com';
                                const sponsorName = sponsor.name_en ? sponsor.name_en.replace(/\s+/g, '-').replace(/[^\w-]/g, '') : id;
                                const shareUrl = `${apiDomain}/share/sponsor/${sponsorName}`;
                                navigator.clipboard.writeText(shareUrl).then(() => {
                                    message.success(t('landing.share_link_copied'));
                                }).catch(() => {
                                    message.error(t('landing.share_link_failed'));
                                });
                            }}
                            className="bg-[#C9A24D] border-none text-black hover:!bg-white hover:!text-black h-10 px-6 rounded-xl font-black flex items-center transition-all shadow-lg"
                        >
                            {isAr ? 'مشاركة' : 'Share'}
                        </Button>
                    </motion.div>
                </div>
            </div>

            {/* Top Gallery Slider */}
            {sponsor.images && sponsor.images.length > 0 && (
                <div className="relative h-[45vh] md:h-[65vh] w-full overflow-hidden bg-[#0a0a0a]">
                    <Carousel
                        autoplay
                        draggable
                        arrows
                        dots={{ className: 'custom-dots-top' }}
                        className="hero-carousel h-full"
                    >
                        {sponsor.images.map((img, idx) => (
                            <div key={idx} className="h-full">
                                <div className="relative h-[45vh] md:h-[65vh] w-full group flex items-center justify-center bg-black">
                                    <div className="absolute inset-0 z-0">
                                        <Image
                                            src={typeof img === 'string' ? img : img.image_url}
                                            preview={false}
                                            className="w-full h-full object-cover blur-2xl opacity-30"
                                        />
                                    </div>
                                    <Image
                                        src={typeof img === 'string' ? img : img.image_url}
                                        alt={`Hero Gallery ${idx}`}
                                        className="relative z-10 max-w-full max-h-full object-contain transition-transform duration-700 hover:scale-105"
                                        preview={{ mask: isAr ? 'عرض' : 'View' }}
                                    />
                                    <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#0a0a0a] to-transparent pointer-events-none z-20" />
                                </div>
                            </div>
                        ))}
                    </Carousel>
                </div>
            )}

            {/* Header / Hero Information */}
            <div className="relative bg-[#0a0a0a] pt-8 pb-32 overflow-hidden border-t border-white/5">
                <div className="absolute inset-0">
                    <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] via-transparent to-[#F8FAFC]" />
                    <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#C9A24D 0.5px, transparent 0.5px)', backgroundSize: '10px 10px' }} />
                </div>

                <div className="relative z-10 max-w-7xl mx-auto px-6">
                    <Row gutter={[48, 48]} align="middle">
                        <Col xs={24} md={6}>
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-white p-6 rounded-3xl shadow-2xl relative overflow-hidden group mx-auto max-w-[200px] md:max-w-none"
                            >
                                <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: tierInfo.color }} />
                                <Image
                                    src={sponsor.logo_url}
                                    alt={isAr ? sponsor.name_ar : sponsor.name_en}
                                    preview={false}
                                    className="w-full h-auto object-contain transition-transform duration-500 group-hover:scale-110"
                                />
                            </motion.div>
                        </Col>
                        <Col xs={24} md={18} className="text-center md:text-start">
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                                <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
                                    <Tag color={tierInfo.color} style={{ color: '#1a1a1a', fontWeight: 'bold', fontSize: '12px', padding: '4px 12px', borderRadius: '8px' }}>
                                        <span className="flex items-center gap-2">
                                            {tierInfo.icon}
                                            {isAr ? tierInfo.labelAr : tierInfo.labelEn}
                                        </span>
                                    </Tag>
                                </div>
                                <Title className="!text-white !font-black !m-0 !text-3xl md:!text-5xl lg:!text-6xl mb-6">
                                    {isAr ? sponsor.name_ar : sponsor.name_en}
                                </Title>
                            </motion.div>
                        </Col>
                    </Row>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 -mt-20 relative z-20">
                <Row gutter={[32, 32]}>
                    {/* Information Section */}
                    <Col xs={24} lg={16}>
                        <div className="flex flex-col gap-8">
                            {/* Website Section */}
                            {sponsor.website_url && (
                                <Card className="rounded-3xl border-none shadow-xl bg-white p-4">
                                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-[#C9A24D]/10 flex items-center justify-center text-[#C9A24D]">
                                                <GlobalOutlined style={{ fontSize: '24px' }} onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />
                                            </div>
                                            <div>
                                                <Text className="text-gray-400 text-[10px] uppercase font-black tracking-widest block">{isAr ? 'الموقع الرسمي' : 'Official Website'}</Text>
                                                <Title level={4} className="!m-0 !font-bold">
                                                    {(() => {
                                                        try {
                                                            return new URL(sponsor.website_url || "").hostname;
                                                        } catch (e) {
                                                            return sponsor.website_url || "";
                                                        }
                                                    })()}
                                                </Title>
                                            </div>
                                        </div>
                                        <Button
                                            type="primary"
                                            size="large"
                                            icon={<GlobalOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
                                            href={sponsor.website_url}
                                            target="_blank"
                                            className="h-12 px-8 rounded-xl font-black bg-[#C9A24D] border-none shadow-lg hover:scale-105 transition-transform"
                                        >
                                            {isAr ? 'زيارة الموقع' : 'Visit Website'}
                                        </Button>
                                    </div>
                                </Card>
                            )}

                            {/* Offers & Discounts Section */}
                            <Card className="rounded-3xl border-none shadow-xl bg-white overflow-hidden">
                                <div className="p-8 bg-[#1a1a1a] mb-8">
                                    <Title level={3} className="!text-white !font-black !m-0 flex items-center gap-3">
                                        <TagOutlined style={{ color: '#C9A24D' }} onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />
                                        {isAr ? 'العروض والخصومات الحصرية' : 'Exclusive Offers & Discounts'}
                                    </Title>
                                </div>

                                <div className="px-8 pb-8">
                                    {sponsor.discounts && sponsor.discounts.length > 0 ? (
                                        <Row gutter={[24, 24]}>
                                            {sponsor.discounts.map((discount: Discount) => (
                                                <Col key={discount.id} xs={24} sm={12}>
                                                    <motion.div
                                                        whileHover={{ y: -5 }}
                                                        className="h-full rounded-3xl bg-gray-50 border border-gray-100 overflow-hidden hover:border-[#C9A24D]/30 transition-all hover:bg-white hover:shadow-xl group flex flex-col cursor-pointer"
                                                        onClick={() => {
                                                            setSelectedDiscount(discount);
                                                            setIsDiscountModalOpen(true);
                                                        }}
                                                    >
                                                        {/* Discount Card Image */}
                                                        <div className="h-44 overflow-hidden relative bg-[#0a0a0a]">
                                                            {discount.image_url ? (
                                                                <img src={discount.image_url} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#1a1103] to-[#0a0a0a]">
                                                                    <FireOutlined className="text-[#C9A24D] text-4xl opacity-20" onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />
                                                                </div>
                                                            )}
                                                            <div className="absolute top-3 left-3">
                                                                <Tag className="m-0 border-none bg-black/60 backdrop-blur-md text-[#C9A24D] font-bold text-[10px] rounded-lg px-2.5 py-1">
                                                                    {isAr ? 'عرض حصري' : 'Exclusive Offer'}
                                                                </Tag>
                                                            </div>
                                                        </div>

                                                        <div className="p-6 flex flex-col flex-1">
                                                            <div className="flex justify-between items-start mb-4">
                                                                <Title level={4} className="!text-[#1a1a1a] !m-0 group-hover:text-[#C9A24D] transition-colors leading-tight line-clamp-1">
                                                                    {isAr ? discount.title_ar : discount.title_en}
                                                                </Title>
                                                            </div>


                                                            <div className="mt-auto pt-4 border-t border-gray-100/50 flex items-center justify-between">

                                                                <Button
                                                                    type="primary"
                                                                    size="small"
                                                                    className="bg-[#C9A24D] border-none text-black font-bold h-8 px-4 rounded-lg text-xs"
                                                                >
                                                                    {isAr ? 'التفاصيل' : 'Details'}
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                </Col>
                                            ))}
                                        </Row>
                                    ) : (
                                        <div className="py-12 bg-gray-50 rounded-3xl border border-dashed border-gray-200 text-center">
                                            <Empty
                                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                                description={<Text className="text-gray-400">{isAr ? 'لا توجد عروض حالية لهذا الراعي' : 'No active offers from this sponsor'}</Text>}
                                            />
                                        </div>
                                    )}
                                </div>
                            </Card>

                            {/* Gallery Slider Section Moved Top */}
                        </div>
                    </Col>

                    {/* Sidebar / Brief Stats */}
                    <Col xs={24} lg={8}>
                        <div className="flex flex-col gap-8 sticky top-24">
                            <Card className="rounded-3xl border-none shadow-xl bg-white p-6">
                                <Title level={4} className="!font-black mb-6">{isAr ? 'ملخص الشريك' : 'Partner Brief'}</Title>
                                <Space direction="vertical" className="w-full" size="middle">
                                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl">
                                        <TrophyFilled className="text-[#C9A24D]" onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />
                                        <div>
                                            <Text className="text-gray-400 text-[10px] uppercase font-black tracking-widest block">{isAr ? 'تصنيف الشراكة' : 'Partnership Tier'}</Text>
                                            <Text className="font-bold">{isAr ? tierInfo.labelAr : tierInfo.labelEn}</Text>
                                        </div>
                                    </div>
                                </Space>
                                <Divider />
                                <div className="p-4 bg-[#C9A24D]/5 rounded-2xl border border-[#C9A24D]/10">
                                    <Title level={5} className="!m-0 !text-[#C9A24D]">{isAr ? 'خدمات الشريك' : 'Partner Services'}</Title>
                                    <Paragraph className="mt-2 text-gray-500 text-xs mb-0">
                                        {isAr ? (sponsor.services_ar || sponsor.services_en) : (sponsor.services_en || sponsor.services_ar)}
                                    </Paragraph>
                                </div>
                            </Card>
                        </div>
                    </Col>
                </Row>
            </div>

            <style>{`
                .hero-carousel .ant-carousel-arrow { color: #C9A24D !important; font-size: 32px; z-index: 20; width: 50px; height: 50px; }
                .hero-carousel .ant-carousel-arrow::before { content: none; }
                .custom-dots-top { bottom: 40px !important; }
                .custom-dots-top li button { background: #C9A24D !important; opacity: 0.4 !important; height: 6px !important; border-radius: 3px !important; }
                .custom-dots-top li.ant-carousel-active-dot button { opacity: 1 !important; width: 32px !important; }
                .sponsor-carousel .ant-carousel-arrow { color: #C9A24D !important; font-size: 24px; z-index: 10; }
                .sponsor-carousel .ant-carousel-arrow::before { content: none; }
                .custom-dots li button { background: #C9A24D !important; opacity: 0.3 !important; height: 6px !important; border-radius: 3px !important; }
                .custom-dots li.ant-carousel-active-dot button { opacity: 1 !important; width: 24px !important; }
                .ant-image-mask { border-radius: 0px; }
                .ant-image { width: 100%; height: 100%; }
            `}</style>
            {/* Discount Details Modal */}
            <Modal
                open={isDiscountModalOpen}
                onCancel={() => setIsDiscountModalOpen(false)}
                footer={null}
                centered
                width={700}
                className="premium-modal"
                styles={{ content: { borderRadius: '24px', padding: 0, overflow: 'hidden' } }}
            >
                {selectedDiscount && (
                    <div className="flex flex-col">
                        <div className="h-80 md:h-96 relative group overflow-hidden bg-black shadow-inner">
                            {(() => {
                                const images = [selectedDiscount.image_url, ...(selectedDiscount.gallery_image_urls || [])].filter(Boolean);
                                if (images.length > 1) {
                                    return (
                                        <div className="relative h-full gallery-carousel">
                                            <Carousel
                                                arrows={true}
                                                infinite={true}
                                                autoplay={false}
                                                draggable={true}
                                                className="news-carousel h-full"
                                            >
                                                {images.map((url, idx) => (
                                                    <div key={idx} className="h-80 md:h-96 bg-black flex items-center justify-center">
                                                        <img
                                                            src={url}
                                                            alt={`Offer Image ${idx}`}
                                                            className="w-full h-full object-contain"
                                                        />
                                                    </div>
                                                ))}
                                            </Carousel>
                                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md text-white px-3 py-1 rounded-full text-[10px] font-bold border border-white/20">
                                                {isAr ? 'اسحب لمشاهدة الصور' : 'Swipe to see more'}
                                            </div>
                                        </div>
                                    );
                                } else if (images.length === 1) {
                                    return (
                                        <img
                                            src={images[0]}
                                            alt="Offer"
                                            className="w-full h-full object-contain"
                                        />
                                    );
                                } else {
                                    return (
                                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#0a0a0a] to-[#1a1a1a]">
                                            <FireOutlined className="text-[#C9A24D] text-6xl opacity-20" onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />
                                        </div>
                                    );
                                }
                            })()}
                            <div className="absolute top-4 left-4 z-10">
                                <Tag color="#C9A24D" style={{ color: '#000', fontWeight: 'bold', borderRadius: '6px', border: 'none' }}>
                                    {isAr ? 'عرض حصري' : 'Exclusive Offer'}
                                </Tag>
                            </div>
                        </div>

                        <div className="p-8">
                            <Title level={2} className="!mb-4 !font-black !text-[#1a1a1a]">
                                <DynamicTranslate
                                    text={isAr ? (selectedDiscount.title_ar || selectedDiscount.title_en) : (selectedDiscount.title_en || selectedDiscount.title_ar)}
                                    sourceLang={isArabicText(isAr ? (selectedDiscount.title_ar || selectedDiscount.title_en) : (selectedDiscount.title_en || selectedDiscount.title_ar)) ? 'ar' : 'en'}
                                />
                            </Title>

                            <div className="flex items-center gap-4 mb-8">
                                <div className="flex items-center gap-2 text-gray-400 text-sm">
                                    <CalendarOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />
                                    <span>{isAr ? 'ينتهي في:' : 'Expires:'} {selectedDiscount.expiry_date ? new Date(selectedDiscount.expiry_date).toLocaleDateString(isAr ? 'ar-EG' : 'en-US') : (isAr ? 'غير محدد' : 'N/A')}</span>
                                </div>
                            </div>

                            <Divider className="my-6" />

                            <div className="mb-8">
                                <Title level={5} className="!mb-3 !text-gray-400 !uppercase !tracking-widest !text-[10px]">
                                    {isAr ? 'وصف العرض' : 'Offer Description'}
                                </Title>
                                <div className="text-gray-600 text-base leading-relaxed whitespace-pre-wrap">
                                    <DynamicTranslate
                                        text={isAr ? (selectedDiscount.description_ar || selectedDiscount.description_en) : (selectedDiscount.description_en || selectedDiscount.description_ar)}
                                        sourceLang={isArabicText(isAr ? (selectedDiscount.description_ar || selectedDiscount.description_en) : (selectedDiscount.description_en || selectedDiscount.description_ar)) ? 'ar' : 'en'}
                                    />
                                </div>
                            </div>

                            {selectedDiscount.code && (
                                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 opacity-5">
                                        <FireOutlined style={{ fontSize: 80 }} onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />
                                    </div>
                                    <div className="relative z-10">
                                        <Text className="block text-gray-400 font-bold text-[10px] uppercase tracking-[0.2em] mb-2 text-center">
                                            {isAr ? 'استخدم الكود عند الدفع' : 'Use this code at checkout'}
                                        </Text>
                                        <div className="flex flex-col sm:flex-row items-center gap-4">
                                            <div className="flex-1 bg-white border-2 border-dashed border-[#C9A24D]/30 rounded-xl px-6 py-3 flex items-center justify-center">
                                                <Text className="font-mono font-black text-2xl tracking-[0.3em] text-[#1a1a1a]">{selectedDiscount.code}</Text>
                                            </div>
                                            <Button
                                                type="primary"
                                                size="large"
                                                icon={<CopyOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
                                                className="bg-[#C9A24D] border-none h-full px-8 rounded-xl font-bold text-black"
                                                onClick={() => {
                                                    navigator.clipboard.writeText(selectedDiscount.code!);
                                                    message.success(isAr ? 'تم نسخ الكود بنجاح!' : 'Code copied successfully!');
                                                }}
                                            >
                                                {isAr ? 'نسخ الكود' : 'Copy Code'}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <Button
                                block
                                size="large"
                                className="mt-8 h-12 rounded-xl font-bold bg-[#0a0a0a] text-white border-none hover:!bg-[#1a1a1a]"
                                onClick={() => setIsDiscountModalOpen(false)}
                            >
                                {isAr ? 'إغلاق' : 'Close'}
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default PublicSponsorDetails;
