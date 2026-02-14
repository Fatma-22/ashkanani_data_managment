import dayjs from 'dayjs';
import { Player, PlayerFilters, Agent, Contract, DashboardStats, ProfileRole } from '../types';
import { translateToArabic } from './translation';

export { translateToArabic };

export const normalizeString = (str: string): string => {
    return str.toLowerCase().trim();
};

export const filterPlayers = (players: Player[], filters: PlayerFilters, contracts: Contract[] = []): Player[] => {
    return players.filter(player => {
        // Search by name, club, or nationality
        if (filters.search) {
            const searchLower = normalizeString(filters.search);
            const nameMatch = normalizeString(player.name).includes(searchLower);
            const nameArMatch = player.nameAr ? normalizeString(player.nameAr).includes(searchLower) : false;
            const clubMatch = normalizeString(player.club).includes(searchLower);
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

        // Position filter
        if (filters.position && filters.position.length > 0) {
            if (!filters.position.includes(player.position)) return false;
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
            if (!filters.club.includes(player.club)) return false;
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

export const formatCurrency = (value: number, currency: string = 'USD'): string => {
    if (value >= 1000000) {
        return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
        return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value.toLocaleString()}`;
};

export const formatDate = (date: string, format: string = 'DD MMM YYYY'): string => {
    return dayjs(date).format(format);
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
        clubAr: player.clubAr || translateToArabic(player.club, 'club'),
        sport: player.sport,
    };

    // Only include fields that are marked as visible
    if (player.visibility.nationality) publicData.nationality = player.nationality;
    if (player.visibility.age) publicData.age = player.age;
    if (player.visibility.position) publicData.position = player.position;
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
