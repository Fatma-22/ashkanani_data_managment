import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { translateText } from '../utils/helpers';
import { Skeleton } from 'antd';

interface DynamicTranslateProps {
    text?: string;
    sourceLang?: string;
    targetLang?: string;
    className?: string;
    style?: React.CSSProperties;
    fallback?: string;
}

export const DynamicTranslate: React.FC<DynamicTranslateProps> = ({ 
    text, 
    sourceLang = 'ar', 
    targetLang, 
    className, 
    style,
    fallback
}) => {
    const { i18n } = useTranslation();
    const [translatedText, setTranslatedText] = useState<string>(text || '');
    const [loading, setLoading] = useState<boolean>(false);

    const actualTargetLang = targetLang || i18n.language;

    useEffect(() => {
        if (!text || text.trim() === '') {
            setTranslatedText('');
            return;
        }

        // If source and target are the same, don't translate
        if (sourceLang === actualTargetLang) {
            setTranslatedText(text);
            return;
        }

        const handleTranslate = async () => {
            setLoading(true);
            try {
                const result = await translateText(text, sourceLang, actualTargetLang);
                setTranslatedText(result);
            } catch (error) {
                console.error('Dynamic translation failed:', error);
                setTranslatedText(text);
            } finally {
                setLoading(false);
            }
        };

        handleTranslate();
    }, [text, actualTargetLang, sourceLang]);

    if (loading) {
        return <Skeleton.Input active size="small" style={{ width: '100%', height: 20 }} />;
    }

    return (
        <span className={className} style={style}>
            {translatedText || fallback}
        </span>
    );
};

export default DynamicTranslate;
