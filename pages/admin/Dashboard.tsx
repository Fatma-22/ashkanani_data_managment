import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Space, Typography, Spin, Select, Grid } from 'antd';
import {
  UserOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  DollarOutlined,
} from '@ant-design/icons';
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
import { mockDashboardApi } from '../../services/mockApi';
import { DashboardStats, MarketValueDistribution, ContractStatusData, ContractExpiryData, Sport } from '../../types';
import { formatCurrency } from '../../utils/helpers';
import { useTranslation } from 'react-i18next';

const { Title, Text } = Typography;
const { Option } = Select;

export const Dashboard: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalPlayers: 0,
    activeContracts: 0,
    expiringSoon: 0,
    totalMarketValue: 0,
  });
  const [marketValueDist, setMarketValueDist] = useState<MarketValueDistribution[]>([]);
  const [contractStatus, setContractStatus] = useState<ContractStatusData[]>([]);
  const [contractExpiry, setContractExpiry] = useState<ContractExpiryData[]>([]);
  const [selectedSport, setSelectedSport] = useState<Sport | 'All'>('All');

  useEffect(() => {
    loadDashboardData();
  }, [selectedSport]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [statsData, marketData, statusData, expiryData] = await Promise.all([
        mockDashboardApi.getStats(selectedSport),
        mockDashboardApi.getMarketValueDistribution(selectedSport),
        mockDashboardApi.getContractStatusData(selectedSport),
        mockDashboardApi.getContractExpiryTimeline(selectedSport),
      ]);

      setStats(statsData);
      setMarketValueDist(marketData);
      setContractStatus(statusData);
      setContractExpiry(expiryData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#1e40af', '#059669', '#f59e0b', '#dc2626', '#8b5cf6'];
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="fade-in pb-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <Title level={isMobile ? 3 : 2} style={{ margin: 0 }}>{t('admin.dashboard.title')}</Title>
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
                prefix={<UserOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} style={{ color: '#1e40af' }} />}
                valueStyle={{ color: '#1e40af' }}
                loading={loading}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="card-hover">
              <Statistic
                title={t('admin.dashboard.active_contracts')}
                value={stats.activeContracts}
                prefix={<FileTextOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} style={{ color: '#059669' }} />}
                valueStyle={{ color: '#059669' }}
                loading={loading}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="card-hover">
              <Statistic
                title={t('admin.dashboard.expiring_soon')}
                value={stats.expiringSoon}
                prefix={<ClockCircleOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} style={{ color: '#f59e0b' }} />}
                valueStyle={{ color: '#f59e0b' }}
                suffix={<span className="text-xs font-normal text-slate-400 ml-1"> {t('admin.dashboard.contracts_suffix')}</span>}
                loading={loading}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="card-hover">
              <Statistic
                title={t('admin.dashboard.market_value')}
                value={formatCurrency(stats.totalMarketValue, i18n.language)}
                prefix={<DollarOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} style={{ color: '#eab308' }} />}
                valueStyle={{
                  color: '#f59e0b',
                  fontWeight: 800
                }}
                loading={loading}
              />
            </Card>
          </Col>
        </Row>

        {/* Charts Row 1 */}
        <Row gutter={[16, 16]}>
          {/* Market Value Distribution */}
          <Col xs={24} lg={12}>
            <Card title={t('admin.dashboard.market_dist_title', { defaultValue: 'Market Value Distribution' })} className="card-hover">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={marketValueDist}
                    dataKey="count"
                    nameKey="range"
                    cx="50%"
                    cy="50%"
                    outerRadius={screens.xs ? 80 : 100}
                    label={screens.xs ? false : (entry) => i18n.language === 'ar' ? `${entry.count} :${entry.range}` : `${entry.range}: ${entry.count}`}
                  >
                    {marketValueDist.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </Col>

          {/* Contract Status Breakdown */}
          <Col xs={24} lg={12}>
            <Card
              title={t('admin.dashboard.contract_status_title')}
              className="card-hover"
              loading={loading}
            >
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
                    fill="#1e40af"
                    radius={[4, 4, 0, 0]}
                    barSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Col>
        </Row>

        {/* Charts Row 2 */}
        <Row gutter={[16, 16]}>
          {/* Contract Expiry Timeline */}
          <Col xs={24}>
            <Card
              title={t('admin.dashboard.expiry_timeline_title')}
              className="card-hover"
              loading={loading}
            >
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={contractExpiry}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: '10px' }} />
                  <Line
                    name={t('common.count')}
                    type="monotone"
                    dataKey="count"
                    stroke="#f59e0b"
                    strokeWidth={3}
                    dot={{ fill: '#f59e0b', r: 4, strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </Col>
        </Row>
      </Space>
    </div >
  );
};
