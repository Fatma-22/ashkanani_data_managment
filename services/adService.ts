import api from './api';

export const adService = {
    getAll: async (params?: any) => {
        return await api.get('/ads', { params });
    },
    getById: async (id: number) => {
        return await api.get(`/ads/${id}`);
    },
    create: async (data: FormData) => {
        return await api.post('/ads', data, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },
    update: async (id: number, data: FormData) => {
        data.append('_method', 'PUT');
        return await api.post(`/ads/${id}`, data, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },
    delete: async (id: number) => {
        return await api.delete(`/ads/${id}`);
    }
};

export default adService;
