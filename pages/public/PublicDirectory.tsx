import React, { useEffect, useState } from 'react';
import { Row, Col, Typography, Radio, Space, Empty, Spin } from 'antd';
import { AppstoreOutlined, UnorderedListOutlined } from '@ant-design/icons';
import { Player, PlayerFilters } from '../../types';
import { mockPlayerApi } from '../../services/mockApi';
import PlayerCard from '../../components/PlayerCard';
import SearchFilters from '../../components/SearchFilters';

const { Title } = Typography;

export const PublicDirectory: React.FC = () => {
  const [players, setPlayers] = useState<Partial<Player>[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filters, setFilters] = useState<PlayerFilters>({});

  useEffect(() => {
    loadPlayers();
  }, [filters]);

  const loadPlayers = async () => {
    setLoading(true);
    try {
      const data = await mockPlayerApi.getPublicPlayers(filters);
      setPlayers(data);
    } catch (error) {
      console.error('Failed to load players:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get unique values for filters
  const allPlayers = players as Player[];
  const nationalities = Array.from(new Set(allPlayers.map(p => p.nationality).filter(Boolean)));
  const clubs = Array.from(new Set(allPlayers.map(p => p.club).filter(Boolean)));

  return (
    <div className="fade-in" style={{ padding: '24px', maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <Title level={1}>Player Directory</Title>
        <p style={{ fontSize: 16, color: '#666' }}>
          Discover our talented roster of professional players
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

        {/* View Mode Toggle */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Radio.Group
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value)}
            buttonStyle="solid"
          >
            <Radio.Button value="grid">
              <AppstoreOutlined /> Grid
            </Radio.Button>
            <Radio.Button value="list">
              <UnorderedListOutlined /> List
            </Radio.Button>
          </Radio.Group>
        </div>

        {/* Players Display */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <Spin size="large" />
          </div>
        ) : players.length === 0 ? (
          <Empty
            description="No players found"
            style={{ padding: '60px 0' }}
          />
        ) : viewMode === 'grid' ? (
          <Row gutter={[16, 16]}>
            {players.map((player) => (
              <Col key={player.id} xs={24} sm={12} md={8} lg={6}>
                <PlayerCard
                  player={player}
                  variant="grid"
                  showActions={false}
                  onClick={() => console.log('View player:', player.id)}
                />
              </Col>
            ))}
          </Row>
        ) : (
          <div>
            {players.map((player) => (
              <PlayerCard
                key={player.id}
                player={player}
                variant="list"
                showActions={false}
                onClick={() => console.log('View player:', player.id)}
              />
            ))}
          </div>
        )}
      </Space>
    </div>
  );
};
