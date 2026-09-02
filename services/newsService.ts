import api from './api';
import { News } from '../types';

export const newsService = {
    getAll: async (page: number = 1) => {
        return await api.get(`/news?page=${page}`);
    },
    getById: async (id: number) => {
        return await api.get(`/news/${id}`);
    },
    create: async (data: FormData) => {
        return await api.post('/news', data, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },
    update: async (id: number, data: FormData) => {
        // Use POST with _method=PUT for file uploads in Laravel
        data.append('_method', 'PUT');
        return await api.post(`/news/${id}`, data, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },
    delete: async (id: number) => {
        return await api.delete(`/news/${id}`);
    }
};

export default newsService;
