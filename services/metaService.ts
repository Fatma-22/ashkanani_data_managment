import { WORLD_COUNTRIES } from '../utils/countries';
import apiClient from './api';
import i18n from '../i18n';

export const metaService = {
  getNationalities: async (): Promise<{ value: string; label: string; fullEn: string; fullAr: string; searchLabel: string }[]> => {
    try {
      const isAr = i18n.language === 'ar';
      
      // Use ONLY WORLD_COUNTRIES for a clean, non-redundant list.
      // This avoids showing the same nationality multiple times when different countries
      // share the same nationality label (for example, Dominican).
      const uniqueCountries = new Map<string, typeof WORLD_COUNTRIES[number]>();

      WORLD_COUNTRIES
        .filter(c => c.value !== 'Israel' && c.labelEn !== 'Israel')
        .forEach(c => {
          const key = c.nationalityEn.trim().toLowerCase();
          const existing = uniqueCountries.get(key);

          if (!existing || c.value.length > existing.value.length) {
            uniqueCountries.set(key, c);
          }
        });

      const options = Array.from(uniqueCountries.values()).map(c => {
        const label = isAr ? c.nationalityAr : c.nationalityEn;
        const searchLabel = `${c.labelEn} ${c.labelAr} ${c.nationalityEn} ${c.nationalityAr} ${c.value}`.toLowerCase()
          .replace(/[أإآٱ]/g, 'ا').replace(/ة/g, 'ه').replace(/[ىی]/g, 'ي');

        return {
          value: c.nationalityEn,
          label: label,
          fullEn: c.nationalityEn,
          fullAr: c.nationalityAr,
          searchLabel: searchLabel
        };
      });

      return options.sort((a, b) => a.label.localeCompare(b.label, isAr ? 'ar' : 'en'));
    } catch (error) {
      console.error('Error in getNationalities:', error);
      return [];
    }
  },

  getPositions: async (): Promise<{ value: string; label: string }[]> => {
    try {
      const response = await apiClient.get('/players/positions');
      const data = Array.isArray(response) ? response : (response?.data || []);
      return data.map((p: string) => ({ value: p, label: p }));
    } catch (error) {
      console.error('Error fetching positions:', error);
      return [];
    }
  },

  getDealStatuses: async (): Promise<{ value: string; label: string }[]> => {
    try {
      const response = await apiClient.get('/players/deal-statuses');
      const data = Array.isArray(response) ? response : (response?.data || []);
      return data.map((s: string) => ({ value: s, label: s }));
    } catch (error) {
      console.error('Error fetching deal statuses:', error);
      return [];
    }
  },

  getSports: async (): Promise<{ value: string; label: string }[]> => {
    try {
      const response = await apiClient.get('/players/sports');
      const data = Array.isArray(response) ? response : (response?.data || []);
      return data.map((s: string) => ({ value: s, label: s }));
    } catch (error) {
      console.error('Error fetching sports:', error);
      return [];
    }
  },
};
