import React, { useEffect, useState, useRef } from 'react';
import {
    Card,
    Button,
    Space,
    Modal,
    Form,
    Input,
    InputNumber,
    Select,
    DatePicker,
    message,
    Typography,
    Row,
    Col,
    Statistic,
    Spin,
    Table,
    Tag,
    Divider,
    Radio,
    Avatar,
    Switch,
    Descriptions,
    Upload,
    Tooltip
} from 'antd';
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    UserOutlined,
    MedicineBoxOutlined,
    DollarOutlined,
    EyeOutlined,
    UploadOutlined,
    FilePdfOutlined,
    TeamOutlined,
    GlobalOutlined,
    IdcardOutlined,
    SearchOutlined,
    RocketOutlined
} from '@ant-design/icons';
import { Employee } from '../../types';
import { ownerService } from '../../services/ownerService';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { formatCurrency, formatDate, translateText } from '../../utils/helpers';
import DynamicTranslate from '../../components/DynamicTranslate';
import { useStickyState } from '../../utils/hooks';
import GenericPdfExportModal from '../../components/GenericPdfExportModal';
import { EMPLOYEE_PDF_FIELDS, DEFAULT_EMPLOYEE_PDF_FIELDS } from '../../utils/pdfExport';

const isArabicText = (text?: string) => {
    if (!text) return false;
    const arabicPattern = /[\u0600-\u06FF]/;
    return arabicPattern.test(text);
};

const { Title, Text } = Typography;
const { Option } = Select;

export const OwnerEmployees: React.FC = () => {
    const { t, i18n } = useTranslation();
    const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
    const [filters, setFilters] = useStickyState({
        isActive: undefined as boolean | undefined,
    }, 'Owner_Employees_filters');
    const [page, setPage] = useStickyState(1, 'Owner_Employees_page');
    const [pageSize, setPageSize] = useStickyState(10, 'Owner_Employees_pageSize');
    const [viewingEmployee, setViewingEmployee] = useState<Employee | null>(null);
    const [detailsModalVisible, setDetailsModalVisible] = useState(false);
    const [pdfModalVisible, setPdfModalVisible] = useState(false);
    const [form] = Form.useForm();
    const isFirstRender = useRef(true);

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        setPage(1);
    }, [filters]);

    useEffect(() => {
        loadEmployees();
    }, [filters]);

    const loadEmployees = async () => {
        setLoading(true);
        try {
            const data = await ownerService.getEmployees();
            // Backend might use snake_case or different capitalization, normalize if needed
            const normalized = data.map((emp: any) => ({
                ...emp,
                salary: Number(emp.salary || 0),
                nameAr: emp.name_ar || emp.nameAr,
                positionAr: emp.position_ar || emp.positionAr,
                departmentAr: emp.department_ar || emp.departmentAr,
                nationalId: emp.national_id || emp.nationalId,
                hireDate: emp.hire_date || emp.hireDate,
                contractStartDate: emp.contract_start_date || emp.contractStartDate,
                contractEndDate: emp.contract_end_date || emp.contractEndDate,
                contractFileUrl: emp.contract_file_url || emp.contractFileUrl,
                yearOfBirth: emp.year_of_birth || emp.yearOfBirth,
                nationalityAr: emp.nationality_ar || emp.nationalityAr,
                isActive: !!(emp.is_active ?? emp.isActive),
                currency: emp.currency || 'USD',
            }));
            const filtered = normalized.filter((emp: any) => {
                if (filters.isActive !== undefined && emp.isActive !== filters.isActive) return false;
                return true;
            });
            setAllEmployees(normalized);
            setEmployees(filtered);
        } catch (error) {
            message.error(t('messages.error_load', { defaultValue: 'Failed to load data' }));
        } finally {
            setLoading(false);
        }
    };

    const fetchAllDataForPdf = async () => {
        try {
            const data = await ownerService.getEmployees({ per_page: 10000 });
            const normalized = data.map((emp: any) => ({
                ...emp,
                salary: Number(emp.salary || 0),
                nameAr: emp.name_ar || emp.nameAr,
                positionAr: emp.position_ar || emp.positionAr,
                departmentAr: emp.department_ar || emp.departmentAr,
                nationalId: emp.national_id || emp.nationalId,
                hireDate: emp.hire_date || emp.hireDate,
                contractStartDate: emp.contract_start_date || emp.contractStartDate,
                contractEndDate: emp.contract_end_date || emp.contractEndDate,
                contractFileUrl: emp.contract_file_url || emp.contractFileUrl,
                yearOfBirth: emp.year_of_birth || emp.yearOfBirth,
                nationalityAr: emp.nationality_ar || emp.nationalityAr,
                isActive: !!(emp.is_active ?? emp.isActive),
                currency: emp.currency || 'USD',
            }));
            return normalized.filter((emp: any) => {
                if (filters.isActive !== undefined && emp.isActive !== filters.isActive) return false;
                return true;
            });
        } catch (error) {
            message.error(t('messages.error_load', { defaultValue: 'Failed to load data for export' }));
            return [];
        }
    };

    const handleCreate = () => {
        setEditingEmployee(null);
        form.resetFields();
        form.setFieldsValue({
            isActive: true,
        });
        setModalVisible(true);
    };

    const handleEdit = (employee: Employee) => {
        setEditingEmployee(employee);
        form.setFieldsValue({
            ...employee,
            contractStartDate: employee.contractStartDate ? dayjs(employee.contractStartDate) : undefined,
            contractEndDate: employee.contractEndDate ? dayjs(employee.contractEndDate) : undefined,
            contractFile: employee.contractFileUrl ? [
                {
                    uid: '-1',
                    name: 'Contract PDF',
                    status: 'done',
                    url: employee.contractFileUrl,
                }
            ] : [],
        });
        setModalVisible(true);
    };

    const handleView = (employee: Employee) => {
        setViewingEmployee(employee);
        setDetailsModalVisible(true);
    };

    const handleDelete = (employee: Employee) => {
        Modal.confirm({
            title: t('owner.employees.delete_employee_title'),
            content: t('owner.employees.delete_employee_confirm', { name: employee.name }),
            okText: t('common.delete'),
            okType: 'danger',
            onOk: async () => {
                try {
                    await ownerService.deleteEmployee(employee.id as any);
                    message.success(t('messages.success_delete'));
                    loadEmployees();
                } catch (error) {
                    message.error(t('messages.error_delete'));
                }
            },
        });
    };

    const handleValuesChange = async (changedValues: any) => {
        if (changedValues.nameAr) {
            const translated = await translateText(changedValues.nameAr, 'ar', 'en');
            if (translated && !form.getFieldValue('name')) {
                form.setFieldsValue({ name: translated });
            }
        }
        if (changedValues.positionAr) {
            const translated = await translateText(changedValues.positionAr, 'ar', 'en');
            if (translated && !form.getFieldValue('position')) {
                form.setFieldsValue({ position: translated });
            }
        }
        if (changedValues.nationalityAr) {
            const translated = await translateText(changedValues.nationalityAr, 'ar', 'en');
            if (translated && !form.getFieldValue('nationality')) {
                form.setFieldsValue({ nationality: translated });
            }
        }
    };

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            const formData = new FormData();

            // Append basic fields
            formData.append('name', values.name || '');
            if (values.nameAr) formData.append('name_ar', values.nameAr);
            formData.append('position', values.position || '');
            if (values.positionAr) formData.append('position_ar', values.positionAr);
            formData.append('salary', values.salary?.toString() || '0');
            if (values.phone) formData.append('phone', values.phone);
            if (values.email) formData.append('email', values.email);
            if (values.nationalId) formData.append('national_id', values.nationalId);
            if (values.address) formData.append('address', values.address);
            if (values.yearOfBirth) formData.append('year_of_birth', values.yearOfBirth.toString());
            if (values.nationality) formData.append('nationality', values.nationality);
            if (values.nationalityAr) formData.append('nationality_ar', values.nationalityAr);
            formData.append('is_active', values.isActive ? '1' : '0');
            formData.append('currency', values.currency || 'USD');

            // Append contract fields
            if (values.contractStartDate) formData.append('contract_start_date', values.contractStartDate.format('YYYY-MM-DD'));
            if (values.contractEndDate) formData.append('contract_end_date', values.contractEndDate.format('YYYY-MM-DD'));

            // Handle file upload
            if (values.contractFile && values.contractFile.length > 0 && values.contractFile[0].originFileObj) {
                formData.append('contract_file', values.contractFile[0].originFileObj);
            } else if (editingEmployee && (!values.contractFile || values.contractFile.length === 0) && editingEmployee.contractFileUrl) {
                formData.append('remove_contract_file', '1');
            }

            if (editingEmployee) {
                // For Laravel, PUT method with files often needs _method="PUT" in a POST request or use a specific library
                // However, many APIs handle it. Let's send as POST with _method if needed, but apiClient might handle it.
                // Actually, often PUT doesn't support multipart/form-data well in some PHP setups.
                // I'll add _method hack just in case.
                formData.append('_method', 'PUT');
                await ownerService.updateEmployee(editingEmployee.id as any, formData);
                message.success(t('messages.success_update'));
            } else {
                await ownerService.createEmployee(formData);
                message.success(t('messages.success_save'));
            }

            setModalVisible(false);
            loadEmployees();
        } catch (error) {
            console.error('Submission error:', error);
            message.error(t('messages.error_save'));
        }
    };

    const columns = [
        {
            title: t('owner.employees.name'),
            dataIndex: 'name',
            key: 'name',
            render: (text: string, record: Employee) => {
                const nameToDisplay = i18n.language === 'ar' ? (record.nameAr || record.name) : (record.name || record.nameAr);
                return (
                    <Space>
                        <Avatar size={32} icon={<UserOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />} />
                        <div style={{ fontWeight: 'bold' }}>
                            <DynamicTranslate text={nameToDisplay} sourceLang={isArabicText(nameToDisplay) ? 'ar' : 'en'} />
                        </div>
                    </Space>
                );
            },
        },
        {
            title: t('owner.employees.position'),
            dataIndex: 'position',
            key: 'position',
            responsive: ['md'] as any,
            render: (text: string, record: Employee) => {
                const positionToDisplay = i18n.language === 'ar' ? (record.positionAr || record.position) : (record.position || record.positionAr);
                return (
                    <div>
                        <DynamicTranslate text={positionToDisplay || ''} sourceLang={isArabicText(positionToDisplay) ? 'ar' : 'en'} />
                    </div>
                );
            },
        },
        {
            title: t('owner.employees.contract'),
            dataIndex: 'contractFileUrl',
            key: 'contractFile',
            responsive: ['lg'] as any,
            render: (url: string) => url ? (
                <Tooltip title={t('owner.employees.view_contract')}>
                    <Button
                        type="link"
                        icon={<FilePdfOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
                        href={url}
                        target="_blank"
                        onClick={(e) => e.stopPropagation()}
                    />
                </Tooltip>
            ) : <Text type="secondary">-</Text>,
        },
        {
            title: t('owner.employees.status'),
            dataIndex: 'isActive',
            key: 'isActive',
            render: (isActive: boolean) => (
                <Tag color={isActive ? 'green' : 'red'}>
                    {isActive ? t('common.active') : t('common.inactive')}
                </Tag>
            ),
        },
        {
            title: t('owner.employees.actions'),
            key: 'actions',
            render: (_: any, record: Employee) => (
                <Space size="small">
                    <Button
                        type="text"
                        icon={<EyeOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
                        onClick={(e) => {
                            e.stopPropagation();
                            handleView(record);
                        }}
                        title={t('owner.employees.view_details')}
                    />
                    <Button
                        type="text"
                        icon={<EditOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
                        onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(record);
                        }}
                        title={t('common.edit')}
                    />
                    <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
                        onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(record);
                        }}
                        title={t('common.delete')}
                    />
                </Space>
            ),
        },
    ];

    const totalSalaryUSD = allEmployees.filter(e => e.currency === 'USD' || !e.currency).reduce((sum, emp) => sum + (emp.salary || 0), 0);
    const totalSalaryKWD = allEmployees.filter(e => e.currency === 'KWD').reduce((sum, emp) => sum + (emp.salary || 0), 0);
    
    const countUSD = allEmployees.filter(e => e.currency === 'USD' || !e.currency).length;
    const countKWD = allEmployees.filter(e => e.currency === 'KWD').length;

    const avgSalaryUSD = countUSD > 0 ? Math.round(totalSalaryUSD / countUSD) : 0;
    const avgSalaryKWD = countKWD > 0 ? Math.round(totalSalaryKWD / countKWD) : 0;
    
    const activeCount = allEmployees.filter(e => e.isActive).length;

    return (
        <div className="p-6 md:p-8 fade-in">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-[#3F3F3F] mb-1 tracking-tight">
                        {t('owner.employees.title')}
                    </h1>
                    <p className="text-slate-400 text-sm uppercase tracking-widest font-medium">
                        {t('owner.employees.subtitle', { defaultValue: 'Workforce Management' })}
                    </p>
                </div>
                <Space>
                    <Button
                        icon={<FilePdfOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
                        size="large"
                        onClick={() => setPdfModalVisible(true)}
                    >
                        {t('common.pdf_export.export_btn', { defaultValue: 'Export PDF' })}
                    </Button>
                    <Button
                        type="primary"
                        size="large"
                        icon={<PlusOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
                        onClick={handleCreate}
                    >
                        {t('owner.employees.add_employee')}
                    </Button>
                </Space>
            </div>

            {/* KPI Cards */}
            <Row gutter={[20, 20]} className="mb-8">
                <Col xs={24} sm={12} lg={6}>
                    <Card className="shadow-sm">
                        <Statistic
                            title={<span className="text-slate-400 text-xs uppercase tracking-wider">{t('owner.employees.total_employees')}</span>}
                            value={allEmployees.length}
                            prefix={<UserOutlined className="text-[#C9A24D]" onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
                            valueStyle={{ color: '#3F3F3F', fontWeight: 900 }}
                            loading={loading}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card className="shadow-sm">
                        <Statistic
                            title={<span className="text-slate-400 text-xs uppercase tracking-wider">{t('owner.employees.active_employees')}</span>}
                            value={activeCount}
                            prefix={<MedicineBoxOutlined className="text-green-500" onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
                            valueStyle={{ color: '#3F3F3F', fontWeight: 900 }}
                            loading={loading}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card className="shadow-sm">
                        <Statistic
                            title={<span className="text-slate-400 text-xs uppercase tracking-wider">{t('owner.employees.total_salary')}</span>}
                            value={totalSalaryUSD}
                            prefix={<DollarOutlined className="text-[#C9A24D]" onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
                            valueStyle={{ color: '#3F3F3F', fontWeight: 900 }}
                            formatter={(value) => (
                                <div className="flex flex-col">
                                    <span className="text-lg">{formatCurrency(value as number, 'USD')}</span>
                                    {totalSalaryKWD > 0 && <span className="text-xs text-slate-400 font-normal">{formatCurrency(totalSalaryKWD, 'KWD')}</span>}
                                </div>
                            )}
                            loading={loading}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card className="shadow-sm">
                        <Statistic
                            title={<span className="text-slate-400 text-xs uppercase tracking-wider">{t('owner.employees.avg_salary')}</span>}
                            value={avgSalaryUSD}
                            prefix={<DollarOutlined className="text-slate-400" onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
                            valueStyle={{ color: '#3F3F3F', fontWeight: 900 }}
                            formatter={(value) => (
                                <div className="flex flex-col">
                                    <span className="text-lg">{formatCurrency(value as number, 'USD')}</span>
                                    {avgSalaryKWD > 0 && <span className="text-xs text-slate-400 font-normal">{formatCurrency(avgSalaryKWD, 'KWD')}</span>}
                                </div>
                            )}
                            loading={loading}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Filters */}
            <Card className="shadow-sm mb-6">
                <div className="flex flex-wrap items-center gap-4">
                    <span className="text-slate-400 text-xs uppercase tracking-widest font-bold">{t('owner.employees.status')}:</span>
                    <Radio.Group
                        value={filters.isActive}
                        onChange={(e) => setFilters({ ...filters, isActive: e.target.value })}
                    >
                        <Radio.Button value={undefined}>{t('common.all')}</Radio.Button>
                        <Radio.Button value={true}>{t('common.active')}</Radio.Button>
                        <Radio.Button value={false}>{t('common.inactive')}</Radio.Button>
                    </Radio.Group>
                </div>
            </Card>

            {/* Employee Cards */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Spin size="large" />
                </div>
            ) : employees.length === 0 ? (
                <Card className="shadow-sm">
                    <div className="flex flex-col items-center justify-center py-16">
                        <TeamOutlined className="text-5xl text-slate-200 mb-4" onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />
                        <p className="text-slate-400 text-lg font-medium">{t('owner.employees.no_employees', { defaultValue: 'No employees found' })}</p>
                    </div>
                </Card>
            ) : (
            <Table
                columns={columns}
                dataSource={employees}
                loading={loading}
                rowKey="id"
                scroll={{ x: 800 }}
                pagination={{
                    current: page,
                    pageSize: pageSize,
                    onChange: (p, ps) => {
                        setPage(p);
                        setPageSize(ps);
                    },
                    showSizeChanger: true,
                }}
                className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden"
                onRow={(record) => ({
                    onClick: () => handleView(record),
                    className: 'cursor-pointer hover:bg-slate-50 transition-colors'
                })}
            />
            )}

            {/* Employee Management Modal */}
            <Modal
                title={editingEmployee ? t('owner.employees.edit_employee') : t('owner.employees.add_employee')}
                open={modalVisible}
                onOk={handleSubmit}
                onCancel={() => setModalVisible(false)}
                width={700}
                okText={t('common.save')}
                cancelText={t('common.cancel')}
            >
                <Form form={form} layout="vertical" onValuesChange={handleValuesChange}>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="nameAr" label={t('common.name_ar')}>
                                <Input placeholder={t('owner.employees.name_ar_placeholder')} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="name" label={t('common.name')}>
                                <Input placeholder={t('owner.employees.name_placeholder')} />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item name="nationalityAr" label={t('common.nationality_ar', { defaultValue: 'Nationality (AR)' })}>
                                <Input placeholder="مثال: مصري" />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="nationality" label={t('common.nationality')}>
                                <Input placeholder="e.g., Egyptian" />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="yearOfBirth" label={t('common.year_of_birth')}>
                                <InputNumber style={{ width: '100%' }} placeholder="e.g., 1990" />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="positionAr" label={`${t('owner.employees.position')} (العربية)`}>
                                <Input placeholder="مثال: مدير فني" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="position" label={t('owner.employees.position')}>
                                <Input placeholder={t('owner.employees.position_placeholder')} />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="salary" label={t('owner.employees.salary')}>
                                <InputNumber
                                    style={{ width: '100%' }}
                                    placeholder={t('owner.employees.salary_placeholder')}
                                    formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                    parser={(value) => value!.replace(/(,*)/g, '')}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="currency" label={t('common.currency')} initialValue="USD">
                                <Select>
                                    <Option value="USD">USD ($)</Option>
                                    <Option value="KWD">KWD (د.ك)</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="phone" label={t('common.phone_number')}>
                                <Input placeholder={t('owner.employees.phone_placeholder')} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="email" label={t('common.email')}>
                                <Input placeholder={t('owner.employees.email_placeholder')} />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="nationalId" label={t('common.national_id')}>
                                <Input placeholder={t('owner.employees.national_id_placeholder')} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="address" label={t('common.address')}>
                                <Input placeholder={t('owner.employees.address_placeholder')} />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Form.Item name="isActive" label={t('owner.employees.status')} valuePropName="checked">
                        <Switch checkedChildren={t('common.active')} unCheckedChildren={t('common.inactive')} />
                    </Form.Item>
                    <Divider>{t('owner.employees.contract_info')}</Divider>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="contractStartDate" label={t('owner.employees.contract_start')}>
                                <DatePicker style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="contractEndDate" label={t('owner.employees.contract_end')}>
                                <DatePicker style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Form.Item
                        name="contractFile"
                        label={t('owner.employees.contract_pdf')}
                        valuePropName="fileList"
                        getValueFromEvent={(e) => Array.isArray(e) ? e : e?.fileList}
                    >
                        <Upload beforeUpload={() => false} maxCount={1} listType="text">
                            <Button icon={<UploadOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}>
                                {t('owner.employees.upload_pdf')}
                            </Button>
                        </Upload>
                    </Form.Item>
                </Form>
            </Modal>

            {/* View Details Modal */}
            <Modal
                title={t('owner.employees.employee_details')}
                open={detailsModalVisible}
                onCancel={() => setDetailsModalVisible(false)}
                footer={[
                    <Button key="close" onClick={() => setDetailsModalVisible(false)}>
                        {t('common.close')}
                    </Button>
                ]}
                width={700}
            >
                {viewingEmployee && (
                    <Space direction="vertical" size="large" style={{ width: '100%' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                            <Avatar size={64} icon={<UserOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />} />
                            <div>
                                <Title level={4} style={{ margin: 0 }}>
                                    <DynamicTranslate
                                        text={i18n.language === 'ar' ? (viewingEmployee.nameAr || viewingEmployee.name) : (viewingEmployee.name || viewingEmployee.nameAr)}
                                        sourceLang={isArabicText(i18n.language === 'ar' ? (viewingEmployee.nameAr || viewingEmployee.name) : (viewingEmployee.name || viewingEmployee.nameAr)) ? 'ar' : 'en'}
                                    />
                                </Title>
                                <Text type="secondary">
                                    <DynamicTranslate
                                        text={i18n.language === 'ar' ? (viewingEmployee.positionAr || viewingEmployee.position) : (viewingEmployee.position || viewingEmployee.positionAr)}
                                        sourceLang={isArabicText(i18n.language === 'ar' ? (viewingEmployee.positionAr || viewingEmployee.position) : (viewingEmployee.position || viewingEmployee.positionAr)) ? 'ar' : 'en'}
                                    />
                                </Text>
                            </div>
                            <Tag color={viewingEmployee.isActive ? 'success' : 'error'} style={{ marginLeft: 'auto' }}>
                                {viewingEmployee.isActive ? t('common.active') : t('common.inactive')}
                            </Tag>
                        </div>

                        <Descriptions title={t('owner.employees.job_info')} bordered column={2}>
                            <Descriptions.Item label={t('owner.employees.position')} span={2}>
                                <DynamicTranslate
                                    text={i18n.language === 'ar' ? (viewingEmployee.positionAr || viewingEmployee.position) : (viewingEmployee.position || viewingEmployee.positionAr)}
                                    sourceLang={isArabicText(i18n.language === 'ar' ? (viewingEmployee.positionAr || viewingEmployee.position) : (viewingEmployee.position || viewingEmployee.positionAr)) ? 'ar' : 'en'}
                                />
                            </Descriptions.Item>
                            <Descriptions.Item label={t('owner.employees.salary')} span={2}>{formatCurrency(viewingEmployee.salary, viewingEmployee.currency)}</Descriptions.Item>
                        </Descriptions>

                        <Descriptions title={t('owner.employees.contact_info')} bordered column={2}>
                            <Descriptions.Item label={t('owner.employees.email')}>{viewingEmployee.email || '-'}</Descriptions.Item>
                            <Descriptions.Item label={t('owner.employees.phone')}>{viewingEmployee.phone || '-'}</Descriptions.Item>
                            <Descriptions.Item label={t('owner.employees.address')} span={2}>{viewingEmployee.address || '-'}</Descriptions.Item>
                        </Descriptions>

                        <Descriptions title={t('owner.employees.personal_info')} bordered column={2}>
                            <Descriptions.Item label={t('common.year_of_birth')}>{viewingEmployee.yearOfBirth || '-'}</Descriptions.Item>
                            <Descriptions.Item label={t('common.nationality')}>
                                <DynamicTranslate
                                    text={i18n.language === 'ar' ? (viewingEmployee.nationalityAr || viewingEmployee.nationality) : (viewingEmployee.nationality || viewingEmployee.nationalityAr)}
                                    sourceLang={isArabicText(i18n.language === 'ar' ? (viewingEmployee.nationalityAr || viewingEmployee.nationality) : (viewingEmployee.nationality || viewingEmployee.nationalityAr)) ? 'ar' : 'en'}
                                />
                            </Descriptions.Item>
                            <Descriptions.Item label={t('owner.employees.national_id')}>{viewingEmployee.nationalId || '-'}</Descriptions.Item>
                        </Descriptions>

                        <Descriptions title={t('owner.employees.contract_info')} bordered column={2}>
                            <Descriptions.Item label={t('owner.employees.contract_start')}>{formatDate(viewingEmployee.contractStartDate)}</Descriptions.Item>
                            <Descriptions.Item label={t('owner.employees.contract_end')}>{formatDate(viewingEmployee.contractEndDate)}</Descriptions.Item>
                            <Descriptions.Item label={t('owner.employees.contract_pdf')} span={2}>
                                {viewingEmployee.contractFileUrl ? (
                                    <Button
                                        type="primary"
                                        ghost
                                        icon={<FilePdfOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
                                        href={viewingEmployee.contractFileUrl}
                                        target="_blank"
                                    >
                                        {t('owner.employees.view_contract')}
                                    </Button>
                                ) : '-'}
                            </Descriptions.Item>
                        </Descriptions>
                    </Space>
                )}
            </Modal>

            {/* PDF Export Modal */}
            <GenericPdfExportModal
                open={pdfModalVisible}
                onClose={() => setPdfModalVisible(false)}
                rows={employees}
                fetchAllData={fetchAllDataForPdf}
                fields={EMPLOYEE_PDF_FIELDS}
                defaultFields={DEFAULT_EMPLOYEE_PDF_FIELDS}
                groups={[
                    { titleKey: 'basic', keys: ['name', 'position', 'nationality', 'status'] },
                    { titleKey: 'contract', keys: ['salary', 'contractStartDate', 'contractEndDate'] },
                    { titleKey: 'contact', keys: ['phone', 'email', 'nationalId', 'address', 'yearOfBirth'] },
                ]}
                reportTitle="Employees Report"
                reportTitleAr="تقرير الموظفين"
            />
        </div>
    );
};
