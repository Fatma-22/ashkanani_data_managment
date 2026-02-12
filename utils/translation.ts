
/**
 * Translation dictionary for common countries and football clubs
 */

const COUNTRY_MAP: Record<string, string> = {
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
};

const CLUB_MAP: Record<string, string> = {
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
    'Al-Ittihad': 'الاتحاد',
    'Al-Ahli': 'الأهلي',
    'Al-Nassr': 'النصر',
    'Al-Hilal': 'الهلال',
    'Galatasaray': 'غلطة سراي',
    'Zamalek SC': 'الزمالك',
    'Al Ahly SC': 'الأهلي المصري',
};

/**
 * Automatically translates a string to Arabic based on category
 */
export const translateToArabic = (text: string, category: 'country' | 'club'): string => {
    if (!text) return text;

    const map = category === 'country' ? COUNTRY_MAP : CLUB_MAP;

    // Exact match
    if (map[text]) return map[text];

    // Case-insensitive match
    const lowerText = text.toLowerCase().trim();
    const entry = Object.entries(map).find(([key]) => key.toLowerCase() === lowerText);

    return entry ? entry[1] : text;
};
