import React from 'react';
import { Sponsor } from '../types';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

interface SponsorMarqueeProps {
    sponsors: Sponsor[];
    isRtl: boolean;
}

export const SponsorMarquee: React.FC<SponsorMarqueeProps> = ({ sponsors, isRtl }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    if (!sponsors || sponsors.length === 0) return null;

    // Triple the items for seamless loop
    const items = [...sponsors, ...sponsors, ...sponsors];

    return (
        <div className="w-full mt-16 mb-8">
            <div className="text-center mb-10">
                <h3 
                    className="text-white font-black tracking-tight text-xl md:text-3xl"
                    style={{ fontFamily: "'Cairo', sans-serif" }}
                >
                    {t('landing.our_sponsors')}
                </h3>
            </div>

            <div className="relative overflow-hidden py-12 border-t border-b border-white/10 bg-white/[0.01] backdrop-blur-sm">
                {/* Side Fades for Cinematic Effect */}
                <div className="absolute inset-y-0 left-0 w-24 md:w-48 bg-gradient-to-r from-[#0a0a0a] to-transparent z-10 pointer-events-none" />
                <div className="absolute inset-y-0 right-0 w-24 md:w-48 bg-gradient-to-l from-[#0a0a0a] to-transparent z-10 pointer-events-none" />

                <motion.div 
                    className="flex items-center gap-16 md:gap-32 whitespace-nowrap"
                    initial={{ x: 0 }}
                    animate={{ x: isRtl ? '33.33%' : '-33.33%' }}
                    transition={{ 
                        repeat: Infinity, 
                        duration: Math.max(sponsors.length * 6, 25), 
                        ease: "linear" 
                    }}
                    style={{ width: 'max-content' }}
                >
                    {items.map((s, i) => (
                        <div 
                            key={`${s.id}-${i}`}
                            className="inline-flex items-center justify-center cursor-pointer px-4 group"
                            onClick={() => navigate(`/sponsors/${s.id}`)}
                        >
                            <div className="bg-white p-3 md:p-5 rounded-2xl shadow-xl transition-all duration-500 hover:scale-110 flex items-center justify-center h-20 w-20 md:h-28 md:w-28">
                                {s.logo_url ? (
                                    <img 
                                        src={s.logo_url} 
                                        alt={s.name_en} 
                                        className="w-full h-auto max-h-full object-contain" 
                                        onError={(e) => {
                                            e.currentTarget.style.display = 'none';
                                        }}
                                    />
                                ) : (
                                    <span className="text-[#0a0a0a] font-bold text-xs md:text-sm text-center px-1">{isRtl ? s.name_ar : s.name_en}</span>
                                )}
                            </div>
                        </div>
                    ))}
                </motion.div>
            </div>
        </div>
    );
};

export default SponsorMarquee;
