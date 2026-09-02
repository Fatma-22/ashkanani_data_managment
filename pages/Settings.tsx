import React, { useState } from 'react';
import { Card, Form, Input, Button, Upload, Avatar, message, Row, Col, Typography, Divider, Grid, Select } from 'antd';
import { UserOutlined, UploadOutlined, LockOutlined, SaveOutlined, GlobalOutlined, PhoneOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { UserRole } from '../types';
import apiClient from '../services/api';
import { WORLD_COUNTRIES } from '../utils/countries';

const { Title, Text } = Typography;

export const Settings: React.FC = () => {
    const { t, i18n } = useTranslation();
    const { user, updateUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [form] = Form.useForm();
    const screens = Grid.useBreakpoint();

    const handleCountryChange = (countryValue: string) => {
        const country = WORLD_COUNTRIES.find(c => c.value === countryValue);
        if (country) {
            form.setFieldsValue({ phone: country.dialCode });
        }
    };

    const getCountryLabel = (countryValue: string | undefined, isAr: boolean): string => {
        if (!countryValue) return '';
        const country = WORLD_COUNTRIES.find(c => c.value === countryValue);
        if (country) {
            return isAr ? country.labelAr : country.labelEn;
        }
        return countryValue;
    };

    React.useEffect(() => {
        if (user) {
            form.setFieldsValue({
                name: user.name,
                email: user.email,
                phone: user.phone,
                country: user.country
            });
        }
    }, [user, form]);

    const onFinish = async (values: any) => {
        setLoading(true);
        try {
            let response: any;

            if (file) {
                // If file is selected, use FormData and POST with _method=PUT
                const formData = new FormData();
                formData.append('_method', 'PUT');
                formData.append('name', values.name);
                formData.append('email', values.email);
                if (values.currentPassword) formData.append('current_password', values.currentPassword);
                if (values.newPassword) formData.append('new_password', values.newPassword);
                if (values.confirmPassword) formData.append('new_password_confirmation', values.confirmPassword);
                if (values.phone) formData.append('phone', values.phone);
                if (values.country) formData.append('country', values.country);

                // Append file
                formData.append('avatar', file);

                response = await apiClient.post('/me', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            } else {
                // Standard JSON update
                const payload = {
                    name: values.name,
                    email: values.email,
                    current_password: values.currentPassword,
                    new_password: values.newPassword,
                    new_password_confirmation: values.confirmPassword,
                    phone: values.phone,
                    country: values.country,
                };
                response = await apiClient.put('/me', payload);
            }

            if (response.success) {
                updateUser(response.data);
                message.success(t('messages.success_update'));
                setFile(null); // Reset file
                form.resetFields(['currentPassword', 'newPassword', 'confirmPassword']);
            } else {
                message.error(response.message || t('messages.error_update'));
            }
        } catch (error: any) {
            console.error('Update profile error:', error);
            const errorMsg = error.response?.data?.message || t('messages.error_update');
            message.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fade-in max-w-4xl mx-auto">
            <div className="mb-6">
                <Title level={2}>{t('settings_page.title')}</Title>
                <Text type="secondary">{t('settings_page.subtitle')}</Text>
            </div>

            <Row gutter={24}>
                <Col xs={24} xl={8}>
                    <Card className="text-center shadow-sm rounded-xl mb-6">
                        <Avatar
                            size={screens.xs ? 100 : 120}
                            src={user?.avatar}
                            icon={<UserOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
                            className="mb-4 border-4 border-gold-500/20"
                        />
                        <Title level={4} className="!mb-1">{user?.name}</Title>
                        <Text type="secondary" className="block mb-4">
                            {user?.role === UserRole.OWNER ? t('roles.owner') :
                                user?.role === UserRole.ADMIN ? t('roles.admin') :
                                    t('roles.agent')}
                        </Text>
                        <Divider />
                        <Upload
                            showUploadList={false}
                            className="w-full"
                            beforeUpload={(file) => {
                                setFile(file);
                                return false; // Prevent default upload
                            }}
                        >
                            <Button className="w-full h-11 rounded-lg" icon={<UploadOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}>{t('settings_page.change_photo')}</Button>
                        </Upload>
                        {file && <Text type="success" className="block mt-2 text-xs">{t('common.file_selected', { defaultValue: 'File selected' })}: {file.name}</Text>}
                    </Card>
                </Col>

                <Col xs={24} md={16}>
                    <Form
                        form={form}
                        layout="vertical"
                        initialValues={{
                            name: user?.name,
                            email: user?.email,
                            phone: user?.phone,
                            country: user?.country
                        }}
                        onFinish={onFinish}
                    >
                        <Card title={t('settings_page.personal_info')} className="shadow-sm rounded-xl mb-6">
                            <Row gutter={[16, 0]}>
                                <Col xs={24} sm={12}>
                                    <Form.Item
                                        name="name"
                                        label={t('common.name')}
                                        rules={[{ required: true, message: t('login.name_required', { defaultValue: 'Please enter your name' }) }]}
                                    >
                                        <Input className="h-11 rounded-lg" prefix={<UserOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />} placeholder={t('settings_page.full_name_placeholder')} />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} sm={12}>
                                    <Form.Item
                                        name="email"
                                        label={t('common.email')}
                                        rules={[
                                            { required: true, message: t('login.email_required', { defaultValue: 'Email is required' }) },
                                            { type: 'email', message: t('login.email_invalid', { defaultValue: 'Invalid email' }) }
                                        ]}
                                    >
                                        <Input
                                            className="h-11 rounded-lg"
                                            disabled={user?.role !== UserRole.OWNER}
                                            placeholder={user?.role === UserRole.OWNER ? t('settings_page.email_placeholder') : t('settings_page.email_disabled')}
                                        />
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Row gutter={[16, 0]}>
                                <Col xs={24} sm={12}>
                                    <Form.Item
                                        name="country"
                                        label={t('common.country', { defaultValue: 'Country' })}
                                    >
                                        <Select
                                            showSearch
                                            placeholder={t('settings_page.country_placeholder', { defaultValue: 'Select your country' })}
                                            className="rounded-lg h-11"
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
                                            className="h-11 rounded-lg"
                                            prefix={<PhoneOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
                                            placeholder="965XXXXXXXX"
                                        />
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Form.Item className="mb-0 mt-4">
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    loading={loading}
                                    icon={<SaveOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
                                    className="bg-[#3F3F3F] h-11 px-8 rounded-lg font-bold w-full sm:w-auto"
                                >
                                    {t('common.save_btn')}
                                </Button>
                            </Form.Item>
                        </Card>

                        <Card title={t('settings_page.security')} className="shadow-sm rounded-xl">
                            <Form.Item
                                name="currentPassword"
                                label={t('settings_page.current_password')}
                            >
                                <Input.Password className="h-11 rounded-lg" prefix={<LockOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />} />
                            </Form.Item>
                            <Row gutter={[16, 0]}>
                                <Col xs={24} sm={12}>
                                    <Form.Item
                                        name="newPassword"
                                        label={t('settings_page.new_password')}
                                    >
                                        <Input.Password className="h-11 rounded-lg" prefix={<LockOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />} />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} sm={12}>
                                    <Form.Item
                                        name="confirmPassword"
                                        label={t('settings_page.confirm_password')}
                                    >
                                        <Input.Password className="h-11 rounded-lg" prefix={<LockOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />} />
                                    </Form.Item>
                                </Col>
                            </Row>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={loading}
                                icon={<SaveOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
                                className="bg-[#3F3F3F] h-11 px-8 rounded-lg font-bold w-full sm:w-auto"
                            >
                                {t('settings_page.update_password')}
                            </Button>
                        </Card>
                    </Form>
                </Col>
            </Row>
        </div >
    );
};
