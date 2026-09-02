import api from './api';

export const sponsorService = {
    getAll: async (params?: any) => {
        return await api.get('/sponsors', { params });
    },
    getById: async (id: number) => {
        return await api.get(`/sponsors/${id}`);
    },
    create: async (data: FormData) => {
        return await api.post('/sponsors', data);
    },
    update: async (id: number, data: FormData) => {
        data.append('_method', 'PUT');
        return await api.post(`/sponsors/${id}`, data);
    },
    delete: async (id: number) => {
        return await api.delete(`/sponsors/${id}`);
    }
};

export default sponsorService;
