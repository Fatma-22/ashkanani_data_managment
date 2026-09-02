import React, { useEffect, useState } from 'react';
import { Badge, Dropdown, List, Avatar, Button, Typography, Spin, Empty, Tag, Tabs } from 'antd';
import { BellOutlined, ClockCircleOutlined, UserOutlined, WarningOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { playerService } from '../services/playerService';
import { Player, UserRole } from '../types';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import dayjs from 'dayjs';
import { getFormattedDuration } from '../utils/helpers';

const { Text } = Typography;

// Icon wrapper to fix pointer capture warnings
const Icon = (Component: any) => (props: any) => <Component {...props} onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />;
const BellIcon = Icon(BellOutlined);
const ClockIcon = Icon(ClockCircleOutlined);
const UserIcon = Icon(UserOutlined);
const WarningIcon = Icon(WarningOutlined);

export const NotificationBell: React.FC = () => {
    const [expiringPlayers, setExpiringPlayers] = useState<Player[]>([]);
    const [stalePlayers, setStalePlayers] = useState<Player[]>([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    const { user } = useAuth();

    const fetchNotifications = async () => {
        if (loading) return;
        setLoading(true);
        try {
            // Fetch players with contracts expiring in 2 months or less
            const expiringResponse = await playerService.getAll({
                remainingDuration: ['2months']
            }, 1, 50);
            
            // Fetch stale CVs (not updated for > 1 year)
            const staleResponse = await playerService.getAll({
                staleCVs: true
            }, 1, 50);

            setExpiringPlayers(expiringResponse.players);
            setStalePlayers(staleResponse.players);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
        // Refresh every 30 minutes
        const interval = setInterval(fetchNotifications, 30 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    const handlePlayerClick = (playerId: string) => {
        setOpen(false);
        const basePath = user?.role === UserRole.OWNER ? '/owner' : '/admin';
        navigate(`${basePath}/players/${playerId}`);
    };

    const handleOpenChange = (flag: boolean) => {
        setOpen(flag);
    };

    const renderPlayerList = (playersList: Player[], emptyKey: string) => (
        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {playersList.length > 0 ? (
                <List
                    dataSource={playersList}
                    renderItem={(player) => (
                        <List.Item
                            style={{
                                padding: '16px 24px',
                                cursor: 'pointer',
                                transition: 'background-color 0.3s',
                                borderBottom: '1px solid #f3f4f6'
                            }}
                            className="notification-item-hover"
                            onClick={() => handlePlayerClick(player.id)}
                        >
                            <List.Item.Meta
                                avatar={
                                    <Avatar
                                        size={40}
                                        src={player.mainPhoto?.url}
                                        icon={<UserIcon />}
                                        style={{ backgroundColor: '#C9A24D' }}
                                    />
                                }
                                title={
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                                        <Text strong style={{ fontSize: '14px', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {i18n.language === 'ar' && player.nameAr ? player.nameAr : player.name}
                                        </Text>
                                        {player.contractEndDate ? (
                                             <Tag color="warning" style={{ margin: 0, fontSize: '10px' }}>
                                                {dayjs(player.contractEndDate).format('MMM YYYY')}
                                             </Tag>
                                        ) : (
                                            <Tag color="error" style={{ margin: 0, fontSize: '10px' }}>
                                                {t('admin.notifications.stale_title', { defaultValue: 'Update Needed' })}
                                            </Tag>
                                        )}
                                    </div>
                                }
                                description={
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                        {player.updatedAt && (
                                             <Text type="secondary" style={{ fontSize: '11px' }}>
                                                {t('players.last_updated')}: {dayjs(player.updatedAt).format('YYYY-MM-DD')}
                                             </Text>
                                        )}
                                        <Text type="secondary" style={{ fontSize: '12px' }}>
                                            {typeof player.club === 'object' && player.club ? 
                                                (i18n.language === 'ar' ? ((player.club as any).name_ar || player.club.name) : player.club.name) :
                                                (i18n.language === 'ar' && player.clubAr ? String(player.clubAr) : String(player.club || ''))}
                                        </Text>
                                    </div>
                                }
                            />
                        </List.Item>
                    )}
                />
            ) : (
                <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                    <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={<Text type="secondary">{t(emptyKey)}</Text>}
                    />
                </div>
            )}
        </div>
    );

    const totalCount = expiringPlayers.length + stalePlayers.length;

    const menu = (
        <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            border: '1px solid #f3f4f6',
            width: window.innerWidth < 768 ? '320px' : '400px',
            overflow: 'hidden'
        }}>
            <div style={{
                padding: '16px 20px',
                backgroundColor: '#fdfaf2',
                borderBottom: '1px solid #f7e8c3',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <Text strong style={{ color: '#C9A24D', fontSize: '16px' }}>
                    {t('admin.dashboard.expiring_soon')}
                </Text>
                <Badge count={totalCount} showZero={false} color="#C9A24D" />
            </div>

            <Spin spinning={loading}>
                <Tabs
                    centered
                    className="notification-tabs"
                    defaultActiveKey="1"
                    items={[
                        {
                            key: '1',
                            label: (
                                <Badge count={expiringPlayers.length} offset={[10, 0]} size="small">
                                    <span style={{ padding: '0 8px' }}>{t('admin.notifications.title')}</span>
                                </Badge>
                            ),
                            children: renderPlayerList(expiringPlayers, 'admin.notifications.empty')
                        },
                        {
                            key: '2',
                            label: (
                                <Badge count={stalePlayers.length} offset={[10, 0]} size="small">
                                    <span style={{ padding: '0 8px' }}>{t('admin.notifications.stale_title')}</span>
                                </Badge>
                            ),
                            children: renderPlayerList(stalePlayers, 'admin.notifications.stale_empty')
                        }
                    ]}
                />
            </Spin>
            
            <style>{`
                .notification-tabs .ant-tabs-nav { margin-bottom: 0; }
                .notification-tabs .ant-tabs-tab { padding: 12px 0; }
                .notification-item-hover:hover { background-color: #f9fafb !important; }
            `}</style>
        </div>
    );

    return (
        <Dropdown
            dropdownRender={() => menu}
            placement="bottomRight"
            trigger={['click']}
            arrow
            open={open}
            onOpenChange={handleOpenChange}
        >
            <Badge count={totalCount} offset={[-2, 10]} size="small" style={{ cursor: 'pointer' }}>
                <Button
                    type="text"
                    icon={<BellIcon style={{ fontSize: '22px', color: '#fff' }} />}
                    className="flex items-center justify-center hover:bg-white/10"
                />
            </Badge>
        </Dropdown>
    );
};
