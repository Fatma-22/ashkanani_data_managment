import apiClient from './api';
import { Contract } from '../types';

export const contractService = {
    getAll: async (params?: any): Promise<{ data: Contract[], total: number }> => {
        const response: any = await apiClient.get('/contracts', { params });
        return {
            data: response.data.data,
            total: response.data.meta?.total || response.data.data.length
        };
    },

    getByPlayerId: async (playerId: string, token?: string): Promise<Contract[]> => {
        const response: any = await apiClient.get('/contracts', { 
            params: { 
                player_id: playerId,
                share_token: token
            } 
        });
        return response.data.data;
    },

    getById: async (id: string): Promise<Contract> => {
        const response: any = await apiClient.get(`/contracts/${id}`);
        return response.data;
    },

    create: async (data: Partial<Contract>): Promise<Contract> => {
        const response: any = await apiClient.post('/contracts', data);
        return response.data;
    },

    update: async (id: string, data: Partial<Contract>): Promise<Contract> => {
        const response: any = await apiClient.put(`/contracts/${id}`, data);
        return response.data;
    },

    delete: async (id: string): Promise<void> => {
        await apiClient.delete(`/contracts/${id}`);
    },
};
