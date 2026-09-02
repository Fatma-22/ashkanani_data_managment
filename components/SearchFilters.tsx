import React, { useState, FC, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Input, Select, Slider, Space, Card, Button, Row, Col, Typography, Badge, Divider, DatePicker, Tabs, Tooltip, Radio, Avatar, Tag } from 'antd';
import {
    SearchOutlined,
    FilterOutlined,
    ClearOutlined,
    UserOutlined,
    GlobalOutlined,
    EnvironmentOutlined,
    DollarOutlined,
    FileProtectOutlined,
    CloseOutlined,
    TrophyOutlined,
    RocketOutlined,
    CalendarOutlined,
    ClockCircleOutlined,
    CheckCircleOutlined
} from '@ant-design/icons';
import { isHandSport, isFootSport } from '../utils/sports';
import { PlayerFilters, Position, DealStatus, PreferredFoot, Sport, ProfileRole, ContractStatus, DesignerType, UserRole } from '../types';
import { debounce, translateToArabic } from '../utils/helpers';
import { useAuth } from '../context/AuthContext';
import { metaService } from '../services/metaService';
import dayjs from 'dayjs';
import { getPositionsBySport } from '../utils/positions';
import { clubService } from '../services/clubService';
import { Club } from '../types';

const { Option } = Select;
const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface SearchFiltersProps {
    filters: PlayerFilters;
    onChange: (filters: PlayerFilters) => void;
    showAgentFilter?: boolean;
    availableNationalities?: { value: string; label: string; fullEn?: string; fullAr?: string }[];
    availableClubs?: string[];
    isPublic?: boolean;
    hideRemainingDuration?: boolean;
}

export const SearchFilters: FC<SearchFiltersProps> = ({ filters, onChange, availableNationalities, availableClubs, isPublic = false, hideRemainingDuration = false }) => {
    const { t, i18n } = useTranslation();
    const { user } = useAuth();
    const isUserAdmin = user?.role === UserRole.ADMIN || user?.role === UserRole.OWNER;
    const isAr = i18n.language === 'ar';
    const [expanded, setExpanded] = useState(false);
    const [localSearch, setLocalSearch] = useState(filters.search || '');
    const [apiSports, setApiSports] = useState<string[]>([]);
    const [dynamicMetadata, setDynamicMetadata] = useState<{ positions: { value: string, label: string }[], dealStatuses: { value: string, label: string }[] }>({
        positions: [],
        dealStatuses: []
    });
    const [apiClubs, setApiClubs] = useState<Club[]>([]);

    const selectedRole = filters.role && filters.role.length === 1 ? filters.role[0] : 'ALL';
    const isPlayer = selectedRole === ProfileRole.PLAYER || (selectedRole === 'ALL' && filters.contractNature?.includes('AUTHORIZATION' as any));
    const isCoach = selectedRole === ProfileRole.COACH;
    const isAdmin = selectedRole === ProfileRole.ADMINISTRATOR;
    const isReferee = selectedRole === ProfileRole.REFEREE;
    const isPhotographer = selectedRole === ProfileRole.PHOTOGRAPHER;
    const isDesigner = selectedRole === ProfileRole.DESIGNER;
    const isFootballPlayer = isPlayer && filters.sport?.includes(Sport.FOOTBALL);

    const roleText = isPlayer ? (isAr ? 'اللاعب' : 'Player') : 
                     isCoach ? (isAr ? 'المدرب' : 'Coach') : 
                     isAdmin ? (isAr ? 'الإداري' : 'Admin') : 
                     isReferee ? (isAr ? 'الحكم' : 'Referee') : 
                     isDesigner ? (isAr ? 'المصمم' : 'Designer') : 
                     (isAr ? 'العضو' : 'Member');

    const searchPlaceholder = isPlayer ? t('common.search_players') : (
        isAr ? `بحث ${roleText}ين...` : `Search ${roleText}s...`
    );

    const localLabel = isPlayer ? t('enums.PlayerOrigin.LOCAL') : (isAr ? 'محلي' : 'Local');
    const foreignLabel = isPlayer ? t('enums.PlayerOrigin.FOREIGN') : (isAr ? 'محترف' : 'Professional');
    const proLabel = isPlayer ? t('enums.LegalStatus.PROFESSIONAL') : (isAr ? 'محترف' : 'Professional');
    const amateurLabel = isPlayer ? t('enums.LegalStatus.AMATEUR') : (isAr ? 'هاوي' : 'Amateur');


    // Fetch sports from API to get DB-only sports not in the enum
    useEffect(() => {
        const fetchSports = async () => {
            try {
                const sports = await metaService.getSports();
                setApiSports(sports.map(s => s.value));
            } catch (e) {
                console.error('Failed to fetch sports', e);
            }
        };
        fetchSports();

        const fetchClubs = async () => {
            try {
                const data = await clubService.getAll();
                // Ensure data is an array
                const clubsArray = Array.isArray(data) ? data : (data as any).data || [];
                setApiClubs(clubsArray);
            } catch (e: any) {
                // If 403, it's a permission issue (e.g. public user), ignore silently
                if (e.response?.status !== 403) {
                    console.error('Failed to fetch clubs', e);
                }
            }
        };
        fetchClubs();
    }, []);

    useEffect(() => {
        const fetchMetadata = async () => {
            try {
                const [positions, dealStatuses] = await Promise.all([
                    metaService.getPositions(),
                    metaService.getDealStatuses()
                ]);
                const filteredPositions = (positions || []).filter(p => !['Coach', 'Player', 'مدرب', 'لاعب', 'Administrator', 'Referee', 'Photographer', 'Designer', 'إداري', 'اداري', 'حكم', 'مصور', 'مصمم'].includes(p.value));
                setDynamicMetadata({ positions: filteredPositions, dealStatuses });
            } catch (error) {
                console.error('Failed to fetch filter metadata:', error);
            }
        };
        fetchMetadata();
    }, []);

    // Filter positions based on selected sport
    const filteredPositionsBySport = React.useMemo(() => {
        const selectedSport = filters.sport && filters.sport.length === 1 ? filters.sport[0] : undefined;
        if (!selectedSport) return dynamicMetadata.positions;

        const sportCodes = getPositionsBySport(selectedSport as string);
        if (sportCodes.length === 0) return dynamicMetadata.positions;

        return dynamicMetadata.positions.filter(p => sportCodes.includes(p.value));
    }, [filters.sport, dynamicMetadata.positions]);

    // Debounced search
    const debouncedSearch = debounce((value: string) => {
        onChange({ ...filters, search: value });
    }, 500);

    const isFirstRun = React.useRef(true);
    useEffect(() => {
        if (isFirstRun.current) {
            isFirstRun.current = false;
            return;
        }
        debouncedSearch(localSearch);
    }, [localSearch]);

    // Clear positions when sport changes if they are not valid for the new sport
    useEffect(() => {
        if (!filters.sport || filters.sport.length !== 1 || !filters.positions || filters.positions.length === 0) return;
        
        const selectedSport = filters.sport[0];
        const sportCodes = getPositionsBySport(selectedSport as string);
        if (sportCodes.length === 0) return;

        const validPositions = filters.positions.filter(p => sportCodes.includes(p));
        if (validPositions.length !== filters.positions.length) {
            onChange({ ...filters, positions: validPositions.length > 0 ? validPositions : undefined });
        }
    }, [filters.sport]);

    const handleClearFilters = () => {
        setLocalSearch('');
        onChange({});
    };

    const activeCount = Object.keys(filters).filter(k => {
        const val = filters[k as keyof PlayerFilters];
        return val !== undefined && val !== '' && (Array.isArray(val) ? val.length > 0 : true);
    }).length;

    const FilterLabel: React.FC<{ icon: React.ReactNode, label: string }> = ({ icon, label }) => (
        <Space className="mb-2">
            <span className="text-[#3F3F3F]">{icon}</span>
            <Text className="uppercase text-[10px] font-black tracking-widest text-gold-500">{label}</Text>
        </Space>
    );

    return (
        <div className="fade-in">
            <Card
                className={`transition-all duration-300 border-none shadow-sm ${expanded ? 'bg-white' : 'bg-transparent'}`}
                styles={{ body: { padding: expanded ? 24 : '8px 16px' } }}
            >
                <Row gutter={[12, 12]} align="middle" style={{ paddingTop: 4 }}>
                    <Col xs={24} md={12} lg={16}>
                        <Input
                            size="large"
                            className="bg-white border-2 border-slate-100 shadow-sm h-12 md:h-14 text-base md:text-lg rounded-xl px-4 md:px-6 focus:border-[#C9A24D] focus:shadow-[0_0_15px_rgba(201,162,77,0.15)] hover:border-slate-200 transition-all font-bold"
                            placeholder={searchPlaceholder}
                            prefix={<SearchOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} className="text-[#C9A24D] mr-3 text-xl" />}
                            value={localSearch}
                            onChange={(e) => setLocalSearch(e.target.value)}
                            allowClear
                        />
                    </Col>
                    
                    <Col xs={24} md={12} lg={8}>
                        <div className="flex items-center gap-2 justify-end">
                            <Badge count={activeCount} offset={[-2, 2]} color="#C9A24D">
                                <Button
                                    size="middle"
                                    icon={<FilterOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
                                    onClick={() => setExpanded(!expanded)}
                                    className={`h-11 px-4 rounded-xl transition-all font-bold text-xs uppercase tracking-wider ${
                                        expanded 
                                        ? 'bg-[#C9A24D] text-white border-none shadow-md' 
                                        : 'bg-white text-slate-500 hover:text-[#C9A24D] border-2 border-slate-100'
                                    }`}
                                >
                                    {t('common.advanced_search')}
                                </Button>
                            </Badge>

                            {activeCount > 0 && (
                                <Button
                                    size="middle"
                                    type="text"
                                    icon={<CloseOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
                                    onClick={handleClearFilters}
                                    className="h-11 px-3 flex items-center justify-center rounded-xl text-red-400 hover:text-red-500 hover:bg-red-50"
                                    title={t('common.cancel')}
                                />
                            )}
                        </div>
                    </Col>
                </Row>

                {activeCount > 0 && (
                    <div className="mt-4 px-4 py-3 bg-red-50/50 border border-red-100 rounded-xl flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-500">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-white shadow-[0_0_15px_rgba(239,68,68,0.3)]">
                                <FilterOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} className="text-sm" />
                            </div>
                            <div>
                                <Text className="block text-[10px] font-black uppercase tracking-widest text-red-500 leading-none mb-1">
                                    {t('common.active_filters', { defaultValue: 'FILTRATION ACTIVE' })}
                                </Text>
                                <Text className="text-xs font-bold text-slate-600 block leading-none">
                                    {t('common.active_filters_warning')}
                                </Text>
                            </div>
                        </div>
                        <Button 
                            danger
                            type="primary" 
                            size="small" 
                            onClick={handleClearFilters}
                            className="bg-red-500 hover:bg-red-600 border-none rounded-lg font-black text-[10px] uppercase tracking-wider h-8 px-4 shadow-sm"
                        >
                            {t('common.clear_all')}
                        </Button>
                    </div>
                )}

                <div className="mt-4 flex flex-col gap-3">
                    {/* Role & Nature Filters */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                        <Radio.Group 
                            value={
                                filters.contractNature?.includes('AUTHORIZATION' as any) ? 'AUTH' :
                                filters.role && filters.role.length === 1 ? filters.role[0] : 'ALL'
                            } 
                            onChange={(e) => {
                                const val = e.target.value;
                                if (val === 'AUTH') {
                                    onChange({ 
                                        ...filters, 
                                        role: [ProfileRole.PLAYER],
                                        contractNature: ['AUTHORIZATION' as any],
                                        sport: undefined
                                    });
                                } else {
                                    onChange({ 
                                        ...filters, 
                                        role: val === 'ALL' ? undefined : [val as ProfileRole],
                                        contractNature: undefined
                                    });
                                }
                            }}
                            optionType="button"
                            buttonStyle="solid"
                            className="premium-role-filter whitespace-nowrap"
                        >
                            <Radio.Button value="ALL" className="font-bold">
                                {t('common.all')}
                            </Radio.Button>
                            <Radio.Button value={ProfileRole.PLAYER} className="font-bold">
                                {t('enums.ProfileRole.PLAYER')}
                            </Radio.Button>
                            <Radio.Button value={ProfileRole.COACH} className="font-bold">
                                {t('enums.ProfileRole.COACH')}
                            </Radio.Button>
                            <Radio.Button value={ProfileRole.ADMINISTRATOR} className="font-bold">
                                {t('enums.ProfileRole.ADMINISTRATOR')}
                            </Radio.Button>
                            <Radio.Button value={ProfileRole.REFEREE} className="font-bold">
                                {t('enums.ProfileRole.REFEREE')}
                            </Radio.Button>
                            <Radio.Button value={ProfileRole.PHOTOGRAPHER} className="font-bold">
                                {t('enums.ProfileRole.PHOTOGRAPHER')}
                            </Radio.Button>
                            <Radio.Button value={ProfileRole.DESIGNER} className="font-bold">
                                {t('enums.ProfileRole.DESIGNER')}
                            </Radio.Button>
                            <Radio.Button value="AUTH" className="font-bold">
                                {t('common.authorization_players', { defaultValue: 'Professional Authorized' })}
                            </Radio.Button>
                        </Radio.Group>
                    </div>

                    {/* Sports Filters - Organized as Tabs */}
                    {!isDesigner && (
                        <div className="flex flex-col gap-2">
                            {(() => {
                            const teamSportsList = [
                                Sport.FOOTBALL, Sport.BASKETBALL, Sport.VOLLEYBALL, Sport.HANDBALL, Sport.FUTSAL, 
                                Sport.WATER_POLO, Sport.CRICKET, Sport.RUGBY_UNION, Sport.RUGBY_LEAGUE, 
                                Sport.AMERICAN_FOOTBALL, Sport.BASEBALL, Sport.SOFTBALL, Sport.ICE_HOCKEY, 
                                Sport.FIELD_HOCKEY, Sport.LACROSSE, Sport.PAINTBALL, Sport.BEACH_SOCCER, Sport.BEACH_VOLLEYBALL
                            ];

                            const individualSportsList = [
                                Sport.TENNIS, Sport.PADEL, Sport.SQUASH, Sport.TABLE_TENNIS, Sport.BADMINTON,
                                Sport.MMA, Sport.BOXING, Sport.KICKBOXING, Sport.MUAY_THAI, Sport.JUDO, Sport.KARATE, Sport.TAEKWONDO, Sport.WRESTLING, Sport.JIU_JITSU, Sport.SAMBO, Sport.FENCING,
                                Sport.SWIMMING, Sport.DIVING, Sport.ROWING, Sport.SAILING, Sport.SURFING, Sport.MOTOSURF, Sport.JET_SKI,
                                Sport.FORMULA_1, Sport.RALLY, Sport.MOTOCROSS, Sport.KARTING,
                                Sport.ATHLETICS, Sport.POLE_VAULT, Sport.GYMNASTICS, Sport.TRIATHLON, Sport.CYCLING, Sport.WEIGHTLIFTING,
                                Sport.SHOOTING, Sport.ARCHERY, Sport.BOWLING, Sport.DARTS, Sport.GOLF, Sport.BILLIARDS, Sport.SNOOKER,
                                Sport.MOBA, Sport.FPS, Sport.ESPORTS_STRATEGY, Sport.ESPORTS_SPORTS,
                                Sport.EQUESTRIAN, Sport.CHESS, Sport.CAMEL_RACING, Sport.FALCONRY, Sport.HORSE_RACING
                            ];

                            const teamSports = teamSportsList.map(s => {
                                const keyStr = String(s);
                                return { key: s, label: t(`enums.Sport.${keyStr}`, keyStr) };
                            });
                            
                            const individualSports = individualSportsList.map(s => {
                                const keyStr = String(s);
                                return { key: s, label: t(`enums.Sport.${keyStr}`, keyStr) };
                            });

                            const extraSports = apiSports
                                .filter(s => !Object.values(Sport).includes(s as any))
                                .map(s => {
                                    const keyStr = String(s);
                                    return { key: s as any, label: t(`enums.Sport.${keyStr}`, keyStr) };
                                });

                            const allIndividualSports = [...individualSports, ...extraSports];
                            const allSports = [...teamSports, ...allIndividualSports];

                            const teamSportsKeys = teamSportsList;
                            const individualSportsKeys = allIndividualSports.map(s => s.key);

                            const activeTab = (() => {
                                if (!filters.sport || filters.sport.length === 0) return 'all';
                                
                                const currentSports = Array.isArray(filters.sport) ? filters.sport : [filters.sport];
                                
                                // Check if all selected sports are in team list
                                const allTeam = currentSports.every(s => teamSportsKeys.includes(s as any));
                                const isExactlyAllTeam = allTeam && currentSports.length === teamSportsKeys.length;
                                
                                // Check if all selected sports are in individual list
                                const allIndiv = currentSports.every(s => individualSportsKeys.includes(s as any));
                                const isExactlyAllIndiv = allIndiv && currentSports.length === individualSportsKeys.length;

                                const isTeamCat = currentSports.includes('TEAM_CATEGORY' as any);
                                const isIndivCat = currentSports.includes('INDIVIDUAL_CATEGORY' as any);

                                if (isExactlyAllTeam || isTeamCat) return 'team';
                                if (isExactlyAllIndiv || isIndivCat) return 'individual';
                                
                                // If some are selected but not all, we still might want to show the specific tab
                                if (allTeam) return 'team';
                                if (allIndiv) return 'individual';

                                return 'all';
                            })();



                            const onTabChange = (key: string) => {
                                if (key === 'all') {
                                    onChange({ ...filters, sport: undefined });
                                } else if (key === 'team') {
                                    onChange({ ...filters, sport: ['TEAM_CATEGORY' as any] });
                                } else if (key === 'individual') {
                                    onChange({ ...filters, sport: ['INDIVIDUAL_CATEGORY' as any] });
                                }
                            };

                            const isTeamCat = Array.isArray(filters.sport) ? filters.sport.includes('TEAM_CATEGORY' as any) : filters.sport === 'TEAM_CATEGORY';
                            const isIndivCat = Array.isArray(filters.sport) ? filters.sport.includes('INDIVIDUAL_CATEGORY' as any) : filters.sport === 'INDIVIDUAL_CATEGORY';


                            const renderButtons = (sports: { key: Sport, label: string }[]) => (
                                <div className="flex flex-wrap items-center gap-2 pt-2 pb-2">
                                    {sports.map(({ key, label }) => (
                                        <Button 
                                            key={String(key)}
                                            type={filters.sport?.includes(key) ? 'primary' : 'default'}
                                            onClick={() => {
                                                const current = filters.sport || [];
                                                const isSelected = current.includes(key);
                                                const isOnlyOne = current.length === 1 && isSelected;
                                                onChange({ ...filters, sport: isOnlyOne ? undefined : [key] });
                                            }}
                                            size="small"
                                            className={`rounded-xl px-4 font-bold h-9 transition-all ${
                                                filters.sport?.includes(key) 
                                                ? 'bg-[#BA9440] text-white border-none shadow-md' 
                                                : 'bg-white text-slate-500 hover:text-[#C9A24D] border-slate-100 shadow-sm hover:border-[#C9A24D]'
                                            }`}
                                        >
                                            {label}
                                        </Button>
                                    ))}
                                </div>
                            );

                            return (
                                <Tabs
                                    activeKey={activeTab}
                                    onChange={onTabChange}
                                    className="custom-premium-tabs"
                                    items={[
                                        {
                                            key: 'all',
                                            label: <span className="font-bold">{t('common.all_sports')}</span>,
                                            children: (
                                                <div className="flex flex-wrap items-center gap-2 pt-2 pb-2">
                                                    <Button 
                                                        type={!filters.sport || filters.sport.length === 0 ? 'primary' : 'default'}
                                                        onClick={() => onChange({ ...filters, sport: undefined })}
                                                        size="small"
                                                        className={`rounded-xl px-4 font-bold h-9 transition-all ${
                                                            !filters.sport || filters.sport.length === 0 
                                                            ? 'bg-[#C9A24D] text-white border-none shadow-md' 
                                                            : 'bg-white text-slate-500 hover:text-[#C9A24D] border-slate-100 shadow-sm hover:border-[#C9A24D]'
                                                        }`}
                                                    >
                                                        {t('common.all_sports')}
                                                    </Button>
                                                    {renderButtons(allSports).props.children}
                                                </div>
                                            )
                                        },
                                        {
                                            key: 'team',
                                            label: <span className="font-bold">{t('common.team_sports', 'Team Sports')}</span>,
                                            children: (
                                                <div className="flex flex-wrap items-center gap-2 pt-2 pb-2">
                                                    <Button 
                                                        type={isTeamCat ? 'primary' : 'default'}
                                                        onClick={() => onChange({ ...filters, sport: isTeamCat ? undefined : ['TEAM_CATEGORY' as any] })}
                                                        size="small"
                                                        className={`rounded-xl px-4 font-bold h-9 transition-all ${
                                                            isTeamCat 
                                                            ? 'bg-[#BA9440] text-white border-none shadow-md' 
                                                            : 'bg-white text-slate-500 hover:text-[#C9A24D] border-slate-100 shadow-sm hover:border-[#C9A24D]'
                                                        }`}
                                                    >
                                                        {isAr ? 'جميع اللعبات الجماعية' : 'All Team Sports'}
                                                    </Button>
                                                    {renderButtons(teamSports).props.children}
                                                </div>
                                            )
                                        },
                                        {
                                            key: 'individual',
                                            label: <span className="font-bold">{t('common.individual_sports', 'Individual Sports')}</span>,
                                            children: (
                                                <div className="flex flex-wrap items-center gap-2 pt-2 pb-2">
                                                    <Button 
                                                        type={isIndivCat ? 'primary' : 'default'}
                                                        onClick={() => onChange({ ...filters, sport: isIndivCat ? undefined : ['INDIVIDUAL_CATEGORY' as any] })}
                                                        size="small"
                                                        className={`rounded-xl px-4 font-bold h-9 transition-all ${
                                                            isIndivCat 
                                                            ? 'bg-[#BA9440] text-white border-none shadow-md' 
                                                            : 'bg-white text-slate-500 hover:text-[#C9A24D] border-slate-100 shadow-sm hover:border-[#C9A24D]'
                                                        }`}
                                                    >
                                                        {isAr ? 'جميع اللعبات الفردية' : 'All Individual Sports'}
                                                    </Button>
                                                    {renderButtons(allIndividualSports).props.children}
                                                </div>
                                            )
                                        }
                                    ]}
                                />
                            );
                        })()}
                        </div>
                    )}

                    {isDesigner && (
                        <div className="flex flex-col gap-4 mt-2">
                            <FilterLabel icon={<TrophyOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />} label={t('players.specialty')} />
                            <div className="flex flex-wrap items-center gap-2 pt-1 pb-1">
                                <Button 
                                    type={!filters.designer_type ? 'primary' : 'default'}
                                    onClick={() => onChange({ ...filters, designer_type: undefined })}
                                    size="small"
                                    className={`rounded-xl px-4 font-bold h-9 transition-all ${
                                        !filters.designer_type 
                                        ? 'bg-[#C9A24D] text-white border-none shadow-md' 
                                        : 'bg-white text-slate-500 hover:text-[#C9A24D] border-slate-100 shadow-sm hover:border-[#C9A24D]'
                                    }`}
                                >
                                    {isAr ? 'الكل' : 'All'}
                                </Button>
                                {Object.values(DesignerType).map((type) => (
                                    <Button 
                                        key={type}
                                        type={filters.designer_type === type ? 'primary' : 'default'}
                                        onClick={() => onChange({ ...filters, designer_type: type as any })}
                                        size="small"
                                        className={`rounded-xl px-4 font-bold h-9 transition-all ${
                                            filters.designer_type === type 
                                            ? 'bg-[#BA9440] text-white border-none shadow-md' 
                                            : 'bg-white text-slate-500 hover:text-[#C9A24D] border-slate-100 shadow-sm hover:border-[#C9A24D]'
                                        }`}
                                    >
                                        {t(`enums.DesignerType.${type}`, { defaultValue: type })}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {expanded && (
                    <div className="mt-8 slide-in-bottom">
                        <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                            <div className="mb-6 px-2">
                                <Title level={5} className="!m-0 !text-gold-500 !text-sm uppercase tracking-wider font-bold">
                                    {t('common.select_filter_category')}
                                </Title>
                            </div>
                            <Tabs
                                defaultActiveKey="1"
                                className="custom-premium-tabs"
                                items={[
                                    {
                                        key: '1',
                                        label: (
                                            <>
                                                <UserOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />
                                                {t('common.filter_categories.basic')}
                                            </>
                                        ),
                                        children: (
                                            <Row gutter={[24, 24]} className="pt-6">
                                                {/* Role filter removed from here as it is now always visible above */}
                                                <Col xs={24} sm={12} lg={6}>
                                                    <FilterLabel icon={<GlobalOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />} label={t('common.nationality')} />
                                                    <Select
                                                        mode="multiple" 
                                                        showSearch 
                                                        placeholder={t('common.nationality')} 
                                                        className="w-full custom-select"
                                                        value={filters.nationality} 
                                                        onChange={(v) => onChange({ ...filters, nationality: v })} 
                                                        allowClear
                                                        filterOption={(input, option) => {
                                                            const norm = (s: string) => (s || '').toLowerCase().replace(/[أإآٱ]/g, 'ا').replace(/ة/g, 'ه').replace(/[ىی]/g, 'ي');
                                                            const label = String(option?.label || '');
                                                            const value = String(option?.value || '').toLowerCase();
                                                            return norm(label).includes(norm(input)) || norm(value).includes(norm(input));
                                                        }}
                                                    >
                                                        {availableNationalities?.map(n => {
                                                            const displayLabel = i18n.language === 'ar' ? (n.label || n.value) : (n.fullEn || n.label || n.value);
                                                            return (
                                                                <Option key={n.value} value={n.value} label={displayLabel}>
                                                                    {displayLabel}
                                                                </Option>
                                                            );
                                                        })}
                                                    </Select>
                                                </Col>
                                                {/* Club - hidden for Referee, Photographer, Designer */}
                                                {!(isReferee || isPhotographer || isDesigner) && (
                                                    <Col xs={24} sm={12} lg={6}>
                                                        <FilterLabel icon={<TrophyOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />} label={t('common.club')} />
                                                        <Select
                                                            showSearch
                                                            placeholder={t('common.club')}
                                                            className="w-full h-11 premium-select"
                                                            value={filters.club_id}
                                                            onChange={(val) => onChange({ ...filters, club_id: val, club: undefined })}
                                                            allowClear
                                                            optionFilterProp="label"
                                                        >
                                                            {apiClubs.map(c => (
                                                                <Option key={c.id} value={c.id} label={isAr ? (c.name_ar || c.name) : c.name}>
                                                                    <Space>
                                                                        {c.logo_url && <Avatar size="small" src={c.logo_url} />}
                                                                        {isAr ? (c.name_ar || c.name) : c.name}
                                                                    </Space>
                                                                </Option>
                                                            ))}
                                                        </Select>
                                                    </Col>
                                                )}
                                                {/* Origin - shown for all roles */}
                                                <Col xs={24} sm={12} lg={6}>
                                                    <FilterLabel 
                                                        icon={<UserOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />} 
                                                        label={isPlayer ? t('common.player_origin') : (isAr ? `منشأ ${roleText}` : `${roleText} Origin`)} 
                                                    />
                                                    <div className="flex flex-wrap gap-2">
                                                        <Button 
                                                            type={filters.isLocal === true ? 'primary' : 'default'}
                                                            className={`rounded-xl px-4 font-bold transition-all ${filters.isLocal === true ? 'bg-[#BA9440] text-white' : ''}`}
                                                            onClick={() => onChange({ ...filters, isLocal: filters.isLocal === true ? undefined : true })}
                                                        >
                                                            {localLabel}
                                                        </Button>
                                                        <Button 
                                                            type={filters.isLocal === false ? 'primary' : 'default'}
                                                            className={`rounded-xl px-4 font-bold transition-all ${filters.isLocal === false ? 'bg-[#BA9440] text-white' : ''}`}
                                                            onClick={() => onChange({ ...filters, isLocal: filters.isLocal === false ? undefined : false })}
                                                        >
                                                            {foreignLabel}
                                                        </Button>
                                                    </div>
                                                </Col>
                                                {/* Age - shown for all roles */}
                                                <Col xs={24} sm={12} lg={6}>
                                                    <FilterLabel icon={<UserOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />} label={t('common.age')} />
                                                    <Slider
                                                        range min={5} max={60} value={[filters.ageMin || 5, filters.ageMax || 60]}
                                                        onChange={(v) => onChange({ ...filters, ageMin: v[0], ageMax: v[1] })}
                                                    />
                                                    <div className="flex justify-between text-[11px] font-bold text-gold-500 mt-1">
                                                        <span>{filters.ageMin || 5}{t('players.years_label')}</span>
                                                        <span>{filters.ageMax || 60}{t('players.years_label')}</span>
                                                    </div>
                                                </Col>
                                                {/* Legal Status - shown for all roles */}
                                                <Col xs={24} sm={12} lg={6}>
                                                    <FilterLabel 
                                                        icon={<FileProtectOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />} 
                                                        label={isPlayer ? t('players.legal_status') : (isAr ? `حالة ${roleText}` : `${roleText} Status`)} 
                                                    />
                                                    <div className="flex flex-wrap gap-2">
                                                        {['PROFESSIONAL', 'AMATEUR'].map((status) => (
                                                            <Button 
                                                                key={status}
                                                                type={filters.legalStatus?.includes(status as any) ? 'primary' : 'default'}
                                                                className={`rounded-xl px-4 font-bold transition-all ${filters.legalStatus?.includes(status as any) ? 'bg-[#BA9440] text-white' : ''}`}
                                                                onClick={() => {
                                                                    const current = filters.legalStatus || [];
                                                                    const next = current.includes(status as any) ? current.filter(x => x !== status) : [...current, status];
                                                                    onChange({ ...filters, legalStatus: next.length > 0 ? next as any[] : undefined });
                                                                }}
                                                            >
                                                                {status === 'PROFESSIONAL' ? proLabel : amateurLabel}
                                                            </Button>
                                                        ))}
                                                    </div>
                                                </Col>
                                                {/* Deal Status - hidden for Referee, Photographer, Designer */}
                                                {!(isReferee || isPhotographer || isDesigner) && (
                                                    <Col xs={24} sm={12} lg={6}>
                                                        <FilterLabel icon={<TrophyOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />} label={t('players.deal_status')} />
                                                        <div className="flex flex-wrap gap-2">
                                                            {[DealStatus.FREE_AGENT, DealStatus.SIGNED].map((status) => (
                                                                <Button 
                                                                    key={status}
                                                                    type={filters.dealStatus?.includes(status) ? 'primary' : 'default'}
                                                                    className={`rounded-xl px-4 font-bold transition-all ${filters.dealStatus?.includes(status) ? 'bg-[#BA9440] text-white' : ''}`}
                                                                    onClick={() => {
                                                                        const current = filters.dealStatus || [];
                                                                        const next = current.includes(status) ? current.filter(x => x !== status) : [...current, status];
                                                                        onChange({ ...filters, dealStatus: next.length > 0 ? next : undefined });
                                                                    }}
                                                                >
                                                                    {t(`enums.DealStatus.${status}`)}
                                                                </Button>
                                                            ))}
                                                        </div>
                                                    </Col>
                                                )}
                                                {/* Stale CVs - shown for all roles */}
                                                {isUserAdmin && (
                                                    <Col xs={24} sm={12} lg={6}>
                                                        <FilterLabel icon={<ClockCircleOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />} label={t('admin.notifications.stale_title')} />
                                                        <div className="flex flex-wrap gap-2">
                                                            <Button 
                                                                type={filters.staleCVs === true ? 'primary' : 'default'}
                                                                className={`rounded-xl px-4 font-bold transition-all ${filters.staleCVs === true ? 'bg-[#BA9440] text-white' : ''}`}
                                                                onClick={() => onChange({ ...filters, staleCVs: filters.staleCVs === true ? undefined : true })}
                                                            >
                                                                {t('admin.notifications.stale_title')}
                                                            </Button>
                                                        </div>
                                                    </Col>
                                                )}
                                                {/* Sponsorships - shown for all roles for Admin/Owner */}
                                                {isUserAdmin && (
                                                    <Col xs={24} sm={12} lg={6}>
                                                        <FilterLabel icon={<DollarOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />} label={isAr ? "مستفيدين من الرعايات" : "Has Sponsorships"} />
                                                        <div className="flex flex-wrap gap-2">
                                                            <Button 
                                                                type={filters.has_sponsorships === true ? 'primary' : 'default'}
                                                                className={`rounded-xl px-4 font-bold transition-all ${filters.has_sponsorships === true ? 'bg-[#BA9440] text-white' : ''}`}
                                                                onClick={() => onChange({ ...filters, has_sponsorships: filters.has_sponsorships === true ? undefined : true })}
                                                            >
                                                                {isAr ? "مستفيدين من الرعايات" : "Has Sponsorships"}
                                                            </Button>
                                                        </div>
                                                    </Col>
                                                )}
                                            </Row>
                                        )
                                    },
                                    // Technical tab - only for Player or ALL
                                    ...(isPlayer || selectedRole === 'ALL' ? [{
                                        key: '2',
                                        label: (
                                            <>
                                                <TrophyOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />
                                                {t('common.filter_categories.technical')}
                                            </>
                                        ),
                                        children: (
                                            <Row gutter={[24, 24]} className="pt-6">
                                                <Col xs={24} sm={12} lg={6}>
                                                    <FilterLabel icon={<EnvironmentOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />} label={t('common.position')} />
                                                    <Select
                                                        mode="multiple" showSearch placeholder={t('common.positions', { defaultValue: 'Positions' })} className="w-full custom-select"
                                                        value={filters.positions} onChange={(v) => onChange({ ...filters, positions: v })} allowClear
                                                        optionFilterProp="label"
                                                    >
                                                        {filteredPositionsBySport.map(p => (
                                                            <Option key={p.value} value={p.value} label={t(`enums.Position.${p.label}`, { defaultValue: p.label })}>
                                                                {t(`enums.Position.${p.label}`, { defaultValue: p.label })}
                                                            </Option>
                                                        ))}
                                                    </Select>
                                                </Col>
                                                {(() => {
                                                    const selectedSports = Array.isArray(filters.sport) ? filters.sport : (filters.sport ? [filters.sport] : []);
                                                    // Convert Sport enum or string to string for utility
                                                    const sportNames = selectedSports.map(s => String(s));
                                                    const isHandSportSelected = sportNames.some(s => isHandSport(s));
                                                    const isFootSportSelected = sportNames.some(s => isFootSport(s));
                                                    
                                                    // Only hide if a sport is selected and it's NOT a foot or hand sport
                                                    const hasSportFilter = selectedSports.length > 0 && !selectedSports.includes('TEAM_CATEGORY' as any) && !selectedSports.includes('INDIVIDUAL_CATEGORY' as any);
                                                    if (hasSportFilter && !isHandSportSelected && !isFootSportSelected) return null;

                                                    return (
                                                        <Col xs={24} sm={12} lg={6}>
                                                            <FilterLabel icon={<RocketOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />} label={isHandSportSelected ? t('players.preferred_hand') : t('common.preferred_foot')} />
                                                            <div className="flex flex-wrap gap-2">
                                                                {Object.values(PreferredFoot).map(f => (
                                                                    <Button 
                                                                        key={f}
                                                                        type={filters.preferredFoot?.includes(f) ? 'primary' : 'default'}
                                                                        className={`rounded-xl px-4 font-bold transition-all ${filters.preferredFoot?.includes(f) ? 'bg-[#BA9440] text-white' : ''}`}
                                                                        onClick={() => {
                                                                            const current = filters.preferredFoot || [];
                                                                            const next = current.includes(f) ? current.filter(x => x !== f) : [...current, f];
                                                                            onChange({ ...filters, preferredFoot: next.length > 0 ? next as PreferredFoot[] : undefined });
                                                                        }}
                                                                    >
                                                                        {isHandSportSelected ? t(`enums.PreferredHand.${f}`) : t(`enums.PreferredFoot.${f}`)}
                                                                    </Button>
                                                                ))}
                                                            </div>
                                                        </Col>
                                                    );
                                                })()}
                                            </Row>
                                        )
                                    }] : []),
                                    {
                                        key: '3',
                                        label: (
                                            <>
                                                <DollarOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />
                                                {t('common.filter_categories.contract')}
                                            </>
                                        ),
                                        children: (
                                            <div className="pt-6">
                                                <Row gutter={[32, 32]}>
                                                    <Col xs={24} lg={8}>
                                                        <div className="bg-white/50 p-5 rounded-2xl border border-slate-200/60 shadow-sm h-full flex flex-col justify-between">
                                                            <div>
                                                                <FilterLabel icon={<DollarOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />} label={t('common.value')} />
                                                                <div className="mt-8 px-2">
                                                                    <Slider
                                                                        range 
                                                                        min={0} 
                                                                        max={500000000} 
                                                                        step={1000000}
                                                                        tooltip={{
                                                                            formatter: (v) => `$${(v || 0) / 1000000}M`
                                                                        }}
                                                                        value={[filters.marketValueMin || 0, filters.marketValueMax || 500000000]}
                                                                        onChange={(v) => onChange({ ...filters, marketValueMin: v[0], marketValueMax: v[1] })}
                                                                        trackStyle={[{ backgroundColor: '#C9A24D' }]}
                                                                        handleStyle={[{ borderColor: '#C9A24D', backgroundColor: '#fff' }, { borderColor: '#C9A24D', backgroundColor: '#fff' }]}
                                                                    />
                                                                    <div className="flex justify-between items-center mt-4">
                                                                        <div className="flex flex-col">
                                                                            <span className="text-[10px] text-slate-400 uppercase font-bold">{t('common.start_date', { defaultValue: 'Min' })}</span>
                                                                            <span className="text-sm font-black text-slate-700">${(filters.marketValueMin || 0) / 1000000}M</span>
                                                                        </div>
                                                                        <div className="flex flex-col items-end">
                                                                            <span className="text-[10px] text-slate-400 uppercase font-bold">{t('common.end_date', { defaultValue: 'Max' })}</span>
                                                                            <span className="text-sm font-black text-slate-700">${(filters.marketValueMax || 500000000) / 1000000}M</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </Col>
                                                    <Col xs={24} lg={16}>
                                                        {!isPublic && (
                                                            <div className="bg-white/50 p-5 rounded-2xl border border-slate-200/60 shadow-sm">
                                                                <FilterLabel icon={<FileProtectOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />} label={t('common.contracts')} />
                                                                <Row gutter={[20, 20]} className="mt-4">
                                                                    <Col span={24}>
                                                                        <div className="flex flex-col md:flex-row md:items-center gap-4 border-b border-slate-100 pb-4 mb-2">
                                                                            <div className="min-w-[120px]">
                                                                                <Text className="text-[11px] font-black text-slate-400 uppercase tracking-wider">{t('common.contract_type')}</Text>
                                                                            </div>
                                                                            <div className="flex flex-wrap gap-2">
                                                                                {['PROFESSIONAL', 'YOUTH', 'LOAN', 'AMATEUR'].map((type) => (
                                                                                    <Button 
                                                                                        key={type}
                                                                                        size="small"
                                                                                        type={filters.contractType?.includes(type as any) ? 'primary' : 'default'}
                                                                                        className={`rounded-lg px-3 font-bold h-8 transition-all ${filters.contractType?.includes(type as any) ? 'bg-[#BA9440] border-none text-white shadow-sm' : 'bg-white text-slate-500 border-slate-200'}`}
                                                                                        onClick={() => {
                                                                                            const current = filters.contractType || [];
                                                                                            const next = current.includes(type as any) ? current.filter(x => x !== type) : [...current, type];
                                                                                            onChange({ ...filters, contractType: next.length > 0 ? next as any[] : undefined });
                                                                                        }}
                                                                                    >
                                                                                        {t(`admin.contracts.type_${type.toLowerCase()}`)}
                                                                                    </Button>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    </Col>
                                                                    <Col span={24}>
                                                                        <div className="flex flex-col md:flex-row md:items-center gap-4 border-b border-slate-100 pb-4 mb-2">
                                                                            <div className="min-w-[120px]">
                                                                                <Text className="text-[11px] font-black text-slate-400 uppercase tracking-wider">{t('common.contract_nature')}</Text>
                                                                            </div>
                                                                            <div className="flex flex-wrap gap-2">
                                                                                {['SIGNING', 'AUTHORIZATION', 'NOT_JOINED', 'TERMINATION'].map((nature) => (
                                                                                    <Button 
                                                                                        key={nature}
                                                                                        size="small"
                                                                                        type={filters.contractNature?.includes(nature as any) ? 'primary' : 'default'}
                                                                                        className={`rounded-lg px-3 font-bold h-8 transition-all ${filters.contractNature?.includes(nature as any) ? 'bg-[#BA9440] border-none text-white shadow-sm' : 'bg-white text-slate-500 border-slate-200'}`}
                                                                                        onClick={() => {
                                                                                            const isSelected = filters.contractNature?.includes(nature as any);
                                                                                            onChange({ ...filters, contractNature: isSelected ? undefined : [nature as any] });
                                                                                        }}
                                                                                    >
                                                                                        {t(`enums.ContractNature.${nature}`)}
                                                                                    </Button>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    </Col>
                                                                    <Col xs={24} md={8}>
                                                                        <div className="flex flex-col gap-1.5">
                                                                            <Text className="text-[11px] font-black text-slate-400 uppercase tracking-wider">{t('admin.contracts.expiry_years')}</Text>
                                                                            <Select
                                                                                mode="multiple" 
                                                                                placeholder={t('admin.contracts.expiry_years')} 
                                                                                className="w-full custom-select-premium"
                                                                                value={filters.contractExpiryYear} 
                                                                                onChange={(v) => onChange({ ...filters, contractExpiryYear: v })} 
                                                                                allowClear
                                                                                maxTagCount="responsive"
                                                                            >
                                                                                {[2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030].map(y => <Option key={y} value={y}>{y}</Option>)}
                                                                            </Select>
                                                                        </div>
                                                                    </Col>
                                                                    {!hideRemainingDuration && (
                                                                        <Col xs={24} md={8}>
                                                                            <div className="flex flex-col gap-1.5">
                                                                                <Text className="text-[11px] font-black text-slate-400 uppercase tracking-wider">{t('admin.contracts.remaining_time')}</Text>
                                                                                <Select
                                                                                    mode="multiple"
                                                                                    showSearch
                                                                                    placeholder={t('admin.contracts.remaining_time')}
                                                                                    className="w-full custom-select-premium"
                                                                                    value={filters.remainingDuration}
                                                                                    onChange={(v) => onChange({ ...filters, remainingDuration: v })}
                                                                                    allowClear
                                                                                    optionFilterProp="label"
                                                                                    maxTagCount="responsive"
                                                                                >
                                                                                    <Option value="3months" label={t('admin.contracts.remaining_3m')}>{t('admin.contracts.remaining_3m')}</Option>
                                                                                    <Option value="6months" label={t('admin.contracts.remaining_6m')}>{t('admin.contracts.remaining_6m')}</Option>
                                                                                    <Option value="1year" label={t('admin.contracts.remaining_1y')}>{t('admin.contracts.remaining_1y')}</Option>
                                                                                    <Option value="2years" label={t('admin.contracts.remaining_2y')}>{t('admin.contracts.remaining_2y')}</Option>
                                                                                    <Option value="moreThan2years" label={t('admin.contracts.remaining_plus')}>{t('admin.contracts.remaining_plus')}</Option>
                                                                                </Select>
                                                                            </div>
                                                                        </Col>
                                                                    )}
                                                                    <Col xs={24} md={8}>
                                                                        <div className="flex flex-col gap-1.5">
                                                                            <Text className="text-[11px] font-black text-slate-400 uppercase tracking-wider">{t('common.date_range', { defaultValue: 'Contract Period' })}</Text>
                                                                            <RangePicker
                                                                                className="w-full h-9 rounded-lg border-slate-200"
                                                                                value={filters.start_date && filters.end_date ? [dayjs(filters.start_date), dayjs(filters.end_date)] : null}
                                                                                onChange={(dates) => onChange({ ...filters, start_date: dates?.[0]?.format('YYYY-MM-DD'), end_date: dates?.[1]?.format('YYYY-MM-DD') })}
                                                                            />
                                                                        </div>
                                                                    </Col>
                                                                </Row>
                                                            </div>
                                                        )}
                                                    </Col>
                                                </Row>
                                            </div>
                                        )
                                    },
                                    // Certificates tab - shown for ALL roles
                                    ...(true ? [{
                                        key: '4',
                                        label: (
                                            <>
                                                <FileProtectOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />
                                                {t('common.filter_categories.certificates', { defaultValue: 'Certificates' })}
                                            </>
                                        ),
                                        children: (
                                            <Row gutter={[24, 24]} className="pt-6">
                                                <Col xs={24} sm={12} lg={6}>
                                                    <FilterLabel icon={<FileProtectOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />} label={t('coaches.certificate_type', { defaultValue: 'Certificate Type' })} />
                                                    <Select
                                                        mode="multiple"
                                                        placeholder={t('coaches.certificate_type')}
                                                        className="w-full custom-select"
                                                        value={filters.certificate_type}
                                                        onChange={(v) => onChange({ ...filters, certificate_type: v })}
                                                        allowClear
                                                    >
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
                                                                <Option key={type} value={type}>
                                                                    {t(`coaches.cert_types.${key}`, { defaultValue: type })}
                                                                </Option>
                                                            );
                                                        })}
                                                    </Select>
                                                </Col>
                                                <Col xs={24} sm={12} lg={6}>
                                                    <FilterLabel icon={<EnvironmentOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />} label={t('coaches.issuing_body', { defaultValue: 'Issuing Body' })} />
                                                    <Input
                                                        placeholder={t('coaches.issuing_body')}
                                                        className="h-11 rounded-xl"
                                                        value={filters.issuing_body}
                                                        onChange={(e) => onChange({ ...filters, issuing_body: e.target.value })}
                                                        allowClear
                                                    />
                                                </Col>
                                                <Col xs={24} sm={12} lg={6}>
                                                    <FilterLabel icon={<TrophyOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />} label={t('coaches.level', { defaultValue: 'Level' })} />
                                                    <Select
                                                        mode="multiple"
                                                        placeholder={t('coaches.level')}
                                                        className="w-full custom-select"
                                                        value={filters.level}
                                                        onChange={(v) => onChange({ ...filters, level: v })}
                                                        allowClear
                                                    >
                                                        {['Beginner', 'Intermediate', 'Advanced', 'Professional'].map(level => (
                                                            <Option key={level} value={level}>{t(`coaches.levels.${level.toLowerCase()}`, { defaultValue: level })}</Option>
                                                        ))}
                                                    </Select>
                                                </Col>
                                                <Col xs={24} sm={12} lg={6}>
                                                    <FilterLabel icon={<GlobalOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />} label={t('coaches.source_type', { defaultValue: 'Source Type' })} />
                                                    <Select
                                                        mode="multiple"
                                                        placeholder={t('coaches.source_type')}
                                                        className="w-full custom-select"
                                                        value={filters.source_type}
                                                        onChange={(v) => onChange({ ...filters, source_type: v })}
                                                        allowClear
                                                    >
                                                        {['Sports Federation', 'Academy', 'University', 'Online Course', 'Club Training', 'Other'].map(source => (
                                                            <Option key={source} value={source}>{t(`coaches.sources.${source.replace(/\s+/g, '_').toLowerCase()}`, { defaultValue: source })}</Option>
                                                        ))}
                                                    </Select>
                                                </Col>
                                            </Row>
                                        )
                                    }] : [])
                                ]}
                            />
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default SearchFilters;
