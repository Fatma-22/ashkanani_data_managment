import apiClient from './api';

export const ownerService = {
    // Financials
    getFinancialStats: async (params?: any): Promise<any> => {
        const response: any = await apiClient.get('/owner/financials/stats', { params });
        return response.data.data || response.data;
    },

    getFinancialRecords: async (params?: any): Promise<any[]> => {
        const response: any = await apiClient.get('/owner/financials', { params });
        return response.data.data || response.data;
    },

    createFinancialRecord: async (data: any): Promise<any> => {
        const response: any = await apiClient.post('/owner/financials', data);
        return response.data;
    },

    updateFinancialRecord: async (id: string | number, data: any): Promise<any> => {
        const response: any = await apiClient.put(`/owner/financials/${id}`, data);
        return response.data;
    },

    deleteFinancialRecord: async (id: string | number): Promise<any> => {
        const response: any = await apiClient.delete(`/owner/financials/${id}`);
        return response.data;
    },

    // Admins
    getAdmins: async (): Promise<any[]> => {
        const response: any = await apiClient.get('/owner/admins');
        return (response.data?.data || response.data) as any[];
    },

    createAdmin: async (data: any): Promise<any> => {
        const response: any = await apiClient.post('/owner/admins', data);
        return response.data?.data || response.data;
    },

    updateAdmin: async (id: string | number, data: any): Promise<any> => {
        const response: any = await apiClient.put(`/owner/admins/${id}`, data);
        return response.data?.data || response.data;
    },

    deleteAdmin: async (id: string | number): Promise<any> => {
        const response: any = await apiClient.delete(`/owner/admins/${id}`);
        return response.data?.data || response.data;
    },

    // Employees
    getEmployees: async (params?: any): Promise<any[]> => {
        const response: any = await apiClient.get('/owner/employees', { params });
        return response.data.data || response.data;
    },

    createEmployee: async (data: any): Promise<any> => {
        const response: any = await apiClient.post('/owner/employees', data);
        return response.data;
    },

    updateEmployee: async (id: string | number, data: any): Promise<any> => {
        // We use POST with _method=PUT for multipart/form-data support in Laravel
        if (data instanceof FormData) {
            const response: any = await apiClient.post(`/owner/employees/${id}`, data);
            return response.data;
        }
        const response: any = await apiClient.put(`/owner/employees/${id}`, data);
        return response.data;
    },

    deleteEmployee: async (id: string | number): Promise<any> => {
        const response: any = await apiClient.delete(`/owner/employees/${id}`);
        return response.data;
    },
};
