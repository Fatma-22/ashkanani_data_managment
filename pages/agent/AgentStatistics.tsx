import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Typography, Statistic, Spin, Tag, Button, Select, Space } from 'antd';
import { useTranslation } from 'react-i18next';
import {
    UserOutlined,
    DollarOutlined,
    CheckCircleOutlined,
    PieChartOutlined,
    AreaChartOutlined,
    BarChartOutlined,
    TrophyOutlined
} from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import { mockPlayerApi } from '../../services/mockApi';
import { Player, Sport } from '../../types';
import { translateToArabic } from '../../utils/helpers';

const { Title, Text } = Typography;
const { Option } = Select;

export const AgentStatistics: React.FC = () => {
    const { t, i18n } = useTranslation();
    const { user } = useAuth();
    const [players, setPlayers] = useState<Player[]>([]);
    const [filteredPlayers, setFilteredPlayers] = useState<Player[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSport, setSelectedSport] = useState<Sport | 'All'>('All');

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (selectedSport === 'All') {
            setFilteredPlayers(players);
        } else {
            setFilteredPlayers(players.filter(p => p.sport === selectedSport));
        }
    }, [selectedSport, players]);

    const loadData = async () => {
        setLoading(true);
        try {
            const allPlayers = await mockPlayerApi.getAll();
            const myPlayers = user?.assignedPlayerIds
                ? allPlayers.filter(p => user.assignedPlayerIds?.includes(p.id))
                : allPlayers;
            setPlayers(myPlayers);
            setFilteredPlayers(myPlayers);
        } catch (error) {
            console.error('Failed to load stats:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="flex items-center justify-center min-h-[400px]"><Spin size="large" /></div>;
    }

    const totalValue = filteredPlayers.reduce((sum, p) => sum + p.marketValue, 0);
    const activeDeals = filteredPlayers.filter(p => p.dealStatus === 'Signed').length;

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat(i18n.language === 'ar' ? 'ar-SA' : 'en-US', {
            style: 'currency',
            currency: 'EUR',
            maximumFractionDigits: 0
        }).format(val);
    };

    return (
        <div className="fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <Title level={2}>{t('agent_dashboard.statistics_title')}</Title>
                    <Text type="secondary">{t('agent_dashboard.statistics_subtitle')}</Text>
                </div>
                <div className="w-full md:w-64">
                    <Text strong className="block mb-2 text-slate-400 uppercase text-[10px] tracking-widest">
                        {t('common.sport')}
                    </Text>
                    <Select
                        className="w-full custom-select"
                        value={selectedSport}
                        onChange={setSelectedSport}
                    >
                        <Option value="All">{t('common.all_sports')}</Option>
                        {Object.values(Sport).map(s => (
                            <Option key={s} value={s}>{t(`enums.Sport.${s}`)}</Option>
                        ))}
                    </Select>
                </div>
            </div>

            <Row gutter={[24, 24]}>
                <Col xs={24} sm={8}>
                    <Card className="shadow-sm rounded-xl border-none bg-gradient-to-br from-[#C9A24D] to-[#3F3F3F] text-white">
                        <Statistic
                            title={<span className="text-white/90">{t('agent_dashboard.total_players')}</span>}
                            value={filteredPlayers.length}
                            prefix={<UserOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
                            valueStyle={{ color: '#fff', fontWeight: 'bold' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card className="shadow-sm rounded-xl border-none">
                        <Statistic
                            title={t('agent_dashboard.total_value')}
                            value={formatCurrency(totalValue)}
                            prefix={<DollarOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
                            valueStyle={{ color: '#C9A24D', fontWeight: 'bold' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card className="shadow-sm rounded-xl border-none">
                        <Statistic
                            title={t('agent_dashboard.active_deals')}
                            value={activeDeals}
                            prefix={<CheckCircleOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
                            valueStyle={{ color: '#C9A24D', fontWeight: 'bold' }}
                        />
                    </Card>
                </Col>

                <Col xs={24} md={12}>
                    <Card title={<div className="flex items-center gap-2"><PieChartOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} /> {t('agent_dashboard.position_dist')}</div>} className="shadow-sm rounded-xl min-h-[300px]">
                        <div className="space-y-4">
                            {['Goalkeeper', 'Defender', 'Midfielder', 'Forward'].map(pos => {
                                const count = filteredPlayers.filter(p => p.position === pos).length;
                                const percent = filteredPlayers.length > 0 ? (count / filteredPlayers.length) * 100 : 0;
                                return (
                                    <div key={pos} className="space-y-1">
                                        <div className="flex justify-between text-sm">
                                            <Text strong>{t(`enums.Position.${pos}`)}</Text>
                                            <Text type="secondary">{t('agent_dashboard.players_count', { count: count })}</Text>
                                        </div>
                                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                            <div className="bg-[#C9A24D] h-full transition-all duration-1000" style={{ width: `${percent}%` }}></div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </Card>
                </Col>

                <Col xs={24} md={12}>
                    <Card title={<div className="flex items-center gap-2"><BarChartOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} /> {t('agent_dashboard.nat_breakdown')}</div>} className="shadow-sm rounded-xl min-h-[300px]">
                        <div className="space-y-4">
                            {Array.from(new Set(filteredPlayers.map(p => p.nationality))).slice(0, 5).map(nat => {
                                const count = filteredPlayers.filter(p => p.nationality === nat).length;
                                return (
                                    <div key={nat} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                        <Text strong>{i18n.language === 'ar' ? translateToArabic(nat, 'country') : nat}</Text>
                                        <Tag color="gold" className="m-0">{count}</Tag>
                                    </div>
                                );
                            })}
                            {filteredPlayers.length === 0 && <div className="text-center py-8 text-slate-300">{t('players.no_players_found')}</div>}
                        </div>
                    </Card>
                </Col>

                <Col xs={24}>
                    <Card title={<div className="flex items-center gap-2"><AreaChartOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} /> {t('agent_dashboard.dev_insight')}</div>} className="shadow-sm rounded-xl text-center py-12">
                        <div className="max-w-md mx-auto">
                            <Text type="secondary" className="block mb-4">
                                {t('agent_dashboard.u23_insight', {
                                    youngCount: filteredPlayers.filter(p => p.age < 23).length,
                                    percentage: filteredPlayers.length > 0 ? Math.round((filteredPlayers.filter(p => p.age < 23).length / filteredPlayers.length) * 100) : 0
                                })}
                            </Text>
                            <Button type="primary" style={{ background: '#C9A24D', borderColor: '#C9A24D' }} size="large" className="hover:!bg-[#B68F3F]">
                                {t('agent_dashboard.generate_report')}
                            </Button>
                        </div>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};
