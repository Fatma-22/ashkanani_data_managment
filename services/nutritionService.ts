import apiClient from './api';

export const nutritionService = {
    /**
     * Get global nutrition stats
     */
    getStats: async (): Promise<any> => {
        const response: any = await apiClient.get('/nutrition/stats');
        return response.data?.data || response.data || response;
    },

    /**
     * Get a specific player's nutrition file
     */
    getPlayerFile: async (playerId: string): Promise<any> => {
        const response: any = await apiClient.get(`/nutrition/player/${playerId}`);
        return response.data || response;
    },

    /**
     * Save a physical report
     */
    savePhysicalReport: async (data: any): Promise<any> => {
        const config = data instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined;
        const response: any = await apiClient.post('/nutrition/physical-report', data, config);
        return response.data || response;
    },

    /**
     * Update a physical report
     */
    updatePhysicalReport: async (id: string, data: any): Promise<any> => {
        if (data instanceof FormData) {
            data.append('_method', 'PUT');
            const response: any = await apiClient.post(`/nutrition/physical-report/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
            return response.data || response;
        } else {
            const response: any = await apiClient.put(`/nutrition/physical-report/${id}`, data);
            return response.data || response;
        }
    },

    /**
     * Upload a progress photo
     */
    uploadProgressPhoto: async (formData: FormData): Promise<any> => {
        const response: any = await apiClient.post('/nutrition/progress-photo', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data || response;
    },

    /**
     * Update progress photo metadata
     */
    updateProgressPhoto: async (id: string, data: any): Promise<any> => {
        const response: any = await apiClient.put(`/nutrition/progress-photo/${id}`, data);
        return response.data || response;
    },

    /**
     * Save a nutrition program
     */
    saveNutritionProgram: async (data: any): Promise<any> => {
        const config = data instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined;
        const response: any = await apiClient.post('/nutrition/nutrition-program', data, config);
        return response.data || response;
    },

    /**
     * Update a nutrition program
     */
    updateNutritionProgram: async (id: string, data: any): Promise<any> => {
        if (data instanceof FormData) {
            data.append('_method', 'PUT');
            const response: any = await apiClient.post(`/nutrition/nutrition-program/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
            return response.data || response;
        } else {
            const response: any = await apiClient.put(`/nutrition/nutrition-program/${id}`, data);
            return response.data || response;
        }
    },

    /**
     * Save a training program
     */
    saveTrainingProgram: async (data: any): Promise<any> => {
        const config = data instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined;
        const response: any = await apiClient.post('/nutrition/training-program', data, config);
        return response.data || response;
    },

    /**
     * Update a training program
     */
    updateTrainingProgram: async (id: string, data: any): Promise<any> => {
        if (data instanceof FormData) {
            data.append('_method', 'PUT');
            const response: any = await apiClient.post(`/nutrition/training-program/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
            return response.data || response;
        } else {
            const response: any = await apiClient.put(`/nutrition/training-program/${id}`, data);
            return response.data || response;
        }
    },

    deletePhysicalReport: async (id: string): Promise<any> => {
        const response: any = await apiClient.delete(`/nutrition/physical-report/${id}`);
        return response.data;
    },

    deleteNutritionProgram: async (id: string): Promise<any> => {
        const response: any = await apiClient.delete(`/nutrition/nutrition-program/${id}`);
        return response.data;
    },

    deleteTrainingProgram: async (id: string): Promise<any> => {
        const response: any = await apiClient.delete(`/nutrition/training-program/${id}`);
        return response.data;
    },

    deleteProgressPhoto: async (id: string): Promise<any> => {
        const response: any = await apiClient.delete(`/nutrition/progress-photo/${id}`);
        return response.data;
    }
};

export default nutritionService;
