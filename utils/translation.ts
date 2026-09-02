export const COUNTRY_MAP: Record<string, string> = {
    'Egypt': 'مصر',
    'France': 'فرنسا',
    'Morocco': 'المغرب',
    'Algeria': 'الجزائر',
    'Senegal': 'السنغال',
    'Ghana': 'غانا',
    'Nigeria': 'نيجيريا',
    'Ivory Coast': 'ساحل العاج',
    'Cameroon': 'الكاميرون',
    'Tunisia': 'تونس',
    'Brazil': 'البرازيل',
    'Argentina': 'الأرجنتين',
    'Spain': 'إسبانيا',
    'England': 'إنجلترا',
    'Germany': 'ألمانيا',
    'Italy': 'إيطاليا',
    'Portugal': 'البرتغال',
    'Netherlands': 'هولندا',
    'Belgium': 'بلجيكا',
    'Croatia': 'كرواتيا',
    'Saudi Arabia': 'السعودية',
    'UAE': 'الإمارات',
    'Qatar': 'قطر',
    'Kuwait': 'الكويت',
    'Oman': 'عمان',
    'Bahrain': 'البحرين',
    'Jordan': 'الأردن',
    'Lebanon': 'لبنان',
    'Iraq': 'العراق',
    'Palestine': 'فلسطين',
    'Syria': 'سوريا',
    'Libya': 'ليبيا',
    'Sudan': 'السودان',
    'Yemen': 'اليمن',
    'Turkey': 'تركيا',
    'USA': 'الولايات المتحدة',
    'Canada': 'كندا',
    'Japan': 'اليابان',
    'South Korea': 'كوريا الجنوبية',
    'China': 'الصين',
    'Australia': 'أستراليا',
    'Switzerland': 'سويسرا',
    'Sweden': 'السويد',
    'Norway': 'النرويج',
    'Denmark': 'الدنمارك',
    'Poland': 'بولندا',
    'Ukraine': 'أوكرانيا',
    'Russia': 'روسيا',
    'Mexico': 'المكسيك',
    'Colombia': 'كولومبيا',
    'Uruguay': 'الأوروغواي',
    'Chile': 'تشيلي',
    'Kuwaiti': 'كويتي',
    'Egyptian': 'مصري',
    'Saudi': 'سعودي',
    'Bahraini': 'بحريني',
    'Bidoon': 'بدون',
    'No Nationality': 'غير محدد الجنسية',
};

export const CLUB_MAP: Record<string, string> = {
    'Liverpool FC': 'ليفربول',
    'Manchester City': 'مانشستر سيتي',
    'Arsenal FC': 'أرسنال',
    'Manchester United': 'مانشستر يونايتد',
    'Chelsea FC': 'تشيلسي',
    'Tottenham Hotspur': 'توتنهام',
    'Real Madrid': 'ريال مدريد',
    'FC Barcelona': 'برشلونة',
    'Atletico Madrid': 'أتلتيكو مدريد',
    'Paris Saint-Germain': 'باريس سان جيرمان',
    'Bayern Munich': 'بايرن ميونخ',
    'Borussia Dortmund': 'بوروسيا دورتموند',
    'AC Milan': 'ميلان',
    'Inter Milan': 'إنتر ميلان',
    'Juventus': 'يوفنتوس',
    'AS Roma': 'روما',
    'Napoli': 'نابولي',
    'Lazio': 'لاتسيو',
    'Al-Ittihad': 'الاتحاد',
    'Al-Ahli': 'الأهلي',
    'Al-Nassr': 'النصر',
    'Al-Hilal': 'الهلال',
    'Al-Shabab': 'الشباب',
    'Al-Ettifaq': 'الاتفاق',
    'Al-Duhail': 'الدحيل',
    'Al-Sadd': 'السد',
    'Al-Ain': 'العين',
    'Al-Wasl': 'الوصل',
    'Al-Ahli Dubai': 'الأهلي دبي',
    'Al-Kuwait': 'الكويت',
    'Al-Qadsia': 'القادسية',
    'Al-Arabi': 'العربي',
    'Kazma': 'كاظمة',
    'Galatasaray': 'غلطة سراي',
    'Fenerbahce': 'فنربخشة',
    'Besiktas': 'بشكتاش',
    'Zamalek SC': 'الزمالك',
    'Al Ahly SC': 'الأهلي المصري',
    'Pyramids FC': 'بيراميدز',
    'Wydad AC': 'الوداد',
    'Raja CA': 'الرجا',
    'Esperance Tunis': 'الترجي',
};

export const POSITION_MAP: Record<string, string> = {
    'Goalkeeper': 'حارس مرمى',
    'GK': 'حارس مرمى',
    'Defender': 'مدافع',
    'CB': 'قلب دفاع',
    'LB': 'ظهير أيسر',
    'RB': 'ظهير أيمن',
    'LWB': 'جناح دفاعي أيسر',
    'RWB': 'جناح دفاعي أيمن',
    'Midfielder': 'لاعب وسط',
    'CDM': 'وسط دفاعي',
    'CM': 'وسط',
    'CAM': 'وسط هجومي',
    'Forward': 'مهاجم',
    'ST': 'رأس حربة',
    'LW': 'جناح أيسر',
    'RW': 'جناح أيمن',
    'CF': 'مهاجم صريح',
};

// Reverse maps for bidirectional translation
const createReverseMap = (map: Record<string, string>) => {
    const reversed: Record<string, string> = {};
    Object.entries(map).forEach(([en, ar]) => {
        reversed[ar] = en;
    });
    return reversed;
};

export const REVERSE_COUNTRY_MAP = createReverseMap(COUNTRY_MAP);
export const REVERSE_CLUB_MAP = createReverseMap(CLUB_MAP);
export const REVERSE_POSITION_MAP = createReverseMap(POSITION_MAP);

/**
 * Automatically translates a string to Arabic or English based on category and target language
 */
export const translate = (text: string, category: 'country' | 'club' | 'position', targetLang: 'ar' | 'en' = 'ar'): string => {
    if (!text) return text;

    let map: Record<string, string>;
    if (targetLang === 'ar') {
        switch (category) {
            case 'country': map = COUNTRY_MAP; break;
            case 'club': map = CLUB_MAP; break;
            case 'position': map = POSITION_MAP; break;
            default: return text;
        }
    } else {
        switch (category) {
            case 'country': map = REVERSE_COUNTRY_MAP; break;
            case 'club': map = REVERSE_CLUB_MAP; break;
            case 'position': map = REVERSE_POSITION_MAP; break;
            default: return text;
        }
    }

    // Exact match
    if (map[text]) return map[text];

    // Case-insensitive/trimmed match
    const trimmedText = text.trim();
    const lowerText = trimmedText.toLowerCase();
    const entry = Object.entries(map).find(([key]) => key.toLowerCase() === lowerText || key === trimmedText);

    return entry ? entry[1] : text;
};

// Keep old function name for compatibility
export const translateToArabic = (text: string, category: 'country' | 'club' | 'position'): string => {
    return translate(text, category, 'ar');
};

export const translateToEnglish = (text: string, category: 'country' | 'club' | 'position'): string => {
    return translate(text, category, 'en');
};

