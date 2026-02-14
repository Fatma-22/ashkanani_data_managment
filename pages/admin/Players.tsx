import { useEffect, useState, FC } from 'react';
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
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  SearchOutlined,
  UploadOutlined,
  UserOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { Player, Position, PreferredFoot, DealStatus, PlayerFilters, Sport, ProfileRole, ContractStatus } from '../../types';
import { mockPlayerApi } from '../../services/mockApi';
import { formatCurrency } from '../../utils/helpers';
import StatusBadge from '../../components/StatusBadge';
import SearchFilters from '../../components/SearchFilters';
import showConfirmModal from '../../components/ConfirmModal';
import { useTranslation } from 'react-i18next';

const { Title } = Typography;

export const Players: FC = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [players, setPlayers] = useState<Player[]>([]);
  const [filteredPlayers, setFilteredPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [form] = Form.useForm();
  const [filters, setFilters] = useState<PlayerFilters>({});

  useEffect(() => {
    loadPlayers();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, players]);

  const loadPlayers = async () => {
    setLoading(true);
    try {
      const data = await mockPlayerApi.getAll();
      setPlayers(data);
      setFilteredPlayers(data);
    } catch (error) {
      message.error('Failed to load players');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = async () => {
    setLoading(true);
    try {
      const data = await mockPlayerApi.getAll(filters);
      setFilteredPlayers(data);
    } catch (error) {
      message.error('Failed to apply filters');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingPlayer(null);
    form.resetFields();
    form.setFieldsValue({
      role: ProfileRole.PLAYER,
      visibility: {
        nationality: true,
        age: true,
        dateOfBirth: false,
        position: true,
        club: true,
        marketValue: true,
        preferredFoot: true,
        height: true,
        weight: true,
        previousClubs: true,
        dealStatus: true,
        contractInfo: false,
        photos: true,
        achievements: true,
        stats: true,
      },
      isVisible: true,
    });
    setModalVisible(true);
  };

  const [selectedRole, setSelectedRole] = useState<ProfileRole>(ProfileRole.PLAYER);

  useEffect(() => {
    if (editingPlayer) {
      setSelectedRole(editingPlayer.role || ProfileRole.PLAYER);
    } else {
      setSelectedRole(ProfileRole.PLAYER);
    }
  }, [editingPlayer, modalVisible]);

  const handleEdit = (player: Player) => {
    setEditingPlayer(player);
    form.setFieldsValue({
      ...player,
      dateOfBirth: player.dateOfBirth ? dayjs(player.dateOfBirth) : undefined,
    });
    setModalVisible(true);
  };

  const handleDelete = (player: Player) => {
    showConfirmModal({
      title: t('players.delete_player_title', { defaultValue: 'Delete Player' }),
      content: t('players.delete_player_confirm', { defaultValue: `Are you sure you want to delete ${player.name}? This action cannot be undone.`, name: player.name }),
      okText: t('common.delete'),
      okType: 'danger',
      onConfirm: async () => {
        try {
          await mockPlayerApi.delete(player.id);
          message.success('Player deleted successfully');
          loadPlayers();
        } catch (error) {
          message.error('Failed to delete player');
        }
      },
    });
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (editingPlayer) {
        await mockPlayerApi.update(editingPlayer.id, {
          ...values,
          dateOfBirth: values.dateOfBirth ? values.dateOfBirth.format('YYYY-MM-DD') : undefined,
        });
        message.success('Player updated successfully');
      } else {
        await mockPlayerApi.create({
          ...values,
          dateOfBirth: values.dateOfBirth ? values.dateOfBirth.format('YYYY-MM-DD') : undefined,
          photos: values.photos || [],
          documents: values.documents || [],
          previousClubs: values.previousClubs || [],
        });
        message.success('Player created successfully');
      }

      setModalVisible(false);
      loadPlayers();
    } catch (error) {
      message.error('Failed to save player');
    }
  };

  const nationalities = Array.from(new Set(players.map(p => p.nationality)));
  const clubs = Array.from(new Set(players.map(p => p.club)));

  return (
    <div className="fade-in">
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Title level={2}>{t('admin.players.management_title')}</Title>
        </Col>
        <Col>
          <Button
            type="primary"
            icon={<PlusOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
            onClick={handleCreate}
            size="large"
            style={{ background: '#3F3F3F' }}
          >
            {t('admin.players.add_player_btn', { defaultValue: 'Add Player' })}
          </Button>
        </Col>
      </Row>

      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Search & Filters */}
        <SearchFilters
          filters={filters}
          onChange={setFilters}
          availableNationalities={nationalities}
          availableClubs={clubs}
        />

        {/* Players List */}
        <List
          loading={loading}
          dataSource={filteredPlayers}
          pagination={{
            pageSize: 6,
            showTotal: (total) => `${t('common.total')}: ${total}`,
            position: 'bottom',
            align: 'center',
          }}
          renderItem={(player) => (
            <Card
              className="mb-4 hover:shadow-md transition-all border-slate-100 group"
              bodyStyle={{ padding: '16px 24px' }}
            >
              <Row align="middle" gutter={24}>
                {/* Profile Section */}
                <Col xs={24} sm={8} lg={6}>
                  <Space size="middle">
                    <Avatar
                      size={64}
                      src={player.photos?.find(p => p.isMain)?.url}
                      icon={<UserOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
                      className="border-2 border-slate-100 shadow-sm"
                    />
                    <Space direction="vertical" size={0}>
                      <Typography.Text className="text-lg font-black text-[#3F3F3F] uppercase tracking-tight leading-none">
                        {i18n.language === 'ar' && player.nameAr ? player.nameAr : player.name}
                      </Typography.Text>
                      {i18n.language !== 'ar' && player.nameAr && (
                        <Typography.Text className="text-gray-400 font-arabic text-sm">
                          {player.nameAr}
                        </Typography.Text>
                      )}
                    </Space>
                  </Space>
                </Col>

                {/* Info Section */}
                <Col xs={24} sm={12} lg={14}>
                  <Row gutter={[20, 20]} align="middle">
                    <Col xs={12} sm={10}>
                      <div className="flex flex-wrap gap-2">
                        <Tag className={`m-0 border-none font-bold px-3 text-center w-fit ${(player.role || ProfileRole.PLAYER) === ProfileRole.COACH
                          ? 'bg-[#3F3F3F] text-white'
                          : 'bg-[#C9A24D]/10 text-[#C9A24D]'
                          }`}>
                          {(player.role || ProfileRole.PLAYER) === ProfileRole.COACH ? t('common.coach') : t('common.player')}
                        </Tag>
                        <Tag className="m-0 border-none bg-slate-50 text-slate-600 font-bold px-3 text-center w-fit">
                          {t(`enums.Sport.${player.sport}`, { defaultValue: player.sport })}
                        </Tag>
                      </div>
                    </Col>
                    <Col xs={12} sm={10}>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-1">{t('common.status')}</span>
                        <StatusBadge status={player.dealStatus} type="deal" />
                      </div>
                    </Col>
                  </Row>
                </Col>

                {/* Actions Section */}
                <Col xs={24} lg={4} className="flex justify-end">
                  <Space size="middle">
                    <Tooltip title={t('players.view_profile')}>
                      <Button
                        shape="circle"
                        icon={<EyeOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
                        onClick={() => navigate(`/admin/players/${player.id}`)}
                        className="flex items-center justify-center text-slate-400 hover:text-[#3F3F3F] hover:border-[#3F3F3F]"
                      />
                    </Tooltip>
                    <Tooltip title={t('players.edit_data')}>
                      <Button
                        shape="circle"
                        icon={<EditOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
                        onClick={() => handleEdit(player)}
                        className="flex items-center justify-center text-slate-400 hover:text-gold-600 hover:border-gold-600"
                      />
                    </Tooltip>
                    <Tooltip title={t('players.delete_player')}>
                      <Button
                        shape="circle"
                        danger
                        icon={<DeleteOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
                        onClick={() => handleDelete(player)}
                        className="flex items-center justify-center opacity-40 hover:opacity-100"
                      />
                    </Tooltip>
                  </Space>
                </Col>
              </Row>
            </Card>
          )}
        />
      </Space>

      {/* Create/Edit Modal */}
      <Modal
        title={editingPlayer ? (selectedRole === ProfileRole.COACH ? t('admin.players.edit_coach_title', { defaultValue: 'Edit Coach' }) : t('admin.players.edit_player_title', { defaultValue: 'Edit Player' })) : (selectedRole === ProfileRole.COACH ? t('admin.players.add_coach_title', { defaultValue: 'Add New Coach' }) : t('admin.players.add_player_title', { defaultValue: 'Add New Player' }))}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={800}
        okText={t('common.save')}
        cancelText={t('common.cancel')}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            isVisible: true,
            role: ProfileRole.PLAYER,
          }}
        >
          <Form.Item name="role" className="mb-6">
            <Radio.Group
              optionType="button"
              buttonStyle="solid"
              onChange={(e) => setSelectedRole(e.target.value)}
            >
              <Radio.Button value={ProfileRole.PLAYER}>{t('common.player', { defaultValue: 'Player' })}</Radio.Button>
              <Radio.Button value={ProfileRole.COACH}>{t('common.coach', { defaultValue: 'Coach' })}</Radio.Button>
            </Radio.Group>
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="email"
                label={t('common.email', { defaultValue: 'Email' })}
                rules={[{ type: 'email' }]}
              >
                <Input placeholder="player@example.com" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="dateOfBirth"
                label={t('players.date_of_birth', { defaultValue: 'Date of Birth' })}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="name"
                label={t('players.full_name')}
              >
                <Input placeholder="e.g., Mohamed Salah" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="nameAr" label={t('players.arabic_name')}>
                <Input placeholder="e.g., محمد صلاح" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="nationalId"
                label={t('common.national_id')}
              >
                <Input placeholder="e.g., 2900101..." />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="phone"
                label={t('common.phone_number')}
              >
                <Input placeholder="+20 123..." />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="address"
                label={t('common.address')}
              >
                <Input placeholder="Cairo, Egypt..." />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="sport"
                label={t('common.sport')}
              >
                <Select
                  placeholder={t('common.sport')}
                  options={Object.values(Sport).filter((v) => typeof v === 'string').map((s) => ({
                    value: s as string,
                    label: t(`enums.Sport.${s}`, { defaultValue: s }),
                  }))}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="nationality"
                label={t('players.nationality_en')}
              >
                <Input placeholder="e.g., Egypt" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="nationalityAr" label={t('players.nationality_ar')}>
                <Input placeholder="مثلاً: مصر" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            {selectedRole === ProfileRole.PLAYER && (
              <Col span={12}>
                <Form.Item
                  name="position"
                  label={t('common.position')}
                >
                  <Select
                    placeholder={t('common.position')}
                    options={Object.values(Position).filter((v) => typeof v === 'string').map((pos: string) => ({
                      value: pos,
                      label: t(`enums.Position.${pos}`, { defaultValue: pos }),
                    }))}
                  />
                </Form.Item>
              </Col>
            )}
            <Col span={selectedRole === ProfileRole.PLAYER ? 6 : 12}>
              <Form.Item
                name="club"
                label={t('players.club_en')}
              >
                <Input placeholder="e.g., Liverpool FC" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="clubAr" label={t('players.club_ar')}>
                <Input placeholder="مثلاً: نادي ليفربول" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="marketValue"
                label={t('players.market_value')}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  step={1000000}
                />
              </Form.Item>
            </Col>
            {selectedRole === ProfileRole.PLAYER && (
              <>
                <Col span={12}>
                  <Form.Item
                    name="preferredFoot"
                    label={t('common.preferred_foot', { defaultValue: 'Preferred Foot' })}
                  >
                    <Select
                      placeholder={t('common.preferred_foot', { defaultValue: 'Preferred Foot' })}
                      options={Object.values(PreferredFoot).filter((v) => typeof v === 'string').map((foot: string) => ({
                        value: foot,
                        label: t(`enums.PreferredFoot.${foot}`, { defaultValue: foot }),
                      }))}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="dealStatus"
                    label={t('players.deal_status')}
                  >
                    <Select
                      placeholder={t('players.deal_status')}
                      options={Object.values(DealStatus).filter(v => typeof v === 'string').map((status: any) => ({
                        value: status,
                        label: t(`enums.DealStatus.${status}`, { defaultValue: status }),
                      }))}
                    />
                  </Form.Item>
                </Col>
              </>
            )}
            {selectedRole === ProfileRole.COACH && (
              <Col span={24}>
                <Form.Item
                  name="dealStatus"
                  label={t('players.deal_status')}
                >
                  <Select
                    placeholder={t('players.deal_status')}
                    options={Object.values(DealStatus).filter((v) => typeof v === 'string').map((status: string) => ({
                      value: status,
                      label: t(`enums.DealStatus.${status}`, { defaultValue: status }),
                    }))}
                  />
                </Form.Item>
              </Col>
            )}
          </Row>

          {selectedRole === ProfileRole.PLAYER && (
            <>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="height"
                    label={t('players.height_cm')}
                  >
                    <InputNumber style={{ width: '100%' }} placeholder="e.g., 175" min={150} max={220} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="weight"
                    label={t('players.weight_kg')}
                  >
                    <InputNumber style={{ width: '100%' }} placeholder="e.g., 71" min={50} max={120} />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="jerseyNumber"
                    label={t('common.jersey_number')}
                  >
                    <InputNumber style={{ width: '100%' }} placeholder="e.g., 11" min={1} max={99} />
                  </Form.Item>
                </Col>
              </Row>
            </>
          )}

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="notes"
                label={t('common.notes', { defaultValue: 'Notes' })}
              >
                <Input.TextArea rows={2} placeholder="Additional notes..." />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="notesAr"
                label={t('common.notes_ar', { defaultValue: 'Notes (Arabic)' })}
              >
                <Input.TextArea rows={2} placeholder="ملاحظات إضافية..." dir="rtl" />
              </Form.Item>
            </Col>
          </Row>

          <Divider />
          <Title level={5} className="mb-4">{t('players.media_docs')}</Title>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="photos"
                label={selectedRole === ProfileRole.COACH ? t('players.coach_image', { defaultValue: 'Coach Image' }) : t('players.player_image')}
                valuePropName="fileList"
                getValueFromEvent={(e) => Array.isArray(e) ? e : e?.fileList}
              >
                <Upload action="/upload-placeholder" listType="picture" maxCount={1}>
                  <Button icon={<UploadOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}>{t('players.upload_photo')}</Button>
                </Upload>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="documents"
                label={t('players.contract_doc')}
                valuePropName="fileList"
                getValueFromEvent={(e) => Array.isArray(e) ? e : e?.fileList}
              >
                <Upload action="/upload-placeholder">
                  <Button icon={<UploadOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}>{t('players.upload_contract')}</Button>
                </Upload>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="contractStatus"
                label={t('admin.contracts.status_label', { defaultValue: 'Contract Status' })}
              >
                <Select
                  placeholder={t('admin.contracts.status_label', { defaultValue: 'Contract Status' })}
                  options={Object.values(ContractStatus).filter((v) => typeof v === 'string').map((status: string) => ({
                    value: status,
                    label: t(`enums.ContractStatus.${status}`, { defaultValue: status }),
                  }))}
                />
              </Form.Item>
            </Col>
          </Row>

          <Divider />

          <Form.Item
            name="isVisible"
            label={t('players.visibility')}
            valuePropName="checked"
          >
            <Switch checkedChildren={t('players.public')} unCheckedChildren={t('players.private')} />
          </Form.Item>
        </Form>
      </Modal>
    </div >
  );
};
