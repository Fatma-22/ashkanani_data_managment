import { useEffect, useState, FC } from 'react';
import { Row, Col, Typography, Space, Radio, Empty, Spin, Button, Card, Pagination } from 'antd';
import { useTranslation } from 'react-i18next';
import { DownloadOutlined, AppstoreOutlined, UnorderedListOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Player, PlayerFilters } from '../../types';
import { mockPlayerApi } from '../../services/mockApi';
import { translateToArabic } from '../../utils/helpers';
import PlayerCard from '../../components/PlayerCard';
import SearchFilters from '../../components/SearchFilters';

const { Title } = Typography;

export const AgentPlayers: FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [players, setPlayers] = useState<Player[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filters, setFilters] = useState<PlayerFilters>({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  useEffect(() => {
    loadPlayers();
  }, [filters, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [filters]);

  const loadPlayers = async () => {
    setLoading(true);
    try {
      // In a real app, the API would handle pagination and and agent filtering
      const allPlayers = await mockPlayerApi.getAll(filters);
      const assignedPlayers = user?.assignedPlayerIds
        ? allPlayers.filter(p => user.assignedPlayerIds?.includes(p.id))
        : allPlayers;

      setTotal(assignedPlayers.length);
      const startIndex = (page - 1) * pageSize;
      setPlayers(assignedPlayers.slice(startIndex, startIndex + pageSize));
    } catch (error) {
      console.error('Failed to load players:', error);
    } finally {
      setLoading(false);
    }
  };

  const nationalities = Array.from(new Set(players.map(p => p.nationality)));
  const clubs = Array.from(new Set(players.map(p => p.club)));

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>{t('agent_dashboard.assigned_players_title')}</Title>
        <p style={{ fontSize: 16, color: '#666' }}>
          {t('agent_dashboard.assigned_players_subtitle')}
        </p>
      </div>

      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Filters */}
        <SearchFilters
          filters={filters}
          onChange={setFilters}
          availableNationalities={nationalities}
          availableClubs={clubs}
        />

        {/* View Mode Toggle & Stats */}
        <Card>
          <Row justify="space-between" align="middle">
            <Col>
              <Space size="large">
                <div>
                  <div style={{ fontSize: 24, fontWeight: 'bold', color: '#01153e' }}>
                    {total}
                  </div>
                  <div style={{ color: '#666' }}>{t('agent_dashboard.assigned_players')}</div>
                </div>
                <div>
                  <div style={{ fontSize: 24, fontWeight: 'bold', color: '#01153e' }}>
                    {players.filter(p => p.dealStatus === 'Signed').length}
                  </div>
                  <div style={{ color: '#666' }}>{t('agent_dashboard.active_deals')}</div>
                </div>
              </Space>
            </Col>
            <Col>
              <Radio.Group
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value)}
                buttonStyle="solid"
              >
                <Radio.Button value="grid">
                  <AppstoreOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} /> {t('common.view_grid')}
                </Radio.Button>
                <Radio.Button value="list">
                  <UnorderedListOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} /> {t('common.view_list')}
                </Radio.Button>
              </Radio.Group>
            </Col>
          </Row>
        </Card>

        {/* Players Display */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <Spin size="large" />
          </div>
        ) : total === 0 ? (
          <Empty
            description={t('agent_dashboard.no_assigned_players')}
            style={{ padding: '60px 0' }}
          />
        ) : (
          <>
            {viewMode === 'grid' ? (
              <Row gutter={[16, 16]}>
                {players.map((player) => (
                  <Col key={player.id} xs={24} sm={12} md={8} lg={6}>
                    <PlayerCard
                      player={player}
                      variant="grid"
                      onClick={() => navigate(`/players/${player.id}`)}
                    />
                  </Col>
                ))}
              </Row>
            ) : (
              <div>
                {players.map((player) => (
                  <div key={player.id} style={{ marginBottom: 16 }}>
                    <PlayerCard
                      player={player}
                      variant="list"
                      onClick={() => navigate(`/players/${player.id}`)}
                    />
                  </div>
                ))}
              </div>
            )}

            <div style={{ textAlign: 'center', marginTop: 40 }}>
              <Pagination
                current={page}
                pageSize={pageSize}
                total={total}
                onChange={(p, ps) => {
                  setPage(p);
                  setPageSize(ps);
                }}
                showSizeChanger
                pageSizeOptions={['4', '8', '12', '24']}
              />
            </div>
          </>
        )}
      </Space>
    </div>
  );
};
