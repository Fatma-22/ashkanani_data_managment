import apiClient from './api';
import { Player } from '../types';
import { extractPhoneDigits } from '../utils/helpers';

export const profileService = {
    /**
     * Look up the member's linked player CV by phone or national ID
     */
    getMyCV: async (phone?: string, nationalId?: string): Promise<Player | null> => {
        const queryParams = new URLSearchParams();
        if (phone) queryParams.append('phone', extractPhoneDigits(phone));
        if (nationalId) queryParams.append('national_id', nationalId);
        try {
            const response: any = await apiClient.get(`/profile/cv?${queryParams.toString()}`);
            return response.data || null;
        } catch {
            return null;
        }
    },

    /**
     * Create a new CV for the member
     */
    createMyCV: async (data: any): Promise<Player> => {
        const response: any = await apiClient.post(`/profile/cv`, data);
        return response.data;
    },

    /**
     * Update the member's linked player profile (excluding contract fields)
     */
    updateMyCV: async (playerId: string, data: any): Promise<Player> => {
        const response: any = await apiClient.put(`/profile/cv/${playerId}`, data);
        return response.data;
    },

    /**
     * Upload a new photo for the member's player profile
     */
    uploadMyPhoto: async (playerId: string, formData: FormData): Promise<any> => {
        const response: any = await apiClient.post(`/profile/cv/${playerId}/photo`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    /**
     * Upload CV document for the member's player profile
     */
    uploadMyCVDocument: async (playerId: string, formData: FormData): Promise<any> => {
        const response: any = await apiClient.post(`/profile/cv/${playerId}/document`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    /**
     * Delete CV document for the member's player profile
     */
    deleteMyCVDocument: async (playerId: string): Promise<any> => {
        const response: any = await apiClient.delete(`/profile/cv/${playerId}/document`);
        return response.data;
    },

    /**
     * Upload certificate file for the member's player profile
     */
    uploadMyCertificateFile: async (playerId: string, certificateId: number, formData: FormData): Promise<any> => {
        const response: any = await apiClient.post(`/profile/cv/${playerId}/certificates/${certificateId}/file`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    /**
     * Delete a photo from the member's player profile
     */
    deleteMyPhoto: async (playerId: string, photoId: string): Promise<any> => {
        const response: any = await apiClient.delete(`/profile/cv/${playerId}/photo/${photoId}`);
        return response.data;
    },

    uploadVolleyballStatsPdf: async (playerId: string, formData: FormData): Promise<any> => {
        const response: any = await apiClient.post(`/profile/cv/${playerId}/volleyball-stats`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    deleteVolleyballStatsPdf: async (playerId: string): Promise<any> => {
        const response: any = await apiClient.delete(`/profile/cv/${playerId}/volleyball-stats`);
        return response.data;
    },

    uploadVolleyballRankingImage: async (playerId: string, formData: FormData): Promise<any> => {
        const response: any = await apiClient.post(`/profile/cv/${playerId}/volleyball-ranking`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    deleteVolleyballRankingImage: async (playerId: string): Promise<any> => {
        const response: any = await apiClient.delete(`/profile/cv/${playerId}/volleyball-ranking`);
        return response.data;
    },

    /**
     * Update the member's user profile (name, password, avatar)
     */
    updateProfile: async (data: any): Promise<any> => {
        const response: any = await apiClient.put('/me', data);
        return response;
    },

    /**
     * Update profile with file upload (avatar)
     */
    updateProfileWithFile: async (formData: FormData): Promise<any> => {
        const response: any = await apiClient.post('/me', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response;
    },

    /**
     * Get the member's nutrition data
     */
    getMyNutrition: async (): Promise<any> => {
        const response: any = await apiClient.get('/me/nutrition');
        return response.data || response;
    }
};

export default profileService;
