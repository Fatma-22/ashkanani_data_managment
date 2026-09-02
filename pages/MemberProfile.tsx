import React, { useState, useEffect, useCallback } from 'react';
import dayjs from 'dayjs';
import {
  Card, Form, Input, Button, Upload, Avatar, message, Row, Col, Typography, Divider,
  Tag, Alert, Modal, Select, Tabs, InputNumber, Space, Badge, Tooltip, Grid, Spin, Empty, Checkbox, notification, Radio, Switch, DatePicker
} from 'antd';
import {
  UserOutlined, UploadOutlined, LockOutlined, SaveOutlined, IdcardOutlined,
  SearchOutlined, EyeOutlined, EditOutlined, MailOutlined, PhoneOutlined, GlobalOutlined,
  TrophyOutlined, FileTextOutlined, CameraOutlined, WarningOutlined,
  CheckCircleOutlined, ClockCircleOutlined, InfoCircleOutlined, BankOutlined,
  ManOutlined, WomanOutlined, StarOutlined, TeamOutlined, EnvironmentOutlined,
  YoutubeOutlined, InstagramOutlined, CloudUploadOutlined,
  SafetyCertificateOutlined, ExclamationCircleOutlined, CalendarOutlined,
  PlusCircleOutlined, PlusOutlined, ThunderboltOutlined, DollarOutlined, TagOutlined,
  MedicineBoxOutlined, DeleteOutlined, FilePdfOutlined, PictureOutlined, ArrowsAltOutlined, InteractionOutlined
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { formatCurrency, formatDate, getFormattedDuration, getDealStatusTranslation, translateToEnglish, translateToArabic, isArabicText, translateText, fixNationalityAr } from '../utils/helpers';
import DynamicTranslate from '../components/DynamicTranslate';
import { Player, Sport, PreferredFoot, DealStatus, ProfileRole, MemberType, ContractStatus, DesignerType, UserRole } from '../types';
import profileService from '../services/profileService';
import { playerService } from '../services/playerService';
import { metaService } from '../services/metaService';
import apiClient from '../services/api';
import { WORLD_COUNTRIES } from '../utils/countries';
import { generateNutritionPdf } from '../utils/pdfExport';
import { clubService } from '../services/clubService';
import { Club } from '../types';
import showConfirmModal from '../components/ConfirmModal';
import { getPositionsBySport, isGenericPosition } from '../utils/positions';
import { GiRunningShoe } from 'react-icons/gi';
import { FaHandPaper } from 'react-icons/fa';
import { isHandSport, isFootSport, hasLimbPreference } from '../utils/sports';
import { form } from 'framer-motion/client';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;

// Helper: calculate days since last update
const daysSinceUpdate = (updatedAt?: string): number => {
  if (!updatedAt) return 9999;
  const lastUpdate = new Date(updatedAt);
  const now = new Date();
  return Math.floor((now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24));
};

// Helper: Safely get club name from string or object
const getClubName = (club: any, isAr: boolean, clubsList: any[] = []): string => {
  if (!club) return '';

  // If it's a string, try to find the club in the clubsList to get the translation
  if (typeof club === 'string') {
    const match = clubsList.find(c =>
      c.name?.toLowerCase() === club.toLowerCase() ||
      c.name_ar === club ||
      String(c.id) === club
    );
    if (match) {
      return isAr ? (match.name_ar || match.name || '') : (match.name || match.name_ar || '');
    }
    return club;
  }

  if (typeof club === 'object') {
    return isAr ? (club.name_ar || club.name || '') : (club.name || club.name_ar || '');
  }
  return String(club);
};

const getCountryLabel = (countryValue: string | undefined, isAr: boolean): string => {
  if (!countryValue) return '';
  const country = WORLD_COUNTRIES.find(c => c.value === countryValue);
  if (country) {
    return isAr ? country.labelAr : country.labelEn;
  }
  return countryValue;
};

export const MemberProfile: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user, updateUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const screens = Grid.useBreakpoint();
  const isAr = i18n.language === 'ar';

  // State
  const [activeTab, setActiveTab] = useState('account');
  const [loading, setLoading] = useState(false);
  const [cvLoading, setCvLoading] = useState(false);
  const [player, setPlayer] = useState<Player | null>(null);
  const [cvFound, setCvFound] = useState(false);
  const [cvAttempted, setCvAttempted] = useState(false);
  const [isCVModalOpen, setIsCVModalOpen] = useState(false);
  const [isMarketValueModalOpen, setIsMarketValueModalOpen] = useState(false);
  const [tempMarketValue, setTempMarketValue] = useState<number | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [showUpdateAlert, setShowUpdateAlert] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>('PLAYER');
  const [nutritionLoading, setNutritionLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [nutritionData, setNutritionData] = useState<any>(null);
  const [nationalities, setNationalities] = useState<{ value: string; label: string; fullAr?: string; fullEn?: string; searchLabel?: string }[]>([]);
  const [positionsList, setPositionsList] = useState<{ value: string; label: string }[]>([]);
  const [clubsList, setClubsList] = useState<Club[]>([]);
  const [clubModalOpen, setClubModalOpen] = useState(false);
  const translateTimeouts = React.useRef<{ [key: string]: NodeJS.Timeout }>({});

  // Forms
  const [accountForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [cvForm] = Form.useForm();

  const handleCountryChange = (countryValue: string) => {
    const country = WORLD_COUNTRIES.find(c => c.value === countryValue);
    if (country) {
      accountForm.setFieldsValue({ phone: country.dialCode });
    }
  };

  useEffect(() => {
    if (user) {
      accountForm.setFieldsValue({
        name: user.name,
        email: user.email,
        organization: user.organization || (user as any).company,
        phone: user.phone,
        country: user.country
      });
    }
  }, [user, accountForm]);

  // Watch sport field to filter positions
  const watchedSport = Form.useWatch('sport', cvForm);

  const handSportActive = isHandSport(watchedSport);
  const footSportActive = isFootSport(watchedSport);

  // Fetch meta data
  useEffect(() => {
    metaService.getNationalities().then(setNationalities).catch(() => setNationalities([]));
    clubService.getAll().then(setClubsList).catch((err) => {
      if (err.response?.status !== 403) {
        console.error('Failed to fetch clubs', err);
      }
      setClubsList([]);
    });
  }, []);

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

      const currentPositions = cvForm.getFieldValue('positions') || [];
      const validPositions = Array.isArray(currentPositions)
        ? currentPositions.filter((cp: string) => filtered.some((f: any) => f.value === cp))
        : [];

      if (validPositions.length !== (Array.isArray(currentPositions) ? currentPositions.length : 0)) {
        cvForm.setFieldsValue({ positions: validPositions });
      }
    });
  }, [watchedSport, cvForm]);

  // Sync Form Values when player changes
  useEffect(() => {
    if (player) {
      setSelectedRole(player.role || 'PLAYER');
      const initialClubId = player.club && typeof player.club === 'object'
        ? String(player.club.id)
        : (player.club_id ? String(player.club_id) : undefined);

      // Separate identity fields to ensure they are set from the player record explicitly
      const identityFields = {
        name: player.name,
        nameAr: (player as any).name_ar || player.nameAr,
        email: player.email,
        phone: player.phone,
        address: player.address,
        nationalId: player.nationalId || (player as any).national_id,
        dateOfBirth: player.dateOfBirth ? dayjs(String(player.dateOfBirth)) : undefined,
        nationality: player.nationality,
        nationalityAr: fixNationalityAr(player.nationalityAr),
        role: player.role,
        sport: player.sport,
        positions: player.positions,
        club_id: initialClubId,
        national_team_id: (player as any).national_team_id ? String((player as any).national_team_id) : undefined,
        gender: player.gender,
        height: player.height,
        weight: player.weight,
        volleyball_spike_reach: (player as any).volleyballSpikeReach ?? (player as any).volleyball_spike_reach,
        volleyball_block_reach: (player as any).volleyballBlockReach ?? (player as any).volleyball_block_reach,
        dealStatus: player.dealStatus || (player as any).deal_status,
        preferredFoot: player.preferredFoot,
        jerseyNumber: player.jerseyNumber,
        bornInKuwait: (player as any).bornInKuwait == 1 || player.bornInKuwait === true || (player as any).is_born_in_kuwait == 1 || (player as any).is_born_in_kuwait === true,
        marketValue: player.marketValue || (player as any).market_value,
        bio_ar: (player as any).bio_ar || (player as any).bioAr,
        bio: (player as any).bio,
        youtube_url: (() => {
          const raw = (player as any).youtube_url || player.youtubeUrl;
          if (typeof raw === 'string' && raw.trim().startsWith('[')) {
            try { return JSON.parse(raw); } catch (e) { return [{ url: raw }]; }
          }
          return typeof raw === 'string' ? [{ url: raw }] : raw;
        })(),
        transfermarkt_url: (player as any).transfermarkt_url || player.transfermarktUrl,
        instagram_url: (player as any).instagram_url || player.instagramUrl,
        google_drive_url: (player as any).drive_url || (player as any).driveUrl || (player as any).google_drive_url,
      };

      cvForm.setFieldsValue(identityFields);

      // Auto-match club by name if ID is missing
      if (!(player as any).club_id && !(player as any).clubId && (player.club || (player as any).clubAr)) {
        const match = clubsList.find(c =>
          (player.club && c.name?.toLowerCase() === (typeof player.club === 'string' ? player.club.toLowerCase() : (player.club as any).name?.toLowerCase())) ||
          ((player as any).clubAr && c.name_ar === (player as any).clubAr)
        );
        if (match) {
          cvForm.setFieldValue('club_id', String(match.id));
        }
      }

      // Prepare and translate arrays (achievements, previous clubs)
      const achievementsAr = (player as any).achievements_ar || (player as any).achievementsAr || [];
      const achievements = (player as any).achievements || [];
      const previousClubsAr = (player as any).previous_clubs_ar || (player as any).previousClubsAr || [];
      const previousClubs = (player as any).previous_clubs || (player as any).previousClubs || [];

      const prepareData = async () => {
        const parseArray = (val: any) => {
          if (Array.isArray(val)) return val.filter((item: any) => item && String(item).trim() !== '');
          if (typeof val === 'string') {
            try {
              const parsed = JSON.parse(val);
              return Array.isArray(parsed) ? parsed.filter((item: any) => item && String(item).trim() !== '') : (val.trim() ? [val] : []);
            } catch (e) {
              return val.includes(',') ? val.split(',').map((s: string) => s.trim()).filter((s: string) => s) : (val.trim() ? [val] : []);
            }
          }
          return [];
        };

        let finalAchievements = parseArray(achievements);
        let finalAchievementsAr = parseArray(achievementsAr);
        let finalPreviousClubs = parseArray(previousClubs);
        let finalPreviousClubsAr = parseArray(previousClubsAr);

        if (finalAchievements.length === 0 && finalAchievementsAr.length > 0) {
          try {
            finalAchievements = await Promise.all(finalAchievementsAr.map(a => translateText(a, 'ar', 'en')));
          } catch (e) { console.warn('Error translating achievements to English', e); }
        } else if (finalAchievementsAr.length === 0 && finalAchievements.length > 0) {
          try {
            finalAchievementsAr = await Promise.all(finalAchievements.map(a => translateText(a, 'en', 'ar')));
          } catch (e) { console.warn('Error translating achievements to Arabic', e); }
        }

        if (finalPreviousClubs.length === 0 && finalPreviousClubsAr.length > 0) {
          try {
            finalPreviousClubs = await Promise.all(finalPreviousClubsAr.map(a => translateText(a, 'ar', 'en')));
          } catch (e) { console.warn('Error translating previous clubs to English', e); }
        } else if (finalPreviousClubsAr.length === 0 && finalPreviousClubs.length > 0) {
          try {
            finalPreviousClubsAr = await Promise.all(finalPreviousClubs.map(a => translateText(a, 'en', 'ar')));
          } catch (e) { console.warn('Error translating previous clubs to Arabic', e); }
        }

        // Auto-translate missing title_en for youtube video titles (legacy data)
        const rawYoutubeUrl = cvForm.getFieldValue('youtube_url') || [];
        if (Array.isArray(rawYoutubeUrl) && rawYoutubeUrl.some((v: any) => v && v.title && !v.title_en && /[\u0600-\u06FF]/.test(v.title))) {
          try {
            const translated = await Promise.all(
              rawYoutubeUrl.map(async (video: any) => {
                if (video && video.title && !video.title_en && /[\u0600-\u06FF]/.test(video.title)) {
                  const enTitle = await translateText(video.title, 'ar', 'en');
                  return { ...video, title_en: enTitle };
                }
                return video;
              })
            );
            cvForm.setFieldValue('youtube_url', translated);
          } catch (e) { console.warn('Error translating youtube titles', e); }
        }

        cvForm.setFieldsValue({
          formAchievementsAr: finalAchievementsAr,
          formAchievements: finalAchievements,
          formPreviousClubs: finalPreviousClubs,
          formPreviousClubsAr: finalPreviousClubsAr,
        });
      };

      prepareData().catch(e => console.error('Error in prepareData:', e));

      // Photos and CV Document
      cvForm.setFieldsValue({
        photos: player.photos?.map((p: any) => ({
          uid: p.id,
          name: p.caption || 'Photo',
          status: 'done',
          url: p.url,
        })) || [],
        cv_document: player.cvUrl ? [{
          uid: 'cv-1',
          name: t('players.cv_document'),
          status: 'done',
          url: player.cvUrl,
        }] : [],
        certificates: player.certificates?.map((c: any) => ({
          ...c,
          file: c.certificate_file ? [{
            uid: `cert-${c.id}`,
            name: c.certificate_name,
            status: 'done',
            url: c.certificate_file
          }] : []
        })) || [],
        // Read-only reference fields
        contractStartDate: player.contractStartDate ? dayjs(String(player.contractStartDate)).format('YYYY-MM-DD') : undefined,
        contractEndDate: player.contractEndDate ? dayjs(String(player.contractEndDate)).format('YYYY-MM-DD') : undefined,
        contractStatus: player.contractStatus ? t(`enums.ContractStatus.${player.contractStatus}`, { defaultValue: player.contractStatus }) : undefined,
        contractType: player.contractType ? t(`enums.ContractType.${player.contractType}`, { defaultValue: player.contractType }) : undefined,
        contractFees: player.contractFees ? (player.contractFeesType === 'PERCENTAGE' ? `${Math.round(Number(player.contractFees))}%` : player.contractFees) : undefined,
        contractNature: player.contractNature ? t(`enums.ContractNature.${player.contractNature}`, { defaultValue: player.contractNature }) : undefined,
        volleyball_stats_pdf: (player as any).volleyball_stats_pdf || (player as any).volleyballStatsPdf ? [{
          uid: 'v-stats',
          name: t('players.volleyball_stats_pdf'),
          status: 'done',
          url: (player as any).volleyball_stats_pdf || (player as any).volleyballStatsPdf,
        }] : [],
        volleyball_ranking_image: (player as any).volleyball_ranking_image || (player as any).volleyballRankingImage ? [{
          uid: 'v-ranking',
          name: t('players.volleyball_ranking_image'),
          status: 'done',
          url: (player as any).volleyball_ranking_image || (player as any).volleyballRankingImage,
        }] : [],
      });
    }
  }, [player, cvForm, t, isAr, clubsList]);


  // Re-sync form when clubsList loads to ensure dropdown is populated
  useEffect(() => {
    if (player && clubsList.length > 0) {
      const clubId = (player as any).club_id || (player as any).clubId || (player.club as any)?.id;
      if (clubId) {
        const strClubId = String(clubId);
        // Verify the club exists in the list
        const clubExists = clubsList.some(c => String(c.id) === strClubId);
        if (clubExists) {
          cvForm.setFieldsValue({
            club_id: strClubId
          });
        } else {
          console.warn(`Club with ID ${strClubId} not found in clubs list. Available clubs: ${clubsList.map(c => String(c.id)).join(', ')}`);
        }
      }
    }
  }, [clubsList, player, cvForm]);

  // Lookup CV automatically
  const handleLookupCV = useCallback(async (phone?: string) => {
    if (!phone) return;
    setCvLoading(true);
    setCvAttempted(true);
    try {
      let result = null;
      result = await profileService.getMyCV(phone);

      if (result) {
        // Normalize the player object to handle snake_case from API
        const normalized: any = {
          ...result,
          id: result.id,
          name: result.name,
          nameAr: result.name_ar || result.nameAr,
          email: result.email,
          phone: result.phone,
          address: result.address,
          nationalId: result.national_id || result.nationalId,
          nationality: result.nationality,
          nationalityAr: fixNationalityAr(result.nationality_ar || result.nationalityAr),
          dateOfBirth: result.date_of_birth || result.dateOfBirth,
          gender: result.gender,
          sport: result.sport,
          positions: result.positions || [],
          height: result.height,
          weight: result.weight,
          club_id: result.club?.id || result.club_id || result.clubId,
          club: getClubName(result.club, false, clubsList),
          clubAr: getClubName(result.club_ar || result.clubAr || result.club?.name_ar, true, clubsList),
          jerseyNumber: result.jersey_number || result.jerseyNumber,
          preferredFoot: result.preferred_foot || result.preferredFoot,
          marketValue: result.market_value || result.marketValue,
          dealStatus: result.deal_status || result.dealStatus,
          bornInKuwait: (result.nationality === 'Kuwait' || result.nationality_ar === 'الكويت' || result.nationalityAr === 'الكويت') ? true : (result.is_born_in_kuwait == 1 || result.is_born_in_kuwait === true || result.bornInKuwait == 1 || result.bornInKuwait === true),
          youtubeUrl: result.youtube_url || result.youtubeUrl,
          youtube_url: result.youtube_url || result.youtubeUrl,
          transfermarktUrl: result.transfermarkt_url || result.transfermarktUrl,
          transfermarkt_url: result.transfermarkt_url || result.transfermarktUrl,
          instagramUrl: result.instagram_url || result.instagramUrl,
          instagram_url: result.instagram_url || result.instagramUrl,
          drive_url: result.drive_url || result.driveUrl || result.google_drive_url,
          driveUrl: result.drive_url || result.driveUrl || result.google_drive_url,
          google_drive_url: result.drive_url || result.driveUrl || result.google_drive_url,
          previousClubs: result.previous_clubs || result.previousClubs || [],
          previousClubsAr: result.previous_clubs_ar || result.previousClubsAr || [],
          achievements: result.achievements || [],
          achievementsAr: result.achievements_ar || result.achievementsAr || [],
          bio: result.bio || (result as any).biography,
          bio_ar: result.bio_ar || (result as any).bioAr || (result as any).biography_ar,
          bioAr: result.bio_ar || (result as any).bioAr || (result as any).biography_ar,
          role: result.role || result.profile_role,
          designerType: result.designer_type || result.designerType,
          isApproved: result.is_approved || result.isApproved,
          // Contract fields (from API response)
          contractStartDate: result.contractStartDate || result.contract_start_date,
          contractEndDate: result.contractEndDate || result.contract_end_date,
          contractStatus: result.contractStatus || result.contract_status,
          contractType: result.contractType || result.contract_type,
          contractFees: result.contractFees || result.contract_fees,
          contractFeesType: result.contractFeesType || result.contract_fees_type,
          contractDuration: result.contractDuration || result.contract_duration,
          contractNature: result.contractNature || result.contract_nature,
          shareToken: result.share_token || result.shareToken || result.share_link?.split('share_token=')[1],
          userId: result.user_id || result.userId,
          updatedAt: result.updatedAt || result.updated_at,
          createdAt: result.createdAt || result.created_at,
          strategyPdf: result.strategyPdf || result.strategy_pdf,
        };
        setPlayer(normalized);
        setCvFound(true);
        if (daysSinceUpdate(normalized.updatedAt) >= 365) {
          setShowUpdateAlert(true);
        } else {
          setShowUpdateAlert(false);
        }

        // Show approval notification logic
        if (normalized.isApproved) {
          const notifKey = `cv_approved_notif_${normalized.id}`;
          if (!localStorage.getItem(notifKey)) {
            localStorage.setItem(notifKey, '1');
            const isArLang = i18n.language === 'ar';

            // Logic to check if it's "Already had a CV" or "Newly Approved"
            // INDICATOR 1: If the CV is NOT linked to this user's ID yet, it's definitely pre-existing from directory
            // INDICATOR 2: If the CV was created before the user registered
            const userCreatedDate = (user as any)?.created_at || user?.createdAt;
            const cvCreatedDate = normalized.createdAt;

            const userCreated = userCreatedDate ? new Date(userCreatedDate) : new Date();
            const cvCreated = cvCreatedDate ? new Date(cvCreatedDate) : new Date();

            // If it's found by phone (matching) but user_id is null/different, OR if it's objectively older
            const isPreExisting = !normalized.user_id || normalized.user_id !== user?.id || (cvCreated.getTime() < userCreated.getTime() - 60000);

            notification.success({
              message: isPreExisting ? t('profile.already_have_cv_title') : t('profile.cv_approved_title'),
              description: isPreExisting ? t('profile.already_have_cv_desc') : t('profile.cv_approved_desc'),
              placement: isArLang ? 'topLeft' : 'topRight',
              duration: 8,
            });
          }
        }
      }
    } catch (error: any) {
      // Silent fail - no CV found is a normal state for new members
    } finally {
      setCvLoading(false);
    }
  }, [cvForm, t, user, i18n]);

  // Auto-load CV data when component mounts
  useEffect(() => {
    if (user?.phone) {
      handleLookupCV(user.phone);
    } else {
      setCvAttempted(true);
    }
  }, [user?.phone, handleLookupCV]);

  useEffect(() => {
    if (activeTab === 'nutrition' && !nutritionData) {
      loadNutrition();
    }
  }, [activeTab]);

  const loadNutrition = async () => {
    setNutritionLoading(true);
    try {
      const data = await profileService.getMyNutrition();
      setNutritionData(data);
    } catch (error) {
      console.error('Error loading nutrition:', error);
    } finally {
      setNutritionLoading(false);
    }
  };

  const handleCVFileUploads = async (playerId: string, values: any) => {
    if (values.photos && values.photos.length > 0) {
      const existingPhotosCount = player?.photos?.length || 0;
      for (const fileObj of values.photos) {
        if (fileObj.originFileObj) {
          const formData = new FormData();
          formData.append('photo', fileObj.originFileObj);
          formData.append('is_main', existingPhotosCount === 0 ? '1' : '0');
          await profileService.uploadMyPhoto(playerId, formData);
        }
      }
    }
    if (values.cv_document && values.cv_document.length > 0) {
      for (const fileObj of values.cv_document) {
        if (fileObj.originFileObj) {
          const formData = new FormData();
          formData.append('cv', fileObj.originFileObj);
          await profileService.uploadMyCVDocument(playerId, formData);
        }
      }
    }

    // Handle Certificates
    if (values.certificates && values.certificates.length > 0) {
      // We need to fetch the updated player to get the certificate IDs for file upload
      const updatedPlayer = await playerService.getById(playerId);
      const serverCerts = updatedPlayer.certificates || [];

      for (const certInput of values.certificates) {
        const fileList = certInput.file;
        if (fileList?.length > 0 && fileList[0].originFileObj) {
          let matchedServerCert = null;
          if (certInput.id) {
            matchedServerCert = serverCerts.find((sc: any) => String(sc.id) === String(certInput.id));
          } else {
            // Match by name and type for new certificates
            matchedServerCert = serverCerts.find((sc: any) =>
              !(sc as any).id_matched &&
              sc.certificate_name === certInput.certificate_name &&
              sc.certificate_type === certInput.certificate_type
            );
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

    if (values.volleyball_stats_pdf && values.volleyball_stats_pdf.length > 0) {
      for (const fileObj of values.volleyball_stats_pdf) {
        if (fileObj.originFileObj) {
          const formData = new FormData();
          formData.append('file', fileObj.originFileObj);
          await profileService.uploadVolleyballStatsPdf(playerId, formData);
        }
      }
    }

    if (values.volleyball_ranking_image && values.volleyball_ranking_image.length > 0) {
      for (const fileObj of values.volleyball_ranking_image) {
        if (fileObj.originFileObj) {
          const formData = new FormData();
          formData.append('file', fileObj.originFileObj);
          await profileService.uploadVolleyballRankingImage(playerId, formData);
        }
      }
    }
  };

  const handleSaveAccount = async (values: any) => {
    setLoading(true);
    try {
      let response: any;
      if (avatarFile) {
        const formData = new FormData();
        formData.append('_method', 'PUT');
        formData.append('name', values.name);
        formData.append('email', values.email);
        formData.append('phone', values.phone);
        formData.append('country', values.country);
        formData.append('avatar', avatarFile);
        response = await profileService.updateProfileWithFile(formData);
      } else {
        response = await profileService.updateProfile({
          name: values.name,
          email: values.email,
          phone: values.phone,
          country: values.country,
          organization: values.organization,
          company: values.organization,
        });
      }
      if (response.success) {
        updateUser(response.data);
        message.success(t('profile.account_updated'));
        setAvatarFile(null);
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || t('profile.update_failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (values: any) => {
    setLoading(true);
    try {
      const response = await profileService.updateProfile({
        current_password: values.currentPassword,
        new_password: values.newPassword,
        new_password_confirmation: values.confirmPassword,
      });
      if (response.success) {
        message.success(t('profile.password_changed'));
        passwordForm.resetFields();
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || t('profile.password_change_failed'));
    } finally {
      setLoading(false);
    }
  };

  const onValuesChange = (changedValues: any) => {
    // Smart Translation for Single Text Fields (Current Club)
    if (changedValues.clubAr) {
      const val = changedValues.clubAr;
      const field = 'club';
      if (translateTimeouts.current[field]) clearTimeout(translateTimeouts.current[field]);
      translateTimeouts.current[field] = setTimeout(async () => {
        if (!val || val.trim() === '') return;
        const translated = await translateText(val, 'ar', 'en');
        cvForm.setFieldsValue({ [field]: translated });
      }, 1500);
    }
    if (changedValues.club) {
      const val = changedValues.club;
      const field = 'clubAr';
      if (translateTimeouts.current[field]) clearTimeout(translateTimeouts.current[field]);
      translateTimeouts.current[field] = setTimeout(async () => {
        if (!val) return;
        const translated = await translateText(val, 'en', 'ar');
        cvForm.setFieldsValue({ [field]: translated });
      }, 1500);
    }

    // Smart Translation for Array Items (Previous Clubs)
    if (changedValues.formPreviousClubsAr) {
      const val = changedValues.formPreviousClubsAr;
      const enField = 'formPreviousClubs';
      if (translateTimeouts.current[enField]) clearTimeout(translateTimeouts.current[enField]);
      translateTimeouts.current[enField] = setTimeout(async () => {
        if (!val || val.length === 0) return;
        const translated = await Promise.all(val.map(async (club: string) => {
          if (/[\u0600-\u06FF]/.test(club)) return await translateText(club, 'ar', 'en');
          return club;
        }));
        cvForm.setFieldsValue({ [enField]: translated });
      }, 2000);
    }
    if (changedValues.formPreviousClubs) {
      const val = changedValues.formPreviousClubs;
      const arField = 'formPreviousClubsAr';
      if (translateTimeouts.current[arField]) clearTimeout(translateTimeouts.current[arField]);
      translateTimeouts.current[arField] = setTimeout(async () => {
        if (!val || val.length === 0) return;
        const translated = await Promise.all(val.map(async (club: string) => {
          if (!/[\u0600-\u06FF]/.test(club)) return await translateText(club, 'en', 'ar');
          return club;
        }));
        cvForm.setFieldsValue({ [arField]: translated });
      }, 2000);
    }

    // Smart Translation for Array Items (Achievements)
    if (changedValues.formAchievementsAr) {
      const val = changedValues.formAchievementsAr;
      const enField = 'formAchievements';
      if (translateTimeouts.current[enField]) clearTimeout(translateTimeouts.current[enField]);
      translateTimeouts.current[enField] = setTimeout(async () => {
        if (!val || val.length === 0) return;
        const translated = await Promise.all(val.map(async (ach: string) => {
          if (/[\u0600-\u06FF]/.test(ach)) return await translateText(ach, 'ar', 'en');
          return ach;
        }));
        cvForm.setFieldsValue({ [enField]: translated });
      }, 2000);
    }
    if (changedValues.formAchievements) {
      const val = changedValues.formAchievements;
      const arField = 'formAchievementsAr';
      if (translateTimeouts.current[arField]) clearTimeout(translateTimeouts.current[arField]);
      translateTimeouts.current[arField] = setTimeout(async () => {
        if (!val || val.length === 0) return;
        const translated = await Promise.all(val.map(async (ach: string) => {
          if (!/[\u0600-\u06FF]/.test(ach)) return await translateText(ach, 'en', 'ar');
          return ach;
        }));
        cvForm.setFieldsValue({ [arField]: translated });
      }, 2000);
    }

    // Smart Translation for Bio (Arabic → English)
    if (changedValues.bio_ar !== undefined) {
      const val = changedValues.bio_ar;
      const field = 'bio';
      if (translateTimeouts.current[field]) clearTimeout(translateTimeouts.current[field]);
      translateTimeouts.current[field] = setTimeout(async () => {
        if (!val || val.trim() === '') return;
        const translated = await translateText(val, 'ar', 'en');
        cvForm.setFieldsValue({ [field]: translated });
      }, 1500);
    }

    // Handle Role change
    if (changedValues.role) {
      setSelectedRole(changedValues.role);
    }
  };

  const handleSaveCV = async (values: any) => {
    if (!player) return;
    setLoading(true);
    try {
      const selectedClub = clubsList.find(c => String(c.id) === String(values.club_id));
      const payload: any = {
        ...values,
        profile_role: values.role || player.role,
        nameAr: values.nameAr,
        name_ar: values.nameAr,
        nationalityAr: values.nationalityAr,
        nationality_ar: values.nationalityAr,
        dateOfBirth: values.dateOfBirth ? values.dateOfBirth.format('YYYY-MM') : undefined,
        date_of_birth: values.dateOfBirth ? values.dateOfBirth.format('YYYY-MM') : undefined,
        positions: Array.isArray(values.positions) ? values.positions : [],
        club_id: values.club_id ? Number(values.club_id) : null,
        clubId: values.club_id ? Number(values.club_id) : null,
        national_team_id: values.national_team_id ? Number(values.national_team_id) : null,
        club: selectedClub ? selectedClub.name : (values.club_id === null ? null : values.club),
        club_name_legacy: selectedClub ? selectedClub.name : (values.club_id === null ? null : values.club),
        clubAr: selectedClub ? selectedClub.name_ar : (values.club_id === null ? null : values.clubAr),
        club_ar: selectedClub ? selectedClub.name_ar : (values.club_id === null ? null : values.clubAr),
        club_name_ar_legacy: selectedClub ? selectedClub.name_ar : (values.club_id === null ? null : values.clubAr),
        drive_url: values.google_drive_url || values.drive_url,
        previous_clubs: values.formPreviousClubs || [],
        previous_clubs_ar: values.formPreviousClubsAr || [],
        achievements: values.formAchievements || [],
        achievements_ar: values.formAchievementsAr || [],
        bio: values.bio || undefined,
        bio_ar: values.bio_ar || undefined,
        certificates: values.certificates || [],
        contract_status: values.contractNature === 'TERMINATION' ? ContractStatus.EXPIRED : (values.contractEndDate ? (dayjs(values.contractEndDate).isBefore(dayjs(), 'day') ? ContractStatus.EXPIRED : ContractStatus.ACTIVE) : ContractStatus.ACTIVE),
        contract_nature: values.contractNature || undefined,
        contract_type: values.contractType || 'PROFESSIONAL',
        designer_type: values.designerType,
        volleyball_spike_reach: values.volleyball_spike_reach !== undefined ? Number(values.volleyball_spike_reach) : null,
        volleyball_block_reach: values.volleyball_block_reach !== undefined ? Number(values.volleyball_block_reach) : null,
        is_approved: false
      };

      // Remove file objects/arrays from JSON payload to prevent 500 errors
      delete payload.photos;
      delete payload.cv_document;
      delete payload.volleyball_stats_pdf;
      delete payload.volleyball_ranking_image;

      const updateResponse = await profileService.updateMyCV(player.id, payload);
      await handleCVFileUploads(player.id, values);
      await handleLookupCV(user?.phone);

      // Use the updated data returned from the API
      if (updateResponse) {
        setPlayer(updateResponse);
        // Update form with new values to reflect changes immediately
        const initialClubId = updateResponse.club && typeof updateResponse.club === 'object'
          ? String(updateResponse.club.id)
          : (updateResponse.club_id ? String(updateResponse.club_id) : undefined);

        cvForm.setFieldsValue({
          club_id: initialClubId,
          club: getClubName(updateResponse.club, false, clubsList),
          clubAr: getClubName(updateResponse.club, true, clubsList),
        });
      }

      setIsCVModalOpen(false);
      setShowUpdateAlert(false);
      message.success(isAr ? 'تم حفظ السيرة الذاتية بنجاح وهي قيد المراجعة' : 'CV saved successfully and is under review');
    } catch (error: any) {
      message.error(error.response?.data?.message || t('profile.cv_update_failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCV = async (values: any) => {
    setLoading(true);
    try {
      const selectedClub = clubsList.find(c => String(c.id) === String(values.club_id));
      const payload: any = {
        name: values.name,
        nameAr: values.nameAr,
        name_ar: values.nameAr,
        email: values.email || user?.email,
        phone: values.phone,
        nationalId: values.nationalId || user?.nationalId || (user as any)?.national_id,
        national_id: values.nationalId || user?.nationalId || (user as any)?.national_id,
        address: values.address,
        nationality: values.nationality,
        nationalityAr: values.nationalityAr,
        nationality_ar: values.nationalityAr,
        dateOfBirth: values.dateOfBirth ? values.dateOfBirth.format('YYYY-MM') : undefined,
        date_of_birth: values.dateOfBirth ? values.dateOfBirth.format('YYYY-MM') : undefined,
        bio: values.bio || undefined,
        bio_ar: values.bio_ar || undefined,
        gender: values.gender || 'MALE',
        profile_role: values.role || (user?.memberType === MemberType.COACH ? 'COACH' : 'PLAYER'),
        role: values.role || (user?.memberType === MemberType.COACH ? 'COACH' : 'PLAYER'),
        sport: values.sport || 'FOOTBALL',
        positions: Array.isArray(values.positions) ? values.positions : [],
        jerseyNumber: values.jerseyNumber,
        jersey_number: values.jerseyNumber,
        preferredFoot: values.preferredFoot,
        preferred_foot: values.preferredFoot,
        born_in_kuwait: values.bornInKuwait,
        marketValue: values.marketValue,
        market_value: values.marketValue,
        height: values.height,
        weight: values.weight,
        volleyball_spike_reach: values.volleyball_spike_reach !== undefined ? Number(values.volleyball_spike_reach) : null,
        volleyball_block_reach: values.volleyball_block_reach !== undefined ? Number(values.volleyball_block_reach) : null,
        club: selectedClub ? selectedClub.name : (values.club_id === null ? null : values.club),
        clubAr: selectedClub ? selectedClub.name_ar : (values.club_id === null ? null : values.clubAr),
        club_ar: selectedClub ? selectedClub.name_ar : (values.club_id === null ? null : values.clubAr),
        club_id: values.club_id ? Number(values.club_id) : null,
        clubId: values.club_id ? Number(values.club_id) : null,
        national_team_id: values.national_team_id ? Number(values.national_team_id) : null,
        youtube_url: Array.isArray(values.youtube_url) ? JSON.stringify(values.youtube_url.filter((v: any) => v && v.url)) : values.youtube_url,
        transfermarkt_url: values.transfermarkt_url,
        instagram_url: values.instagram_url,
        drive_url: values.google_drive_url,
        previous_clubs: values.formPreviousClubs || [],
        previous_clubs_ar: values.formPreviousClubsAr || [],
        achievements: values.formAchievements || [],
        achievements_ar: values.formAchievementsAr || [],
        certificates: values.certificates || [],
        designer_type: values.designerType,
        contract_nature: 'NOT_JOINED',
        is_approved: false
      };

      // Remove file objects/arrays from JSON payload to prevent 500 errors
      delete payload.photos;
      delete payload.cv_document;
      delete payload.volleyball_stats_pdf;
      delete payload.volleyball_ranking_image;

      const result = await profileService.createMyCV(payload);
      if (result) {
        await handleCVFileUploads(result.id, values);
        await handleLookupCV(user?.phone);
        setIsCVModalOpen(false);
        message.success(isAr ? 'تم إنشاء السيرة الذاتية بنجاح وهي قيد المراجعة' : 'CV created successfully and is under review');
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || t('profile.cv_creation_failed'));
    } finally {
      setLoading(false);
    }
  };

  const renderInfoRow = (label: string, value: any, icon?: React.ReactNode) => (
    <div className="flex items-start gap-3 py-3 px-4 rounded-xl hover:bg-gray-50/70 transition-all" style={{ borderBottom: '1px solid #f1f5f9' }}>
      <div className="text-gray-400 mt-0.5 flex-shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <Text className="block text-xs font-bold uppercase tracking-wider mb-0.5" style={{ color: '#94a3b8' }}>{label}</Text>
        <Text className="block text-sm font-semibold" style={{ color: '#1e293b' }}>
          {value || <span className="text-gray-300 italic">{t('common.not_available')}</span>}
        </Text>
      </div>
    </div>
  );

  const AccountTabContent = () => (
    <div className="space-y-6">
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={8}>
          <Card
            className="text-center shadow-sm rounded-2xl border-0 overflow-hidden"
            style={{ background: 'linear-gradient(180deg, #1a1a1a 0%, #2d2d2d 40%, white 40%)' }}
            styles={{ body: { paddingTop: 50 } }}
          >
            <div className="relative inline-block">
              <Avatar
                size={screens.xs ? 100 : 130}
                src={avatarFile ? URL.createObjectURL(avatarFile) : user?.avatar}
                icon={<UserOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
                className="border-4 shadow-xl"
                style={{ borderColor: '#C9A24D' }}
              />
              <Upload
                showUploadList={false}
                beforeUpload={(file) => { setAvatarFile(file); return false; }}
                accept="image/*"
              >
                <div
                  className="absolute bottom-1 right-1 w-9 h-9 rounded-full flex items-center justify-center cursor-pointer shadow-lg transition-transform hover:scale-110"
                  style={{ background: '#C9A24D' }}
                >
                  <CameraOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} style={{ color: '#fff', fontSize: 16 }} />
                </div>
              </Upload>
            </div>
            {avatarFile && <Tag color="gold" className="mt-3 rounded-lg px-3 py-1">{avatarFile.name}</Tag>}
            <Title level={4} className="!mt-4 !mb-0.5" style={{ color: '#ffffff' }}>{user?.name}</Title>
            <Text className="block mb-1" style={{ color: '#C9A24D', fontWeight: 700 }}>{t('roles.member')}</Text>
            <Text type="secondary" className="text-xs">{user?.email}</Text>
            <Divider className="my-4" />
            <div className="text-left px-2">
              {renderInfoRow(t('common.phone'), user?.phone, <PhoneOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />)}
              {renderInfoRow(t('common.country'), getCountryLabel(user?.country, isAr), <GlobalOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />)}
              {renderInfoRow(t('register.organization_label'), user?.organization || (user as any)?.company, <BankOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />)}
              {renderInfoRow(t('common.member_type'), user?.memberType ? t(`member_types.${user.memberType}`) : '-', <TeamOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />)}
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={16}>
          <Card
            title={<div className="flex items-center gap-2"><UserOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} style={{ color: '#C9A24D' }} /><span className="font-bold">{t('profile.personal_info')}</span></div>}
            className="shadow-sm rounded-2xl border-0"
          >
            <Form
              form={accountForm}
              layout="vertical"
              initialValues={{
                name: user?.name,
                email: user?.email,
                organization: user?.organization || (user as any)?.company,
                phone: user?.phone,
                country: user?.country
              }}
              onFinish={handleSaveAccount}
            >
              <Row gutter={16}>
                <Col xs={24} sm={12}><Form.Item name="name" label={t('common.name')} rules={[{ required: true }]}><Input className="h-11 rounded-xl" prefix={<UserOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />} /></Form.Item></Col>
                <Col xs={24} sm={12}><Form.Item name="email" label={t('common.email')} rules={[{ required: true, type: 'email' }]}><Input className="h-11 rounded-xl" prefix={<MailOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />} disabled /></Form.Item></Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="country"
                    label={t('common.country', { defaultValue: 'Country' })}
                  >
                    <Select
                      showSearch
                      placeholder={t('settings_page.country_placeholder', { defaultValue: 'Select your country' })}
                      className="rounded-xl h-11"
                      onChange={handleCountryChange}
                      optionFilterProp="label"
                      filterOption={(input, option) => {
                        const norm = (s: string) => (s || '').toLowerCase().replace(/[أإآٱ]/g, 'ا').replace(/ة/g, 'ه').replace(/[ىی]/g, 'ي');
                        const label = String((option as any)?.label || '');
                        const value = String(option?.value || '');
                        return norm(label).includes(norm(input)) || norm(value).includes(norm(input));
                      }}
                      options={WORLD_COUNTRIES.map(c => ({
                        value: c.value,
                        label: i18n.language === 'ar' ? c.labelAr : c.labelEn
                      }))}
                      suffixIcon={<GlobalOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} className="text-gray-300" />}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="phone"
                    label={t('common.phone', { defaultValue: 'Phone Number' })}
                  >
                    <Input
                      className="h-11 rounded-xl"
                      prefix={<PhoneOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
                      placeholder="965XXXXXXXX"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={24}><Form.Item name="organization" label={t('register.organization_label')}><Input className="h-11 rounded-xl" prefix={<BankOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />} placeholder={t('register.organization_placeholder')} /></Form.Item></Col>
              </Row>
              <Button type="primary" htmlType="submit" loading={loading} icon={<SaveOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />} className="h-11 px-8 rounded-xl font-bold" style={{ background: '#3F3F3F', borderColor: '#3F3F3F' }}>{t('common.save_btn')}</Button>
            </Form>
          </Card>

          <Card
            title={<div className="flex items-center gap-2"><LockOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} style={{ color: '#C9A24D' }} /><span className="font-bold">{t('profile.security')}</span></div>}
            className="shadow-sm rounded-2xl border-0 mt-6"
          >
            <Form form={passwordForm} layout="vertical" onFinish={handleChangePassword}>
              <Form.Item name="currentPassword" label={t('settings_page.current_password')} rules={[{ required: true }]}><Input.Password className="h-11 rounded-xl" prefix={<LockOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />} /></Form.Item>
              <Row gutter={16}>
                <Col xs={24} sm={12}><Form.Item name="newPassword" label={t('settings_page.new_password')} rules={[{ required: true, min: 8 }]}><Input.Password className="h-11 rounded-xl" prefix={<LockOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />} /></Form.Item></Col>
                <Col xs={24} sm={12}><Form.Item name="confirmPassword" label={t('settings_page.confirm_password')} dependencies={['newPassword']} rules={[{ required: true }, ({ getFieldValue }) => ({ validator(_, value) { if (!value || getFieldValue('newPassword') === value) return Promise.resolve(); return Promise.reject(new Error(t('profile.passwords_mismatch'))); }, })]}><Input.Password className="h-11 rounded-xl" prefix={<LockOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />} /></Form.Item></Col>
              </Row>
              <Button type="primary" htmlType="submit" loading={loading} icon={<SafetyCertificateOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />} className="h-11 px-8 rounded-xl font-bold" style={{ background: '#3F3F3F', borderColor: '#3F3F3F' }}>{t('settings_page.update_password')}</Button>
            </Form>
          </Card>
        </Col>
      </Row>
    </div>
  );

  const CVTabContent = () => (
    <div className="space-y-6">
      {!cvFound && !cvLoading && cvAttempted && (
        <Card className="shadow-md rounded-2xl border-0 overflow-hidden text-center py-12">
          <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: 'rgba(201,162,77,0.1)', border: '2px dashed rgba(201,162,77,0.4)' }}><IdcardOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} style={{ fontSize: 40, color: '#C9A24D' }} /></div>
          <Title level={3} className="!mb-2">{t('profile.no_cv_found')}</Title>
          <Text type="secondary" className="block max-w-sm mx-auto mb-8 text-lg">{t('profile.no_cv_desc')}</Text>
          <Button type="primary" size="large" loading={loading} icon={<PlusCircleOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />} onClick={() => { setSelectedRole(user?.memberType === MemberType.COACH ? 'COACH' : 'PLAYER'); cvForm.setFieldsValue({ nameAr: user?.name, phone: user?.phone, role: user?.memberType === MemberType.COACH ? 'COACH' : 'PLAYER' }); setIsCVModalOpen(true); }} className="h-14 px-10 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all" style={{ background: '#C9A24D', borderColor: '#C9A24D' }}>{t('profile.create_cv_now')}</Button>
        </Card>
      )}

      {cvLoading && <Card className="shadow-md rounded-2xl border-0 py-16 text-center"><Spin size="large" /><div className="mt-4"><Text type="secondary">{t('common.loading')}</Text></div></Card>}

      {cvFound && player && (
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          {!player?.isApproved && <Alert message={isAr ? 'قيد المراجعة' : 'Under Review'} description={isAr ? 'بياناتك قيد المراجعة حالياً. ستظهر في الدليل بعد الموافقة.' : 'Your profile is under review. It will be visible once approved.'} type="info" showIcon icon={<InfoCircleOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />} className="rounded-xl" />}
          {showUpdateAlert && <Alert message={isAr ? 'تحديث البيانات مطلوب' : 'Profile Update Required'} description={isAr ? 'مر عام أو أكثر على آخر تحديث لبياناتك. يرجى مراجعتها وتحديثها لضمان بقائها دقيقة وفي مقدمة الدليل.' : 'A year or more has passed since your last update. Please review and update your profile to ensure it remains accurate and prioritized.'} type="warning" showIcon action={<Button size="small" type="primary" onClick={() => setIsCVModalOpen(true)}>{t('profile.update_cv', { defaultValue: 'Update Data' })}</Button>} className="rounded-xl border-amber-200 bg-amber-50" />}
          <Card className="shadow-sm rounded-2xl border-0 overflow-hidden">
            <div className="flex flex-col md:flex-row items-center gap-6 p-6 -mx-6 -mt-6 mb-4" style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)' }}>
              <Avatar size={100} src={player.mainPhoto?.url} icon={<UserOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />} className="border-3 flex-shrink-0" style={{ borderColor: '#C9A24D' }} />
              <div className="text-center md:text-start flex-1">
                <Title level={3} className="!text-white !mb-1" style={{ color: '#ffffff' }}>{isAr ? (player.nameAr || player.name) : player.name}</Title>
                <Space wrap>
                  <Tag color="gold" className="rounded-lg px-3 py-0.5 font-bold">
                    {t(`enums.ProfileRole.${player.role || 'PLAYER'}`, { defaultValue: player.role })}
                  </Tag>
                  {player.sport && player.role !== ProfileRole.DESIGNER && (
                    <Tag color="purple" className="rounded-lg px-3 py-0.5 font-bold">
                      {t(`enums.Sport.${player.sport}`, { defaultValue: player.sport })}
                    </Tag>
                  )}
                  {player.role === ProfileRole.DESIGNER && player.designerType && (
                    <Tag color="cyan" className="rounded-lg px-3 py-0.5 font-bold">
                      {t(`enums.DesignerType.${player.designerType}`, { defaultValue: player.designerType })}
                    </Tag>
                  )}
                  {player.role === 'PLAYER' && player.positions?.map((p: string) => (
                    <Tag key={p} className="rounded-lg px-3 py-0.5 font-semibold" style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none' }}>
                      {t(`enums.Position.${p}`, { defaultValue: p })}
                    </Tag>
                  ))}
                  <Tag color="blue" className="rounded-lg px-3 py-0.5 font-bold">
                    {t(`enums.DealStatus.${player.dealStatus || (player.role === 'COACH' ? DealStatus.FREE_AGENT_COACH : DealStatus.FREE_AGENT)}`)}
                  </Tag>
                </Space>
                <div className="mt-2"><Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}><ClockCircleOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} className="mr-1" />{t('profile.last_updated')}: {new Date(player.updatedAt).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}</Text></div>
              </div>
              <Space className="flex-shrink-0" wrap>
                {player?.isApproved && (
                  <Button icon={<EyeOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />} onClick={() => navigate(`/players/${player.id}`)} className="rounded-xl font-bold h-11 px-5 shadow-md border-0 text-white transition-all hover:opacity-80" style={{ background: '#C9A24D' }}>{isAr ? 'معاينة السيرة' : 'View Profile'}</Button>
                )}
                <Button icon={<EditOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />} onClick={() => setIsCVModalOpen(true)} className="rounded-xl font-bold h-11 px-5 shadow-md border-0 bg-white/10 text-white hover:bg-white/20 transition-all">{t('profile.edit_cv')}</Button>
              </Space>
            </div>
            <Divider className="!my-6" />
            <Row gutter={[24, 24]}>
              <Col xs={24} sm={12} md={8}>{renderInfoRow(t('common.national_id'), player.nationalId, <IdcardOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />)}</Col>
              <Col xs={24} sm={12} md={8}>{renderInfoRow(t('common.year_of_birth'), player.dateOfBirth ? String(player.dateOfBirth).substring(0, 4) : '', <CalendarOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />)}</Col>
              <Col xs={24} sm={12} md={8}>{renderInfoRow(t('common.nationality'), isAr ? (player.nationalityAr || player.nationality) : player.nationality, <GlobalOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />)}</Col>
              {(player.role === 'PLAYER' || player.role === 'COACH' || player.role === 'ADMINISTRATOR') && (
                <Col xs={24} sm={12} md={8}>{renderInfoRow(t('common.club', { defaultValue: 'Club' }), getClubName(player.club || (player as any).club_name || player.club_id, isAr, clubsList), <BankOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />)}</Col>
              )}
              {player.role === 'PLAYER' && (
                <>
                  <Col xs={24} sm={12} md={8}>{renderInfoRow(t('players.height_cm'), player.height ? `${player.height} cm` : '', <ManOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />)}</Col>
                  <Col xs={24} sm={12} md={8}>{renderInfoRow(t('players.weight_kg'), player.weight ? `${player.weight} kg` : '', <UserOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />)}</Col>
                  {(player.sport === 'Volleyball' || player.sport === 'Beach Volleyball') && (
                    <>
                      <Col xs={24} sm={12} md={8}>{renderInfoRow(t('players.volleyball_spike_reach'), (player as any).volleyballSpikeReach || (player as any).volleyball_spike_reach ? `${(player as any).volleyballSpikeReach || (player as any).volleyball_spike_reach} ${t('common.cm')}` : '', <ArrowsAltOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />)}</Col>
                      <Col xs={24} sm={12} md={8}>{renderInfoRow(t('players.volleyball_block_reach'), (player as any).volleyballBlockReach || (player as any).volleyball_block_reach ? `${(player as any).volleyballBlockReach || (player as any).volleyball_block_reach} ${t('common.cm')}` : '', <InteractionOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />)}</Col>
                    </>
                  )}
                  {hasLimbPreference(player.sport) && (
                    <Col xs={24} sm={12} md={8}>{renderInfoRow(isHandSport(player.sport) ? t('players.preferred_hand') : t('common.preferred_foot'), player.preferredFoot ? (isHandSport(player.sport) ? t(`enums.PreferredHand.${player.preferredFoot}`, { defaultValue: player.preferredFoot }) : t(`enums.PreferredFoot.${player.preferredFoot}`, { defaultValue: player.preferredFoot })) : '', <ThunderboltOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />)}</Col>
                  )}
                  <Col xs={24} sm={12} md={8}>{renderInfoRow(t('common.jersey_number'), player.jerseyNumber, <TagOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />)}</Col>
                </>
              )}
              {(player.role === 'PLAYER' || player.role === 'COACH' || player.role === 'ADMINISTRATOR') && (
                <Col xs={24} sm={12} md={8}>{renderInfoRow(t('players.market_value'), player.marketValue ? `$${Number(player.marketValue).toLocaleString()}` : '', <DollarOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />)}</Col>
              )}
            </Row>

            <Divider className="!my-6" />
            <Row gutter={[24, 24]}>
              <Col xs={24}><Text className="text-lg font-bold text-[#C9A24D]">{isAr ? 'روابط التواصل والمعرض' : 'Links & Portfolio'}</Text></Col>
              {(() => {
                const raw = (player as any).youtube_url || (player as any).youtubeUrl;
                if (!raw) return null;
                let videos: any[] = [];
                if (Array.isArray(raw)) {
                  videos = raw;
                } else if (typeof raw === 'string') {
                  const trimmed = raw.trim();
                  if (trimmed.startsWith('[')) {
                    try { videos = JSON.parse(trimmed); } catch {
                      videos = [{
                        url: trimmed,
                        title_en: ''
                      }];
                    }
                  } else {
                    videos = trimmed.split(',').map(s => ({ url: s.trim() })).filter(v => v.url);
                  }
                }
                if (videos.length === 0) return null;
                return videos.map((video, idx) => (
                  <Col key={idx} xs={24} sm={12} md={6}>
                    <div className="py-3 px-4 rounded-xl bg-red-50/50 border border-red-50 transition-all hover:bg-red-50">
                      <Text className="block text-[10px] font-bold uppercase tracking-widest text-red-400 mb-1">
                        {isAr ? (video.title || video.title_en || 'يوتيوب') : (video.title_en || video.title || 'YouTube')}
                      </Text>
                      <a href={video.url} target="_blank" rel="noopener noreferrer" className="text-red-600 font-bold flex items-center gap-2">
                        <YoutubeOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} /> {isAr ? 'مشاهدة الفيديو' : 'Watch Video'}
                      </a>
                    </div>
                  </Col>
                ));
              })()}
              {((player as any).instagram_url || (player as any).instagramUrl) && (
                <Col xs={24} sm={12} md={6}>
                  <div className="py-3 px-4 rounded-xl bg-purple-50/50 border border-purple-50 transition-all hover:bg-purple-50">
                    <Text className="block text-[10px] font-bold uppercase tracking-widest text-purple-400 mb-1">{isAr ? 'إنستغرام' : 'Instagram'}</Text>
                    <a href={(player as any).instagram_url || (player as any).instagramUrl} target="_blank" rel="noopener noreferrer" className="text-purple-600 font-bold flex items-center gap-2">
                      <InstagramOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} /> {isAr ? 'زيارة الملف' : 'Visit Profile'}
                    </a>
                  </div>
                </Col>
              )}
              {((player as any).transfermarkt_url || (player as any).transfermarktUrl || (player as any).volleynetUrl || (player as any).volleynet_url) && (
                <Col xs={24} sm={12} md={6}>
                  {((player.sport === Sport.VOLLEYBALL || player.sport === Sport.BEACH_VOLLEYBALL) && ((player as any).volleynet_url || (player as any).volleynetUrl)) ? (
                    <div className="py-3 px-4 rounded-xl bg-orange-50/50 border border-orange-50 transition-all hover:bg-orange-50">
                      <Text className="block text-[10px] font-bold uppercase tracking-widest text-orange-400 mb-1">Volleybox.net</Text>
                      <a href={(player as any).volleynet_url || (player as any).volleynetUrl} target="_blank" rel="noopener noreferrer" className="text-orange-600 font-bold flex items-center gap-2">
                        <GlobalOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} /> {t('players.volleyball_player_page')}
                      </a>
                    </div>
                  ) : (
                    <div className="py-3 px-4 rounded-xl bg-blue-50/50 border border-blue-50 transition-all hover:bg-blue-50">
                      <Text className="block text-[10px] font-bold uppercase tracking-widest text-blue-400 mb-1">{t('players.transfermarkt_profile', { defaultValue: 'Transfermarkt' })}</Text>
                      <a href={(player as any).transfermarkt_url || (player as any).transfermarktUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 font-bold flex items-center gap-2">
                        <GlobalOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} /> {isAr ? 'سوق الانتقالات' : 'Transfer Market'}
                      </a>
                    </div>
                  )}
                </Col>
              )}
              {((player as any).drive_url || (player as any).driveUrl || (player as any).google_drive_url) && player.role === 'PHOTOGRAPHER' && (
                <Col xs={24} sm={12} md={6}>
                  <div className="py-3 px-4 rounded-xl bg-amber-50/50 border border-amber-50 transition-all hover:bg-amber-50">
                    <Text className="block text-[10px] font-bold uppercase tracking-widest text-amber-500 mb-1">{isAr ? 'جوجل درايف' : 'Google Drive'}</Text>
                    <a href={(player as any).drive_url || (player as any).driveUrl || (player as any).google_drive_url} target="_blank" rel="noopener noreferrer" className="text-amber-600 font-bold flex items-center gap-2">
                      <CloudUploadOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} /> {isAr ? 'معرض الصور' : 'Photo Gallery'}
                    </a>
                  </div>
                </Col>
              )}
              {((player as any).volleyball_stats_pdf || player.volleyballStatsPdf) && (player.sport === Sport.VOLLEYBALL || player.sport === Sport.BEACH_VOLLEYBALL) && (
                <Col xs={24} sm={12} md={6}>
                  <div className="py-3 px-4 rounded-xl bg-blue-50/50 border border-blue-50 transition-all hover:bg-blue-50">
                    <Text className="block text-[10px] font-bold uppercase tracking-widest text-blue-400 mb-1">{t('players.volleyball_stats')}</Text>
                    <a href={(player as any).volleyball_stats_pdf || player.volleyballStatsPdf} target="_blank" rel="noopener noreferrer" className="text-blue-600 font-bold flex items-center gap-2">
                      <FilePdfOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} /> {t('players.volleyball_view_stats')}
                    </a>
                  </div>
                </Col>
              )}
              {((player as any).volleyball_ranking_image || player.volleyballRankingImage) && (player.sport === Sport.VOLLEYBALL || player.sport === Sport.BEACH_VOLLEYBALL) && (
                <Col xs={24} sm={12} md={6}>
                  <div className="py-3 px-4 rounded-xl bg-purple-50/50 border border-purple-50 transition-all hover:bg-purple-50">
                    <Text className="block text-[10px] font-bold uppercase tracking-widest text-purple-400 mb-1">{t('players.volleyball_ranking_image')}</Text>
                    <a href={(player as any).volleyball_ranking_image || player.volleyballRankingImage} target="_blank" rel="noopener noreferrer" className="text-purple-600 font-bold flex items-center gap-2">
                      <PictureOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} /> {t('players.volleyball_view_image')}
                    </a>
                  </div>
                </Col>
              )}
              {player.strategyPdf && (
                <Col xs={24} sm={12} md={6}>
                  <div className="py-3 px-4 rounded-xl bg-amber-50/50 border border-amber-200 transition-all hover:bg-amber-100/50 flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <Text className="block text-[10px] font-bold uppercase tracking-widest text-[#C9A24D] mb-1">
                        {player.role === 'PLAYER' ? t('players.strategy_pdf') : t('players.work_plan_strategy_pdf', { defaultValue: 'استراتيجية خطة العمل' })}
                      </Text>
                      <a
                        href={player.strategyPdf.startsWith('http') ? player.strategyPdf : `${process.env.REACT_APP_API_URL || ''}${player.strategyPdf}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#C9A24D] font-bold flex items-center gap-2 hover:underline text-xs"
                      >
                        <FilePdfOutlined style={{ color: '#C9A24D' }} onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} /> {player.role === 'PLAYER' ? t('players.strategy_pdf_doc') : t('players.work_plan_strategy_pdf_doc', { defaultValue: 'ملف خطة العمل (PDF)' })}
                      </a>
                    </div>
                  </div>
                </Col>
              )}
            </Row>

            {/* Contract Section - Restricted by Role */}
            {(player.role === 'PLAYER' || player.role === 'COACH' || player.role === 'ADMINISTRATOR') && (player?.contractStartDate || player?.contractType) && (
              <>
                <Divider className="!my-6" />
                <Row gutter={[24, 24]}>
                  <Col xs={24}><Text className="text-lg font-bold text-[#C9A24D]">{t('players.contract_details')}</Text></Col>
                  <Col xs={24} sm={12} md={6}>{renderInfoRow(t('common.start_date'), player.contractStartDate ? new Date(String(player.contractStartDate)).toLocaleDateString(isAr ? 'ar-SA' : 'en-US') : '-', <CalendarOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />)}</Col>
                  <Col xs={24} sm={12} md={6}>{renderInfoRow(t('common.end_date'), player.contractEndDate ? new Date(String(player.contractEndDate)).toLocaleDateString(isAr ? 'ar-SA' : 'en-US') : '-', <CalendarOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />)}</Col>
                  <Col xs={24} sm={12} md={6}>{renderInfoRow(t('common.contract_type'), player.contractType ? ((player as any).contractType === 'PROFESSIONAL' ? t('enums.ContractType.PROFESSIONAL') : (player as any).contractType === 'YOUTH' ? t('enums.ContractType.YOUTH') : (player as any).contractType === 'LOAN' ? t('enums.ContractType.LOAN') : (player as any).contractType === 'AMATEUR' ? t('enums.ContractType.AMATEUR') : player.contractType) : '-', <FileTextOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />)}</Col>
                  <Col xs={24} sm={12} md={6}>
                    {(() => {
                      const today = dayjs();
                      const hasActiveDoc = player.documents?.some((d: any) => 
                        String(d.type).toLowerCase() === 'contract' && 
                        d.end_date && 
                        (dayjs(d.end_date).isAfter(today, 'day') || dayjs(d.end_date).isSame(today, 'day'))
                      );
                      const status = hasActiveDoc ? 'ACTIVE' : (player.contractStatus || (player as any).contract_status);
                      
                      const finalStatus = (status !== 'ACTIVE' && player.contractEndDate && dayjs(player.contractEndDate).isBefore(today, 'day')) 
                        ? 'EXPIRED' 
                        : status;

                      return renderInfoRow(t('common.contract_status'), finalStatus ? (finalStatus === 'ACTIVE' ? t('common.active') : finalStatus === 'PENDING' ? t('common.pending') : finalStatus === 'EXPIRED' ? t('common.expired') : (isAr ? 'آخر' : 'Other')) : '-', <CheckCircleOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />);
                    })()}
                  </Col>
                  {player.contractFees && <Col xs={24} sm={12} md={6}>{renderInfoRow(t('common.contract_fees'), player.contractFeesType === 'PERCENTAGE' ? `${Math.round(Number(player.contractFees))}%` : player.contractFees, <DollarOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />)}</Col>}
                  {player.contractNature && (user?.role === UserRole.ADMIN || user?.role === UserRole.OWNER) && <Col xs={24} sm={12} md={6}>{renderInfoRow(t('common.contract_nature'), player.contractNature === 'AUTHORIZATION' ? t('players.contract_nature_auth') : player.contractNature === 'SIGNING' ? t('players.contract_nature_signing') : player.contractNature === 'NOT_JOINED' ? t('players.contract_nature_not_joined') : player.contractNature === 'TERMINATION' ? t('players.contract_nature_termination') : player.contractNature, <FileTextOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />)}</Col>}
                </Row>
              </>
            )}

            {/* Certificates - For All Roles */}
            {player.certificates && player.certificates.length > 0 && (
              <>
                <Divider className="!my-6" />
                <Row gutter={[24, 24]}>
                  <Col xs={24}><Text className="text-lg font-bold text-[#C9A24D]">{t('coaches.certificates_title', { defaultValue: 'Certificates & Accreditations' })}</Text></Col>
                  {player.certificates.map((cert: any, idx: number) => (
                    <Col xs={24} md={12} key={cert.id || idx}>
                      <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100 h-full">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 rounded-xl bg-gold-100 flex items-center justify-center border border-gold-200">
                            <TrophyOutlined style={{ color: '#C9A24D', fontSize: 18 }} onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />
                          </div>
                          <div>
                            <Text className="block font-bold" style={{ color: '#1e293b' }}>{cert.certificate_name}</Text>
                            <Tag color="gold" className="rounded-md border-none text-[10px] font-bold px-2 py-0">
                              {t(`coaches.cert_types.${(cert.certificate_type || '').toLowerCase().replace(/ \/ /g, '_').replace(/\s+/g, '_')}`, { defaultValue: cert.certificate_type })}
                            </Tag>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-y-3">
                          <div>
                            <Text className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">{t('coaches.issuing_body')}</Text>
                            <Text className="block text-xs font-semibold">{cert.issuing_body}</Text>
                          </div>
                          <div>
                            <Text className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">{t('coaches.year_obtained')}</Text>
                            <Text className="block text-xs font-semibold">{cert.year_obtained || '-'}</Text>
                          </div>
                          <div>
                            <Text className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">{t('coaches.level')}</Text>
                            <Text className="block text-xs font-semibold">{t(`coaches.levels.${(cert.level || '').toLowerCase()}`, { defaultValue: cert.level })}</Text>
                          </div>
                          {cert.certificate_file && (
                            <div>
                              <Text className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">{t('common.document')}</Text>
                              <a href={cert.certificate_file} target="_blank" rel="noopener noreferrer" className="text-[#C9A24D] text-xs font-bold flex items-center gap-1 hover:underline">
                                <UploadOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} /> {isAr ? 'تحميل' : 'Download'}
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    </Col>
                  ))}
                </Row>
              </>
            )}

            {/* Previous Clubs & Achievements - Restricted by Role */}
            {(player.role === 'PLAYER' || player.role === 'COACH' || player.role === 'ADMINISTRATOR') && (player.previousClubs?.length > 0 || player.achievements?.length > 0 || (isAr && player.achievementsAr?.length > 0)) && (
              <>
                <Divider className="!my-6" />
                <Row gutter={[24, 24]}>
                  {(player.previousClubs?.length > 0 || player.previousClubsAr?.length > 0) && (
                    <Col xs={24} md={12}>
                      <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                        <Text className="block text-xs font-bold uppercase tracking-widest text-[#C9A24D] mb-3">{t('players.previous_clubs')}</Text>
                        <div className="flex flex-wrap gap-2">
                          {(isAr
                            ? (player.previousClubsAr && player.previousClubsAr.length > 0 ? player.previousClubsAr : player.previousClubs)
                            : (player.previousClubs && player.previousClubs.length > 0 ? player.previousClubs : player.previousClubsAr)
                          )?.map((club: string, idx: number) => (
                            <Tag key={idx} className="rounded-lg px-3 py-1 bg-white border-gray-200 font-medium">
                              <DynamicTranslate text={club} sourceLang={isArabicText(club) ? 'ar' : 'en'} targetLang={isAr ? 'ar' : 'en'} />
                            </Tag>
                          ))}
                        </div>
                      </div>
                    </Col>
                  )}
                  {(player.achievements?.length > 0 || player.achievementsAr?.length > 0) && (
                    <Col xs={24} md={12}>
                      <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                        <Text className="block text-xs font-bold uppercase tracking-widest text-[#C9A24D] mb-3">{t('players.achievements')}</Text>
                        <div className="flex flex-wrap gap-2">
                          {(isAr
                            ? (player.achievementsAr && player.achievementsAr.length > 0 ? player.achievementsAr : player.achievements)
                            : (player.achievements && player.achievements.length > 0 ? player.achievements : player.achievementsAr)
                          )?.map((ach: string, idx: number) => (
                            <Tag key={idx} className="rounded-lg px-3 py-1 bg-white border-gray-200 font-medium">
                              <DynamicTranslate text={ach} sourceLang={isArabicText(ach) ? 'ar' : 'en'} targetLang={isAr ? 'ar' : 'en'} />
                            </Tag>
                          ))}
                        </div>
                      </div>
                    </Col>
                  )}
                </Row>
              </>
            )}
          </Card>
        </Space>
      )}
    </div>
  );

  const NutritionTabContent = () => (
    <div className="space-y-6">
      <Card className="shadow-sm rounded-2xl border-0 overflow-hidden">
        <div className="bg-slate-900 p-6 md:p-8 text-white flex flex-row items-center gap-4 md:gap-6 -mx-6 -mt-6 mb-6">
          <Avatar size={80} src={player?.mainPhoto?.url} icon={<UserOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />} className="border-3 border-gold-400 shrink-0" />
          <div className="text-start flex-1 min-w-0">
            <Title level={3} className="!text-white !mb-1 text-lg md:text-2xl truncate">
              {isAr ? (player?.nameAr || player?.name) : player?.name}
            </Title>
            <Text style={{ color: 'rgba(255,255,255,0.6)' }} className="text-xs md:text-sm">
              {t('nutrition.pdf_report_title', { defaultValue: 'Nutrition & Athletic Performance File' })}
            </Text>
          </div>
          <div className="bg-white/10 px-4 py-2 rounded-xl backdrop-blur-sm border border-white/10">
            <div className="text-[10px] uppercase tracking-widest text-gold-400 font-bold mb-1">{t('physical.last_update')}</div>
            <div className="font-bold text-sm">{nutritionData?.physical_reports?.[0]?.report_date || '-'}</div>
          </div>
          {nutritionData && (
            (nutritionData.nutrition_programs && nutritionData.nutrition_programs.length > 0) ||
            (nutritionData.training_programs && nutritionData.training_programs.length > 0) ||
            (nutritionData.physical_reports && nutritionData.physical_reports.length > 0)
          ) && (
              <Button
                onClick={async () => {
                  try {
                    setPdfLoading(true);
                    await generateNutritionPdf(player, nutritionData?.data || nutritionData, t, isAr);
                  } catch (error) {
                    message.error(t('nutrition.export_failed', { defaultValue: 'Failed to export report' }));
                  } finally {
                    setPdfLoading(false);
                  }
                }}
                type="primary"
                loading={pdfLoading}
                className="bg-gold-600 hover:bg-gold-700 border-none h-11 px-6 font-bold rounded-xl shadow-lg"
                icon={<FileTextOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
              >
                {t('common.export_pdf')}
              </Button>
            )}
        </div>

        {nutritionLoading ? <div className="p-12 text-center"><Spin size="large" /></div> : (!nutritionData || (nutritionData?.nutrition_programs?.length === 0 && nutritionData?.training_programs?.length === 0 && nutritionData?.physical_reports?.length === 0)) ? <Empty description={t('common.no_data')} /> : (
          <Tabs
            defaultActiveKey="plan"
            className="nutrition-sub-tabs"
            items={[
              {
                key: 'plan',
                label: <span className="font-bold flex items-center gap-2"><MedicineBoxOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} /> {t('nutrition.title')}</span>,
                children: (
                  <div className="py-4">
                    {nutritionData.nutrition_programs?.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100">
                          <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                              <th className="p-4 font-bold text-slate-500 uppercase tracking-wider text-xs">{t('common.title', { defaultValue: 'Title' })}</th>
                              <th className="p-4 font-bold text-slate-500 uppercase tracking-wider text-xs">{t('nutrition.calories')}</th>
                              <th className="p-4 font-bold text-slate-500 uppercase tracking-wider text-xs">{t('nutrition.protein')}</th>
                              <th className="p-4 font-bold text-slate-500 uppercase tracking-wider text-xs">{t('nutrition.carbs')}</th>
                              <th className="p-4 font-bold text-slate-500 uppercase tracking-wider text-xs">{t('nutrition.fats')}</th>
                              <th className="p-4 font-bold text-slate-500 uppercase tracking-wider text-xs text-center">{t('common.details', { defaultValue: 'Details' })}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {nutritionData.nutrition_programs.map((prog: any) => (
                              <tr key={prog.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-all">
                                <td className="p-4 font-semibold">{prog.title}</td>
                                <td className="p-4 font-semibold text-slate-800">{prog.daily_calories}</td>
                                <td className="p-4 font-semibold text-gold-600">{prog.protein_grams}g</td>
                                <td className="p-4 font-semibold text-blue-600">{prog.carbs_grams}g</td>
                                <td className="p-4 font-semibold text-red-600">{prog.fat_grams}g</td>
                                <td className="p-4 font-semibold text-center">
                                  <Button type="link" icon={<EyeOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />} onClick={() => {
                                    Modal.info({
                                      title: prog.title,
                                      content: (
                                        <div className="mt-4 space-y-4">
                                          <div><Text strong>{t('nutrition.meal_details')}:</Text><Paragraph className="whitespace-pre-wrap mt-1">{prog.meal_details || '-'}</Paragraph></div>
                                          {prog.supplements && <div><Text strong>{t('nutrition.supplements')}:</Text><Paragraph className="whitespace-pre-wrap mt-1">{prog.supplements}</Paragraph></div>}
                                        </div>
                                      ),
                                      width: 600,
                                      centered: true
                                    });
                                  }}>{t('common.view_details', { defaultValue: isAr ? 'عرض التفاصيل' : 'View Details' })}</Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : <Empty description={t('nutrition.empty')} />}
                  </div>
                )
              },
              {
                key: 'training',
                label: <span className="font-bold flex items-center gap-2"><StarOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} /> {t('training.title')}</span>,
                children: (
                  <div className="py-4">
                    {nutritionData.training_programs?.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100">
                          <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                              <th className="p-4 font-bold text-slate-500 uppercase tracking-wider text-xs">{t('common.title', { defaultValue: 'Title' })}</th>
                              <th className="p-4 font-bold text-slate-500 uppercase tracking-wider text-xs text-center">{t('common.details', { defaultValue: 'Details' })}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {nutritionData.training_programs.map((prog: any) => (
                              <tr key={prog.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-all">
                                <td className="p-4 font-semibold">{prog.title}</td>
                                <td className="p-4 font-semibold text-center">
                                  <Button type="link" icon={<EyeOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />} onClick={() => {
                                    Modal.info({
                                      title: prog.title,
                                      content: (
                                        <div className="mt-4 space-y-4">
                                          <div><Text strong>{t('training.workout_plan')}:</Text><Paragraph className="whitespace-pre-wrap mt-1">{prog.workout_plan || '-'}</Paragraph></div>
                                          {prog.recovery_plan && <div><Text strong>{t('training.recovery_plan')}:</Text><Paragraph className="whitespace-pre-wrap mt-1">{prog.recovery_plan}</Paragraph></div>}
                                        </div>
                                      ),
                                      width: 600,
                                      centered: true
                                    });
                                  }}>{t('common.view_details', { defaultValue: isAr ? 'عرض التفاصيل' : 'View Details' })}</Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : <Empty description={t('training.empty')} />}
                  </div>
                )
              },
              {
                key: 'physical',
                label: <span className="font-bold flex items-center gap-2"><FileTextOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} /> {t('physical.title')}</span>,
                children: (
                  <div className="py-4">
                    {nutritionData.physical_reports?.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100">
                          <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                              <th className="p-4 font-bold text-slate-500 uppercase tracking-wider text-xs">{t('common.date')}</th>
                              <th className="p-4 font-bold text-slate-500 uppercase tracking-wider text-xs">{t('physical.weight')}</th>
                              <th className="p-4 font-bold text-slate-500 uppercase tracking-wider text-xs">{t('physical.fat')}</th>
                              <th className="p-4 font-bold text-slate-500 uppercase tracking-wider text-xs">{t('physical.muscle')}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {nutritionData?.physical_reports?.map((rep: any) => (
                              <tr key={rep.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-all">
                                <td className="p-4 font-semibold">{rep.report_date}</td>
                                <td className="p-4 font-semibold text-gold-600">{rep.weight} kg</td>
                                <td className="p-4 font-semibold text-red-600">{rep.fat_percentage}%</td>
                                <td className="p-4 font-semibold text-blue-600">{rep.muscle_mass} kg</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : <Empty description={t('physical.empty')} />}
                  </div>
                )
              }
            ]}
          />
        )}
      </Card>
    </div>
  );

  return (
    <div className="fade-in min-h-screen" style={{ background: '#f8fafc' }}>
      <div className="px-4 md:px-10 py-8 md:py-12" style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(201,162,77,0.15)' }}><UserOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} style={{ fontSize: 18, color: '#C9A24D' }} /></div>
            <div><Title level={3} className="!text-white !mb-0">{t('profile.page_title')}</Title><Text style={{ color: 'rgba(255,255,255,0.5)' }}>{t('profile.page_subtitle')}</Text></div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-10 -mt-4">
        <Tabs activeKey={activeTab} onChange={setActiveTab} type="card" className="profile-tabs" items={[
          { key: 'account', label: (<span className="flex items-center gap-2 font-bold px-2"><UserOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />{t('profile.tab_account')}</span>), children: <AccountTabContent />, },
          { key: 'cv', label: (<span className="flex items-center gap-2 font-bold px-2"><IdcardOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />{t('profile.tab_cv')}</span>), children: <CVTabContent />, },
          ...(user?.memberType === MemberType.PLAYER ? [{ key: 'nutrition', label: (<span className="flex items-center gap-2 font-bold px-2"><MedicineBoxOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />{t('nutrition.section')}</span>), children: <NutritionTabContent />, }] : []),
        ]} />
      </div>

      <Modal
        title={<div className="flex items-center gap-2 py-2"><TrophyOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} className="text-[#C9A24D]" /><span className="font-bold text-lg">{player ? t('profile.edit_cv') : t('profile.create_cv_now')}</span></div>}
        open={isCVModalOpen}
        onCancel={() => setIsCVModalOpen(false)}
        width={900}
        footer={null}
        centered
        styles={{ body: { overflowX: 'hidden' } }}
      >
        <div className="max-h-[70vh] overflow-y-auto overflow-x-hidden px-4">
          <Form
            form={cvForm}
            layout="vertical"
            onFinish={player ? handleSaveCV : handleCreateCV}
            onValuesChange={onValuesChange}
            initialValues={{ role: 'PLAYER', gender: 'MALE', dealStatus: DealStatus.FREE_AGENT }}
            onFinishFailed={(errorInfo) => {
              console.log('Form Validation Failed:', errorInfo);
              message.error(t('messages.validation_error', { defaultValue: 'Please ensure all required fields are filled' }));
            }}
          >
            {/* Role Header */}
            <Form.Item name="role" className="mb-6">
              <Radio.Group optionType="button" buttonStyle="solid" onChange={(e) => setSelectedRole(e.target.value)}>
                <Radio.Button value="PLAYER">{t('enums.ProfileRole.PLAYER')}</Radio.Button>
                <Radio.Button value="COACH">{t('enums.ProfileRole.COACH')}</Radio.Button>
                <Radio.Button value="ADMINISTRATOR">{t('enums.ProfileRole.ADMINISTRATOR')}</Radio.Button>
                <Radio.Button value="REFEREE">{t('enums.ProfileRole.REFEREE')}</Radio.Button>
                <Radio.Button value="PHOTOGRAPHER">{t('enums.ProfileRole.PHOTOGRAPHER')}</Radio.Button>
                <Radio.Button value="DESIGNER">{t('enums.ProfileRole.DESIGNER')}</Radio.Button>
              </Radio.Group>
            </Form.Item>

            {/* Basic Info */}
            <Divider orientation="left" orientationMargin={0}><Text type="secondary" className="text-xs uppercase tracking-widest">{t('common.filter_categories.basic')}</Text></Divider>
            <Row gutter={[12, 12]}>
              <Col xs={24} sm={8}><Form.Item name="nameAr" label={t('players.arabic_name')} rules={[{ required: !player }]}><Input className="rounded-lg h-10" /></Form.Item></Col>
              <Col xs={24} sm={8}><Form.Item name="name" label={t('players.full_name')} rules={[{ required: !player }]}><Input className="rounded-lg h-10" /></Form.Item></Col>
              <Col xs={24} sm={8}><Form.Item name="nationalId" label={t('common.national_id')} rules={[{ required: !player }]}><Input className="rounded-lg h-10" /></Form.Item></Col>
              <Col xs={24} sm={8}><Form.Item name="email" label={t('common.email')} rules={[{ required: !player }, { type: 'email' }]}><Input className="rounded-lg h-10" /></Form.Item></Col>
              <Col xs={24} sm={8}><Form.Item name="dateOfBirth" label={t('common.year_of_birth')} rules={[{ required: !player }]}><DatePicker picker="month" className="w-full rounded-lg h-10" /></Form.Item></Col>
              <Col xs={24} sm={8}><Form.Item name="gender" label={t('common.gender')} rules={[{ required: !player }]}><Select className="rounded-lg h-10"><Option value="MALE">{t('common.male')}</Option><Option value="FEMALE">{t('common.female')}</Option></Select></Form.Item></Col>
              <Col xs={24} sm={12}><Form.Item name="phone" label={t('common.phone_number')} rules={[{ required: !player }]}><Input className="rounded-lg h-10" /></Form.Item></Col>
              <Col xs={24} sm={12}><Form.Item name="address" label={t('common.address')} rules={[{ required: !player, message: t('common.required_field') }]}><Input className="rounded-lg h-10" /></Form.Item></Col>
              <Col xs={24}><Form.Item name="nationality" label={t('common.nationality')} rules={[{ required: !player }]}><Select
                showSearch
                options={nationalities}
                className="rounded-lg h-10"
                optionFilterProp="label"
                filterOption={(input, option) => {
                  const norm = (s: string) => (s || '').toLowerCase().replace(/[أإآٱ]/g, 'ا').replace(/ة/g, 'ه').replace(/[ىی]/g, 'ي');
                  return norm(String((option as any)?.searchLabel || '')).includes(norm(input));
                }}
                onChange={(val) => { const nat = nationalities.find(n => n.value === val); if (nat) { cvForm.setFieldsValue({ nationality: nat.value, nationalityAr: nat.fullAr }); } }}
              /></Form.Item><Form.Item name="nationalityAr" noStyle><Input type="hidden" /></Form.Item></Col>
            </Row>

            {/* Technical Info - Sport for all roles; full details only for PLAYER */}
            {(selectedRole === 'PLAYER' || selectedRole === 'COACH' || selectedRole === 'ADMINISTRATOR' || selectedRole === 'REFEREE' || selectedRole === 'PHOTOGRAPHER' || selectedRole === 'DESIGNER') && (
              <>
                <Divider orientation="left" orientationMargin={0}><Text type="secondary" className="text-xs uppercase tracking-widest">{t('common.filter_categories.technical')}</Text></Divider>
                <Row gutter={[12, 12]}>
                  {selectedRole !== 'DESIGNER' && (
                    <Col xs={24} sm={8}><Form.Item name="sport" label={t('common.sport')} rules={[{ required: !player }]}><Select options={Object.values(Sport).filter(v => typeof v === 'string').map(s => ({ value: s, label: t(`enums.Sport.${s}`) }))} className="rounded-lg h-10" /></Form.Item></Col>
                  )}
                  {selectedRole === 'DESIGNER' && (
                    <Col xs={24} sm={16}>
                      <Form.Item
                        name="designerType"
                        label={isAr ? 'تخصص التصميم' : 'Design Specialty'}
                        rules={[{ required: !player }]}
                      >
                        <Select className="rounded-lg h-10">
                          {Object.values(DesignerType).map((type: string) => (
                            <Option key={type} value={type}>
                              {t(`enums.DesignerType.${type}`, { defaultValue: type })}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                  )}
                  {(selectedRole !== 'REFEREE' && selectedRole !== 'PHOTOGRAPHER' && selectedRole !== 'DESIGNER') && (
                    <Col xs={24} sm={8}>
                      <Form.Item name="dealStatus" label={t('common.contract_status')} rules={[{ required: !player }]}>
                        <Select className="rounded-lg h-10">
                          {selectedRole === ProfileRole.COACH ? (
                            <>
                              <Option value={DealStatus.FREE_AGENT_COACH}>{t('enums.DealStatus.FREE_AGENT')}</Option>
                              <Option value={DealStatus.SIGNED}>{t('enums.DealStatus.SIGNED')}</Option>
                            </>
                          ) : (
                            <>
                              <Option value={DealStatus.FREE_AGENT}>{t('enums.DealStatus.FREE_AGENT')}</Option>
                              <Option value={DealStatus.SIGNED}>{t('enums.DealStatus.SIGNED')}</Option>
                            </>
                          )}
                        </Select>
                      </Form.Item>
                    </Col>
                  )}

                  {selectedRole === 'PLAYER' && (
                    <>
                      <Col xs={24} sm={8}><Form.Item name="positions" label={t('common.positions')} rules={[{ required: !player }]}><Select mode="multiple" options={positionsList.map(p => ({ value: p.value, label: t(`enums.Position.${p.label}`, { defaultValue: p.label }) }))} className="rounded-lg" /></Form.Item></Col>
                      {hasLimbPreference(watchedSport) && (
                        <Col xs={24} sm={8}>
                          <Form.Item name="preferredFoot" label={handSportActive ? t('players.preferred_hand') : t('common.preferred_foot')} rules={[{ required: !player }]}>
                            <Select className="rounded-lg h-10">
                              {Object.values(PreferredFoot).filter(v => typeof v === 'string').map(foot => (
                                <Option key={foot as string} value={foot as string}>
                                  {handSportActive ? t(`enums.PreferredHand.${foot}`) : t(`enums.PreferredFoot.${foot}`)}
                                </Option>
                              ))}
                            </Select>
                          </Form.Item>
                        </Col>
                      )}
                      <Col xs={24} sm={8}><Form.Item name="height" label={t('players.height_cm')} rules={[{ required: !player }]}><InputNumber style={{ width: '100%' }} className="rounded-lg h-10 flex items-center" /></Form.Item></Col>
                      <Col xs={24} sm={8}><Form.Item name="weight" label={t('players.weight_kg')} rules={[{ required: !player }]}><InputNumber style={{ width: '100%' }} className="rounded-lg h-10 flex items-center" /></Form.Item></Col>
                      <Col xs={24} sm={8}><Form.Item name="jerseyNumber" label={t('common.jersey_number')}><InputNumber style={{ width: '100%' }} className="rounded-lg h-10 flex items-center" /></Form.Item></Col>
                      {(watchedSport === 'Volleyball' || watchedSport === 'Beach Volleyball') && (
                        <>
                          <Col xs={24} sm={12} md={8}><Form.Item name="volleyball_spike_reach" label={t('players.volleyball_spike_reach')}><InputNumber style={{ width: '100%' }} className="rounded-lg h-10 flex items-center" /></Form.Item></Col>
                          <Col xs={24} sm={12} md={8}><Form.Item name="volleyball_block_reach" label={t('players.volleyball_block_reach')}><InputNumber style={{ width: '100%' }} className="rounded-lg h-10 flex items-center" /></Form.Item></Col>
                        </>
                      )}
                    </>
                  )}
                </Row>
              </>
            )}

            {/* Clubs & National Teams + Market Value - For PLAYER, COACH, ADMINISTRATOR */}
            {(selectedRole === 'PLAYER' || selectedRole === 'COACH' || selectedRole === 'ADMINISTRATOR') && (
              <>
                <Divider orientation="left" orientationMargin={0}>
                  <Text type="secondary" className="text-xs uppercase tracking-widest">
                    {isAr ? 'الأندية والمنتخبات' : 'Clubs & National Teams'}
                  </Text>
                </Divider>
                <Row gutter={[12, 12]} align="middle">
                  {/* Current Club */}
                  <Col xs={24} sm={11}>
                    <Form.Item label={isAr ? 'النادي الحالي' : 'Current Club'}>
                      <Space.Compact style={{ width: '100%' }}>
                        <Form.Item name="club_id" noStyle>
                          <Select
                            showSearch
                            style={{ flex: 1 }}
                            placeholder={isAr ? 'ابحث أو اختر النادي...' : 'Search or select club...'}
                            optionFilterProp="label"
                            optionLabelProp="label"
                            allowClear
                            className="rounded-lg h-12 w-full"
                            filterOption={(input, option) => {
                              const norm = (s: string) => (s || '').toLowerCase().replace(/[أإآٱ]/g, 'ا').replace(/ة/g, 'ه').replace(/[ىی]/g, 'ي');
                              return norm(String(option?.label || '')).includes(norm(input));
                            }}
                          >
                            {clubsList.map(c => {
                              const clubName = isAr ? (c.name_ar || c.name) : (c.name || c.name_ar);
                              return (
                                <Select.Option key={String(c.id)} value={String(c.id)} label={clubName}>
                                  <Space>
                                    <Avatar size="small" src={c.logo_url} icon={<TeamOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />} />
                                    {clubName}
                                  </Space>
                                </Select.Option>
                              );
                            })}
                          </Select>
                        </Form.Item>
                        <Button icon={<PlusOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />} onClick={() => setClubModalOpen(true)} title={t('common.add_new')} className="h-12 rounded-r-lg" />
                      </Space.Compact>
                    </Form.Item>
                  </Col>
                  <Col xs={4} sm={2} style={{ marginTop: 8 }}>
                    <Form.Item noStyle shouldUpdate={(prev, cur) => String(prev.club_id) !== String(cur.club_id)}>{({ getFieldValue }) => { const clubId = String(getFieldValue('club_id') || ''); const selectedClub = clubsList.find(c => String(c.id) === clubId); return selectedClub?.logo_url ? (<Avatar size={40} src={selectedClub.logo_url} shape="square" style={{ border: '1px solid #f0f0f0' }} />) : null; }}</Form.Item>
                  </Col>

                  {/* Current National Team */}
                  <Col xs={24} sm={11}>
                    <Form.Item label={isAr ? 'المنتخب الحالي' : 'Current National Team'}>
                      <Form.Item name="national_team_id" noStyle>
                        <Select
                          showSearch
                          style={{ width: '100%' }}
                          placeholder={isAr ? 'ابحث أو اختر المنتخب...' : 'Search or select national team...'}
                          optionFilterProp="label"
                          optionLabelProp="label"
                          allowClear
                          className="rounded-lg h-12 w-full"
                          filterOption={(input, option) => {
                            const norm = (s: string) => (s || '').toLowerCase().replace(/[أإآٱ]/g, 'ا').replace(/ة/g, 'ه').replace(/[ىی]/g, 'ي');
                            return norm(String(option?.label || '')).includes(norm(input));
                          }}
                        >
                          {clubsList.map(c => {
                            const clubName = isAr ? (c.name_ar || c.name) : (c.name || c.name_ar);
                            return (
                              <Select.Option key={`nt-${String(c.id)}`} value={String(c.id)} label={clubName}>
                                <Space>
                                  <Avatar size="small" src={c.logo_url} icon={<TeamOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />} />
                                  {clubName}
                                </Space>
                              </Select.Option>
                            );
                          })}
                        </Select>
                      </Form.Item>
                    </Form.Item>
                  </Col>

                  {/* Market Value */}
                  <Col xs={24} sm={6}>
                    <Form.Item name="marketValue" label={t('players.market_value')} rules={[{ required: true }]}><InputNumber style={{ width: '100%' }} prefix={<DollarOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />} className="rounded-lg h-10 flex items-center" /></Form.Item>
                  </Col>
                </Row>
              </>
            )}


            {/* Contract Details - Read Only - For PLAYER, COACH, ADMINISTRATOR */}
            {(selectedRole === 'PLAYER' || selectedRole === 'COACH' || selectedRole === 'ADMINISTRATOR') && (
              <>
                <Divider orientation="left" orientationMargin={0}><Text type="secondary" className="text-xs uppercase tracking-widest">{t('common.contract_details_readonly', { defaultValue: 'Contract Details (Read Only)' })}</Text></Divider>
                <Row gutter={[12, 12]}>
                  <Col xs={12} sm={6}><Form.Item name="contractStartDate" label={t('common.start_date')}><Input className="rounded-lg h-10" disabled /></Form.Item></Col>
                  <Col xs={12} sm={6}><Form.Item name="contractEndDate" label={t('common.end_date')}><Input className="rounded-lg h-10" disabled /></Form.Item></Col>
                  <Col xs={12} sm={6}><Form.Item name="contractType" label={t('common.contract_type')}><Input className="rounded-lg h-10" disabled /></Form.Item></Col>
                  <Col xs={12} sm={6}><Form.Item name="contractStatus" label={t('common.contract_status')}><Input className="rounded-lg h-10" disabled /></Form.Item></Col>
                  <Col xs={24} sm={12}><Form.Item name="contractFees" label={t('common.contract_fees')}><Input className="rounded-lg h-10" disabled /></Form.Item></Col>
                  <Col xs={24} sm={12}><Form.Item name="contractNature" label={t('common.contract_nature')}><Input className="rounded-lg h-10" disabled /></Form.Item></Col>
                </Row>
              </>
            )}

            {/* Previous Clubs & Achievements - For PLAYER, COACH, ADMINISTRATOR */}
            {(selectedRole === 'PLAYER' || selectedRole === 'COACH' || selectedRole === 'ADMINISTRATOR') && (
              <>
                <Divider orientation="left" orientationMargin={0}><Text type="secondary" className="text-xs uppercase tracking-widest">{t('players.previous_clubs')}</Text></Divider>
                <Row gutter={[12, 12]}>
                  <Col xs={24} sm={12}><Form.Item name="formPreviousClubsAr" label={t('players.previous_clubs_ar')}><Select mode="tags" className="rounded-lg" placeholder={isAr ? 'نادي 1، نادي 2...' : 'Club 1, Club 2...'} /></Form.Item></Col>
                  <Col xs={24} sm={12}><Form.Item name="formPreviousClubs" label={t('players.previous_clubs_en')}><Select mode="tags" className="rounded-lg" placeholder={isAr ? 'نادي 1، نادي 2...' : 'Club 1, Club 2...'} /></Form.Item></Col>
                </Row>
                <Row gutter={[12, 12]}>
                  <Col xs={24} sm={12}><Form.Item name="formAchievementsAr" label={t('players.achievements_ar')}><Select mode="tags" className="rounded-lg" /></Form.Item></Col>
                  <Col xs={24} sm={12}><Form.Item name="formAchievements" label={t('players.achievements')}><Select mode="tags" className="rounded-lg" /></Form.Item></Col>
                </Row>
              </>
            )}

            {/* Technical Report Section - For All Roles */}
            <Divider orientation="left" orientationMargin={0}>
              <Text type="secondary" className="text-xs uppercase tracking-widest">
                {isAr ? 'التقرير الفني' : 'Technical Report'}
              </Text>
            </Divider>
            <Row gutter={[12, 12]}>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="bio_ar"
                  label={
                    <span className="flex items-center gap-1">
                      <FileTextOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />
                      {isAr ? 'التقرير الفني (عربي)' : 'Technical Report (Arabic)'}
                    </span>
                  }
                  extra={isAr ? 'ستُترجم تلقائياً للإنجليزية' : 'Will auto-translate to English'}
                >
                  <TextArea
                    rows={4}
                    className="rounded-lg"
                    placeholder={isAr ? 'اكتب التقرير الفني بالعربية...' : 'Write the technical report in Arabic...'}
                    dir="rtl"
                    style={{ resize: 'none' }}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="bio"
                  label={
                    <span className="flex items-center gap-1">
                      <FileTextOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />
                      {isAr ? 'التقرير الفني (إنجليزي)' : 'Technical Report (English)'}
                    </span>
                  }
                  extra={isAr ? 'تُملأ تلقائياً أو اكتب مباشرة' : 'Auto-filled or type directly'}
                >
                  <TextArea
                    rows={4}
                    className="rounded-lg"
                    placeholder={isAr ? 'ستُملأ تلقائياً...' : 'Auto-filled from Arabic...'}
                    style={{ resize: 'none' }}
                  />
                </Form.Item>
              </Col>
            </Row>

            {/* Links */}
            <Divider orientation="left" orientationMargin={0}><Text type="secondary" className="text-xs uppercase tracking-widest">{t('common.filter_categories.contact')}</Text></Divider>
            <Row gutter={[12, 12]}>
              <Col xs={24}>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-6">
                  <Title level={5} className="!mb-4 flex items-center gap-2">
                    <YoutubeOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} className="text-red-600" />
                    {t('common.youtube', { defaultValue: 'YouTube Videos' })}
                  </Title>
                  <Form.List name="youtube_url">
                    {(fields, { add, remove }) => (
                      <div className="space-y-3">
                        {fields.map(({ key, name, ...restField }) => (
                          <div key={key} className="border border-slate-200 rounded-xl p-3 bg-white">
                            <Row gutter={12}>
                              <Col xs={24} sm={12}>
                                <Form.Item {...restField} name={[name, 'title']} label={isAr ? 'عنوان الفيديو (عربي)' : 'Video Title (Arabic)'} className="mb-2">
                                  <Input
                                    placeholder={isAr ? 'مثلاً: أجمل أهدافه' : 'e.g. أجمل أهدافه'}
                                    className="rounded-lg h-10"
                                    onChange={async (e) => {
                                      const val = e.target.value;
                                      if (!val || !/[\u0600-\u06FF]/.test(val)) return;
                                      const currentVideos = cvForm.getFieldValue('youtube_url') || [];
                                      const currentEn = currentVideos[name]?.title_en;
                                      if (!currentEn || currentEn.trim() === '') {
                                        const translated = await translateText(val, 'ar', 'en');
                                        const updated = [...currentVideos];
                                        if (updated[name]) {
                                          updated[name] = { ...updated[name], title_en: translated };
                                          cvForm.setFieldsValue({ youtube_url: updated });
                                        }
                                      }
                                    }}
                                  />
                                </Form.Item>
                              </Col>
                              <Col xs={24} sm={12}>
                                <Form.Item {...restField} name={[name, 'title_en']} label={isAr ? 'العنوان (إنجليزي) - يُترجم تلقائياً' : 'Title (English) - Auto-translated'} className="mb-2">
                                  <Input placeholder={isAr ? 'يُملأ تلقائياً...' : 'e.g. Best Goals'} className="rounded-lg h-10" />
                                </Form.Item>
                              </Col>
                              <Col xs={22}>
                                <Form.Item {...restField} name={[name, 'url']} rules={[{ required: true, type: 'url' }]} label={isAr ? 'رابط الفيديو' : 'Video URL'} className="mb-0">
                                  <Input placeholder="https://youtube.com/watch?v=..." className="rounded-lg h-10" />
                                </Form.Item>
                              </Col>
                              <Col xs={2} className="flex items-end pb-1">
                                <Button type="text" danger icon={<DeleteOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />} onClick={() => remove(name)} />
                              </Col>
                            </Row>
                          </div>
                        ))}
                        <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />} className="rounded-lg h-10">
                          {isAr ? 'إضافة رابط فيديو' : 'Add Video Link'}
                        </Button>
                      </div>
                    )}
                  </Form.List>
                </div>
              </Col>
              {(selectedRole === 'PLAYER' || selectedRole === 'COACH' || selectedRole === 'ADMINISTRATOR') && (
                <Col xs={24} sm={12}>
                  <Form.Item noStyle shouldUpdate={(prevValues, currentValues) => prevValues.sport !== currentValues.sport}>
                    {({ getFieldValue }) => {
                      const currentSport = getFieldValue('sport');
                      const isVolley = currentSport === Sport.VOLLEYBALL || currentSport === Sport.BEACH_VOLLEYBALL;
                      return (
                        <Form.Item name="transfermarkt_url" label={<span><GlobalOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} /> {isVolley ? 'Volleybox.net' : t('common.transfermarkt', { defaultValue: 'Transfermarkt' })}</span>} rules={[{ type: 'url' }]}><Input className="rounded-lg h-10" /></Form.Item>
                      );
                    }}
                  </Form.Item>
                </Col>
              )}
              <Col xs={24} sm={8}><Form.Item name="instagram_url" label={<span><InstagramOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} /> {t('common.instagram', { defaultValue: 'Instagram' })}</span>} rules={[{ type: 'url' }]}><Input className="rounded-lg h-10" /></Form.Item></Col>
              {selectedRole === 'PHOTOGRAPHER' && (
                <Col xs={24} sm={8}><Form.Item name="google_drive_url" label={<span><CloudUploadOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} /> {t('common.drive_link')}</span>} rules={[{ type: 'url' }]}><Input className="rounded-lg h-10" placeholder="https://drive.google.com/..." /></Form.Item></Col>
              )}
            </Row>

            {/* Certificates Section */}
            <Divider orientation="left" orientationMargin={0}><Text type="secondary" className="text-xs uppercase tracking-widest">{t('coaches.certificates_title', { defaultValue: 'Certificates & Accreditations' })}</Text></Divider>
            <Form.List name="certificates">
              {(fields, { add, remove }) => (
                <div className="flex flex-col gap-4 mb-6">
                  {fields.map(({ key, name, ...restField }) => (
                    <div key={key} className="p-4 border rounded-xl bg-gray-50/30 relative">
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
                        onClick={() => remove(name)}
                        className="absolute top-2 right-2 z-10"
                      />
                      <Row gutter={[12, 12]}>
                        <Col xs={24} sm={12}>
                          <Form.Item {...restField} name={[name, 'certificate_name']} label={t('coaches.certificate_name', { defaultValue: 'Certificate Name' })}>
                            <Input className="rounded-lg h-10" />
                          </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                          <Form.Item {...restField} name={[name, 'certificate_type']} label={t('coaches.certificate_type')}>
                            <Select className="rounded-lg h-10">
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
                        <Col xs={24} sm={8}><Form.Item {...restField} name={[name, 'issuing_body']} label={t('coaches.issuing_body')}><Input className="rounded-lg h-10" /></Form.Item></Col>
                        <Col xs={24} sm={8}>
                          <Form.Item {...restField} name={[name, 'level']} label={t('coaches.level')}>
                            <Select className="rounded-lg h-10">
                              {['Beginner', 'Intermediate', 'Advanced', 'Professional'].map(level => (
                                <Select.Option key={level} value={level}>{t(`coaches.levels.${level.toLowerCase()}`, { defaultValue: level })}</Select.Option>
                              ))}
                            </Select>
                          </Form.Item>
                        </Col>
                        <Col xs={24} sm={8}><Form.Item {...restField} name={[name, 'year_obtained']} label={t('coaches.year_obtained')}><InputNumber className="w-full rounded-lg h-10 flex items-center" min={1900} max={dayjs().year()} /></Form.Item></Col>
                        <Col xs={24} sm={12}>
                          <Form.Item {...restField} name={[name, 'source_type']} label={t('coaches.source_type')} rules={[{ required: true }]}>
                            <Select className="rounded-lg h-10">
                              {['Sports Federation', 'Academy', 'University', 'Online Course', 'Club Training', 'Other'].map(source => (
                                <Select.Option key={source} value={source}>{t(`coaches.sources.${source.replace(/\s+/g, '_').toLowerCase()}`, { defaultValue: source })}</Select.Option>
                              ))}
                            </Select>
                          </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                          <Form.Item {...restField} name={[name, 'file']} label={t('coaches.certificate_file', { defaultValue: 'Certificate File' })} valuePropName="fileList" getValueFromEvent={(e) => Array.isArray(e) ? e : e?.fileList}>
                            <Upload beforeUpload={() => false} maxCount={1}>
                              <Button icon={<UploadOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />} className="rounded-lg">
                                {t('coaches.upload_certificate', { defaultValue: 'Upload Certificate' })}
                              </Button>
                            </Upload>
                          </Form.Item>
                        </Col>
                      </Row>
                    </div>
                  ))}
                  <Button
                    type="dashed"
                    onClick={() => add()}
                    block
                    icon={<PlusOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
                    className="rounded-xl h-11 border-dashed"
                  >
                    {t('coaches.add_certificate', { defaultValue: 'Add Certificate' })}
                  </Button>
                </div>
              )}
            </Form.List>

            {/* Media */}
            <Divider orientation="left" orientationMargin={0}><Text type="secondary" className="text-xs uppercase tracking-widest">{t('players.player_image')}</Text></Divider>
            <div className="mb-6">
              <Form.Item name="photos" noStyle valuePropName="fileList" getValueFromEvent={(e) => Array.isArray(e) ? e : e?.fileList}>
                <Upload
                  listType="picture-card"
                  multiple
                  beforeUpload={() => false}
                  onRemove={async (file) => {
                    if (player && (file.status === 'done' || !file.originFileObj)) {
                      return new Promise((resolve) => {
                        showConfirmModal({
                          title: t('messages.confirm_delete_title'),
                          content: t('players.delete_photo_confirm', { defaultValue: 'Are you sure you want to delete this photo?' }),
                          okText: t('common.delete'),
                          okType: 'danger',
                          onConfirm: async () => {
                            try {
                              await profileService.deleteMyPhoto(player.id, file.uid);
                              resolve(true);
                            } catch (e) {
                              message.error(t('messages.error_delete'));
                              resolve(false);
                            }
                          },
                          onCancel: () => resolve(false),
                        });
                      });
                    }
                    return true;
                  }}
                >
                  <div>
                    <PlusOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />
                    <div style={{ marginTop: 8 }}>{t('common.upload')}</div>
                  </div>
                </Upload>
              </Form.Item>
            </div>

            <div className="rounded-2xl p-4 flex gap-4 mb-6" style={{ background: 'rgba(201, 162, 77, 0.1)', border: '1px solid rgba(201, 162, 77, 0.2)' }}>
              <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(201, 162, 77, 0.15)' }}><FileTextOutlined className="text-xl" style={{ color: '#C9A24D' }} onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} /></div>
              <div className="flex-1">
                <Typography.Text strong className="block" style={{ color: '#C9A24D' }}>{t('players.cv_document')} {selectedRole !== 'PLAYER' && <span className="text-red-500">*</span>}</Typography.Text>
                <Form.Item
                  name="cv_document"
                  noStyle
                  valuePropName="fileList"
                  getValueFromEvent={(e) => Array.isArray(e) ? e : e?.fileList}
                  rules={selectedRole !== 'PLAYER' ? [{ required: true, message: t('players.cv_required', { defaultValue: 'CV is required' }) }] : []}
                >
                  <Upload beforeUpload={() => false} maxCount={1} accept=".pdf,.doc,.docx" onRemove={async (file) => {
                    if (player && (file.status === 'done' || !file.originFileObj)) {
                      return new Promise((resolve) => {
                        showConfirmModal({
                          title: t('messages.confirm_delete_title'),
                          content: t('players.delete_document_confirm', { defaultValue: 'Are you sure you want to delete this document?' }),
                          okText: t('common.delete'),
                          okType: 'danger',
                          onConfirm: async () => {
                            try {
                              await profileService.deleteMyCVDocument(player.id);
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
                    <Button className="mt-2" size="middle" shape="round" icon={<UploadOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}>{t('common.upload')}</Button>
                  </Upload>
                </Form.Item>
              </div>
            </div>

            {/* Volleyball Fields */}
            <Form.Item noStyle shouldUpdate={(prevValues, currentValues) => prevValues.sport !== currentValues.sport}>
              {({ getFieldValue }) => {
                const currentSport = getFieldValue('sport');
                const isVolley = currentSport === Sport.VOLLEYBALL || currentSport === Sport.BEACH_VOLLEYBALL;
                if (isVolley && selectedRole === 'PLAYER') {
                  return (
                    <>
                      <Divider orientation="left" orientationMargin={0}><Text type="secondary" className="text-xs uppercase tracking-widest">{isAr ? 'كرة الطائرة' : 'Volleyball'}</Text></Divider>
                      <Row gutter={[12, 12]}>
                        <Col xs={24} sm={12}>
                          <Form.Item
                            name="volleyball_stats_pdf"
                            label={t('players.volleyball_stats_pdf')}
                            valuePropName="fileList"
                            getValueFromEvent={(e) => Array.isArray(e) ? e : e?.fileList}
                          >
                            <Upload beforeUpload={() => false} maxCount={1} accept=".pdf" onRemove={async (file) => {
                              if (player && (file.status === 'done' || !file.originFileObj)) {
                                return new Promise((resolve) => {
                                  showConfirmModal({
                                    title: t('messages.confirm_delete_title'),
                                    content: isAr ? 'هل أنت متأكد من حذف ملف الإحصائيات؟' : 'Are you sure you want to delete the stats PDF?',
                                    okText: t('common.delete'),
                                    okType: 'danger',
                                    onConfirm: async () => {
                                      try {
                                        await profileService.deleteVolleyballStatsPdf(player.id);
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
                              <Button icon={<UploadOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}>{t('players.volleyball_stats_pdf')}</Button>
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
                            <Upload beforeUpload={() => false} maxCount={1} listType="picture" accept="image/*" onRemove={async (file) => {
                              if (player && (file.status === 'done' || !file.originFileObj)) {
                                return new Promise((resolve) => {
                                  showConfirmModal({
                                    title: t('messages.confirm_delete_title'),
                                    content: isAr ? 'هل أنت متأكد من حذف صورة الترتيب؟' : 'Are you sure you want to delete the ranking image?',
                                    okText: t('common.delete'),
                                    okType: 'danger',
                                    onConfirm: async () => {
                                      try {
                                        await profileService.deleteVolleyballRankingImage(player.id);
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
                              <Button icon={<UploadOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}>{t('players.volleyball_ranking_image')}</Button>
                            </Upload>
                          </Form.Item>
                        </Col>
                      </Row>
                    </>
                  );
                }
                return null;
              }}
            </Form.Item>

            <Button type="primary" htmlType="submit" block size="large" loading={loading} icon={<SaveOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />} className="bg-[#C9A24D] border-none h-14 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 shadow-lg hover:bg-[#b89140] mt-4">{t('common.save_btn')}</Button>
          </Form>
        </div>
      </Modal>

      {/* Market Value Edit Modal */}
      <Modal
        title={<div className="flex items-center gap-2"><DollarOutlined className="text-[#C9A24D]" onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} /><span className="font-bold">{t('players.market_value')}</span></div>}
        open={isMarketValueModalOpen}
        onCancel={() => setIsMarketValueModalOpen(false)}
        centered
        footer={[
          <Button key="cancel" onClick={() => setIsMarketValueModalOpen(false)}>{t('common.cancel')}</Button>,
          <Button key="submit" type="primary" loading={loading} onClick={async () => {
            if (player && tempMarketValue !== null) {
              setLoading(true);
              try {
                await profileService.updateMyCV(player.id, { market_value: tempMarketValue });
                message.success(t('profile.updated_successfully'));
                setIsMarketValueModalOpen(false);
                await handleLookupCV(user?.phone);
              } catch (e) {
                message.error(t('profile.update_failed'));
              } finally {
                setLoading(false);
              }
            }
          }} style={{ background: '#C9A24D', borderColor: '#C9A24D' }}>{t('common.save')}</Button>,
        ]}
      >
        <div className="p-4">
          <InputNumber
            value={tempMarketValue}
            onChange={(val: any) => setTempMarketValue(val !== null && val !== undefined && val !== '' ? Number(val) : null)}
            className="w-full rounded-lg h-12"
            size="large"
            prefix={<DollarOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
            placeholder={t('players.market_value')}
          />
        </div>
      </Modal>

      {/* Club Creation Modal - Ported from admin */}
      <Modal
        title={t('common.add_new', { defaultValue: 'Add New Club' })}
        open={clubModalOpen}
        onCancel={() => setClubModalOpen(false)}
        footer={null}
        destroyOnClose
        centered
      >
        <Form
          layout="vertical"
          onFinish={async (values) => {
            setLoading(true);
            try {
              const formData = new FormData();
              formData.append('name', values.name);
              if (values.name_ar) formData.append('name_ar', values.name_ar);
              if (values.country) formData.append('country', values.country);
              if (values.logo?.[0]?.originFileObj) {
                formData.append('logo', values.logo[0].originFileObj);
              }
              const newClub = await clubService.create(formData);
              setClubsList(prev => [...prev, newClub]);
              cvForm.setFieldValue('club_id', newClub.id);
              setClubModalOpen(false);
              message.success(t('messages.success_create'));
            } catch (err: any) {
              if (err.response?.status === 403) {
                message.error(isAr ? 'عذراً، لا تملك صلاحية إضافة أندية جديدة للنظام حالياً.' : 'Sorry, you do not have permission to add new clubs to the system currently.');
              } else {
                message.error(t('messages.error_save'));
              }
            } finally {
              setLoading(false);
            }
          }}
        >
          <Form.Item name="name" label={t('common.name_en', { defaultValue: 'Club Name (EN)' })} rules={[{ required: true }]}>
            <Input className="rounded-xl h-11" />
          </Form.Item>
          <Form.Item name="name_ar" label={t('common.name_ar', { defaultValue: 'Club Name (AR)' })}>
            <Input className="rounded-xl h-11" />
          </Form.Item>
          <Form.Item name="country" label={t('common.country')}>
            <Select
              showSearch
              placeholder={t('common.country')}
              optionFilterProp="label"
              className="rounded-xl h-11"
            >
              {WORLD_COUNTRIES.map(c => (
                <Select.Option key={c.value} value={c.value} label={isAr ? c.labelAr : c.labelEn}>
                  {isAr ? c.labelAr : c.labelEn}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="logo"
            label={t('common.logo')}
            valuePropName="fileList"
            getValueFromEvent={(e) => Array.isArray(e) ? e : e?.fileList}
          >
            <Upload listType="picture" beforeUpload={() => false} maxCount={1}>
              <Button icon={<UploadOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />} className="rounded-xl">{t('common.upload')}</Button>
            </Upload>
          </Form.Item>
          <Form.Item className="mb-0 mt-6">
            <Button type="primary" htmlType="submit" block loading={loading} className="h-12 rounded-xl font-bold bg-[#C9A24D] border-none shadow-lg">
              {t('common.save')}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
