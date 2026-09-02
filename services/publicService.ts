import api from './api';
import { Sponsor, Discount, Ad, News } from '../types';

export interface LandingPageData {
    sponsors: Sponsor[];
    discounts: Discount[];
    ads: Ad[];
    news: News[];
}

export const publicService = {
    getLandingPageData: async (): Promise<LandingPageData> => {
        const res: any = await api.get('/public/landing');
        // Laravel Resources wrap in 'data', let's unwrap if they exist
        return {
            sponsors: res.sponsors?.data || res.sponsors || [],
            discounts: res.discounts?.data || res.discounts || [],
            ads: res.ads?.data || res.ads || [],
            news: res.news?.data || res.news || []
        };
    },

    getAllNews: async (page: number = 1, perPage: number = 10): Promise<{ data: News[], total: number, last_page: number }> => {
        const res: any = await api.get(`/public/news?page=${page}&per_page=${perPage}`);
        return {
            data: res.data || [],
            total: res.meta?.total || 0,
            last_page: res.meta?.last_page || 1
        };
    },

    getNewsDetails: async (id: number): Promise<News> => {
        const res: any = await api.get(`/public/news/${id}`);
        return res.data || res;
    },

    getSponsorDetails: async (id: number): Promise<Sponsor> => {
        const res: any = await api.get(`/public/sponsors/${id}`);
        return res.data || res;
    },

    /**
     * Track a visit to any public page.
     * Skips the request entirely for internal roles (ADMIN, OWNER, AGENT).
     * Fires and forgets — errors are silently ignored.
     */
    trackVisit: (userRole?: string): void => {
        const internalRoles = ['ADMIN', 'OWNER', 'AGENT'];
        if (userRole && internalRoles.includes(userRole)) return;
        api.post('/public/track-visit').catch(() => {/* silent */});
    },
};

export default publicService;
