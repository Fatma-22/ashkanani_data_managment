import apiClient from './api';
import { DashboardStats, MarketValueDistribution, ContractStatusData, ContractExpiryData, Sport } from '../types';

export const dashboardService = {
    getStats: async (filters?: { sport?: Sport | 'All', start_date?: string, end_date?: string }): Promise<DashboardStats> => {
        const params = new URLSearchParams();
        if (filters?.sport && filters.sport !== 'All') params.append('sport', filters.sport);
        if (filters?.start_date) params.append('start_date', filters.start_date);
        if (filters?.end_date) params.append('end_date', filters.end_date);

        const response: any = await apiClient.get('/dashboard/stats', { params });
        return response.data;
    },

    getMarketValueDistribution: async (filters?: { sport?: Sport | 'All', start_date?: string, end_date?: string }): Promise<MarketValueDistribution[]> => {
        const params = new URLSearchParams();
        if (filters?.sport && filters.sport !== 'All') params.append('sport', filters.sport);
        if (filters?.start_date) params.append('start_date', filters.start_date);
        if (filters?.end_date) params.append('end_date', filters.end_date);

        const response: any = await apiClient.get('/dashboard/market-value', { params });
        return response.data;
    },

    getContractStatusData: async (filters?: { sport?: Sport | 'All', start_date?: string, end_date?: string }): Promise<ContractStatusData[]> => {
        const params = new URLSearchParams();
        if (filters?.sport && filters.sport !== 'All') params.append('sport', filters.sport);
        if (filters?.start_date) params.append('start_date', filters.start_date);
        if (filters?.end_date) params.append('end_date', filters.end_date);

        const response: any = await apiClient.get('/dashboard/contract-status', { params });
        return response.data;
    },

    getContractExpiryTimeline: async (filters?: { sport?: Sport | 'All', start_date?: string, end_date?: string }): Promise<ContractExpiryData[]> => {
        const params = new URLSearchParams();
        if (filters?.sport && filters.sport !== 'All') params.append('sport', filters.sport);
        if (filters?.start_date) params.append('start_date', filters.start_date);
        if (filters?.end_date) params.append('end_date', filters.end_date);

        const response: any = await apiClient.get('/dashboard/contract-expiry', { params });
        return response.data;
    },

    getDealTypeStats: async (filters?: { sport?: Sport | 'All', start_date?: string, end_date?: string }): Promise<{ type: string, count: number }[]> => {
        const params = new URLSearchParams();
        if (filters?.sport && filters.sport !== 'All') params.append('sport', filters.sport);
        if (filters?.start_date) params.append('start_date', filters.start_date);
        if (filters?.end_date) params.append('end_date', filters.end_date);

        const response: any = await apiClient.get('/dashboard/deal-types', { params });
        return response.data;
    },

    getNutritionStats: async (): Promise<any> => {
        const response: any = await apiClient.get('/nutrition/stats');
        return response.data?.data || response.data;
    },
};
