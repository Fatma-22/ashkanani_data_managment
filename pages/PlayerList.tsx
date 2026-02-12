import { useEffect, useState, FC } from 'react';
import { useTranslation } from 'react-i18next';
import { Row, Col, Typography, Radio, Space, Empty, Spin, Pagination } from 'antd';
import { AppstoreOutlined, UnorderedListOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { Player, PlayerFilters } from '../types';
import { mockPlayerApi } from '../services/mockApi';
import PlayerCard from '../components/PlayerCard';
import SearchFilters from '../components/SearchFilters';

const { Title } = Typography;

export const PlayerList: FC = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [players, setPlayers] = useState<Partial<Player>[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [filters, setFilters] = useState<PlayerFilters>({});
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(8);

    useEffect(() => {
        loadPlayers();
    }, [filters, page, pageSize]);

    // Reset to page 1 when filters change
    useEffect(() => {
        setPage(1);
    }, [filters]);

    const loadPlayers = async () => {
        setLoading(true);
        try {
            const { players: data, total: count } = await mockPlayerApi.getPublicPlayers(filters, page, pageSize);
            setPlayers(data);
            setTotal(count);
        } catch (error) {
            console.error('Failed to load players:', error);
        } finally {
            setLoading(false);
        }
    };

    // Get unique values for filters (for show if needed, though advanced filters are hidden)
    // Note: In a real app, these would come from a separate static API or aggregate query
    const nationalities = ['Egypt', 'France', 'Morocco', 'Algeria', 'Senegal', 'Ghana'];
    const clubs = ['Liverpool FC', 'Al-Ittihad', 'Paris Saint-Germain', 'Al-Ahli', 'Galatasaray', 'Al-Nassr', 'Al-Hilal', 'Arsenal FC'];

    return (
        <div className="fade-in" style={{ padding: '24px', maxWidth: 1400, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
                <Title level={1}>{t('players.directory_title', { defaultValue: 'Player Directory' })}</Title>
                <p style={{ fontSize: 16, color: '#666' }}>
                    {t('players.directory_subtitle', { defaultValue: 'Discover our talented roster of professional players' })}
                </p>
            </div>

            <Space direction="vertical" size="large" style={{ width: '100%' }}>
                {/* Simplified Filters for Public */}
                <SearchFilters
                    filters={filters}
                    onChange={setFilters}
                    availableNationalities={nationalities}
                    availableClubs={clubs}
                    isPublic={true}
                />

                {/* View Mode Toggle */}
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Radio.Group
                        value={viewMode}
                        onChange={(e) => setViewMode(e.target.value)}
                        buttonStyle="solid"
                    >
                        <Radio.Button value="grid">
                            <AppstoreOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} /> {t('common.view_grid', { defaultValue: 'Grid' })}
                        </Radio.Button>
                        <Radio.Button value="list">
                            <UnorderedListOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} /> {t('common.view_list', { defaultValue: 'List' })}
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
                        description={t('players.no_players_found', { defaultValue: 'No players found' })}
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
                                    onClick={() => navigate(`/players/${player.id}`)}
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
                                onClick={() => navigate(`/players/${player.id}`)}
                            />
                        ))}
                    </div>
                )}

                {/* Pagination */}
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
            </Space>
        </div>
    );
};
