import apiClient from './api';
import { Player, PlayerFilters, DealStatus } from '../types';

export const playerService = {
    getAll: async (filters?: PlayerFilters, page: number = 1, pageSize: number = 8): Promise<{ players: Player[], total: number }> => {
        const params = new URLSearchParams();
        if (filters?.search) params.append('search', filters.search);

        // Multi-select filters
        if (filters?.sport && filters.sport.length > 0) {
            filters.sport.forEach(s => params.append('sport[]', s));
        }
        if (filters?.positions && filters.positions.length > 0) {
            filters.positions.forEach(p => params.append('positions[]', p));
        }
        if (filters?.role && filters.role.length > 0) {
            filters.role.forEach(r => params.append('role[]', r));
        }
        if (filters?.designer_type) {
            params.append('designer_type', filters.designer_type);
        }
        if (filters?.nationality && filters.nationality.length > 0) {
            filters.nationality.forEach(n => params.append('nationality[]', n));
        }
        if (filters?.club) {
            if (Array.isArray(filters.club)) {
                filters.club.forEach(c => params.append('club[]', c));
            } else if (filters.club.trim() !== '') {
                params.append('club', filters.club);
            }
        }
        if (filters?.club_id) {
            params.append('club_id', filters.club_id.toString());
        }
        if (filters?.dealStatus && filters.dealStatus.length > 0) {
            filters.dealStatus.forEach(s => {
                params.append('deal_status[]', s);
                // Backward compatibility: If searching for Free Agent Coach, also include legacy Free Agent status
                if (s === DealStatus.FREE_AGENT_COACH) {
                    params.append('deal_status[]', DealStatus.FREE_AGENT);
                }
            });
        }

        if (filters?.preferredFoot && filters.preferredFoot.length > 0) {
            filters.preferredFoot.forEach(f => params.append('preferred_foot[]', f));
        }

        if (filters?.contractStatus && filters.contractStatus.length > 0) {
            filters.contractStatus.forEach(s => params.append('contract_status[]', s));
        }

        if (filters?.agentId) {
            params.append('agent_id', filters.agentId);
        }

        // Numeric range filters
        if (filters?.marketValueMin !== undefined) params.append('market_value_min', filters.marketValueMin.toString());
        if (filters?.marketValueMax !== undefined) params.append('market_value_max', filters.marketValueMax.toString());
        if (filters?.ageMin !== undefined) params.append('age_min', filters.ageMin.toString());
        if (filters?.ageMax !== undefined) params.append('age_max', filters.ageMax.toString());

        // Contract filters
        if (filters?.contractType && filters.contractType.length > 0) {
            filters.contractType.forEach(t => params.append('contract_type[]', t));
        }
        if (filters?.contractStartYear && filters.contractStartYear.length > 0) {
            filters.contractStartYear.forEach(y => params.append('contract_start_year[]', y.toString()));
        }
        if (filters?.contractExpiryYear && filters.contractExpiryYear.length > 0) {
            filters.contractExpiryYear.forEach(y => params.append('contract_expiry_year[]', y.toString()));
        }

        if (filters?.contractDuration && filters.contractDuration.length > 0) {
            filters.contractDuration.forEach(d => params.append('contract_duration[]', d));
        }

        if (filters?.remainingDuration && filters.remainingDuration.length > 0) {
            filters.remainingDuration.forEach(r => params.append('remaining_duration[]', r));
        }

        if (filters?.start_date) params.append('start_date', filters.start_date);
        if (filters?.end_date) params.append('end_date', filters.end_date);
        
        if (filters?.contractNature && filters.contractNature.length > 0) {
            filters.contractNature.forEach(n => params.append('contract_nature[]', n));
        }

        if (typeof filters?.isLocal === 'boolean') params.append('is_local', filters.isLocal.toString());
        if (typeof filters?.isApproved === 'boolean') {
            params.append('is_approved', filters.isApproved ? '1' : '0');
        }
        if (typeof filters?.isVisible === 'boolean') {
            params.append('is_visible', filters.isVisible ? '1' : '0');
        }
        if (filters?.public_view) {
            params.append('public_view', '1');
        }
        if (filters?.ticker) {
            params.append('ticker', '1');
        }
        if (typeof filters?.hasNutrition === 'boolean') {
            const val = filters.hasNutrition ? '1' : '0';
            params.append('has_nutrition', val);
            params.append('has_nutrition_records', val);
            params.append('with_records', val);
        }
        if (filters?.scoutId) {
            params.append('scout_id', filters.scoutId);
        }
        if (typeof filters?.staleCVs === 'boolean') {
            params.append('stale_cvs', filters.staleCVs ? '1' : '0');
        }
        
        // Coach Certificate Filters
        if (filters?.certificate_type) {
            const ct = Array.isArray(filters.certificate_type) ? filters.certificate_type : [filters.certificate_type];
            if (ct.length > 0) ct.forEach(t => params.append('certificate_type[]', t));
        }
        if (filters?.issuing_body) {
            const ib = Array.isArray(filters.issuing_body) ? filters.issuing_body : [filters.issuing_body];
            if (ib.length > 0) ib.forEach(b => params.append('issuing_body[]', b));
        }
        if (filters?.level) {
            const lv = Array.isArray(filters.level) ? filters.level : [filters.level];
            if (lv.length > 0) lv.forEach(l => params.append('level[]', l));
        }
        if (filters?.source_type) {
            const st = Array.isArray(filters.source_type) ? filters.source_type : [filters.source_type];
            if (st.length > 0) st.forEach(s => params.append('source_type[]', s));
        }
        if (filters?.has_sponsorships !== undefined) {
            params.append('has_sponsorships', filters.has_sponsorships.toString());
        }
        if (filters?.certificate_name) {
            params.append('certificate_name', filters.certificate_name);
        }

        params.append('page', page.toString());
        if (pageSize !== -1) {
            params.append('per_page', pageSize.toString());
        } else {
            params.append('per_page', '-1');
        }

        const response: any = await apiClient.get(`/players?${params.toString()}`);
        return {
            players: response.data.data,
            total: response.data.meta?.total || response.data.data.length
        };
    },

    getById: async (id: string, shareToken?: string): Promise<Player> => {
        const url = shareToken ? `/players/${id}?share_token=${shareToken}` : `/players/${id}`;
        const response: any = await apiClient.get(url);
        return response.data;
    },

    generateShareToken: async (id: string): Promise<{ share_token: string; token?: string }> => {
        const response: any = await apiClient.post(`/players/${id}/generate-share-token`);
        return response.data;
    },

    getArchived: async (filters?: PlayerFilters, page: number = 1, pageSize: number = 8): Promise<{ players: Player[], total: number }> => {
        const params = new URLSearchParams();
        if (filters?.search) params.append('search', filters.search);
        if (filters?.sport && filters.sport.length > 0) {
            filters.sport.forEach(s => params.append('sport[]', s));
        }
        if (filters?.positions && filters.positions.length > 0) {
            filters.positions.forEach(p => params.append('positions[]', p));
        }
        if (filters?.nationality && filters.nationality.length > 0) {
            filters.nationality.forEach(n => params.append('nationality[]', n));
        }
        if (filters?.contractNature && filters.contractNature.length > 0) {
            filters.contractNature.forEach(n => params.append('contract_nature[]', n));
        }
        if (filters?.remainingDuration && filters.remainingDuration.length > 0) {
            filters.remainingDuration.forEach(r => params.append('remaining_duration[]', r));
        }
        if (typeof filters?.isLocal === 'boolean') params.append('is_local', filters.isLocal.toString());
        params.append('page', page.toString());
        params.append('per_page', pageSize.toString());

        const response: any = await apiClient.get(`/players/archived?${params.toString()}`);
        return {
            players: response.data.data,
            total: response.data.meta?.total || response.data.data.length
        };
    },

    create: async (data: any): Promise<Player> => {
        const response: any = await apiClient.post('/players', data);
        return response.data;
    },

    publicCreate: async (data: any): Promise<Player> => {
        const response: any = await apiClient.post('/public/players', data);
        return response.data;
    },

    publicUploadPhoto: async (playerId: string, formData: FormData): Promise<any> => {
        const response: any = await apiClient.post(`/public/players/${playerId}/photos`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    publicUploadCV: async (playerId: string, formData: FormData): Promise<any> => {
        const response: any = await apiClient.post(`/public/players/${playerId}/cv`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    update: async (id: string, data: any): Promise<Player> => {
        const response: any = await apiClient.put(`/players/${id}`, data);
        return response.data;
    },

    delete: async (id: string): Promise<void> => {
        await apiClient.delete(`/players/${id}`);
    },

    uploadPhoto: async (playerId: string, formData: FormData): Promise<any> => {
        const response: any = await apiClient.post(`/players/${playerId}/photos`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    uploadDocument: async (playerId: string, formData: FormData): Promise<any> => {
        const response: any = await apiClient.post(`/players/${playerId}/documents`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    deletePhoto: async (playerId: string, photoId: string): Promise<void> => {
        await apiClient.delete(`/players/${playerId}/photos/${photoId}`);
    },

    deleteDocument: async (playerId: string, documentId: string): Promise<void> => {
        await apiClient.delete(`/players/${playerId}/documents/${documentId}`);
    },

    updateDocument: async (playerId: string, documentId: string, data: any): Promise<any> => {
        const response: any = await apiClient.put(`/players/${playerId}/documents/${documentId}`, data);
        return response.data;
    },

    uploadCV: async (playerId: string, formData: FormData): Promise<any> => {
        const response: any = await apiClient.post(`/players/${playerId}/cv`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    deleteCV: async (playerId: string): Promise<void> => {
        await apiClient.delete(`/players/${playerId}/cv`);
    },

    uploadVolleyballStatsPdf: async (playerId: string, formData: FormData): Promise<any> => {
        const response: any = await apiClient.post(`/players/${playerId}/volleyball-stats`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    deleteVolleyballStatsPdf: async (playerId: string): Promise<void> => {
        await apiClient.delete(`/players/${playerId}/volleyball-stats`);
    },

    uploadVolleyballRankingImage: async (playerId: string, formData: FormData): Promise<any> => {
        const response: any = await apiClient.post(`/players/${playerId}/volleyball-ranking`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    deleteVolleyballRankingImage: async (playerId: string): Promise<void> => {
        await apiClient.delete(`/players/${playerId}/volleyball-ranking`);
    },

    uploadPlayerStrategyPdf: async (playerId: string, formData: FormData): Promise<any> => {
        const response: any = await apiClient.post(`/players/${playerId}/strategy-pdf`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    deletePlayerStrategyPdf: async (playerId: string): Promise<void> => {
        await apiClient.delete(`/players/${playerId}/strategy-pdf`);
    },

    uploadClubLogo: async (playerId: string, formData: FormData): Promise<any> => {
        const response: any = await apiClient.post(`/players/${playerId}/club-logo`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    deleteClubLogo: async (playerId: string): Promise<void> => {
        await apiClient.delete(`/players/${playerId}/club-logo`);
    },

    uploadClubContractFile: async (playerId: string, contractId: number, formData: FormData): Promise<any> => {
        const response: any = await apiClient.post(`/players/${playerId}/club-contracts/${contractId}/file`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    uploadCertificateFile: async (playerId: string, certificateId: number, formData: FormData): Promise<any> => {
        const response: any = await apiClient.post(`/players/${playerId}/certificates/${certificateId}/file`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    /**
     * Get a minimal list of players for selection search
     */
    getSimpleSearch: async (query?: string): Promise<any[]> => {
        const params = new URLSearchParams();
        if (query) params.append('search', query);
        params.append('per_page', '50'); // limit results
        const response: any = await apiClient.get(`/players?${params.toString()}`);
        return (response.data?.data || response.data || []).map((p: any) => ({
            id: p.id,
            name: p.name,
            name_ar: p.nameAr || p.name_ar,
            sport: p.sport,
            club: p.club,
            club_ar: p.clubAr || p.club_ar,
            nationality: p.nationality
        }));
    },
};
