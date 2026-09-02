export const footSports = ['football', 'futsal', 'beach football', 'soccer', 'american football', 'australian rules'];
export const handSports = ['basketball', 'volleyball', 'beach volleyball', 'handball', 'tennis', 'padel', 'squash', 'table tennis', 'badminton', 'water polo', 'cricket', 'baseball', 'softball'];

export const isHandSport = (sport: string | undefined | null): boolean => {
    if (!sport) return false;
    return handSports.includes(sport.toLowerCase());
};

export const isFootSport = (sport: string | undefined | null): boolean => {
    if (!sport) return false;
    return footSports.includes(sport.toLowerCase());
};

export const hasLimbPreference = (sport: string | undefined | null): boolean => {
    const s = sport?.toLowerCase();
    return isHandSport(s) || isFootSport(s);
};
