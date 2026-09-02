import React, { useEffect, useRef, useState } from 'react';
import { Modal, Form, Input, InputNumber, DatePicker, Select, message, Typography, Row, Col, Upload } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { Deal, Player, Sport } from '../types';
import { dealService } from '../services/dealService';
import { normalizeArabic, translateText } from '../utils/helpers';

interface DealModalProps {
    visible: boolean;
    deal: Deal | null;
    onCancel: () => void;
    onSuccess: () => void;
    players: Player[];
}

const DealModal: React.FC<DealModalProps> = ({ visible, deal, onCancel, onSuccess, players }) => {
    const [contractFileList, setContractFileList] = useState<any[]>([]);
        // عند فتح المودال، لو فيه صور قديمة، نعرضها
        useEffect(() => {
            if (visible && deal) {
                if (deal.contractUrl) {
                    setContractFileList([{
                        uid: '-1',
                        name: t('admin.deals.contract_file') || 'contract',
                        status: 'done',
                        url: deal.contractUrl,
                    }]);
                } else {
                    setContractFileList([]);
                }
            } else if (visible) {
                setContractFileList([]);
            }
        }, [visible, deal]);
    const { t, i18n } = useTranslation();
    const [form] = Form.useForm();
    const translateTimeouts = useRef<{ [key: string]: NodeJS.Timeout }>({});

    const handleValuesChange = (changedValues: any) => {
        if (changedValues.manualPlayerNameAr) {
            const value = changedValues.manualPlayerNameAr;
            if (translateTimeouts.current['manualPlayerNameAr']) {
                clearTimeout(translateTimeouts.current['manualPlayerNameAr']);
            }
            translateTimeouts.current['manualPlayerNameAr'] = setTimeout(async () => {
                if (!value) return;
                if (!form.getFieldValue('manualPlayerName')) {
                    const translated = await translateText(value, 'ar', 'en');
                    form.setFieldsValue({ manualPlayerName: translated });
                }
            }, 800);
        }

        if (changedValues.fromClubAr) {
            const value = changedValues.fromClubAr;
            if (translateTimeouts.current['fromClubAr']) clearTimeout(translateTimeouts.current['fromClubAr']);
            translateTimeouts.current['fromClubAr'] = setTimeout(async () => {
                if (value && !form.getFieldValue('fromClub')) {
                    const translated = await translateText(value, 'ar', 'en');
                    form.setFieldsValue({ fromClub: translated });
                }
            }, 800);
        }

        if (changedValues.toClubAr) {
            const value = changedValues.toClubAr;
            if (translateTimeouts.current['toClubAr']) clearTimeout(translateTimeouts.current['toClubAr']);
            translateTimeouts.current['toClubAr'] = setTimeout(async () => {
                if (value && !form.getFieldValue('toClub')) {
                    const translated = await translateText(value, 'ar', 'en');
                    form.setFieldsValue({ toClub: translated });
                }
            }, 800);
        }
    };

    useEffect(() => {
        if (visible) {
            if (deal) {
                form.setFieldsValue({
                    ...deal,
                    dealDate: deal.dealDate ? dayjs(deal.dealDate) : null,
                    contractStartDate: deal.contractStartDate ? dayjs(deal.contractStartDate) : null,
                    contractEndDate: deal.contractEndDate ? dayjs(deal.contractEndDate) : null,
                });
            } else {
                form.resetFields();
            }
        }
    }, [visible, deal, form]);

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            // تجهيز العقد
            let contractUrl = deal?.contractUrl || null;
            if (contractFileList.length > 0) {
                const file = contractFileList[0];
                if (file.url) {
                    contractUrl = file.url;
                } else if (file.originFileObj) {
                    contractUrl = await new Promise<string>((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = () => resolve(reader.result as string);
                        reader.onerror = reject;
                        reader.readAsDataURL(file.originFileObj);
                    });
                }
            } else {
                contractUrl = null;
            }

            const payload = {
                ...values,
                dealDate: values.dealDate ? values.dealDate.format('YYYY-MM-DD') : null,
                contractStartDate: values.contractStartDate ? values.contractStartDate.format('YYYY-MM-DD') : null,
                contractEndDate: values.contractEndDate ? values.contractEndDate.format('YYYY-MM-DD') : null,
                contractUrl,
            };
            if (deal) {
                await dealService.update(deal.id, payload);
                message.success(t('messages.success_update'));
            } else {
                await dealService.create(payload);
                message.success(t('messages.success_save'));
            }
            onSuccess();
        } catch (error) {
            console.error('Deal submission error:', error);
            message.error(t('messages.error_save'));
        }
    };

    return (
        <Modal
            title={deal ? t('admin.deals.edit_deal') : t('admin.deals.add_deal')}
            open={visible}
            onOk={handleSubmit}
            onCancel={onCancel}
            width={600}
            okText={t('common.save')}
            cancelText={t('common.cancel')}
        >
            <Form
                form={form}
                layout="vertical"
                onValuesChange={handleValuesChange}
                initialValues={{
                    currency: 'USD',
                    type: 'PERMANENT'
                }}
            >
                <Form.Item
                    noStyle
                    shouldUpdate={(prevValues, currentValues) =>
                        prevValues.playerId !== currentValues.playerId ||
                        prevValues.manualPlayerNameAr !== currentValues.manualPlayerNameAr
                    }
                >
                    {({ getFieldValue, validateFields }) => {
                        const hasPlayerId = !!getFieldValue('playerId');
                        const hasManualNameAr = !!getFieldValue('manualPlayerNameAr');

                        return (
                            <>
                                <Form.Item
                                    name="playerId"
                                    label={t('admin.deals.player_from_database')}
                                    rules={[{
                                        required: !hasManualNameAr,
                                        message: t('admin.deals.select_player_or_name')
                                    }]}
                                >
                                    <Select
                                        showSearch
                                        placeholder={t('admin.deals.select_player')}
                                        allowClear
                                        onChange={() => validateFields(['manualPlayerNameAr'])}
                                        optionFilterProp="label"
                                        filterOption={(input, option) => {
                                            const normalizedInput = normalizeArabic(input).toLowerCase();
                                            const normalizedLabel = normalizeArabic(String(option?.label ?? '')).toLowerCase();
                                            return normalizedLabel.startsWith(normalizedInput);
                                        }}
                                        options={players.map(p => ({
                                            value: p.id,
                                            label: i18n.language === 'ar' && p.nameAr ? p.nameAr : p.name
                                        }))}
                                    />
                                </Form.Item>

                                {!hasPlayerId && (
                                    <div className="bg-slate-50 p-4 rounded-lg mb-6 border border-dashed border-slate-200">
                                        <Typography.Text type="secondary" className="block mb-4 text-xs uppercase tracking-wider font-bold">
                                            {t('admin.deals.or_enter_manual_name')}
                                        </Typography.Text>
                                        <Row gutter={16}>
                                            <Col xs={24} sm={12}>
                                                <Form.Item
                                                    name="manualPlayerNameAr"
                                                    label={t('admin.deals.manual_player_name_ar')}
                                                    rules={[{
                                                        required: !hasPlayerId,
                                                        message: t('admin.deals.enter_player_name_ar')
                                                    }]}
                                                >
                                                    <Input
                                                        placeholder="مثلاً: ليونيل ميسي"
                                                        onChange={() => validateFields(['playerId'])}
                                                    />
                                                </Form.Item>
                                            </Col>
                                            <Col xs={24} sm={12}>
                                                <Form.Item
                                                    name="manualPlayerName"
                                                    label={t('admin.deals.manual_player_name')}
                                                >
                                                    <Input placeholder="e.g. Lionel Messi" />
                                                </Form.Item>
                                            </Col>
                                        </Row>
                                        <Row gutter={16}>
                                            <Col xs={24} sm={12}>
                                                <Form.Item
                                                    name="manualPlayerRole"
                                                    label={t('admin.deals.manual_player_role')}
                                                >
                                                    <Select
                                                        showSearch
                                                        placeholder={t('admin.deals.select_role')}
                                                        options={[
                                                            { value: 'PLAYER', label: t('enums.ProfileRole.PLAYER') },
                                                            { value: 'COACH', label: t('enums.ProfileRole.COACH') }
                                                        ]}
                                                        optionFilterProp="label"
                                                    />
                                                </Form.Item>
                                            </Col>
                                            <Col xs={24} sm={12}>
                                                <Form.Item
                                                    name="manualPlayerSport"
                                                    label={t('admin.deals.manual_player_sport')}
                                                >
                                                    <Select
                                                        showSearch
                                                        placeholder={t('admin.deals.select_sport')}
                                                        options={Object.values(Sport).map(s => ({
                                                            value: s,
                                                            label: t(`enums.Sport.${s}`, { defaultValue: s })
                                                        }))}
                                                        optionFilterProp="label"
                                                    />
                                                </Form.Item>
                                            </Col>
                                        </Row>
                                    </div>
                                )}
                            </>
                        );
                    }}
                </Form.Item>

                <div className="mt-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <Row gutter={16} className="mb-4">
                        <Col xs={24} sm={12}>
                            <Form.Item
                                name="fromClubAr"
                                label={t('admin.deals.from_club_ar')}
                            >
                                <Input placeholder="مثلاً: نادي الكويت" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                            <Form.Item
                                name="fromClub"
                                label={t('admin.deals.from_club')}
                            >
                                <Input placeholder={t('admin.deals.from_club_placeholder')} />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col xs={24} sm={12}>
                            <Form.Item
                                name="toClubAr"
                                label={t('admin.deals.to_club_ar')}
                            >
                                <Input placeholder="مثلاً: نادي القادسية" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                            <Form.Item
                                name="toClub"
                                label={t('admin.deals.to_club')}
                            >
                                <Input placeholder={t('admin.deals.to_club_placeholder')} />
                            </Form.Item>
                        </Col>
                    </Row>
                </div>

                <Row gutter={16}>
                    <Col xs={24} sm={12}>
                        <Form.Item
                            name="dealDate"
                            label={t('admin.deals.deal_date')}
                        >
                            <DatePicker picker="year" style={{ width: '100%' }} />
                        </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                        <Form.Item
                            name="amount"
                            label={t('admin.deals.amount')}
                        >
                            <InputNumber style={{ width: '100%' }} min={0} step={1000} />
                        </Form.Item>
                    </Col>
                </Row>

                <Form.Item
                    name="currency"
                    label={t('admin.deals.currency')}
                >
                    <Select
                        showSearch
                        options={[
                            { value: 'USD', label: 'USD ($)' },
                            { value: 'EUR', label: 'EUR (€)' },
                            { value: 'KWD', label: 'KWD (د.ك)' },
                            { value: 'SAR', label: 'SAR (ر.س)' }
                        ]}
                        optionFilterProp="label"
                    />
                </Form.Item>

                <Form.Item
                    name="type"
                    label={t('admin.deals.type')}
                >
                    <Select
                        showSearch
                        options={[
                            { value: 'PERMANENT', label: t('admin.deals.permanent') },
                            { value: 'LOAN', label: t('admin.deals.loan') },
                            { value: 'FREE', label: t('admin.deals.free') },
                            { value: 'RENEWAL', label: t('admin.deals.renewal') }
                        ]}
                        optionFilterProp="label"
                    />
                </Form.Item>

                <div className="bg-slate-50 p-4 rounded-lg mb-6 border border-dashed border-blue-200">
                    <Typography.Text type="secondary" className="block mb-4 text-xs uppercase tracking-wider font-bold text-blue-600">
                        {t('admin.deals.contract_details_private') || 'تفاصيل العقد (سرية للإدارة فقط)'}
                    </Typography.Text>
                    <Row gutter={16}>
                        <Col xs={24} sm={12}>
                            <Form.Item
                                name="contractStartDate"
                                label={t('admin.deals.contract_start_date') || 'تاريخ بداية العقد'}
                            >
                                <DatePicker style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                            <Form.Item
                                name="contractEndDate"
                                label={t('admin.deals.contract_end_date') || 'تاريخ نهاية العقد'}
                            >
                                <DatePicker style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Form.Item label={t('admin.deals.contract_file') || 'ملف العقد'}>
                        <Upload
                            listType="picture"
                            fileList={contractFileList}
                            onChange={({ fileList: newFileList }) => setContractFileList(newFileList.slice(-1))}
                            beforeUpload={() => false}
                            maxCount={1}
                        >
                            {contractFileList.length >= 1 ? null : (
                                <div>
                                    <PlusOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />
                                    <div style={{ marginTop: 8 }}>{t('admin.deals.upload_contract') || 'رفع العقد'}</div>
                                </div>
                            )}
                        </Upload>
                    </Form.Item>
                </div>

                <Form.Item
                    name="notes"
                    label={t('admin.deals.notes')}
                >
                    <Input.TextArea rows={3} />
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default DealModal;
