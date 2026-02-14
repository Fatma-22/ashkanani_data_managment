import React, { useEffect, useState } from 'react';
import { Card, Button, Space, Modal, Form, Input, InputNumber, Select, DatePicker, message, Typography, Row, Col, Statistic, Spin, Table, Tag, Divider, Radio } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, UserOutlined, MedicineBoxOutlined, DollarOutlined } from '@ant-design/icons';
import { Avatar, Switch } from 'antd';
import { Employee } from '../../types';
import { mockEmployeeApi } from '../../services/mockOwnerApi';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

export const OwnerEmployees: React.FC = () => {
    const { t } = useTranslation();
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
    const [filters, setFilters] = useState({
        department: undefined as string | undefined,
        isActive: undefined as boolean | undefined,
    });
    const [form] = Form.useForm();

    useEffect(() => {
        loadEmployees();
    }, [filters]);

    const loadEmployees = async () => {
        setLoading(true);
        try {
            const data = await mockEmployeeApi.getAll();
            const filtered = data.filter(emp => {
                if (filters.department && emp.department !== filters.department) return false;
                if (filters.isActive !== undefined && emp.isActive !== filters.isActive) return false;
                return true;
            });
            setEmployees(filtered);
        } catch (error) {
            message.error(t('owner.employees.load_failed'));
        } finally {
            setLoading(false);
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
            hireDate: employee.hireDate ? dayjs(employee.hireDate) : undefined,
        });
        setModalVisible(true);
    };

    const handleDelete = (employee: Employee) => {
        Modal.confirm({
            title: t('owner.employees.delete_employee_title'),
            content: t('owner.employees.delete_employee_confirm', { name: employee.name }),
            okText: t('common.delete'),
            okType: 'danger',
            onOk: async () => {
                try {
                    await mockEmployeeApi.delete(employee.id);
                    message.success(t('owner.employees.delete_success'));
                    loadEmployees();
                } catch (error) {
                    message.error(t('owner.employees.delete_failed'));
                }
            },
        });
    };

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();

            if (editingEmployee) {
                await mockEmployeeApi.update(editingEmployee.id, {
                    ...values,
                    hireDate: values.hireDate ? values.hireDate.format('YYYY-MM-DD') : undefined,
                });
                message.success(t('owner.employees.updated_success'));
            } else {
                await mockEmployeeApi.create({
                    ...values,
                    hireDate: values.hireDate ? values.hireDate.format('YYYY-MM-DD') : undefined,
                });
                message.success(t('owner.employees.created_success'));
            }

            setModalVisible(false);
            loadEmployees();
        } catch (error) {
            message.error(t('owner.employees.save_failed'));
        }
    };

    const columns = [
        {
            title: t('owner.employees.name'),
            dataIndex: 'name',
            key: 'name',
            render: (text: string, record: Employee) => (
                <Space>
                    <Avatar size={32} icon={<UserOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />} />
                    <div>
                        <div style={{ fontWeight: 'bold' }}>{text}</div>
                        {record.nameAr && (
                            <div style={{ fontSize: 12, color: '#666' }}>{record.nameAr}</div>
                        )}
                    </div>
                </Space>
            ),
        },
        {
            title: t('owner.employees.position'),
            dataIndex: 'position',
            key: 'position',
            render: (text: string, record: Employee) => (
                <div>
                    <div>{text}</div>
                    {record.positionAr && (
                        <div style={{ fontSize: 12, color: '#666' }}>{record.positionAr}</div>
                    )}
                </div>
            ),
        },
        {
            title: t('owner.employees.department'),
            dataIndex: 'department',
            key: 'department',
            render: (text: string, record: Employee) => (
                <div>
                    <div>{t(`owner.employees.${(text || '').toLowerCase()}`, { defaultValue: text })}</div>
                    {record.departmentAr && (
                        <div style={{ fontSize: 12, color: '#666' }}>{record.departmentAr}</div>
                    )}
                </div>
            ),
        },
        {
            title: t('owner.employees.salary'),
            dataIndex: 'salary',
            key: 'salary',
            render: (salary: number) => `$${salary.toLocaleString()}`,
        },
        {
            title: t('owner.employees.hire_date'),
            dataIndex: 'hireDate',
            key: 'hireDate',
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
                <Space size="middle">
                    <Button
                        type="link"
                        icon={<EditOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
                        onClick={() => handleEdit(record)}
                    >
                        {t('common.edit')}
                    </Button>
                    <Button
                        type="link"
                        danger
                        icon={<DeleteOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
                        onClick={() => handleDelete(record)}
                    >
                        {t('common.delete')}
                    </Button>
                </Space>
            ),
        },
    ];

    const departments = Array.from(new Set(employees.map(e => e.department).filter(Boolean))) as string[];
    const totalSalary = employees.reduce((sum, emp) => sum + emp.salary, 0);

    return (
        <div className="fade-in">
            <div style={{ marginBottom: 24 }}>
                <Title level={2}>{t('owner.employees.title')}</Title>
                <Text type="secondary">{t('owner.employees.subtitle')}</Text>
            </div>

            <Space direction="vertical" size="large" style={{ width: '100%' }}>
                {/* KPI Cards */}
                <Row gutter={[16, 16]}>
                    <Col xs={24} sm={12} lg={6}>
                        <Card className="card-hover">
                            <Statistic
                                title={t('owner.employees.total_employees')}
                                value={employees.length}
                                prefix={<UserOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} className="text-[#3F3F3F]" />}
                                valueStyle={{ color: '#3F3F3F', fontWeight: 'bold' }}
                                loading={loading}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Card className="card-hover">
                            <Statistic
                                title={t('owner.employees.active_employees')}
                                value={employees.filter(e => e.isActive).length}
                                prefix={<MedicineBoxOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} className="text-[#C9A24D]" />}
                                valueStyle={{ color: '#3F3F3F', fontWeight: 'bold' }}
                                loading={loading}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Card className="card-hover">
                            <Statistic
                                title={t('owner.employees.total_salary')}
                                value={totalSalary}
                                prefix={<DollarOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} className="text-[#52c41a]" />}
                                valueStyle={{ color: '#3F3F3F', fontWeight: 'bold' }}
                                formatter={(value) => `$${(value as number).toLocaleString()}`}
                                loading={loading}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Card className="card-hover">
                            <Statistic
                                title={t('owner.employees.avg_salary')}
                                value={employees.length > 0 ? Math.round(totalSalary / employees.length) : 0}
                                prefix={<DollarOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} className="text-[#C9A24D]" />}
                                valueStyle={{ color: '#3F3F3F', fontWeight: 'bold' }}
                                formatter={(value) => `$${(value as number).toLocaleString()}`}
                                loading={loading}
                            />
                        </Card>
                    </Col>
                </Row>

                {/* Filters and Actions */}
                <Card>
                    <Row justify="space-between" align="middle">
                        <Col>
                            <Space size="large">
                                <div>
                                    <Text strong className="block mb-2 text-slate-400 uppercase text-[10px] tracking-widest">
                                        {t('owner.employees.department')}
                                    </Text>
                                    <Select
                                        placeholder={t('owner.employees.select_department')}
                                        value={filters.department}
                                        onChange={(value) => setFilters({ ...filters, department: value })}
                                        style={{ width: 200 }}
                                        allowClear
                                    >
                                        {departments.map(dept => (
                                            <Option key={dept} value={dept}>{t(`owner.employees.${dept.toLowerCase()}`, { defaultValue: dept })}</Option>
                                        ))}
                                    </Select>
                                </div>
                                <div>
                                    <Text strong className="block mb-2 text-slate-400 uppercase text-[10px] tracking-widest">
                                        {t('owner.employees.status')}
                                    </Text>
                                    <Radio.Group
                                        value={filters.isActive}
                                        onChange={(e) => setFilters({ ...filters, isActive: e.target.value })}
                                    >
                                        <Radio.Button value={undefined}>{t('common.all')}</Radio.Button>
                                        <Radio.Button value={true}>{t('common.active')}</Radio.Button>
                                        <Radio.Button value={false}>{t('common.inactive')}</Radio.Button>
                                    </Radio.Group>
                                </div>
                            </Space>
                        </Col>
                        <Col>
                            <Button
                                type="primary"
                                icon={<PlusOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
                                onClick={handleCreate}
                                style={{ background: '#3F3F3F' }}
                            >
                                {t('owner.employees.add_employee')}
                            </Button>
                        </Col>
                    </Row>
                </Card>

                {/* Employees Table */}
                <Card title={t('owner.employees.employees_title')} className="card-hover">
                    <Spin spinning={loading}>
                        <Table
                            dataSource={employees}
                            columns={columns}
                            rowKey="id"
                            pagination={{
                                pageSize: 10,
                                showTotal: (total) => `${t('common.total')}: ${total}`,
                                position: ['bottom' as any],
                            }}
                        />
                    </Spin>
                </Card>

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
                    <Form form={form} layout="vertical">
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item
                                    name="name"
                                    label={t('common.name')}
                                    rules={[{ required: true }]}
                                >
                                    <Input placeholder={t('owner.employees.name_placeholder')} />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    name="nameAr"
                                    label={t('common.name_ar')}
                                >
                                    <Input placeholder={t('owner.employees.name_ar_placeholder')} />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item
                                    name="position"
                                    label={t('owner.employees.position')}
                                    rules={[{ required: true }]}
                                >
                                    <Input placeholder={t('owner.employees.position_placeholder')} />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    name="positionAr"
                                    label={t('owner.employees.position_ar')}
                                >
                                    <Input placeholder={t('owner.employees.position_ar_placeholder')} />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item
                                    name="department"
                                    label={t('owner.employees.department')}
                                    rules={[{ required: true }]}
                                >
                                    <Select placeholder={t('owner.employees.department_placeholder')}>
                                        <Option value="Marketing">{t('owner.employees.marketing')}</Option>
                                        <Option value="Legal">{t('owner.employees.legal')}</Option>
                                        <Option value="Finance">{t('owner.employees.finance')}</Option>
                                        <Option value="Operations">{t('owner.employees.operations')}</Option>
                                        <Option value="HR">{t('owner.employees.hr')}</Option>
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    name="departmentAr"
                                    label={t('owner.employees.department_ar')}
                                >
                                    <Input placeholder={t('owner.employees.department_ar_placeholder')} />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item
                                    name="salary"
                                    label={t('owner.employees.salary')}
                                    rules={[{ required: true, type: 'number', min: 0 }]}
                                >
                                    <InputNumber
                                        style={{ width: '100%' }}
                                        placeholder={t('owner.employees.salary_placeholder')}
                                        formatter={(value) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                        parser={(value) => value!.replace(/\$\s?|(,*)/g, '')}
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    name="hireDate"
                                    label={t('owner.employees.hire_date')}
                                    rules={[{ required: true }]}
                                >
                                    <DatePicker style={{ width: '100%' }} />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item
                                    name="phone"
                                    label={t('common.phone_number')}
                                >
                                    <Input placeholder={t('owner.employees.phone_placeholder')} />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    name="email"
                                    label={t('common.email')}
                                    rules={[{ type: 'email' }]}
                                >
                                    <Input placeholder={t('owner.employees.email_placeholder')} />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item
                                    name="nationalId"
                                    label={t('common.national_id')}
                                >
                                    <Input placeholder={t('owner.employees.national_id_placeholder')} />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    name="address"
                                    label={t('common.address')}
                                >
                                    <Input placeholder={t('owner.employees.address_placeholder')} />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Form.Item
                            name="isActive"
                            label={t('owner.employees.status')}
                            valuePropName="checked"
                        >
                            <Switch checkedChildren={t('common.active')} unCheckedChildren={t('common.inactive')} />
                        </Form.Item>
                    </Form>
                </Modal>
            </Space>
        </div>
    );
};