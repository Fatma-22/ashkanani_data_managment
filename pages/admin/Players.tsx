import { useEffect, useState, FC, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  InputNumber,
  Switch,
  message,
  Typography,
  Tooltip,
  Row,
  Col,
  Tag,
  Card,
  Select,
  Upload,
  Divider,
  Avatar,
  List,
  DatePicker,
  Radio,
  AutoComplete,
  Tabs,
  Badge,
  Checkbox,
  Spin,
  Empty,
  Pagination,
  Rate,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  SearchOutlined,
  UploadOutlined,
  UserOutlined,
  CheckCircleOutlined,
  FilePdfOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { Player, Position, PreferredFoot, DealStatus, PlayerFilters, Sport, ProfileRole, ContractStatus, UserRole } from '../../types';
import { useTranslation } from 'react-i18next';
import { formatCurrency, formatDate, getFormattedDuration, translateText, getDealStatusTranslation } from '../../utils/helpers';
import StatusBadge from '../../components/StatusBadge';
import SearchFilters from '../../components/SearchFilters';
import showConfirmModal from '../../components/ConfirmModal';
import { playerService } from '../../services/playerService';
import { translateToArabic } from '../../utils/translation';
import { CLUB_MAP } from '../../utils/translation';
import { metaService } from '../../services/metaService';
import { useAuth } from '../../context/AuthContext';
import { canAddPlayers, canEditPlayers, canDeletePlayers } from '../../utils/permissionHelpers';
import PlayerCard from '../../components/PlayerCard';
import PdfExportModal from '../../components/PdfExportModal';
import PlayerEditModal from '../../components/PlayerEditModal';

const { Title, Text } = Typography;


import { useStickyState } from '../../utils/hooks';

export const Players: FC = () => {
  const [nationalities, setNationalities] = useState<any[]>([]);
  const { t, i18n } = useTranslation();

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
  }, [i18n.language]);
  const clubs = Object.keys(CLUB_MAP);
  const navigate = useNavigate();

  const { user } = useAuth();

  // Determine the base path based on user role
  const basePath = user?.role === UserRole.OWNER ? '/owner' : '/admin';

  const [players, setPlayers] = useState<Player[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);

  const [filters, setFilters] = useStickyState<any>({ search: '' }, 'Admin_Players_filters');
  const [page, setPage] = useStickyState(1, 'Admin_Players_page');
  const [pageSize, setPageSize] = useStickyState(8, 'Admin_Players_pageSize');
  const [activeTab, setActiveTab] = useStickyState('ALL', 'Admin_Players_activeTab');
  
  const [pdfModalVisible, setPdfModalVisible] = useState(false);
  const [allFilteredPlayers, setAllFilteredPlayers] = useState<Player[]>([]);
  const [isFetchingAll, setIsFetchingAll] = useState(false);

  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
        isFirstRender.current = false;
        return;
    }
    setPage(1);
  }, [activeTab, filters, pageSize]);

  useEffect(() => {
    fetchPlayers();
  }, [filters, page, pageSize, activeTab]);

  const fetchPlayers = async () => {
    setLoading(true);
    try {
      const queryFilters = {
        ...filters,
        // When contractNature is active, skip contractStatus so the nature filter works across tabs
        // (e.g. TERMINATION players are excluded from ACTIVE status in the backend)
        contractStatus: (filters.contractNature && filters.contractNature.length > 0 || activeTab === 'ALL') 
          ? undefined 
          : (activeTab === 'ACTIVE' 
            ? [ContractStatus.ACTIVE, ContractStatus.PENDING, ContractStatus.NEGOTIATION] 
            : [ContractStatus.EXPIRED])
      };
      const { players: data, total: count } = await playerService.getAll(queryFilters, page, pageSize);
      setPlayers(data);
      setTotal(count);
    } catch (error) {
      message.error(t('common.error_loading_players', { defaultValue: 'Failed to load players' }));
    } finally {
      setLoading(false);
    }
  };

  const loadPlayers = fetchPlayers; // Alias for compatibility with existing calls

  const fetchAllForPdf = async () => {
    setIsFetchingAll(true);
    try {
      const queryFilters = {
        ...filters,
        contractStatus: (filters.contractNature && filters.contractNature.length > 0 || activeTab === 'ALL') 
          ? undefined 
          : (activeTab === 'ACTIVE' 
            ? [ContractStatus.ACTIVE, ContractStatus.PENDING, ContractStatus.NEGOTIATION] 
            : [ContractStatus.EXPIRED])
      };
      const { players: data } = await playerService.getAll(queryFilters, 1, 10000); // Fetch max (10000)
      setAllFilteredPlayers(data);
      setPdfModalVisible(true);
    } catch (error) {
      message.error(t('common.error_loading_players'));
    } finally {
      setIsFetchingAll(false);
    }
  };


  const handleCreate = () => {
    setEditingPlayer(null);
    setSelectedRole(ProfileRole.PLAYER);
    setEditModalVisible(true);
  };

  const [selectedRole, setSelectedRole] = useState<ProfileRole>(ProfileRole.PLAYER);

  const handleEdit = async (player: Player) => {
    setEditingPlayer(player);
    setSelectedRole(player.role || ProfileRole.PLAYER);
    setEditModalVisible(true);
  };
  const handleDelete = (player: Player) => {
    showConfirmModal({
      title: t('messages.confirm_delete_title'),
      content: t('admin.players.delete_player_confirm', { name: player.name }),
      okText: t('common.delete'),
      okType: 'danger',
      onConfirm: async () => {
        try {
          await playerService.delete(player.id);
          message.success(t('messages.success_delete'));
          loadPlayers();
        } catch (error) {
          message.error(t('messages.error_delete'));
        }
      },
    });
  };


  return (
    <div className="fade-in">
      <Row gutter={[16, 16]} justify="space-between" align="middle" className="mb-6">
        <Col xs={24} md={12}>
          <Title level={2} className="!m-0">{t('admin.players.management_title')}</Title>
        </Col>
        <Col xs={24} md={12} className="flex md:justify-end">
          <Space wrap className="w-full sm:w-auto">
            <Button
              icon={<FilePdfOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
              onClick={fetchAllForPdf}
              loading={isFetchingAll}
              size="large"
              className="flex-1 sm:flex-none flex items-center justify-center"
            >
              {t('common.pdf_export.export_btn', { defaultValue: 'Export PDF' })}
            </Button>
            {canAddPlayers(user) && (
              <Button
                type="primary"
                icon={<PlusOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
                onClick={handleCreate}
                size="large"
                className="flex-1 sm:flex-none"
                style={{ background: '#3F3F3F', borderColor: '#3F3F3F' }}
              >
                {t('admin.players.add_player_btn', { defaultValue: 'Add Player' })}
              </Button>
            )}
          </Space>
        </Col>
      </Row>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        className="custom-tabs"
        items={[
          {
            key: 'ALL',
            label: t('players.all_tab'),
          },
          {
            key: 'ACTIVE',
            label: t('players.active_tab'),
          },
          {
            key: 'EXPIRED',
            label: t('players.archive_tab'),
          },
        ]}
      />

      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Search & Filters */}
        <SearchFilters
          filters={filters}
          onChange={setFilters}
          availableNationalities={nationalities}
          availableClubs={clubs}
          hideRemainingDuration={activeTab === 'EXPIRED'}
        />

        {/* Players Grid Display */}
        <div className="relative min-h-[400px]">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Spin size="large" />
            </div>
          ) : players.length === 0 ? (
            <Empty description={t('players.no_players_found')} style={{ padding: '60px 0' }} />
          ) : (
            <>
              <Row gutter={[12, 16]}>
                {players.map((player) => (
                  <Col key={player.id} xs={12} sm={12} md={8} lg={8} xl={6}>
                    <PlayerCard
                      player={player}
                      variant="grid"
                      showActions={true}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onClick={() => navigate(`${basePath}/players/${player.id}`)}
                    />
                  </Col>
                ))}
              </Row>
              <div className="flex justify-center mt-12 pb-8">
                <Pagination
                  current={page}
                  pageSize={pageSize}
                  total={total}
                  onChange={(p, ps) => {
                    setPage(p);
                    setPageSize(ps);
                  }}
                  showTotal={(total) => `${t('common.total')}: ${total}`}
                  showSizeChanger
                  pageSizeOptions={['6', '12', '24', '48']}
                />
              </div>
            </>
          )}
        </div>
      </Space>

      {/* Create/Edit Modal */}
      <PlayerEditModal
        open={editModalVisible}
        onCancel={() => {
          setEditModalVisible(false);
          setEditingPlayer(null);
        }}
        onSuccess={() => {
          setEditModalVisible(false);
          setEditingPlayer(null);
          // Reload data
          setPlayers([]);
          setTotal(0);
          fetchPlayers();
        }}
        editingPlayer={editingPlayer}
        initialRole={selectedRole}
      />

      {/* PDF Export Modal */}
      <PdfExportModal
        open={pdfModalVisible}
        onClose={() => setPdfModalVisible(false)}
        players={allFilteredPlayers}
        totalCount={total}
        filterSummary={(() => {
          const parts: string[] = [];
          if (filters.search) parts.push(`${t('common.search', { defaultValue: 'Search' })}: "${filters.search}"`);
          if (filters.nationality) parts.push(`${t('common.nationality', { defaultValue: 'Nationality' })}: ${filters.nationality}`);
          if (filters.sport) parts.push(`${t('common.sport', { defaultValue: 'Sport' })}: ${t(`enums.Sport.${filters.sport}`, { defaultValue: filters.sport })}`);
          if (filters.positions?.length) parts.push(`${t('common.position', { defaultValue: 'Position' })}: ${filters.positions.map((p: string) => t(`enums.Position.${p}`, { defaultValue: p })).join(', ')}`);
          if (filters.club) parts.push(`${t('common.club', { defaultValue: 'Club' })}: ${filters.club}`);
          if (filters.contractNature) parts.push(`${t('common.contract_nature', { defaultValue: 'Contract Nature' })}: ${t(`enums.ContractNature.${filters.contractNature}`, { defaultValue: filters.contractNature })}`);
          if (filters.minAge || filters.maxAge) parts.push(`${t('common.age', { defaultValue: 'Age' })}: ${filters.minAge || '?'} - ${filters.maxAge || '?'}`);
          if (filters.minMarketValue || filters.maxMarketValue) parts.push(`${t('common.market_value', { defaultValue: 'Market Value' })}: ${filters.minMarketValue || 0} - ${filters.maxMarketValue || '∞'} KWD`);
          return parts.length > 0 ? parts.join(' | ') : undefined;
        })()}
      />
    </div>
  );
};

export default Players;
