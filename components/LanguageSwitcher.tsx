import React from 'react';
import { Button, Dropdown, MenuProps, Space } from 'antd';
import { GlobalOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

export const LanguageSwitcher: React.FC = () => {
    const { i18n } = useTranslation();

    const changeLanguage = (lng: string) => {
        i18n.changeLanguage(lng);
        const dir = lng === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.dir = dir;
        document.documentElement.lang = lng;
    };

    const items: MenuProps['items'] = [
        {
            key: 'en',
            label: 'English',
            onClick: () => changeLanguage('en'),
            disabled: i18n.language === 'en',
        },
        {
            key: 'ar',
            label: 'العربية',
            onClick: () => changeLanguage('ar'),
            disabled: i18n.language === 'ar',
        },
    ];

    return (
        <Dropdown menu={{ items }} placement="bottomRight" arrow>
            <Button
                type="text"
                className="flex items-center justify-center !h-10 !w-10 !p-0 hover:opacity-80 transition-all duration-200"
                style={{
                    color: '#C9A24D',
                    fontSize: '20px',
                    border: '1px solid rgba(201, 162, 77, 0.5)',
                    borderRadius: '6px',
                }}
                icon={<GlobalOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} style={{ fontSize: '18px' }} />}
                title="Change Language / تغيير اللغة"
            />
        </Dropdown>
    );
};
