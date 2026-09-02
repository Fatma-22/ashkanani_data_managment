import React, { useState } from 'react';
import { Card, Button, Typography, Space, Divider, Form, Input, Select, Alert, Modal } from 'antd';
import { useAuth } from '../context/AuthContext';
import { UserRole, MemberType } from '../types';
import { useNavigate, Link } from 'react-router-dom';
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  GlobalOutlined,
  LockOutlined,
  SolutionOutlined,
  CheckCircleFilled,
  InfoOutlined
} from '@ant-design/icons';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { useTranslation } from 'react-i18next';
import { WORLD_COUNTRIES } from '../utils/countries';
import { standardizePhoneNumber } from '../utils/helpers';
function getFlagEmoji(countryCode: string) {
  if (!countryCode) return '';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

const { Title, Text } = Typography;
const { Option } = Select;

export const Register: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const watchedPhone = Form.useWatch('phone', form);
  const watchedCountry = Form.useWatch('country', form);
  const standardizedPreview = standardizePhoneNumber(watchedPhone, watchedCountry);

  const [dialCodeManuallyChanged, setDialCodeManuallyChanged] = useState(false);

  const handleCountryChange = (countryName: string) => {
    const country = WORLD_COUNTRIES.find(c => c.value === countryName);
    // Only auto-update if the user hasn't manually selected a different dial code yet
    // or if the current dial code is the default +965 and they just selected a country
    if (country && !dialCodeManuallyChanged) {
      form.setFieldsValue({ dialCode: country.dialCode });
    }
  };

  const onFinish = async (values: any) => {
    setLoading(true);
    setError(null);

    try {
      // Combine dial code and phone with SMART CLEANUP
      // If user pasted the dial code again into the phone field, we strip it
      const cleanDial = (values.dialCode || '').replace(/\D/g, '');
      const cleanPhone = (values.phone || '').replace(/\D/g, '');

      let finalLocal = cleanPhone;
      if (cleanDial && cleanPhone.startsWith(cleanDial)) {
        finalLocal = cleanPhone.substring(cleanDial.length);
      }

      const fullPhone = `+${cleanDial}${finalLocal}`;

      // Prepare data
      const userData = {
        ...values,
        phone: standardizePhoneNumber(fullPhone, values.country),
        member_type: values.memberType,
        password_confirmation: values.confirmPassword,
        role: UserRole.MEMBER
      };

      delete userData.dialCode;
      delete userData.memberType;
      delete userData.confirmPassword;

      const registeredUser = await register(userData);

      if (registeredUser) {
        Modal.success({
          title: t('register.success_title'),
          content: t('register.success_msg'),
          onOk: () => navigate('/players')
        });
        navigate('/players');
      }
    } catch (err: any) {
      if (err.response?.status === 422 && err.response?.data?.errors?.phone) {
        setError(i18n.language === 'ar' ? 'عذراً، رقم الهاتف هذا مسجل مسبقاً لعضو آخر.' : 'Sorry, this phone number is already registered to another member.');
      } else {
        setError(err.response?.data?.message || err.message || t('register.failed'));
      }
    } finally {
      setLoading(false);
    }
  };

  const prefixSelector = (
    <Form.Item name="dialCode" noStyle>
      <Select
        showSearch
        style={{ width: 120 }}
        className="dial-code-selector"
        dropdownStyle={{ minWidth: 200 }}
        optionLabelProp="label"
        onChange={() => setDialCodeManuallyChanged(true)}
        filterOption={(input, option) => {
          const norm = (s: string) => (s || '').toLowerCase().replace(/[أإآٱ]/g, 'ا').replace(/ة/g, 'ه').replace(/[ىی]/g, 'ي');
          const label = String((option as any)?.searchText || '');
          return norm(label).includes(norm(input));
        }}
      >
        {WORLD_COUNTRIES.map(c => (
          <Option
            key={c.value}
            value={c.dialCode}
            label={`${getFlagEmoji(c.value.substring(0, 2))} ${c.dialCode}`}
            searchText={`${c.labelEn} ${c.labelAr} ${c.dialCode}`}
          >
            <div className="flex items-center gap-2">
              <span>{getFlagEmoji(c.value.substring(0, 2))}</span>
              <span className="flex-1">{i18n.language === 'ar' ? c.labelAr : c.labelEn}</span>
              <span className="text-gray-400 text-xs">{c.dialCode}</span>
            </div>
          </Option>
        ))}
      </Select>
    </Form.Item>
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-4 py-12 relative overflow-hidden" style={{ background: '#3F3F3F' }}>
      {/* Language Switcher Header */}
      <div className="absolute top-0 right-0 p-4 md:p-6 z-50">
        <LanguageSwitcher />
      </div>

      {/* Background decorative elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full opacity-10 bg-gold-500 blur-[100px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full opacity-10 bg-blue-400 blur-[100px]"></div>

      <Card
        className="w-full max-w-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] rounded-2xl border-0 overflow-hidden relative z-10"
        styles={{ body: { padding: '40px 32px' } }}
      >
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img src="/logo.png" alt="Ashkanani Sport" className="h-16 object-contain" />
          </div>
          <Title level={2} className="!m-0 !text-3xl !font-black tracking-tight" style={{ color: '#3F3F3F' }}>
            {t('register.title')}
          </Title>
          <Text type="secondary" className="mt-2 block font-medium opacity-60 max-w-md mx-auto">
            {t('register.subtitle')}
          </Text>
        </div>

        {error && (
          <Alert
            message={error}
            type="error"
            showIcon
            className="mb-6 rounded-lg"
          />
        )}

        <Form
          form={form}
          name="register_form"
          layout="vertical"
          onFinish={onFinish}
          autoComplete="off"
          size="large"
          className="grid grid-cols-1 md:grid-cols-2 gap-x-6"
          initialValues={{ dialCode: '+965' }}
        >
          {/* Full Name */}
          <Form.Item
            label={t('register.name_label')}
            name="name"
            className="md:col-span-2"
            rules={[{ required: true, message: t('common.required_field') }]}
          >
            <Input
              prefix={<UserOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} className="text-gray-300" />}
              placeholder={t('register.name_placeholder')}
              className="rounded-lg"
            />
          </Form.Item>

          {/* Email */}
          <Form.Item
            label={t('register.email_label')}
            name="email"
            rules={[
              { required: true, message: t('common.required_field') },
              { type: 'email', message: t('login.email_invalid') }
            ]}
          >
            <Input
              prefix={<MailOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} className="text-gray-300" />}
              placeholder={t('register.email_placeholder')}
              className="rounded-lg"
            />
          </Form.Item>

          {/* Country */}
          <Form.Item
            label={t('register.country_label')}
            name="country"
            rules={[{ required: true, message: t('common.required_field') }]}
          >
            <Select
              showSearch
              placeholder={t('register.country_placeholder')}
              className="rounded-lg h-[45px] flex items-center"
              onChange={handleCountryChange}
              optionFilterProp="label"
              filterOption={(input, option) => {
                const norm = (s: string) => (s || '').toLowerCase().replace(/[أإآٱ]/g, 'ا').replace(/ة/g, 'ه').replace(/[ىی]/g, 'ي');
                const searchLabel = String((option as any)?.searchLabel || '');
                return norm(searchLabel).includes(norm(input));
              }}
              options={WORLD_COUNTRIES.filter(c => c.value !== 'Israel').map(c => ({
                value: c.value,
                label: i18n.language === 'ar' ? c.labelAr : c.labelEn,
                searchLabel: `${c.labelEn} ${c.labelAr} ${c.value}`
              }))}
              suffixIcon={<GlobalOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} className="text-gray-300" />}
            />
          </Form.Item>

          {/* Phone */}
          <Form.Item
            label={t('register.phone_label')}
            name="phone"
            rules={[{ required: true, message: t('common.required_field') }]}
            extra={
              <div className="mt-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-gold-500 dark:border-gold-400 rounded flex items-start gap-2">
                <InfoOutlined className="text-red-600 dark:text-red-400 flex-shrink-0 mt-1" style={{ color: '#dc2626' }} onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />
                <span className="text-xs leading-relaxed font-medium" style={{ color: '#dc2626' }}>
                  {t('register.phone_help')}
                </span>
              </div>
            }
          >
            <Input
              addonBefore={prefixSelector}
              placeholder={t('register.phone_placeholder')}
              className="rounded-lg phone-input-with-prefix"
            />
          </Form.Item>

          {/* Member Type */}
          <Form.Item
            label={t('register.member_type_label')}
            name="memberType"
            rules={[{ required: true, message: t('common.required_field') }]}
          >
            <Select
              showSearch
              placeholder={t('register.member_type_placeholder')}
              suffixIcon={<SolutionOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} className="text-gray-300" />}
              className="rounded-lg border-gray-300"
              optionFilterProp="label"
              filterOption={(input, option) => {
                const norm = (s: string) => (s || '').toLowerCase().replace(/[أإآٱ]/g, 'ا').replace(/ة/g, 'ه').replace(/[ىی]/g, 'ي');
                const label = String((option as any)?.children || '');
                return norm(label).includes(norm(input));
              }}
            >
              <Option value={MemberType.PLAYER}>{t('member_types.PLAYER')}</Option>
              <Option value={MemberType.COACH}>{t('member_types.COACH')}</Option>
              <Option value={MemberType.SCOUT}>{t('member_types.SCOUT')}</Option>
              <Option value={MemberType.CLUB}>{t('member_types.CLUB')}</Option>
              <Option value={MemberType.DESIGNER}>{t('member_types.DESIGNER')}</Option>
              <Option value={MemberType.PHOTOGRAPHER}>{t('member_types.PHOTOGRAPHER')}</Option>
              <Option value={MemberType.REFEREE}>{t('member_types.REFEREE')}</Option>
              <Option value={MemberType.ADMINISTRATOR}>{t('member_types.ADMINISTRATOR')}</Option>
              <Option value={MemberType.OTHER}>{t('member_types.OTHER')}</Option>
            </Select>
          </Form.Item>

          {/* Organization */}
          <Form.Item
            label={t('register.organization_label')}
            name="organization"
            className="md:col-span-2"
            rules={[{ required: true, message: t('common.required_field') }]}
          >
            <Input
              prefix={<SolutionOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} className="text-gray-300" />}
              placeholder={t('register.organization_placeholder')}
              className="rounded-lg"
            />
          </Form.Item>

          {/* Password */}
          <Form.Item
            label={t('register.password_label')}
            name="password"
            rules={[
              { required: true, message: t('common.required_field') },
              { min: 8, message: t('register.password_min') }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} className="text-gray-300" />}
              placeholder={t('register.password_placeholder')}
              className="rounded-lg"
            />
          </Form.Item>

          {/* Confirm Password */}
          <Form.Item
            label={t('register.confirm_password_label')}
            name="confirmPassword"
            dependencies={['password']}
            rules={[
              { required: true, message: t('common.required_field') },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error(t('register.password_mismatch')));
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} className="text-gray-300" />}
              placeholder={t('register.confirm_password_placeholder')}
              className="rounded-lg"
            />
          </Form.Item>

          <Form.Item className="md:col-span-2 mt-4 mb-2">
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={loading}
              className="h-12 text-lg font-bold rounded-lg shadow-lg hover:shadow-gold-500/20"
              style={{ background: '#C9A24D', borderColor: '#C9A24D' }}
            >
              {t('register.submit')}
            </Button>
          </Form.Item>

          <div className="md:col-span-2 text-center mt-4">
            <Link to="/login" className="text-gray-400 hover:text-gold-500 font-medium transition-colors">
              {t('register.already_have_account')}
            </Link>
          </div>
        </Form>
      </Card>

      <div className="absolute bottom-8 text-white/30 text-xs font-medium uppercase tracking-widest text-center w-full">
        {t('common.footer_copyright')}
      </div>
    </div>
  );
};
