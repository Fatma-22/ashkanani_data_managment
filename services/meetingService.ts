import apiClient from './api';
import { Meeting } from '../types';

export const meetingService = {
  getAll: async (params?: any): Promise<{ data: Meeting[], current_page?: number, last_page?: number, total?: number }> => {
    const response: any = await apiClient.get('/meetings', { params });
    // Handle both paginated and non-paginated responses
    if (response.data && response.data.data) {
      return response.data;
    }
    return { data: response.data || [] };
  },

  getById: async (id: number | string): Promise<Meeting> => {
    const response: any = await apiClient.get(`/meetings/${id}`);
    return response.data;
  },

  create: async (data: any): Promise<Meeting> => {
    const response: any = await apiClient.post('/meetings', data);
    return response.data;
  },

  update: async (id: number | string, data: any): Promise<Meeting> => {
    const response: any = await apiClient.put(`/meetings/${id}`, data);
    return response.data;
  },

  delete: async (id: number | string): Promise<void> => {
    await apiClient.delete(`/meetings/${id}`);
  },
};
