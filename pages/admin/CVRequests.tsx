import React, { useEffect, useState } from 'react';
import {
    Row,
    Col,
    Card,
    Spin,
    Typography,
    Space,
    Button,
    Empty,
    Modal,
    notification,
    Avatar,
    Badge,
    Tag,
    Pagination
} from 'antd';
import {
    CheckCircleOutlined,
    DeleteOutlined,
    UserOutlined,
    ThunderboltOutlined,
    EditOutlined,
    GlobalOutlined,
    ClockCircleOutlined,
    SafetyCertificateOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { playerService } from '../../services/playerService';
import { Player, ProfileRole } from '../../types';
import PlayerEditModal from '../../components/PlayerEditModal';

const { Title, Text, Paragraph } = Typography;

export const CVRequests: React.FC = () => {
    const { t, i18n } = useTranslation();
    const location = useLocation();
    const navigate = useNavigate();
    const [players, setPlayers] = useState<Player[]>([]);
    const [loading, setLoading] = useState(true);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);

    // Pagination states
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(8);
    const [total, setTotal] = useState(0);

    const isRtl = i18n.language === 'ar';
    const basePath = location.pathname.startsWith('/owner') ? '/owner' : '/admin';

    useEffect(() => {
        fetchRequests(page, pageSize);
    }, [page, pageSize]);

    const fetchRequests = async (currentPage = page, currentPageSize = pageSize) => {
        setLoading(true);
        try {
            const { players: allPlayers, total: count } = await playerService.getAll({ isApproved: false }, currentPage, currentPageSize);
            setPlayers(allPlayers);
            setTotal(count);
        } catch (error) {
            notification.error({
                message: t('messages.error_load'),
                description: t('players.error_fetch_requests', { defaultValue: 'Failed to fetch CV requests' }),
            });
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        Modal.confirm({
            title: t('common.approve'),
            content: t('players.approve_confirm', { defaultValue: 'Are you sure you want to approve this request and add it to the directory?' }),
            okText: t('common.approve'),
            okType: 'primary',
            cancelText: t('common.cancel'),
            onOk: async () => {
                try {
                    await playerService.update(id, { is_approved: true, is_visible: true });
                    notification.success({ message: t('players.approve_success') });
                    // تحديث العدد فوراً (تقليل بـ 1)
                    setPlayers(prev => prev.filter(p => p.id !== id));
                    if (page > 1 && players.length === 1) {
                        setPage(prev => prev - 1);
                    } else {
                        fetchRequests(page, pageSize);
                    }
                    window.dispatchEvent(new CustomEvent('cv-requests-updated'));
                } catch (error) {
                    notification.error({ message: t('players.approve_failed') });
                }
            },
        });
    };

    const handleReject = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        Modal.confirm({
            title: t('common.reject'),
            content: t('players.delete_confirm'),
            okText: t('common.reject'),
            okType: 'danger',
            cancelText: t('common.cancel'),
            onOk: async () => {
                try {
                    await playerService.delete(id);
                    notification.success({ message: t('messages.success_delete') });
                    if (page > 1 && players.length === 1) {
                        setPage(prev => prev - 1);
                    } else {
                        fetchRequests(page, pageSize);
                    }
                    window.dispatchEvent(new CustomEvent('cv-requests-updated'));
                } catch (error) {
                    notification.error({ message: t('messages.error_delete') });
                }
            },
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Spin size="large" tip={t('common.loading')} />
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6" dir={isRtl ? 'rtl' : 'ltr'}>
            <div className="mb-8 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-amber-50 rounded-xl">
                        <ThunderboltOutlined className="text-amber-500" onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />
                    </div>
                    <div>
                        <Title level={4} className="!mb-0 flex items-center gap-2">
                            {t('players.cv_requests')}
                            <Badge 
                                count={total} 
                                overflowCount={99} 
                                className="custom-badge"
                                style={{ backgroundColor: '#C9A24D' }}
                            />
                        </Title>
                        {total > 0 && (
                            <Text type="secondary" className="text-xs">
                                {t('common.total_results', { count: total })}
                            </Text>
                        )}
                    </div>
                </div>
            </div>

            {players.length === 0 ? (
                <Card className="rounded-3xl border-dashed border-2 border-slate-200 py-12">
                    <Empty description={t('players.no_requests_found')} />
                </Card>
            ) : (
                <>
                    <Row gutter={[20, 20]}>
                    {players.map((player) => (
                        <Col xs={24} sm={12} lg={8} xl={6} key={player.id}>
                            <Card
                                hoverable
                                className="h-full rounded-3xl overflow-hidden border-slate-100 hover:shadow-xl transition-all duration-300 group"
                                bodyStyle={{ padding: 0 }}
                                onClick={() => navigate(`/players/${player.id}`)}
                            >
                                <div className="relative h-48 overflow-hidden bg-slate-100">
                                    {player.mainPhoto?.url ? (
                                        <img
                                            src={player.mainPhoto.url}
                                            alt={player.name}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-slate-50">
                                            <UserOutlined className="text-5xl text-slate-300" onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />
                                        </div>
                                    )}
                                    <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
                                        <Tag className="rounded-full border-none px-3 py-1 bg-white/90 backdrop-blur-sm text-slate-700 font-medium m-0 flex items-center gap-1 shadow-sm">
                                            {player.role === ProfileRole.COACH ? (
                                                <SafetyCertificateOutlined className="text-amber-500" onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />
                                            ) : (
                                                <GlobalOutlined className="text-blue-500" onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />
                                            )}
                                            {t(`enums.ProfileRole.${player.role || ProfileRole.PLAYER}`, { defaultValue: player.role })}
                                        </Tag>
                                        <Tag className="rounded-full border-none px-3 py-1 bg-white/90 backdrop-blur-sm text-slate-700 font-medium m-0 flex items-center gap-1 shadow-sm">
                                            <ClockCircleOutlined className="text-slate-500" onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />
                                            {(() => {
                                                const dob = String(player.dateOfBirth || '');
                                                const year = dob.includes('-') ? dob.split('-')[0] : dob;
                                                const calculatedAge = new Date().getFullYear() - Number(year);
                                                
                                                if (!isNaN(calculatedAge) && calculatedAge > 0 && calculatedAge < 100) {
                                                    return `${calculatedAge} ${t('players.years_label')}`;
                                                }
                                                return player.age || t('common.not_available');
                                            })()}
                                        </Tag>
                                    </div>
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                                        <Text className="text-white text-xs line-clamp-2 italic">
                                            {isRtl ? player.internalNotesAr || player.notesAr : player.internalNotes || player.notes}
                                        </Text>
                                    </div>
                                </div>

                                <div className="p-5">
                                    <div className="mb-4">
                                        <Title level={5} className="!mb-1 truncate hover:text-amber-600 transition-colors">
                                            {isRtl ? (player.nameAr || player.name) : (player.name || player.nameAr)}
                                        </Title>
                                        <div className="flex items-center gap-2 text-slate-500 text-sm">
                                            <span className="truncate">{player.sport ? t(`enums.Sport.${player.sport}`, { defaultValue: player.sport }) : t('common.sport')}</span>
                                            <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                            <span className="truncate">{isRtl ? (player.nationalityAr || player.nationality) : (player.nationality || player.nationalityAr)}</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-2 border-t border-slate-50 pt-4 mt-2">
                                        <Button
                                            type="primary"
                                            icon={<CheckCircleOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
                                            block
                                            className="rounded-xl h-10 bg-emerald-500 hover:bg-emerald-600 border-none shadow-sm shadow-emerald-100"
                                            onClick={(e) => handleApprove(player.id, e)}
                                        >
                                            {t('common.approve')}
                                        </Button>
                                        <div className="flex gap-2">
                                            <Button
                                                icon={<EditOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
                                                className="flex-1 rounded-xl h-10 border-slate-200 text-slate-600 hover:text-amber-600 hover:border-amber-200"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setEditingPlayer(player);
                                                    setEditModalVisible(true);
                                                }}
                                            >
                                                {t('common.edit')}
                                            </Button>
                                            <Button
                                                danger
                                                icon={<DeleteOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
                                                className="flex-1 rounded-xl h-10 flex items-center justify-center"
                                                onClick={(e) => handleReject(player.id, e)}
                                            >
                                                {t('common.reject')}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </Col>
                    ))}
                </Row>
                <div className="flex justify-center mt-8">
                    <Pagination
                        current={page}
                        pageSize={pageSize}
                        total={total}
                        onChange={(p, ps) => {
                            setPage(p);
                            setPageSize(ps);
                        }}
                        showSizeChanger
                        pageSizeOptions={['8', '12', '24', '48']}
                    />
                </div>
            </>
            )}

            <PlayerEditModal
                open={editModalVisible}
                onCancel={() => {
                    setEditModalVisible(false);
                    setEditingPlayer(null);
                }}
                onSuccess={() => {
                    setEditModalVisible(false);
                    setEditingPlayer(null);
                    fetchRequests(page, pageSize);
                    window.dispatchEvent(new CustomEvent('cv-requests-updated'));
                }}
                editingPlayer={editingPlayer}
                initialRole={editingPlayer?.role}
            />
        </div>
    );
};

export default CVRequests;
