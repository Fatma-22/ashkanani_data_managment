import React from 'react';
import { Typography, Spin } from 'antd';
const { Title } = Typography;
import { GlobalOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { playerService } from '../services/playerService';
import { Player } from '../types';
import Flag from 'react-world-flags';
import { getCountryCode } from '../utils/flags';

// Custom Compact Card for the Ticker
const TickerCard: React.FC<{ player: Player; onClick: () => void; isRtl: boolean }> = ({ player, onClick, isRtl }) => {
    const { t } = useTranslation();
    const mainPhoto = player.mainPhoto?.url || 'https://via.placeholder.com/300x300?text=P';
    const name = isRtl ? (player.nameAr || player.name) : (player.name || player.nameAr);
    const isCoach = player.role === 'COACH';
    
    return (
        <div 
            onClick={onClick}
            className="flex flex-col items-center gap-2 cursor-pointer group transition-all duration-300 hover:scale-105"
            style={{ width: 120 }}
        >
            <div className="relative">
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#C9A24D] bg-[#1a1a1a] shadow-lg shadow-[#000]/40">
                    <img 
                        src={mainPhoto} 
                        alt={name} 
                        className="w-full h-full object-cover object-top transition-all duration-500"
                        onError={(e) => {
                            e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1a1a1a&color=C9A24D`;
                        }}
                    />
                </div>
                {/* Ultra Minimal Sport Badge - Tiny */}
                <div className="absolute -bottom-0.5 -right-0.5 bg-[#C9A24D] text-[#141414] px-1.5 py-0.5 rounded border border-[#141414] leading-none" style={{ fontSize: '7px', fontWeight: 900 }}>
                    {player.role === 'DESIGNER' && player.designerType 
                        ? t(`enums.DesignerType.${player.designerType}`, { defaultValue: player.designerType })
                        : t(`enums.Sport.${player.sport}`, { defaultValue: player.sport })}
                </div>
            </div>
            
            <div className="text-center w-full">
                <Title level={5} className="!text-white !text-[11px] !m-0 !font-bold line-clamp-1 group-hover:text-[#C9A24D] transition-colors leading-tight px-2">
                    {name}
                </Title>
                {/* Role label */}
                <div
                    className="mt-0.5 mx-auto px-2 py-0.5 rounded-full leading-none"
                    style={{
                        fontSize: '8px',
                        fontWeight: 700,
                        background: (player.role === 'COACH' || player.role === 'ADMINISTRATOR' || player.role === 'REFEREE' || player.role === 'DESIGNER') ? 'rgba(201,162,77,0.18)' : 'rgba(255,255,255,0.08)',
                        color: (player.role === 'COACH' || player.role === 'ADMINISTRATOR' || player.role === 'REFEREE' || player.role === 'DESIGNER') ? '#C9A24D' : '#aaa',
                        border: `1px solid ${(player.role === 'COACH' || player.role === 'ADMINISTRATOR' || player.role === 'REFEREE' || player.role === 'DESIGNER') ? '#C9A24D55' : '#ffffff22'}`,
                        display: 'inline-block',
                    }}
                >
                    {t(`enums.ProfileRole.${player.role}`, { defaultValue: player.role })}
                </div>
                <div className="flex items-center justify-center gap-1 mt-1">
                    {getCountryCode(player.nationalityAr || player.nationality || '') ? (
                        <div className="flex items-center shadow-sm">
                            <Flag 
                                code={getCountryCode(player.nationalityAr || player.nationality || '')} 
                                style={{ width: 14, height: 10, borderRadius: 1 }} 
                            />
                        </div>
                    ) : (
                        <GlobalOutlined className="text-white/20 text-[10px]" onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />
                    )}
                </div>
            </div>
        </div>
    );
};

export const PlayerTicker: React.FC = () => {
    const navigate = useNavigate();
    const { i18n } = useTranslation();
    const isRtl = i18n.language === 'ar';
    const [activePlayers, setActivePlayers] = React.useState<Player[]>([]);
    const [loadingPlayers, setLoadingPlayers] = React.useState(true);

    React.useEffect(() => {
        const fetchActivePlayers = async () => {
            try {
                const { players } = await playerService.getAll({ 
                    isApproved: true, 
                    isVisible: true,
                    public_view: true,
                    ticker: true
                } as any, 1, 25);
                
                const normalized = (players || []).map((p: any) => ({
                    ...p,
                    nameAr: p.name_ar || p.nameAr,
                    nationalityAr: p.nationality_ar || p.nationalityAr,
                    clubAr: p.club_ar || p.clubAr,
                    jerseyNumber: p.jersey_number || p.jerseyNumber,
                    marketValue: p.market_value || p.marketValue,
                }));
                setActivePlayers(normalized);
            } catch (error) {
                console.error('Failed to fetch players for ticker:', error);
            } finally {
                setLoadingPlayers(false);
            }
        };
        fetchActivePlayers();
    }, [i18n.language]);

    if (!loadingPlayers && activePlayers.length === 0) return null;

    return (
        <div className="bg-[#141414] py-3 md:py-4 overflow-hidden border-b border-[#C9A24D]/20 sticky top-[72px] z-[999]" dir="ltr">
            {loadingPlayers ? (
                <div className="flex justify-center py-4"><Spin size="small" /></div>
            ) : (
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#141414] to-transparent z-10 pointer-events-none" />
                    <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[#141414] to-transparent z-10 pointer-events-none" />
                    
                    <motion.div 
                        className="flex gap-6 md:gap-10 px-6 items-center"
                        initial={{ x: "-50%" }}
                        animate={{ x: 0 }}
                        transition={{ 
                            repeat: Infinity, 
                            duration: Math.max(activePlayers.length * 3.5, 12), 
                            ease: "linear",
                            repeatType: "loop"
                        }}
                        style={{ width: 'max-content' }}
                    >
                        {[...activePlayers, ...activePlayers, ...activePlayers].map((player, index) => (
                            <div key={`${player.id}-${index}`} dir={isRtl ? 'rtl' : 'ltr'}>
                                <TickerCard 
                                    player={player}
                                    isRtl={isRtl}
                                    onClick={() => navigate(`/players/${player.id}`)}
                                />
                            </div>
                        ))}
                    </motion.div>
                </div>
            )}
        </div>
    );
};
