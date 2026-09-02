import React, { useEffect, useState, useRef } from 'react';
import {
    Modal,
    Form,
    Input,
    InputNumber,
    Select,
    Radio,
    Row,
    Col,
    Divider,
    Space,
    Button,
    Upload,
    Checkbox,
    Switch,
    DatePicker,
    Typography,
    message,
    Avatar
} from 'antd';
import { PlusOutlined, UploadOutlined, DeleteOutlined, TeamOutlined, RocketOutlined } from '@ant-design/icons';
import { isHandSport, isFootSport } from '../utils/sports';
// Fix for icon pointer capture warnings/errors
const Icon = (Component: any) => (props: any) => <Component onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} {...props} />;
const UploadIcon = Icon(UploadOutlined);
const TeamIcon = Icon(TeamOutlined);
const PlusIcon = Icon(PlusOutlined);
import dayjs from 'dayjs';
import { Player, Sport, ProfileRole, PreferredFoot, DealStatus, ContractStatus, ContractNature, DesignerType } from '../types';
import { playerService } from '../services/playerService';
import { metaService } from '../services/metaService';
import { sponsorService } from '../services/sponsorService';
import { scoutService } from '../services/scoutService';
import { WORLD_COUNTRIES } from '../utils/countries';
import { clubService } from '../services/clubService';
import { useTranslation } from 'react-i18next';
import { translateText, getFormattedDuration, getDealStatusTranslation, normalizePhone, standardizePhoneNumber, fixNationalityAr } from '../utils/helpers';
import { Club } from '../types';
import { getPositionsBySport, SPORT_POSITIONS, normalizePosition, isGenericPosition } from '../utils/positions';
import showConfirmModal from './ConfirmModal';

const { Title } = Typography;

const nationalities = WORLD_COUNTRIES.map(c => ({
    value: c.labelEn,
    label: (
        <Space>
            <span role="img" aria-label={c.labelEn}>
                {c.value.toUpperCase().replace(/./g, char => String.fromCodePoint(char.charCodeAt(0) + 127397))}
            </span>
            {c.labelEn}
        </Space>
    ),
    fullEn: c.labelEn,
    fullAr: c.labelAr,
    searchLabel: `${c.labelEn} ${c.labelAr}`
}));

interface PlayerEditModalProps {
    open: boolean;
    onCancel: () => void;
    onSuccess: () => void;
    editingPlayer: Player | null; // null for create
    initialRole?: ProfileRole;
}

export const PlayerEditModal: React.FC<PlayerEditModalProps> = ({
    open,
    onCancel,
    onSuccess,
    editingPlayer,
    initialRole = ProfileRole.PLAYER
}) => {
    const { t, i18n } = useTranslation();
    const isAr = i18n.language === 'ar';
    const [form] = Form.useForm();

    const watchedPhone = Form.useWatch('phone', form);
    const watchedNationality = Form.useWatch('nationality', form);
    const standardizedPreview = standardizePhoneNumber(watchedPhone, watchedNationality);

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [selectedRole, setSelectedRole] = useState<ProfileRole>(initialRole);
    const [nationalities, setNationalities] = useState<any[]>([]);
    const [sportsList, setSportsList] = useState<{ value: string; label: string }[]>([]);
    const [positionsList, setPositionsList] = useState<{ value: string; label: string }[]>([]);
    const [sponsorsList, setSponsorsList] = useState<any[]>([]);
    const [scoutsList, setScoutsList] = useState<any[]>([]);
    const [clubsList, setClubsList] = useState<Club[]>([]);
    const [clubModalOpen, setClubModalOpen] = useState(false);
    const [customSportName, setCustomSportName] = useState('');
    const translateTimeouts = useRef<{ [key: string]: NodeJS.Timeout }>({});

    // Watch sport field to filter positions
    const watchedSport = Form.useWatch('sport', form);
    const isVolleyball = watchedSport === Sport.VOLLEYBALL || watchedSport === Sport.BEACH_VOLLEYBALL;

    useEffect(() => {
        if (open) {
            fetchMetaData();
            if (editingPlayer) {
                loadFullPlayerData(editingPlayer.id);
            } else {
                handleCreate();
            }
        }
    }, [open, editingPlayer]);

    // Update positions options when sport changes
    useEffect(() => {
        if (!watchedSport) {
            setPositionsList([]);
            return;
        }

        const sportCodes = getPositionsBySport(watchedSport);

        metaService.getPositions().then(allPositions => {
            const filtered = (allPositions || []).filter((p: any) => {
                const value = typeof p === 'string' ? p : p.value;
                if (['Coach', 'Player', 'مدرب', 'لاعب', 'Administrator', 'Referee', 'Photographer', 'إداري', 'اداري', 'حكم', 'مصور'].includes(value)) return false;
                if (sportCodes.length > 0) return sportCodes.includes(value);
                return isGenericPosition(value);
            }).map((p: any) => typeof p === 'string' ? { value: p, label: p } : p);

            setPositionsList(filtered);

            const currentPositions = form.getFieldValue('positions') || [];
            const validPositions = currentPositions.filter((cp: string) =>
                filtered.some((f: any) => f.value === cp)
            );
            if (validPositions.length !== currentPositions.length) {
                form.setFieldsValue({ positions: validPositions });
            }
        });
    }, [watchedSport]);

    const fetchMetaData = async () => {
        try {
            const results = await Promise.allSettled([
                metaService.getNationalities(),
                metaService.getSports(),
                metaService.getPositions(),
                sponsorService.getAll(),
                scoutService.getAll(),
                clubService.getAll()
            ]);

            const nats = results[0].status === 'fulfilled' ? results[0].value : [];
            const sports = results[1].status === 'fulfilled' ? results[1].value : [];
            const positions = results[2].status === 'fulfilled' ? results[2].value : [];
            const sponsors = results[3].status === 'fulfilled' ? results[3].value : null;
            const localScouts = results[4].status === 'fulfilled' ? results[4].value : [];
            const clubs = results[5].status === 'fulfilled' ? results[5].value : [];

            const filteredPositions = (positions || []).filter((p: any) => !['Coach', 'Player', 'مدرب', 'لاعب', 'Administrator', 'Referee', 'Photographer', 'إداري', 'اداري', 'حكم', 'مصور'].includes(p.value));
            setNationalities(nats);
            setSportsList(sports);
            setScoutsList(localScouts || []);
            setClubsList(Array.isArray(clubs) ? clubs : []);

            const initialSport = form.getFieldValue('sport') || editingPlayer?.sport;
            if (initialSport) {
                const sportCodes = getPositionsBySport(initialSport);
                if (sportCodes.length > 0) {
                    setPositionsList(filteredPositions.filter((p: any) => sportCodes.includes(p.value)));
                } else {
                    setPositionsList(filteredPositions);
                }
            } else {
                setPositionsList(filteredPositions);
            }

            setSponsorsList(sponsors?.data || sponsors || []);
        } catch (e) {
            console.error('Failed to fetch metadata', e);
        }
    };

    const loadFullPlayerData = async (id: string) => {
        setLoading(true);
        try {
            const fullPlayer = await playerService.getById(id);
            setSelectedRole(fullPlayer.role || ProfileRole.PLAYER);
            const formData: any = {
                ...fullPlayer,
                nameAr: fullPlayer.nameAr ?? (fullPlayer as any).name_ar,
                nationalityAr: fixNationalityAr(fullPlayer.nationalityAr ?? (fullPlayer as any).nationality_ar),
                clubAr: fullPlayer.clubAr ?? (fullPlayer as any).club_ar,
                club_id: String((fullPlayer as any).club_id ?? fullPlayer.club_id) || undefined,
                national_team_id: (fullPlayer as any).national_team_id ? String((fullPlayer as any).national_team_id) : undefined,
                positions: (fullPlayer.positions ?? []).map((p: string) => normalizePosition(p)),
                nationalId: fullPlayer.nationalId ?? (fullPlayer as any).national_id,
                jerseyNumber: fullPlayer.jerseyNumber || (fullPlayer as any).jersey_number,
                scout_id: fullPlayer.scoutId ?? (fullPlayer as any).scout_id,
                dealStatus: fullPlayer.dealStatus || (fullPlayer as any).deal_status,
                notes: fullPlayer.notes ?? (fullPlayer as any).internalNotes,
                notesAr: fullPlayer.notesAr ?? (fullPlayer as any).notes_ar ?? (fullPlayer as any).internalNotesAr,
                dateOfBirth: fullPlayer.dateOfBirth ? (String(fullPlayer.dateOfBirth).includes('-') ? dayjs(fullPlayer.dateOfBirth) : dayjs().year(Number(fullPlayer.dateOfBirth))) : undefined,
                marketValue: fullPlayer.marketValue ?? (fullPlayer as any).market_value,
                preferredFoot: fullPlayer.preferredFoot || (fullPlayer as any).preferred_foot,
                contractStartDate: fullPlayer.contractStartDate ? dayjs(fullPlayer.contractStartDate) : (fullPlayer as any).contract_start_date ? dayjs((fullPlayer as any).contract_start_date) : undefined,
                contractEndDate: fullPlayer.contractEndDate ? dayjs(fullPlayer.contractEndDate) : (fullPlayer as any).contract_end_date ? dayjs((fullPlayer as any).contract_end_date) : undefined,
                contractDuration: fullPlayer.contractDuration || (fullPlayer as any).contract_duration,
                contractStatus: fullPlayer.contractStatus || (fullPlayer as any).contract_status,
                contractNature: fullPlayer.contractNature || (fullPlayer as any).contract_nature || undefined,
                legalStatus: fullPlayer.legalStatus || (fullPlayer as any).legal_status || 'PROFESSIONAL',
                contractType: fullPlayer.contractType || (fullPlayer as any).contract_type || 'PROFESSIONAL',
                formContractFees: fullPlayer.contractFees ?? (fullPlayer as any).contract_fees,
                formContractFeesType: fullPlayer.contractFeesType ?? (fullPlayer as any).contract_fees_type,
                gender: fullPlayer.gender,
                volleyball_spike_reach: (fullPlayer as any).volleyballSpikeReach ?? (fullPlayer as any).volleyball_spike_reach,
                volleyball_block_reach: (fullPlayer as any).volleyballBlockReach ?? (fullPlayer as any).volleyball_block_reach,
                formPreviousClubs: fullPlayer.previousClubs ?? (fullPlayer as any).previous_clubs ?? [],
                formPreviousClubsAr: fullPlayer.previousClubsAr ?? (fullPlayer as any).previous_clubs_ar ?? [],
                formAchievements: fullPlayer.achievements ?? (fullPlayer as any).achievements ?? [],
                formAchievementsAr: fullPlayer.achievementsAr ?? (fullPlayer as any).achievements_ar ?? [],
                bornInKuwait: (fullPlayer.nationality === 'Kuwait' || fullPlayer.nationalityAr === 'الكويت' || (fullPlayer as any).nationality_ar === 'الكويت') ? true : (fullPlayer.bornInKuwait ?? (fullPlayer as any).born_in_kuwait ?? false),
                photos: fullPlayer.photos?.map((p: any) => ({ uid: p.id, name: p.caption || 'Photo', status: 'done', url: p.url })) || [],
                ashkanani_contracts: fullPlayer.documents
                    ?.filter((d: any) => String(d.type).toLowerCase() === 'contract')
                    ?.map((d: any) => ({
                        id: d.id,
                        name: d.name,
                        start_date: d.start_date || d.startDate ? dayjs(d.start_date || d.startDate) : undefined,
                        end_date: d.end_date || d.endDate ? dayjs(d.end_date || d.endDate) : undefined,
                        file: d.url ? [{ uid: d.id, name: d.name, status: 'done', url: d.url }] : []
                    })) || [],
                documents: [
                    ...(fullPlayer.documents?.filter((d: any) => String(d.type).toLowerCase() !== 'contract')?.map(d => ({ uid: d.id, name: d.name, status: 'done', url: d.url })) || []),
                ],
                cv_document: fullPlayer.cvUrl ? [{ uid: 'cv-1', name: t('players.cv_document'), status: 'done', url: fullPlayer.cvUrl }] : [],
                visibility: fullPlayer.visibility || (fullPlayer as any).visibility_settings,
                club_contracts: fullPlayer.clubContracts?.map(c => ({
                    ...c,
                    start_date: c.start_date ? dayjs(c.start_date) : undefined,
                    end_date: c.end_date ? dayjs(c.end_date) : undefined,
                    notes: (c as any).notes_ar || (c as any).notes || '',
                    notes_en: (c as any).notes || '',
                    file: c.file_url ? [{ uid: '-1', name: t('admin.players.contract_file'), status: 'done', url: c.file_url }] : []
                })) || [],
                rating: fullPlayer.rating ?? (fullPlayer as any).rating,
                fitnessRating: fullPlayer.fitnessRating ?? (fullPlayer as any).fitness_rating,
                speedRating: fullPlayer.speedRating ?? (fullPlayer as any).speed_rating,
                techniqueRating: fullPlayer.techniqueRating ?? (fullPlayer as any).technique_rating,
                isVerified: !!(fullPlayer.isVerified ?? (fullPlayer as any).is_verified),
                isRisingTalent: !!(fullPlayer.isRisingTalent ?? (fullPlayer as any).is_rising_talent),
                topAgentPick: !!(fullPlayer.topAgentPick ?? (fullPlayer as any).top_agent_pick),
                technicalReport: fullPlayer.technicalReport ?? (fullPlayer as any).technical_report,
                current_stats: (fullPlayer.stats && !Array.isArray(fullPlayer.stats)) ? fullPlayer.stats : ((fullPlayer as any).current_stats && !Array.isArray((fullPlayer as any).current_stats) ? (fullPlayer as any).current_stats : {}),
                bio: fullPlayer.bio ?? (fullPlayer as any).bio,
                bioAr: fullPlayer.bioAr ?? (fullPlayer as any).bio_ar,
                youtube_url: (() => {
                    const raw = fullPlayer.youtubeUrl || (fullPlayer as any).youtube_url;
                    if (!raw) return [];
                    if (Array.isArray(raw)) return raw;
                    try {
                        const decoded = JSON.parse(raw);
                        if (Array.isArray(decoded)) return decoded;
                    } catch (e) {}
                    return String(raw).split(',').map(s => ({ url: s.trim(), title: null })).filter(v => v.url);
                })(),
                transfermarkt_url: fullPlayer.transfermarktUrl || (fullPlayer as any).transfermarkt_url,
                instagram_url: fullPlayer.instagramUrl || (fullPlayer as any).instagram_url,
                drive_url: (fullPlayer as any).drive_url || (fullPlayer as any).driveUrl || (fullPlayer as any).google_drive_url,
                role: fullPlayer.role || (fullPlayer as any).profile_role || ProfileRole.PLAYER,
                sponsors: fullPlayer.sponsors?.map((s: any) => s.id) || [],
                certificates: fullPlayer.certificates?.map(c => ({
                    ...c,
                    file: c.certificate_file ? [{ uid: String(c.id), name: t('coaches.certificate_file'), status: 'done', url: c.certificate_file }] : []
                })) || [],
                designerType: fullPlayer.designerType || (fullPlayer as any).designer_type,
                volleyball_stats_pdf: (fullPlayer.volleyballStatsPdf || (fullPlayer as any).volleyball_stats_pdf) ? [{ uid: 'v-stats', name: t('players.volleyball_stats_pdf'), status: 'done', url: fullPlayer.volleyballStatsPdf || (fullPlayer as any).volleyball_stats_pdf }] : [],
                volleyball_ranking_image: (fullPlayer.volleyballRankingImage || (fullPlayer as any).volleyball_ranking_image) ? [{ uid: 'v-ranking', name: t('players.volleyball_ranking_image'), status: 'done', url: fullPlayer.volleyballRankingImage || (fullPlayer as any).volleyball_ranking_image }] : [],
                strategy_pdf: (fullPlayer.strategyPdf || (fullPlayer as any).strategy_pdf) ? [{ uid: 's-pdf', name: (fullPlayer.role || (fullPlayer as any).profile_role) === ProfileRole.PLAYER ? t('players.strategy_pdf') : t('players.work_plan_strategy_pdf', { defaultValue: 'استراتيجية خطة العمل' }), status: 'done', url: fullPlayer.strategyPdf || (fullPlayer as any).strategy_pdf }] : [],
            };

            if (!formData.name && formData.nameAr) formData.name = await translateText(formData.nameAr, 'ar', 'en');
            if (!formData.bio && formData.bioAr) formData.bio = await translateText(formData.bioAr, 'ar', 'en');

            // Auto-translate missing title_en for existing video titles (legacy data)
            if (Array.isArray(formData.youtube_url) && formData.youtube_url.length > 0) {
                const translationTasks = formData.youtube_url.map(async (video: any, idx: number) => {
                    if (video && video.title && !video.title_en && /[\u0600-\u06FF]/.test(video.title)) {
                        try {
                            const translated = await translateText(video.title, 'ar', 'en');
                            formData.youtube_url[idx] = { ...video, title_en: translated };
                        } catch (e) {
                            // silent fail - will just show Arabic title as fallback
                        }
                    }
                });
                await Promise.all(translationTasks);
            }

            form.setFieldsValue(formData);
        } catch (error) {
            message.error(t('messages.error_load'));
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        form.resetFields();
        setSelectedRole(ProfileRole.PLAYER);
        form.setFieldsValue({
            role: ProfileRole.PLAYER,
            visibility: {
                nationality: true, age: true, dateOfBirth: false, position: true, club: true, marketValue: true, preferredFoot: true, height: true, weight: true, previousClubs: true, dealStatus: true, contractInfo: false, photos: true, achievements: true, stats: true,
            },
            isVisible: true,
            formAchievements: [], formAchievementsAr: [], formPreviousClubs: [], formPreviousClubsAr: [],
            bornInKuwait: false,
        });
    };

    const handleValuesChange = (changedValues: any) => {
        const singleFields: Record<string, string> = { nameAr: 'name', name: 'nameAr', notesAr: 'notes', notes: 'notesAr', bioAr: 'bio', bio: 'bioAr' };
        Object.keys(changedValues).forEach(field => {
            const targetField = singleFields[field];
            if (targetField) {
                const value = changedValues[field];
                if (translateTimeouts.current[field]) clearTimeout(translateTimeouts.current[field]);
                translateTimeouts.current[field] = setTimeout(async () => {
                    if (!value || value.trim() === '') return;
                    const sourceLang = /[\u0600-\u06FF]/.test(value) ? 'ar' : 'en';
                    const targetLang = sourceLang === 'ar' ? 'en' : 'ar';
                    const currentTarget = form.getFieldValue(targetField);
                    if (!currentTarget || currentTarget.trim() === '') {
                        const translated = await translateText(value, sourceLang, targetLang);
                        form.setFieldsValue({ [targetField]: translated });
                    }
                }, 1500);
            }
        });

        // Auto-translate youtube video titles (Arabic -> English)
        if (changedValues.youtube_url && Array.isArray(changedValues.youtube_url)) {
            changedValues.youtube_url.forEach((item: any, idx: number) => {
                if (!item) return;
                if (item.title !== undefined && item.title !== null) {
                    const titleValue = item.title;
                    const timeoutKey = `youtube_title_${idx}`;
                    if (translateTimeouts.current[timeoutKey]) clearTimeout(translateTimeouts.current[timeoutKey]);
                    translateTimeouts.current[timeoutKey] = setTimeout(async () => {
                        if (!titleValue || titleValue.trim() === '') return;
                        const isArabic = /[\u0600-\u06FF]/.test(titleValue);
                        if (!isArabic) return; // Only translate Arabic -> English
                        const currentVideos = form.getFieldValue('youtube_url') || [];
                        const currentTitleEn = currentVideos[idx]?.title_en;
                        if (!currentTitleEn || currentTitleEn.trim() === '') {
                            const translated = await translateText(titleValue, 'ar', 'en');
                            const updatedVideos = [...currentVideos];
                            if (updatedVideos[idx]) {
                                updatedVideos[idx] = { ...updatedVideos[idx], title_en: translated };
                                form.setFieldsValue({ youtube_url: updatedVideos });
                            }
                        }
                    }, 1500);
                }
            });
        }

        if (changedValues.role) {
            const newRole = changedValues.role;
            const currentStatus = form.getFieldValue('dealStatus');
            setSelectedRole(newRole);
            if (newRole === ProfileRole.COACH) {
                if (currentStatus === DealStatus.FREE_AGENT) form.setFieldValue('dealStatus', DealStatus.FREE_AGENT_COACH);
            } else if (newRole === ProfileRole.PLAYER) {
                if (currentStatus === DealStatus.FREE_AGENT_COACH) form.setFieldValue('dealStatus', DealStatus.FREE_AGENT);
            }
        }
    };

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            setSaving(true);
            const selectedClub = clubsList.find(c => String(c.id) === String(values.club_id));
            const payload: any = {
                profile_role: values.role, name: values.name, name_ar: values.nameAr, email: values.email, phone: standardizePhoneNumber(values.phone, values.nationality), address: values.address, national_id: values.nationalId, sport: values.sport, nationality: values.nationality, nationality_ar: values.nationalityAr, date_of_birth: values.dateOfBirth ? values.dateOfBirth.format('YYYY-MM') : undefined, positions: Array.isArray(values.positions) ? values.positions : [], agent_id: values.agent_id || null, scout_id: values.scout_id || null, 
                club_id: values.club_id ? Number(values.club_id) : null, 
                national_team_id: values.national_team_id ? Number(values.national_team_id) : null,
                club: selectedClub ? selectedClub.name : (values.club_id === null ? null : values.club), 
                club_ar: selectedClub ? selectedClub.name_ar : (values.club_id === null ? null : values.clubAr), 
                market_value: (values.marketValue !== undefined && values.marketValue !== null) ? Number(values.marketValue) : null, preferred_foot: values.preferredFoot, deal_status: values.dealStatus, height: (values.height !== undefined && values.height !== null) ? Number(values.height) : null, weight: (values.weight !== undefined && values.weight !== null) ? Number(values.weight) : null, 
                volleyball_spike_reach: (values.volleyball_spike_reach !== undefined && values.volleyball_spike_reach !== null) ? Number(values.volleyball_spike_reach) : null,
                volleyball_block_reach: (values.volleyball_block_reach !== undefined && values.volleyball_block_reach !== null) ? Number(values.volleyball_block_reach) : null,
                jersey_number: (values.jerseyNumber !== undefined && values.jerseyNumber !== null) ? Number(values.jerseyNumber) : null, notes: values.notes, notes_ar: values.notesAr, internal_notes: values.notes, internal_notes_ar: values.notesAr, about: values.bio, about_ar: values.bioAr, contract_start_date: values.contractStartDate ? values.contractStartDate.format('YYYY-MM-DD') : undefined, contract_end_date: values.contractEndDate ? values.contractEndDate.format('YYYY-MM-DD') : undefined, contract_duration: values.contractDuration !== undefined && values.contractDuration !== null ? Number(values.contractDuration) : (values.contract_duration !== undefined && values.contract_duration !== null ? Number(values.contract_duration) : null),
                contract_status: values.contractNature === 'TERMINATION' ? ContractStatus.EXPIRED : (values.contractEndDate ? (dayjs(values.contractEndDate).isBefore(dayjs(), 'day') ? ContractStatus.EXPIRED : ContractStatus.ACTIVE) : ContractStatus.ACTIVE),
                contract_nature: values.contractNature || undefined, legal_status: values.legalStatus || 'PROFESSIONAL', contract_type: values.contractType || 'PROFESSIONAL', contract_fees: values.formContractFees !== undefined && values.formContractFees !== null ? Number(values.formContractFees) : null, contract_fees_type: values.formContractFeesType ?? 'FIXED', gender: values.gender,
                previous_clubs: Array.isArray(values.formPreviousClubs) ? values.formPreviousClubs : [], previous_clubs_ar: Array.isArray(values.formPreviousClubsAr) ? values.formPreviousClubsAr : [], achievements: Array.isArray(values.formAchievements) ? values.formAchievements : [], achievements_ar: Array.isArray(values.formAchievementsAr) ? values.formAchievementsAr : [], bio: values.bio, bio_ar: values.bioAr, biography: values.bio, biography_ar: values.bioAr,
                youtube_url: Array.isArray(values.youtube_url) ? JSON.stringify(values.youtube_url.filter((v: any) => v && v.url)) : values.youtube_url, 
                transfermarkt_url: values.transfermarkt_url, instagram_url: values.instagram_url, drive_url: values.drive_url, born_in_kuwait: !!values.bornInKuwait, current_stats: values.current_stats && !Array.isArray(values.current_stats) ? values.current_stats : ((editingPlayer as any)?.stats || (editingPlayer as any)?.current_stats || {}), is_visible: values.isVisible !== undefined ? !!values.isVisible : (editingPlayer ? (editingPlayer as any).isVisible : true), rating: values.rating !== undefined ? values.rating : (editingPlayer?.rating || 0), fitness_rating: values.fitnessRating !== undefined ? values.fitnessRating : (editingPlayer?.fitnessRating || (editingPlayer as any)?.fitness_rating || 0), speed_rating: values.speedRating !== undefined ? values.speedRating : (editingPlayer?.speedRating || (editingPlayer as any)?.speed_rating || 0), technique_rating: values.techniqueRating !== undefined ? values.techniqueRating : (editingPlayer?.techniqueRating || (editingPlayer as any)?.technique_rating || 0), is_verified: !!values.isVerified, is_rising_talent: !!values.isRisingTalent, top_agent_pick: !!values.topAgentPick, technical_report: values.technicalReport, sponsors: values.sponsors || [],
                designer_type: values.designerType,
                club_contracts: values.club_contracts?.map((c: any) => ({ ...c, notes_ar: c.notes, notes: c.notes_en, start_date: c.start_date ? dayjs(c.start_date).format('YYYY-MM-DD') : undefined, end_date: c.end_date ? dayjs(c.end_date).format('YYYY-MM-DD') : undefined, file: undefined })),
                certificates: values.certificates?.map((c: any) => ({ ...c, file: undefined })),
                visibility_settings: values.visibility || (editingPlayer as any)?.visibility || (editingPlayer as any)?.visibility_settings || { nationality: true, age: true, dateOfBirth: false, position: true, club: true, marketValue: true, preferredFoot: true, height: true, weight: true, previousClubs: true, dealStatus: true, contractInfo: false, photos: true, achievements: true, stats: true },
            };
            let updatedPlayerId = editingPlayer?.id;
            if (editingPlayer) {
                const { photos, documents, ashkanani_contracts, cv_document, volleyball_stats_pdf, volleyball_ranking_image, strategy_pdf, ...cleanPayload } = payload;
                const response = await playerService.update(editingPlayer.id, cleanPayload);
                await handleFileUploads(editingPlayer.id, values, response.clubContracts);
                message.success(t('messages.success_update'));
            } else {
                const { photos, documents, ashkanani_contracts, cv_document, volleyball_stats_pdf, volleyball_ranking_image, strategy_pdf, ...cleanPayload } = payload;
                const newPlayer = await playerService.create(cleanPayload);
                updatedPlayerId = newPlayer.id;
                await handleFileUploads(newPlayer.id, values, newPlayer.clubContracts);
                message.success(t('messages.success_save'));
            }
            onSuccess();
        } catch (error: any) {
            console.error('Submission error:', error);
            message.error(error.response?.data?.message || t('messages.error_save'));
        } finally { setSaving(false); }
    };

    const handleFileUploads = async (playerId: string, values: any, serverClubContracts?: any[]) => {
        if (values.photos?.length > 0) {
            const hasExistingMain = editingPlayer?.photos?.some((p: any) => p.isMain);
            let alreadySetMainInBatch = false;
            for (const fileObj of values.photos) {
                if (fileObj.originFileObj) {
                    const formData = new FormData();
                    formData.append('photo', fileObj.originFileObj);
                    if (!hasExistingMain && !alreadySetMainInBatch) { formData.append('is_main', '1'); alreadySetMainInBatch = true; }
                    else formData.append('is_main', '0');
                    await playerService.uploadPhoto(playerId, formData);
                }
            }
        }
        if (values.documents?.length > 0) {
            for (const fileObj of values.documents) {
                if (fileObj.originFileObj) {
                    const formData = new FormData();
                    formData.append('document', fileObj.originFileObj);
                    formData.append('name', fileObj.name);
                    formData.append('type', 'document');
                    await playerService.uploadDocument(playerId, formData);
                }
            }
        }
        if (values.ashkanani_contracts?.length > 0) {
            for (const contractItem of values.ashkanani_contracts) {
                const startDateStr = contractItem.start_date ? dayjs(contractItem.start_date).format('YYYY-MM-DD') : '';
                const endDateStr = contractItem.end_date ? dayjs(contractItem.end_date).format('YYYY-MM-DD') : '';
                
                if (contractItem.id) {
                    await playerService.updateDocument(playerId, contractItem.id, {
                        start_date: startDateStr || null,
                        end_date: endDateStr || null,
                    });
                } else {
                    const fileList = contractItem.file;
                    if (fileList?.length > 0 && fileList[0].originFileObj) {
                        const fileObj = fileList[0];
                        const formData = new FormData();
                        formData.append('document', fileObj.originFileObj);
                        formData.append('name', fileObj.name);
                        formData.append('type', 'contract');
                        if (startDateStr) formData.append('start_date', startDateStr);
                        if (endDateStr) formData.append('end_date', endDateStr);
                        await playerService.uploadDocument(playerId, formData);
                    }
                }
            }
        }
        if (values.cv_document?.length > 0) {
            for (const fileObj of values.cv_document) {
                if (fileObj.originFileObj) {
                    const formData = new FormData();
                    formData.append('cv', fileObj.originFileObj);
                    await playerService.uploadCV(playerId, formData);
                }
            }
        }
        if (values.club_contracts?.length > 0 && serverClubContracts) {
            for (const contractInput of values.club_contracts) {
                const fileList = contractInput.file;
                if (fileList?.length > 0 && fileList[0].originFileObj) {
                    let matchedServerContract = null;
                    if (contractInput.id) matchedServerContract = serverClubContracts.find(sc => String(sc.id) === String(contractInput.id));
                    else {
                        const inputStartDate = contractInput.start_date ? dayjs(contractInput.start_date).format('YYYY-MM-DD') : null;
                        matchedServerContract = serverClubContracts.find(sc => !sc.id_matched && (sc.club_name === contractInput.club_name || sc.club_name_ar === contractInput.club_name_ar) && (sc.start_date === inputStartDate || !sc.start_date && !inputStartDate));
                    }
                    if (matchedServerContract?.id) {
                        (matchedServerContract as any).id_matched = true;
                        const formData = new FormData();
                        formData.append('file', fileList[0].originFileObj);
                        await playerService.uploadClubContractFile(playerId, matchedServerContract.id, formData);
                    }
                }
            }
        }
        if (values.certificates?.length > 0) {
            // After saving, we need the server response to get the certificate IDs
            // But since update/create returns the full player, we can try to match by name/type
            const updatedPlayer = await playerService.getById(playerId);
            const serverCerts = updatedPlayer.certificates || [];
            
            for (const certInput of values.certificates) {
                const fileList = certInput.file;
                if (fileList?.length > 0 && fileList[0].originFileObj) {
                    let matchedServerCert = null;
                    if (certInput.id) matchedServerCert = serverCerts.find(sc => String(sc.id) === String(certInput.id));
                    else {
                        matchedServerCert = serverCerts.find(sc => !(sc as any).id_matched && sc.certificate_name === certInput.certificate_name && sc.certificate_type === certInput.certificate_type);
                    }
                    if (matchedServerCert?.id) {
                        (matchedServerCert as any).id_matched = true;
                        const formData = new FormData();
                        formData.append('file', fileList[0].originFileObj);
                        await playerService.uploadCertificateFile(playerId, matchedServerCert.id, formData);
                    }
                }
            }
        }
        if (values.volleyball_stats_pdf?.length > 0) {
            for (const fileObj of values.volleyball_stats_pdf) {
                if (fileObj.originFileObj) {
                    const formData = new FormData();
                    formData.append('file', fileObj.originFileObj);
                    await playerService.uploadVolleyballStatsPdf(playerId, formData);
                }
            }
        }
        if (values.volleyball_ranking_image?.length > 0) {
            for (const fileObj of values.volleyball_ranking_image) {
                if (fileObj.originFileObj) {
                    const formData = new FormData();
                    formData.append('file', fileObj.originFileObj);
                    await playerService.uploadVolleyballRankingImage(playerId, formData);
                }
            }
        }
        if (values.strategy_pdf?.length > 0) {
            for (const fileObj of values.strategy_pdf) {
                if (fileObj.originFileObj) {
                    const formData = new FormData();
                    formData.append('file', fileObj.originFileObj);
                    await playerService.uploadPlayerStrategyPdf(playerId, formData);
                }
            }
        }
    };

    return (
        <Modal
            title={editingPlayer ? (selectedRole === ProfileRole.COACH ? t('admin.players.edit_coach_title') : t('admin.players.edit_player_title')) : (selectedRole === ProfileRole.COACH ? t('admin.players.add_coach_title') : t('admin.players.add_player_title'))}
            open={open}
            onOk={handleSubmit}
            onCancel={onCancel}
            width={800}
            okText={t('common.save')}
            cancelText={t('common.cancel')}
            confirmLoading={saving}
            style={{ top: 20 }}
            className="player-edit-modal"
        >
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Typography.Text>{t('common.loading')}</Typography.Text>
                </div>
            ) : (
                <Form
                    form={form}
                    layout="vertical"
                    onValuesChange={handleValuesChange}
                    initialValues={{ isVisible: true, role: ProfileRole.PLAYER, gender: 'MALE', contractType: 'PROFESSIONAL', legalStatus: 'PROFESSIONAL', dealStatus: DealStatus.FREE_AGENT }}
                    className="mt-4"
                >
                    <Form.Item name="role" className="mb-6">
                        <Radio.Group optionType="button" buttonStyle="solid">
                            <Radio.Button value={ProfileRole.PLAYER}>{t('common.player')}</Radio.Button>
                            <Radio.Button value={ProfileRole.COACH}>{t('common.coach')}</Radio.Button>
                            <Radio.Button value={ProfileRole.ADMINISTRATOR}>{t('enums.ProfileRole.ADMINISTRATOR')}</Radio.Button>
                            <Radio.Button value={ProfileRole.REFEREE}>{t('enums.ProfileRole.REFEREE')}</Radio.Button>
                            <Radio.Button value={ProfileRole.PHOTOGRAPHER}>{t('enums.ProfileRole.PHOTOGRAPHER')}</Radio.Button>
                            <Radio.Button value={ProfileRole.DESIGNER}>{t('enums.ProfileRole.DESIGNER')}</Radio.Button>
                        </Radio.Group>
                    </Form.Item>

                    <Row gutter={[12, 12]}>
                        <Col xs={24} sm={8}><Form.Item name="email" label={t('common.email')} rules={[{ type: 'email' }]}><Input placeholder="player@example.com" /></Form.Item></Col>
                        <Col xs={24} sm={8}><Form.Item name="dateOfBirth" label={t('common.year_of_birth')}><DatePicker picker="month" className="w-full" /></Form.Item></Col>
                        <Col xs={24} sm={8}><Form.Item name="gender" label={t('common.gender')}><Select><Select.Option value="MALE">{t('common.male')}</Select.Option><Select.Option value="FEMALE">{t('common.female')}</Select.Option></Select></Form.Item></Col>
                    </Row>

                    <Row gutter={[12, 12]}>
                        <Col xs={24} sm={8}><Form.Item name="nameAr" label={t('players.arabic_name')}><Input /></Form.Item></Col>
                        <Col xs={24} sm={8}><Form.Item name="name" label={t('players.full_name')}><Input /></Form.Item></Col>
                        <Col xs={24} sm={8}><Form.Item name="nationalId" label={t('common.national_id')}><Input /></Form.Item></Col>
                    </Row>

                    <Row gutter={[12, 12]}>
                        <Col xs={24} sm={12}><Form.Item name="phone" label={t('common.phone_number')}><Input /></Form.Item></Col>
                        <Col xs={24} sm={12}><Form.Item name="address" label={t('common.address')}><Input /></Form.Item></Col>
                    </Row>

                    <Row gutter={[12, 12]}>
                        <Col xs={24}>
                            <Form.Item name="nationality" label={t('common.nationality')} rules={[{ required: true }]}>
                                <Select 
                                    showSearch 
                                    options={nationalities} 
                                    optionFilterProp="searchLabel"
                                    filterOption={(input, option) => {
                                        const norm = (s: string) => (s || '').toLowerCase().replace(/[أإآٱ]/g, 'ا').replace(/ة/g, 'ه').replace(/[ىی]/g, 'ي');
                                        return norm(String((option as any)?.searchLabel || '')).includes(norm(input));
                                    }}
                                    onChange={(val) => {
                                        const nat = nationalities.find(n => n.value === val);
                                        if (nat) {
                                            form.setFieldsValue({
                                                nationality: nat.value, // This is now 'Kuwaiti' etc.
                                                nationalityAr: nat.fullAr
                                            });
                                        }
                                    }} 
                                />
                            </Form.Item>
                            <Form.Item name="nationalityAr" noStyle><Input type="hidden" /></Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={[12, 12]}>
                        {selectedRole !== ProfileRole.DESIGNER && (
                            <Col xs={24} sm={selectedRole === ProfileRole.PLAYER ? 12 : 24}><Form.Item name="sport" label={t('common.sport')}><Select options={[{label: t('common.team_sports'), options: [Sport.FOOTBALL, Sport.BASKETBALL, Sport.VOLLEYBALL, Sport.HANDBALL, Sport.FUTSAL, Sport.WATER_POLO, Sport.CRICKET, Sport.RUGBY_UNION, Sport.RUGBY_LEAGUE, Sport.AMERICAN_FOOTBALL, Sport.BASEBALL, Sport.SOFTBALL, Sport.ICE_HOCKEY, Sport.FIELD_HOCKEY, Sport.LACROSSE, Sport.PAINTBALL, Sport.BEACH_SOCCER, Sport.BEACH_VOLLEYBALL].map(s => ({value: s, label: t(`enums.Sport.${String(s)}`, String(s))})).sort((a, b) => a.label.localeCompare(b.label))},{label: t('common.individual_sports'), options: Object.values(Sport).filter(s => ![Sport.FOOTBALL, Sport.BASKETBALL, Sport.VOLLEYBALL, Sport.HANDBALL, Sport.FUTSAL, Sport.WATER_POLO, Sport.CRICKET, Sport.RUGBY_UNION, Sport.RUGBY_LEAGUE, Sport.AMERICAN_FOOTBALL, Sport.BASEBALL, Sport.SOFTBALL, Sport.ICE_HOCKEY, Sport.FIELD_HOCKEY, Sport.LACROSSE, Sport.PAINTBALL, Sport.BEACH_SOCCER, Sport.BEACH_VOLLEYBALL].includes(s as Sport)).map(s => ({value: s, label: t(`enums.Sport.${String(s)}`, String(s))})).sort((a, b) => a.label.localeCompare(b.label))}]} /></Form.Item></Col>
                        )}
                        {selectedRole === ProfileRole.DESIGNER && (
                            <Col xs={24} sm={24}>
                                <Form.Item 
                                    name="designerType" 
                                    label={isAr ? 'تخصص التصميم' : 'Design Specialty'} 
                                    rules={[{ required: true }]}
                                >
                                    <Select className="rounded-lg h-10">
                                        {Object.values(DesignerType).map(type => (
                                            <Select.Option key={type} value={type}>
                                                {t(`enums.DesignerType.${type}`, { defaultValue: type })}
                                            </Select.Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Col>
                        )}
                        {selectedRole === ProfileRole.PLAYER && <Col xs={24} sm={12}><Form.Item name="scout_id" label={t('scouts.scout')}><Select options={scoutsList.map(s => ({value: s.id, label: s.name}))} /></Form.Item></Col>}
                    </Row>

                    {(selectedRole !== ProfileRole.REFEREE && selectedRole !== ProfileRole.PHOTOGRAPHER && selectedRole !== ProfileRole.DESIGNER) && (
                        <>
                        <Divider orientation="left" orientationMargin={0}>
                          <Typography.Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>
                            {isAr ? 'الأندية والمنتخبات' : 'Clubs & National Teams'}
                          </Typography.Text>
                        </Divider>
                        <Row gutter={[12, 12]} align="middle">
                            <Col xs={24} sm={11}>
                                <Form.Item label={isAr ? 'النادي الحالي' : 'Current Club'}>
                                    <Space.Compact style={{ width: '100%' }}>
                                        <Form.Item name="club_id" noStyle><Select showSearch placeholder={t('directory.club_placeholder', { defaultValue: 'Search or select club...' })} optionFilterProp="label" optionLabelProp="searchLabel" allowClear options={clubsList.map(c => ({ value: String(c.id), label: <Space><Avatar size="small" src={c.logo_url} />{isAr ? (c.name_ar || c.name) : (c.name || c.name_ar)}</Space>, searchLabel: isAr ? (c.name_ar || c.name) : (c.name || c.name_ar) }))} filterOption={(input, option) => ((option as any)?.searchLabel ?? '').toLowerCase().includes(input.toLowerCase())} /></Form.Item>
                                        <Button icon={<PlusOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />} onClick={() => setClubModalOpen(true)} />
                                    </Space.Compact>
                                </Form.Item>
                            </Col>
                            <Col xs={24} sm={13}>
                                <Form.Item name="national_team_id" label={isAr ? 'المنتخب الحالي' : 'Current National Team'}>
                                    <Select
                                        showSearch
                                        placeholder={isAr ? 'ابحث أو اختر المنتخب...' : 'Search or select national team...'}
                                        optionFilterProp="label"
                                        optionLabelProp="searchLabel"
                                        allowClear
                                        options={clubsList.map(c => ({
                                            value: String(c.id),
                                            label: <Space><Avatar size="small" src={c.logo_url} icon={<TeamOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />} />{isAr ? (c.name_ar || c.name) : (c.name || c.name_ar)}</Space>,
                                            searchLabel: isAr ? (c.name_ar || c.name) : (c.name || c.name_ar)
                                        }))}
                                        filterOption={(input, option) => ((option as any)?.searchLabel ?? '').toLowerCase().includes(input.toLowerCase())}
                                    />
                                </Form.Item>
                            </Col>
                        </Row>
                        </>
                    )}


                    {selectedRole === ProfileRole.PLAYER && (
                        <Row gutter={[12, 12]}>
                            <Col xs={24} sm={8}><Form.Item name="positions" label={t('common.positions')}><Select mode="multiple" options={positionsList.map(p => ({value: p.value, label: t(`enums.Position.${p.label}`, { defaultValue: p.label }) }))} /></Form.Item></Col>
                            {(() => {
                                const sportName = String(watchedSport || '');
                                const handSportActive = isHandSport(sportName);
                                const footSportActive = isFootSport(sportName);
                                if (!handSportActive && !footSportActive) return null;
                                return (
                                    <Col xs={8} sm={4}>
                                        <Form.Item name="preferredFoot" label={handSportActive ? t('players.preferred_hand') : t('common.preferred_foot')}>
                                            <Select options={Object.values(PreferredFoot).filter((v) => typeof v === 'string').map((foot: string) => ({value: foot, label: handSportActive ? t(`enums.PreferredHand.${foot}`) : t(`enums.PreferredFoot.${foot}`) }))} />
                                        </Form.Item>
                                    </Col>
                                );
                            })()}
                            <Col xs={8} sm={4}><Form.Item name="height" label={t('players.height_cm')}><InputNumber style={{ width: '100%' }} /></Form.Item></Col>
                            <Col xs={8} sm={4}><Form.Item name="weight" label={t('players.weight_kg')}><InputNumber style={{ width: '100%' }} /></Form.Item></Col>
                            <Col xs={8} sm={4}><Form.Item name="jerseyNumber" label={t('common.jersey_number')}><InputNumber style={{ width: '100%' }} /></Form.Item></Col>
                            {(() => {
                                const sportName = String(watchedSport || '');
                                const isVolley = sportName === 'Volleyball' || sportName === 'Beach Volleyball';
                                return isVolley ? (
                                    <>
                                        <Col xs={12} sm={6}><Form.Item name="volleyball_spike_reach" label={t('players.volleyball_spike_reach')}><InputNumber style={{ width: '100%' }} /></Form.Item></Col>
                                        <Col xs={12} sm={6}><Form.Item name="volleyball_block_reach" label={t('players.volleyball_block_reach')}><InputNumber style={{ width: '100%' }} /></Form.Item></Col>
                                    </>
                                ) : null;
                            })()}
                        </Row>
                    )}

                    {(selectedRole !== ProfileRole.REFEREE && selectedRole !== ProfileRole.PHOTOGRAPHER && selectedRole !== ProfileRole.DESIGNER) && (
                        <Row gutter={[12, 12]}>
                            <Col xs={24} sm={12}><Form.Item name="marketValue" label={t('players.market_value')}><InputNumber style={{ width: '100%' }} /></Form.Item></Col>
                            <Col xs={24} sm={12}>
                                <Form.Item name="dealStatus" label={t('common.contract_status')}>
                                    <Select className="rounded-lg">
                                        {selectedRole === ProfileRole.COACH ? (
                                            <>
                                                <Select.Option value={DealStatus.FREE_AGENT_COACH}>{t('enums.DealStatus.FREE_AGENT')}</Select.Option>
                                                <Select.Option value={DealStatus.SIGNED}>{t('enums.DealStatus.SIGNED')}</Select.Option>
                                            </>
                                        ) : (
                                            <>
                                                <Select.Option value={DealStatus.FREE_AGENT}>{t('enums.DealStatus.FREE_AGENT')}</Select.Option>
                                                <Select.Option value={DealStatus.SIGNED}>{t('enums.DealStatus.SIGNED')}</Select.Option>
                                            </>
                                        )}
                                    </Select>
                                </Form.Item>
                            </Col>
                        </Row>
                    )}

                    {/* Previous Clubs & Achievements - For PLAYER, COACH, ADMINISTRATOR */}
                    {(selectedRole === ProfileRole.PLAYER || selectedRole === ProfileRole.COACH || selectedRole === ProfileRole.ADMINISTRATOR) && (
                        <>
                            <Divider />
                            <Title level={5}>{t('players.previous_clubs')}</Title>
                            <Row gutter={[12, 12]}>
                                <Col xs={24} sm={12}><Form.Item name="formPreviousClubsAr" label={isAr ? 'الأندية السابقة (بالعربي)' : 'Previous Clubs (Arabic)'}><Select mode="tags" className="rounded-lg" placeholder="نادي 1، نادي 2..." /></Form.Item></Col>
                                <Col xs={24} sm={12}><Form.Item name="formPreviousClubs" label={isAr ? 'الأندية السابقة (بالإنجليزي)' : 'Previous Clubs (English)'}><Select mode="tags" className="rounded-lg" placeholder="Club 1, Club 2..." /></Form.Item></Col>
                            </Row>
                            <Row gutter={[12, 12]}>
                                <Col xs={24} sm={12}><Form.Item name="formAchievementsAr" label={t('players.achievements_ar', { defaultValue: 'Achievements (Arabic)' })}><Select mode="tags" className="rounded-lg" placeholder="إنجاز 1، إنجاز 2..." /></Form.Item></Col>
                                <Col xs={24} sm={12}><Form.Item name="formAchievements" label={t('players.achievements', { defaultValue: 'Achievements' })}><Select mode="tags" className="rounded-lg" placeholder="Achievement 1, Achievement 2..." /></Form.Item></Col>
                            </Row>
                        </>
                    )}

                    <Row gutter={[12, 12]}>
                        <Col xs={24} sm={12}><Form.Item name="notesAr" label={t('common.notes_ar')}><Input.TextArea rows={2} /></Form.Item></Col>
                        <Col xs={24} sm={12}><Form.Item name="notes" label={t('common.notes')}><Input.TextArea rows={2} /></Form.Item></Col>
                    </Row>

                    <Row gutter={[12, 12]}>
                        <Col xs={24} sm={12}>
                            <Form.Item
                                name="bioAr"
                                label={isAr ? 'التقرير الفني (عربي)' : 'Technical Report (Arabic)'}
                                extra={isAr ? 'ستُترجم تلقائياً للإنجليزية' : 'Auto-translates to English'}
                            >
                                <Input.TextArea
                                    rows={4}
                                    placeholder={isAr ? 'اكتب التقرير الفني بالعربية...' : 'Write technical report in Arabic...'}
                                    dir="rtl"
                                    style={{ resize: 'none' }}
                                />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                            <Form.Item
                                name="bio"
                                label={isAr ? 'التقرير الفني (إنجليزي)' : 'Technical Report (English)'}
                                extra={isAr ? 'تُملأ تلقائياً أو اكتب مباشرة' : 'Auto-filled or type directly'}
                            >
                                <Input.TextArea
                                    rows={4}
                                    placeholder={isAr ? 'ستُملأ تلقائياً...' : 'Auto-filled from Arabic...'}
                                    style={{ resize: 'none' }}
                                />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Divider />
                    <Title level={5}>{t('players.youtube_url')}</Title>
                    <Form.List name="youtube_url">
                        {(fields, { add, remove }) => (
                            <div className="flex flex-col gap-2">
                                {fields.map(({ key, name, ...restField }) => (
                                    <Row key={key} gutter={[8, 8]} align="middle">
                                        <Col xs={10}>
                                            <Form.Item {...restField} name={[name, 'title']} label={isAr ? 'عنوان الفيديو (عربي)' : 'Video Title (Arabic)'} className="mb-0">
                                                <Input placeholder={isAr ? 'مثلاً: أجمل أهدافه' : 'e.g. أجمل أهدافه'} />
                                            </Form.Item>
                                        </Col>
                                        <Col xs={10}>
                                            <Form.Item {...restField} name={[name, 'title_en']} label={isAr ? 'العنوان (إنجليزي) - يُترجم تلقائياً' : 'Title (English) - Auto-translated'} className="mb-0">
                                                <Input placeholder={isAr ? 'يُملأ تلقائياً...' : 'e.g. Best Goals'} />
                                            </Form.Item>
                                        </Col>
                                        <Col xs={22}>
                                            <Form.Item {...restField} name={[name, 'url']} label={t('players.youtube_url')} rules={[{ required: true }]} className="mb-0">
                                                <Input placeholder="https://youtube.com/..." />
                                            </Form.Item>
                                        </Col>
                                        <Col xs={2}>
                                            <Button type="text" danger icon={<DeleteOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />} onClick={() => remove(name)} style={{ marginTop: 30 }} />
                                        </Col>
                                    </Row>
                                ))}
                                <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />} className="mt-2">
                                    {isAr ? 'إضافة فيديو جديد' : 'Add New Video'}
                                </Button>
                            </div>
                        )}
                    </Form.List>

                    <Row gutter={[12, 12]} className="mt-4">
                        {(selectedRole !== ProfileRole.REFEREE && selectedRole !== ProfileRole.PHOTOGRAPHER && selectedRole !== ProfileRole.DESIGNER) && (
                            <Col xs={12} sm={12}><Form.Item name="transfermarkt_url" label={isVolleyball ? 'Volleybox.net' : t('players.transfermarkt_url')}><Input /></Form.Item></Col>
                        )}
                        <Col xs={12} sm={12}><Form.Item name="instagram_url" label={t('players.instagram_url')}><Input /></Form.Item></Col>
                        {(selectedRole === ProfileRole.PHOTOGRAPHER || selectedRole === ProfileRole.DESIGNER) && (
                            <Col xs={12} sm={12}><Form.Item name="drive_url" label={isAr ? 'جوجل درايف (Google Drive)' : 'Google Drive'}><Input placeholder="https://drive.google.com/..." /></Form.Item></Col>
                        )}
                    </Row>

                    {(selectedRole !== ProfileRole.REFEREE && selectedRole !== ProfileRole.PHOTOGRAPHER && selectedRole !== ProfileRole.DESIGNER) && (
                        <>
                            <Divider />
                            <Title level={5}>{t('admin.players.club_contracts_title')}</Title>
                            <Form.List name="club_contracts">
                                {(fields, { add, remove }) => (
                                    <div className="flex flex-col gap-4">
                                        {fields.map(({ key, name, ...restField }) => (
                                            <div key={key} className="p-4 border rounded-lg bg-gray-50/50 relative">
                                                <Button type="text" danger icon={<DeleteOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />} onClick={() => remove(name)} className="absolute top-2 right-2 z-10" />
                                                <Row gutter={[12, 12]}>
                                                    <Col xs={24} sm={6}><Form.Item {...restField} name={[name, 'club_name_ar']} label={t('admin.players.club_name_ar')}><Input onBlur={async (e) => {
                                                        const val = e.target.value;
                                                        if (val && !form.getFieldValue(['club_contracts', name, 'club_name'])) {
                                                            const translated = await translateText(val, 'ar', 'en');
                                                            const currentContracts = form.getFieldValue('club_contracts');
                                                            currentContracts[name].club_name = translated;
                                                            form.setFieldsValue({ club_contracts: currentContracts });
                                                        }
                                                    }} /></Form.Item></Col>
                                                    <Col xs={24} sm={6}><Form.Item {...restField} name={[name, 'club_name']} label={t('admin.players.club_name')}><Input /></Form.Item></Col>
                                                    <Col xs={12} sm={6}><Form.Item {...restField} name={[name, 'start_date']} label={t('admin.contracts.start_date')}><DatePicker className="w-full" /></Form.Item></Col>
                                                    <Col xs={12} sm={6}><Form.Item {...restField} name={[name, 'end_date']} label={t('admin.contracts.end_date')}><DatePicker className="w-full" /></Form.Item></Col>
                                                    <Col xs={24} sm={6}>
                                                        <Form.Item {...restField} name={[name, 'file']} label={t('admin.players.contract_file')} valuePropName="fileList" getValueFromEvent={(e) => Array.isArray(e) ? e : e?.fileList}>
                                                            <Upload beforeUpload={() => false} maxCount={1}><Button icon={<UploadOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}>{t('admin.players.upload_contract')}</Button></Upload>
                                                        </Form.Item>
                                                    </Col>
                                                </Row>
                                            </div>
                                        ))}
                                        <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}>{t('admin.players.add_club_contract')}</Button>
                                    </div>
                                )}
                            </Form.List>
                        </>
                    )}

                    <Divider />
                    <Title level={5}>{isAr ? 'الصورة الشخصية' : 'Profile Photo'}</Title>
                    <Row gutter={[12, 12]}>
                        <Col xs={24} sm={12}>
                            <Form.Item 
                                name="photos" 
                                label={t('players.player_image')} 
                                valuePropName="fileList" 
                                getValueFromEvent={(e) => Array.isArray(e) ? e : e?.fileList}
                            >
                                <Upload 
                                    beforeUpload={() => false} 
                                    listType="picture" 
                                    multiple
                                    onRemove={async (file) => {
                                        if (editingPlayer && (file.status === 'done' || !file.originFileObj)) {
                                            return new Promise((resolve) => {
                                                showConfirmModal({
                                                    title: t('messages.confirm_delete_title'),
                                                    content: t('players.delete_photo_confirm', { defaultValue: 'Are you sure you want to delete this photo?' }),
                                                    okText: t('common.delete'),
                                                    okType: 'danger',
                                                    onConfirm: async () => {
                                                        try {
                                                            await playerService.deletePhoto(editingPlayer.id, file.uid);
                                                            resolve(true);
                                                        } catch { resolve(false); }
                                                        finally { resolve(false); }
                                                    },
                                                    onCancel: () => resolve(false),
                                                });
                                            });
                                        }
                                        return true;
                                    }}
                                >
                                    <Button icon={<UploadIcon />}>{t('players.upload_photo')}</Button>
                                </Upload>
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                            <Form.Item 
                                name="cv_document" 
                                label={t('players.cv_document')} 
                                valuePropName="fileList" 
                                getValueFromEvent={(e) => Array.isArray(e) ? e : e?.fileList}
                            >
                                <Upload beforeUpload={() => false} maxCount={1} onRemove={async (file) => {
                                    if (editingPlayer && (file.status === 'done' || !file.originFileObj)) {
                                        return new Promise((resolve) => {
                                            showConfirmModal({
                                                title: t('messages.confirm_delete_title'),
                                                content: t('players.delete_document_confirm'),
                                                okText: t('common.delete'),
                                                okType: 'danger',
                                                onConfirm: async () => {
                                                    try {
                                                        await playerService.deleteCV(editingPlayer.id);
                                                        resolve(true);
                                                    } catch { resolve(false); }
                                                    finally { resolve(false); }
                                                },
                                                onCancel: () => resolve(false),
                                            });
                                        });
                                    }
                                    return true;
                                }}>
                                    <Button icon={<UploadIcon />}>{t('players.upload_cv')}</Button>
                                </Upload>
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                            <Form.Item 
                                name="strategy_pdf" 
                                label={selectedRole === ProfileRole.PLAYER ? t('players.strategy_pdf') : t('players.work_plan_strategy_pdf', { defaultValue: 'استراتيجية خطة العمل' })} 
                                valuePropName="fileList" 
                                getValueFromEvent={(e) => Array.isArray(e) ? e : e?.fileList}
                            >
                                <Upload beforeUpload={() => false} maxCount={1} onRemove={async (file) => {
                                    if (editingPlayer && (file.status === 'done' || !file.originFileObj)) {
                                        return new Promise((resolve) => {
                                            showConfirmModal({
                                                title: t('messages.confirm_delete_title'),
                                                content: isAr ? 
                                                    (selectedRole === ProfileRole.PLAYER ? 'هل أنت متأكد من حذف ملف الاستراتيجية؟' : 'هل أنت متأكد من حذف ملف خطة العمل؟') 
                                                    : (selectedRole === ProfileRole.PLAYER ? 'Are you sure you want to delete the strategy PDF?' : 'Are you sure you want to delete the action plan PDF?'),
                                                okText: t('common.delete'),
                                                okType: 'danger',
                                                onConfirm: async () => {
                                                    try {
                                                        await playerService.deletePlayerStrategyPdf(editingPlayer.id);
                                                        resolve(true);
                                                    } catch { resolve(false); }
                                                    finally { resolve(false); }
                                                },
                                                onCancel: () => resolve(false),
                                            });
                                        });
                                    }
                                    return true;
                                }}>
                                    <Button icon={<UploadIcon />}>{selectedRole === ProfileRole.PLAYER ? t('players.strategy_pdf') : t('players.work_plan_strategy_pdf', { defaultValue: 'استراتيجية خطة العمل' })}</Button>
                                </Upload>
                            </Form.Item>
                        </Col>
                        {isVolleyball && selectedRole === ProfileRole.PLAYER && (
                            <>
                                <Col xs={24} sm={12}>
                                    <Form.Item 
                                        name="volleyball_stats_pdf" 
                                        label={t('players.volleyball_stats_pdf')} 
                                        valuePropName="fileList" 
                                        getValueFromEvent={(e) => Array.isArray(e) ? e : e?.fileList}
                                    >
                                        <Upload beforeUpload={() => false} maxCount={1} onRemove={async (file) => {
                                            if (editingPlayer && (file.status === 'done' || !file.originFileObj)) {
                                                return new Promise((resolve) => {
                                                    showConfirmModal({
                                                        title: t('messages.confirm_delete_title'),
                                                        content: isAr ? 'هل أنت متأكد من حذف ملف الإحصائيات؟' : 'Are you sure you want to delete the stats PDF?',
                                                        okText: t('common.delete'),
                                                        okType: 'danger',
                                                        onConfirm: async () => {
                                                            try {
                                                                await playerService.deleteVolleyballStatsPdf(editingPlayer.id);
                                                                resolve(true);
                                                            } catch { resolve(false); }
                                                            finally { resolve(false); }
                                                        },
                                                        onCancel: () => resolve(false),
                                                    });
                                                });
                                            }
                                            return true;
                                        }}>
                                            <Button icon={<UploadIcon />}>{t('players.volleyball_stats_pdf')}</Button>
                                        </Upload>
                                    </Form.Item>
                                </Col>
                                <Col xs={24} sm={12}>
                                    <Form.Item 
                                        name="volleyball_ranking_image" 
                                        label={t('players.volleyball_ranking_image')} 
                                        valuePropName="fileList" 
                                        getValueFromEvent={(e) => Array.isArray(e) ? e : e?.fileList}
                                    >
                                        <Upload beforeUpload={() => false} maxCount={1} listType="picture" onRemove={async (file) => {
                                            if (editingPlayer && (file.status === 'done' || !file.originFileObj)) {
                                                return new Promise((resolve) => {
                                                    showConfirmModal({
                                                        title: t('messages.confirm_delete_title'),
                                                        content: isAr ? 'هل أنت متأكد من حذف صورة الترتيب؟' : 'Are you sure you want to delete the ranking image?',
                                                        okText: t('common.delete'),
                                                        okType: 'danger',
                                                        onConfirm: async () => {
                                                            try {
                                                                await playerService.deleteVolleyballRankingImage(editingPlayer.id);
                                                                resolve(true);
                                                            } catch { resolve(false); }
                                                            finally { resolve(false); }
                                                        },
                                                        onCancel: () => resolve(false),
                                                    });
                                                });
                                            }
                                            return true;
                                        }}>
                                            <Button icon={<UploadIcon />}>{t('players.volleyball_ranking_image')}</Button>
                                        </Upload>
                                    </Form.Item>
                                </Col>
                            </>
                        )}
                    </Row>

                    <Divider />
                    <Title level={5}>{t('admin.players.ashkanani_contracts', { defaultValue: 'Contracts with Ashkanani' })}</Title>
                    <Row gutter={[12, 12]}>
                        <Col xs={12} sm={8}><Form.Item name="contractNature" label={t('common.contract_nature')}><Select options={[{ value: 'SIGNING', label: t('enums.ContractNature.SIGNING') }, { value: 'AUTHORIZATION', label: t('enums.ContractNature.AUTHORIZATION') }, { value: 'NOT_JOINED', label: t('enums.ContractNature.NOT_JOINED') }, { value: 'TERMINATION', label: t('enums.ContractNature.TERMINATION') }]} allowClear /></Form.Item></Col>
                        <Col xs={12} sm={8}><Form.Item name="contractType" label={t('common.contract_type')}><Select options={[{ value: 'PROFESSIONAL', label: t('enums.ContractType.PROFESSIONAL') }, { value: 'AMATEUR', label: t('enums.ContractType.AMATEUR') }]} /></Form.Item></Col>
                    </Row>

                    <Form.List name="ashkanani_contracts">
                        {(fields, { add, remove }) => (
                            <div className="flex flex-col gap-4">
                                {fields.map(({ key, name, ...restField }) => (
                                    <div key={key} className="p-4 border rounded-lg bg-gray-50/50 relative">
                                        <Button 
                                            type="text" 
                                            danger 
                                            icon={<DeleteOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />} 
                                            onClick={async () => {
                                                const contractVal = form.getFieldValue(['ashkanani_contracts', name]);
                                                if (contractVal?.id && editingPlayer) {
                                                    showConfirmModal({
                                                        title: t('messages.confirm_delete_title'),
                                                        content: t('players.delete_document_confirm', { defaultValue: 'Are you sure you want to delete this contract PDF?' }),
                                                        okText: t('common.delete'),
                                                        okType: 'danger',
                                                        onConfirm: async () => {
                                                            try {
                                                                await playerService.deleteDocument(editingPlayer.id, contractVal.id);
                                                                remove(name);
                                                                message.success(t('messages.success_delete'));
                                                            } catch {
                                                                message.error(t('messages.error_delete'));
                                                            }
                                                        }
                                                    });
                                                } else {
                                                    remove(name);
                                                }
                                            }} 
                                            className="absolute top-2 right-2 z-10" 
                                        />
                                        <Row gutter={[12, 12]}>
                                            <Col xs={12} sm={8}>
                                                <Form.Item {...restField} name={[name, 'start_date']} label={t('admin.contracts.start_date')}>
                                                    <DatePicker className="w-full" />
                                                </Form.Item>
                                            </Col>
                                            <Col xs={12} sm={8}>
                                                <Form.Item {...restField} name={[name, 'end_date']} label={t('admin.contracts.end_date')}>
                                                    <DatePicker className="w-full" />
                                                </Form.Item>
                                            </Col>
                                            <Col xs={24} sm={8}>
                                                <Form.Item {...restField} name={[name, 'file']} label={t('players.contract_doc')} valuePropName="fileList" getValueFromEvent={(e) => Array.isArray(e) ? e : e?.fileList} rules={[{ required: !form.getFieldValue(['ashkanani_contracts', name, 'id']), message: t('messages.required_field', { defaultValue: 'File is required' }) }]}>
                                                    <Upload beforeUpload={() => false} maxCount={1}>
                                                        <Button icon={<UploadOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}>{t('admin.players.upload_contract')}</Button>
                                                    </Upload>
                                                </Form.Item>
                                            </Col>
                                        </Row>
                                    </div>
                                ))}
                                <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}>
                                    {isAr ? 'إضافة عقد جديد' : 'Add New Contract'}
                                </Button>
                            </div>
                        )}
                    </Form.List>

                    {/* Certificates Section - Generalized for all roles */}
                    <>
                        <Divider />
                        <Title level={5}>{t('coaches.certificates_title', { defaultValue: 'Certificates & Accreditations' })}</Title>
                        <Form.List name="certificates">
                            {(fields, { add, remove }) => (
                                <div className="flex flex-col gap-4">
                                    {fields.map(({ key, name, ...restField }) => (
                                        <div key={key} className="p-4 border rounded-lg bg-gray-50/50 relative">
                                            <Button type="text" danger icon={<DeleteOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />} onClick={() => remove(name)} className="absolute top-2 right-2 z-10" />
                                            <Row gutter={[12, 12]}>
                                                <Col xs={24} sm={12}><Form.Item {...restField} name={[name, 'certificate_name']} label={t('coaches.certificate_name', { defaultValue: 'Certificate Name' })} rules={[{ required: true }]}><Input /></Form.Item></Col>
                                                <Col xs={24} sm={12}>
                                                    <Form.Item {...restField} name={[name, 'certificate_type']} label={t('coaches.certificate_type')} rules={[{ required: true }]}>
                                                        <Select>
                                                            {[
                                                                'Coaching License', 
                                                                'Fitness / Conditioning', 
                                                                'First Aid / CPR', 
                                                                'Sports Nutrition', 
                                                                'Sports Psychology', 
                                                                'Sports Management', 
                                                                'Sports Marketing', 
                                                                'Sports Law',
                                                                'Referee License',
                                                                'VAR License',
                                                                'Media / Photography',
                                                                'Video Editing',
                                                                'Medical / Physiotherapy',
                                                                'Other'
                                                            ].map(type => {
                                                                const key = type.toLowerCase()
                                                                    .replace(/ \/ /g, '_')
                                                                    .replace(/\s+/g, '_');
                                                                return (
                                                                    <Select.Option key={type} value={type}>
                                                                        {t(`coaches.cert_types.${key}`, { defaultValue: type })}
                                                                    </Select.Option>
                                                                );
                                                            })}
                                                        </Select>
                                                    </Form.Item>
                                                </Col>
                                                <Col xs={24} sm={8}><Form.Item {...restField} name={[name, 'issuing_body']} label={t('coaches.issuing_body')} rules={[{ required: true }]}><Input /></Form.Item></Col>
                                                <Col xs={24} sm={8}>
                                                    <Form.Item {...restField} name={[name, 'level']} label={t('coaches.level')} rules={[{ required: true }]}>
                                                        <Select>
                                                            {['Beginner', 'Intermediate', 'Advanced', 'Professional'].map(level => (
                                                                <Select.Option key={level} value={level}>{t(`coaches.levels.${level.toLowerCase()}`, { defaultValue: level })}</Select.Option>
                                                            ))}
                                                        </Select>
                                                    </Form.Item>
                                                </Col>
                                                <Col xs={24} sm={8}><Form.Item {...restField} name={[name, 'year_obtained']} label={t('coaches.year_obtained')}><InputNumber className="w-full" min={1900} max={dayjs().year()} /></Form.Item></Col>
                                                <Col xs={24} sm={12}>
                                                    <Form.Item {...restField} name={[name, 'source_type']} label={t('coaches.source_type')} rules={[{ required: true }]}>
                                                        <Select>
                                                            {['Sports Federation', 'Academy', 'University', 'Online Course', 'Club Training', 'Other'].map(source => (
                                                                <Select.Option key={source} value={source}>{t(`coaches.sources.${source.replace(/\s+/g, '_').toLowerCase()}`, { defaultValue: source })}</Select.Option>
                                                            ))}
                                                        </Select>
                                                    </Form.Item>
                                                </Col>
                                                <Col xs={24} sm={12}>
                                                    <Form.Item {...restField} name={[name, 'file']} label={t('coaches.certificate_file', { defaultValue: 'Certificate File' })} valuePropName="fileList" getValueFromEvent={(e) => Array.isArray(e) ? e : e?.fileList}>
                                                        <Upload beforeUpload={() => false} maxCount={1}><Button icon={<UploadOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}>{t('coaches.upload_certificate', { defaultValue: 'Upload Certificate' })}</Button></Upload>
                                                    </Form.Item>
                                                </Col>
                                            </Row>
                                        </div>
                                    ))}
                                    <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}>{t('coaches.add_certificate', { defaultValue: 'Add Certificate' })}</Button>
                                    </div>
                                )}
                            </Form.List>
                        </>

                    <Divider />
                    <Form.Item
                        name="sponsors"
                        label={isAr ? 'الشركات الراعية' : 'Sponsors'}
                        extra={isAr ? 'اختر الشركات الراعية المرتبطة بهذا العضو' : 'Select sponsors associated with this member'}
                    >
                        <Select
                            mode="multiple"
                            allowClear
                            showSearch
                            placeholder={isAr ? 'اختر الراعيين...' : 'Select sponsors...'}
                            filterOption={(input, option) =>
                                String(option?.label || '').toLowerCase().includes(input.toLowerCase())
                            }
                            options={sponsorsList.map((s: any) => ({
                                value: s.id,
                                label: isAr ? (s.name_ar || s.name_en) : (s.name_en || s.name_ar),
                            }))}
                        />
                    </Form.Item>

                    <Form.Item name="isVisible" label={t('players.visibility')} valuePropName="checked"><Switch checkedChildren={t('players.public')} unCheckedChildren={t('players.private')} /></Form.Item>
                </Form>
            )}

            <Modal 
                title={isAr ? 'إضافة نادي جديد' : 'Add New Club'} 
                open={clubModalOpen} 
                onCancel={() => setClubModalOpen(false)} 
                footer={null} 
                destroyOnClose
            >
                <Form layout="vertical" onFinish={async (values) => {
                    try {
                        const formData = new FormData();
                        formData.append('name', values.name);
                        if (values.name_ar) formData.append('name_ar', values.name_ar);
                        if (values.logo?.length > 0 && values.logo[0].originFileObj) {
                            formData.append('logo', values.logo[0].originFileObj);
                        }
                        const newClub = await clubService.create(formData);
                        setClubsList(prev => [...prev, newClub]);
                        form.setFieldValue('club_id', String(newClub.id));
                        setClubModalOpen(false);
                        message.success(t('messages.success_create'));
                    } catch (err) { message.error(t('messages.error_save')); }
                }}>
                    <Form.Item name="name" label={t('common.name_en')} rules={[{ required: true }]}><Input /></Form.Item>
                    <Form.Item name="name_ar" label={t('common.name_ar')}><Input /></Form.Item>
                    <Form.Item
                        name="logo"
                        label={isAr ? 'شعار النادي (اختياري)' : 'Club Logo (Optional)'}
                        valuePropName="fileList"
                        getValueFromEvent={(e) => Array.isArray(e) ? e : e?.fileList}
                    >
                        <Upload
                            beforeUpload={() => false}
                            maxCount={1}
                            listType="picture"
                            accept="image/*"
                        >
                            <Button icon={<UploadIcon />}>
                                {isAr ? 'رفع الشعار' : 'Upload Logo'}
                            </Button>
                        </Upload>
                    </Form.Item>
                    <Form.Item><Button type="primary" htmlType="submit" block loading={loading}>{t('common.save')}</Button></Form.Item>
                </Form>
            </Modal>
        </Modal>
    );
};

export default PlayerEditModal;
