import api from './api';
import { Deal } from '../types';

export const dealService = {
    getAll: async (params?: any) => {
        const response = await api.get('/deals', { params });
        return response; // Return the whole pagination object
    },

    getById: async (id: number) => {
        const response = await api.get(`/deals/${id}`);
        return response.data;
    },

    create: async (data: Partial<Deal>) => {
        const response = await api.post('/deals', data);
        return response.data;
    },

    update: async (id: number, data: Partial<Deal>) => {
        const response = await api.put(`/deals/${id}`, data);
        return response.data;
    },

    delete: async (id: number) => {
        const response = await api.delete(`/deals/${id}`);
        return response.data;
    },

    getStats: async () => {
        const response = await api.get('/deals/stats');
        return response.data;
    },

    getClubs: async () => {
        const response = await api.get('/deals/clubs');
        return response.data;
    }
};
