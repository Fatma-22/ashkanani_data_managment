import { useEffect, useState, FC, useRef } from 'react';
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  DatePicker,
  InputNumber,
  message,
  Row,
  Col,
  Typography,
  Tag,
  Card,
  Select,
  Upload,
  Grid,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, DownloadOutlined, FileTextOutlined, UploadOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { Contract, ContractStatus } from '../../types';
import { contractService } from '../../services/contractService';
import { playerService } from '../../services/playerService';
import { agentService } from '../../services/agentService';
import { formatCurrency, formatDate, normalizeArabic, translateText } from '../../utils/helpers';
import StatusBadge from '../../components/StatusBadge';
import showConfirmModal from '../../components/ConfirmModal';

import { useTranslation } from 'react-i18next';
import DynamicTranslate from '../../components/DynamicTranslate';
import { useStickyState } from '../../utils/hooks';

const { Title } = Typography;
const { RangePicker } = DatePicker;

const isArabicText = (text?: string) => {
  if (!text) return false;
  const arabicPattern = /[\u0600-\u06FF]/;
  return arabicPattern.test(text);
};

export const Contracts: FC = () => {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [filteredContracts, setFilteredContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [form] = Form.useForm();
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;

  const [searchText, setSearchText] = useStickyState('', 'Admin_Contracts_searchText');
  const [typeFilter, setTypeFilter] = useStickyState<string | undefined>(undefined, 'Admin_Contracts_typeFilter');
  const [statusFilter, setStatusFilter] = useStickyState<string | undefined>(undefined, 'Admin_Contracts_statusFilter');
  const [dateRange, setDateRange] = useStickyState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null, 'Admin_Contracts_dateRange');

  const [total, setTotal] = useState(0);
  const [page, setPage] = useStickyState(1, 'Admin_Contracts_page');
  const [pageSize, setPageSize] = useStickyState(10, 'Admin_Contracts_pageSize');
  const isFirstRender = useRef(true);
  const [players, setPlayers] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const translateTimeouts = useRef<{ [key: string]: NodeJS.Timeout }>({});

  const handleValuesChange = (changedValues: any) => {
    if (changedValues.notesAr) {
      const value = changedValues.notesAr;
      if (translateTimeouts.current['notesAr']) {
        clearTimeout(translateTimeouts.current['notesAr']);
      }
      translateTimeouts.current['notesAr'] = setTimeout(async () => {
        if (!value) return;
        if (!form.getFieldValue('notes')) {
          const translated = await translateText(value, 'ar', 'en');
          form.setFieldsValue({ notes: translated });
        }
      }, 800);
    }
  };

  useEffect(() => {
    if (isFirstRender.current) {
        isFirstRender.current = false;
        return;
    }
    setPage(1);
  }, [searchText, typeFilter, statusFilter, dateRange]);

  useEffect(() => {
    fetchContracts();
  }, [page, pageSize, searchText, typeFilter, statusFilter, dateRange]);

  useEffect(() => {
    loadMetadata();
  }, []);

  const loadMetadata = async () => {
    try {
      const [{ players: playersData }, { agents: agentsData }] = await Promise.all([
        playerService.getAll(undefined, 1, -1),
        agentService.getAll({ per_page: -1 })
      ]);
      setPlayers(playersData);
      setAgents(agentsData);
    } catch (error) {
      console.error('Failed to load metadata', error);
    }
  };

  const fetchContracts = async () => {
    setLoading(true);
    try {
      const params: any = {
        page,
        per_page: pageSize,
        search: searchText,
        type: typeFilter,
        status: statusFilter,
        start_date: dateRange?.[0]?.format('YYYY-MM-DD'),
        end_date: dateRange?.[1]?.format('YYYY-MM-DD'),
      };
      const { data, total: count } = await contractService.getAll(params);
      setContracts(data);
      setFilteredContracts(data);
      setTotal(count);
    } catch (error) {
      message.error(t('messages.error_load', { defaultValue: 'Failed to load data' }));
    } finally {
      setLoading(false);
    }
  };

  const loadContracts = fetchContracts;

  const applyFilters = () => {
    let filtered = [...contracts];

    if (searchText) {
      const searchLower = searchText.toLowerCase();
      filtered = filtered.filter(c =>
        c.playerName.toLowerCase().includes(searchLower) ||
        (c.playerNameAr && c.playerNameAr.includes(searchText))
      );
    }

    if (typeFilter) {
      filtered = filtered.filter(c => c.type === typeFilter);
    }

    if (statusFilter) {
      filtered = filtered.filter(c => c.status === statusFilter);
    }

    if (dateRange && dateRange[0] && dateRange[1]) {
      filtered = filtered.filter(c => {
        const endDate = dayjs(c.endDate);
        return endDate.isAfter(dateRange[0]) && endDate.isBefore(dateRange[1]);
      });
    }

    setFilteredContracts(filtered);
  };

  const clearFilters = () => {
    setSearchText('');
    setTypeFilter(undefined);
    setStatusFilter(undefined);
    setDateRange(null);
  };

  const handleCreate = () => {
    setEditingContract(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (contract: Contract) => {
    setEditingContract(contract);
    form.setFieldsValue({
      ...contract,
      startDate: contract.startDate ? dayjs(contract.startDate) : undefined,
      endDate: contract.endDate ? dayjs(contract.endDate) : undefined,
      annualSalary: contract.annualSalary || (contract as any).annual_salary,
      signingBonus: contract.signingBonus || (contract as any).signing_bonus,
      notesAr: (contract as any).notes_ar || (contract as any).notesAr,
    });
    setModalVisible(true);
  };

  const handleDelete = (contract: Contract) => {
    showConfirmModal({
      title: t('messages.confirm_delete_title'),
      content: t('admin.players.delete_player_confirm', { name: contract.playerName }),
      okText: t('common.delete'),
      okType: 'danger',
      onConfirm: async () => {
        try {
          await contractService.delete(contract.id);
          message.success(t('messages.success_delete'));
          loadContracts();
        } catch (error) {
          message.error(t('messages.error_delete'));
        }
      },
    });
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const contractData = {
        ...values,
        start_date: values.startDate ? values.startDate.format('YYYY-MM-DD') : undefined,
        end_date: values.endDate ? values.endDate.format('YYYY-MM-DD') : undefined,
        annual_salary: values.annualSalary,
        signing_bonus: values.signingBonus,
        notes_ar: values.notesAr,
        currency: 'USD', // Default currency
      };

      if (editingContract) {
        await contractService.update(editingContract.id, contractData);
        message.success(t('messages.success_update'));
      } else {
        await contractService.create(contractData);
        message.success(t('messages.success_save'));
      }

      setModalVisible(false);
      loadContracts();
    } catch (error) {
      console.error('Submission error:', error);
      message.error(t('messages.error_save'));
    }
  };

  const handleDownload = (contract: Contract) => {
    message.info(`Downloading contract for ${contract.playerName}`);
  };

  const columns: ColumnsType<Contract> = [
    {
      title: t('common.players'),
      key: 'playerName',
      sorter: (a, b) => a.playerName.localeCompare(b.playerName),
      render: (_, record) => {
        const name = isAr ? (record.playerNameAr || record.playerName) : (record.playerName || record.playerNameAr);
        return (
          <span className="font-bold text-[#3F3F3F]">
            <DynamicTranslate text={name} sourceLang={isArabicText(name) ? 'ar' : 'en'} />
          </span>
        );
      },
    },
    {
      title: t('admin.contracts.type_professional', { defaultValue: 'Type' }),
      dataIndex: 'type',
      key: 'type',
      render: (contractType) => (
        <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
          {t(`admin.contracts.type_${contractType.toLowerCase()}`, { defaultValue: contractType })}
        </span>
      ),
    },
    {
      title: t('admin.contracts.start_date'),
      dataIndex: 'startDate',
      key: 'startDate',
      sorter: (a, b) => dayjs(a.startDate).unix() - dayjs(b.startDate).unix(),
      render: (date) => <span className="text-gray-500">{formatDate(date)}</span>,
    },
    {
      title: t('admin.contracts.end_date'),
      dataIndex: 'endDate',
      key: 'endDate',
      sorter: (a, b) => dayjs(a.endDate).unix() - dayjs(b.endDate).unix(),
      render: (date) => <span className="font-semibold">{formatDate(date)}</span>,
    },
    {
      title: t('admin.contracts.salary'),
      dataIndex: 'annualSalary',
      key: 'annualSalary',
      sorter: (a, b) => a.annualSalary - b.annualSalary,
      render: (value) => <span className="font-black text-[#3F3F3F]">{formatCurrency(value)}</span>,
    },
    {
      title: t('common.status'),
      dataIndex: 'status',
      key: 'status',
      render: (status) => <StatusBadge status={status} type="contract" />,
    },
    {
      title: t('common.actions'),
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          {record.fileUrl && (
            <Button
              type="text"
              icon={<DownloadOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
              onClick={() => handleDownload(record)}
              className="text-[#3F3F3F] hover:bg-slate-100"
            />
          )}
          <Button
            type="text"
            icon={<EditOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
            onClick={() => handleEdit(record)}
            className="text-[#3F3F3F] hover:bg-slate-100"
          />
          <Button
            type="text"
            danger
            icon={<DeleteOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
            onClick={() => handleDelete(record)}
          />
        </Space>
      ),
    },
  ];

  const isFiltered = !!(searchText || typeFilter || statusFilter || dateRange);

  return (
    <div className="fade-in">
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }} gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Title level={isMobile ? 3 : 2} style={{ margin: 0, color: '#3F3F3F' }}>{t('admin.contracts.title')}</Title>
        </Col>
        <Col xs={24} md={12} className="text-left md:text-right">
          <Button
            type="primary"
            icon={<PlusOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
            onClick={handleCreate}
            size="large"
            className="bg-[#3F3F3F] hover:bg-[#B68F3F] border-none shadow-md h-12 px-8 rounded-lg font-bold"
          >
            {t('admin.contracts.add_btn')}
          </Button>
        </Col>
      </Row>

      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Filters Panel */}
        <Card className="border-none shadow-sm rounded-xl overflow-hidden">
          <Row gutter={[12, 12]} align="middle">
            <Col xs={24} lg={8}>
              <Input
                placeholder={t('admin.contracts.search_placeholder')}
                prefix={<FileTextOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} className="text-gray-300" />}
                className="h-11 rounded-lg border-slate-200"
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                allowClear
              />
            </Col>
            <Col xs={12} sm={8} lg={4}>
              <Select
                showSearch
                placeholder={t('admin.contracts.type_professional', { defaultValue: 'Type' })}
                className="w-full h-11"
                allowClear
                value={typeFilter}
                onChange={setTypeFilter}
                options={[
                  { value: 'PROFESSIONAL', label: t('admin.contracts.type_professional', { defaultValue: 'Professional' }) },
                  { value: 'YOUTH', label: t('admin.contracts.type_youth', { defaultValue: 'Youth' }) },
                  { value: 'LOAN', label: t('admin.contracts.type_loan', { defaultValue: 'Loan' }) },
                ]}
                optionFilterProp="label"
              />
            </Col>
            <Col xs={12} sm={8} lg={4}>
              <Select
                showSearch
                placeholder={t('common.status')}
                className="w-full h-11"
                allowClear
                value={statusFilter}
                onChange={setStatusFilter}
                options={Object.values(ContractStatus).map(status => ({
                  value: status,
                  label: t(`enums.ContractStatus.${status}`, { defaultValue: status }),
                }))}
                optionFilterProp="label"
              />
            </Col>
            <Col xs={24} sm={8} lg={6}>
              <RangePicker
                className="w-full h-11 border-slate-200"
                value={dateRange}
                onChange={(dates) => setDateRange(dates as any)}
                placeholder={[t('admin.contracts.start_date'), t('admin.contracts.end_date')]}
              />
            </Col>
            {isFiltered && (
              <Col xs={24} lg={2} className="text-center lg:text-right">
                <Button
                  type="link"
                  danger
                  onClick={clearFilters}
                  className="font-bold flex items-center justify-center lg:justify-end w-full"
                >
                  {t('common.cancel')}
                </Button>
              </Col>
            )}
          </Row>
        </Card>

        {/* Contracts Table */}
        <Card>
          <Table
            columns={columns}
            dataSource={contracts}
            loading={loading}
            rowKey="id"
            scroll={{ x: 1000 }}
            pagination={{
              current: page,
              pageSize: pageSize,
              total: total,
              onChange: (p, ps) => {
                setPage(p);
                setPageSize(ps);
              },
              showSizeChanger: true,
              showTotal: (total) => `${t('common.total')}: ${total} ${t('common.contracts').toLowerCase()}`,
            }}
          />
        </Card>
      </Space>

      {/* Create/Edit Modal */}
      <Modal
        title={editingContract ? t('admin.contracts.edit_title') : t('admin.contracts.add_btn')}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={700}
        okText={t('common.save')}
        cancelText={t('common.cancel')}
      >
        <Form form={form} layout="vertical" onValuesChange={handleValuesChange}>
          <Form.Item
            name="player_id"
            label={t('admin.contracts.player_name')}
            rules={[{ required: true, message: t('admin.contracts.player_select') }]}
          >
            <Select
              placeholder={t('admin.contracts.player_select')}
              showSearch
              filterOption={(input, option) => {
                const normalizedInput = normalizeArabic(input).toLowerCase();
                const normalizedLabel = normalizeArabic(String(option?.label ?? '')).toLowerCase();
                return normalizedLabel.startsWith(normalizedInput);
              }}
              options={players.map(p => ({
                value: p.id,
                label: `${i18n.language === 'ar' && p.nameAr ? p.nameAr : p.name} - ${p.club || ''}`
              }))}
            />
          </Form.Item>

          <Form.Item
            name="agent_id"
            label={t('common.agent', { defaultValue: 'Agent' })}
          >
            <Select
              placeholder={t('common.agent')}
              allowClear
              showSearch
              filterOption={(input, option) => {
                const normalizedInput = normalizeArabic(input).toLowerCase();
                const normalizedLabel = normalizeArabic(String(option?.label ?? '')).toLowerCase();
                return normalizedLabel.startsWith(normalizedInput);
              }}
              options={agents.map(a => ({
                value: a.id,
                label: i18n.language === 'ar' && a.nameAr ? a.nameAr : a.name
              }))}
            />
          </Form.Item>

          <Row gutter={[12, 0]}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="type"
                label={t('admin.contracts.type_professional', { defaultValue: 'Contract Type' })}
                rules={[{ required: true }]}
              >
                <Select
                  showSearch
                  placeholder={t('admin.contracts.type_professional', { defaultValue: 'Contract Type' })}
                  options={[
                    { value: 'PROFESSIONAL', label: t('admin.contracts.type_professional', { defaultValue: 'Professional' }) },
                    { value: 'YOUTH', label: t('admin.contracts.type_youth', { defaultValue: 'Youth' }) },
                    { value: 'LOAN', label: t('admin.contracts.type_loan', { defaultValue: 'Loan' }) },
                  ]}
                  optionFilterProp="label"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="status"
                label={t('common.status')}
                rules={[{ required: true }]}
              >
                <Select
                  showSearch
                  placeholder={t('common.status')}
                  options={Object.values(ContractStatus).map(status => ({
                    value: status,
                    label: t(`enums.ContractStatus.${status}`, { defaultValue: status }),
                  }))}
                  optionFilterProp="label"
                />
              </Form.Item>
            </Col>
            <Col xs={12} sm={12}>
              <Form.Item
                name="startDate"
                label={t('admin.contracts.start_date')}
                rules={[{ required: true }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={12} sm={12}>
              <Form.Item
                name="endDate"
                label={t('admin.contracts.end_date')}
                rules={[{ required: true }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={12} sm={12}>
              <Form.Item
                name="annualSalary"
                label={t('admin.contracts.salary')}
                rules={[{ required: true }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="e.g., 18000000"
                  min={0}
                  step={100000}
                />
              </Form.Item>
            </Col>
            <Col xs={12} sm={12}>
              <Form.Item
                name="signingBonus"
                label={t('admin.contracts.signing_bonus')}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="e.g., 5000000"
                  min={0}
                  step={100000}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="notesAr" label={t('admin.contracts.notes') + ' (عربي)'}>
                <Input.TextArea rows={2} placeholder="ملاحظات إضافية (بالعربي)..." />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="notes" label={t('admin.contracts.notes')}>
                <Input.TextArea rows={2} placeholder="Additional notes (English)..." />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item
                name="contractFile"
                label={t('admin.contracts.upload_btn')}
                valuePropName="fileList"
                getValueFromEvent={(e) => {
                  if (Array.isArray(e)) return e;
                  return e?.fileList;
                }}
              >
                <Upload
                  name="contract"
                  listType="text"
                  maxCount={1}
                  beforeUpload={() => false}
                >
                  <Button
                    icon={<UploadOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
                    className="w-full flex items-center justify-center h-11 border-dashed"
                  >
                    {t('admin.contracts.upload_btn')}
                  </Button>
                </Upload>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};
