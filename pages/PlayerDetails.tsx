import { useEffect, useState, FC, useRef } from 'react';
import dayjs from 'dayjs';

import { useParams, useNavigate } from 'react-router-dom';
import { Card, Row, Col, Typography, Tag, Space, Button, Spin, Empty, Descriptions, Avatar, Tabs, Divider, Image, message, Tooltip, Rate, Modal, Form, Input, Switch, Checkbox, Popover, Carousel } from 'antd';
import { useTranslation } from 'react-i18next';
import {
    ArrowLeftOutlined,
    ArrowRightOutlined,
    GlobalOutlined,
    EnvironmentOutlined,
    DollarOutlined,

    TrophyOutlined,
    TeamOutlined,
    DoubleRightOutlined,
    CalendarOutlined,
    InfoCircleOutlined,
    RocketOutlined,
    FilePdfOutlined,
    DownloadOutlined,
    MailOutlined,
    SolutionOutlined,
    NumberOutlined,
    HistoryOutlined,
    PictureOutlined,
    YoutubeOutlined,
    InstagramOutlined,
    WhatsAppOutlined,
    PhoneOutlined,
    LinkOutlined,
    ShareAltOutlined,
    EyeOutlined,
    UserOutlined,
    EditOutlined,
    ManOutlined,
    WomanOutlined,
    ArrowsAltOutlined,
    DashboardOutlined,
    InteractionOutlined,
    CloudOutlined,
    StepForwardOutlined,
    StarFilled,
    StarOutlined,
    CheckCircleFilled,
    ThunderboltFilled,
    TrophyFilled,
    WarningFilled,
} from '@ant-design/icons';
import { Player, UserRole, Contract, ProfileRole, ContractStatus, Sport } from '../types';
import { playerService } from '../services/playerService';
import { contractService } from '../services/contractService';
import StatusBadge from '../components/StatusBadge';
import { formatCurrency, formatDate, getFormattedDuration, getDealStatusTranslation, translateToEnglish, translateToArabic, isArabicText, fixNationalityAr, translateText } from '../utils/helpers';
import { useAuth } from '../context/AuthContext';
import DynamicTranslate from '../components/DynamicTranslate';
import { normalizePosition, getPositionsBySport, hasVisualPitch } from '../utils/positions';
import { getCountryCode, getCountryNameAr } from '../utils/flags';
import PitchDisplay from '../components/PitchDisplay';
import { FaHandPaper } from 'react-icons/fa';
import { GiRunningShoe } from 'react-icons/gi';
import { isHandSport, isFootSport, hasLimbPreference } from '../utils/sports';
import publicService from '../services/publicService';
import profileService from '../services/profileService';
import { PlayerEditModal } from '../components/PlayerEditModal';

const { Title, Text, Paragraph } = Typography;

const rateStyles = `
  .gold-stars .ant-rate-star-second,
  .gold-stars-interactive .ant-rate-star-second {
    color: rgba(255, 215, 0, 0.15) !important;
    transition: all 0.3s;
  }
  .gold-stars .ant-rate-star-full .ant-rate-star-second,
  .gold-stars-interactive .ant-rate-star-full .ant-rate-star-second {
    color: #FFD700 !important;
  }
  /* Show border effect for empty stars using standard SVG stroke properties */
  .gold-stars svg,
  .gold-stars-interactive svg {
    stroke: #FFD700 !important;
    stroke-width: 60px !important;
    overflow: visible;
  }
  .gold-stars .ant-rate-star-zero svg,
  .gold-stars-interactive .ant-rate-star-zero svg,
  .gold-stars .ant-rate-star-focused:not(.ant-rate-star-full):not(.ant-rate-star-half) svg,
  .gold-stars-interactive .ant-rate-star-focused:not(.ant-rate-star-full):not(.ant-rate-star-half) svg {
    color: transparent !important;
    fill: transparent !important;
  }
  .gold-stars-interactive .ant-rate-star:hover .ant-rate-star-second {
    transform: scale(1.1);
  }
`;

// Helper: Safely get club name from string or object
const getClubName = (club: any, isAr: boolean): string => {
  if (!club) return '';
  if (typeof club === 'string') return club;
  if (typeof club === 'object') {
    return isAr ? (club.name_ar || club.name || '') : (club.name || club.name_ar || '');
  }
  return String(club);
};

export const PlayerDetails: FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    const isAr = i18n.language === 'ar';
    const { user } = useAuth();

    const [player, setPlayer] = useState<Player | null>(null);
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [loading, setLoading] = useState(true);
    const [mainPhoto, setMainPhoto] = useState<string>('');
    const [showStandards, setShowStandards] = useState(false);
    const [showRatingModal, setShowRatingModal] = useState(false);
    const [updatingRating, setUpdatingRating] = useState(false);
    const [ratingForm] = Form.useForm();
    const [shareToken, setShareToken] = useState<string | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);

    // Authorization check
    const isProfileOwner = Boolean(user && player && (
        (user.nationalId && String(player.nationalId) === String(user.nationalId)) || 
        (user.phone && String(player.phone) === String(user.phone)) ||
        (user.email && player.email && String(player.email).toLowerCase() === String(user.email).toLowerCase())
    ));
    const isAuthorized = user?.role === UserRole.ADMIN || user?.role === UserRole.AGENT || user?.role === UserRole.OWNER || isProfileOwner;
    const isOwnerOrAdmin = user?.role === UserRole.OWNER || user?.role === UserRole.ADMIN || isProfileOwner;
    const isAdmin = user?.role === UserRole.ADMIN || user?.role === UserRole.OWNER;
    // Edit button restricted to admins only (not profile owners/members)
    const canEdit = user?.role === UserRole.OWNER || user?.role === UserRole.ADMIN;
    const canEditRating = user?.role === UserRole.ADMIN || user?.role === UserRole.AGENT || user?.role === UserRole.OWNER;

    useEffect(() => {
        publicService.trackVisit(user?.role);
    }, []);

    useEffect(() => {
        const queryParams = new URLSearchParams(window.location.search);
        const tokenFromUrl = queryParams.get('share_token');
        // Only store share token if the user is NOT an authorized staff member
        // Admins/Agents/Owners should always use their own session credentials
        const isStaffUser = user?.role === UserRole.ADMIN || user?.role === UserRole.OWNER || user?.role === UserRole.AGENT;
        if (tokenFromUrl && !isStaffUser) {
            setShareToken(tokenFromUrl);
        }
    }, [user]);

    useEffect(() => {
        if (id) {
            const queryParams = new URLSearchParams(window.location.search);
            const token = queryParams.get('share_token');
            
            // Handle slug format (Name_ID)
            let actualId = id;
            if (id.includes('_')) {
                const parts = id.split('_');
                actualId = parts[parts.length - 1];
            }

            // If the user is an authorized staff member, ignore the share token.
            // They should always see the full profile via their own authenticated session.
            const isStaffUser = user?.role === UserRole.ADMIN || user?.role === UserRole.OWNER || user?.role === UserRole.AGENT;
            const effectiveToken = isStaffUser ? undefined : (token || undefined);
            
            loadPlayer(actualId, effectiveToken);
        }
    }, [id, user]);

    const loadPlayer = async (playerId: string, token?: string) => {
        setLoading(true);
        try {
            // Load player first
            let playerData: any = null;
            if ((user?.role as string) === 'PUBLIC' && !token) {
                try {
                    const myCV = await profileService.getMyCV(user.nationalId, user.phone);
                    // Check if the returned CV id matches the one we are visiting
                    if (myCV && String(myCV.id) === String(playerId)) {
                        playerData = myCV;
                    }
                } catch (e) {
                    // Ignore errors if they don't have a CV or anything goes wrong
                }
            }
            if (!playerData) {
                playerData = await playerService.getById(playerId, token);
            }

            if (playerData) {
                // Normalize data to handle both snake_case and camelCase from backend
                const normalized: any = {
                    ...playerData,
                    nameAr: (playerData as any).name_ar || (playerData as any).nameAr || playerData.nameAr,
                    nationalityAr: (playerData as any).nationality_ar || (playerData as any).nationalityAr || playerData.nationalityAr,
                    clubAr: (playerData as any).club_ar || (playerData as any).clubAr || playerData.clubAr,
                    dealStatus: (playerData as any).deal_status || (playerData as any).dealStatus || playerData.dealStatus,
                    marketValue: (playerData as any).market_value || (playerData as any).marketValue || playerData.marketValue,
                    nationalId: (playerData as any).national_id || playerData.nationalId,
                    jerseyNumber: (playerData as any).jersey_number || playerData.jerseyNumber,
                    rating: (playerData as any).rating || playerData.rating,
                    fitnessRating: (playerData as any).fitness_rating || playerData.fitnessRating,
                    speedRating: (playerData as any).speed_rating || playerData.speedRating,
                    techniqueRating: (playerData as any).technique_rating || playerData.techniqueRating,
                    isVerified: (playerData as any).is_verified || playerData.isVerified,
                    isRisingTalent: (playerData as any).is_rising_talent || playerData.isRisingTalent,
                    topAgentPick: (playerData as any).top_agent_pick || playerData.topAgentPick,
                    technicalReport: (playerData as any).technical_report || playerData.technicalReport,
                    bio: playerData.bio || (playerData as any).biography,
                    bioAr: (playerData as any).bio_ar || playerData.bioAr || (playerData as any).biography_ar,
                    notes: playerData.notes || (playerData as any).internal_notes || (playerData as any).internalNotes,
                    notesAr: (playerData as any).notes_ar || playerData.notesAr || (playerData as any).internal_notes_ar || (playerData as any).internalNotesAr,
                    youtubeUrl: (playerData as any).youtube_url || playerData.youtubeUrl,
                    transfermarktUrl: (playerData as any).transfermarkt_url || playerData.transfermarktUrl,
                    volleynetUrl: (playerData as any).volleynet_url || (playerData as any).volleynetUrl || playerData.volleynetUrl,
                    volleyballStatsPdf: (playerData as any).volleyball_stats_pdf || playerData.volleyballStatsPdf,
                    volleyballRankingImage: (playerData as any).volleyball_ranking_image || playerData.volleyballRankingImage,
                    volleyballSpikeReach: (playerData as any).volleyball_spike_reach ?? playerData.volleyballSpikeReach,
                    volleyballBlockReach: (playerData as any).volleyball_block_reach ?? playerData.volleyballBlockReach,
                    instagramUrl: (playerData as any).instagram_url || (playerData as any).instagramUrl || playerData.instagramUrl,
                    previousClubsAr: (playerData as any).previous_clubs_ar || (playerData as any).previousClubsAr || playerData.previousClubsAr,
                    achievementsAr: (playerData as any).achievements_ar || (playerData as any).achievementsAr || playerData.achievementsAr,
                    contractNature: (playerData as any).contract_nature || (playerData as any).contractNature || playerData.contractNature,
                    cvUrl: (playerData as any).cv_url || playerData.cvUrl,
                    contractStartDate: (playerData as any).contract_start_date || playerData.contractStartDate,
                    contractEndDate: (playerData as any).contract_end_date || playerData.contractEndDate,
                    isApproved: (playerData as any).is_approved !== undefined ? (playerData as any).is_approved : playerData.isApproved,
                    club_logo: (playerData as any).club_logo || (playerData as any).clubLogo || (playerData.club && typeof playerData.club === 'object' ? playerData.club.logo_url : undefined),
                    clubContracts: (playerData as any).club_contracts || playerData.clubContracts || [],
                    shareToken: (playerData as any).share_token || playerData.shareToken,
                    designerType: (playerData as any).designer_type || playerData.designerType,
                    strategyPdf: (playerData as any).strategy_pdf || playerData.strategyPdf,
                };
                setPlayer(normalized);

                // Auto-translate missing title_en for legacy video data (Arabic-only titles)
                if (!isAr && normalized.youtubeUrl) {
                    const rawVideos = (() => {
                        const raw = normalized.youtubeUrl;
                        if (!raw) return [];
                        if (Array.isArray(raw)) return raw;
                        try {
                            const decoded = JSON.parse(raw);
                            if (Array.isArray(decoded)) return decoded;
                        } catch (e) {}
                        return String(raw).split(',').map((s: string) => ({ url: s.trim(), title: null })).filter((v: any) => v.url);
                    })();
                    const needsTranslation = rawVideos.some((v: any) => v && v.title && !v.title_en && /[\u0600-\u06FF]/.test(v.title));
                    if (needsTranslation) {
                        Promise.all(
                            rawVideos.map(async (video: any) => {
                                if (video && video.title && !video.title_en && /[\u0600-\u06FF]/.test(video.title)) {
                                    try {
                                        const translated = await translateText(video.title, 'ar', 'en');
                                        return { ...video, title_en: translated };
                                    } catch (e) { return video; }
                                }
                                return video;
                            })
                        ).then(translatedVideos => {
                            setPlayer(prev => prev ? { ...prev, youtubeUrl: translatedVideos as any } : prev);
                        });
                    }
                }
                if (normalized.photos && normalized.photos.length > 0) {
                    const main = normalized.photos.find((p: any) => p.isMain) || normalized.photos[0];
                    setMainPhoto(main.url);
                } else {
                    setMainPhoto('https://via.placeholder.com/600x800?text=No+Photo');
                }

                const currentIsProfileOwner = Boolean(user && (
                    (user.nationalId && String(normalized.nationalId) === String(user.nationalId)) || 
                    (user.phone && String(normalized.phone) === String(user.phone)) ||
                    (user.email && normalized.email && String(normalized.email).toLowerCase() === String(user.email).toLowerCase())
                ));
                const currentIsAuthorized = user?.role === UserRole.ADMIN || user?.role === UserRole.AGENT || user?.role === UserRole.OWNER || currentIsProfileOwner;

                // If we accessed via a share token, and it worked, clean the URL to make it look professional
                if (token && !user) {
                    const cleanUrl = window.location.pathname;
                    window.history.replaceState({}, document.title, cleanUrl);
                }

                // Then try to load contracts if authorized (Owner/Admin only for details)
                if (currentIsAuthorized) {
                    if (normalized.contracts && normalized.contracts.length > 0) {
                        setContracts(normalized.contracts);
                    } else {
                        try {
                            const contractData = await contractService.getByPlayerId(playerId, token);
                            setContracts(contractData || []);
                        } catch (contractError) {
                            console.error('Failed to load contracts:', contractError);
                            setContracts([]);
                        }
                    }
                }
            }
        } catch (error: any) {
            console.error('Failed to load player:', error);
            if (error.response?.status === 403 && !user) {
                // If it's a 403 Forbidden and no user is logged in, show access restricted page
                navigate('/access-restricted', { state: { from: window.location.pathname + window.location.search } });
                return;
            }     } finally {
            setLoading(false);
        }
    };

    const handleUpdateRating = async (values: any) => {
        if (!player) return;
        setUpdatingRating(true);
        try {
            const payload = {
                rating: values.rating,
            };
            await playerService.update(player.id, payload);
            message.success(t('messages.success_update', { defaultValue: 'تم التحديث بنجاح' }));
            setShowRatingModal(false);
            loadPlayer(player.id, shareToken || undefined);
        } catch (error) {
            console.error('Update rating error:', error);
            message.error(t('messages.error_save'));
        } finally {
            setUpdatingRating(false);
        }
    };

    // SEO & Meta Tags Update for Google Search
    useEffect(() => {
        if (player) {
            const isAr = i18n.language === 'ar';
            const playerName = isAr ? (player.nameAr || player.name) : player.name;
            const clubName = isAr ? (player.clubAr || player.club) : player.club;
            const sportName = t(`enums.Sport.${player.sport || 'Football'}`);
            
            // 1. Dynamic Page Title
            const pageTitle = `${playerName} | ${sportName} - ${clubName || 'Ashkanani Sport'}`;
            document.title = pageTitle;

            // 2. Dynamic Meta Description
            const metaDescription = isAr 
                ? t('players.meta_description', { name: playerName, sport: sportName, club: clubName || (isAr ? 'أشكناني سبورت' : 'Ashkanani Sport') })
                : `Discover the professional profile of ${playerName}, ${sportName} at ${clubName || 'Ashkanani Sport'}. View position details, market value, achievements and media.`;
            
            let metaDescNode = document.querySelector('meta[name="description"]');
            if (!metaDescNode) {
                metaDescNode = document.createElement('meta');
                metaDescNode.setAttribute('name', 'description');
                document.head.appendChild(metaDescNode);
            }
            metaDescNode.setAttribute('content', metaDescription);

            // 3. JSON-LD Schema (Structured Data for Google)
            const profilePhoto = (player as any).profilePhotoUrl || (player as any).photos?.[0]?.url || `${window.location.origin}/logo.png`;
            const schemaData = {
                "@context": "https://schema.org",
                "@type": "Person",
                "name": playerName,
                "jobTitle": sportName,
                "affiliation": {
                    "@type": "SportsOrganization",
                    "name": clubName || "Ashkanani Sport Athlete Management"
                },
                "image": profilePhoto,
                "url": window.location.href,
                "nationality": {
                    "@type": "Country",
                    "name": player.nationality
                },
                "height": player.height ? `${player.height} cm` : undefined,
                "weight": player.weight ? `${player.weight} kg` : undefined
            };

            let schemaNode = document.getElementById('player-schema');
            if (schemaNode) {
                schemaNode.innerHTML = JSON.stringify(schemaData);
            } else {
                const newSchemaNode = document.createElement('script');
                newSchemaNode.id = 'player-schema';
                newSchemaNode.type = 'application/ld+json';
                newSchemaNode.innerHTML = JSON.stringify(schemaData);
                document.head.appendChild(newSchemaNode);
            }

            // 4. Social Media Meta Tags (Open Graph & Twitter)
            const updateMetaTag = (property: string, content: string, isProperty = true) => {
                const attr = isProperty ? 'property' : 'name';
                let el = document.querySelector(`meta[${attr}="${property}"]`);
                if (!el) {
                    el = document.createElement('meta');
                    el.setAttribute(attr, property);
                    document.head.appendChild(el);
                }
                el.setAttribute('content', content);
            };

            updateMetaTag('og:title', pageTitle);
            updateMetaTag('og:description', metaDescription);
            updateMetaTag('og:image', profilePhoto);
            updateMetaTag('og:url', window.location.href);
            updateMetaTag('twitter:title', pageTitle, false);
            updateMetaTag('twitter:description', metaDescription, false);
            updateMetaTag('twitter:image', profilePhoto, false);

            // Cleanup
            return () => {
                document.title = "Ashkanani Sport | أشكناني سبورت";
                if (schemaNode) schemaNode.remove();
            };
        }
    }, [player, i18n.language, t]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Spin size="large" tip={t('players.loading_profile')} />
            </div>
        );
    }

    if (!player) {
        return (
            <div className="p-12 text-center">
                <Empty description={t('players.player_not_found')} />
                <Button
                    type="primary"
                    onClick={() => navigate('/players')}
                    className="mt-4"
                    style={{ background: '#3F3F3F' }}
                >
                    {t('players.return_to_directory')}
                </Button>
            </div>
        );
    }

    // Updated visibility logic: if accessed via valid share token, treat as authorized/privileged
    const isShared = !!shareToken && !!player.nationality; // If we got nationality/market value while not logged in, it means the token worked and backend is returning private data

    const visibility = (isAuthorized || isShared
        ? {
            nationality: true,
            age: true,
            dateOfBirth: true,
            position: true,
            club: true,
            marketValue: true,
            preferredFoot: true,
            height: true,
            weight: true,
            previousClubs: true,
            dealStatus: true,
            contractInfo: isOwnerOrAdmin,
            photos: true,
            achievements: true,
            stats: true,
            youtube: true,
            transfermarkt: true,
        }
        : (player.visibility || {})) as any;

    // source language detection helper (using imported utility)

    // Improved translation logic: Use specific field if available, fallback to other field, then translate if needed
    const nameToDisplay = isAr ? (player.nameAr || player.name) : (player.name || player.nameAr);
    const displayName = <DynamicTranslate text={nameToDisplay} sourceLang={isArabicText(nameToDisplay) ? 'ar' : 'en'} />;

    const displayNationality = isAr
        ? fixNationalityAr(player.nationalityAr || player.nationality)
        : (player.nationality || player.nationalityAr);

    const displayClub = isAr
        ? getClubName(player.clubAr || player.club, true)
        : getClubName(player.club || player.clubAr, false);

    // Achievements handling
    const rawAchievements = isAr ? (player.achievementsAr && player.achievementsAr.length > 0 ? player.achievementsAr : player.achievements) : (player.achievements && player.achievements.length > 0 ? player.achievements : player.achievementsAr);
    const achievementsList = (rawAchievements || []);

    const bioToDisplay = isAr ? (player.bioAr || player.bio) : (player.bio || player.bioAr);
    const displayBio = <DynamicTranslate text={bioToDisplay} sourceLang={isArabicText(bioToDisplay) ? 'ar' : 'en'} />;

    const notesToDisplay = isAr ? (player.notesAr || player.notes) : (player.notes || player.notesAr);
    const internalNotesToDisplay = isAr ? (player.internalNotesAr || player.internalNotes) : (player.internalNotes || player.internalNotesAr);
    const displayNotes = <DynamicTranslate text={notesToDisplay} sourceLang={isArabicText(notesToDisplay) ? 'ar' : 'en'} />;
    const displayInternalNotes = <DynamicTranslate text={internalNotesToDisplay} sourceLang={isArabicText(internalNotesToDisplay) ? 'ar' : 'en'} />;

    const displayNationalityComp = <DynamicTranslate text={displayNationality} sourceLang={isArabicText(displayNationality) ? 'ar' : 'en'} />;
    const displayClubComp = <DynamicTranslate text={displayClub} sourceLang={isArabicText(displayClub) ? 'ar' : 'en'} fallback={t('common.not_available')} />;

    // Calculate effective contract status based on dates
    const getEffectiveStatus = () => {
        if (!player) return ContractStatus.ACTIVE;

        // Check if there is any active contract in documents
        const today = dayjs();
        const hasActiveDoc = player.documents?.some((d: any) => 
            String(d.type).toLowerCase() === 'contract' && 
            d.end_date && 
            (dayjs(d.end_date).isAfter(today, 'day') || dayjs(d.end_date).isSame(today, 'day'))
        );
        if (hasActiveDoc) {
            return ContractStatus.ACTIVE;
        }
        
        if (!player.contractEndDate) return player.contractStatus || ContractStatus.ACTIVE;
        
        const endDate = dayjs(player.contractEndDate);
        
        if (endDate.isBefore(today, 'day')) {
            return ContractStatus.EXPIRED;
        }
        
        // If it was manually set to EXPIRED but date is still valid, 
        // we might want to respect the manual setting OR override it.
        // The user says "date is still valid but it says expired", implying they want it ACTIVE.
        if (player.contractStatus === ContractStatus.EXPIRED && endDate.isAfter(today, 'day')) {
            return ContractStatus.ACTIVE;
        }

        return player.contractStatus || ContractStatus.ACTIVE;
    };

    const effectiveStatus = getEffectiveStatus();

    const getCleanShareUrl = (token?: string) => {
        if (!player) return window.location.href;
        const baseSlug = player.slug || (player.name || 'player').replace(/\s+/g, '-').replace(/[^\w-]/g, '');
        const identifier = `${baseSlug}_${player.id}`;
        const apiDomain = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'https://api.ashkananitransfer.com';
        
        // Append token with a dash if it exists (e.g. Name_668-abc12345)
        const fullIdentifier = token ? `${identifier}-${token}` : identifier;
        return `${apiDomain}/share/player/${fullIdentifier}`;
    };

    const handleShare = () => {
        const url = getCleanShareUrl();
        navigator.clipboard.writeText(url).then(() => {
            message.success(t('messages.link_copied', { defaultValue: 'Link copied to clipboard!' }));
        }).catch(err => {
            message.error(t('messages.error_copying', { defaultValue: 'Failed to copy link.' }));
        });
    };

    const handleDownloadPDF = async () => {
        const element = profileRef.current;
        if (!element) return;
        
        // Ensure images are loaded before generating
        const images = element.getElementsByTagName('img');
        const imagePromises = Array.from(images).map(img => {
            if (img.complete) return Promise.resolve();
            return new Promise(resolve => {
                img.onload = resolve;
                img.onerror = resolve;
            });
        });

        const hide = message.loading(t('players.preparing_pdf'), 0);
        
        try {
            await Promise.all(imagePromises);
            const html2pdf = (await import('html2pdf.js')).default;
            const playerName = isAr ? (player?.nameAr || player?.name) : player?.name;
            
            const opt = {
                margin: [10, 5, 10, 5] as [number, number, number, number],
                filename: `${playerName || 'player-profile'}.pdf`,
                image: { type: 'jpeg' as const, quality: 0.98 },
                html2canvas: { 
                    scale: 3,
                    useCORS: true, 
                    allowTaint: true, 
                    backgroundColor: '#1a1a1a',
                    logging: false,
                    letterRendering: false,
                    onclone: (clonedDoc: Document) => {
                        // 1. Force override modern colors with standard hex + inject premium fonts
                        const style = clonedDoc.createElement('style');
                        style.innerHTML = `
                            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Cairo:wght@300;400;500;600;700;800;900&family=Almarai:wght@300;400;700;800&display=swap');
                            :root {
                                --primary: #C9A24D !important;
                                --background: #1a1a1a !important;
                                --foreground: #ffffff !important;
                                --color-asm-gold: #C9A24D !important;
                                --color-gold-500: #C9A24D !important;
                            }
                            * {
                                font-family: 'Cairo', 'Almarai', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
                                caret-color: auto !important;
                                transition: none !important;
                                animation: none !important;
                                filter: none !important;
                                -webkit-font-smoothing: antialiased !important;
                                -moz-osx-font-smoothing: grayscale !important;
                                text-rendering: optimizeLegibility !important;
                            }
                            /* Force standard layout for PDF */
                            .player-profile-section {
                                width: 100% !important;
                                max-width: none !important;
                            }
                        `;
                        clonedDoc.head.appendChild(style);

                        // 2. SMART FIX: Instead of deleting rules, we try to replace oklch/oklab strings 
                        // in style tags to preserve the layout (flex, grid, etc.)
                        try {
                            const styleTags = Array.from(clonedDoc.querySelectorAll('style'));
                            styleTags.forEach(tag => {
                                if (tag.innerHTML.includes('oklch') || tag.innerHTML.includes('oklab')) {
                                    // Replace with a neutral hex or the primary gold if it looks like a theme color
                                    tag.innerHTML = tag.innerHTML
                                        .replace(/oklch\([^)]+\)/g, '#C9A24D')
                                        .replace(/oklab\([^)]+\)/g, '#1a1a1a');
                                }
                            });
                        } catch (e) {
                            console.warn('Style replacement failed', e);
                        }
                    }
                },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const },
                pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
            };

            // Scroll to top to ensure canvas captures everything correctly
            window.scrollTo(0, 0);

            await html2pdf().set(opt).from(element).save();
            message.success(t('players.profile_download_success'));
        } catch (e) {
            console.error('PDF Export Error:', e);
            message.error(t('players.profile_download_failed'));
        } finally {
            hide();
        }
    };

    return (
        <div className="fade-in px-4 md:px-10 py-6 md:py-8 lg:py-10 max-w-[1400px] mx-auto">
            <style>{rateStyles}</style>
            {/* Header Actions */}
            <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                {!(shareToken && !user) && (
                <Button
                    type="text"
                    icon={isAr ? <ArrowRightOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} /> : <ArrowLeftOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
                    onClick={() => navigate(-1)}
                    className="hover:text-gold-500 flex items-center gap-2"
                >
                    {player?.isApproved || !location.pathname.match(/^\/(admin|owner|agent)/) ? t('players.back_to_directory', { defaultValue: 'العودة للدليل' }) : t('common.back_to_requests', { defaultValue: 'العودة للطلبات' })}
                </Button>
                )}
                <Space>
                    {canEdit && (
                        <Button
                            type="primary"
                            icon={<EditOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
                            onClick={() => setIsEditModalOpen(true)}
                            className="bg-gold-600 hover:bg-gold-700 border-none font-bold"
                        >
                            {t('common.edit')}
                        </Button>
                    )}
                    {isAuthorized && (
                        <Button
                            type="primary"
                            icon={<LinkOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
                            onClick={async () => {
                                try {
                                    let token = player.shareToken;
                                    
                                    // Force refresh if token doesn't exist OR if it's the old long format (> 8 chars)
                                    if (!token || token.length > 8) {
                                        const res = await playerService.generateShareToken(player.id);
                                        token = res.share_token || res.token;
                                        setPlayer({ ...player, shareToken: token });
                                    }
                                    
                                    const shareUrl = getCleanShareUrl(token || undefined);
                                    
                                    let copied = false;
                                    if (navigator.clipboard) {
                                        try {
                                            await navigator.clipboard.writeText(shareUrl);
                                            copied = true;
                                        } catch (err) {
                                            console.error('Clipboard error:', err);
                                        }
                                    }

                                    if (!copied) {
                                        const textArea = document.createElement("textarea");
                                        textArea.value = shareUrl;
                                        textArea.style.position = "fixed";
                                        textArea.style.left = "-9999px";
                                        textArea.style.top = "0";
                                        document.body.appendChild(textArea);
                                        textArea.select();
                                        try {
                                            document.execCommand("copy");
                                            copied = true;
                                        } catch (err) {
                                            console.error('Fallback copy failed', err);
                                        }
                                        document.body.removeChild(textArea);
                                    }

                                    if (copied) {
                                        message.success(t('players.share_link_success'));
                                    } else {
                                        Modal.info({
                                            title: t('players.share_private_title'),
                                            content: <Text copyable>{shareUrl}</Text>
                                        });
                                    }
                                } catch (error) {
                                    message.error(t('players.share_link_failed'));
                                }
                            }}
                            style={{ background: '#FFD700', border: 'none' }}
                            title={t('players.share_private_desc')}
                        >
                            {t('players.share_private_title')}
                        </Button>
                    )}
                    {!isAuthorized && (
                        <Button
                            type="default"
                            icon={<ShareAltOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
                            onClick={handleShare}
                            className="hover:!text-gold-500 hover:!border-gold-500"
                        >
                            {t('common.share', { defaultValue: 'Share' })}
                        </Button>
                    )}
                </Space>
            </div>

            {/* Archived Player Banner - shown when contract is expired and user is public */}
            {!isAuthorized && player.contractEndDate && new Date(player.contractEndDate) < new Date() && (
                <div style={{
                    background: 'linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%)',
                    borderRadius: 12,
                    padding: '16px 24px',
                    marginBottom: 24,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    border: '1px solid rgba(201,162,77,0.3)',
                }}>
                    <HistoryOutlined
                        style={{ fontSize: 24, color: '#FFD700', flexShrink: 0 }}
                        onPointerEnterCapture={undefined}
                        onPointerLeaveCapture={undefined}
                    />
                    <div style={{ flex: 1 }}>
                        <span style={{ color: '#FFD700', fontWeight: 700, fontSize: 14 }}>
                            {t('players.archive_banner_title', { defaultValue: 'Players Archive' })}
                        </span>
                        <span style={{ color: '#fff', fontSize: 13, marginInlineStart: 12 }}>
                            {t(`players.archive_player_note_${player.role.toLowerCase()}`, { defaultValue: t('players.archive_player_note', { defaultValue: isAr ? 'انتهى عقد هذا العضو. سيرته الاحترافية محفوظة في أرشيفنا.' : 'This member\'s contract has ended. Profile is preserved in our archive.' }) })}
                        </span>
                    </div>
                    <Tag
                        style={{
                            background: 'rgba(140,140,140,0.15)',
                            border: '1px solid rgba(140,140,140,0.4)',
                            color: '#aaa',
                            borderRadius: 8,
                            padding: '3px 12px',
                            fontWeight: 600,
                            fontSize: 12,
                            flexShrink: 0
                        }}
                    >
                        {t('players.archive_expired_label', { defaultValue: 'Expired Contract' })}
                    </Tag>
                </div>
            )}

            {/* Stale Profile Warning */}
            {isOwnerOrAdmin && player.updatedAt && dayjs().diff(dayjs(player.updatedAt), 'day') > 365 && (
                <div style={{
                    background: 'linear-gradient(135deg, #fff2f0 0%, #fffbe6 100%)',
                    borderRadius: 12,
                    padding: '16px 24px',
                    marginBottom: 24,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    border: '1px solid #ffccc7',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                }}>
                    <WarningFilled
                        style={{ fontSize: 24, color: '#ff4d4f', flexShrink: 0 }}
                        onPointerEnterCapture={undefined}
                        onPointerLeaveCapture={undefined}
                    />
                    <div style={{ flex: 1 }}>
                        <span style={{ color: '#cf1322', fontWeight: 700, fontSize: 14 }}>
                            {t('players.stale_warning')}
                        </span>
                        <div style={{ color: '#8c8c8c', fontSize: 12, marginTop: 4 }}>
                            {t('players.last_updated')}: {dayjs(player.updatedAt).format('YYYY-MM-DD')}
                        </div>
                    </div>
                </div>
            )}

            <div id="player-profile-section" ref={profileRef} className="rounded-3xl overflow-hidden mb-6 shadow-2xl relative border border-white/5 bg-[#1a1a1a]">
                {/* Hero Section - Redesigned to match image layout */}
                <div className="relative">
                <div
                    className="absolute inset-0"
                    style={{
                        background: 'linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 100%)',
                    }}
                >
                    {/* Decorative pattern overlay */}
                    <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(#FFD700 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                </div>

                <div className="relative p-3 md:p-6 lg:p-8">
                    <Row gutter={[{ xs: 12, sm: 24, md: 32, lg: 40 }, { xs: 16, md: 32 }]} align="stretch">
                        <Col xs={24} lg={13} xl={14} className="relative order-2 lg:order-1">
                            <div className="flex flex-col h-full relative z-10 pt-2">
                                <div className="flex flex-col lg:flex-row gap-6 lg:gap-12 w-full items-start">
                                    <div className="flex flex-col w-full h-full lg:max-w-[66%]">
                                        <div className="mb-2">
                                    <div className="flex flex-col gap-4 mb-6">

                                        {/* Prominent Scout Information */}
                                        {isAuthorized && player.scoutName && (
                                            <div className="flex items-center gap-2 bg-charcoal-black/40 border border-gold-500/30 px-4 py-2 rounded-xl backdrop-blur-sm w-fit mb-2 justify-center lg:justify-start shadow-lg">
                                                <UserOutlined style={{ color: '#FFD700' }} className="text-xl drop-shadow-md" onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />
                                                <span style={{ color: '#FFD700', fontWeight: 800 }} className="text-[12px] uppercase tracking-widest drop-shadow-md">
                                                    {t('scouts.scouted_by')}:
                                                </span>
                                                <span style={{ color: '#fff', fontWeight: 900 }} className="text-xl ml-1 drop-shadow-md">
                                                    {player.scoutName}
                                                </span>
                                            </div>
                                        )}

                                        <div className="flex items-center gap-3 mb-2 flex-wrap justify-center lg:justify-start">
                                            <div 
                                                className={`${canEditRating ? 'cursor-pointer hover:scale-105 transition-transform' : ''} w-fit flex items-center bg-gold-500/10 px-4 py-1.5 rounded-2xl border border-gold-500/20 shadow-[0_4px_20px_rgba(255,215,0,0.15)]`}
                                                onClick={() => {
                                                    if (canEditRating) {
                                                        ratingForm.setFieldsValue({
                                                            rating: player.rating || 0,
                                                        });
                                                        setShowRatingModal(true);
                                                    }
                                                }}
                                            >
                                                <div className="pointer-events-none pb-[2px]">
                                                    <Rate 
                                                        value={player.rating || 0} 
                                                        style={{ color: '#FFD700', textShadow: '0 0 10px rgba(255, 215, 0, 0.5)' }} 
                                                        className="text-xl md:text-2xl gold-stars"
                                                    />
                                                </div>
                                            </div>

                                            {/* Ashknani Sport + FIFA Agent logos */}
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl px-3.5 py-2.5 shadow-sm backdrop-blur-sm hover:scale-105 transition-transform">
                                                    <img src={`${window.location.origin}/logo.png`} alt="Ashkanani" className="h-10 w-auto" onError={(e) => { e.currentTarget.style.display='none'; }} />
                                                </div>
                                                {player.federation_logo && (
                                                    <div className="flex items-center gap-2 bg-white border border-white/20 rounded-2xl px-3 py-2 shadow-xl overflow-hidden hover:scale-105 transition-transform">
                                                        <img src={player.federation_logo} alt="Federation" className="h-10 w-auto object-contain" />
                                                    </div>
                                                )}
                                                {(player.club_logo || player.clubLogo) && player.role !== ProfileRole.REFEREE && player.role !== ProfileRole.PHOTOGRAPHER && player.role !== ProfileRole.DESIGNER && (
                                                    <div className="flex items-center gap-2 bg-white border border-white/20 rounded-2xl px-3 py-2 shadow-xl overflow-hidden hover:scale-105 transition-transform">
                                                        <img src={player.club_logo || player.clubLogo} alt="Club" className="h-10 w-auto object-contain" />
                                                    </div>
                                                )}
                                                {player.national_team?.logo_url && player.role !== ProfileRole.REFEREE && player.role !== ProfileRole.PHOTOGRAPHER && player.role !== ProfileRole.DESIGNER && (
                                                    <div className="flex items-center gap-2 bg-white border border-white/20 rounded-2xl px-3 py-2 shadow-xl overflow-hidden hover:scale-105 transition-transform">
                                                        <img src={player.national_team.logo_url} alt="National Team" className="h-10 w-auto object-contain" />
                                                    </div>
                                                )}
                                            </div>

                                        </div>

                                        <div className="flex flex-col gap-2 text-center lg:text-start lg:items-start items-center">
                                            <div className="flex items-center gap-4 flex-wrap justify-center lg:justify-start">
                                                <Title level={1} style={{ color: '#FFFFFF', margin: 0 }} className="!text-white !m-0 !text-3xl md:!text-5xl lg:!text-6xl !font-black uppercase tracking-tight break-words whitespace-normal drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)]">
                                                    {displayName}
                                                </Title>
                                            </div>
                                            <div className="flex items-center gap-3 mt-1">
                                                {(player.role === ProfileRole.PLAYER || player.role === ProfileRole.COACH || player.role === ProfileRole.ADMINISTRATOR) && (player.transfermarktUrl || player.volleynetUrl) && (
                                                    <a 
                                                        href={player.volleynetUrl ? (player.volleynetUrl.startsWith('http') ? player.volleynetUrl : `https://${player.volleynetUrl}`) : (player.transfermarktUrl!.startsWith('http') ? player.transfermarktUrl! : `https://${player.transfermarktUrl}`)}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-2 hover:scale-105 transition-transform decoration-transparent"
                                                        data-html2canvas-ignore="true"
                                                    >
                                                        {player.volleynetUrl ? (
                                                            <>
                                                                <div className="bg-white rounded-full p-1 shadow-lg border border-orange-500/30 flex items-center justify-center w-10 h-10 md:w-12 md:h-12 hover:scale-110 transition-transform shrink-0">
                                                                    <img src="/volley.jpg" alt="Volleybox.net" className="w-full h-full object-contain rounded-full" />
                                                                </div>
                                                                <Text style={{ color: '#fff', fontSize: '12px', fontWeight: 800, opacity: 1 }} className="uppercase tracking-widest whitespace-nowrap">Volleybox.net</Text>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <img src="/transfer.png" alt="Transfermarkt" className="w-12 md:w-14 h-auto object-contain drop-shadow-md shrink-0" />
                                                                <Text style={{ color: '#fff', fontSize: '12px', fontWeight: 800, opacity: 1 }} className="uppercase tracking-widest whitespace-nowrap">{t('common.transfermarkt')}</Text>
                                                            </>
                                                        )}
                                                    </a>
                                                )}
                                                {isAuthorized && player.instagramUrl && (
                                                    <a 
                                                        href={player.instagramUrl.startsWith('http') ? player.instagramUrl : `https://${player.instagramUrl}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-2 hover:scale-105 transition-transform ml-2 decoration-transparent"
                                                        data-html2canvas-ignore="true"
                                                    >
                                                        <InstagramOutlined className="text-2xl text-pink-400 shrink-0" onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />
                                                        <Text style={{ color: '#fff', fontSize: '12px', fontWeight: 800, opacity: 1 }} className="uppercase tracking-widest whitespace-nowrap">{t('common.instagram')}</Text>
                                                    </a>
                                                )}
                                                {isAuthorized && player.driveUrl && player.role === ProfileRole.PHOTOGRAPHER && (
                                                    <a 
                                                        href={player.driveUrl.startsWith('http') ? player.driveUrl : `https://${player.driveUrl}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-2 hover:scale-105 transition-transform ml-2 decoration-transparent"
                                                        data-html2canvas-ignore="true"
                                                    >
                                                        <CloudOutlined className="text-2xl text-blue-400 shrink-0" onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />
                                                        <Text style={{ color: '#fff', fontSize: '12px', fontWeight: 800, opacity: 1 }} className="uppercase tracking-widest whitespace-nowrap">{t('common.drive_link')}</Text>
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2.5 flex-wrap justify-center lg:justify-start mt-4">
                                            {(player.nationalityAr || player.nationality) && (
                                                <div className="flex items-center gap-2 bg-charcoal-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-gold-500/40 shadow-xl">
                                                    {getCountryCode(player.nationalityAr || player.nationality || '') && (
                                                        <img 
                                                            src={`https://flagcdn.com/w40/${getCountryCode(player.nationalityAr || player.nationality || '')?.toLowerCase()}.png`} 
                                                            alt=""
                                                            className="w-6 md:w-8 h-auto shadow-sm"
                                                        />
                                                    )}
                                                    <Text style={{ color: '#FFD700' }} className="text-[10px] md:text-xs font-black uppercase tracking-widest drop-shadow-md">{displayNationalityComp}</Text>
                                                </div>
                                            )}

                                            {/* Role Tag */}
                                            {(() => {
                                                const role = player.role || ProfileRole.PLAYER;
                                                let bgColor = 'bg-[#FFD700]';
                                                let textColor = 'text-white';
                                                
                                                switch(role) {
                                                    case ProfileRole.COACH:
                                                        bgColor = 'bg-white';
                                                        textColor = 'text-black';
                                                        break;
                                                    case ProfileRole.ADMINISTRATOR:
                                                        bgColor = 'bg-slate-800';
                                                        textColor = 'text-white';
                                                        break;
                                                    case ProfileRole.REFEREE:
                                                        bgColor = 'bg-slate-400';
                                                        textColor = 'text-white';
                                                        break;
                                                    case ProfileRole.PHOTOGRAPHER:
                                                        bgColor = 'bg-indigo-600';
                                                        textColor = 'text-white';
                                                        break;
                                                }
                                                
                                                return (
                                                    <Tag className={`m-0 border-none font-bold px-4 py-1.5 rounded-xl text-[10px] uppercase tracking-[0.2em] w-fit shadow-lg ${bgColor} ${textColor}`}>
                                                        {t(`enums.ProfileRole.${role}`, { defaultValue: role })}
                                                    </Tag>
                                                );
                                            })()}
                                            
                                            {/* Sport Tag */}
                                            {player.sport && player.role !== ProfileRole.DESIGNER && (
                                                <Tag className="m-0 border-none font-bold px-4 py-1.5 rounded-xl text-[10px] uppercase tracking-[0.2em] w-fit shadow-lg bg-white text-black">
                                                    {t(`enums.Sport.${player.sport}`, { defaultValue: player.sport })}
                                                </Tag>
                                            )}

                                            {/* Deal Status Tag */}
                                            {(player.role !== ProfileRole.REFEREE && player.role !== ProfileRole.PHOTOGRAPHER && player.role !== ProfileRole.DESIGNER) && player.dealStatus && (
                                                (player.dealStatus !== 'FREE_AGENT' && player.dealStatus !== 'FREE_AGENT_COACH' || isAdmin) && (
                                                    <Tag className="m-0 border-none font-bold px-4 py-1.5 rounded-xl text-[10px] uppercase tracking-[0.2em] w-fit shadow-lg bg-[#FFD700] text-white">
                                                        {getDealStatusTranslation(player.dealStatus, player.role || ProfileRole.PLAYER, t)}
                                                    </Tag>
                                                )
                                            )}

                                            {/* Legal Status Tag */}
                                            {(player.role !== ProfileRole.REFEREE && player.role !== ProfileRole.PHOTOGRAPHER && player.role !== ProfileRole.DESIGNER) && player.legalStatus && (
                                                <Tag className="m-0 border border-[#FFD700]/50 font-bold px-4 py-1.5 rounded-xl text-[10px] uppercase tracking-[0.2em] w-fit shadow-lg bg-white/10 text-white">
                                                    {t(`enums.LegalStatus.${player.legalStatus}`, { defaultValue: player.legalStatus })}
                                                </Tag>
                                            )}
                                            {/* Done with badges */}
                                        </div>
                                    </div>
                                </div>

                                {/* Club & Position Info */}
                                <div className="flex flex-row items-stretch gap-3 sm:gap-4 mb-4 w-full">
                                    {/* Club Info with Logo */}
                                    {(player.role !== ProfileRole.REFEREE && player.role !== ProfileRole.PHOTOGRAPHER && player.role !== ProfileRole.DESIGNER) && (
                                        <div className="flex items-center gap-2 sm:gap-4 p-2 bg-transparent w-1/2 sm:w-fit whitespace-nowrap flex-shrink-0">
                                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-white p-1.5 flex items-center justify-center flex-shrink-0 shadow-sm">
                                                {player.auto_club_logo || player.clubLogo ? (
                                                    <img src={player.auto_club_logo || player.clubLogo} alt="" className="max-w-full max-h-full object-contain" />
                                                ) : (
                                                    <TeamOutlined style={{ color: '#3F3F3F', fontSize: 20 }} onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <Text style={{ color: '#FFD700', fontWeight: 800, display: 'block' }} className="text-[9px] uppercase tracking-widest mb-0.5">{t('common.club_label')}</Text>
                                                <Title level={4} style={{ color: '#fff', margin: 0, fontWeight: 800 }} className="!text-sm md:!text-lg truncate">
                                                    {displayClubComp}
                                                </Title>
                                            </div>
                                        </div>
                                    )}

                                    {/* National Team Info */}
                                    {(player.role !== ProfileRole.REFEREE && player.role !== ProfileRole.PHOTOGRAPHER && player.role !== ProfileRole.DESIGNER) && player.national_team && (
                                        <div className="flex items-center gap-2 sm:gap-4 p-2 bg-transparent w-1/2 sm:w-fit whitespace-nowrap flex-shrink-0 border-l border-white/10 ml-2 pl-2">
                                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-white p-1.5 flex items-center justify-center flex-shrink-0 shadow-sm">
                                                {player.national_team.logo_url ? (
                                                    <img src={player.national_team.logo_url} alt="" className="max-w-full max-h-full object-contain" />
                                                ) : (
                                                    <TeamOutlined style={{ color: '#3F3F3F', fontSize: 20 }} onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <Text style={{ color: '#FFD700', fontWeight: 800, display: 'block' }} className="text-[9px] uppercase tracking-widest mb-0.5">{isAr ? 'المنتخب الحالي' : 'National Team'}</Text>
                                                <Title level={4} style={{ color: '#fff', margin: 0, fontWeight: 800 }} className="!text-sm md:!text-lg truncate">
                                                    {isAr ? (player.national_team.name_ar || player.national_team.name) : (player.national_team.name || player.national_team.name_ar)}
                                                </Title>
                                            </div>
                                        </div>
                                    )}

                                    {/* Position Info */}
                                    {player.role === ProfileRole.PLAYER && (
                                        <div className="flex items-center gap-2 sm:gap-4 p-2 bg-transparent flex-1 border-l border-white/10 ml-2 pl-2 sm:border-none sm:ml-0 sm:pl-0">
                                            <div style={{ background: 'rgba(201, 162, 77, 0.1)' }} className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-gold-500 flex-shrink-0">
                                                <EnvironmentOutlined style={{ color: '#FFD700' }} className="text-sm md:text-lg" onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />
                                            </div>
                                            <div className="flex flex-col flex-1 min-w-0">
                                                <Text style={{ color: '#FFD700', fontWeight: 800, display: 'block' }} className="text-[9px] uppercase tracking-widest mb-1">{t('common.position')}</Text>
                                                <div className="flex flex-row gap-1 whitespace-nowrap overflow-x-auto no-scrollbar pb-1">
                                                    {player.positions && player.positions.length > 0 ? (
                                                        player.positions.map((p, idx) => (
                                                            <span 
                                                                key={idx}
                                                                className="px-2 py-0.5 bg-white/10 rounded-md text-[10px] font-bold text-white uppercase tracking-wider whitespace-nowrap flex-shrink-0"
                                                                style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}
                                                            >
                                                                {t(`enums.Position.${p}`, { defaultValue: p })}
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <Text style={{ color: '#fff', fontWeight: 800 }} className="text-sm uppercase opacity-50">
                                                            {t('common.not_available', { defaultValue: 'N/A' })}
                                                        </Text>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                                    {/* Desktop Pitch Display (Hidden on Mobile) */}
                                    {hasVisualPitch(player.sport) && (
                                        <div className="hidden lg:flex justify-start shrink-0 w-fit h-auto mt-0">
                                            {player.role !== ProfileRole.COACH && visibility.position && player.positions && player.positions.length > 0 && (
                                                <div className="flex flex-col items-center justify-start shrink-0 w-[140px] xl:w-[160px] opacity-90 transition-all hover:scale-105">
                                                    <PitchDisplay sport={player.sport} positions={player.positions} width="100%" />
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                
                                {/* Main Data Grid (Position, Jersey, Nationality, etc.) - Improved Spacing */}
                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-y-3 sm:gap-y-8 gap-x-3 sm:gap-x-4 mb-6 sm:mb-8">
                                    {/* Jersey Number */}
                                    {player.role === ProfileRole.PLAYER && (
                                        <div className="flex items-start gap-3">
                                            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/5 border border-white/10 flex-shrink-0">
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M6 4L3 8V11H6V21H18V11H21V8L18 4H15L12 6L9 4H6Z" stroke="#FFD700" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                    <path d="M9 4L12 6L15 4" stroke="#FFD700" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                    <path d="M6 11H18" stroke="#FFD700" strokeWidth="1" opacity="0.3"/>
                                                </svg>
                                            </div>
                                            <div>
                                                <Text style={{ color: '#FFD700', fontWeight: 800, display: 'block' }} className="text-[10px] uppercase tracking-widest mb-0.5">{t('common.jersey_number')}</Text>
                                                <Text style={{ color: '#fff', fontWeight: 900 }} className="text-lg">{player.jerseyNumber || t('common.not_available')}</Text>
                                            </div>
                                        </div>
                                    )}
                                    {player.role === ProfileRole.DESIGNER && (
                                        <div className="flex items-start gap-3">
                                            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/5 border border-white/10 flex-shrink-0">
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M12 19L19 12L22 15L15 22L12 19Z" stroke="#FFD700" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                    <path d="M18 13L16.5 14.5" stroke="#FFD700" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                    <path d="M2 22L5 21L18.5 7.5C19.3284 6.67157 19.3284 5.32843 18.5 4.5V4.5C17.6716 3.67157 16.3284 3.67157 15.5 4.5L2 18V22H2Z" stroke="#FFD700" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                </svg>
                                            </div>
                                            <div>
                                                <Text style={{ color: '#FFD700', fontWeight: 800, display: 'block' }} className="text-[10px] uppercase tracking-widest mb-0.5">{isAr ? 'تخصص التصميم' : 'Designer Specialty'}</Text>
                                                <Text style={{ color: '#fff', fontWeight: 900 }} className="text-lg">{player.designerType ? t(`enums.DesignerType.${player.designerType}`) : t('common.not_available')}</Text>
                                            </div>
                                        </div>
                                    )}

                                    {/* Age - computed from dateOfBirth year on frontend */}
                                    {(player.age || player.dateOfBirth || isAuthorized) && (
                                        <div className="flex items-start gap-3">
                                            <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                                                <CalendarOutlined style={{ color: '#FFD700' }} className="text-lg" onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />
                                            </div>
                                            <div>
                                                <Text style={{ color: '#FFD700', fontWeight: 800, display: 'block' }} className="text-[10px] uppercase tracking-widest mb-0.5">{t('players.age_label')}</Text>
                                                <Text style={{ color: '#fff', fontWeight: 800 }} className="text-sm">
                                                    {(() => {
                                                        const dob = String(player.dateOfBirth || '');
                                                        const year = dob.includes('-') ? dob.split('-')[0] : dob;
                                                        const calculatedAge = dayjs().year() - Number(year);
                                                        
                                                        if (!isNaN(calculatedAge) && calculatedAge > 0 && calculatedAge < 100) {
                                                            return `${calculatedAge} ${t('players.years_label')}`;
                                                        }
                                                        return player.age ? `${player.age} ${t('players.years_label')}` : t('common.not_available');
                                                    })()}
                                                </Text>
                                            </div>
                                        </div>
                                    )}



                                    {/* Date of Birth */}
                                    {(player.dateOfBirth || isAuthorized) && (
                                        <div className="flex items-start gap-3">
                                            <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                                                <CalendarOutlined style={{ color: '#FFD700' }} className="text-lg" onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />
                                            </div>
                                            <div>
                                                <Text style={{ color: '#FFD700', fontWeight: 800, display: 'block' }} className="text-[10px] uppercase tracking-widest mb-0.5">{t('common.date_of_birth')}</Text>
                                                <Text style={{ color: '#fff', fontWeight: 800 }} className="text-sm">{player.dateOfBirth ? String(player.dateOfBirth) : t('common.not_available')}</Text>
                                            </div>
                                        </div>
                                    )}

                                    {player.role === ProfileRole.PLAYER && (player.height || isAuthorized) && (
                                        <div className="flex items-start gap-3">
                                            <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                                                {/* Human height silhouette icon */}
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <circle cx="12" cy="4" r="2.5" stroke="#FFD700" strokeWidth="1.8"/>
                                                    <path d="M12 7.5V15M9 9.5H15" stroke="#FFD700" strokeWidth="1.8" strokeLinecap="round"/>
                                                    <path d="M9.5 15L8 22M14.5 15L16 22" stroke="#FFD700" strokeWidth="1.8" strokeLinecap="round"/>
                                                    <path d="M3 4V20" stroke="#FFD700" strokeWidth="1.2" strokeLinecap="round" opacity="0.4"/>
                                                    <path d="M2 4H4M2 20H4" stroke="#FFD700" strokeWidth="1.2" strokeLinecap="round" opacity="0.4"/>
                                                </svg>
                                            </div>
                                            <div>
                                                <Text style={{ color: '#FFD700', fontWeight: 800, display: 'block' }} className="text-[10px] uppercase tracking-widest mb-0.5">{t('common.height_label')}</Text>
                                                <Text style={{ color: '#fff', fontWeight: 800 }} className="text-sm">{player.height ? `${player.height} ${t('common.cm')}` : t('common.not_available')}</Text>
                                            </div>
                                        </div>
                                    )}

                                    {/* Weight */}
                                    {player.role === ProfileRole.PLAYER && (player.weight || isAuthorized) && (
                                        <div className="flex items-start gap-3">
                                            <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                                                <DashboardOutlined style={{ color: '#FFD700' }} className="text-lg" onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />
                                            </div>
                                            <div>
                                                <Text style={{ color: '#FFD700', fontWeight: 800, display: 'block' }} className="text-[10px] uppercase tracking-widest mb-0.5">{t('common.weight_label')}</Text>
                                                <Text style={{ color: '#fff', fontWeight: 800 }} className="text-sm">{player.weight ? `${player.weight} ${t('common.kg')}` : t('common.not_available')}</Text>
                                            </div>
                                        </div>
                                    )}

                                    {/* Volleyball Spike Reach - Added next to physical stats */}
                                    {player.role === ProfileRole.PLAYER && (player.sport === 'Volleyball' || player.sport === 'Beach Volleyball') && (player.volleyballSpikeReach || isAuthorized) && (
                                        <div className="flex items-start gap-3">
                                            <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                                                <ArrowsAltOutlined style={{ color: '#FFD700' }} className="text-lg" onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />
                                            </div>
                                            <div>
                                                <Text style={{ color: '#FFD700', fontWeight: 800, display: 'block' }} className="text-[10px] uppercase tracking-widest mb-0.5">{t('players.volleyball_spike_reach')}</Text>
                                                <Text style={{ color: '#fff', fontWeight: 800 }} className="text-sm">{player.volleyballSpikeReach ? `${player.volleyballSpikeReach} ${t('common.cm')}` : t('common.not_available')}</Text>
                                            </div>
                                        </div>
                                    )}

                                    {/* Volleyball Block Reach - Added next to physical stats */}
                                    {player.role === ProfileRole.PLAYER && (player.sport === 'Volleyball' || player.sport === 'Beach Volleyball') && (player.volleyballBlockReach || isAuthorized) && (
                                        <div className="flex items-start gap-3">
                                            <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                                                <InteractionOutlined style={{ color: '#FFD700' }} className="text-lg" onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />
                                            </div>
                                            <div>
                                                <Text style={{ color: '#FFD700', fontWeight: 800, display: 'block' }} className="text-[10px] uppercase tracking-widest mb-0.5">{t('players.volleyball_block_reach')}</Text>
                                                <Text style={{ color: '#fff', fontWeight: 800 }} className="text-sm">{player.volleyballBlockReach ? `${player.volleyballBlockReach} ${t('common.cm')}` : t('common.not_available')}</Text>
                                            </div>
                                        </div>
                                    )}

                                    {(() => {
                                        const sport = player.sport as string;
                                        const handSportActive = isHandSport(sport);
                                        const footSportActive = isFootSport(sport);
                                        if (!handSportActive && !footSportActive) return null;
                                        if (player.role !== ProfileRole.PLAYER) return null;
                                        if (!player.preferredFoot && !isAuthorized) return null;
                                        return (
                                            <div className="flex items-start gap-3">
                                                <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                                                    {footSportActive ? (
                                                        <GiRunningShoe size={22} style={{ color: '#FFD700' }} />
                                                    ) : (
                                                        <FaHandPaper size={22} style={{ color: '#FFD700' }} />
                                                    )}
                                                </div>
                                                <div>
                                                    <Text style={{ color: '#FFD700', fontWeight: 800, display: 'block' }} className="text-[10px] uppercase tracking-widest mb-0.5">
                                                        {handSportActive
                                                            ? t('players.preferred_hand')
                                                            : t('common.preferred_foot')
                                                        }
                                                    </Text>
                                                    <Text style={{ color: '#fff', fontWeight: 800 }} className="text-sm uppercase">
                                                        {player.preferredFoot ? (handSportActive ? t(`enums.PreferredHand.${player.preferredFoot}`) : t(`enums.PreferredFoot.${player.preferredFoot}`)) : t('common.not_available')}
                                                    </Text>
                                                </div>
                                            </div>
                                        );
                                    })()}

                                    {/* Gender */}
                                    {(player.gender || isAuthorized) && (
                                        <div className="flex items-start gap-3">
                                            <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                                                {player.gender === 'FEMALE' ? (
                                                    <WomanOutlined style={{ color: '#FFD700' }} className="text-lg" onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />
                                                ) : (
                                                    <ManOutlined style={{ color: '#FFD700' }} className="text-lg" onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />
                                                )}
                                            </div>
                                            <div>
                                                <Text style={{ color: '#FFD700', fontWeight: 800, display: 'block' }} className="text-[10px] uppercase tracking-widest mb-0.5">{t('common.gender', { defaultValue: 'Gender' })}</Text>
                                                <Text style={{ color: '#fff', fontWeight: 800 }} className="text-sm">
                                                    {player.gender ? (player.gender === 'MALE' ? t('common.male') : t('common.female')) : t('common.not_available')}
                                                </Text>
                                            </div>
                                        </div>
                                    )}

                                    {/* Market Value */}
                                    {visibility.marketValue && player.marketValue && (
                                        <div className="flex items-start gap-3">
                                            <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                                                <DollarOutlined style={{ color: '#FFD700' }} className="text-lg" onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />
                                            </div>
                                            <div>
                                                <Text style={{ color: '#FFD700', fontWeight: 800, display: 'block' }} className="text-[10px] uppercase tracking-widest mb-0.5">{t('players.market_value_label')}</Text>
                                                <Text style={{ color: '#fff', fontWeight: 900 }} className="text-sm">{formatCurrency(player.marketValue)}</Text>
                                            </div>
                                        </div>
                                    )}

                                    {/* Address */}
                                    {(player.address || isAuthorized) && (
                                        <div className="flex items-start gap-3">
                                            <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                                                <GlobalOutlined style={{ color: '#FFD700' }} className="text-lg" onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <Text style={{ color: '#FFD700', fontWeight: 800, display: 'block' }} className="text-[10px] uppercase tracking-widest mb-0.5">{t('common.address')}</Text>
                                                <Text style={{ color: '#fff', fontWeight: 800 }} className="text-sm break-words whitespace-normal block">{player.address || t('common.not_available')}</Text>
                                            </div>
                                        </div>
                                    )}

                                    {/* National ID */}
                                    {(isAuthorized || isShared) && player.nationalId && (
                                        <div className="flex items-start gap-3">
                                            <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                                                <SolutionOutlined style={{ color: '#FFD700' }} className="text-lg" onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <Text style={{ color: '#FFD700', fontWeight: 800, display: 'block' }} className="text-[10px] uppercase tracking-widest mb-0.5">{t('common.national_id')}</Text>
                                                <Text style={{ color: '#fff', fontWeight: 800 }} className="text-sm font-mono break-words whitespace-normal block">{player.nationalId}</Text>
                                            </div>
                                        </div>
                                    )}

                                    {/* Phone */}
                                    {(isAuthorized || !isAuthorized) && (
                                        <div className="flex items-start gap-3">
                                            <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                                                <PhoneOutlined style={{ color: '#FFD700' }} className="text-lg" onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <Text style={{ color: '#FFD700', fontWeight: 800, display: 'block' }} className="text-[10px] uppercase tracking-widest mb-0.5">{t('common.phone')}</Text>
                                                <Space className="w-full flex-wrap">
                                                    <Text 
                                                        style={{ color: '#fff', fontWeight: 800 }} 
                                                        className="text-sm break-words whitespace-normal block"
                                                    >
                                                        {(isAuthorized && !shareToken) || (user?.role === UserRole.ADMIN || user?.role === UserRole.OWNER || user?.role === UserRole.AGENT) ? player.phone : t('common.contact_ashkanani')}
                                                    </Text>
                                                    <a 
                                                        href={(isAuthorized && !shareToken) || (user?.role === UserRole.ADMIN || user?.role === UserRole.OWNER || user?.role === UserRole.AGENT)
                                                            ? `https://wa.me/${(player.phone || '').replace(/\D/g, '')}`
                                                            : `https://wa.me/96597131223?text=${encodeURIComponent(isAr 
                                                                ? `مرحبا اريد الاستفسار عن: ${window.location.href}` 
                                                                : `Hello, I want to inquire about: ${window.location.href}`)}`
                                                        } 
                                                        target="_blank" 
                                                        rel="noopener noreferrer" 
                                                        className="hover:scale-110 transition-transform flex items-center"
                                                        data-html2canvas-ignore="true"
                                                    >
                                                        <WhatsAppOutlined style={{ color: '#25D366', fontSize: 18 }} onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />
                                                    </a>
                                                </Space>
                                            </div>
                                        </div>
                                    )}

                                    {/* Email */}
                                    {isAuthorized && player.email && (
                                        <div className="flex items-start gap-3">
                                            <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                                                <MailOutlined style={{ color: '#FFD700' }} className="text-lg" onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <Text style={{ color: '#FFD700', fontWeight: 800, display: 'block' }} className="text-[10px] uppercase tracking-widest mb-0.5">{t('common.email')}</Text>
                                                <a 
                                                    href={`mailto:${player.email}`} 
                                                    style={{ color: '#fff', fontWeight: 800, transition: 'color 0.2s ease', wordBreak: 'break-all' }} 
                                                    onMouseEnter={(e) => (e.currentTarget.style.color = '#FFD700')}
                                                    onMouseLeave={(e) => (e.currentTarget.style.color = '#fff')}
                                                    className="text-[11px] hover:underline"
                                                >
                                                    {player.email}
                                                </a>
                                            </div>
                                        </div>
                                    )}

                                </div>
                                
                                <div className="flex flex-col gap-6 mb-10">
                                    {/* Previous Clubs - Full width row */}
                                    {(player.role !== ProfileRole.REFEREE && player.role !== ProfileRole.PHOTOGRAPHER && player.role !== ProfileRole.DESIGNER) && (player.previousClubs?.length > 0 || player.previousClubsAr?.length > 0) && (
                                        <div className="w-full">
                                            <Text style={{ color: '#FFD700', fontWeight: 800, display: 'block' }} className="text-[10px] uppercase tracking-widest mb-2">{t('players.previous_clubs')}</Text>
                                            <div className="flex flex-wrap gap-2">
                                                {(isAr
                                                    ? (player.previousClubsAr?.length > 0 ? player.previousClubsAr : player.previousClubs)
                                                    : (player.previousClubs?.length > 0 ? player.previousClubs : player.previousClubsAr)
                                                )?.map((club: string, idx: number) => (
                                                    <div key={idx} className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white/80 font-bold text-[11px]">
                                                        <HistoryOutlined style={{ color: '#FFD700', fontSize: 12 }} onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />
                                                        <DynamicTranslate text={club} sourceLang={isArabicText(club) ? 'ar' : 'en'} />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Achievements - Full width row */}
                                    {achievementsList.length > 0 && (
                                        <div className="w-full">
                                            <Text style={{ color: '#FFD700', fontWeight: 800, display: 'block' }} className="text-[10px] uppercase tracking-widest mb-2">{t('players.achievements_title')}</Text>
                                            <div className="flex flex-wrap gap-2">
                                                {achievementsList.map((ach, i) => (
                                                    <div key={i} className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white/80 font-bold text-[11px]">
                                                        <TrophyOutlined style={{ color: '#FFD700', fontSize: 12 }} onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />
                                                        <DynamicTranslate text={ach} sourceLang={isArabicText(ach) ? 'ar' : 'en'} />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                </div>
                                


                                {/* Quick Stats Bar - Responsive Spacing */}
                                {(player.appearances || player.goals || player.assists) && (
                                    <div className="flex items-center gap-6 sm:gap-6 mb-4 p-2 bg-charcoal-black/20 rounded-2xl w-full sm:w-fit justify-between sm:justify-start overflow-x-auto no-scrollbar">
                                        {player.appearances !== undefined && (
                                            <div className="px-3 border-r border-white/10 last:border-r-0">
                                                <div className="text-white font-black text-xl mb-0.5 leading-none">{player.appearances}</div>
                                                <div className="text-gold-500 text-[9px] uppercase font-black tracking-widest">{t('players.stats.matches')}</div>
                                            </div>
                                        )}
                                        {player.goals !== undefined && (
                                            <div className="px-3 border-r border-white/10 last:border-r-0">
                                                <div className="text-gold-500 font-black text-xl mb-0.5 leading-none">{player.goals}</div>
                                                <div className="text-white text-[9px] uppercase font-bold tracking-widest">{t('players.stats.goals')}</div>
                                            </div>
                                        )}
                                        {player.assists !== undefined && (
                                            <div className="px-3 border-r border-white/10 last:border-r-0">
                                                <div className="text-white font-black text-xl mb-0.5 leading-none">{player.assists}</div>
                                                <div className="text-white text-[9px] uppercase font-bold tracking-widest">{t('players.stats.assists', { defaultValue: 'Assists' })}</div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Mobile Pitch Display (Shown only on Mobile, at the Bottom) */}
                                <div className="lg:hidden flex justify-start w-full h-auto mt-2 mb-6">
                                    {player.role !== ProfileRole.COACH && visibility.position && player.positions && player.positions.length > 0 && (
                                        <div className="flex flex-col items-start shrink-0 w-[85px] transition-all">
                                            <PitchDisplay sport={player.sport} positions={player.positions} width="100%" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Col>

                        {/* Player Photo Section - Shrinked on Mobile */}
                        <Col xs={24} lg={11} xl={10} className="flex flex-col order-1 lg:order-2">
                            <div className="relative w-full h-[400px] sm:h-[450px] md:h-[550px] lg:h-[720px] rounded-[2rem] overflow-hidden shadow-2xl bg-white/5">
                                    {player.photos?.length === 0 && !player.mainPhoto ? (
                                        <div className="flex flex-col items-center justify-center p-12 opacity-50 h-full w-full bg-[#1a1a1a]">
                                            <UserOutlined style={{ fontSize: 80, color: '#FFD700' }} onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />
                                        </div>
                                    ) : (
                                        <div className="relative w-full h-full overflow-hidden flex flex-col">
                                            <style>
                                                {`
                                                    .ant-carousel .slick-slider, .ant-carousel .slick-list, .ant-carousel .slick-track, .ant-carousel .slick-slide > div {
                                                        height: 100% !important;
                                                    }
                                                `}
                                            </style>
                                            <Image.PreviewGroup
                                                items={player.photos?.length > 0 ? player.photos.map(p => p.url) : [mainPhoto]}
                                            >
                                                {player.photos?.length > 1 ? (
                                                    <Carousel autoplay autoplaySpeed={3500} effect="fade" style={{ width: '100%', height: '100%' }} className="h-full">
                                                        {player.photos.map((photo, idx) => (
                                                            <div key={idx} className="relative w-full h-full group flex items-center justify-center h-full">
                                                                <Image
                                                                    src={photo.url}
                                                                    alt=""
                                                                    className="w-full h-full object-contain object-center relative z-10"
                                                                    wrapperClassName="w-full h-full flex items-center justify-center"
                                                                    rootClassName="w-full h-full"
                                                                    style={{ height: '100%', width: '100%', objectFit: 'contain', objectPosition: 'center', maxHeight: '100%' }}
                                                                    preview={{ mask: <div className="text-white font-bold flex items-center gap-2"><EyeOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} /> {t('players.view_photos')}</div> }}
                                                                    fallback="https://via.placeholder.com/300x400?text=Player"
                                                                />
                                                            </div>
                                                        ))}
                                                    </Carousel>
                                                ) : (
                                                    <div className="relative w-full h-full group flex items-center justify-center">
                                                        <Image
                                                            src={mainPhoto}
                                                            alt=""
                                                            className="w-full h-full object-contain object-center relative z-10"
                                                            wrapperClassName="w-full h-full flex items-center justify-center"
                                                            rootClassName="w-full h-full"
                                                            style={{ height: '100%', width: '100%', objectFit: 'contain', objectPosition: 'center', maxHeight: '100%' }}
                                                            preview={{ mask: <div className="text-white font-bold flex items-center gap-2"><EyeOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} /> {t('players.view_photos')}</div> }}
                                                            fallback="https://via.placeholder.com/300x400?text=Player"
                                                        />
                                                    </div>
                                                )}
                                            </Image.PreviewGroup>
                                        </div>
                                    )}
                                </div>
                                
                                {/* Player Videos Section - Moved from overlay to below the image */}
                                {player.youtubeUrl && (
                                    <div className="mt-6 w-full" data-html2canvas-ignore="true">
                                        <div style={{ color: '#FFD700', fontWeight: 800 }} className="text-[10px] uppercase tracking-[0.2em] mb-3 flex items-center gap-2 px-1">
                                            <YoutubeOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} /> {t(`players.videos_title_${player.role.toLowerCase()}`, { defaultValue: t('players.videos_title', { defaultValue: isAr ? 'فيديوهات اللاعب' : 'Player Highlights' }) })}
                                        </div>
                                        <div className="flex flex-col gap-2.5">
                                            {(() => {
                                                let videos = [];
                                                if (Array.isArray(player.youtubeUrl)) {
                                                    videos = player.youtubeUrl;
                                                } else if (typeof player.youtubeUrl === 'string') {
                                                    const raw = player.youtubeUrl.trim();
                                                    if (raw.startsWith('[')) {
                                                        try {
                                                            videos = JSON.parse(raw);
                                                        } catch (e) {
                                                            videos = [{ url: raw, title: null }];
                                                        }
                                                    } else {
                                                        videos = raw.split(',').map(s => ({ url: s.trim(), title: null })).filter(v => v.url);
                                                    }
                                                }
                                                
                                                if (!videos || videos.length === 0) return null;

                                                return videos.map((video: any, idx: number, arr: any[]) => {
                                                    const videoUrl = typeof video === 'string' ? video : video.url;
                                                    const rawTitle = isAr
                                                        ? (video.title || video.title_en)
                                                        : (video.title_en || video.title);
                                                    const videoTitle = rawTitle || (arr.length > 1 
                                                        ? t(`players.video_player_${player.role.toLowerCase()}`, { idx: idx + 1, defaultValue: t('players.video_player', { idx: idx + 1 }) }) 
                                                        : t(`players.video_player_${player.role.toLowerCase()}`, { defaultValue: t('players.video_player') }));

                                                    return (
                                                        <a 
                                                            key={idx}
                                                            href={videoUrl.startsWith('http') ? videoUrl : `https://${videoUrl}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center gap-3 bg-red-600/10 hover:bg-red-600/20 border border-red-600/30 rounded-2xl p-3 transition-all group"
                                                        >
                                                            <div className="bg-red-600 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                                                <YoutubeOutlined style={{ fontSize: '20px', color: '#fff' }} onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-white font-bold text-xs group-hover:text-red-500 transition-colors">
                                                                    {videoTitle}
                                                                </span>
                                                                <span className="text-white/40 text-[9px] uppercase tracking-wider font-medium">
                                                                    {t('common.watch_on_youtube', { defaultValue: isAr ? 'مشاهدة على يوتيوب' : 'Watch on YouTube' })}
                                                                </span>
                                                            </div>
                                                        </a>
                                                    );
                                                });
                                            })()}
                                        </div>
                                    </div>
                                )}
                                <div className="mt-4 flex justify-center lg:justify-start gap-3 flex-wrap" data-html2canvas-ignore="true">
                                    {player.cvUrl && (
                                        <Button 
                                            type="link" 
                                            href={player.cvUrl.startsWith('http') ? player.cvUrl : `${process.env.REACT_APP_API_URL}${player.cvUrl}`}
                                            target="_blank"
                                            className="h-auto p-0 hover:scale-105 transition-all"
                                        >
                                            <div className="flex items-center gap-2 bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-600/30 px-3 py-1.5 rounded-xl backdrop-blur-sm">
                                                <FilePdfOutlined className="text-xl text-emerald-500" onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />
                                                <Text style={{ color: '#fff', fontSize: '10px', fontWeight: 700 }} className="uppercase tracking-wider">{t('players.download_cv')}</Text>
                                            </div>
                                        </Button>
                                    )}
                                    {player.volleyballStatsPdf && (
                                        <Button 
                                            type="link" 
                                            href={player.volleyballStatsPdf.startsWith('http') ? player.volleyballStatsPdf : `${process.env.REACT_APP_API_URL}${player.volleyballStatsPdf}`}
                                            target="_blank"
                                            className="h-auto p-0 hover:scale-105 transition-all"
                                        >
                                            <div className="flex items-center gap-2 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-600/30 px-3 py-1.5 rounded-xl backdrop-blur-sm">
                                                <FilePdfOutlined className="text-xl text-blue-500" onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />
                                                <Text style={{ color: '#fff', fontSize: '10px', fontWeight: 700 }} className="uppercase tracking-wider">{t('players.volleyball_stats')}</Text>
                                            </div>
                                        </Button>
                                    )}
                                    {player.volleyballRankingImage && (
                                        <Button 
                                            type="link" 
                                            href={player.volleyballRankingImage.startsWith('http') ? player.volleyballRankingImage : `${process.env.REACT_APP_API_URL}${player.volleyballRankingImage}`}
                                            target="_blank"
                                            className="h-auto p-0 hover:scale-105 transition-all"
                                        >
                                            <div className="flex items-center gap-2 bg-purple-600/10 hover:bg-purple-600/20 border border-purple-600/30 px-3 py-1.5 rounded-xl backdrop-blur-sm">
                                                <PictureOutlined className="text-xl text-purple-500" onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />
                                                <Text style={{ color: '#fff', fontSize: '10px', fontWeight: 700 }} className="uppercase tracking-wider">{t('players.volleyball_ranking_image')}</Text>
                                            </div>
                                        </Button>
                                    )}
                                    {player.strategyPdf && (
                                        <Button 
                                            type="link" 
                                            href={player.strategyPdf.startsWith('http') ? player.strategyPdf : `${process.env.REACT_APP_API_URL}${player.strategyPdf}`}
                                            target="_blank"
                                            className="h-auto p-0 hover:scale-105 transition-all"
                                        >
                                            <div className="flex items-center gap-2 bg-amber-600/10 hover:bg-amber-600/20 border border-amber-600/30 px-3 py-1.5 rounded-xl backdrop-blur-sm">
                                                <FilePdfOutlined className="text-xl text-amber-500" onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />
                                                <Text style={{ color: '#fff', fontSize: '10px', fontWeight: 700 }} className="uppercase tracking-wider">
                                                    {player.role === ProfileRole.PLAYER ? t('players.strategy_pdf') : t('players.work_plan_strategy_pdf', { defaultValue: 'استراتيجية خطة العمل' })}
                                                </Text>
                                            </div>
                                        </Button>
                                    )}

                                </div>
                            </Col>
                    </Row>
                </div>
                {/* End of Hero Relative Section */}
                </div>

                    {/* Biography Section (Integrated into captured area) */}
                    {bioToDisplay && (
                        <div className="mx-3 md:mx-6 lg:mx-8 mb-8 pt-4 border-t border-white/5 relative z-10">
                            <div style={{ color: '#FFD700', fontWeight: 800 }} className="text-[11px] uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                <SolutionOutlined style={{ color: '#FFD700' }} onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} /> {t('players.biography')}
                            </div>
                            <div style={{ color: '#fff', fontWeight: 600 }} className="text-sm leading-relaxed whitespace-pre-wrap">
                                {displayBio}
                            </div>
                        </div>
                    )}

                    {/* Internal Notes Section - Visible only to Admins/Owners/Agents/Profile Owner */}
                    {isAuthorized && notesToDisplay && (
                        <div className="mx-3 md:mx-6 lg:mx-8 mb-8 pt-4 border-t border-white/5 relative z-10">
                            <div style={{ color: '#FFD700', fontWeight: 800 }} className="text-[11px] uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                <InfoCircleOutlined style={{ color: '#FFD700' }} onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} /> {t('common.notes')}
                            </div>
                            <div style={{ color: '#fff', fontWeight: 600, fontStyle: 'italic' }} className="text-sm leading-relaxed whitespace-pre-wrap opacity-90">
                                {displayNotes}
                            </div>
                        </div>
                    )}
                    
                    {/* Sponsors Section - Placed inside PDF profile area */}
                    {player.sponsors && player.sponsors.length > 0 && (
                        <div className="mx-3 md:mx-6 lg:mx-8 mt-6 pt-4 border-t border-white/5 relative z-10">
                            <div style={{ color: '#FFD700', fontWeight: 800 }} className="text-[11px] uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                <TeamOutlined style={{ color: '#FFD700' }} onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} /> {t('players.sponsors_title', { defaultValue: 'Official Sponsors' })}
                            </div>
                            <div className="flex flex-wrap gap-4 pb-4">
                                {player.sponsors.map((sponsor: any) => (
                                    <div key={sponsor.id} className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-2 hover:bg-white/10 transition-all">
                                        <div className="w-10 h-10 rounded-xl bg-white p-1.5 flex items-center justify-center shadow-sm">
                                            {sponsor.logo_url ? (
                                                <img src={sponsor.logo_url} alt="" className="max-w-full max-h-full object-contain" />
                                            ) : (
                                                <TeamOutlined className="text-xl text-charcoal-black/20" onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />
                                            )}
                                        </div>
                                        <div>
                                            <Text style={{ color: '#fff', fontWeight: 800 }} className="text-sm">
                                                {isAr ? sponsor.name_ar : sponsor.name_en}
                                            </Text>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Watermark for PDF only */}
                    <div className="hidden show-in-pdf pb-8 pt-4 px-8 border-t border-white/10 flex justify-between items-center opacity-70">
                        <div className="flex items-center gap-3">
                            <img src="/logo.png" alt="logo" className="h-8 w-auto" />
                            <div>
                                <div style={{ color: '#fff', fontWeight: 800, fontSize: '12px' }}>{t('common.title_part1')} <span style={{ color: '#FFD700' }}>{t('common.title_part2')}</span></div>
                                <div style={{ color: '#FFD700', fontSize: '8px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Athlete Management</div>
                            </div>
                        </div>
                        <div style={{ color: '#888', fontSize: '10px' }}>www.ashkananisports.com</div>
                    </div>

                    <style>{`
                        @media screen {
                            .show-in-pdf { display: none !important; }
                        }
                        
                        /* Enhanced Tabs Visibility */
                        .custom-gold-tabs .ant-tabs-nav {
                            margin-bottom: 32px;
                            background: rgba(255, 255, 255, 0.02);
                            padding: 10px;
                            border-radius: 20px;
                            border: 1px solid rgba(255, 255, 255, 0.05);
                        }
                        .custom-gold-tabs .ant-tabs-tab {
                            padding: 14px 24px !important;
                            border-radius: 14px !important;
                            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
                            margin: 0 8px !important;
                            background: rgba(255, 255, 255, 0.05) !important;
                            border: 1px solid rgba(255, 255, 255, 0.08) !important;
                        }
                        .custom-gold-tabs .ant-tabs-tab .ant-tabs-tab-btn {
                            color: rgba(255, 255, 255, 0.5) !important;
                            font-weight: 700 !important;
                        }
                        .custom-gold-tabs .ant-tabs-tab:hover {
                            background: rgba(255, 215, 0, 0.1) !important;
                            border-color: rgba(255, 215, 0, 0.3) !important;
                        }
                        .custom-gold-tabs .ant-tabs-tab:hover .ant-tabs-tab-btn {
                            color: #FFD700 !important;
                        }
                        .custom-gold-tabs .ant-tabs-tab-active {
                            background: #FFD700 !important;
                            border-color: #FFD700 !important;
                        }
                        .custom-gold-tabs .ant-tabs-tab-active .ant-tabs-tab-btn {
                            color: #000 !important;
                            font-weight: 900 !important;
                        }
                        .custom-gold-tabs .ant-tabs-ink-bar {
                            display: none !important;
                        }
                        .tab-icon-wrapper {
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            margin-inline-end: 12px;
                            flex-shrink: 0;
                            transition: all 0.3s;
                        }
                        .ant-tabs-tab-active .tab-icon-wrapper {
                            color: #000;
                        }
                        .ant-tabs-tab:not(.ant-tabs-tab-active) .tab-icon-wrapper {
                            color: #FFD700;
                        }
                    `}</style>
            </div>


            {/* Internal Notes - Always separate if it exists */}
            {isAuthorized && internalNotesToDisplay && (
                <div className="mt-4 bg-[#1a1a1a] rounded-3xl p-6 border border-white/5 shadow-xl">
                    <div className="mb-0">
                        <div className="bg-gold-500/10 p-5 rounded-2xl border border-gold-500/20 md:w-1/2">
                            <div style={{ color: '#FFD700', fontWeight: 800 }} className="text-[11px] uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                <InfoCircleOutlined style={{ color: '#FFD700' }} onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} /> {t('common.internal_notes')}
                            </div>
                            <div style={{ color: '#fff', fontWeight: 600, fontStyle: 'italic' }} className="text-xs leading-relaxed">
                                <DynamicTranslate text={internalNotesToDisplay} sourceLang={isArabicText(internalNotesToDisplay) ? 'ar' : 'en'} />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Contracts Tabs */}
            {(player.role !== ProfileRole.REFEREE && player.role !== ProfileRole.PHOTOGRAPHER) && ( (isOwnerOrAdmin && player.contractNature !== 'NOT_JOINED') || (player.clubContracts && player.clubContracts.length > 0) ) && (
                <div className="mt-4 bg-[#1a1a1a] rounded-3xl p-6 md:p-8 border border-white/5 custom-tabs-wrapper">
                    
                    <Tabs
                        defaultActiveKey="1"
                        className="custom-gold-tabs"
                        items={[
                            ...(isOwnerOrAdmin && player.contractNature !== 'NOT_JOINED' ? [{
                                key: '1',
                                label: (
                                    <div className="flex items-center">
                                        <div className="tab-icon-wrapper">
                                            <FilePdfOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />
                                        </div>
                                        <span style={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }} className="text-[12px]">
                                            {t('players.contract_ashkanani')}
                                        </span>
                                    </div>
                                ),
                                children: (
                                    <div className="pt-6 mt-2">
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="flex items-center gap-4">
                                                <div style={{ color: '#FFD700', fontWeight: 800 }} className="text-[11px] uppercase tracking-[0.2em] flex items-center gap-2 hidden md:block">
                                                    <FilePdfOutlined style={{ color: '#FFD700' }} onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} /> {t('players.contract_details_ashkanani')}
                                                </div>
                                                <Tag color={effectiveStatus === ContractStatus.ACTIVE ? '#4ade80' : (effectiveStatus === ContractStatus.EXPIRED ? '#f87171' : '#888')} className="rounded-full px-4 border-none text-[9px] font-black uppercase">
                                                    {t(`enums.ContractStatus.${effectiveStatus}`)}
                                                </Tag>
                                                
                                                {(() => {
                                                    const allContractFiles: Array<{url: string, label: string}> = [];
                                                    
                                                    // 0. Get from player.cvUrl
                                                    if (player.cvUrl) {
                                                        allContractFiles.push({
                                                            url: player.cvUrl,
                                                            label: t('admin.deals.contract_file') || 'ملف العقد'
                                                        });
                                                    }
                                                    
                                                    // 1. Get from documents
                                                    if (player.documents) {
                                                        player.documents.forEach((d: any, idx: number) => {
                                                            if (String(d.type) === 'contract' || String(d.type) === 'CONTRACT' || d.name?.toLowerCase().includes('contract')) {
                                                                const url = d.url || (d as any).file_url || (d as any).path;
                                                                if (url && !allContractFiles.some(f => f.url === url)) {
                                                                    allContractFiles.push({ 
                                                                        url, 
                                                                        label: d.title || d.name || `${t('admin.contracts.download_doc', { defaultValue: 'تحميل العقد' })} ${idx + 1}`
                                                                    });
                                                                }
                                                            }
                                                        });
                                                    }
                                                    
                                                    // 2. Get from player.contracts
                                                    if (player.contracts) {
                                                        player.contracts.forEach((c: any) => {
                                                            const url = c.fileUrl || (c as any).file_url || (c as any).url;
                                                            if (url && !allContractFiles.some(f => f.url === url)) {
                                                                const dateStr = c.startDate || c.start_date ? ` (${formatDate(c.startDate || c.start_date)})` : ` ${allContractFiles.length + 1}`;
                                                                allContractFiles.push({ 
                                                                    url, 
                                                                    label: `${t('admin.contracts.download_doc', { defaultValue: 'تحميل العقد' })}${dateStr}`
                                                                });
                                                            }
                                                        });
                                                    }
                                                    if (player.strategyPdf) {
                                                        const url = player.strategyPdf.startsWith('http') ? player.strategyPdf : `${process.env.REACT_APP_API_URL || ''}${player.strategyPdf}`;
                                                        allContractFiles.push({
                                                            url,
                                                            label: player.role === ProfileRole.PLAYER 
                                                                ? t('players.strategy_pdf_doc', { defaultValue: 'ملف الاستراتيجية (PDF)' }) 
                                                                : t('players.work_plan_strategy_pdf_doc', { defaultValue: 'ملف خطة العمل (PDF)' })
                                                        });
                                                    }

                                                    if (allContractFiles.length > 0) {
                                                        return (
                                                            <div className="flex flex-wrap items-center gap-3">
                                                                {allContractFiles.map((file, i) => (
                                                                    <Button 
                                                                        key={i}
                                                                        type="default"
                                                                        icon={<DownloadOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
                                                                        onClick={() => {
                                                                            if (!file.url) return;
                                                                            const link = document.createElement('a');
                                                                            link.href = file.url;
                                                                            link.download = `${file.label || 'contract'}.pdf`;
                                                                            document.body.appendChild(link);
                                                                            link.click();
                                                                            document.body.removeChild(link);
                                                                        }}
                                                                        style={{ 
                                                                            background: 'rgba(255, 215, 0, 0.1)', 
                                                                            borderColor: 'rgba(255, 215, 0, 0.3)',
                                                                            color: '#FFD700',
                                                                            height: 'auto',
                                                                            padding: '6px 16px'
                                                                        }}
                                                                        className="flex items-center gap-2 rounded-full border hover:!bg-gold-500/20 hover:!border-gold-500 transition-all shadow-sm"
                                                                    >
                                                                        <span className="text-[10px] font-black uppercase tracking-wider">{file.label}</span>
                                                                    </Button>
                                                                ))}
                                                            </div>
                                                        );
                                                    }
                                                    return null;
                                                })()}
                                            </div>
                                        </div>
                                        {player.documents?.filter((d: any) => String(d.type).toLowerCase() === 'contract').length > 0 ? (
                                            <div className="flex flex-col gap-4">
                                                {player.documents
                                                    .filter((d: any) => String(d.type).toLowerCase() === 'contract')
                                                    .map((doc: any, idx: number) => {
                                                        const url = doc.url;
                                                        const docStartDate = doc.start_date || (doc as any).startDate;
                                                        const docEndDate = doc.end_date || (doc as any).endDate;
                                                        
                                                        return (
                                                            <div key={doc.id || idx} className="bg-white/5 border border-white/10 rounded-2xl p-4 md:p-6 transition-all hover:bg-white/[0.08]">
                                                                <Row gutter={[16, 16]} align="middle">
                                                                    <Col xs={24} md={10}>
                                                                        <div className="flex items-center gap-4">
                                                                            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
                                                                                <FilePdfOutlined style={{ color: '#FFD700', fontSize: 20 }} onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />
                                                                            </div>
                                                                            <div>
                                                                                <Title level={5} style={{ color: '#fff', margin: 0, fontWeight: 800 }} className="mb-0.5">
                                                                                    {doc.name || `${t('players.contract_doc')} ${idx + 1}`}
                                                                                </Title>
                                                                            </div>
                                                                        </div>
                                                                    </Col>
                                                                    <Col xs={24} md={14}>
                                                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                                                            <div>
                                                                                <Text style={{ color: '#FFD700', fontWeight: 800, display: 'block' }} className="text-[9px] uppercase tracking-widest mb-1">{t('admin.contracts.start_date')}</Text>
                                                                                <Text style={{ color: '#fff', fontWeight: 800, fontSize: '11px' }}>{docStartDate ? formatDate(docStartDate) : '-'}</Text>
                                                                            </div>
                                                                            <div>
                                                                                <Text style={{ color: '#FFD700', fontWeight: 800, display: 'block' }} className="text-[9px] uppercase tracking-widest mb-1">{t('admin.contracts.end_date')}</Text>
                                                                                <Text style={{ color: '#fff', fontWeight: 800, fontSize: '11px' }}>{docEndDate ? formatDate(docEndDate) : '-'}</Text>
                                                                            </div>
                                                                            <div>
                                                                                <Text style={{ color: '#FFD700', fontWeight: 800, display: 'block' }} className="text-[9px] uppercase tracking-widest mb-1">{t('admin.contracts.remaining_duration')}</Text>
                                                                                <Text style={{ color: '#fff', fontWeight: 800, fontSize: '11px' }}>
                                                                                    {docEndDate ? getFormattedDuration(dayjs(), docEndDate, t) : '-'}
                                                                                </Text>
                                                                            </div>
                                                                            <div className="flex items-center justify-end">
                                                                                {url && (
                                                                                    <Button 
                                                                                        type="default"
                                                                                        icon={<DownloadOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
                                                                                        onClick={() => {
                                                                                            const link = document.createElement('a');
                                                                                            link.href = url;
                                                                                            link.download = `${doc.name || 'contract'}.pdf`;
                                                                                            document.body.appendChild(link);
                                                                                            link.click();
                                                                                            document.body.removeChild(link);
                                                                                        }}
                                                                                        style={{ 
                                                                                            background: 'rgba(255, 215, 0, 0.1)', 
                                                                                            borderColor: 'rgba(255, 215, 0, 0.3)',
                                                                                            color: '#FFD700',
                                                                                            height: 'auto',
                                                                                            padding: '4px 12px'
                                                                                        }}
                                                                                        className="flex items-center gap-1.5 rounded-full border hover:!bg-gold-500/20 hover:!border-gold-500 transition-all shadow-sm"
                                                                                    >
                                                                                        <span className="text-[9px] font-black uppercase tracking-wider">{t('admin.contracts.download_doc', { defaultValue: 'تحميل العقد' })}</span>
                                                                                    </Button>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </Col>
                                                                </Row>
                                                            </div>
                                                        );
                                                    })}
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                                                <div className="bg-white/10 p-4 rounded-xl border border-white/20 h-full">
                                                    <Text style={{ color: '#FFD700', fontWeight: 800, display: 'block' }} className="text-[11px] uppercase tracking-widest mb-1">{t('common.contract_type')}</Text>
                                                    <Text style={{ color: '#fff', fontWeight: 800 }}>{t(`enums.ContractType.${player.contractType || 'PROFESSIONAL'}`)}</Text>
                                                </div>
                                                <div className="bg-white/10 p-4 rounded-xl border border-white/20 h-full">
                                                    <Text style={{ color: '#FFD700', fontWeight: 800, display: 'block' }} className="text-[11px] uppercase tracking-widest mb-1">{t('common.contract_nature')}</Text>
                                                    <Text style={{ color: '#fff', fontWeight: 800 }}>{t(`enums.ContractNature.${player.contractNature || 'SIGNING'}`)}</Text>
                                                </div>
                                                <div className="bg-white/10 p-4 rounded-xl border border-white/20 h-full">
                                                    <Text style={{ color: '#FFD700', fontWeight: 800, display: 'block' }} className="text-[11px] uppercase tracking-widest mb-1">{t('common.contract_period')}</Text>
                                                    <div className="flex flex-col">
                                                        <Text style={{ color: '#fff', fontWeight: 800, fontSize: '11px' }}>{player.contractStartDate ? formatDate(player.contractStartDate) : '-'}</Text>
                                                        <Text style={{ color: '#fff', fontWeight: 800, fontSize: '11px' }}>{player.contractEndDate ? formatDate(player.contractEndDate) : '-'}</Text>
                                                    </div>
                                                </div>
                                                <div className="bg-white/10 p-4 rounded-xl border border-white/20 h-full">
                                                    <Text style={{ color: '#FFD700', fontWeight: 800, display: 'block' }} className="text-[11px] uppercase tracking-widest mb-1">{t('admin.contracts.remaining_duration')}</Text>
                                                    <Text style={{ color: '#fff', fontWeight: 800 }} className="text-sm">
                                                        {player.contractEndDate ? getFormattedDuration(dayjs(), player.contractEndDate, t) : '-'}
                                                    </Text>
                                                </div>
                                                <div className="bg-white/10 p-4 rounded-xl border border-white/20 h-full">
                                                    <div className="flex items-center justify-between">
                                                        <Text style={{ color: '#FFD700', fontWeight: 800, display: 'block' }} className="text-[11px] uppercase tracking-widest mb-1">{t('admin.contracts.contract_fees', { defaultValue: 'قيمة العقد' })}</Text>
                                                        {(player.contractFeesType || player.contract_fees_type) !== 'PERCENTAGE' && (
                                                            <Tag className="bg-gold-500/10 text-gold-500 border-none text-[8px] font-black p-0 px-1">
                                                                {t('common.fixed_amount')}
                                                            </Tag>
                                                        )}
                                                    </div>
                                                    <Text style={{ color: '#fff', fontWeight: 900 }} className="text-lg leading-none">
                                                        {((player.contractFees || player.contract_fees) !== undefined && (player.contractFees || player.contract_fees) !== null) ? (
                                                            (player.contractFeesType || player.contract_fees_type) === 'PERCENTAGE' 
                                                                ? `${Math.round(Number(player.contractFees || player.contract_fees))}%`
                                                                : formatCurrency(player.contractFees || player.contract_fees || 0)
                                                        ) : '-'}
                                                    </Text>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )
                            }] : []),
                            ...(player.clubContracts && player.clubContracts.length > 0 ? [{
                                key: '2',
                                label: (
                                    <div className="flex items-center">
                                        <div className="tab-icon-wrapper">
                                            <HistoryOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />
                                        </div>
                                        <span style={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }} className="text-[12px]">
                                            {t('admin.players.club_contracts_title', { defaultValue: isAr ? 'عقود الأندية' : 'Club Contracts' })}
                                        </span>
                                    </div>
                                ),
                                children: (
                                    <div className="pt-6 mt-2">
                                        <div className="flex flex-col gap-4">
                                            {player.clubContracts.map((contract: any, index: number) => (
                                                <div key={contract.id || index} className="bg-white/5 border border-white/10 rounded-2xl p-4 md:p-6 transition-all hover:bg-white/[0.08]">
                                                    <Row gutter={[16, 16]} align="middle">
                                                        <Col xs={24} md={8}>
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
                                                                    <TeamOutlined style={{ color: '#FFD700', fontSize: 20 }} onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />
                                                                </div>
                                                                <div>
                                                                    <Title level={5} style={{ color: '#fff', margin: 0, fontWeight: 800 }} className="mb-0.5">
                                                                        {isAr ? (contract.club_name_ar || contract.club_name) : (contract.club_name)}
                                                                    </Title>
                                                                    <div className="flex items-center gap-2">
                                                                        <EnvironmentOutlined style={{ color: '#FFD700', fontSize: 12 }} onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />
                                                                        <Text style={{ color: '#aaa', fontSize: 12, fontWeight: 600 }}>
                                                                            {isAr ? (contract.club_country_ar || contract.club_country) : (contract.club_country)}
                                                                        </Text>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </Col>
                                                        
                                                        <Col xs={24} md={10}>
                                                            <div className="flex flex-col sm:flex-row gap-4 sm:gap-8">
                                                                <div>
                                                                    <Text style={{ color: '#FFD700', fontWeight: 800, display: 'block' }} className="text-[9px] uppercase tracking-widest mb-1">{t('admin.contracts.start_date')}</Text>
                                                                    <Text style={{ color: '#fff', fontWeight: 700 }} className="text-sm">
                                                                        {contract.start_date ? formatDate(contract.start_date) : '-'}
                                                                    </Text>
                                                                </div>
                                                                <div>
                                                                    <Text style={{ color: '#FFD700', fontWeight: 800, display: 'block' }} className="text-[9px] uppercase tracking-widest mb-1">{t('admin.contracts.end_date')}</Text>
                                                                    <Text style={{ color: '#fff', fontWeight: 700 }} className="text-sm">
                                                                        {contract.end_date ? formatDate(contract.end_date) : '-'}
                                                                    </Text>
                                                                </div>
                                                                {contract.start_date && contract.end_date && (
                                                                    <div>
                                                                        <Text style={{ color: '#FFD700', fontWeight: 800, display: 'block' }} className="text-[9px] uppercase tracking-widest mb-1">{t('admin.contracts.duration', { defaultValue: 'Duration' })}</Text>
                                                                        <Text style={{ color: '#fff', fontWeight: 700 }} className="text-sm">
                                                                            {getFormattedDuration(dayjs(contract.start_date), contract.end_date, t)}
                                                                        </Text>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            {(contract.notes || contract.notes_ar) && (
                                                                <div className="mt-4 p-3 bg-white/5 rounded-xl border border-white/5 italic">
                                                                    <Text style={{ color: '#aaa', fontSize: 12 }}>
                                                                        {isAr ? (contract.notes_ar || contract.notes) : (contract.notes || contract.notes_ar)}
                                                                    </Text>
                                                                </div>
                                                            )}
                                                        </Col>
                                                        
                                                        <Col xs={24} md={6} className="text-right">
                                                            {isAuthorized && contract.file_url && (
                                                                <Button 
                                                                    type="primary" 
                                                                    icon={<DownloadOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
                                                                    onClick={() => {
                                                                        const link = document.createElement('a');
                                                                        link.href = contract.file_url;
                                                                        link.download = `${contract.club_name || 'club'}_contract.pdf`;
                                                                        document.body.appendChild(link);
                                                                        link.click();
                                                                        document.body.removeChild(link);
                                                                    }}
                                                                    style={{ background: '#FFD700', color: '#000' }}
                                                                    className="border-none font-bold hover:!opacity-90 rounded-xl"
                                                                >
                                                                    {t('common.download_doc', { defaultValue: isAr ? 'تحميل العقد' : 'Download Contract' })}
                                                                </Button>
                                                            )}
                                                        </Col>
                                                    </Row>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )
                            }] : []),
                        ]}
                    />
                </div>
            )}

            {/* Certificates - Standalone Section visible to ALL users */}
            {player.certificates && player.certificates.length > 0 && (
                <div className="mt-4 bg-[#1a1a1a] rounded-3xl p-6 md:p-8 border border-white/5">
                    <div style={{ color: '#FFD700', fontWeight: 800 }} className="text-[11px] uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                        <TrophyOutlined style={{ color: '#FFD700' }} onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />
                        {t('coaches.certificates_title', { defaultValue: 'Certificates & Accreditations' })}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {player.certificates.map((cert: any, index: number) => (
                            <div key={cert.id || index} className="bg-white/5 border border-white/10 rounded-2xl p-4 md:p-6 transition-all hover:bg-white/[0.08]">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-12 h-12 rounded-xl bg-gold-500/10 flex items-center justify-center border border-gold-500/20">
                                        <TrophyOutlined style={{ color: '#FFD700', fontSize: 20 }} onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />
                                    </div>
                                    <div>
                                        <Title level={5} style={{ color: '#fff', margin: 0, fontWeight: 800 }}>
                                            {cert.certificate_name}
                                        </Title>
                                        <Tag className="bg-gold-500/10 text-gold-500 border-none text-[8px] font-black p-0 px-2 mt-1">
                                            {t(`coaches.cert_types.${(cert.certificate_type || '').toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '')}`, { defaultValue: cert.certificate_type })}
                                        </Tag>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Text style={{ color: '#FFD700', fontWeight: 800, display: 'block' }} className="text-[9px] uppercase tracking-widest mb-1">{t('coaches.issuing_body', { defaultValue: 'Issuing Body' })}</Text>
                                        <Text style={{ color: '#fff', fontWeight: 700 }} className="text-sm">{cert.issuing_body}</Text>
                                    </div>
                                    <div>
                                        <Text style={{ color: '#FFD700', fontWeight: 800, display: 'block' }} className="text-[9px] uppercase tracking-widest mb-1">{t('coaches.level', { defaultValue: 'Level' })}</Text>
                                        <Text style={{ color: '#fff', fontWeight: 700 }} className="text-sm">
                                            {t(`coaches.levels.${(cert.level || '').toLowerCase()}`, { defaultValue: cert.level })}
                                        </Text>
                                    </div>
                                    <div>
                                        <Text style={{ color: '#FFD700', fontWeight: 800, display: 'block' }} className="text-[9px] uppercase tracking-widest mb-1">{t('coaches.year_obtained', { defaultValue: 'Year' })}</Text>
                                        <Text style={{ color: '#fff', fontWeight: 700 }} className="text-sm">{cert.year_obtained || '-'}</Text>
                                    </div>
                                    <div>
                                        <Text style={{ color: '#FFD700', fontWeight: 800, display: 'block' }} className="text-[9px] uppercase tracking-widest mb-1">{t('coaches.source_type', { defaultValue: 'Source Type' })}</Text>
                                        <Text style={{ color: '#fff', fontWeight: 700 }} className="text-sm">
                                            {t(`coaches.sources.${(cert.source_type || '').replace(/\s+/g, '_').toLowerCase()}`, { defaultValue: cert.source_type })}
                                        </Text>
                                    </div>
                                </div>
                                {cert.certificate_file && (isAuthorized || isShared) && (
                                    <div className="mt-4 pt-4 border-t border-white/10">
                                        <Button
                                            type="primary"
                                            icon={<DownloadOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
                                            href={cert.certificate_file}
                                            target="_blank"
                                            style={{ background: '#FFD700', color: '#000' }}
                                            className="border-none font-bold hover:!opacity-90 rounded-xl"
                                        >
                                            {t('coaches.download_certificate', { defaultValue: 'Download Certificate' })}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

                {/* Modals and other sibling elements below */}



            <Modal
                title={
                    <div className="flex items-center gap-2 text-gold-500 uppercase tracking-widest font-black text-sm">
                        <TrophyFilled onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} /> {t('players.evaluation_standards', { defaultValue: 'معايير تقييم اللجنة الفنية' })}
                    </div>
                }
                open={showStandards}
                onCancel={() => setShowStandards(false)}
                footer={[
                    <Button key="close" onClick={() => setShowStandards(false)} className="bg-gold-500 text-black border-none font-bold hover:!bg-gold-600 transition-colors">
                        {t('common.close')}
                    </Button>
                ]}
                width={700}
                centered
                className="technical-standards-modal"
                bodyStyle={{ backgroundColor: '#1a1a1a', color: 'white' }}
            >
                <div className="space-y-6 py-4">
                    <Paragraph className="text-white/70 text-sm leading-relaxed mb-6">
                        {t('players.standards_intro', { defaultValue: 'نظام تقييم الرياضيين بناءً على معايير الكشافة الاحترافية.' })}
                    </Paragraph>

                    <div className="space-y-3">
                        {[
                            { stars: 5, label: t('players.stars_elite'), criteria: t('players.stars_elite_criteria') },
                            { stars: 4, label: t('players.stars_pro'), criteria: t('players.stars_pro_criteria') },
                            { stars: 3, label: t('players.stars_good'), criteria: t('players.stars_good_criteria') },
                            { stars: 2, label: t('players.stars_rising'), criteria: t('players.stars_rising_criteria') },
                            { stars: 1, label: t('players.stars_amateur'), criteria: t('players.stars_amateur_criteria') },
                        ].map((std) => (
                            <div key={std.stars} className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center justify-between">
                                <div className="flex items-center gap-3 pointer-events-none">
                                    <Rate 
                                        value={std.stars} 
                                        style={{ fontSize: 10, color: '#FFD700' }} 
                                        className="gold-stars"
                                    />
                                    <Text className="text-gold-500 font-black text-[10px] uppercase tracking-wider">{std.label}</Text>
                                </div>
                                <Text className="text-[10px] text-white/50 font-medium">{std.criteria}</Text>
                            </div>
                        ))}
                    </div>

                    <Divider className="border-white/10" />

                    <div>
                        <Title level={5} className="text-gold-500 uppercase tracking-widest text-[11px] mb-4">{t('players.evaluation_factors', { defaultValue: 'عوامل التقييم' })}</Title>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                             {player.role === ProfileRole.COACH ? [
                                 { en: 'Technical Expertise', ar: 'الخبرة الفنية', tKey: 'players.tech_expertise' },
                                 { en: 'Tactical Vision', ar: 'الرؤية التكتيكية', tKey: 'players.tactical_vision' },
                                 { en: 'Leadership', ar: 'المهارات القيادية', tKey: 'players.leadership' },
                                 { en: 'Management', ar: 'إدارة الفريق', tKey: 'players.team_management' }
                             ].map((factor) => (
                                 <div key={factor.en} className="bg-white/5 p-2 rounded-lg text-center border border-white/5">
                                     <Text style={{ color: '#ffffff', opacity: 1 }} className="text-[10px] font-bold">{t(factor.tKey)}</Text>
                                 </div>
                             )) : [
                                 { en: 'Skill Level', ar: 'المستوى المهاري', tKey: 'players.skill_level' },
                                 { en: 'Experience', ar: 'الخبرة الميدانية', tKey: 'players.field_experience' },
                                 { en: 'Tactical', ar: 'الوعي التكتيكي', tKey: 'players.tactical_awareness' },
                                 { en: 'Physical', ar: 'الجانب البدني', tKey: 'players.physical_side' }
                             ].map((factor) => (
                                <div key={factor.en} className="bg-white/5 p-2 rounded-lg text-center border border-white/5">
                                    <Text style={{ color: '#ffffff', opacity: 1 }} className="text-[10px] font-bold">{t(factor.tKey)}</Text>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </Modal>

            {/* Quick Rating Modal for Owners/Admin */}
            <Modal
                title={
                    <div className="flex items-center gap-2 text-gold-500 uppercase tracking-widest font-black text-sm">
                        <EditOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} /> {t('players.technical_evaluation')}
                    </div>
                }
                open={showRatingModal}
                onCancel={() => setShowRatingModal(false)}
                onOk={() => ratingForm.submit()}
                confirmLoading={updatingRating}
                okText={t('common.save')}
                cancelText={t('common.cancel')}
                centered
                width={500}
                className="technical-edit-modal"
            >
                <Form
                    form={ratingForm}
                    onFinish={handleUpdateRating}
                    layout="vertical"
                    className="py-4"
                >
                    <div className="text-center py-4">
                        <Form.Item name="rating" label={t('players.overall_rating')} className="mb-0">
                            <Rate 
                                count={5} 
                                style={{ color: '#FFD700', fontSize: 48 }} 
                                className="gold-stars-interactive"
                            />
                        </Form.Item>
                        <div className="mt-4 text-white/40 text-xs italic">
                            {t(`players.rate_instruction_${player.role.toLowerCase()}`, { defaultValue: t('players.rate_instruction', { defaultValue: isAr ? 'اختر عدد النجوم لتقييم اللاعب' : 'Select the number of stars to rate the player' }) })}
                        </div>
                    </div>
                </Form>
            </Modal>

            {isEditModalOpen && (
                <PlayerEditModal
                    open={isEditModalOpen}
                    onCancel={() => setIsEditModalOpen(false)}
                    onSuccess={() => {
                        setIsEditModalOpen(false);
                        if (id) {
                            loadPlayer(id, shareToken || undefined);
                        }
                    }}
                    editingPlayer={player}
                />
            )}
        </div>
    );
};

export default PlayerDetails;
