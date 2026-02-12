import React, { useState, FC, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Input, Select, Slider, Space, Card, Button, Row, Col, Typography, Badge, Divider } from 'antd';
import {
    SearchOutlined,
    FilterOutlined,
    ClearOutlined,
    UserOutlined,
    GlobalOutlined,
    FieldTimeOutlined,
    DollarOutlined,
    FileProtectOutlined,
    CloseOutlined,
    TrophyOutlined,
} from '@ant-design/icons';
import { PlayerFilters, Position, DealStatus, PreferredFoot, Sport } from '../types';
import { debounce, translateToArabic } from '../utils/helpers';

const { Option } = Select;
const { Text, Title } = Typography;

interface SearchFiltersProps {
    filters: PlayerFilters;
    onChange: (filters: PlayerFilters) => void;
    showAgentFilter?: boolean;
    availableNationalities?: string[];
    availableClubs?: string[];
    isPublic?: boolean;
}

export const SearchFilters: FC<SearchFiltersProps> = ({ filters, onChange, availableNationalities, availableClubs, isPublic = false }) => {
    const { t, i18n } = useTranslation();
    const [expanded, setExpanded] = useState(false);
    const [localSearch, setLocalSearch] = useState(filters.search || '');

    // Debounced search
    const debouncedSearch = debounce((value: string) => {
        onChange({ ...filters, search: value });
    }, 500);

    useEffect(() => {
        debouncedSearch(localSearch);
    }, [localSearch]);

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
            <span className="text-navy-500">{icon}</span>
            <Text className="uppercase text-[10px] font-black tracking-widest text-slate-400">{label}</Text>
        </Space>
    );

    return (
        <div className="fade-in">
            <Card
                className={`transition-all duration-300 border-none shadow-sm ${expanded ? 'bg-white' : 'bg-transparent'}`}
                bodyStyle={{ padding: expanded ? 24 : '4px 0' }}
            >
                <Row gutter={[16, 12]} align="middle" style={{ paddingTop: 4 }}>
                    <Col xs={24} lg={expanded ? 18 : 20}>
                        <Input
                            size="large"
                            className="bg-white border-none shadow-sm h-12 md:h-14 text-base md:text-lg rounded-xl px-4 md:px-6 focus:ring-2 focus:ring-[#01153e] hover:shadow-md transition-all"
                            style={{ border: '1px solid #f0f0f0' }}
                            placeholder={t('common.search_players')}
                            prefix={<SearchOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} className="text-slate-300 mr-2" />}
                            value={localSearch}
                            onChange={(e) => setLocalSearch(e.target.value)}
                            allowClear
                        />
                    </Col>
                    {!isPublic && (
                        <Col xs={24} lg={expanded ? 6 : 4}>
                            <Row gutter={12} justify={{ xs: 'start', lg: 'end' }} align="middle">
                                <Col flex="auto" className="lg:flex-initial">
                                    <Badge count={activeCount} offset={[-4, 4]} color="#01153e" className="w-full lg:w-auto">
                                        <Button
                                            size="large"
                                            icon={<FilterOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
                                            onClick={() => setExpanded(!expanded)}
                                            className={`h-12 md:h-14 px-6 rounded-xl border-0 shadow-sm transition-all w-full ${expanded ? 'bg-[#01153e] text-white shadow-lg' : 'bg-white text-navy-500 font-bold hover:bg-slate-50'}`}
                                            title={expanded ? t('common.hide') : t('common.search')}
                                        >
                                            {expanded ? t('common.hide') : t('common.search')}
                                        </Button>
                                    </Badge>
                                </Col>
                                {activeCount > 0 && (
                                    <Col flex="initial">
                                        <Button
                                            size="large"
                                            type="text"
                                            icon={<CloseOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
                                            onClick={handleClearFilters}
                                            className="h-12 md:h-14 px-4 md:px-6 flex items-center justify-center rounded-xl text-red-500 hover:text-red-600 hover:bg-red-50 transition-all font-bold"
                                        >
                                            {t('common.cancel')}
                                        </Button>
                                    </Col>
                                )}
                            </Row>
                        </Col>
                    )}
                </Row>

                {expanded && (
                    <div className="mt-8 slide-in-bottom">
                        <Divider plain className="mb-8"><Text className="text-slate-300 font-bold px-4">{t('common.search').toUpperCase()}</Text></Divider>

                        <Row gutter={[24, 24]}>
                            {/* CATEGORY: BIOMETRIC & BIO */}
                            <Col xs={24} sm={12} lg={8}>
                                <Space direction="vertical" size="large" className="w-full">
                                    <div>
                                        <FilterLabel icon={<GlobalOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />} label={t('common.nationality')} />
                                        <Select
                                            mode="multiple"
                                            placeholder={t('common.nationality')}
                                            className="w-full custom-select"
                                            value={filters.nationality}
                                            onChange={(v) => onChange({ ...filters, nationality: v })}
                                            allowClear
                                        >
                                            {availableNationalities.map(n => <Option key={n} value={n}>{i18n.language === 'ar' ? translateToArabic(n, 'country') : n}</Option>)}
                                        </Select>
                                    </div>
                                    <div>
                                        <FilterLabel icon={<TrophyOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />} label={t('common.sport')} />
                                        <Select
                                            mode="multiple"
                                            placeholder={t('common.sport')}
                                            className="w-full custom-select"
                                            value={filters.sport}
                                            onChange={(v) => onChange({ ...filters, sport: v })}
                                            allowClear
                                        >
                                            {Object.values(Sport).map(s => (
                                                <Option key={s} value={s}>{t(`enums.Sport.${s}`)}</Option>
                                            ))}
                                        </Select>
                                    </div>
                                    <div>
                                        <FilterLabel icon={<UserOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />} label={t('common.age')} />
                                        <div className="px-2">
                                            <Slider
                                                range
                                                min={16}
                                                max={42}
                                                value={[filters.ageMin || 16, filters.ageMax || 42]}
                                                onChange={(v) => onChange({ ...filters, ageMin: v[0], ageMax: v[1] })}
                                                className="custom-slider"
                                            />
                                            <div className="flex justify-between text-[11px] font-bold text-slate-400">
                                                <span>{filters.ageMin || 16} {t('players.years_label')}</span>
                                                <span>{filters.ageMax || 42} {t('players.years_label')}</span>
                                            </div>
                                        </div>
                                    </div>
                                </Space>
                            </Col>

                            {/* CATEGORY: CAREER & PERFORMANCE */}
                            <Col xs={24} sm={12} lg={8}>
                                <Space direction="vertical" size="large" className="w-full">
                                    <div>
                                        <FilterLabel icon={<FieldTimeOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />} label={t('common.position')} />
                                        <Select
                                            mode="multiple"
                                            placeholder={t('common.position')}
                                            className="w-full custom-select"
                                            value={filters.position}
                                            onChange={(v) => onChange({ ...filters, position: v })}
                                            allowClear
                                        >
                                            {Object.values(Position).map(p => <Option key={p} value={p}>{t(`enums.Position.${p}`)}</Option>)}
                                        </Select>
                                    </div>
                                    <div>
                                        <FilterLabel icon={<TrophyOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />} label={t('common.club')} />
                                        <Select
                                            mode="multiple"
                                            placeholder={t('common.club')}
                                            className="w-full custom-select"
                                            value={filters.club}
                                            onChange={(v) => onChange({ ...filters, club: v })}
                                            allowClear
                                        >
                                            {availableClubs?.map(c => <Option key={c} value={c}>{i18n.language === 'ar' ? translateToArabic(c, 'club') : c}</Option>)}
                                        </Select>
                                    </div>
                                    <div>
                                        <FilterLabel icon={<DollarOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />} label={t('common.value')} />
                                        <div className="px-2">
                                            <Slider
                                                range
                                                min={0}
                                                max={150000000}
                                                step={1000000}
                                                value={[filters.marketValueMin || 0, filters.marketValueMax || 150000000]}
                                                onChange={(v) => onChange({ ...filters, marketValueMin: v[0], marketValueMax: v[1] })}
                                                className="custom-slider"
                                            />
                                            <div className="flex justify-between text-[11px] font-bold text-[#01153e]">
                                                <span>${(filters.marketValueMin || 0) / 1000000}M</span>
                                                <span>${(filters.marketValueMax || 150000000) / 1000000}M</span>
                                            </div>
                                        </div>
                                    </div>
                                </Space>
                            </Col>

                            {/* CATEGORY: CONTRACTUAL */}
                            <Col xs={24} lg={8}>
                                <Row gutter={[24, 24]}>
                                    <Col xs={24} sm={12} lg={24}>
                                        <FilterLabel icon={<FileProtectOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />} label={t('common.contracts')} />
                                        <Space direction="vertical" className="w-full">
                                            <Select
                                                mode="multiple"
                                                placeholder={t('common.contracts')}
                                                className="w-full custom-select mb-2"
                                                value={filters.contractType}
                                                onChange={(v) => onChange({ ...filters, contractType: v })}
                                                allowClear
                                            >
                                                <Option value="Professional">{t('admin.contracts.type_professional')}</Option>
                                                <Option value="Youth">{t('admin.contracts.type_youth')}</Option>
                                                <Option value="Loan">{t('admin.contracts.type_loan')}</Option>
                                            </Select>
                                            <Select
                                                mode="multiple"
                                                placeholder={t('admin.contracts.start_year')}
                                                className="w-full custom-select mb-2"
                                                value={filters.contractStartYear}
                                                onChange={(v) => onChange({ ...filters, contractStartYear: v })}
                                                allowClear
                                            >
                                                {[2020, 2021, 2022, 2023, 2024, 2025].map(y => <Option key={y} value={y}>{y}</Option>)}
                                            </Select>
                                            <Select
                                                mode="multiple"
                                                placeholder={t('admin.contracts.expiry_years')}
                                                className="w-full custom-select mb-2"
                                                value={filters.contractExpiryYear}
                                                onChange={(v) => onChange({ ...filters, contractExpiryYear: v })}
                                                allowClear
                                            >
                                                {[2024, 2025, 2026, 2027, 2028].map(y => <Option key={y} value={y}>{y}</Option>)}
                                            </Select>
                                            <Select
                                                mode="multiple"
                                                placeholder={t('admin.contracts.duration')}
                                                className="w-full custom-select mb-2"
                                                value={filters.contractDuration}
                                                onChange={(v) => onChange({ ...filters, contractDuration: v })}
                                                allowClear
                                            >
                                                <Option value="1year">{t('admin.contracts.duration_1yr')}</Option>
                                                <Option value="moreThan1year">{t('admin.contracts.duration_plus')}</Option>
                                            </Select>
                                            <Select
                                                mode="multiple"
                                                placeholder={t('admin.contracts.remaining_time')}
                                                className="w-full custom-select"
                                                value={filters.remainingDuration}
                                                onChange={(v) => onChange({ ...filters, remainingDuration: v })}
                                                allowClear
                                            >
                                                <Option value="6months">{t('admin.contracts.remaining_6m')}</Option>
                                                <Option value="1year">{t('admin.contracts.remaining_1y')}</Option>
                                                <Option value="2years">{t('admin.contracts.remaining_2y')}</Option>
                                                <Option value="moreThan2years">{t('admin.contracts.remaining_plus')}</Option>
                                            </Select>
                                        </Space>
                                    </Col>
                                    <Col xs={24} sm={12} lg={24}>
                                        <FilterLabel icon={<SearchOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />} label={t('players.deal_status')} />
                                        <Select
                                            mode="multiple"
                                            placeholder={t('common.status')}
                                            className="w-full custom-select"
                                            value={filters.dealStatus}
                                            onChange={(v) => onChange({ ...filters, dealStatus: v })}
                                            allowClear
                                        >
                                            {Object.values(DealStatus).map(s => <Option key={s} value={s}>{t(`enums.DealStatus.${s}`)}</Option>)}
                                        </Select>
                                    </Col>
                                </Row>
                            </Col>
                        </Row>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default SearchFilters;
