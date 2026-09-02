import apiClient from './api';
import { Agent } from '../types';

export const agentService = {
    getAll: async (params?: any): Promise<{ agents: Agent[], total: number }> => {
        const response: any = await apiClient.get('/agents', { params });
        return {
            agents: response.data.data,
            total: response.data.meta?.total || response.data.data.length
        };
    },

    getById: async (id: string): Promise<Agent> => {
        const response: any = await apiClient.get(`/agents/${id}`);
        return response.data;
    },

    create: async (data: any): Promise<Agent> => {
        const response: any = await apiClient.post('/agents', data, {
            headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {}
        });
        return response.data;
    },

    update: async (id: string, data: any): Promise<Agent> => {
        // If it's FormData, we need to handle the method override for PUT
        const finalData = data instanceof FormData ? data : data;
        const config = data instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};

        // For Laravel, when using multipart/form-data with PUT, we often need to use POST and add _method=PUT
        if (data instanceof FormData) {
            data.append('_method', 'PUT');
            const response: any = await apiClient.post(`/agents/${id}`, data, config);
            return response.data;
        }

        const response: any = await apiClient.put(`/agents/${id}`, data, config);
        return response.data;
    },


    delete: async (id: string): Promise<void> => {
        await apiClient.delete(`/agents/${id}`);
    },
};
