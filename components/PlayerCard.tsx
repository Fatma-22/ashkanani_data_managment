import React from 'react';
import { Card, Tag, Avatar, Space, Typography, Row, Col } from 'antd';
import { useTranslation } from 'react-i18next';
import {
    UserOutlined,
    EnvironmentOutlined,
    TrophyOutlined,
    DollarOutlined,
} from '@ant-design/icons';
import { Player, DealStatus } from '../types';
import { formatCurrency, translateToArabic } from '../utils/helpers';
import StatusBadge from './StatusBadge';

const { Text, Title } = Typography;

interface PlayerCardProps {
    player: Partial<Player>;
    onClick?: () => void;
    variant?: 'grid' | 'list';
    showActions?: boolean;
}

const PlayerCard: React.FC<PlayerCardProps> = ({
    player,
    onClick,
    variant = 'grid',
    showActions = true,
}) => {
    const { t, i18n } = useTranslation();
    const isAr = i18n.language === 'ar';
    const mainPhoto = player.photos?.find(p => p.isMain)?.url || 'https://via.placeholder.com/300x400?text=Player';
    const displayName = isAr && player.nameAr ? player.nameAr : player.name;
    const displayNationality = isAr ? (player.nationalityAr || translateToArabic(player.nationality || '', 'country')) : player.nationality;
    const displayClub = isAr ? (player.clubAr || translateToArabic(player.club || '', 'club')) : player.club;

    if (variant === 'list') {
        return (
            <Card
                hoverable
                onClick={onClick}
                className="card-hover overflow-hidden"
                bodyStyle={{ padding: '16px 20px' }}
                style={{ marginBottom: 16 }}
            >
                <Row gutter={[20, 16]} align="middle">
                    <Col xs={24} sm={4} md={3} lg={2}>
                        <Avatar
                            src={mainPhoto}
                            size={72}
                            icon={<UserOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
                            shape="square"
                            className="rounded-lg shadow-sm"
                        />
                    </Col>
                    <Col xs={24} sm={12} md={15} lg={16}>
                        <div className="flex flex-col">
                            <Title level={4} style={{ margin: 0, color: '#01153e' }} className="uppercase font-black tracking-tight">
                                {displayName}
                            </Title>
                            <Space size="middle" style={{ marginTop: 4 }} wrap>
                                <Tag color="gold" className="border-gold-500 bg-gold-50 text-gold-700 font-bold uppercase text-[10px]">
                                    {t(`enums.Sport.${player.sport}`, { defaultValue: player.sport })}
                                </Tag>
                                {player.position && (
                                    <Tag color="default" style={{ background: '#01153e', color: '#FFD700', borderColor: '#FFD700', margin: 0 }}>
                                        {t(`enums.Position.${player.position}`, { defaultValue: player.position })}
                                    </Tag>
                                )}
                                {player.age && <Text className="text-slate-400 font-bold text-xs uppercase">{player.age} {t('players.years_label')}</Text>}
                                {player.nationality && (
                                    <Space size={4}>
                                        <EnvironmentOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} className="text-slate-300" />
                                        <Text className="text-slate-500 font-medium">{displayNationality}</Text>
                                    </Space>
                                )}
                            </Space>
                        </div>
                    </Col>
                    <Col xs={24} sm={8} md={6} lg={6} className="sm:text-right">
                        <div className="flex flex-col sm:items-end justify-center h-full">
                            {player.marketValue && (
                                <div className="text-lg font-black text-[#01153e] mb-1">
                                    {formatCurrency(player.marketValue)}
                                </div>
                            )}
                            {player.club && (
                                <Text className="text-slate-400 uppercase text-[10px] font-bold tracking-widest block mb-1">
                                    {displayClub}
                                </Text>
                            )}
                            {player.dealStatus && (
                                <div className="mt-1">
                                    <StatusBadge status={player.dealStatus} type="deal" />
                                </div>
                            )}
                        </div>
                    </Col>
                </Row>
            </Card>
        );
    }

    return (
        <Card
            hoverable
            onClick={onClick}
            className="card-hover"
            cover={
                <div
                    style={{
                        height: 280,
                        overflow: 'hidden',
                        background: `linear-gradient(to bottom, rgba(1, 21, 62, 0.1), rgba(1, 21, 62, 0.6)), url(${mainPhoto})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        position: 'relative',
                    }}
                >
                    {player.dealStatus && (
                        <div style={{ position: 'absolute', top: 12, right: 12 }}>
                            <StatusBadge status={player.dealStatus} type="deal" variant="navy" />
                        </div>
                    )}
                </div>
            }
        >
            <Card.Meta
                title={
                    <div>
                        <Title level={5} style={{ margin: 0 }} ellipsis>
                            {displayName}
                        </Title>
                    </div>
                }
                description={
                    <Space direction="vertical" size="small" style={{ width: '100%' }}>
                        <Tag color="gold" className="border-gold-500 bg-gold-50 text-gold-700 font-bold uppercase text-[10px]" style={{ marginInlineEnd: 0 }}>
                            {t(`enums.Sport.${player.sport}`, { defaultValue: player.sport })}
                        </Tag>
                        <Tag color="default" style={{ marginRight: 0, background: '#01153e', color: '#FFD700', borderColor: '#FFD700' }}>
                            {t(`enums.Position.${player.position}`, { defaultValue: player.position })}
                        </Tag>

                        {player.nationality && (
                            <Space size={4}>
                                <EnvironmentOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />
                                <Text type="secondary" ellipsis>
                                    {displayNationality}
                                </Text>
                            </Space>
                        )}
                        {player.club && (
                            <Text type="secondary" ellipsis>
                                {displayClub}
                            </Text>
                        )}
                        {player.marketValue && (
                            <div className="market-value-highlight" style={{ marginTop: 8 }}>
                                <DollarOutlined style={{ marginInlineEnd: 4 }} onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />
                                {formatCurrency(player.marketValue)}
                            </div>
                        )}
                    </Space>
                }
            />
        </Card>
    );
};

export default PlayerCard;
