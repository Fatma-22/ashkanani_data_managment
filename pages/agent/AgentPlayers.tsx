import { useEffect, useState, FC } from 'react';
import { Row, Col, Typography, Space, Empty, Spin, Card, Pagination } from 'antd';
import { useTranslation } from 'react-i18next';
import { TeamOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Player, PlayerFilters, DealStatus } from '../../types';
import { playerService } from '../../services/playerService';
import PlayerCard from '../../components/PlayerCard';
import SearchFilters from '../../components/SearchFilters';
import { CLUB_MAP } from '../../utils/translation';
import { metaService } from '../../services/metaService';
import { useStickyState } from '../../utils/hooks';
import { useRef } from 'react';

const { Title } = Typography;

export const AgentPlayers: FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [players, setPlayers] = useState<Player[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useStickyState<PlayerFilters>({}, 'AgentPlayers_filters');
  const [page, setPage] = useStickyState(1, 'AgentPlayers_page');
  const [pageSize, setPageSize] = useStickyState(8, 'AgentPlayers_pageSize');
  const isFirstRender = useRef(true);

  useEffect(() => {
    loadPlayers();
  }, [filters, page, pageSize]);

  useEffect(() => {
    if (isFirstRender.current) {
        isFirstRender.current = false;
        return;
    }
    setPage(1);
  }, [filters]);

  const loadPlayers = async () => {
    setLoading(true);
    try {
      // Backend playerService.getAll already filters by agent if authenticated
      const { players: myPlayers, total: tCount } = await playerService.getAll(filters, page, pageSize);
      const normalized = myPlayers.map((p: any) => ({
        ...p,
        nameAr: p.name_ar || p.nameAr,
        nationalityAr: p.nationality_ar || p.nationalityAr,
        clubAr: p.club_ar || p.clubAr,
        dealStatus: p.deal_status || p.dealStatus,
        marketValue: p.market_value || p.marketValue,
        nationalId: p.national_id || p.nationalId,
        jerseyNumber: p.jersey_number || p.jerseyNumber,
        bioAr: p.bio_ar || p.bioAr,
        notesAr: p.notes_ar || p.notesAr,
      }));
      setPlayers(normalized);
      setTotal(tCount);
    } catch (error) {
      console.error('Failed to load players:', error);
    } finally {
      setLoading(false);
    }
  };

  const [nationalities, setNationalities] = useState<{ value: string; label: string }[]>([]);
  useEffect(() => {
    const fetchNationalities = async () => {
      try {
        const nats = await metaService.getNationalities();
        setNationalities(nats);
      } catch (e) {
        setNationalities([]);
      }
    };
    fetchNationalities();
  }, []);
  const clubs = Object.keys(CLUB_MAP);

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>{t('agent_dashboard.assigned_players_title')}</Title>
        <p style={{ fontSize: 16, color: '#C9A24D', fontWeight: 500 }}>
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
                  <div style={{ fontSize: 24, fontWeight: 'bold', color: '#3F3F3F' }}>
                    {total}
                  </div>
                  <div style={{ color: '#C9A24D', fontWeight: 600 }}>{t('agent_dashboard.assigned_players')}</div>
                </div>
                <div>
                  <div style={{ fontSize: 24, fontWeight: 'bold', color: '#3F3F3F' }}>
                    {players.filter(p => p.dealStatus === DealStatus.SIGNED).length}
                  </div>
                  <div style={{ color: '#C9A24D', fontWeight: 600 }}>{t('agent_dashboard.active_deals')}</div>
                </div>
              </Space>
            </Col>
            <Col>
              {/* Toggle Removed */}
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
            <div>
            <Row gutter={[24, 40]}>
              {players.map((player) => (
                <Col key={player.id} xs={12} sm={12} md={8} lg={6}>
                  <PlayerCard
                    player={player}
                    variant="grid"
                    showActions={false}
                    onClick={() => navigate(`/agent/players/${player.id}`)}
                  />
                </Col>
              ))}
            </Row>
            </div>
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
    </div >
  );
};
