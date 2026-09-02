import dayjs from 'dayjs';
import { Player, PlayerFilters, Agent, Contract, DashboardStats, ProfileRole } from '../types';
import { translateToArabic, translateToEnglish } from './translation';
import { WORLD_COUNTRIES } from './countries';

export { translateToArabic, translateToEnglish };

/**
 * Fixes common Arabic nationality grammatical errors (e.g. "كنداي" -> "كندي")
 * This is used to normalize data coming from the database that might have been saved incorrectly.
 */
export const fixNationalityAr = (text: string | undefined | null): string => {
    if (!text) return '';
    
    const corrections: Record<string, string> = {
        'كنداي': 'كندي',
        'أسترالياي': 'أسترالي',
        'ألمانياي': 'ألماني',
        'إيطالياي': 'إيطالي',
        'إسبانياي': 'إسباني',
        'فرنساي': 'فرنسي',
        'سويسراي': 'سويسري',
        'النمساي': 'نمساوي',
        'أمريكااي': 'أمريكي',
        'أمريكاى': 'أمريكي',
        'أمريكاي': 'أمريكي',
        'روسياي': 'روسي',
        'أوكرانياي': 'أوكراني',
        'هولندااي': 'هولندي',
        'هولنداي': 'هولندي',
        'بلجيكااي': 'بلجيكي',
        'بلجيكاي': 'بلجيكي',
        'البرازيل ي': 'برازيلي',
        'البرازيلي': 'برازيلي',
        'الأرجنتيني': 'أرجنتيني',
        'الأرجنتين ي': 'أرجنتيني',
        'فنزويلاي': 'فنزويلي',
        'كولومبياي': 'كولومبي',
        'أرمينياي': 'أرميني',
        'ماليزياي': 'ماليزي',
        'إندونيسياي': 'إندونيسي',
        'تايلاندي': 'تايلاندي',
        'نيجيرياي': 'نيجيري',
        'غانااي': 'غاني',
        'غاناي': 'غاني',
        'السنغال ي': 'سنغالي',
        'السنغالي': 'سنغالي',
        'سلوفاكياي': 'سلوفاكي',
        'سلوفينياي': 'سلوفيني',
        'جورجياي': 'جورجي',
        'صربياي': 'صربي',
        'كرواتياي': 'كرواتي',
        'بلغارياي': 'بلغاري',
        'رومانياي': 'روماني',
        'ألبانياي': 'ألباني',
        'أيرلنداي': 'أيرلندي',
        'أيسلنداي': 'أيسلندي',
    };

    let result = text.trim();
    if (corrections[result]) return corrections[result];

    // Generic pattern: ends with 'اي' after many characters, likely should be 'ي'
    if (result.endsWith('اي') && result.length > 4) {
        return result.slice(0, -2) + 'ي';
    }
    
    // Generic pattern: ends with 'ياي', likely should be 'ي'
    if (result.endsWith('ياي') && result.length > 4) {
        return result.slice(0, -3) + 'ي';
    }

    return result;
};

export const normalizeString = (str: string): string => {
    return str.toLowerCase().trim();
};

export const isArabicText = (text: string): boolean => {
    if (!text) return false;
    const arabicRegex = /[\u0600-\u06FF\u0750-\u077F]/;
    return arabicRegex.test(text);
};

export const normalizeArabic = (text: string): string => {
    if (!text) return '';
    return text
        .replace(/[\u064B-\u0652\u0640]/g, '') // Remove diacritics and Kashida (ــــ)
        .replace(/[أإآٱ]/g, 'ا') // Normalize all Alef forms to plain Alef
        .replace(/ة/g, 'ه') // Normalize Te Marbuta
        .replace(/[ىی]/g, 'ي') // Normalize Yeh and Persian Yeh
        .replace(/[ؤئ]/g, 'ء') // Normalize Hamza forms
        .replace(/\s+/g, '') // Remove all spaces for strict comparison
        .toLowerCase()
        .trim();
};

export const normalizePhone = (phone: string): string => {
    if (!phone) return '';
    // Remove spaces, dashes, parentheses but keep leading '+'
    return phone.replace(/[\s\-()]/g, '');
};

/**
 * Extracts digits only from a phone number (removes +, spaces, dashes, etc.)
 * Used for backend lookup which uses last-8-digit matching.
 * e.g. "+973 3912 2179" -> "97339122179"
 *      "00973 3912 2179" -> "0097339122179"
 *      "3912 2179" -> "39122179"
 */
export const extractPhoneDigits = (phone: string): string => {
    if (!phone) return '';
    
    // First remove all non-digits
    let digits = phone.replace(/\D/g, '');
    
    // Check for double country codes (e.g. 965965...)
    // This is common when the UI prepends a code and the user also types it
    if (digits.length >= 12 && digits.startsWith('965965')) {
        digits = digits.substring(3);
    } else if (digits.length >= 12 && digits.startsWith('966966')) {
        digits = digits.substring(3);
    } else if (digits.length >= 10 && digits.startsWith('971971')) {
        digits = digits.substring(3);
    }
    
    return digits;
};

export const standardizePhoneNumber = (phone: string, countryName?: string): string => {
    if (!phone) return '';
    
    let clean = phone.replace(/[\s\-()]/g, '');
    
    // Handle 00 prefix
    if (clean.startsWith('00')) {
        clean = '+' + clean.substring(2);
    }

    // Identify the likely dial code
    let dialCodeOnly = '';
    if (countryName) {
        const country = WORLD_COUNTRIES.find(c => c.value === countryName);
        if (country) dialCodeOnly = country.dialCode.replace('+', '');
    }

    // Handle double-code error (e.g. +965965... or 965965...)
    if (dialCodeOnly && dialCodeOnly.length > 0) {
        const doubleCode = dialCodeOnly + dialCodeOnly;
        const tripleCode = dialCodeOnly + dialCodeOnly + dialCodeOnly;
        
        // Remove triple or double leading codes
        if (clean.replace(/\D/g, '').startsWith(tripleCode)) {
            const digits = clean.replace(/\D/g, '');
            clean = '+' + digits.substring(dialCodeOnly.length * 2);
        } else if (clean.replace(/\D/g, '').startsWith(doubleCode)) {
            const digits = clean.replace(/\D/g, '');
            clean = '+' + digits.substring(dialCodeOnly.length);
        }
    }

    // If it already has a +, just return cleaned version
    if (clean.startsWith('+')) {
        return clean;
    }

    // If no +, try to use country context
    if (dialCodeOnly) {
        // If it starts with the dial code, just add +
        if (clean.startsWith(dialCodeOnly)) {
            return '+' + clean;
        }
        // Otherwise prepend full dial code
        return '+' + dialCodeOnly + clean;
    }

    return clean;
};

export const filterPlayers = (players: Player[], filters: PlayerFilters, contracts: Contract[] = []): Player[] => {
    return players.filter(player => {
        // Search by name, club, or nationality
        if (filters.search) {
            const searchLower = normalizeString(filters.search);
            const nameMatch = normalizeString(player.name).includes(searchLower);
            const nameArMatch = player.nameAr ? normalizeString(player.nameAr).includes(searchLower) : false;
            const clubName = typeof player.club === 'string' ? player.club : (player.club?.name || '');
            const clubMatch = normalizeString(clubName).includes(searchLower);
            const clubArMatch = player.clubAr ? normalizeString(player.clubAr).includes(searchLower) : false;
            const nationalityMatch = normalizeString(player.nationality).includes(searchLower);
            const nationalityArMatch = player.nationalityAr ? normalizeString(player.nationalityAr).includes(searchLower) : false;
            if (!nameMatch && !nameArMatch && !clubMatch && !clubArMatch && !nationalityMatch && !nationalityArMatch) return false;
        }

        // Sport filter
        if (filters.sport && filters.sport.length > 0) {
            if (!filters.sport.includes(player.sport)) return false;
        }

        // Role filter (Player or Coach)
        if (filters.role && filters.role.length > 0) {
            if (!filters.role.includes(player.role || ProfileRole.PLAYER)) return false;
        }

        // Nationality filter (Dropdown)
        if (filters.nationality && filters.nationality.length > 0) {
            if (!filters.nationality.includes(player.nationality)) return false;
        }

        // Positions filter
        if (filters.positions && filters.positions.length > 0) {
            if (!player.positions || !player.positions.some(p => filters.positions?.includes(p))) return false;
        }

        // Age range
        if (filters.ageMin !== undefined && player.age < filters.ageMin) return false;
        if (filters.ageMax !== undefined && player.age > filters.ageMax) return false;

        // Market value range
        if (filters.marketValueMin !== undefined && player.marketValue < filters.marketValueMin) return false;
        if (filters.marketValueMax !== undefined && player.marketValue > filters.marketValueMax) return false;

        // Deal status
        if (filters.dealStatus && filters.dealStatus.length > 0) {
            if (!filters.dealStatus.includes(player.dealStatus)) return false;
        }

        // Club filter
        if (filters.club && filters.club.length > 0) {
            const playerClubStr = typeof player.club === 'string' ? player.club : (player.club?.name || '');
            if (!filters.club.includes(playerClubStr as any)) return false;
        }

        // Preferred foot
        if (filters.preferredFoot && filters.preferredFoot.length > 0) {
            if (!filters.preferredFoot.includes(player.preferredFoot)) return false;
        }

        // Agent filter
        if (filters.agentId && player.agentId !== filters.agentId) return false;

        // Contract Filters
        if ((filters.contractExpiryYear && filters.contractExpiryYear.length > 0) ||
            (filters.contractStartYear && filters.contractStartYear.length > 0) ||
            (filters.contractDuration && filters.contractDuration.length > 0) ||
            (filters.remainingDuration && filters.remainingDuration.length > 0) ||
            (filters.contractType && filters.contractType.length > 0)) {

            const playerContract = contracts.find(c => c.playerId === player.id);
            if (!playerContract) return false;

            if (filters.contractExpiryYear && filters.contractExpiryYear.length > 0) {
                const expiryYear = dayjs(playerContract.endDate).year();
                if (!filters.contractExpiryYear.includes(expiryYear)) return false;
            }

            if (filters.contractStartYear && filters.contractStartYear.length > 0) {
                const startYear = dayjs(playerContract.startDate).year();
                if (!filters.contractStartYear.includes(startYear)) return false;
            }

            if (filters.contractDuration && filters.contractDuration.length > 0) {
                const durationYears = dayjs(playerContract.endDate).diff(dayjs(playerContract.startDate), 'year', true);
                const results = filters.contractDuration.map(d => {
                    if (d === '1year') return durationYears <= 1.1;
                    if (d === 'moreThan1year') return durationYears > 1.1;
                    return false;
                });
                if (!results.some(r => r)) return false;
            }

            if (filters.remainingDuration && filters.remainingDuration.length > 0) {
                const now = dayjs();
                const remainingYears = dayjs(playerContract.endDate).diff(now, 'year', true);
                const remainingMonths = dayjs(playerContract.endDate).diff(now, 'month', true);
                const results = filters.remainingDuration.map(d => {
                    if (d === '6months') return remainingMonths <= 6 && remainingMonths >= 0;
                    if (d === '1year') return remainingYears <= 1 && remainingMonths >= 0;
                    if (d === '2years') return remainingYears <= 2 && remainingMonths >= 0;
                    if (d === 'moreThan2years') return remainingYears > 2;
                    return false;
                });
                if (!results.some(r => r)) return false;
            }

            if (filters.contractType && filters.contractType.length > 0) {
                if (!filters.contractType.includes(playerContract.type)) return false;
            }
        }

        return true;
    });
};

export const formatCurrency = (value: number | string, currency: string = 'USD', exact: boolean = false): string => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue) || !isFinite(numValue)) return '$0';

    // If the currency sounds like a language code (e.g. 'en', 'ar'), default to USD
    const currencyCode = (currency.length === 2 || currency.includes('-')) ? 'USD' : currency;
    let symbol = '$';
    if (currencyCode === 'KWD') symbol = 'KD ';
    else if (currencyCode === 'EUR') symbol = '€';

    if (numValue === 0) return `${symbol}0`;

    if (!exact) {
        // For KWD, we might want more precision, but let's keep it consistent with the existing M/K logic
        if (numValue >= 1000000) {
            return `${symbol}${(numValue / 1000000).toFixed(1)}M`;
        } else if (numValue >= 1000) {
            return `${symbol}${(numValue / 1000).toFixed(0)}K`;
        }
    }
    return `${symbol}${numValue.toLocaleString()}`;
};

export const formatDate = (date: string, format: string = 'DD MMM YYYY'): string => {
    return dayjs(date).format(format);
};

export const getFormattedDuration = (start: string | dayjs.Dayjs, end: string | dayjs.Dayjs, t: any): string => {
    const startDate = dayjs(start);
    const endDate = dayjs(end);

    if (!startDate.isValid() || !endDate.isValid()) return '';

    let years = endDate.diff(startDate, 'year');
    let months = endDate.diff(startDate.add(years, 'year'), 'month');
    let days = endDate.diff(startDate.add(years, 'year').add(months, 'month'), 'day');

    // Handle edge case where diff might be negative if dates are swapped
    if (years < 0 || (years === 0 && months < 0 && days < 0)) {
        return '';
    }

    const parts = [];
    if (years > 0) {
        parts.push(`${years} ${years === 1 ? t('common.year') : t('common.years')}`);
    }
    if (months > 0) {
        parts.push(`${months} ${months === 1 ? t('common.month') : t('common.months')}`);
    }
    if (days > 0 && parts.length < 2) {
        parts.push(`${days} ${days === 1 ? t('common.day') : t('common.days')}`);
    }

    if (parts.length === 0) {
        if (endDate.isAfter(startDate)) {
            return t('common.less_than_day', { defaultValue: 'Less than a day' });
        }
        return '';
    }

    return parts.join(` ${t('common.and')} `);

};



export const calculateAge = (dateOfBirth: string): number => {
    return dayjs().diff(dayjs(dateOfBirth), 'year');
};

export const isContractExpiringSoon = (endDate: string, months: number = 6): boolean => {
    const expiryDate = dayjs(endDate);
    const now = dayjs();
    const diffMonths = expiryDate.diff(now, 'month');
    return diffMonths >= 0 && diffMonths <= months;
};

export const getPublicPlayer = (player: Player): Partial<Player> => {
    const publicData: any = {
        id: player.id,
        name: player.name,
        nameAr: player.nameAr,
        nationalityAr: player.nationalityAr || translateToArabic(player.nationality, 'country'),
        clubAr: player.clubAr || translateToArabic(typeof player.club === 'string' ? player.club : (player.club?.name || ''), 'club'),
        sport: player.sport,
    };

    // Only include fields that are marked as visible
    if (player.visibility.nationality) publicData.nationality = player.nationality;
    if (player.visibility.age) publicData.age = player.age;
    if (player.visibility.position) publicData.positions = player.positions;
    if (player.visibility.club) publicData.club = player.club;
    if (player.visibility.marketValue) publicData.marketValue = player.marketValue;
    if (player.visibility.preferredFoot) publicData.preferredFoot = player.preferredFoot;
    if (player.visibility.height) publicData.height = player.height;
    if (player.visibility.weight) publicData.weight = player.weight;
    if (player.visibility.previousClubs) publicData.previousClubs = player.previousClubs;
    if (player.visibility.dealStatus) publicData.dealStatus = player.dealStatus;
    if (player.visibility.achievements) publicData.achievements = player.achievements;
    if (player.visibility.stats) {
        publicData.appearances = player.appearances;
        publicData.goals = player.goals;
        publicData.assists = player.assists;
    }
    if (player.visibility.photos) {
        publicData.photos = player.photos.filter(p => p.isMain);
    }

    return publicData;
};

export const generateId = (): string => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const debounce = <T extends (...args: any[]) => any>(
    func: T,
    wait: number
): ((...args: Parameters<T>) => void) => {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
};

export const translateText = async (text: string, source = 'ar', target = 'en'): Promise<string> => {
    if (!text || text.trim() === '') return '';
    try {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${source}&tl=${target}&dt=t&q=${encodeURIComponent(text)}`;
        const response = await fetch(url);
        const data = await response.json();
        // Google Translate returns an array of arrays for multiline text
        if (data && data[0] && Array.isArray(data[0])) {
            const segments = data[0].filter((seg: any) => seg && typeof seg[0] === 'string');
            if (segments.length > 0) {
                return segments.map((seg: any) => seg[0]).join('') || text;
            }
        }
        return text;
    } catch (error) {
        console.error('Translation error:', error);
        return text;
    }
};

export const exportToCSV = (data: any[], filename: string) => {
    if (!data || data.length === 0) return;

    // Get headers from first object
    const headers = Object.keys(data[0]);

    // Create CSV content
    const csvContent = [
        headers.join(','),
        ...data.map(row =>
            headers.map(header => {
                const value = row[header];
                // Handle strings with commas or newlines
                if (typeof value === 'string' && (value.includes(',') || value.includes('\n'))) {
                    return `"${value.replace(/"/g, '""')}"`;
                }
                return value;
            }).join(',')
        )
    ].join('\n');

    // Create blob with BOM for Excel Arabic support
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

export const triggerPrint = () => {
    window.print();
};

export const getDealStatusTranslation = (status: string, role: string, t: any): string => {
    if (!status) return t('common.not_available');
    
    // If status is already coach-specific, use it directly
    if (status === 'FREE_AGENT_COACH' || status === 'AMATEUR_COACH') {
        return t(`enums.DealStatus.${status}`);
    }

    const isCoach = role === ProfileRole.COACH;
    if (status === 'FREE_AGENT' && isCoach) {
        return t('enums.DealStatus.FREE_AGENT_COACH');
    }
    if (status === 'AMATEUR' && isCoach) {
        return t('enums.DealStatus.AMATEUR_COACH');
    }
    
    return t(`enums.DealStatus.${status}`, { defaultValue: status });
};
