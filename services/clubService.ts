import apiClient from './api';
import { Club } from '../types';

export const clubService = {
  getAll: async () => {
    const response: any = await apiClient.get('/clubs');
    return response.data.data || response.data;
  },

  getById: async (id: number) => {
    const response: any = await apiClient.get(`/clubs/${id}`);
    return response.data.data || response.data;
  },

  create: async (data: FormData) => {
    const response: any = await apiClient.post('/clubs', data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data.data || response.data;
  },

  update: async (id: number, data: FormData) => {
    const response: any = await apiClient.post(`/clubs/${id}?_method=PUT`, data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data.data || response.data;
  },

  delete: async (id: number) => {
    const response: any = await apiClient.delete(`/clubs/${id}`);
    return response.data.data || response.data;
  }
};
