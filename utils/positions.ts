import { Sport } from '../types';

export const SPORT_POSITIONS: Record<string, string[]> = {
    // Team Sports
    [Sport.FOOTBALL]: [
        'GK', 'CB', 'LCB', 'RCB', 'RB', 'LB', 'RWB', 'LWB', 
        'CDM', 'LDM', 'RDM', 'CM', 'LCM', 'RCM', 'CAM', 'LCAM', 'RCAM', 
        'RM', 'LM', 'RW', 'LW', 'CF', 'ST', 'SS', 'LS', 'RS'
    ],
    [Sport.BASKETBALL]: ['PG', 'SG', 'SF', 'PF', 'C'],
    [Sport.VOLLEYBALL]: ['S', 'OH', 'OPP', 'MB', 'L'],
    [Sport.HANDBALL]: ['GK', 'LW', 'LB', 'CB', 'RB', 'RW', 'P'],
    [Sport.FUTSAL]: ['GK', 'FIXO', 'ALA', 'PIVOT'],
    [Sport.WATER_POLO]: ['GK', 'CF', 'CB', 'WINGS', 'FLATS'],
    [Sport.CRICKET]: ['BATSMAN', 'BOWLER', 'WK', 'ALL_ROUNDER'],
    [Sport.RUGBY_UNION]: ['PROP', 'HOOKER', 'LOCK', 'FLANKER', 'SH', 'FH', 'CENTER', 'RUGBY_WING', 'FB'],
    [Sport.RUGBY_LEAGUE]: ['PROP', 'HOOKER', 'SECOND_ROW', 'SH', 'SO', 'CENTER', 'RUGBY_WING', 'FB'],
    [Sport.AMERICAN_FOOTBALL]: ['QB', 'AM_RB', 'WR', 'TE', 'OL', 'DL', 'AM_LB', 'DB', 'K'],
    [Sport.BASEBALL]: ['PITCHER', 'CATCHER', '1B', '2B', 'BASE_SS', '3B', 'OF'],
    [Sport.SOFTBALL]: ['PITCHER', 'CATCHER', '1B', '2B', 'BASE_SS', '3B', 'OF'],
    [Sport.ICE_HOCKEY]: ['GK', 'DEFENSE', 'WINGER', 'CENTER'],
    [Sport.FIELD_HOCKEY]: ['GK', 'DEFENSE', 'MIDFIELDER', 'FORWARD'],
    [Sport.LACROSSE]: ['GK', 'DEFENSE', 'MIDFIELDER', 'ATTACK'],
    [Sport.PAINTBALL]: ['FRONT', 'PB_MID', 'PB_BACK', 'SNAKE', 'DORITO'],
    [Sport.BEACH_SOCCER]: ['GK', 'FIXO', 'ALA', 'PIVOT'],
    [Sport.BEACH_VOLLEYBALL]: ['BLOCKER', 'DEFENDER'],

    // Racket Sports
    [Sport.TENNIS]: ['SINGLE', 'DOUBLE'],
    [Sport.PADEL]: ['NET', 'PADEL_BACK', 'LEFT', 'RIGHT'],
    [Sport.SQUASH]: ['SINGLE'],
    [Sport.TABLE_TENNIS]: ['SINGLE', 'DOUBLE'],
    [Sport.BADMINTON]: ['SINGLE', 'DOUBLE'],

    // Combat Sports
    [Sport.MMA]: ['STRIKER', 'GRAPPLER', 'ALL_ROUNDER'],
    [Sport.BOXING]: ['FIGHTER'],
    [Sport.KICKBOXING]: ['STRIKER'],
    [Sport.MUAY_THAI]: ['STRIKER'],
    [Sport.JUDO]: ['GRAPPLER'],
    [Sport.KARATE]: ['KATA', 'KUMITE'],
    [Sport.TAEKWONDO]: ['FIGHTER'],
    [Sport.WRESTLING]: ['FREESTYLE', 'GRECO_ROMAN'],
    [Sport.JIU_JITSU]: ['GI', 'NO_GI'],
    [Sport.SAMBO]: ['FIGHTER'],
    [Sport.FENCING]: ['FOIL', 'EPEE', 'SABRE'],

    // Water Sports
    [Sport.SWIMMING]: ['FREE', 'SWIM_BACK', 'BREAST', 'FLY', 'MEDLEY'],
    [Sport.DIVING]: ['SPRINGBOARD', 'PLATFORM'],
    [Sport.ROWING]: ['STROKE', 'BOW', 'COX'],
    [Sport.SAILING]: ['HELM', 'TRIM', 'BOW'],
    [Sport.SURFING]: ['SHORTBOARD', 'LONGBOARD'],
    [Sport.MOTOSURF]: ['RACER', 'FREESTYLE'],
    [Sport.JET_SKI]: ['RACER', 'FREESTYLE'],

    // Motorsports
    [Sport.FORMULA_1]: ['DRIVER'],
    [Sport.RALLY]: ['DRIVER', 'CO_DRIVER'],
    [Sport.MOTOCROSS]: ['RACER'],
    [Sport.KARTING]: ['RACER'],

    // Athletics & Gymnastics
    [Sport.ATHLETICS]: ['SPRINT', 'MIDDLE', 'LONG', 'HURDLE', 'JUMP', 'THROW', 'DECATHLON', 'MARATHON'],
    [Sport.POLE_VAULT]: ['ATHLETE'],
    [Sport.GYMNASTICS]: ['FLOOR', 'VAULT', 'POMMEL', 'RINGS', 'BARS', 'BEAM'],
    [Sport.TRIATHLON]: ['ATHLETE'],
    [Sport.CYCLING]: ['ROAD', 'MTB', 'TRACK', 'BMX'],
    [Sport.WEIGHTLIFTING]: ['SNATCH', 'CLEAN_JERK'],

    // Target Sports
    [Sport.SHOOTING]: ['PISTOL', 'RIFLE', 'TRAP'],
    [Sport.ARCHERY]: ['RECURVE', 'COMPOUND'],
    [Sport.BOWLING]: ['PLAYER'],
    [Sport.DARTS]: ['PLAYER'],
    [Sport.GOLF]: ['PLAYER'],
    [Sport.BILLIARDS]: ['PLAYER'],
    [Sport.SNOOKER]: ['PLAYER'],

    // Esports
    [Sport.MOBA]: ['MOBA_MID', 'CARRY', 'SUPPORT', 'TANK', 'JUNGLE'],
    [Sport.FPS]: ['AWP', 'ENTRY', 'SUPPORT', 'IGL', 'LURKER'],
    [Sport.ESPORTS_STRATEGY]: ['PLAYER'],
    [Sport.ESPORTS_SPORTS]: ['PLAYER'],

    // Others & Traditional
    [Sport.EQUESTRIAN]: ['DRESSAGE', 'JUMPING', 'EVENTING'],
    [Sport.CHESS]: ['PLAYER'],
    [Sport.CAMEL_RACING]: ['JOCKEY'],
    [Sport.FALCONRY]: ['FALCONER'],
    [Sport.HORSE_RACING]: ['JOCKEY'],
};

export const ALL_SPECIFIC_POSITIONS = Object.values(SPORT_POSITIONS).flat();

export const getPositionsBySport = (sport: string | undefined): string[] => {
    if (!sport) return [];
    return SPORT_POSITIONS[sport as Sport] || [];
};

export const hasVisualPitch = (sport: Sport | string): boolean => {
    const s = String(sport).toLowerCase();
    const pitchSports = [
        'football', 'soccer', 'basketball', 'volleyball', 'tennis', 'padel', 'handball', 
        'futsal', 'water polo', 'ice hockey', 'field hockey', 'american football', 
        'rugby union', 'rugby league', 'beach soccer', 'beach volleyball'
    ];
    return pitchSports.includes(s);
};

export const isGenericPosition = (pos: string): boolean => {
    return ['Goalkeeper', 'Defender', 'Midfielder', 'Forward', 'Coach', 'Player', 'Athlete'].includes(pos);
};

// Fuzzy mapping for legacy or translated strings back to codes
export const POSITION_FALLBACK_MAP: Record<string, string> = {
    // Arabic matches
    'حارس مرمى': 'GK',
    'قلب دفاع': 'CB',
    'مدافع': 'CB',
    'دفاع': 'CB',
    'ظهير أيمن': 'RB',
    'ظهير أيسر': 'LB',
    'ظهير ايسر': 'LB',
    'ظهير': 'RB',
    'وسط مدافع': 'CDM',
    'خط وسط دفاع': 'CDM',
    'خط وسط': 'CM',
    'لاعب وسط': 'CM',
    'صانع ألعاب': 'CAM',
    'خط وسط مهاجم': 'CAM',
    'جناح أيمن': 'RW',
    'جناح أيسر': 'LW',
    'جناح': 'RW',
    'رأس حربة': 'ST',
    'مهاجم': 'ST',
    'مهاجم ثاني': 'SS',
    'محور': 'P',
    'سنتر': 'C',
    'ليبرو': 'L',
    'عشاري': 'DECATHLON',
    'جري': 'SPRINT',
    'سباحة': 'FREE',
    'صدر': 'BREAST',
    'ظهر': 'BACK',
    'فراشة': 'FLY',
    'وثب': 'JUMP',
    'رمي': 'THROW',
    
    // Full English matches
    'Goalkeeper': 'GK',
    'Defender': 'CB',
    'Midfielder': 'CM',
    'Forward': 'ST',
    'Striker': 'ST',
    'Center': 'C',
    'Point Guard': 'PG',
    'Shooting Guard': 'SG',
    'Small Forward': 'SF',
    'Power Forward': 'PF',
    'Left winger': 'LW',
    'Left Wing': 'LW',
    'DM': 'CDM',
    'ZM': 'CM',
    'Sprint': 'SPRINT',
    'Marathon': 'MARATHON',
};

export const normalizePosition = (pos: string): string => {
    if (!pos) return '';
    
    // Handle combined positions like "CB+RB" or "ظهير + جناح"
    // Split by common separators and take the first one for visualization
    const primaryPos = pos.split(/[+/]/)[0].trim();
    
    // If it's already one of the standard codes in SPORT_POSITIONS, return it
    if (ALL_SPECIFIC_POSITIONS.includes(primaryPos.toUpperCase())) {
        return primaryPos.toUpperCase();
    }
    
    // Check fallback map
    const mapped = POSITION_FALLBACK_MAP[primaryPos] || POSITION_FALLBACK_MAP[primaryPos.toUpperCase()];
    if (mapped) return mapped;

    return primaryPos;
};
