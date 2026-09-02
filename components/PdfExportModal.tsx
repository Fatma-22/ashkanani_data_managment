import { FC, useState } from 'react';
import { Modal, Checkbox, Button, Divider, Typography, Space, Tag } from 'antd';
import { FilePdfOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { Player } from '../types';
import { PDF_FIELD_OPTIONS, DEFAULT_PDF_FIELDS, generatePlayersPdf, PdfFieldOption } from '../utils/pdfExport';

const { Title, Text } = Typography;

interface PdfExportModalProps {
    open: boolean;
    onClose: () => void;
    players: Player[];
    totalCount: number;
    filterSummary?: string;
}

// Group fields by category
const FIELD_GROUPS = {
    basic: ['name', 'sport', 'positions', 'nationality', 'club', 'age', 'dateOfBirth', 'gender', 'bornInKuwait'],
    physical: ['height', 'weight', 'preferredFoot', 'jerseyNumber'],
    contract: ['marketValue', 'dealStatus', 'contractStatus', 'contractNature', 'contractStartDate', 'contractEndDate'],
    contact: ['phone', 'email', 'nationalId', 'previousClubs'],
};

const PdfExportModal: FC<PdfExportModalProps> = ({ open, onClose, players, totalCount, filterSummary }) => {
    const { t, i18n } = useTranslation();
    const isAr = i18n.language.startsWith('ar');
    const [selectedFields, setSelectedFields] = useState<string[]>(DEFAULT_PDF_FIELDS);
    const [loading, setLoading] = useState(false);

    const handleToggleField = (key: string) => {
        setSelectedFields(prev =>
            prev.includes(key)
                ? prev.filter(f => f !== key)
                : [...prev, key]
        );
    };

    const handleSelectAll = () => {
        setSelectedFields(PDF_FIELD_OPTIONS.map(f => f.key));
    };

    const handleDeselectAll = () => {
        setSelectedFields([]);
    };

    const handleSelectGroup = (groupKeys: string[]) => {
        const allSelected = groupKeys.every(k => selectedFields.includes(k));
        if (allSelected) {
            setSelectedFields(prev => prev.filter(k => !groupKeys.includes(k)));
        } else {
            setSelectedFields(prev => [...new Set([...prev, ...groupKeys])]);
        }
    };

    const handleExport = async () => {
        if (selectedFields.length === 0) return;
        setLoading(true);
        try {
            generatePlayersPdf(players, selectedFields, t, isAr, filterSummary);
        } finally {
            setLoading(false);
            onClose();
        }
    };

    const getFieldLabel = (field: PdfFieldOption) => isAr ? field.labelAr : field.labelEn;

    const renderGroup = (titleKey: string, groupKeys: string[]) => {
        const groupFields = groupKeys
            .map(key => PDF_FIELD_OPTIONS.find(f => f.key === key))
            .filter(Boolean) as PdfFieldOption[];
        const allSelected = groupKeys.every(k => selectedFields.includes(k));

        return (
            <div key={titleKey} className="mb-4">
                <div className="flex items-center justify-between mb-2">
                    <Text strong className="text-sm uppercase tracking-wider" style={{ color: '#C9A24D' }}>
                        {t(`common.filter_categories.${titleKey}`, { defaultValue: titleKey })}
                    </Text>
                    <Button
                        type="link"
                        size="small"
                        onClick={() => handleSelectGroup(groupKeys)}
                        className="!text-[11px] !p-0"
                        style={{ color: allSelected ? '#999' : '#C9A24D' }}
                    >
                        {allSelected ? t('common.pdf_export.deselect_group', { defaultValue: 'Deselect All' }) : t('common.pdf_export.select_group', { defaultValue: 'Select All' })}
                    </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                    {groupFields.map(field => {
                        const isSelected = selectedFields.includes(field.key);
                        return (
                            <Tag
                                key={field.key}
                                onClick={() => handleToggleField(field.key)}
                                className="cursor-pointer select-none transition-all duration-200 !text-xs !px-3 !py-1 !rounded-lg !border"
                                style={{
                                    background: isSelected ? 'rgba(201, 162, 77, 0.15)' : 'rgba(255,255,255,0.05)',
                                    borderColor: isSelected ? '#C9A24D' : 'rgba(255,255,255,0.15)',
                                    color: isSelected ? '#C9A24D' : '#999',
                                    fontWeight: isSelected ? 700 : 400,
                                }}
                            >
                                {isSelected && <CheckCircleOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} className="mr-1" />}
                                {getFieldLabel(field)}
                            </Tag>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <Modal
            open={open}
            onCancel={onClose}
            title={
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#C9A24D] to-[#a07e38] flex items-center justify-center shadow-lg">
                        <FilePdfOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} className="text-white text-lg" />
                    </div>
                    <div>
                        <Title level={5} className="!m-0 !text-base">
                            {t('common.pdf_export.title', { defaultValue: 'Export PDF Report' })}
                        </Title>
                        <Text className="text-xs" style={{ color: '#999' }}>
                            {t('common.pdf_export.subtitle', { defaultValue: 'Choose the data fields to include' })}
                        </Text>
                    </div>
                </div>
            }
            footer={
                <div className="flex items-center justify-between pt-2">
                    <Text className="text-xs" style={{ color: '#999' }}>
                        {t('common.pdf_export.selected_count', { defaultValue: '{{count}} fields selected', count: selectedFields.length })}
                        {' · '}
                        {t('common.pdf_export.players_count', { defaultValue: '{{count}} players', count: players.length })}
                        {totalCount > players.length && (
                            <span style={{ color: '#C9A24D' }}>
                                {' '}({t('common.pdf_export.of_total', { defaultValue: 'of {{total}} total', total: totalCount })})
                            </span>
                        )}
                    </Text>
                    <Space>
                        <Button onClick={onClose}>
                            {t('common.cancel')}
                        </Button>
                        <Button
                            type="primary"
                            icon={<FilePdfOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
                            onClick={handleExport}
                            loading={loading}
                            disabled={selectedFields.length === 0}
                            style={{ background: '#C9A24D', borderColor: '#C9A24D' }}
                        >
                            {t('common.pdf_export.export_btn', { defaultValue: 'Export PDF' })}
                        </Button>
                    </Space>
                </div>
            }
            width={640}
        >
            <div className="py-2">
                {/* Quick actions */}
                <div className="flex gap-2 mb-4">
                    <Button size="small" onClick={handleSelectAll} className="!text-xs !rounded-lg" style={{ borderColor: '#C9A24D', color: '#C9A24D' }}>
                        {t('common.pdf_export.select_all', { defaultValue: 'Select All' })}
                    </Button>
                    <Button size="small" onClick={handleDeselectAll} className="!text-xs !rounded-lg">
                        {t('common.pdf_export.deselect_all', { defaultValue: 'Deselect All' })}
                    </Button>
                    <Button size="small" onClick={() => setSelectedFields(DEFAULT_PDF_FIELDS)} className="!text-xs !rounded-lg" style={{ borderColor: '#C9A24D', color: '#C9A24D' }}>
                        {t('common.pdf_export.default_selection', { defaultValue: 'Default Selection' })}
                    </Button>
                </div>

                <Divider className="!my-3" />

                {/* Field groups */}
                {renderGroup('basic', FIELD_GROUPS.basic)}
                {renderGroup('technical', FIELD_GROUPS.physical)}
                {renderGroup('contract', FIELD_GROUPS.contract)}
                {renderGroup('contact', FIELD_GROUPS.contact)}

                {/* Filter info */}
                {filterSummary && (
                    <>
                        <Divider className="!my-3" />
                        <div className="bg-[#f5f0e5] dark:bg-[#2d2a22] p-3 rounded-xl">
                            <Text className="text-xs" style={{ color: '#8a7340' }}>
                                <strong>{t('common.pdf_export.active_filters', { defaultValue: 'Active Filters' })}:</strong> {filterSummary}
                            </Text>
                        </div>
                    </>
                )}
            </div>
        </Modal>
    );
};

export default PdfExportModal;
