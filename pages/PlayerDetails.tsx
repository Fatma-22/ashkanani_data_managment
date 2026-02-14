import { useEffect, useState, FC } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Row, Col, Typography, Tag, Space, Button, Spin, Empty, Descriptions, Avatar, Tabs, Divider } from 'antd';
import { useTranslation } from 'react-i18next';
import {
    ArrowLeftOutlined,
    GlobalOutlined,
    TrophyOutlined,
    TeamOutlined,
    DoubleRightOutlined,
    CalendarOutlined,
    InfoCircleOutlined,
    RocketOutlined,
    FilePdfOutlined,
    DownloadOutlined,
    MailOutlined,
    SolutionOutlined,
    NumberOutlined,
    HistoryOutlined,
} from '@ant-design/icons';
import { Player, UserRole, Contract } from '../types';
import { mockPlayerApi, mockContractApi } from '../services/mockApi';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import { formatCurrency } from '../utils/helpers';

const { Title, Text, Paragraph } = Typography;

export const PlayerDetails: FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    const { user } = useAuth();

    // Authorization check
    const isAuthorized = user?.role === UserRole.ADMIN || user?.role === UserRole.AGENT;

    const [player, setPlayer] = useState<Player | null>(null);
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            loadPlayer(id);
        }
    }, [id]);

    const loadPlayer = async (playerId: string) => {
        setLoading(true);
        try {
            const [playerData, contractData] = await Promise.all([
                mockPlayerApi.getById(playerId),
                isAuthorized ? mockContractApi.getByPlayerId(playerId) : Promise.resolve([])
            ]);

            if (playerData) setPlayer(playerData);
            setContracts(contractData || []);
        } catch (error) {
            console.error('Failed to load player or contracts:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Spin size="large" tip={t('players.loading_profile')} />
            </div>
        );
    }

    if (!player) {
        return (
            <div className="p-12 text-center">
                <Empty description={t('players.player_not_found')} />
                <Button
                    type="primary"
                    onClick={() => navigate('/players')}
                    className="mt-4"
                    style={{ background: '#3F3F3F' }}
                >
                    {t('players.return_to_directory')}
                </Button>
            </div>
        );
    }

    const visibility = isAuthorized
        ? Object.keys(player.visibility).reduce((acc, key) => ({ ...acc, [key]: true }), {}) as Player['visibility']
        : player.visibility;

    const isAr = i18n.language === 'ar';
    const displayName = isAr && player.nameAr ? player.nameAr : player.name;
    const displayNationality = isAr && player.nationalityAr ? player.nationalityAr : player.nationality;
    const displayClub = isAr && player.clubAr ? player.clubAr : player.club;
    const achievementsList = isAr && player.achievementsAr ? player.achievementsAr : player.achievements;

    const mainPhoto = player.photos.find(p => p.isMain)?.url || 'https://via.placeholder.com/600x800?text=No+Photo';

    return (
        <div className="fade-in">
            {/* Header Actions */}
            <div className="mb-6 flex items-center justify-between">
                <Button
                    type="text"
                    icon={<ArrowLeftOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
                    onClick={() => navigate(-1)}
                    className="hover:text-gold-500 flex items-center gap-2"
                >
                    {t('players.back_to_directory')}
                </Button>
                <Space>
                    {visibility.dealStatus && <StatusBadge status={player.dealStatus} type="deal" />}
                </Space>
            </div>

            {/* Hero Section */}
            <div className="rounded-2xl overflow-hidden mb-8 shadow-2xl relative">
                <div
                    className="absolute inset-0 z-0"
                    style={{
                        background: 'linear-gradient(135deg, #3F3F3F 0%, #3F3F3F 100%)',
                    }}
                />

                <Row gutter={0} className="relative z-10 min-h-[360px]">
                    <Col xs={24} md={8} lg={6}>
                        <div className="p-6 md:p-8 h-full flex items-center justify-center">
                            <div className="relative group">
                                <div className="absolute -inset-1 bg-gradient-to-r from-gold-500 to-yellow-600 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                                <img
                                    src={mainPhoto}
                                    alt={player.name}
                                    className="relative rounded-xl w-full max-w-[280px] shadow-2xl object-cover aspect-[3/4] border-2 border-white/10"
                                />
                            </div>
                        </div>
                    </Col>
                    <Col xs={24} md={16} lg={18}>
                        <div className="p-4 md:p-12 h-full flex flex-col justify-center text-white text-center md:text-left">
                            <div className="mb-4">
                                <Space size="middle" className="mb-4">
                                    <Tag className="bg-gold-500 border-none text-black font-bold px-3 py-1 rounded-md uppercase tracking-wider">
                                        {t(`enums.Sport.${player.sport}`, { defaultValue: player.sport })}
                                    </Tag>
                                    <Tag className="bg-white/20 border-none text-white font-bold px-3 py-1 rounded-md uppercase tracking-wider">
                                        {player.role === 'Coach' ? t('common.coach', { defaultValue: 'Coach' }) : t('common.player', { defaultValue: 'Player' })}
                                    </Tag>
                                    {visibility.position && player.role !== 'Coach' && (
                                        <Tag className="bg-white/10 border-none text-white font-bold px-3 py-1 rounded-md uppercase tracking-wider">
                                            {t(`enums.Position.${player.position}`, { defaultValue: player.position })}
                                        </Tag>
                                    )}
                                </Space>
                            </div>
                            <Title level={1} className="!text-white !m-0 !text-3xl sm:!text-4xl md:!text-6xl !font-black uppercase tracking-tighter">
                                {displayName}
                            </Title>
                            {player.nameAr && (
                                <Title level={2} className="!text-gold-500 !mt-2 !mb-0 !text-2xl sm:!text-3xl font-bold font-arabic" dir="rtl">
                                    {player.nameAr}
                                </Title>
                            )}

                            {isAuthorized && (
                                <div className="mt-4 p-4 bg-white/5 rounded-xl border border-white/10 max-w-2xl">
                                    <Row gutter={[16, 16]}>
                                        <Col xs={24} sm={8}>
                                            <Text className="text-white/40 block text-[10px] uppercase tracking-widest">{t('common.national_id')}</Text>
                                            <Text className="text-white font-mono">{player.nationalId || t('common.not_available', { defaultValue: 'N/A' })}</Text>
                                        </Col>
                                        <Col xs={24} sm={8}>
                                            <Text className="text-white/40 block text-[10px] uppercase tracking-widest">{t('common.phone_number')}</Text>
                                            <Text className="text-white">{player.phone || t('common.not_available', { defaultValue: 'N/A' })}</Text>
                                        </Col>
                                        <Col xs={24} sm={8}>
                                            <Text className="text-white/40 block text-[10px] uppercase tracking-widest">{t('common.address')}</Text>
                                            <Text className="text-white line-clamp-1" title={player.address}>{player.address || t('common.not_available', { defaultValue: 'N/A' })}</Text>
                                        </Col>
                                    </Row>
                                </div>
                            )}

                            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 border-t border-white/10 pt-8 text-left">
                                {visibility.nationality && (
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gold-500">
                                            <GlobalOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} className="text-xl" />
                                        </div>
                                        <div>
                                            <Text className="text-gray-400 block text-xs uppercase tracking-widest">{t('common.nationality')}</Text>
                                            <Text className="text-white font-bold">{displayNationality}</Text>
                                        </div>
                                    </div>
                                )}
                                {visibility.age && (
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gold-500">
                                            <CalendarOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} className="text-xl" />
                                        </div>
                                        <div>
                                            <Text className="text-gray-400 block text-xs uppercase tracking-widest">{t('common.age')}</Text>
                                            <Text className="text-white font-bold">{player.age} {t('players.years_label')}</Text>
                                            {player.dateOfBirth && visibility.dateOfBirth && (
                                                <Text className="text-gray-500 block text-xs mt-1">{player.dateOfBirth}</Text>
                                            )}
                                        </div>
                                    </div>
                                )}
                                {player.email && isAuthorized && (
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gold-500">
                                            <MailOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} className="text-xl" />
                                        </div>
                                        <div>
                                            <Text className="text-gray-400 block text-xs uppercase tracking-widest">{t('common.email', { defaultValue: 'Email' })}</Text>
                                            <Text className="text-white font-bold">{player.email}</Text>
                                        </div>
                                    </div>
                                )}
                                {visibility.club && (
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gold-500">
                                            <TeamOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} className="text-xl" />
                                        </div>
                                        <div>
                                            <Text className="text-gray-400 block text-xs uppercase tracking-widest">{t('common.club_label')}</Text>
                                            <Text className="text-white font-bold">{displayClub}</Text>
                                        </div>
                                    </div>
                                )}
                                {visibility.preferredFoot && player.role !== 'Coach' && (
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gold-500">
                                            <RocketOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} className="text-xl" />
                                        </div>
                                        <div>
                                            <Text className="text-gray-400 block text-xs uppercase tracking-widest">{t('common.preferred_foot')}</Text>
                                            <Text className="text-white font-bold uppercase">{t(`enums.PreferredFoot.${player.preferredFoot}`, { defaultValue: player.preferredFoot })}</Text>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Col>
                </Row>
            </div>

            {/* Content Section */}
            <Row gutter={[24, 24]}>
                <Col xs={24} lg={16}>
                    <Card
                        title={<div className="flex items-center gap-2"><InfoCircleOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} className="text-gold-500" /> {t('players.biography')}</div>}
                        bordered={false}
                        className="shadow-sm rounded-xl mb-6"
                    >
                        <div className="min-h-[200px]">
                            {isAr ? (
                                player.bioAr ? (
                                    <Paragraph className="text-xl leading-relaxed text-gray-700 font-arabic text-right mb-0" dir="rtl">
                                        {player.bioAr}
                                    </Paragraph>
                                ) : <Empty description={t('players.no_bio_ar')} />
                            ) : (
                                player.bio ? (
                                    <Paragraph className="text-lg leading-relaxed text-gray-700">
                                        {player.bio}
                                    </Paragraph>
                                ) : <Empty description={t('players.no_bio_en')} />
                            )}
                            {isAuthorized && (player.notes || player.notesAr) && (
                                <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-100">
                                    <Text type="secondary" className="block text-xs uppercase tracking-widest mb-2 font-bold text-yellow-700">
                                        {t('common.internal_notes', { defaultValue: 'Internal Notes' })}
                                    </Text>
                                    {isAr ? (
                                        player.notesAr && <Paragraph className="text-gray-700 mb-0 font-arabic" dir="rtl">{player.notesAr}</Paragraph>
                                    ) : (
                                        player.notes && <Paragraph className="text-gray-700 mb-0">{player.notes}</Paragraph>
                                    )}
                                    {/* Fallback if only one language exists but wrong language selected */}
                                    {!isAr && !player.notes && player.notesAr && <Paragraph className="text-gray-500 italic mb-0" dir="rtl">{player.notesAr}</Paragraph>}
                                    {isAr && !player.notesAr && player.notes && <Paragraph className="text-gray-500 italic mb-0">{player.notes}</Paragraph>}
                                </div>
                            )}
                        </div>
                        {isAuthorized && contracts.length > 0 && (
                            <>
                                <Divider className="my-6" />
                                <Title level={4} className="!text-gold-600 !mb-4 flex items-center gap-2">
                                    <FilePdfOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} /> {t('admin.contracts.contract_details')}
                                </Title>
                                <div className="space-y-4">
                                    {contracts.map(contract => (
                                        <div key={contract.id} className="p-6 bg-slate-50 rounded-2xl border border-slate-200">
                                            <Row gutter={[24, 24]}>
                                                <Col xs={24} sm={12}>
                                                    <Text type="secondary" className="block text-xs uppercase tracking-widest mb-1">{t('common.contract_type')}</Text>
                                                    <Text strong className="text-lg">{t(`admin.contracts.${contract.type.toLowerCase()}`, { defaultValue: contract.type })}</Text>
                                                </Col>
                                                <Col xs={24} sm={12}>
                                                    <Text type="secondary" className="block text-xs uppercase tracking-widest mb-1">{t('common.status')}</Text>
                                                    <Tag color={contract.status === 'Active' ? 'success' : 'default'}>{t(`common.${contract.status.toLowerCase()}`, { defaultValue: contract.status })}</Tag>
                                                </Col>
                                                <Col xs={24} sm={12}>
                                                    <Text type="secondary" className="block text-xs uppercase tracking-widest mb-1">{t('admin.contracts.salary')}</Text>
                                                    <Text strong className="text-lg text-gold-600">€{contract.annualSalary.toLocaleString()}</Text>
                                                </Col>
                                                {contract.signingBonus && (
                                                    <Col xs={24} sm={12}>
                                                        <Text type="secondary" className="block text-xs uppercase tracking-widest mb-1">{t('admin.contracts.signing_bonus')}</Text>
                                                        <Text strong className="text-lg">€{contract.signingBonus.toLocaleString()}</Text>
                                                    </Col>
                                                )}
                                                <Col xs={24} sm={12}>
                                                    <Text type="secondary" className="block text-xs uppercase tracking-widest mb-1">{t('admin.contracts.start_date')}</Text>
                                                    <Text strong>{contract.startDate}</Text>
                                                </Col>
                                                <Col xs={24} sm={12}>
                                                    <Text type="secondary" className="block text-xs uppercase tracking-widest mb-1">{t('admin.contracts.end_date')}</Text>
                                                    <Text strong>{contract.endDate}</Text>
                                                </Col>
                                                {((isAr && contract.notesAr) || contract.notes) && (
                                                    <Col span={24}>
                                                        <div className="mt-2 p-3 bg-white rounded border border-slate-100">
                                                            <Text type="secondary" className="block text-xs uppercase tracking-widest mb-1">{t('admin.contracts.notes')}</Text>
                                                            <Text>{isAr && contract.notesAr ? contract.notesAr : contract.notes}</Text>
                                                        </div>
                                                    </Col>
                                                )}
                                            </Row>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                        {isAuthorized && player.documents && player.documents.length > 0 && (
                            <>
                                <Divider className="my-6" />
                                <Title level={4} className="!text-gold-600 !mb-4 flex items-center gap-2">
                                    <FilePdfOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} /> {t('players.media_docs')}
                                </Title>
                                <div className="space-y-4">
                                    {player.documents.map((document, index) => (
                                        <div key={document.id || index} className="p-6 bg-slate-50 rounded-2xl border border-slate-200">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center text-red-500">
                                                    <FilePdfOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} className="text-xl" />
                                                </div>
                                                <div>
                                                    <Text strong className="block">{document.name}</Text>
                                                    <Text type="secondary" className="text-xs">{document.type} • {new Date(document.uploadedAt).toLocaleDateString()}</Text>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between flex-wrap gap-4">
                                                <Space wrap>
                                                    <Button
                                                        type="text"
                                                        icon={<DownloadOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
                                                        href={document.url}
                                                        download
                                                    >
                                                        {t('admin.contracts.download_doc')}
                                                    </Button>
                                                    <Button
                                                        type="primary"
                                                        style={{ background: '#3F3F3F' }}
                                                        onClick={() => window.open(document.url, '_blank')}
                                                    >
                                                        {t('admin.contracts.view_doc')}
                                                    </Button>
                                                </Space>
                                                <Tag color={document.status === 'Active' ? 'success' : document.status === 'Pending' ? 'processing' : document.status === 'Expired' ? 'error' : 'default'}>
                                                    {t(`enums.ContractStatus.${document.status || 'Active'}`, { defaultValue: document.status || 'Active' })}
                                                </Tag>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </Card>

                    {visibility.stats && (
                        <Card
                            title={<div className="flex items-center gap-2"><TrophyOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} className="text-gold-500" /> {t('players.performance_stats')}</div>}
                            bordered={false}
                            className="shadow-sm rounded-xl"
                        >
                            <Row gutter={[16, 16]}>
                                <Col xs={12} sm={8}>
                                    <div className="p-4 md:p-6 bg-slate-50 rounded-xl text-center border border-slate-100 hover:border-gold-500 transition-colors">
                                        <Text className="text-gray-400 uppercase text-[10px] md:text-xs tracking-widest block mb-2">
                                            {player.role === 'Coach' ? t('players.matches_managed', { defaultValue: 'Matches' }) : t('players.appearances')}
                                        </Text>
                                        <Title level={3} className="!m-0 md:!text-2xl">{player.role === 'Coach' ? (player.matchesManaged || 0) : (player.appearances || 0)}</Title>
                                    </div>
                                </Col>
                                <Col xs={12} sm={8}>
                                    <div className="p-4 md:p-6 bg-slate-50 rounded-xl text-center border border-slate-100 hover:border-gold-500 transition-colors">
                                        <Text className="text-gray-400 uppercase text-[10px] md:text-xs tracking-widest block mb-2">
                                            {player.role === 'Coach' ? t('players.career_wins', { defaultValue: 'Wins' }) : t('players.goals')}
                                        </Text>
                                        <Title level={3} className="!m-0 md:!text-2xl text-gold-600">{player.role === 'Coach' ? (player.careerWins || 0) : (player.goals || 0)}</Title>
                                    </div>
                                </Col>
                                <Col xs={24} sm={8}>
                                    <div className="p-4 md:p-6 bg-slate-50 rounded-xl text-center border border-slate-100 hover:border-gold-500 transition-colors">
                                        <Text className="text-gray-400 uppercase text-[10px] md:text-xs tracking-widest block mb-2">
                                            {player.role === 'Coach' ? t('players.career_losses', { defaultValue: 'Losses' }) : t('players.assists')}
                                        </Text>
                                        <Title level={3} className="!m-0 md:!text-2xl">{player.role === 'Coach' ? (player.careerLosses || 0) : (player.assists || 0)}</Title>
                                    </div>
                                </Col>
                            </Row>
                        </Card>
                    )}
                </Col>

                <Col xs={24} lg={8}>
                    <Card
                        title={<div className="flex items-center gap-2"><SolutionOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} className="text-gold-500" /> {t('players.professional_data', { defaultValue: 'Professional Data' })}</div>}
                        bordered={false}
                        className="shadow-sm rounded-xl mb-6"
                    >
                        <Descriptions column={1} className="label-gray">
                            {visibility.marketValue && (
                                <Descriptions.Item label={t('common.value', { defaultValue: 'Market Value' })}>
                                    <span className="font-black text-lg text-[#3F3F3F]">{formatCurrency(player.marketValue)}</span>
                                </Descriptions.Item>
                            )}
                            {visibility.dealStatus && (
                                <Descriptions.Item label={t('common.status')}>
                                    <StatusBadge status={player.dealStatus} type="deal" />
                                </Descriptions.Item>
                            )}
                            {player.role !== 'Coach' && player.jerseyNumber && (
                                <Descriptions.Item label={<span className="flex items-center gap-1"><NumberOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} /> {t('common.jersey_number')}</span>}>
                                    <span className="font-bold text-lg">{player.jerseyNumber}</span>
                                </Descriptions.Item>
                            )}
                            {player.agentName && (
                                <Descriptions.Item label={t('common.agent', { defaultValue: 'Agent' })}>
                                    <span className="text-gold-600 font-medium">{player.agentName}</span>
                                </Descriptions.Item>
                            )}
                        </Descriptions>

                        {visibility.previousClubs && player.previousClubs && player.previousClubs.length > 0 && (
                            <>
                                <Divider className="my-4" />
                                <Text type="secondary" className="block text-xs uppercase tracking-widest mb-3 flex items-center gap-1">
                                    <HistoryOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} /> {t('players.previous_clubs', { defaultValue: 'Previous Clubs' })}
                                </Text>
                                <div className="flex flex-wrap gap-2">
                                    {player.previousClubs.map((club, index) => (
                                        <Tag key={index} className="m-0 bg-slate-50 border-slate-200 text-slate-600">{club}</Tag>
                                    ))}
                                </div>
                            </>
                        )}
                    </Card>

                    {player.role !== 'Coach' && (
                        <Card
                            title={t('players.physical_data')}
                            bordered={false}
                            className="shadow-sm rounded-xl mb-6"
                        >
                            <Descriptions column={1} className="label-gray">
                                {visibility.height && (
                                    <Descriptions.Item label={t('common.height')}>
                                        <span className="font-bold">{player.height} {t('common.cm')}</span>
                                    </Descriptions.Item>
                                )}
                                {visibility.weight && (
                                    <Descriptions.Item label={t('common.weight')}>
                                        <span className="font-bold">{player.weight} {t('common.kg')}</span>
                                    </Descriptions.Item>
                                )}
                            </Descriptions>
                        </Card>
                    )}

                    {visibility.achievements && player.achievements && player.achievements.length > 0 && (
                        <Card
                            title={t('players.achievements_title')}
                            bordered={false}
                            className="shadow-sm rounded-xl"
                        >
                            <ul className="pl-0 list-none m-0">
                                {achievementsList.map((ach, index) => (
                                    <li key={index} className="flex gap-3 mb-4 last:mb-0 group">
                                        <div className="mt-1">
                                            <DoubleRightOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} className="text-gold-500 group-hover:translate-x-1 transition-transform" />
                                        </div>
                                        <Text className="text-base text-gray-700">{ach}</Text>
                                    </li>
                                ))}
                            </ul>
                        </Card>
                    )}
                </Col>
            </Row>
        </div >
    );
};
