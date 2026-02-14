import React, { useState } from 'react';
import { Card, Form, Input, Button, Upload, Avatar, message, Row, Col, Typography, Divider } from 'antd';
import { UserOutlined, UploadOutlined, LockOutlined, SaveOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { UserRole } from '../types';

const { Title, Text } = Typography;

export const Settings: React.FC = () => {
    const { t } = useTranslation();
    const { user, updateUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [form] = Form.useForm();

    const onFinish = async (values: any) => {
        setLoading(true);
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 800));

            updateUser({
                name: values.name,
                email: values.email,
                avatar: values.avatarUrl // In a real app, this would be the uploaded image URL
            });

            message.success(t('settings_page.update_success'));
        } catch (error) {
            message.error(t('settings_page.update_failed'));
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
                <Col xs={24} md={8}>
                    <Card className="text-center shadow-sm rounded-xl mb-6">
                        <Avatar
                            size={120}
                            src={user?.avatar}
                            icon={<UserOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
                            className="mb-4 border-4 border-gold-500/20"
                        />
                        <Title level={4} className="!mb-1">{user?.name}</Title>
                        <Text type="secondary">
                            {user?.role === UserRole.OWNER ? t('roles.owner') :
                                user?.role === UserRole.ADMIN ? t('roles.admin') :
                                    t('roles.agent')}
                        </Text>
                        <Divider />
                        <Upload showUploadList={false}>
                            <Button icon={<UploadOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}>{t('settings_page.change_photo')}</Button>
                        </Upload>
                    </Card>
                </Col>

                <Col xs={24} md={16}>
                    <Card title={t('settings_page.personal_info')} className="shadow-sm rounded-xl mb-6">
                        <Form
                            form={form}
                            layout="vertical"
                            initialValues={{
                                name: user?.name,
                                email: user?.email,
                                avatarUrl: user?.avatar
                            }}
                            onFinish={onFinish}
                        >
                            <Row gutter={16}>
                                <Col span={24} sm={12}>
                                    <Form.Item
                                        name="name"
                                        label={t('common.name')}
                                        rules={[{ required: true, message: t('login.name_required', { defaultValue: 'Please enter your name' }) }]}
                                    >
                                        <Input prefix={<UserOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />} placeholder={t('settings_page.full_name_placeholder')} />
                                    </Form.Item>
                                </Col>
                                <Col span={24} sm={12}>
                                    <Form.Item
                                        name="email"
                                        label={t('common.email')}
                                        rules={[
                                            { required: true, message: t('login.email_required', { defaultValue: 'Email is required' }) },
                                            { type: 'email', message: t('login.email_invalid', { defaultValue: 'Invalid email' }) }
                                        ]}
                                    >
                                        <Input
                                            disabled={user?.role !== UserRole.OWNER}
                                            placeholder={user?.role === UserRole.OWNER ? t('settings_page.email_placeholder') : t('settings_page.email_disabled')}
                                        />
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Form.Item
                                name="avatarUrl"
                                label={t('settings_page.avatar_url')}
                            >
                                <Input placeholder="https://example.com/avatar.jpg" />
                            </Form.Item>

                            <Form.Item className="mb-0">
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    loading={loading}
                                    icon={<SaveOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
                                    style={{ background: '#3F3F3F' }}
                                >
                                    {t('common.save_btn')}
                                </Button>
                            </Form.Item>
                        </Form>
                    </Card>

                    <Card title={t('settings_page.security')} className="shadow-sm rounded-xl">
                        <Form layout="vertical">
                            <Form.Item
                                name="currentPassword"
                                label={t('settings_page.current_password')}
                            >
                                <Input.Password prefix={<LockOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />} />
                            </Form.Item>
                            <Row gutter={16}>
                                <Col span={24} sm={12}>
                                    <Form.Item
                                        name="newPassword"
                                        label={t('settings_page.new_password')}
                                    >
                                        <Input.Password prefix={<LockOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />} />
                                    </Form.Item>
                                </Col>
                                <Col span={24} sm={12}>
                                    <Form.Item
                                        name="confirmPassword"
                                        label={t('settings_page.confirm_password')}
                                    >
                                        <Input.Password prefix={<LockOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />} />
                                    </Form.Item>
                                </Col>
                            </Row>
                            <Button
                                type="default"
                                style={{ borderColor: '#3F3F3F', color: '#3F3F3F' }}
                            >
                                {t('settings_page.update_password')}
                            </Button>
                        </Form>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};
