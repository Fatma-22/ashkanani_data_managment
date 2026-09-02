import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface SEOProps {
    title?: string;
    description?: string;
    keywords?: string;
    image?: string;
    url?: string;
    schema?: any;
    type?: string;
}

const SEO: React.FC<SEOProps> = ({ 
    title, 
    description, 
    keywords, 
    image, 
    url, 
    schema,
    type = 'website'
}) => {
    const { t, i18n } = useTranslation();
    const isAr = i18n.language === 'ar';

    useEffect(() => {
        // Base Title
        const baseTitle = isAr ? 'أشكناني سبورت' : 'Ashkanani Sport';
        const fullTitle = title ? `${title} | ${baseTitle}` : baseTitle;
        document.title = fullTitle;

        // Update HTML lang
        document.documentElement.lang = i18n.language;
        document.documentElement.dir = isAr ? 'rtl' : 'ltr';

        // Meta Tags Helper
        const updateMetaTag = (attrName: string, attrValue: string, content: string) => {
            let element = document.querySelector(`meta[${attrName}="${attrValue}"]`);
            if (!element) {
                element = document.createElement('meta');
                element.setAttribute(attrName, attrValue);
                document.head.appendChild(element);
            }
            element.setAttribute('content', content);
        };

        // Standard Meta
        const finalDesc = description || t('landing.hero_subtitle') || 'Ashkanani Sport - Professional Sports Agency';
        updateMetaTag('name', 'description', finalDesc);
        if (keywords) updateMetaTag('name', 'keywords', keywords);

        // Open Graph
        updateMetaTag('property', 'og:title', fullTitle);
        updateMetaTag('property', 'og:description', finalDesc);
        updateMetaTag('property', 'og:type', type);
        updateMetaTag('property', 'og:url', url || window.location.href);
        if (image) updateMetaTag('property', 'og:image', image);

        // Twitter
        updateMetaTag('name', 'twitter:title', fullTitle);
        updateMetaTag('name', 'twitter:description', finalDesc);
        if (image) updateMetaTag('name', 'twitter:image', image);

        // JSON-LD Schema
        let schemaNode = document.getElementById('json-ld-schema') as HTMLScriptElement | null;
        if (schema) {
            if (!schemaNode) {
                schemaNode = document.createElement('script');
                schemaNode.id = 'json-ld-schema';
                schemaNode.type = 'application/ld+json';
                document.head.appendChild(schemaNode);
            }
            schemaNode.innerHTML = JSON.stringify(schema);
        }

        return () => {
            // Optional: reset to defaults on unmount if needed
            // But usually next page's SEO component will override
        };
    }, [title, description, keywords, image, url, schema, type, isAr, t]);

    return null; // This component doesn't render anything
};

export default SEO;
