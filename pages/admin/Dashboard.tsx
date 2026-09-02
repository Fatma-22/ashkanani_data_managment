import React, { useEffect, useState } from 'react';
import { Spin, Row, Col, Card, Statistic, Typography, Select, Grid, Space, Tag, Divider, Tabs, Empty, Badge, Button, notification, Modal, Avatar, Table } from 'antd';
import { useNavigate } from 'react-router-dom';
import {
  UserOutlined,
  TeamOutlined,
  DollarOutlined,
  TrophyOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
  ThunderboltOutlined,
  HistoryOutlined,
} from '@ant-design/icons';
import apiClient from '../../services/api';
import { playerService } from '../../services/playerService';
import { Player, User, UserRole, MemberType } from '../../types';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { dashboardService } from '../../services/dashboardService';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '../../utils/helpers';
import { sportsColors } from '../../utils/theme';
import { DashboardStats, MarketValueDistribution, ContractStatusData, ContractExpiryData, Sport } from '../../types';
import dayjs from 'dayjs';
import 'dayjs/locale/ar';
import { canManageMembers } from '../../utils/permissionHelpers';
import { useAuth } from '../../context/AuthContext';

const { Title, Text } = Typography;
const { Option } = Select;

export const Dashboard: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [loadingSport, setLoadingSport] = useState(false);

  // CV Requests state
  const [requestedPlayers, setRequestedPlayers] = useState<Player[]>([]);
  const [requestedLoading, setRequestedLoading] = useState(false);
  const [requestedTotal, setRequestedTotal] = useState(0);

  // New members/analytics state
  const [recentMembers, setRecentMembers] = useState<User[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);

  useEffect(() => { loadRequestedPlayers(); }, []);

  const loadRequestedPlayers = async () => {
    setRequestedLoading(true);
    try {
      const { players: data, total: count } = await playerService.getAll({ isApproved: false } as any);
      const normalized = (data || []).map((p: any) => ({
        ...p,
        nameAr: p.name_ar || p.nameAr,
      }));
      setRequestedPlayers(normalized);
      setRequestedTotal(count || normalized.length);
    } catch { } finally { setRequestedLoading(false); }
  };

  const handleApprove = async (playerId: string) => {
    try {
      await playerService.update(playerId, { is_approved: true, is_visible: true });
      notification.success({ message: t('common.approved', { defaultValue: 'Approved' }) });
      loadRequestedPlayers();
    } catch { notification.error({ message: t('common.error', { defaultValue: 'Error' }) }); }
  };

  const [stats, setStats] = useState<DashboardStats>({
    totalPlayers: 0,
    activeContracts: 0,
    expiringSoon: 0,
    totalMarketValue: 0,
    totalDeals: 0,
    dealsThisMonth: 0,
    totalDealsAmount: 0,
    youthPlayersCount: 0,
    proPlayersCount: 0,
    contractStability: 0,
    topAgentConcentration: 0,
    signingCount: 0,
    authorizationCount: 0,
    notJoinedCount: 0,
  });
  const [marketValueDist, setMarketValueDist] = useState<MarketValueDistribution[]>([]);
  const [dealTypeDist, setDealTypeDist] = useState<{ type: string, count: number }[]>([]);
  const [contractStatus, setContractStatus] = useState<ContractStatusData[]>([]);
  const [contractExpiry, setContractExpiry] = useState<ContractExpiryData[]>([]);
  const [selectedSport, setSelectedSport] = useState<Sport | 'All'>('All');

  useEffect(() => {
    loadDashboardData();
  }, [selectedSport]);

  const loadDashboardData = async () => {
    if (loading) {
      setLoading(true);
    } else {
      setLoadingSport(true);
    }

    try {
      const sportParam = selectedSport === 'All' ? undefined : selectedSport;
      const [statsData, marketData, statusData, expiryData, dealTypeData] = await Promise.all([
        dashboardService.getStats({ sport: sportParam }),
        dashboardService.getMarketValueDistribution({ sport: sportParam }),
        dashboardService.getContractStatusData({ sport: sportParam }),
        dashboardService.getContractExpiryTimeline({ sport: sportParam }),
        dashboardService.getDealTypeStats({ sport: sportParam }),
      ]);

      setStats(statsData);
      setMarketValueDist(marketData);
      setContractStatus(statusData);
      setContractExpiry(expiryData);
      setDealTypeDist(dealTypeData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
      setLoadingSport(false);
    }
  };

  const loadRecentMembers = async () => {
    if (!canManageMembers(user) && user?.role !== UserRole.OWNER) return;
    
    setMembersLoading(true);
    try {
      const response: any = await apiClient.get('/members');
      const data = response.data?.data || response.data || (Array.isArray(response) ? response : []);
      setRecentMembers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading members:', error);
    } finally {
      setMembersLoading(false);
    }
  };

  useEffect(() => {
    loadRecentMembers();
  }, [user]);

  const COLORS = ['#C9A24D', '#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1'];
  const screens = Grid.useBreakpoint();
  
  const hasMarketData = marketValueDist.some(item => item.count > 0);
  const hasStatusData = contractStatus.some(item => item.count > 0);
  const hasExpiryData = contractExpiry.some(item => item.count > 0);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" />
      </div>
    );
  }

  const isOwner = user?.role === UserRole.OWNER;

  return (
    <div className="fade-in pb-8">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-8 gap-4">
        <div>
          <Title level={screens.xs ? 4 : 2} className="!m-0 !text-[#C9A24D] !font-black uppercase tracking-tight">{t('admin.dashboard.title')}</Title>
          <Text type="secondary" className="text-sm">{t('admin.dashboard.subtitle', { defaultValue: 'Overview of your agency activities' })}</Text>
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

      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* KPI Cards */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <Card className="card-hover">
              <Statistic
                title={t('admin.dashboard.total_players')}
                value={stats.totalPlayers}
                prefix={<UserOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} className="text-[#3F3F3F]" />}
                valueStyle={{ color: '#3F3F3F', fontWeight: 'bold' }}
                loading={loading || loadingSport}
              />
              <div className="mt-2 pt-2 border-t border-slate-100 flex flex-col gap-1">
                <div className="flex justify-between items-center text-[10px]">
                  <Text type="secondary">{t('admin.dashboard.signing_count')}</Text>
                  <Tag color="gold" className="m-0 text-[9px] font-bold border-none bg-gold-50">{stats.signingCount || 0}</Tag>
                </div>
                <div className="flex justify-between items-center text-[10px]">
                  <Text type="secondary">{t('admin.dashboard.authorization_count')}</Text>
                  <Tag color="blue" className="m-0 text-[9px] font-bold border-none bg-blue-50">{stats.authorizationCount || 0}</Tag>
                </div>
                <div className="flex justify-between items-center text-[10px]">
                  <Text type="secondary">{t('admin.dashboard.not_joined_count')}</Text>
                  <Tag color="default" className="m-0 text-[9px] font-bold border-none bg-slate-50">{stats.notJoinedCount || 0}</Tag>
                </div>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="card-hover">
              <Statistic
                title={t('admin.dashboard.active_contracts')}
                value={stats.activeContracts}
                prefix={<FileTextOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} className="text-[#52c41a]" />}
                valueStyle={{ color: '#3F3F3F', fontWeight: 'bold' }}
                loading={loading || loadingSport}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="card-hover">
              <Statistic
                title={t('admin.dashboard.expiring_soon')}
                value={stats.expiringSoon}
                prefix={<ClockCircleOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} className="text-[#faad14]" />}
                valueStyle={{ color: '#3F3F3F', fontWeight: 'bold' }}
                suffix={<span className="text-xs font-normal text-slate-400 ml-1"> {t('admin.dashboard.contracts_suffix')}</span>}
                loading={loading || loadingSport}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="card-hover">
              <Statistic
                title={t('admin.dashboard.market_value')}
                value={formatCurrency(stats.totalMarketValue)}
                prefix={<DollarOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} className="text-[#C9A24D]" />}
                valueStyle={{ color: '#C9A24D', fontWeight: 800 }}
                loading={loading || loadingSport}
              />
            </Card>
          </Col>
        </Row>

        <Tabs
          defaultActiveKey="players"
          type="card"
          className="mt-4"
          items={[
            {
              key: 'players',
              label: (
                <span className="flex items-center gap-2">
                  <UserOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />
                  {t('admin.dashboard.tabs.players')}
                </span>
              ),
              children: (
                <div className="pt-4">
                  <Row gutter={[16, 16]}>
                    <Col xs={24} lg={12}>
                      <Card
                        title={t('admin.dashboard.market_dist_title')}
                        className="card-hover"
                        loading={loading || loadingSport}
                      >
                        {hasMarketData ? (
                          <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                              <Pie
                                data={marketValueDist}
                                dataKey="count"
                                nameKey="range"
                                cx="50%"
                                cy="45%"
                                outerRadius={80}
                                innerRadius={40}
                                paddingAngle={2}
                              >
                                {marketValueDist.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip
                                contentStyle={{ direction: i18n.language === 'ar' ? 'rtl' : 'ltr' }}
                                formatter={(value, name) => [value, t(`admin.dashboard.${name}`, { defaultValue: name as string })]}
                              />
                              <Legend
                                iconType="circle"
                                formatter={(label) => label ? t(`admin.dashboard.${label}`, { defaultValue: label }) : ''}
                                wrapperStyle={{ paddingTop: '20px', direction: i18n.language === 'ar' ? 'rtl' : 'ltr' }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="flex flex-col items-center justify-center h-[300px]">
                            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('common.no_data')} />
                          </div>
                        )}
                      </Card>
                    </Col>

                    <Col xs={24} lg={12}>
                      <Card
                        title={t('admin.dashboard.contract_status_title')}
                        className="card-hover"
                        loading={loading || loadingSport}
                      >
                        {hasStatusData ? (
                          <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={contractStatus}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                              <XAxis
                                dataKey="status"
                                tickFormatter={(val) => t(`enums.ContractStatus.${val}`, { defaultValue: val })}
                                axisLine={false}
                                tickLine={false}
                              />
                              <YAxis axisLine={false} tickLine={false} />
                              <Tooltip
                                cursor={{ fill: '#f8fafc' }}
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                labelFormatter={(val) => t(`enums.ContractStatus.${val}`, { defaultValue: val })}
                              />
                              <Legend iconType="circle" wrapperStyle={{ paddingTop: '10px' }} />
                              <Bar
                                name={t('common.count')}
                                dataKey="count"
                                radius={[4, 4, 0, 0]}
                                barSize={40}
                              >
                                {contractStatus.map((entry, index) => (
                                  <Cell
                                    key={`cell-${index}`}
                                    fill={entry.status === 'ACTIVE' ? '#C9A24D' : '#3F3F3F'}
                                  />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="flex flex-col items-center justify-center h-[300px]">
                            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('common.no_data')} />
                          </div>
                        )}
                      </Card>
                    </Col>
                  </Row>
                </div>
              )
            },
            {
              key: 'deals',
              label: (
                <span className="flex items-center gap-2">
                  <TrophyOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />
                  {t('admin.dashboard.tabs.deals')}
                </span>
              ),
              children: (
                <div className="pt-4">
                  <Row gutter={[16, 16]}>
                    <Col xs={24} lg={12}>
                      <Row gutter={[16, 16]}>
                        <Col xs={24} sm={12}>
                          <Card className="card-hover border-l-4 border-l-[#C9A24D]">
                            <Statistic
                              title={t('admin.deals.total_deals')}
                              value={stats.totalDeals}
                              prefix={<TrophyOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} className="text-[#C9A24D]" />}
                              valueStyle={{ color: '#3F3F3F', fontWeight: 'bold' }}
                              loading={loading || loadingSport}
                            />
                          </Card>
                        </Col>
                        <Col xs={24} sm={12}>
                          <Card className="card-hover">
                            <Statistic
                              title={t('admin.deals.deals_this_month')}
                              value={stats.dealsThisMonth}
                              prefix={<ClockCircleOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} className="text-blue-500" />}
                              valueStyle={{ color: '#3F3F3F', fontWeight: 'bold' }}
                              loading={loading || loadingSport}
                            />
                          </Card>
                        </Col>
                        <Col xs={24}>
                          <Card className="card-hover">
                            <Statistic
                              title={t('admin.deals.total_deals_amount')}
                              value={formatCurrency(stats.totalDealsAmount)}
                              prefix={<DollarOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} className="text-green-500" />}
                              valueStyle={{ color: '#3F3F3F', fontWeight: 'bold' }}
                              loading={loading || loadingSport}
                            />
                          </Card>
                        </Col>
                      </Row>
                    </Col>

                    <Col xs={24} lg={12}>
                      <Card
                        title={t('admin.deals.deal_type_dist')}
                        className="card-hover h-full"
                        loading={loading || loadingSport}
                      >
                        <ResponsiveContainer width="100%" height={250}>
                          <BarChart data={dealTypeDist}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                            <XAxis
                              dataKey="type"
                              tickFormatter={(val) => t(`admin.deals.${val.toLowerCase()}`, { defaultValue: val })}
                              axisLine={false}
                              tickLine={false}
                            />
                            <YAxis axisLine={false} tickLine={false} />
                            <Tooltip
                              cursor={{ fill: '#f8fafc' }}
                              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                              labelFormatter={(val) => t(`admin.deals.${val.toLowerCase()}`, { defaultValue: val })}
                            />
                            <Legend iconType="circle" wrapperStyle={{ paddingTop: '10px' }} />
                            <Bar
                              name={t('common.count')}
                              dataKey="count"
                              fill="#C9A24D"
                              radius={[4, 4, 0, 0]}
                              barSize={40}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </Card>
                    </Col>
                  </Row>
                </div>
              )
            },
            ...(isOwner || canManageMembers(user) ? [
              {
                key: 'members',
                label: (
                  <span className="flex items-center gap-2">
                    <TeamOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />
                    {t('admin.dashboard.tabs.members')}
                  </span>
                ),
                children: (
                  <div className="pt-4">
                    <Row gutter={[16, 16]}>
                      <Col xs={24} sm={12} lg={6}>
                        <Card className="card-hover border-l-4 border-l-[#C9A24D]">
                          <Statistic
                            title={t('admin.dashboard.total_members')}
                            value={stats.totalMembers || 0}
                            prefix={<UserOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} className="text-[#C9A24D]" />}
                            valueStyle={{ color: '#3F3F3F', fontWeight: 'bold' }}
                            loading={loading}
                          />
                          <div className="mt-2 flex flex-col gap-1">
                             <div className="flex justify-between text-[10px]">
                                <Text type="secondary">{t('admin.members.today_registrations')}:</Text>
                                <Text strong>{recentMembers.filter(m => dayjs(m.createdAt).isSame(dayjs(), 'day')).length}</Text>
                             </div>
                             <div className="flex justify-between text-[10px]">
                                <Text type="secondary">{t('admin.members.monthly_members')}:</Text>
                                <Text strong>{recentMembers.filter(m => dayjs(m.createdAt).isSame(dayjs(), 'month')).length}</Text>
                             </div>
                          </div>
                        </Card>
                      </Col>
                      <Col xs={24} sm={12} lg={6}>
                        <Card className="card-hover border-l-4 border-l-blue-500">
                          <Statistic
                            title={t('admin.dashboard.guest_visits')}
                            value={stats.guestVisits || 0}
                            prefix={<ThunderboltOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} className="text-blue-500" />}
                            valueStyle={{ color: '#3F3F3F', fontWeight: 'bold' }}
                            loading={loading}
                          />
                          <div className="mt-2 flex flex-col gap-1">
                             <div className="flex justify-between text-[10px]">
                                <Text type="secondary">{t('admin.members.today_visits')}:</Text>
                                <Text strong>{(stats.dailyStats?.[stats.dailyStats.length - 1]?.guest || 0) + (stats.dailyStats?.[stats.dailyStats.length - 1]?.registered || 0)}</Text>
                             </div>
                          </div>
                        </Card>
                      </Col>
                      <Col xs={24} sm={12} lg={6}>
                        <Card className="card-hover border-l-4 border-l-green-500">
                          <Statistic
                            title={t('admin.dashboard.registered_visits')}
                            value={stats.registeredVisits || 0}
                            prefix={<CheckCircleOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} className="text-green-500" />}
                            valueStyle={{ color: '#3F3F3F', fontWeight: 'bold' }}
                            loading={loading}
                          />
                          <div className="mt-2 flex flex-col gap-1">
                             <div className="flex justify-between text-[10px]">
                                <Text type="secondary">{t('admin.members.monthly_visits')}:</Text>
                                <Text strong>{stats.dailyStats?.reduce((acc, curr) => acc + (curr.guest || 0) + (curr.registered || 0), 0) || 0}</Text>
                             </div>
                          </div>
                        </Card>
                      </Col>
                      <Col xs={24} sm={12} lg={6}>
                        <Card className="card-hover border-l-4 border-l-purple-500">
                          <Statistic
                            title={t('admin.dashboard.registrations')}
                            value={stats.dailyStats?.reduce((acc, curr) => acc + (curr.registrations || 0), 0) || 0}
                            prefix={<HistoryOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} className="text-purple-500" />}
                            suffix={<span className="text-xs font-normal"> / 7d</span>}
                            valueStyle={{ color: '#3F3F3F', fontWeight: 'bold' }}
                            loading={loading}
                          />
                        </Card>
                      </Col>

                      <Col xs={24} lg={14}>
                        <Card
                          title={
                            <div className="flex items-center gap-2">
                              <TeamOutlined style={{ color: '#C9A24D' }} onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />
                              <span>{t('admin.members.recent_registrations')}</span>
                            </div>
                          }
                          className="card-hover overflow-hidden"
                          styles={{ body: { padding: 0 } }}
                          extra={<Button type="link" onClick={() => navigate('/admin/members')} className="!text-[#C9A24D]">{t('common.view_details')}</Button>}
                        >
                          <Table<User>
                            dataSource={recentMembers.slice(0, 6)}
                            pagination={false}
                            loading={membersLoading}
                            rowKey="id"
                            size="middle"
                            columns={[
                              {
                                title: t('admin.members.table.name'),
                                dataIndex: 'name',
                                key: 'name',
                                render: (name, record: User) => (
                                  <div className="flex items-center gap-3">
                                    <Avatar size="small" src={record.avatar} icon={<UserOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />} />
                                    <div className="flex flex-col">
                                      <Text strong className="text-xs">{name}</Text>
                                      <Text type="secondary" className="text-[10px]">{record.email}</Text>
                                    </div>
                                  </div>
                                )
                              },
                              {
                                title: t('admin.members.table.type'),
                                dataIndex: 'memberType',
                                key: 'memberType',
                                render: (type) => (
                                  <Tag color={type === MemberType.PLAYER ? 'gold' : 'blue'} className="text-[10px] m-0 border-none font-bold">
                                    {t(`member_types.${type}`)}
                                  </Tag>
                                )
                              },
                              {
                                title: t('admin.members.registration_time'),
                                dataIndex: 'createdAt',
                                key: 'createdAt',
                                render: (date) => (
                                  <div className="flex flex-col">
                                    <Text className="text-[10px]">{dayjs(date).format('YYYY-MM-DD')}</Text>
                                    <Text type="secondary" className="text-[9px]">{dayjs(date).format('HH:mm')}</Text>
                                  </div>
                                )
                              }
                            ]}
                          />
                        </Card>
                      </Col>

                      <Col xs={24} lg={10}>
                        <Card
                          title={t('admin.dashboard.member_breakdown')}
                          className="card-hover h-full"
                          loading={loading}
                        >
                          <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                              <Pie
                                data={[
                                  { name: t('member_types.PLAYER'), value: stats.playersMemberCount || 0 },
                                  { name: t('member_types.COACH'), value: stats.coachesMemberCount || 0 },
                                  { name: t('member_types.SCOUT'), value: stats.scoutsMemberCount || 0 },
                                  { name: t('member_types.CLUB'), value: stats.clubsMemberCount || 0 },
                                  { name: t('member_types.ADMINISTRATOR'), value: stats.administratorsMemberCount || 0 },
                                  { name: t('member_types.REFEREE'), value: stats.refereesMemberCount || 0 },
                                  { name: t('member_types.PHOTOGRAPHER'), value: stats.photographersMemberCount || 0 },
                                  { name: t('member_types.OTHER'), value: stats.othersMemberCount || 0 },
                                ].filter(d => d.value > 0)}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius={70}
                                innerRadius={35}
                                paddingAngle={5}
                              >
                                {COLORS.map((_, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip />
                              <Legend layout="vertical" align="right" verticalAlign="middle" iconType="circle" />
                            </PieChart>
                          </ResponsiveContainer>
                        </Card>
                      </Col>

                      <Col xs={24}>
                        <Card
                          title={
                            <div className="flex items-center gap-2">
                              <ThunderboltOutlined style={{ color: '#1890ff' }} onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />
                              <span>{t('admin.dashboard.daily_activity')}</span>
                            </div>
                          }
                          className="card-hover"
                          loading={loading}
                        >
                          <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={stats.dailyStats || []}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                              <XAxis
                                dataKey="date"
                                axisLine={false}
                                tickLine={false}
                                tickFormatter={(val) => dayjs(val).locale(i18n.language).format('DD MMM')}
                              />
                              <YAxis axisLine={false} tickLine={false} />
                              <Tooltip
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                              />
                              <Legend iconType="circle" />
                              <Line
                                name={t('admin.dashboard.guest_visits')}
                                type="monotone"
                                dataKey="guest"
                                stroke="#3F3F3F"
                                strokeWidth={2}
                                dot={{ r: 3 }}
                              />
                              <Line
                                name={t('admin.dashboard.registered_visits')}
                                type="monotone"
                                dataKey="registered"
                                stroke="#1890ff"
                                strokeWidth={2}
                                dot={{ r: 3 }}
                              />
                              <Line
                                name={t('admin.dashboard.registrations')}
                                type="monotone"
                                dataKey="registrations"
                                stroke="#C9A24D"
                                strokeWidth={3}
                                dot={{ r: 4, fill: '#C9A24D' }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </Card>
                      </Col>
                    </Row>
                  </div>
                )
              }
            ] : [])
          ]}
        />
      </Space>
    </div>
  );
};
