import api from './api';

export const discountService = {
    getAll: async (params?: any) => {
        return await api.get('/discounts', { params });
    },
    getById: async (id: number) => {
        return await api.get(`/discounts/${id}`);
    },
    create: async (data: FormData) => {
        return await api.post('/discounts', data);
    },
    update: async (id: number, data: FormData) => {
        data.append('_method', 'PUT');
        return await api.post(`/discounts/${id}`, data);
    },
    delete: async (id: number) => {
        return await api.delete(`/discounts/${id}`);
    }
};

export default discountService;
