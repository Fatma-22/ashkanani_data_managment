import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

export const LoadingScreen: React.FC = () => {
    const { t } = useTranslation();

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            background: '#0a0a0a',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999
        }}>
            {/* Background image */}
            <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
                <img
                    src="/hero-bg.png"
                    alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.2, filter: 'blur(4px) brightness(0.4)' }}
                />
            </div>

            {/* Content */}
            <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 32 }}>
                {/* Logo */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                >
                    <img src="/logo.png" alt="Ashkanani Sport" style={{ height: 72, objectFit: 'contain' }} />
                </motion.div>

                {/* Gold spinner */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    style={{ position: 'relative', width: 48, height: 48 }}
                >
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                        style={{
                            width: 48,
                            height: 48,
                            borderRadius: '50%',
                            border: '3px solid rgba(201,162,77,0.15)',
                            borderTopColor: '#C9A24D',
                            position: 'absolute',
                            inset: 0
                        }}
                    />
                    <motion.div
                        animate={{ rotate: -360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                        style={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            border: '2px solid rgba(201,162,77,0.08)',
                            borderBottomColor: 'rgba(201,162,77,0.5)',
                            position: 'absolute',
                            top: 8,
                            left: 8
                        }}
                    />
                </motion.div>

                {/* Brand name */}
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                    style={{ textAlign: 'center' }}
                >
                    <div style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 900, fontSize: 16, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                        {t('login.title').split(' Transfer')[0]} <span style={{ color: '#C9A24D' }}>{t('login.title').includes('Transfer') ? 'Transfer' : ''}</span>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default LoadingScreen;
