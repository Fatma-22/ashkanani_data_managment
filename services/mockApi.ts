import {
    Player,
    Agent,
    Contract,
    DashboardStats,
    PlayerFilters,
    Position,
    PreferredFoot,
    DealStatus,
    ContractStatus,
    MarketValueDistribution,
    ContractStatusData,
    ContractExpiryData,
    UserRole,
    User,
    Sport,
} from '../types';
import { filterPlayers, isContractExpiringSoon, calculateAge, generateId } from '../utils/helpers';
import { translateToArabic } from '../utils/translation';
import dayjs from 'dayjs';

// Mock data storage
let mockPlayers: Player[] = [
    {
        id: '1',
        name: 'Mohamed Salah',
        nameAr: 'محمد صلاح',
        sport: Sport.FOOTBALL,
        nationality: 'Egypt',
        nationalityAr: 'مصر',
        dateOfBirth: '1992-06-15',
        age: 31,
        position: Position.FORWARD,
        club: 'Liverpool FC',
        clubAr: 'نادي ليفربول',
        marketValue: 85000000,
        preferredFoot: PreferredFoot.LEFT,
        dealStatus: DealStatus.SIGNED,
        height: 175,
        weight: 71,
        previousClubs: ['FC Basel', 'Chelsea FC', 'Fiorentina', 'AS Roma'],
        jerseyNumber: 11,
        agentId: 'agent-1',
        agentName: 'Ramy Abbas Issa',
        photos: [
            { id: 'p1-1', url: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=400', caption: 'Action shot', isMain: true },
            { id: 'p1-2', url: 'https://images.unsplash.com/photo-1606925797300-0b35e9d1794e?w=400', caption: 'Training', isMain: false },
        ],
        documents: [
            { id: 'd1-1', name: 'Contract 2023-2025.pdf', url: '/docs/contract1.pdf', type: 'contract', uploadedAt: '2023-07-01' },
        ],
        appearances: 245,
        goals: 187,
        assists: 79,
        achievements: ['Premier League Golden Boot 2022', 'CAF African Player of the Year'],
        achievementsAr: ['الحذاء الذهبي للدوري الإنجليزي 2022', 'جائزة أفضل لاعب أفريقي من الكاف'],
        bio: 'Egyptian professional footballer who plays as a forward for Liverpool and Egypt national team.',
        bioAr: 'لاعب كرة قدم مصري محترف يلعب كمهاجم لنادي ليفربول والمنتخب المصري.',
        visibility: {
            nationality: true,
            age: true,
            dateOfBirth: false,
            position: true,
            club: true,
            marketValue: true,
            preferredFoot: true,
            height: true,
            weight: true,
            previousClubs: true,
            dealStatus: true,
            contractInfo: false,
            photos: true,
            achievements: true,
            stats: true,
        },
        isVisible: true,
        createdAt: '2023-01-15',
        updatedAt: '2024-02-10',
    },
    {
        id: '2',
        name: 'Karim Benzema',
        nameAr: 'كريم بنزيما',
        sport: Sport.FOOTBALL,
        nationality: 'France',
        nationalityAr: 'فرنسا',
        dateOfBirth: '1987-12-19',
        age: 36,
        position: Position.FORWARD,
        club: 'Al-Ittihad',
        clubAr: 'نادي الاتحاد',
        marketValue: 25000000,
        preferredFoot: PreferredFoot.RIGHT,
        dealStatus: DealStatus.SIGNED,
        height: 185,
        weight: 81,
        previousClubs: ['Lyon', 'Real Madrid'],
        jerseyNumber: 9,
        agentId: 'agent-1',
        agentName: 'Ramy Abbas Issa',
        photos: [
            { id: 'p2-1', url: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=400', caption: 'Profile', isMain: true },
        ],
        documents: [],
        appearances: 648,
        goals: 354,
        assists: 165,
        achievements: ['Ballon d\'Or 2022', 'UEFA Champions League Top Scorer'],
        achievementsAr: ['جائزة الكرة الذهبية 2022', 'هداف دوري أبطال أوروبا'],
        visibility: {
            nationality: true,
            age: true,
            dateOfBirth: false,
            position: true,
            club: true,
            marketValue: true,
            preferredFoot: true,
            height: true,
            weight: false,
            previousClubs: true,
            dealStatus: true,
            contractInfo: false,
            photos: true,
            achievements: true,
            stats: true,
        },
        isVisible: true,
        createdAt: '2023-06-20',
        updatedAt: '2023-12-01',
    },
    {
        id: '3',
        name: 'Achraf Hakimi',
        nameAr: 'أشرف حكيمي',
        sport: Sport.FOOTBALL,
        nationality: 'Morocco',
        nationalityAr: 'المغرب',
        dateOfBirth: '1998-11-04',
        age: 25,
        position: Position.DEFENDER,
        club: 'Paris Saint-Germain',
        clubAr: 'باريس سان جيرمان',
        marketValue: 65000000,
        preferredFoot: PreferredFoot.RIGHT,
        dealStatus: DealStatus.SIGNED,
        height: 181,
        weight: 73,
        previousClubs: ['Real Madrid', 'Borussia Dortmund', 'Inter Milan'],
        jerseyNumber: 2,
        agentId: 'agent-2',
        agentName: 'Alejandro Camano',
        photos: [
            { id: 'p3-1', url: 'https://images.unsplash.com/photo-1606925797300-0b35e9d1794e?w=400', caption: 'Match day', isMain: true },
        ],
        documents: [],
        appearances: 312,
        goals: 28,
        assists: 46,
        achievements: ['FIFA World Cup Semi-Finalist 2022'],
        achievementsAr: ['نصف نهائي كأس العالم 2022'],
        visibility: {
            nationality: true,
            age: true,
            dateOfBirth: false,
            position: true,
            club: true,
            marketValue: true,
            preferredFoot: true,
            height: true,
            weight: true,
            previousClubs: true,
            dealStatus: true,
            contractInfo: false,
            photos: true,
            achievements: true,
            stats: true,
        },
        isVisible: true,
        createdAt: '2023-01-10',
        updatedAt: '2024-01-15',
    },
    {
        id: '4',
        name: 'Riyad Mahrez',
        nameAr: 'رياض محرز',
        sport: Sport.FOOTBALL,
        nationality: 'Algeria',
        nationalityAr: 'الجزائر',
        dateOfBirth: '1991-02-21',
        age: 32,
        position: Position.FORWARD,
        club: 'Al-Ahli',
        clubAr: 'النادي الأهلي',
        marketValue: 28000000,
        preferredFoot: PreferredFoot.LEFT,
        dealStatus: DealStatus.SIGNED,
        height: 179,
        weight: 67,
        previousClubs: ['Le Havre', 'Leicester City', 'Manchester City'],
        jerseyNumber: 26,
        agentId: 'agent-2',
        agentName: 'Alejandro Camano',
        photos: [
            { id: 'p4-1', url: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=400', caption: 'Celebrating', isMain: true },
        ],
        documents: [],
        appearances: 456,
        goals: 135,
        assists: 98,
        achievements: ['Premier League Champion', 'African Player of the Year 2016'],
        achievementsAr: ['بطل الدوري الإنجليزي الممتاز', 'أفضل لاعب أفريقي عام 2016'],
        visibility: {
            nationality: true,
            age: true,
            dateOfBirth: false,
            position: true,
            club: true,
            marketValue: true,
            preferredFoot: true,
            height: true,
            weight: true,
            previousClubs: true,
            dealStatus: true,
            contractInfo: false,
            photos: true,
            achievements: true,
            stats: true,
        },
        isVisible: true,
        createdAt: '2023-07-25',
        updatedAt: '2023-11-20',
    },
    {
        id: '5',
        name: 'N\'Golo Kanté',
        nameAr: 'نغولو كانتي',
        sport: Sport.FOOTBALL,
        nationality: 'France',
        nationalityAr: 'فرنسا',
        dateOfBirth: '1991-03-29',
        age: 32,
        position: Position.MIDFIELDER,
        club: 'Al-Ittihad',
        clubAr: 'نادي الاتحاد',
        marketValue: 18000000,
        preferredFoot: PreferredFoot.RIGHT,
        dealStatus: DealStatus.SIGNED,
        height: 168,
        weight: 70,
        previousClubs: ['Boulogne', 'Caen', 'Leicester City', 'Chelsea'],
        jerseyNumber: 7,
        agentId: 'agent-3',
        agentName: 'Global Sports Agency',
        photos: [
            { id: 'p5-1', url: 'https://images.unsplash.com/photo-1606925797300-0b35e9d1794e?w=400', caption: 'Team photo', isMain: true },
        ],
        documents: [],
        appearances: 389,
        goals: 13,
        assists: 17,
        achievements: ['FIFA World Cup Winner 2018', 'Premier League Champion'],
        achievementsAr: ['بطل كأس العالم 2018', 'بطل الدوري الإنجليزي الممتاز'],
        visibility: {
            nationality: true,
            age: true,
            dateOfBirth: false,
            position: true,
            club: true,
            marketValue: true,
            preferredFoot: true,
            height: true,
            weight: true,
            previousClubs: true,
            dealStatus: true,
            contractInfo: false,
            photos: true,
            achievements: true,
            stats: true,
        },
        isVisible: true,
        createdAt: '2023-06-15',
        updatedAt: '2023-12-05',
    },
    {
        id: '6',
        name: 'Hakim Ziyech',
        nameAr: 'حكيم زياش',
        sport: Sport.FOOTBALL,
        nationality: 'Morocco',
        nationalityAr: 'المغرب',
        dateOfBirth: '1993-03-19',
        age: 30,
        position: Position.MIDFIELDER,
        club: 'Galatasaray',
        clubAr: 'غلطة سراي',
        marketValue: 15000000,
        preferredFoot: PreferredFoot.LEFT,
        dealStatus: DealStatus.TRANSFER_LISTED,
        height: 180,
        weight: 65,
        previousClubs: ['Heerenveen', 'Twente', 'Ajax', 'Chelsea'],
        jerseyNumber: 22,
        agentId: 'agent-3',
        agentName: 'Global Sports Agency',
        photos: [
            { id: 'p6-1', url: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=400', caption: 'In action', isMain: true },
        ],
        documents: [],
        appearances: 378,
        goals: 95,
        assists: 123,
        achievements: ['UEFA Champions League Semi-Finalist'],
        achievementsAr: ['نصف نهائي دوري أبطال أوروبا'],
        visibility: {
            nationality: true,
            age: true,
            dateOfBirth: false,
            position: true,
            club: true,
            marketValue: true,
            preferredFoot: true,
            height: true,
            weight: true,
            previousClubs: true,
            dealStatus: true,
            contractInfo: false,
            photos: true,
            achievements: true,
            stats: true,
        },
        isVisible: true,
        nationalId: '12345678',
        phone: '+90 555 123 4567',
        address: 'Istanbul, Turkey',
        createdAt: '2023-09-01',
        updatedAt: '2024-01-10',
    },
    {
        id: '7',
        name: 'Edouard Mendy',
        nameAr: 'إدوار ميندي',
        sport: Sport.FOOTBALL,
        nationality: 'Senegal',
        nationalityAr: 'السنغال',
        dateOfBirth: '1992-03-01',
        age: 31,
        position: Position.GOALKEEPER,
        club: 'Al-Ahli',
        clubAr: 'النادي الأهلي',
        marketValue: 12000000,
        preferredFoot: PreferredFoot.RIGHT,
        dealStatus: DealStatus.SIGNED,
        height: 194,
        weight: 86,
        previousClubs: ['Reims', 'Rennes', 'Chelsea'],
        jerseyNumber: 1,
        agentId: 'agent-1',
        agentName: 'Ramy Abbas Issa',
        photos: [
            { id: 'p7-1', url: 'https://images.unsplash.com/photo-1606925797300-0b35e9d1794e?w=400', caption: 'Save action', isMain: true },
        ],
        documents: [],
        appearances: 189,
        goals: 0,
        assists: 1,
        achievements: ['UEFA Champions League Winner', 'AFCON Champion 2021'],
        achievementsAr: ['بطل دوري أبطال أوروبا', 'بطل كأس الأمم الأفريقية 2021'],
        visibility: {
            nationality: true,
            age: true,
            dateOfBirth: false,
            position: true,
            club: true,
            marketValue: true,
            preferredFoot: true,
            height: true,
            weight: true,
            previousClubs: true,
            dealStatus: true,
            contractInfo: false,
            photos: true,
            achievements: true,
            stats: true,
        },
        isVisible: true,
        createdAt: '2023-08-10',
        updatedAt: '2023-12-20',
    },
    {
        id: '8',
        name: 'Sadio Mané',
        nameAr: 'ساديو ماني',
        sport: Sport.FOOTBALL,
        nationality: 'Senegal',
        nationalityAr: 'السنغال',
        dateOfBirth: '1992-04-10',
        age: 31,
        position: Position.FORWARD,
        club: 'Al-Nassr',
        clubAr: 'نادي النصر',
        marketValue: 35000000,
        preferredFoot: PreferredFoot.RIGHT,
        dealStatus: DealStatus.SIGNED,
        height: 174,
        weight: 69,
        previousClubs: ['Metz', 'Red Bull Salzburg', 'Southampton', 'Liverpool', 'Bayern Munich'],
        jerseyNumber: 10,
        agentId: 'agent-2',
        agentName: 'Alejandro Camano',
        photos: [
            { id: 'p8-1', url: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=400', caption: 'Goal celebration', isMain: true },
        ],
        documents: [],
        appearances: 512,
        goals: 221,
        assists: 98,
        achievements: ['UEFA Champions League Winner', 'AFCON Champion 2021', 'Premier League Champion'],
        achievementsAr: ['بطل دوري أبطال أوروبا', 'بطل كأس الأمم الأفريقية 2021', 'بطل الدوري الإنجليزي الممتاز'],
        visibility: {
            nationality: true,
            age: true,
            dateOfBirth: false,
            position: true,
            club: true,
            marketValue: true,
            preferredFoot: true,
            height: true,
            weight: true,
            previousClubs: true,
            dealStatus: true,
            contractInfo: false,
            photos: true,
            achievements: true,
            stats: true,
        },
        isVisible: true,
        createdAt: '2023-08-20',
        updatedAt: '2024-01-05',
    },
    {
        id: '9',
        name: 'Yassine Bounou',
        nameAr: 'ياسين بونو',
        sport: Sport.FOOTBALL,
        nationality: 'Morocco',
        nationalityAr: 'المغرب',
        dateOfBirth: '1991-04-05',
        age: 32,
        position: Position.GOALKEEPER,
        club: 'Al-Hilal',
        clubAr: 'نادي الهلال',
        marketValue: 22000000,
        preferredFoot: PreferredFoot.LEFT,
        dealStatus: DealStatus.SIGNED,
        height: 192,
        weight: 80,
        previousClubs: ['Atletico Madrid', 'Girona', 'Sevilla'],
        jerseyNumber: 1,
        agentId: 'agent-3',
        agentName: 'Global Sports Agency',
        photos: [
            { id: 'p9-1', url: 'https://images.unsplash.com/photo-1606925797300-0b35e9d1794e?w=400', caption: 'Portrait', isMain: true },
        ],
        documents: [],
        appearances: 267,
        goals: 0,
        assists: 2,
        achievements: ['FIFA World Cup 4th Place 2022', 'Europa League Winner'],
        achievementsAr: ['المركز الرابع في كأس العالم 2022', 'بطل الدوري الأوروبي'],
        visibility: {
            nationality: true,
            age: true,
            dateOfBirth: false,
            position: true,
            club: true,
            marketValue: true,
            preferredFoot: true,
            height: true,
            weight: true,
            previousClubs: true,
            dealStatus: true,
            contractInfo: false,
            photos: true,
            achievements: true,
            stats: true,
        },
        isVisible: true,
        createdAt: '2023-07-15',
        updatedAt: '2023-11-30',
    },
    {
        id: '10',
        name: 'Thomas Partey',
        nameAr: 'توماس بارتي',
        sport: Sport.FOOTBALL,
        nationality: 'Ghana',
        nationalityAr: 'غانا',
        dateOfBirth: '1993-06-13',
        age: 30,
        position: Position.MIDFIELDER,
        club: 'Arsenal FC',
        clubAr: 'نادي أرسنال',
        marketValue: 42000000,
        preferredFoot: PreferredFoot.RIGHT,
        dealStatus: DealStatus.SIGNED,
        height: 185,
        weight: 77,
        previousClubs: ['Atletico Madrid'],
        jerseyNumber: 5,
        agentId: 'agent-1',
        agentName: 'Ramy Abbas Issa',
        photos: [
            { id: 'p10-1', url: 'https://images.unsplash.com/photo-1606925797300-0b35e9d1794e?w=400', caption: 'Midfield action', isMain: true },
        ],
        documents: [],
        appearances: 298,
        goals: 18,
        assists: 22,
        achievements: ['Europa League Winner'],
        achievementsAr: ['بطل الدوري الأوروبي'],
        visibility: {
            nationality: true,
            age: true,
            dateOfBirth: false,
            position: true,
            club: true,
            marketValue: true,
            preferredFoot: true,
            height: true,
            weight: true,
            previousClubs: true,
            dealStatus: true,
            contractInfo: false,
            photos: true,
            achievements: true,
            stats: true,
        },
        isVisible: true,
        createdAt: '2023-02-28',
        updatedAt: '2024-01-20',
    },
    {
        id: '11',
        name: 'LeBron James',
        nameAr: 'ليبرون جيمس',
        sport: Sport.BASKETBALL,
        nationality: 'USA',
        nationalityAr: 'الولايات المتحدة',
        dateOfBirth: '1984-12-30',
        age: 39,
        position: Position.FORWARD,
        club: 'LA Lakers',
        clubAr: 'لوس أنجلوس ليكرز',
        marketValue: 45000000,
        preferredFoot: PreferredFoot.RIGHT,
        dealStatus: DealStatus.SIGNED,
        height: 206,
        weight: 113,
        previousClubs: ['Cleveland Cavaliers', 'Miami Heat'],
        jerseyNumber: 23,
        agentId: 'agent-1',
        agentName: 'Ramy Abbas Issa',
        photos: [{ id: 'p11-1', url: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400', caption: 'Dunk', isMain: true }],
        documents: [],
        appearances: 1421,
        goals: 38652,
        assists: 10420,
        achievements: ['4x NBA Champion', '4x NBA MVP'],
        achievementsAr: ['بطل الدوري الأمريكي ٤ مرات', 'أفضل لاعب في الدوري ٤ مرات'],
        bio: 'American professional basketball player for the Los Angeles Lakers.',
        bioAr: 'لاعب كرة سلة أمريكي محترف لفريق لوس أنجلوس ليكرز.',
        visibility: {
            nationality: true,
            age: true,
            dateOfBirth: false,
            position: true,
            club: true,
            marketValue: true,
            preferredFoot: false,
            height: true,
            weight: true,
            previousClubs: true,
            dealStatus: true,
            contractInfo: false,
            photos: true,
            achievements: true,
            stats: true,
        },
        isVisible: true,
        createdAt: '2023-01-01',
        updatedAt: '2024-01-01',
    },
    {
        id: '12',
        name: 'Rafael Nadal',
        nameAr: 'رافاييل نادال',
        sport: Sport.TENNIS,
        nationality: 'Spain',
        nationalityAr: 'إسبانيا',
        dateOfBirth: '1986-06-03',
        age: 37,
        position: Position.FORWARD,
        club: 'Independent',
        clubAr: 'مستقل',
        marketValue: 10000000,
        preferredFoot: PreferredFoot.LEFT,
        dealStatus: DealStatus.SIGNED,
        height: 185,
        weight: 85,
        previousClubs: [],
        agentId: 'agent-3',
        agentName: 'Global Sports Agency',
        photos: [{ id: 'p12-1', url: 'https://images.unsplash.com/photo-1592709823125-a191f07a2a5e?w=400', caption: 'Serve', isMain: true }],
        documents: [],
        achievements: ['22x Grand Slam Winner'],
        achievementsAr: ['بطل الجراند سلام ٢٢ مرة'],
        bio: 'Spanish professional tennis player.',
        bioAr: 'لاعب تنس إسباني محترف.',
        visibility: {
            nationality: true,
            age: true,
            dateOfBirth: false,
            position: false,
            club: false,
            marketValue: true,
            preferredFoot: true,
            height: true,
            weight: true,
            previousClubs: false,
            dealStatus: true,
            contractInfo: false,
            photos: true,
            achievements: true,
            stats: false,
        },
        isVisible: true,
        createdAt: '2023-01-01',
        updatedAt: '2024-01-01',
    },
];

let mockAgents: Agent[] = [
    {
        id: 'agent-1',
        name: 'Ramy Abbas Issa',
        nameAr: 'رامي عباس عيسى',
        email: 'ramy@sportsagency.com',
        phone: '+20 1234567890',
        company: 'SAM Sports Group',
        companyAr: 'مجموعة سام الرياضية',
        assignedPlayerIds: ['1', '7', '10'],
        password: 'password123',
        createdAt: '2023-01-01',
    },
    {
        id: 'agent-2',
        name: 'Alejandro Camano',
        nameAr: 'أليخاندرو كامانو',
        email: 'alejandro@sportsmanagement.com',
        phone: '+54 1123456789',
        company: 'AC Sports Management',
        companyAr: 'إيه سي لإدارة الرياضة',
        assignedPlayerIds: ['3', '4', '8'],
        password: 'password123',
        createdAt: '2023-01-01',
    },
    {
        id: 'agent-3',
        name: 'Global Sports Agency',
        nameAr: 'وكالة الرياضة العالمية',
        email: 'contact@globalsports.com',
        phone: '+44 20 12345678',
        company: 'Global Sports Agency',
        companyAr: 'وكالة الرياضة العالمية',
        assignedPlayerIds: ['5', '6', '9'],
        password: 'password123',
        createdAt: '2023-01-01',
    },
];

let mockContracts: Contract[] = [
    {
        id: 'c1',
        playerId: '1',
        playerName: 'Mohamed Salah',
        type: 'Professional',
        startDate: '2023-07-01',
        endDate: '2025-06-30',
        annualSalary: 18000000,
        signingBonus: 5000000,
        status: ContractStatus.ACTIVE,
        agentId: 'agent-1',
        fileUrl: '/docs/contract1.pdf',
        isVisible: false,
        notes: 'Performance bonuses included',
        notesAr: 'تشمل مكافآت الأداء',
    },
    {
        id: 'c2',
        playerId: '2',
        playerName: 'Karim Benzema',
        type: 'Professional',
        startDate: '2023-06-01',
        endDate: '2026-06-01',
        annualSalary: 100000000,
        status: ContractStatus.ACTIVE,
        agentId: 'agent-1',
        isVisible: false,
        fileUrl: '/docs/sample-contract.pdf',
    },
    {
        id: 'c3',
        playerId: '3',
        playerName: 'Achraf Hakimi',
        type: 'Professional',
        startDate: '2021-07-01',
        endDate: '2026-06-30',
        annualSalary: 8500000,
        status: ContractStatus.ACTIVE,
        agentId: 'agent-2',
        isVisible: false,
        fileUrl: '/docs/sample-contract.pdf',
    },
    {
        id: 'c4',
        playerId: '6',
        playerName: 'Hakim Ziyech',
        type: 'Loan',
        startDate: '2024-01-15',
        endDate: '2024-06-30',
        annualSalary: 3500000,
        status: ContractStatus.ACTIVE,
        agentId: 'agent-3',
        isVisible: false,
        notes: 'Season-long loan',
        notesAr: 'إعارة لمدة موسم كامل',
    },
    {
        id: 'c5',
        playerId: '10',
        playerName: 'Thomas Partey',
        type: 'Professional',
        startDate: '2020-10-01',
        endDate: '2024-06-30',
        annualSalary: 11200000,
        status: ContractStatus.ACTIVE,
        agentId: 'agent-1',
        isVisible: false,
        fileUrl: '/docs/sample-contract.pdf',
    },
];

// Mock Users
let mockUsers: User[] = [
    {
        id: 'user-admin-1',
        name: 'Admin User',
        email: 'admin@ashkanani-sport.com',
        role: UserRole.ADMIN,
    },
    {
        id: 'user-agent-1',
        name: 'Agent User',
        email: 'agent@example.com',
        role: UserRole.AGENT,
        assignedPlayerIds: ['1', '7', '10'],
        password: 'password123',
    },
];

// Simulated delay for realistic API feel
const delay = (ms: number = 300) => new Promise(resolve => setTimeout(resolve, ms));

// === PLAYER API ===
export const mockPlayerApi = {
    getAll: async (filters?: PlayerFilters): Promise<Player[]> => {
        await delay();
        let players = [...mockPlayers];
        if (filters) {
            players = filterPlayers(players, filters, mockContracts);
        }
        return players;
    },

    getById: async (id: string): Promise<Player | undefined> => {
        await delay();
        return mockPlayers.find(p => p.id === id);
    },

    getPublicPlayers: async (filters?: PlayerFilters, page: number = 1, pageSize: number = 8): Promise<{ players: Partial<Player>[], total: number }> => {
        await delay();
        let players = mockPlayers.filter(p => p.isVisible);
        if (filters) {
            players = filterPlayers(players, filters, mockContracts);
        }

        const total = players.length;
        const startIndex = (page - 1) * pageSize;
        const slicedPlayers = players.slice(startIndex, startIndex + pageSize);

        // Return only public-visible fields
        const publicPlayers = slicedPlayers.map(p => {
            const publicData: any = {
                id: p.id,
                name: p.name,
                nameAr: p.nameAr,
                sport: p.sport,
            };
            if (p.visibility.nationality) publicData.nationality = p.nationality;
            if (p.visibility.age) publicData.age = p.age;
            if (p.visibility.position) publicData.position = p.position;
            if (p.visibility.club) publicData.club = p.club;
            if (p.visibility.marketValue) publicData.marketValue = p.marketValue;
            if (p.visibility.preferredFoot) publicData.preferredFoot = p.preferredFoot;
            if (p.visibility.photos) publicData.photos = p.photos.filter(ph => ph.isMain);
            return publicData;
        });

        return { players: publicPlayers, total };
    },

    create: async (player: Omit<Player, 'id' | 'createdAt' | 'updatedAt'>): Promise<Player> => {
        await delay();
        const newPlayer: Player = {
            ...player,
            id: generateId(),
            nationalityAr: player.nationalityAr || translateToArabic(player.nationality, 'country'),
            clubAr: player.clubAr || translateToArabic(player.club, 'club'),
            createdAt: dayjs().toISOString(),
            updatedAt: dayjs().toISOString(),
        };
        mockPlayers.push(newPlayer);
        return newPlayer;
    },

    update: async (id: string, updates: Partial<Player>): Promise<Player | undefined> => {
        await delay();
        const index = mockPlayers.findIndex(p => p.id === id);
        if (index === -1) return undefined;
        const updatedData = { ...updates };
        if (updates.nationality && !updates.nationalityAr) {
            updatedData.nationalityAr = translateToArabic(updates.nationality, 'country');
        }
        if (updates.club && !updates.clubAr) {
            updatedData.clubAr = translateToArabic(updates.club, 'club');
        }

        mockPlayers[index] = {
            ...mockPlayers[index],
            ...updatedData,
            updatedAt: dayjs().toISOString(),
        };
        return mockPlayers[index];
    },

    delete: async (id: string): Promise<boolean> => {
        await delay();
        const index = mockPlayers.findIndex(p => p.id === id);
        if (index === -1) return false;
        mockPlayers.splice(index, 1);
        // Also delete related contracts
        mockContracts = mockContracts.filter(c => c.playerId !== id);
        return true;
    },
};

// === AGENT API ===
export const mockAgentApi = {
    getAll: async (): Promise<Agent[]> => {
        await delay();
        return [...mockAgents];
    },

    getById: async (id: string): Promise<Agent | undefined> => {
        await delay();
        return mockAgents.find(a => a.id === id);
    },

    create: async (agent: Omit<Agent, 'id' | 'createdAt'>): Promise<Agent> => {
        await delay();
        const id = generateId();
        const newAgent: Agent = {
            ...agent,
            id,
            createdAt: dayjs().toISOString(),
        };
        mockAgents.push(newAgent);

        // Also create a corresponding user for login
        mockUsers.push({
            id: `user-${id}`,
            name: agent.name,
            email: agent.email,
            role: UserRole.AGENT,
            avatar: agent.avatar,
            assignedPlayerIds: agent.assignedPlayerIds,
            password: agent.password || 'password123'
        });

        return newAgent;
    },

    update: async (id: string, updates: Partial<Agent>): Promise<Agent | undefined> => {
        await delay();
        const index = mockAgents.findIndex(a => a.id === id);
        if (index === -1) return undefined;
        mockAgents[index] = { ...mockAgents[index], ...updates };

        // Update corresponding user
        const userIndex = mockUsers.findIndex(u => u.id === `user-${id}` || u.email === mockAgents[index].email);
        if (userIndex !== -1) {
            mockUsers[userIndex] = {
                ...mockUsers[userIndex],
                name: mockAgents[index].name,
                email: mockAgents[index].email,
                avatar: mockAgents[index].avatar,
                assignedPlayerIds: mockAgents[index].assignedPlayerIds,
                password: mockAgents[index].password || mockUsers[userIndex].password
            };
        }

        return mockAgents[index];
    },

    delete: async (id: string): Promise<boolean> => {
        await delay();
        const index = mockAgents.findIndex(a => a.id === id);
        if (index === -1) return false;
        mockAgents.splice(index, 1);
        return true;
    },
};

// === CONTRACT API ===
export const mockContractApi = {
    getAll: async (): Promise<Contract[]> => {
        await delay();
        return [...mockContracts];
    },

    getByPlayerId: async (playerId: string): Promise<Contract[]> => {
        await delay();
        return mockContracts.filter(c => c.playerId === playerId);
    },

    getById: async (id: string): Promise<Contract | undefined> => {
        await delay();
        return mockContracts.find(c => c.id === id);
    },

    create: async (contract: Omit<Contract, 'id'>): Promise<Contract> => {
        await delay();
        const newContract: Contract = {
            ...contract,
            id: generateId(),
        };
        mockContracts.push(newContract);
        return newContract;
    },

    update: async (id: string, updates: Partial<Contract>): Promise<Contract | undefined> => {
        await delay();
        const index = mockContracts.findIndex(c => c.id === id);
        if (index === -1) return undefined;
        mockContracts[index] = { ...mockContracts[index], ...updates };
        return mockContracts[index];
    },

    delete: async (id: string): Promise<boolean> => {
        await delay();
        const index = mockContracts.findIndex(c => c.id === id);
        if (index === -1) return false;
        mockContracts.splice(index, 1);
        return true;
    },
};

// === DASHBOARD API ===
export const mockDashboardApi = {
    getStats: async (sport?: Sport | 'All'): Promise<DashboardStats> => {
        await delay();
        const players = sport && sport !== 'All' ? mockPlayers.filter(p => p.sport === sport) : mockPlayers;
        const playerIds = players.map(p => p.id);
        const contracts = mockContracts.filter(c => playerIds.includes(c.playerId));

        const activeContractsCount = contracts.filter(c => c.status === ContractStatus.ACTIVE).length;
        const expiringSoonCount = contracts.filter(c =>
            c.status === ContractStatus.ACTIVE && isContractExpiringSoon(c.endDate)
        ).length;
        const totalMarketValue = players.reduce((sum, p) => sum + p.marketValue, 0);

        return {
            totalPlayers: players.length,
            activeContracts: activeContractsCount,
            expiringSoon: expiringSoonCount,
            totalMarketValue,
        };
    },

    getMarketValueDistribution: async (sport?: Sport | 'All'): Promise<MarketValueDistribution[]> => {
        await delay();
        const players = sport && sport !== 'All' ? mockPlayers.filter(p => p.sport === sport) : mockPlayers;
        const ranges = [
            { min: 0, max: 10000000, label: '0-10M' },
            { min: 10000000, max: 30000000, label: '10-30M' },
            { min: 30000000, max: 50000000, label: '30-50M' },
            { min: 50000000, max: 100000000, label: '50M+' },
        ];

        return ranges.map(range => {
            const rangePlayers = players.filter(p => p.marketValue >= range.min && p.marketValue < range.max);
            return {
                range: range.label,
                count: rangePlayers.length,
                value: rangePlayers.reduce((sum, p) => sum + p.marketValue, 0),
            };
        });
    },

    getContractStatusData: async (sport?: Sport | 'All'): Promise<ContractStatusData[]> => {
        await delay();
        const players = sport && sport !== 'All' ? mockPlayers.filter(p => p.sport === sport) : mockPlayers;
        const playerIds = players.map(p => p.id);
        const contracts = mockContracts.filter(c => playerIds.includes(c.playerId));

        const statusGroups = contracts.reduce((acc, contract) => {
            const status = contract.status;
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(statusGroups).map(([status, count]) => ({
            status,
            count,
        }));
    },

    getContractExpiryTimeline: async (sport?: Sport | 'All'): Promise<ContractExpiryData[]> => {
        await delay();
        const players = sport && sport !== 'All' ? mockPlayers.filter(p => p.sport === sport) : mockPlayers;
        const playerIds = players.map(p => p.id);
        const contracts = mockContracts.filter(c => playerIds.includes(c.playerId));

        const next12Months = Array.from({ length: 12 }, (_, i) => {
            const month = dayjs().add(i, 'month');
            return {
                month: month.format('MMM YYYY'),
                count: contracts.filter(c => {
                    const expiry = dayjs(c.endDate);
                    return expiry.month() === month.month() && expiry.year() === month.year();
                }).length,
            };
        });

        return next12Months;
    },
};
