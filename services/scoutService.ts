import apiClient from './api';
import { Admin } from '../types';

export const scoutService = {
    /**
     * Get all scouts (admins with is_scout=true)
     */
    getAll: async (search?: string): Promise<Admin[]> => {
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        const response: any = await apiClient.get(`/scouts?${params.toString()}`);
        return (response.data || []).map((s: any) => ({
            ...s,
            isScout: s.is_scout,
            scoutedPlayersCount: s.scouted_players_count
        }));
    },

    /**
     * Get a specific scout with their scouted players
     */
    getById: async (id: string, page: number = 1, pageSize: number = 10, search?: string): Promise<any> => {
        const params = new URLSearchParams();
        params.append('page', page.toString());
        params.append('per_page', pageSize.toString());
        if (search) params.append('search', search);
        const response: any = await apiClient.get(`/scouts/${id}?${params.toString()}`);
        
        const data = response.data;
        if (data.scout) {
            data.scout = {
                ...data.scout,
                isScout: data.scout.is_scout,
                scoutedPlayersCount: data.scout.scouted_players_count
            };
        }
        return data;
    },

    /**
     * Get admins who are not scouts
     */
    getNonScouts: async (): Promise<Admin[]> => {
        const response: any = await apiClient.get(`/scouts/non-scouts`);
        return response.data || [];
    },

    /**
     * Create a new scout
     */
    createScout: async (data: any): Promise<any> => {
        const response: any = await apiClient.post('/scouts', data);
        return response.data;
    },

    /**
     * Toggle scout status on an admin
     */
    toggleScoutStatus: async (adminId: string, isScout: boolean): Promise<any> => {
        const response: any = await apiClient.put(`/scouts/${adminId}/toggle`, {
            is_scout: isScout,
        });
        return response.data;
    },

    /**
     * Assign existing players to a specific scout
     */
    assignPlayers: async (scoutId: string, playerIds: string[]): Promise<any> => {
        const response: any = await apiClient.post(`/scouts/${scoutId}/assign-players`, {
            player_ids: playerIds,
        });
        return response.data;
    },
};
