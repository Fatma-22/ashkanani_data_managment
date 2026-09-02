import React, { useState, useEffect, useRef } from 'react';
import {
  Card, Table, Tag, Input, Space, Typography, Row, Col, Statistic,
  Modal, Button, Avatar, message, Spin, Empty, List, Badge, Select, Form, Radio
} from 'antd';
import {
  SearchOutlined, UserOutlined, TeamOutlined, EyeOutlined, PlusOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { scoutService } from '../../services/scoutService';
import { playerService } from '../../services/playerService';
import { ownerService } from '../../services/ownerService';
import { Admin, Player } from '../../types';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useStickyState } from '../../utils/hooks';

const { Title, Text } = Typography;

export const Scouts: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const navigate = useNavigate();
  const { user } = useAuth();
  const isOwner = user?.role === 'OWNER';

  const [scouts, setScouts] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useStickyState('', 'Admin_Scouts_search');
  const [page, setPage] = useStickyState(1, 'Admin_Scouts_page');
  const [pageSize, setPageSize] = useStickyState(10, 'Admin_Scouts_pageSize');
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setPage(1);
  }, [search]);

  // Scout Players Modal
  const [selectedScout, setSelectedScout] = useState<Admin | null>(null);
  const [scoutPlayers, setScoutPlayers] = useState<Player[]>([]);
  const [playersLoading, setPlayersLoading] = useState(false);
  const [playersModalVisible, setPlayersModalVisible] = useState(false);
  const [playersTotal, setPlayersTotal] = useState(0);
  const [playersPage, setPlayersPage] = useState(1);

  // Assign Players Modal
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [playersList, setPlayersList] = useState<any[]>([]);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [searchPlayersLoading, setSearchPlayersLoading] = useState(false);

  // Add Scout Modal
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [addMode, setAddMode] = useState<'EXISTING' | 'NEW'>('EXISTING');
  const [nonScoutAdmins, setNonScoutAdmins] = useState<Admin[]>([]);
  const [addingScout, setAddingScout] = useState(false);
  const [addForm] = Form.useForm();

  const handleOpenAddModal = async () => {
    setAddModalVisible(true);
    setAddMode('EXISTING');
    addForm.resetFields();
    try {
      const _admins = await scoutService.getNonScouts();
      const normalized = Array.isArray(_admins) ? _admins : [_admins];
      setNonScoutAdmins(normalized);
    } catch (err) {
      console.error('Error fetching non-scout admins:', err);
    }
  };

  const handleAddScout = async () => {
    try {
      setAddingScout(true);
      if (addMode === 'EXISTING') {
        const values = await addForm.validateFields(['existingAdminId']);
        await scoutService.toggleScoutStatus(values.existingAdminId, true);
        message.success(t('messages.success_save', 'تمت الإضافة بنجاح'));
      } else {
        const values = await addForm.validateFields(['name', 'email', 'phone', 'password']);
        await scoutService.createScout(values);
        message.success(t('messages.success_save', 'تمت الإضافة بنجاح'));
      }
      setAddModalVisible(false);
      addForm.resetFields();
      fetchScouts();
    } catch (err: any) {
      if (err.errorFields) return; // Validation error
      message.error(t('messages.error_save', 'حدث خطأ أثناء الحفظ'));
    } finally {
      setAddingScout(false);
    }
  };

  const fetchScouts = async () => {
    setLoading(true);
    try {
      const data = await scoutService.getAll(search || undefined);
      setScouts(data);
    } catch (err) {
      console.error('Error fetching scouts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScouts();
  }, [search]);

  const openScoutPlayers = async (scout: Admin) => {
    setSelectedScout(scout);
    setPlayersModalVisible(true);
    setPlayersPage(1);
    await fetchScoutPlayers(scout.id, 1);
  };

  const fetchScoutPlayers = async (scoutId: string, page: number) => {
    setPlayersLoading(true);
    try {
      const data = await scoutService.getById(scoutId, page, 10);
      setScoutPlayers(data.players?.data || []);
      setPlayersTotal(data.players?.meta?.total || 0);
    } catch (err) {
      console.error('Error fetching scout players:', err);
    } finally {
      setPlayersLoading(false);
    }
  };

  const handleToggleScout = async (admin: Admin) => {
    try {
      await scoutService.toggleScoutStatus(admin.id, !admin.isScout);
      message.success(t('scouts.toggle_success'));
      fetchScouts();
    } catch (err) {
      message.error(t('common.error'));
    }
  };

  const handleSearchPlayers = async (value: string) => {
    if (!value) {
      setPlayersList([]);
      return;
    }
    setSearchPlayersLoading(true);
    try {
      const results = await playerService.getSimpleSearch(value);
      setPlayersList(results.map(p => ({
        value: p.id,
        label: isRTL 
          ? `${p.name_ar || p.name} (${p.name || ''})` 
          : `${p.name} (${p.name_ar || ''})`
      })));
    } catch (err) {
      console.error('Error searching players:', err);
    } finally {
      setSearchPlayersLoading(false);
    }
  };

  const handleAssignPlayers = async () => {
    if (!selectedScout || selectedPlayerIds.length === 0) return;
    setAssigning(true);
    try {
      await scoutService.assignPlayers(selectedScout.id, selectedPlayerIds);
      message.success(t('scouts.assign_success'));
      setAssignModalVisible(false);
      setSelectedPlayerIds([]);
      setPlayersList([]);
      fetchScouts();
    } catch (err) {
      message.error(t('common.error'));
    } finally {
      setAssigning(false);
    }
  };

  const totalScouts = scouts.length;
  const totalScoutedPlayers = scouts.reduce((sum, s) => sum + (s.scoutedPlayersCount || 0), 0);

  const basePath = isOwner ? '/owner' : '/admin';

  const columns = [
    {
      title: t('common.name'),
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: Admin) => (
        <Space>
          <Avatar icon={<UserOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />} style={{ backgroundColor: '#C9A24D' }} />
          <div>
            <Text strong>{name}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>{record.email}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: t('common.phone'),
      dataIndex: 'phone',
      key: 'phone',
      render: (phone: string) => phone || '-',
    },
    {
      title: t('scouts.players_count'),
      dataIndex: 'scoutedPlayersCount',
      key: 'scoutedPlayersCount',
      sorter: (a: Admin, b: Admin) => (a.scoutedPlayersCount || 0) - (b.scoutedPlayersCount || 0),
      render: (count: number) => (
        <Badge
          count={count || 0}
          showZero
          style={{ backgroundColor: count > 0 ? '#C9A24D' : '#999' }}
        />
      ),
    },
    {
      title: t('common.status'),
      key: 'status',
      render: (_: any, record: Admin) => (
        <Tag color={record.isScout ? 'green' : 'default'}>
          {record.isScout ? t('scouts.is_scout') : t('common.inactive')}
        </Tag>
      ),
    },
    {
      title: t('common.actions'),
      key: 'actions',
      render: (_: any, record: Admin) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
            onClick={() => openScoutPlayers(record)}
            disabled={!record.scoutedPlayersCount}
          >
            {t('scouts.view_players')}
          </Button>
          <Button
            type="link"
            icon={<PlusOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
            onClick={() => {
              setSelectedScout(record);
              setAssignModalVisible(true);
            }}
          >
            {t('scouts.assign_players')}
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>{t('scouts.title')}</Title>
          <Text type="secondary">{t('scouts.subtitle')}</Text>
        </div>
        <Button 
          type="primary" 
          icon={<PlusOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />} 
          style={{ backgroundColor: '#C9A24D' }}
          onClick={handleOpenAddModal}
        >
          {t('scouts.add_scout', 'إضافة كشاف')}
        </Button>
      </div>

      {/* Stats Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={8} md={6}>
          <Card bordered={false} style={{ borderRadius: 12, textAlign: 'center' }}>
            <Statistic
              title={t('scouts.total_scouts')}
              value={totalScouts}
              prefix={<TeamOutlined style={{ color: '#C9A24D' }} onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6}>
          <Card bordered={false} style={{ borderRadius: 12, textAlign: 'center' }}>
            <Statistic
              title={t('scouts.total_scouted_players')}
              value={totalScoutedPlayers}
              prefix={<UserOutlined style={{ color: '#52c41a' }} onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
            />
          </Card>
        </Col>
      </Row>

      {/* Search */}
      <Card bordered={false} style={{ borderRadius: 12, marginBottom: 16 }}>
        <Input
          prefix={<SearchOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
          placeholder={t('scouts.search_placeholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          allowClear
          style={{ maxWidth: 400 }}
        />
      </Card>

      {/* Scouts Table */}
      <Card bordered={false} style={{ borderRadius: 12 }}>
        <Table
          columns={columns}
          dataSource={scouts}
          loading={loading}
          rowKey="id"
          pagination={{ 
            current: page,
            pageSize: pageSize,
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
            },
            showSizeChanger: true
          }}
          locale={{ emptyText: <Empty description={t('scouts.no_scouts')} /> }}
          scroll={{ x: 700 }}
        />
      </Card>

      {/* Scout Players Modal */}
      <Modal
        open={playersModalVisible}
        onCancel={() => setPlayersModalVisible(false)}
        footer={null}
        title={t('scouts.scout_players_title', { name: selectedScout?.name || '' })}
        width={700}
        destroyOnClose
      >
        {playersLoading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Spin size="large" />
          </div>
        ) : scoutPlayers.length === 0 ? (
          <Empty description={t('scouts.no_players')} />
        ) : (
          <List
            dataSource={scoutPlayers}
            renderItem={(player: any) => (
              <List.Item
                key={player.id}
                actions={[
                  <Button
                    type="link"
                    onClick={() => {
                      setPlayersModalVisible(false);
                      navigate(`${basePath}/players/${player.id}`);
                    }}
                  >
                    {t('common.view_details')}
                  </Button>
                ]}
              >
                <List.Item.Meta
                  avatar={
                    <Avatar
                      src={player.mainPhoto?.url}
                      icon={<UserOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
                      size={48}
                      style={{ backgroundColor: '#C9A24D' }}
                    />
                  }
                  title={
                    <Space>
                      <Text strong>{isRTL ? (player.nameAr || player.name) : player.name}</Text>
                      {player.sport && (
                        <Tag color="blue">{t(`enums.Sport.${player.sport}`, { defaultValue: player.sport })}</Tag>
                      )}
                    </Space>
                  }
                  description={
                    <Space split="·">
                      {player.nationality && <Text type="secondary">{player.nationality}</Text>}
                      {player.club && <Text type="secondary">{isRTL ? (player.clubAr || player.club) : player.club}</Text>}
                    </Space>
                  }
                />
              </List.Item>
            )}
            pagination={playersTotal > 10 ? {
              current: playersPage,
              total: playersTotal,
              pageSize: 10,
              onChange: (page) => {
                setPlayersPage(page);
                if (selectedScout) fetchScoutPlayers(selectedScout.id, page);
              },
            } : false}
          />
        )}
      </Modal>

      {/* Assign Players Modal */}
      <Modal
        open={assignModalVisible}
        onCancel={() => {
          setAssignModalVisible(false);
          setSelectedPlayerIds([]);
          setPlayersList([]);
        }}
        onOk={handleAssignPlayers}
        confirmLoading={assigning}
        title={t('scouts.assign_players')}
        okText={t('common.save')}
        cancelText={t('common.cancel')}
        destroyOnClose
      >
        <div style={{ marginBottom: 16 }}>
          <Text type="secondary">{t('scouts.select_players_to_assign')}</Text>
        </div>
        <Select
          mode="multiple"
          style={{ width: '100%' }}
          placeholder={t('scouts.search_players')}
          value={selectedPlayerIds}
          onChange={setSelectedPlayerIds}
          onSearch={handleSearchPlayers}
          filterOption={false}
          notFoundContent={searchPlayersLoading ? <Spin size="small" /> : null}
          loading={searchPlayersLoading}
          options={playersList}
        />
      </Modal>

      {/* Add Scout Modal */}
      <Modal
        open={addModalVisible}
        onCancel={() => setAddModalVisible(false)}
        onOk={handleAddScout}
        confirmLoading={addingScout}
        title={t('scouts.add_scout', 'إضافة كشاف')}
        okText={t('common.save', 'حفظ')}
        cancelText={t('common.cancel', 'إلغاء')}
        destroyOnClose
      >
        <div style={{ marginBottom: 24, textAlign: 'center' }}>
          <Radio.Group 
            value={addMode} 
            onChange={(e) => setAddMode(e.target.value)}
            optionType="button"
            buttonStyle="solid"
          >
            <Radio.Button value="EXISTING">{t('scouts.from_existing', 'من المشرفين الحاليين')}</Radio.Button>
            <Radio.Button value="NEW">{t('scouts.add_new', 'إدخال بيانات كشاف جديد')}</Radio.Button>
          </Radio.Group>
        </div>

        <Form form={addForm} layout="vertical">
          {addMode === 'EXISTING' ? (
            <Form.Item 
              name="existingAdminId" 
              label={t('scouts.select_admin', 'اختر مشرف')}
              rules={[{ required: true, message: t('common.required', 'مطلوب') }]}
            >
              <Select 
                showSearch
                placeholder={t('scouts.select_admin', 'اختر مشرف')}
                options={nonScoutAdmins.map(a => ({ value: a.id, label: a.name }))}
                filterOption={(input, option) =>
                  (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())
                }
              />
            </Form.Item>
          ) : (
            <>
              <Form.Item 
                name="name" 
                label={t('common.name', 'الاسم')}
                rules={[{ required: true, message: t('common.required', 'مطلوب') }]}
              >
                <Input autoComplete="off" />
              </Form.Item>
              <Form.Item 
                name="email" 
                label={t('common.email', 'البريد الإلكتروني')}
                rules={[
                  { required: true, message: t('common.required', 'مطلوب') },
                  { type: 'email', message: t('common.invalid_email', 'بريد إلكتروني غير صالح') }
                ]}
              >
                <Input autoComplete="off" type="email" dir="ltr" />
              </Form.Item>
              <Form.Item 
                name="phone" 
                label={t('common.phone', 'رقم الهاتف')}
              >
                <Input autoComplete="off" type="tel" dir="ltr" />
              </Form.Item>
              <Form.Item 
                name="password" 
                label={t('common.password', 'كلمة المرور')}
                rules={[{ required: true, message: t('common.required', 'مطلوب') }]}
              >
                <Input.Password autoComplete="new-password" />
              </Form.Item>
            </>
          )}
        </Form>
      </Modal>
    </div>
  );
};
