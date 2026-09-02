import apiClient from './api';
import { Federation } from '../types';

export const federationService = {
  getAll: async () => {
    const response = await apiClient.get<Federation[]>('/federations');
    return response as any;
  },

  getById: async (id: number) => {
    const response = await apiClient.get<Federation>(`/federations/${id}`);
    return response as any;
  },

  create: async (data: FormData) => {
    const response = await apiClient.post<Federation>('/federations', data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response as any;
  },

  update: async (id: number, data: FormData) => {
    const response = await apiClient.post<Federation>(`/federations/${id}?_method=PUT`, data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response as any;
  },

  delete: async (id: number) => {
    const response = await apiClient.delete(`/federations/${id}`);
    return response as any;
  }
};
