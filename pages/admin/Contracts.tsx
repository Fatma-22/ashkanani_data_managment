import { useEffect, useState, FC } from 'react';
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
import { mockContractApi } from '../../services/mockApi';
import { formatCurrency, formatDate } from '../../utils/helpers';
import StatusBadge from '../../components/StatusBadge';
import showConfirmModal from '../../components/ConfirmModal';

import { useTranslation } from 'react-i18next';
const { Title } = Typography;
const { RangePicker } = DatePicker;

export const Contracts: FC = () => {
  const { t, i18n } = useTranslation();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [filteredContracts, setFilteredContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [form] = Form.useForm();
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;

  const [searchText, setSearchText] = useState('');
  const [typeFilter, setTypeFilter] = useState<string | undefined>();
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);

  useEffect(() => {
    loadContracts();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [contracts, searchText, typeFilter, statusFilter, dateRange]);

  const loadContracts = async () => {
    setLoading(true);
    try {
      const data = await mockContractApi.getAll();
      setContracts(data);
    } catch (error) {
      message.error('Failed to load contracts');
    } finally {
      setLoading(false);
    }
  };

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
      startDate: dayjs(contract.startDate),
      endDate: dayjs(contract.endDate),
    });
    setModalVisible(true);
  };

  const handleDelete = (contract: Contract) => {
    showConfirmModal({
      title: t('common.delete') + ' ' + t('common.contracts'),
      content: t('players.delete_player_confirm', { defaultValue: `Are you sure you want to delete the contract for ${contract.playerName}?`, name: contract.playerName }),
      okText: t('common.delete'),
      okType: 'danger',
      onConfirm: async () => {
        try {
          await mockContractApi.delete(contract.id);
          message.success('Contract deleted successfully');
          loadContracts();
        } catch (error) {
          message.error('Failed to delete contract');
        }
      },
    });
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const contractData = {
        ...values,
        startDate: values.startDate.format('YYYY-MM-DD'),
        endDate: values.endDate.format('YYYY-MM-DD'),
        isVisible: false,
        fileUrl: values.contractFile && values.contractFile.length > 0
          ? 'https://example.com/mock-contract.pdf'
          : (editingContract?.fileUrl || null)
      };

      if (editingContract) {
        await mockContractApi.update(editingContract.id, contractData);
        message.success('Contract updated successfully');
      } else {
        await mockContractApi.create(contractData);
        message.success('Contract created successfully');
      }

      setModalVisible(false);
      loadContracts();
    } catch (error) {
      message.error('Failed to save contract');
    }
  };

  const handleDownload = (contract: Contract) => {
    message.info(`Downloading contract for ${contract.playerName}`);
  };

  const columns: ColumnsType<Contract> = [
    {
      title: t('common.players'),
      dataIndex: 'playerName',
      key: 'playerName',
      sorter: (a, b) => a.playerName.localeCompare(b.playerName),
      render: (_, record) => <span className="font-bold text-[#01153e]">{i18n.language === 'ar' && record.playerNameAr ? record.playerNameAr : record.playerName}</span>,
    },
    {
      title: t('admin.contracts.type_professional', { defaultValue: 'Type' }),
      dataIndex: 'type',
      key: 'type',
      render: (contractType) => (
        <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
          {contractType}
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
      render: (value) => <span className="font-black text-[#01153e]">{formatCurrency(value)}</span>,
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
              className="text-navy-500 hover:bg-slate-100"
            />
          )}
          <Button
            type="text"
            icon={<EditOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
            onClick={() => handleEdit(record)}
            className="text-navy-500 hover:bg-slate-100"
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
          <Title level={isMobile ? 3 : 2} style={{ margin: 0, color: '#01153e' }}>{t('admin.contracts.title')}</Title>
        </Col>
        <Col xs={24} md={12} className="text-left md:text-right">
          <Button
            type="primary"
            icon={<PlusOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
            onClick={handleCreate}
            size="large"
            className="bg-[#01153e] hover:bg-[#022569] border-none shadow-md h-12 px-8 rounded-lg font-bold"
          >
            {t('admin.contracts.add_btn')}
          </Button>
        </Col>
      </Row>

      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Filters Panel */}
        <Card className="border-none shadow-sm rounded-xl overflow-hidden">
          <Row gutter={[16, 16]} align="middle">
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
                placeholder={t('admin.contracts.type_professional', { defaultValue: 'Type' })}
                className="w-full h-11"
                allowClear
                value={typeFilter}
                onChange={setTypeFilter}
                options={[
                  { value: 'Professional', label: t('admin.contracts.type_professional', { defaultValue: 'Professional' }) },
                  { value: 'Youth', label: t('admin.contracts.type_youth', { defaultValue: 'Youth' }) },
                  { value: 'Loan', label: t('admin.contracts.type_loan', { defaultValue: 'Loan' }) },
                ]}
              />
            </Col>
            <Col xs={12} sm={8} lg={4}>
              <Select
                placeholder={t('common.status')}
                className="w-full h-11"
                allowClear
                value={statusFilter}
                onChange={setStatusFilter}
                options={Object.values(ContractStatus).map(status => ({
                  value: status,
                  label: t(`enums.ContractStatus.${status}`, { defaultValue: status }),
                }))}
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
              <Col xs={24} lg={2} className="text-right">
                <Button
                  type="link"
                  danger
                  onClick={clearFilters}
                  className="font-bold flex items-center justify-end w-full"
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
            dataSource={filteredContracts}
            loading={loading}
            rowKey="id"
            scroll={{ x: 1000 }}
            pagination={{
              pageSize: 10,
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
        <Form form={form} layout="vertical">
          <Form.Item
            name="playerName"
            label={t('admin.contracts.player_name')}
            rules={[{ required: true, message: t('admin.contracts.player_select') }]}
          >
            <Input placeholder="e.g., Mohamed Salah" />
          </Form.Item>

          <Form.Item
            name="nationalId"
            label={t('common.national_id')}
            rules={[{ required: true, message: t('common.national_id') + ' is required' }]}
          >
            <Input placeholder="e.g., 2900101..." />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="type"
                label={t('admin.contracts.type_professional', { defaultValue: 'Contract Type' })}
                rules={[{ required: true }]}
              >
                <Select
                  placeholder={t('admin.contracts.type_professional', { defaultValue: 'Contract Type' })}
                  options={[
                    { value: 'Professional', label: t('admin.contracts.type_professional', { defaultValue: 'Professional' }) },
                    { value: 'Youth', label: t('admin.contracts.type_youth', { defaultValue: 'Youth' }) },
                    { value: 'Loan', label: t('admin.contracts.type_loan', { defaultValue: 'Loan' }) },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="status"
                label={t('common.status')}
                rules={[{ required: true }]}
              >
                <Select
                  placeholder={t('common.status')}
                  options={Object.values(ContractStatus).map(status => ({
                    value: status,
                    label: t(`enums.ContractStatus.${status}`, { defaultValue: status }),
                  }))}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="startDate"
                label={t('admin.contracts.start_date')}
                rules={[{ required: true }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="endDate"
                label={t('admin.contracts.end_date')}
                rules={[{ required: true }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
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
            <Col span={12}>
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
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="notes" label={t('admin.contracts.notes')}>
                <Input.TextArea rows={3} placeholder="Additional notes (English)..." />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="notesAr" label={t('admin.contracts.notes') + ' (عربي)'}>
                <Input.TextArea rows={3} placeholder="ملاحظات إضافية (بالعربي)..." />
              </Form.Item>
            </Col>
          </Row>

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
        </Form>
      </Modal>
    </div>
  );
};
