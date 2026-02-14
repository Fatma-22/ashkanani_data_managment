import type { Admin, AdminPermissions, FinancialRecord, FinancialStats, Employee } from '../types';
import { generateId } from '../utils/helpers';
import dayjs from 'dayjs';

// Helper delay function
const delay = (ms: number = 300) => new Promise(resolve => setTimeout(resolve, ms));

// ===== ADMIN MANAGEMENT =====
let mockAdmins: Admin[] = [
    {
        id: 'admin-1',
        name: 'Ahmed Hassan',
        email: 'ahmed@ashkenani.com',
        phone: '+965 9999 1111',
        avatar: 'https://i.pravatar.cc/150?u=adminhassan',
        permissions: {
            canAddPlayers: true,
            canEditPlayers: true,
            canDeletePlayers: true,
            canAddAgents: true,
            canEditAgents: true,
            canDeleteAgents: false,
            canViewReports: true,
            canViewFinancials: false,
        },
        isActive: true,
        createdAt: '2024-01-01',
        createdBy: 'owner-1',
        password: 'password123',
    },
    {
        id: 'admin-2',
        name: 'Sara Al-Mutairi',
        email: 'sara@ashkenani.com',
        phone: '+965 9999 2222',
        permissions: {
            canAddPlayers: false,
            canEditPlayers: true,
            canDeletePlayers: false,
            canAddAgents: false,
            canEditAgents: true,
            canDeleteAgents: false,
            canViewReports: true,
            canViewFinancials: false,
        },
        isActive: true,
        createdAt: '2024-02-01',
        createdBy: 'owner-1',
        password: 'password123',
    },
];

export const mockAdminApi = {
    getAll: async (): Promise<Admin[]> => {
        await delay(300);
        return [...mockAdmins];
    },

    getById: async (id: string): Promise<Admin | undefined> => {
        await delay(200);
        return mockAdmins.find(admin => admin.id === id);
    },

    create: async (adminData: Partial<Admin>): Promise<Admin> => {
        await delay(400);
        const newAdmin: Admin = {
            id: generateId(),
            name: adminData.name || '',
            email: adminData.email || '',
            phone: adminData.phone,
            avatar: adminData.avatar,
            permissions: adminData.permissions || {
                canAddPlayers: false,
                canEditPlayers: false,
                canDeletePlayers: false,
                canAddAgents: false,
                canEditAgents: false,
                canDeleteAgents: false,
                canViewReports: false,
                canViewFinancials: false,
            },
            isActive: adminData.isActive ?? true,
            createdAt: new Date().toISOString(),
            createdBy: 'owner-1',
            password: adminData.password || 'password123',
        };
        mockAdmins.push(newAdmin);
        return newAdmin;
    },

    update: async (id: string, updates: Partial<Admin>): Promise<Admin> => {
        await delay(400);
        const index = mockAdmins.findIndex(admin => admin.id === id);
        if (index === -1) throw new Error('Admin not found');
        mockAdmins[index] = { ...mockAdmins[index], ...updates };
        return mockAdmins[index];
    },

    delete: async (id: string): Promise<void> => {
        await delay(300);
        mockAdmins = mockAdmins.filter(admin => admin.id !== id);
    },
};

// ===== FINANCIAL MANAGEMENT =====
let mockFinancialRecords: FinancialRecord[] = [
    {
        id: 'fin-1',
        type: 'income',
        category: 'Player Transfer',
        amount: 5000000,
        currency: 'USD',
        description: 'Transfer fee from Mohamed Salah deal',
        descriptionAr: 'رسوم انتقال من صفقة محمد صلاح',
        date: '2024-01-15',
        relatedTo: '1',
        relatedToType: 'player',
        createdBy: 'owner-1',
        createdAt: '2024-01-15',
    },
    {
        id: 'fin-2',
        type: 'expense',
        category: 'Agent Commission',
        amount: 250000,
        currency: 'USD',
        description: 'Commission for agent services',
        descriptionAr: 'عمولة خدمات الوكيل',
        date: '2024-01-20',
        relatedTo: 'agent-1',
        relatedToType: 'agent',
        createdBy: 'owner-1',
        createdAt: '2024-01-20',
    },
    {
        id: 'fin-3',
        type: 'expense',
        category: 'Salaries',
        amount: 150000,
        currency: 'USD',
        description: 'Monthly employee salaries',
        descriptionAr: 'رواتب الموظفين الشهرية',
        date: '2024-02-01',
        createdBy: 'owner-1',
        createdAt: '2024-02-01',
    },
    {
        id: 'fin-4',
        type: 'income',
        category: 'Sponsorship',
        amount: 1000000,
        currency: 'USD',
        description: 'Annual sponsorship deal',
        descriptionAr: 'صفقة رعاية سنوية',
        date: '2024-01-10',
        createdBy: 'owner-1',
        createdAt: '2024-01-10',
    },
];

export const mockFinancialApi = {
    getAll: async (filters?: { type?: 'income' | 'expense'; startDate?: string; endDate?: string }): Promise<FinancialRecord[]> => {
        await delay(300);
        let filtered = [...mockFinancialRecords];

        if (filters?.type) {
            filtered = filtered.filter(r => r.type === filters.type);
        }

        if (filters?.startDate) {
            filtered = filtered.filter(r => r.date >= filters.startDate!);
        }

        if (filters?.endDate) {
            filtered = filtered.filter(r => r.date <= filters.endDate!);
        }

        return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    },

    getById: async (id: string): Promise<FinancialRecord | undefined> => {
        await delay(200);
        return mockFinancialRecords.find(record => record.id === id);
    },

    create: async (recordData: Partial<FinancialRecord>): Promise<FinancialRecord> => {
        await delay(400);
        const newRecord: FinancialRecord = {
            id: generateId(),
            type: recordData.type || 'expense',
            category: recordData.category || '',
            amount: recordData.amount || 0,
            currency: recordData.currency || 'USD',
            description: recordData.description || '',
            descriptionAr: recordData.descriptionAr,
            date: recordData.date || new Date().toISOString().split('T')[0],
            relatedTo: recordData.relatedTo,
            relatedToType: recordData.relatedToType,
            createdBy: 'owner-1',
            createdAt: new Date().toISOString(),
        };
        mockFinancialRecords.push(newRecord);
        return newRecord;
    },

    update: async (id: string, updates: Partial<FinancialRecord>): Promise<FinancialRecord> => {
        await delay(400);
        const index = mockFinancialRecords.findIndex(record => record.id === id);
        if (index === -1) throw new Error('Financial record not found');
        mockFinancialRecords[index] = { ...mockFinancialRecords[index], ...updates };
        return mockFinancialRecords[index];
    },

    delete: async (id: string): Promise<void> => {
        await delay(300);
        mockFinancialRecords = mockFinancialRecords.filter(record => record.id !== id);
    },

    getStats: async (): Promise<FinancialStats> => {
        await delay(300);
        const now = dayjs();
        const thisMonth = now.format('YYYY-MM');
        const thisYear = now.format('YYYY');

        const income = mockFinancialRecords.filter(r => r.type === 'income');
        const expense = mockFinancialRecords.filter(r => r.type === 'expense');

        const totalIncome = income.reduce((sum, r) => sum + r.amount, 0);
        const totalExpense = expense.reduce((sum, r) => sum + r.amount, 0);

        const monthlyIncome = income.filter(r => r.date.startsWith(thisMonth)).reduce((sum, r) => sum + r.amount, 0);
        const monthlyExpense = expense.filter(r => r.date.startsWith(thisMonth)).reduce((sum, r) => sum + r.amount, 0);

        const yearlyIncome = income.filter(r => r.date.startsWith(thisYear)).reduce((sum, r) => sum + r.amount, 0);
        const yearlyExpense = expense.filter(r => r.date.startsWith(thisYear)).reduce((sum, r) => sum + r.amount, 0);

        return {
            totalIncome,
            totalExpense,
            netProfit: totalIncome - totalExpense,
            monthlyIncome,
            monthlyExpense,
            yearlyIncome,
            yearlyExpense,
        };
    },
};

// ===== EMPLOYEE MANAGEMENT =====
let mockEmployees: Employee[] = [
    {
        id: 'emp-1',
        name: 'Fatima Al-Sabah',
        nameAr: 'فاطمة الصباح',
        position: 'Marketing Manager',
        positionAr: 'مدير التسويق',
        department: 'Marketing',
        departmentAr: 'التسويق',
        salary: 5000,
        hireDate: '2023-01-15',
        phone: '+965 9999 3333',
        email: 'fatima@ashkenani.com',
        nationalId: '287010100001',
        address: 'Kuwait City, Kuwait',
        isActive: true,
        createdAt: '2023-01-15',
    },
    {
        id: 'emp-2',
        name: 'Omar Al-Ahmad',
        nameAr: 'عمر الأحمد',
        position: 'Legal Advisor',
        positionAr: 'مستشار قانوني',
        department: 'Legal',
        departmentAr: 'القانونية',
        salary: 6000,
        hireDate: '2023-03-01',
        phone: '+965 9999 4444',
        email: 'omar@ashkenani.com',
        nationalId: '285050500002',
        address: 'Salmiya, Kuwait',
        isActive: true,
        createdAt: '2023-03-01',
    },
    {
        id: 'emp-3',
        name: 'Layla Hassan',
        nameAr: 'ليلى حسن',
        position: 'Finance Officer',
        positionAr: 'موظف مالي',
        department: 'Finance',
        departmentAr: 'المالية',
        salary: 4500,
        hireDate: '2023-06-10',
        phone: '+965 9999 5555',
        email: 'layla@ashkenani.com',
        isActive: true,
        createdAt: '2023-06-10',
    },
];

export const mockEmployeeApi = {
    getAll: async (): Promise<Employee[]> => {
        await delay(300);
        return [...mockEmployees];
    },

    getById: async (id: string): Promise<Employee | undefined> => {
        await delay(200);
        return mockEmployees.find(emp => emp.id === id);
    },

    create: async (employeeData: Partial<Employee>): Promise<Employee> => {
        await delay(400);
        const newEmployee: Employee = {
            id: generateId(),
            name: employeeData.name || '',
            nameAr: employeeData.nameAr,
            position: employeeData.position || '',
            positionAr: employeeData.positionAr,
            department: employeeData.department || '',
            departmentAr: employeeData.departmentAr,
            salary: employeeData.salary || 0,
            hireDate: employeeData.hireDate || new Date().toISOString().split('T')[0],
            phone: employeeData.phone,
            email: employeeData.email,
            nationalId: employeeData.nationalId,
            address: employeeData.address,
            isActive: employeeData.isActive ?? true,
            createdAt: new Date().toISOString(),
        };
        mockEmployees.push(newEmployee);
        return newEmployee;
    },

    update: async (id: string, updates: Partial<Employee>): Promise<Employee> => {
        await delay(400);
        const index = mockEmployees.findIndex(emp => emp.id === id);
        if (index === -1) throw new Error('Employee not found');
        mockEmployees[index] = { ...mockEmployees[index], ...updates };
        return mockEmployees[index];
    },

    delete: async (id: string): Promise<void> => {
        await delay(300);
        mockEmployees = mockEmployees.filter(emp => emp.id !== id);
    },
};
