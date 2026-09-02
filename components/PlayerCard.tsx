import React from 'react';
import { Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import {
    UserOutlined,
    EditOutlined,
    DeleteOutlined,
    StarFilled,
    StarOutlined,
    CheckCircleFilled,
    ThunderboltFilled,
    TrophyFilled,
    FilePdfOutlined
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import Flag from 'react-world-flags';
import { Button, Tooltip } from 'antd';
import { Player, Sport, ProfileRole, UserRole } from '../types';
import { formatCurrency, fixNationalityAr } from '../utils/helpers';
import { getCountryCode } from '../utils/flags';
import DynamicTranslate from './DynamicTranslate';
import { useAuth } from '../context/AuthContext';

const { Text, Title } = Typography;

interface PlayerCardProps {
    player: Partial<Player>;
    onClick?: () => void;
    onEdit?: (player: Player) => void;
    onDelete?: (player: Player) => void;
    variant?: 'grid';
    showActions?: boolean;
}

const PlayerCard: React.FC<PlayerCardProps> = ({
    player,
    onClick,
    onEdit,
    onDelete,
    variant = 'grid',
    showActions = true,
}) => {
    const { t, i18n } = useTranslation();
    const { user } = useAuth();
    const isAdmin = user?.role === UserRole.ADMIN || user?.role === UserRole.OWNER;
    const isAr = i18n.language === 'ar';
    const mainPhoto = player.photos?.find(p => p.isMain)?.url || player.mainPhoto?.url || 'https://via.placeholder.com/300x400?text=Player';
    
    const nameToDisplay = isAr ? (player.nameAr || player.name) : (player.name || player.nameAr);
    const displayName = <DynamicTranslate text={nameToDisplay} sourceLang={isAr ? (player.nameAr ? 'ar' : 'en') : (player.name ? 'en' : 'ar')} />;
    
    const nationalityValue = isAr ? fixNationalityAr(player.nationalityAr || player.nationality) : (player.nationality || player.nationalityAr);
    const displayNationality = <DynamicTranslate text={nationalityValue} sourceLang={isAr ? (player.nationalityAr ? 'ar' : 'en') : (player.nationality ? 'en' : 'ar')} />;
    
    const countryCode = getCountryCode(player.nationalityAr || player.nationality || '');
        
    const clubObj = typeof player.club === 'object' && player.club !== null ? player.club : null;
    const clubValueEn = clubObj ? clubObj.name : player.club;
    const clubValueAr = clubObj ? (clubObj.name_ar || clubObj.name) : player.clubAr;

    const displayClubText = isAr ? (clubValueAr || clubValueEn) : (clubValueEn || clubValueAr);
    const displayClub = <DynamicTranslate text={displayClubText as string} sourceLang={isAr ? (clubValueAr ? 'ar' : 'en') : (clubValueEn ? 'en' : 'ar')} />;

    return (
        <motion.div
            whileHover={{ y: -8, scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 400, damping: 10 }}
            className="w-full max-w-[175px] sm:max-w-[280px] mx-auto h-full"
            onClick={onClick}
        >
            <div className="relative pt-10 h-full flex flex-col">
                {/* Player Photo (Floating) */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20">
                    <div className="relative">
                        <div className="p-0.5 bg-gradient-to-b from-[#C9A24D] to-transparent rounded-full shadow-lg overflow-hidden flex items-center justify-center bg-[#1a1a1a]" style={{ width: 84, height: 84 }}>
                            {mainPhoto && !mainPhoto.includes('placeholder.com') ? (
                                <img
                                    src={mainPhoto}
                                    alt={player.name}
                                    className="w-full h-full object-cover object-top rounded-full border-2 border-[#1a1a1a]"
                                    onError={(e) => {
                                        e.currentTarget.onerror = null;
                                        e.currentTarget.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(player.name || 'P') + '&background=1a1a1a&color=C9A24D&bold=true&length=1';
                                    }}
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-[#1a1a1a] rounded-full border-2 border-[#1a1a1a]">
                                    <UserOutlined style={{ fontSize: 40, color: '#C9A24D' }} onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />
                                </div>
                            )}
                        </div>
                        {/* Activity Indicator (Facebook style) */}
                        {player.club && (
                            <div className="absolute bottom-1 right-1 w-4 h-4 h-4 bg-green-500 rounded-full border-2 border-[#1a1a1a] shadow-[0_0_10px_#22c55e] animate-pulse z-30" />
                        )}
                    </div>
                </div>

                <div 
                    className="relative overflow-hidden rounded-xl pb-4 pt-14 text-center cursor-pointer shadow-lg flex flex-col flex-1"
                    style={{
                        background: 'linear-gradient(180deg, #3F3F3F 0%, #1a1a1a 100%)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                    }}
                >
                    {/* Glossy Reflection Overlay */}
                    <div 
                        className="absolute top-0 left-0 w-[200%] h-full pointer-events-none"
                        style={{
                            background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.08) 25%, transparent 50%)',
                            transform: 'translateX(-50%) rotate(0deg)',
                        }}
                    />

                    <div className="absolute top-4 left-4 z-30">
                        {countryCode ? (
                            <div className="flex items-center gap-1.5 px-2 py-1 bg-black/60 backdrop-blur-md rounded-lg border border-white/20 shadow-lg overflow-hidden">
                                <Flag code={countryCode} style={{ width: 18, height: 12, borderRadius: 1 }} />
                                <Text style={{ color: '#C9A24D' }} className="text-[10px] font-black uppercase tracking-wider">
                                    {displayNationality}
                                </Text>
                            </div>
                        ) : null}
                    </div>

                    {/* Sport Tag (Opposite side of Flag) */}
                    <div className="absolute top-4 right-4 z-30 flex flex-col gap-1 items-end">
                        {player.role !== ProfileRole.DESIGNER && (
                            <div className="px-2 py-1 bg-black/60 backdrop-blur-md rounded-lg border border-white/20 shadow-lg overflow-hidden">
                                <Text style={{ color: '#fff' }} className="text-[10px] font-black uppercase tracking-wider">
                                    {Object.values(Sport).includes(player.sport as any) ? t(`enums.Sport.${player.sport}`, { defaultValue: player.sport }) : player.sport}
                                </Text>
                            </div>
                        )}
                        {player.role === ProfileRole.DESIGNER && player.designerType && (
                            <div className="px-2 py-1 bg-black/60 backdrop-blur-md rounded-lg border border-white/20 shadow-lg overflow-hidden">
                                <Text style={{ color: '#C9A24D' }} className="text-[10px] font-black uppercase tracking-wider">
                                    {t(`enums.DesignerType.${player.designerType}`, { defaultValue: player.designerType })}
                                </Text>
                            </div>
                        )}
                    </div>

                    {/* Content Section */}
                    <div className="px-4 mt-2 flex-grow flex flex-col justify-between">
                        <div className="flex flex-col items-center justify-center gap-1 min-h-[55px]">
                            {/* Role Badge above name */}
                            <div className="px-3 py-0.5 bg-white rounded-full border border-white/80 shadow">
                                <Text style={{ color: '#1a1a1a' }} className="text-[9px] font-black uppercase tracking-widest">
                                    {t(`enums.ProfileRole.${player.role || ProfileRole.PLAYER}`)}
                                </Text>
                            </div>
                            <Title 
                                level={5} 
                                style={{ 
                                    margin: 0, 
                                    color: 'white',
                                    fontSize: '0.85rem',
                                    textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                                }} 
                                className="uppercase font-extrabold tracking-tight truncate w-full px-1"
                            >
                                {displayName}
                            </Title>
                            
                            {/* Star Rating Section */}
                            <div className="flex items-center gap-0.5 mt-1">
                                {[1, 2, 3, 4, 5].map((s) => (
                                    <span key={s}>
                                        {s <= (player.rating || 0) ? (
                                            <StarFilled style={{ color: '#C9A24D', fontSize: 13 }} onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />
                                        ) : (
                                            <StarOutlined style={{ color: 'rgba(255,255,255,0.2)', fontSize: 13 }} onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />
                                        )}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Special Badges removed for simplicity */}
                        
                        <div className="mt-2 text-center flex flex-col items-center gap-1.5 justify-center w-full">
                            {(player.role || ProfileRole.PLAYER) !== ProfileRole.COACH && player.role !== ProfileRole.DESIGNER ? (
                                <div className="flex flex-nowrap justify-center gap-1 px-1 items-center h-[22px]">
                                    {player.positions && player.positions.length > 0 ? (
                                        <>
                                            {player.positions.slice(0, 1).map((pos, idx) => (
                                                <div key={idx} className="px-1.5 py-0.5 bg-white/10 backdrop-blur-sm rounded border border-white/10 whitespace-nowrap">
                                                    <Text style={{ color: '#fff' }} className="font-bold text-[7px] uppercase tracking-wider leading-none block">
                                                        {t(`enums.Position.${pos}`, { defaultValue: pos })}
                                                    </Text>
                                                </div>
                                            ))}
                                            {player.positions.length > 1 && (
                                                <div className="px-1 py-0.5 bg-[#C9A24D]/20 rounded border border-[#C9A24D]/30 whitespace-nowrap">
                                                    <Text style={{ color: '#C9A24D' }} className="font-bold text-[7px] leading-none block">
                                                        +{player.positions.length - 1}
                                                    </Text>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="h-full" />
                                    )}
                                </div>
                            ) : (
                                <div className="h-[22px]" /> // Spacer to keep card height same as players
                            )}
                            <div className="flex flex-col items-center gap-1 my-1">
                                <div className="flex items-center justify-center">
                                    <Text style={{ color: '#C9A24D' }} className="uppercase text-[10px] font-black tracking-widest">
                                        {(player.role === ProfileRole.REFEREE || player.role === ProfileRole.PHOTOGRAPHER || player.role === ProfileRole.DESIGNER) 
                                            ? '\u00A0' 
                                            : (player.club 
                                                ? displayClub 
                                                : (isAdmin 
                                                    ? (player.role === ProfileRole.COACH ? t('enums.DealStatus.FREE_AGENT_COACH') : t('enums.DealStatus.FREE_AGENT'))
                                                    : '\u00A0'
                                                  )
                                              )}
                                    </Text>
                                </div>
                            </div>
                            {isAdmin && player.role !== ProfileRole.DESIGNER && (
                                <div className="px-2 py-0.5 bg-[#C9A24D] rounded-lg inline-block border border-[#C9A24D]">
                                    <Text className="text-[#1a1a1a] font-black text-[8px] uppercase tracking-widest">
                                        {t(`enums.ContractNature.${player.contractNature || 'SIGNING'}`)}
                                    </Text>
                                </div>
                            )}
                        </div>

                        {showActions && (onEdit || onDelete || player.cvUrl) && (
                            <div className="mt-4 pt-3 border-t border-white/10 flex justify-center gap-4">
                                {player.cvUrl && player.role === ProfileRole.COACH && (
                                    <Tooltip title={t('players.cv_document')}>
                                        <Button 
                                            type="text"
                                            icon={<FilePdfOutlined style={{ color: '#C9A24D' }} onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />} 
                                            onClick={(e) => { e.stopPropagation(); window.open(player.cvUrl, '_blank'); }}
                                            className="!text-[#C9A24D] hover:!bg-[#C9A24D]/20 rounded-lg"
                                        />
                                    </Tooltip>
                                )}
                                {onEdit && (
                                    <Tooltip title={t('common.edit')}>
                                        <Button 
                                            type="text"
                                            icon={<EditOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} style={{ color: '#C9A24D' }} />} 
                                            onClick={(e) => { e.stopPropagation(); onEdit(player as Player); }}
                                            className="!text-[#C9A24D] hover:!bg-[#C9A24D]/20 rounded-lg"
                                        />
                                    </Tooltip>
                                )}
                                {onDelete && (
                                    <Tooltip title={t('common.delete')}>
                                        <Button 
                                            type="text"
                                            danger
                                            icon={<DeleteOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />} 
                                            onClick={(e) => { e.stopPropagation(); onDelete(player as Player); }}
                                            className="hover:!bg-red-500/20 rounded-lg"
                                        />
                                    </Tooltip>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default PlayerCard;
