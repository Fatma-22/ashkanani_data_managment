export enum UserRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  AGENT = 'AGENT',
  MEMBER = 'PUBLIC',
  PUBLIC = 'PUBLIC'
}

export enum ProfileRole {
  PLAYER = 'PLAYER',
  COACH = 'COACH',
  ADMINISTRATOR = 'ADMINISTRATOR',
  REFEREE = 'REFEREE',
  PHOTOGRAPHER = 'PHOTOGRAPHER',
  DESIGNER = 'DESIGNER',
}

export enum MemberType {
  PLAYER = 'PLAYER',
  COACH = 'COACH',
  SCOUT = 'SCOUT',
  CLUB = 'CLUB',
  ADMINISTRATOR = 'ADMINISTRATOR',
  REFEREE = 'REFEREE',
  PHOTOGRAPHER = 'PHOTOGRAPHER',
  DESIGNER = 'DESIGNER',
  OTHER = 'OTHER'
}

export enum DesignerType {
  WEB_DESIGNER = 'WEB_DESIGNER',
  VIDEO_DESIGNER = 'VIDEO_DESIGNER',
  SOCIAL_MEDIA_DESIGNER = 'SOCIAL_MEDIA_DESIGNER',
  GRAPHIC_DESIGNER = 'GRAPHIC_DESIGNER',
  UI_UX_DESIGNER = 'UI_UX_DESIGNER',
  SOCIAL_MEDIA = 'SOCIAL_MEDIA',
  STADIUM_ANNOUNCEMENT = 'STADIUM_ANNOUNCEMENT',
  MOTION_GRAPHICS = 'MOTION_GRAPHICS',
  VIDEOGRAPHY = 'VIDEOGRAPHY',
  MATCH_POSTER = 'MATCH_POSTER',
  OTHER = 'OTHER'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  isActive?: boolean;
  assignedPlayerIds?: string[]; // For agents
  password?: string;
  permissions?: AdminPermissions; // For admins
  phone?: string;
  country?: string;
  memberType?: MemberType;
  nationalId?: string;
  organization?: string;
  createdAt?: string;
}

export enum ContractStatus {
  ACTIVE = 'ACTIVE',
  PENDING = 'PENDING',
  EXPIRED = 'EXPIRED',
  NEGOTIATION = 'NEGOTIATION'
}

export enum DealStatus {
  FREE_AGENT = 'FREE_AGENT',
  FREE_AGENT_COACH = 'FREE_AGENT_COACH',
  LOAN = 'LOAN',
  PURCHASE = 'PURCHASE',
  AMATEUR = 'AMATEUR',
  AMATEUR_COACH = 'AMATEUR_COACH',
  SIGNED = "SIGNED"
}

export type Position = string;

export enum PreferredFoot {
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
  BOTH = 'BOTH'
}

export enum Sport {
  // Team Sports
  FOOTBALL = 'Football',
  BASKETBALL = 'Basketball',
  VOLLEYBALL = 'Volleyball',
  HANDBALL = 'Handball',
  FUTSAL = 'Futsal',
  WATER_POLO = 'Water Polo',
  CRICKET = 'Cricket',
  RUGBY_UNION = 'Rugby Union',
  RUGBY_LEAGUE = 'Rugby League',
  AMERICAN_FOOTBALL = 'American Football',
  BASEBALL = 'Baseball',
  SOFTBALL = 'Softball',
  ICE_HOCKEY = 'Ice Hockey',
  FIELD_HOCKEY = 'Field Hockey',
  LACROSSE = 'Lacrosse',
  PAINTBALL = 'Paintball',
  BEACH_SOCCER = 'Beach Soccer',
  BEACH_VOLLEYBALL = 'Beach Volleyball',

  // Racket Sports
  TENNIS = 'Tennis',
  PADEL = 'Padel',
  SQUASH = 'Squash',
  TABLE_TENNIS = 'Table Tennis',
  BADMINTON = 'Badminton',

  // Combat Sports
  MMA = 'MMA',
  BOXING = 'Boxing',
  KICKBOXING = 'Kickboxing',
  MUAY_THAI = 'Muay Thai',
  JUDO = 'Judo',
  KARATE = 'Karate',
  TAEKWONDO = 'Taekwondo',
  WRESTLING = 'Wrestling',
  JIU_JITSU = 'Jiu Jitsu',
  SAMBO = 'Sambo',
  FENCING = 'Fencing',

  // Water Sports
  SWIMMING = 'Swimming',
  DIVING = 'Diving',
  ROWING = 'Rowing',
  SAILING = 'Sailing',
  SURFING = 'Surfing',
  MOTOSURF = 'Motosurf',
  JET_SKI = 'Jet Ski',

  // Motorsports
  FORMULA_1 = 'Formula 1',
  RALLY = 'Rally',
  MOTOCROSS = 'Motocross',
  KARTING = 'Karting',

  // Athletics & Gymnastics
  ATHLETICS = 'Athletics',
  POLE_VAULT = 'Pole Vault',
  GYMNASTICS = 'Gymnastics',
  TRIATHLON = 'Triathlon',
  CYCLING = 'Cycling',
  WEIGHTLIFTING = 'Weightlifting',

  // Target Sports
  SHOOTING = 'Shooting',
  ARCHERY = 'Archery',
  BOWLING = 'Bowling',
  DARTS = 'Darts',
  GOLF = 'Golf',
  BILLIARDS = 'Billiards',
  SNOOKER = 'Snooker',

  // Esports
  MOBA = 'MOBA',
  FPS = 'FPS',
  ESPORTS_STRATEGY = 'Esports Strategy',
  ESPORTS_SPORTS = 'Esports Sports',

  // Others & Traditional
  EQUESTRIAN = 'Equestrian',
  CHESS = 'Chess',
  CAMEL_RACING = 'Camel Racing',
  FALCONRY = 'Falconry',
  HORSE_RACING = 'Horse Racing',
}

export interface Contract {
  id: string;
  playerId: string;
  playerName: string;
  playerNameAr?: string;
  agentId: string;
  type: 'PROFESSIONAL' | 'YOUTH' | 'LOAN' | 'AMATEUR';
  startDate: string;
  endDate: string;
  annualSalary: number;
  signingBonus?: number;
  currency: string;
  status: ContractStatus;
  fileUrl?: string;
  notes?: string;
  notesAr?: string;
  isVisible: boolean; // Public visibility
  feesAmount?: number;
  feesType?: 'FIXED' | 'PERCENTAGE';
}

export interface PlayerPhoto {
  id: string;
  url: string;
  caption?: string;
  isMain: boolean;
}

export interface PlayerDocument {
  id: string;
  name: string;
  url: string;
  type: 'contract' | 'medical' | 'other';
  status?: ContractStatus;
  startDate?: string;
  endDate?: string;
  uploadedAt: string;
}

export interface PlayerVisibility {
  nationality: boolean;
  age: boolean;
  dateOfBirth: boolean;
  position: boolean;
  club: boolean;
  marketValue: boolean;
  preferredFoot: boolean;
  height: boolean;
  weight: boolean;
  previousClubs: boolean;
  dealStatus: boolean;
  contractInfo: boolean;
  photos: boolean;
  achievements: boolean;
  stats: boolean;
}

export enum ContractNature {
  AUTHORIZATION = 'AUTHORIZATION',
  SIGNING = 'SIGNING',
  NOT_JOINED = 'NOT_JOINED',
  TERMINATION = 'TERMINATION'
}

export interface ClubContract {
  id?: number;
  club_name?: string;
  club_name_ar?: string;
  club_country?: string;
  club_country_ar?: string;
  start_date?: string;
  end_date?: string;
  file_url?: string;
  notes?: string;
  notes_ar?: string;
}

export interface Player {
  id: string;
  role: ProfileRole; // Player or Coach
  designerType?: DesignerType | string;
  name: string;
  nameAr?: string; // Arabic name
  slug?: string;
  email?: string;
  sport: Sport;
  federation_logo?: string;
  auto_club_logo?: string;
  nationality: string;
  nationalityAr?: string;
  dateOfBirth: string | number;
  bornInKuwait?: boolean;
  internalNotes?: string;
  internalNotesAr?: string;
  age: number;
  positions: string[];
  club: string | Club;
  clubAr?: string;
  club_id?: number;
  clubLogo?: string;
  club_logo?: string;
  national_team_id?: number;
  national_team?: {
    id: number;
    name: string;
    name_ar?: string;
    logo_url?: string;
  };
  notes?: string;
  notesAr?: string;
  marketValue: number;
  preferredFoot: PreferredFoot;
  dealStatus: DealStatus;
  legalStatus?: 'PROFESSIONAL' | 'AMATEUR';
  contractStartDate?: string;
  contractEndDate?: string;
  contractDuration?: number;
  contractStatus?: ContractStatus;
  contract_fees?: number;
  contract_fees_type?: 'FIXED' | 'PERCENTAGE';
  contractFees?: number;
  contractFeesType?: 'FIXED' | 'PERCENTAGE';
  contractType?: 'PROFESSIONAL' | 'YOUTH' | 'LOAN' | 'AMATEUR';
  contractNature?: ContractNature;
  formAchievements?: string[];
  formAchievementsAr?: string[];
  formPreviousClubs?: string[];
  cvUrl?: string;
  visibility_settings?: any;
  gender?: 'MALE' | 'FEMALE';
  bio?: string;
  bioAr?: string;
  youtubeUrl?: string;
  transfermarktUrl?: string;
  volleynetUrl?: string;
  instagramUrl?: string;
  driveUrl?: string;
  volleyballStatsPdf?: string;
  volleyballRankingImage?: string;
  volleyballSpikeReach?: number; // cm
  volleyballBlockReach?: number; // cm
  strategyPdf?: string; // Confidential: visible only to Admin/Owner/Player themselves

  // Physical attributes
  height: number; // cm
  weight: number; // kg

  // Career info
  jerseyNumber?: number;

  // Agent
  agentId?: string;
  agentName?: string;
  agent?: Agent;

  // Media
  mainPhoto?: { url: string; caption?: string; id?: string };
  photos: PlayerPhoto[];
  documents: PlayerDocument[];
  contracts?: Contract[];
  clubContracts?: ClubContract[];

  // Stats
  appearances?: number;
  goals?: number;
  assists?: number;

  // Coach Stats
  matchesManaged?: number;
  careerWins?: number;
  careerDraws?: number;
  careerLosses?: number;

  // Additional info
  previousClubs?: string[];
  previousClubsAr?: string[];
  achievements?: string[];
  achievementsAr?: string[];
  current_stats?: any;
  stats?: any; // Backend often returns stats key for current_stats
  nationalId?: string; // National ID / Profile ID
  address?: string;
  phone?: string;

  // Visibility controls
  visibility: PlayerVisibility;
  shareToken?: string; // Secure sharing link token
  isVisible: boolean; // Overall public visibility toggle
  isApproved?: boolean; // For CV join directory moderation flow

  // Ratings & Badges
  rating?: number;
  fitnessRating?: number;
  speedRating?: number;
  techniqueRating?: number;
  isVerified?: boolean;
  isRisingTalent?: boolean;
  topAgentPick?: boolean;
  technicalReport?: string;
  sponsors?: Sponsor[];
  certificates?: CoachCertificate[];

  // Scout info
  scoutId?: number;
  scoutName?: string;

  createdAt: string;
  updatedAt: string;
}

export interface Agent {
  id: string;
  name: string;
  nameAr?: string;
  email: string;
  phone: string;
  company?: string;
  companyAr?: string;
  assignedPlayerIds: string[];
  avatar?: string;
  password?: string; // For creation/sync
  createdAt: string;
}

export interface Meeting {
  id: number;
  title: string;
  meeting_type?: string;
  duration?: string;
  fees?: number;
  description?: string;
  meeting_date: string; // YYYY-MM-DD
  meeting_time?: string; // HH:mm
  location?: string;
  related_person_type?: 'player' | 'coach' | 'other';
  related_person_name?: string;
  player_id?: number;
  player?: Player; // Detailed loaded player object
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  created_by?: number;
  creator?: any; // The user who created the meeting
  created_at?: string;
  updated_at?: string;
}

export interface DashboardStats {
  totalPlayers: number;
  activeContracts: number;
  expiringSoon: number; // Within 6 months
  totalMarketValue: number;
  totalDeals: number;
  dealsThisMonth: number;
  totalDealsAmount: number;
  youthPlayersCount: number;
  proPlayersCount: number;
  contractStability: number;
  topAgentConcentration: number;
  signingCount?: number;
  authorizationCount?: number;
  notJoinedCount?: number;

  // Member Stats
  totalMembers?: number;
  playersMemberCount?: number;
  coachesMemberCount?: number;
  scoutsMemberCount?: number;
  clubsMemberCount?: number;
  administratorsMemberCount?: number;
  refereesMemberCount?: number;
  photographersMemberCount?: number;
  othersMemberCount?: number;
  guestVisits?: number;
  registeredVisits?: number;
  dailyStats?: { date: string; guest: number; registered: number; registrations: number }[];
}

export interface MarketValueDistribution {
  range: string;
  count: number;
  value: number;
}

export interface ContractStatusData {
  status: string;
  count: number;
}

export interface ContractExpiryData {
  month: string;
  count: number;
}

// Search & Filter types
export interface PlayerFilters {
  search?: string;
  sport?: Sport[];
  nationality?: string[];
  positions?: string[];
  role?: ProfileRole[];
  designer_type?: DesignerType;
  ageMin?: number;
  ageMax?: number;
  marketValueMin?: number;
  marketValueMax?: number;
  dealStatus?: DealStatus[];
  legalStatus?: ('PROFESSIONAL' | 'AMATEUR')[];
  club?: string | string[];
  club_id?: number;
  preferredFoot?: PreferredFoot[];
  contractExpiryYear?: number[];
  contractStartYear?: number[];
  contractDuration?: ('1year' | 'moreThan1year')[];
  remainingDuration?: ('2months' | '6months' | '1year' | '2years' | 'moreThan2years')[];

  contractType?: ('PROFESSIONAL' | 'YOUTH' | 'LOAN' | 'AMATEUR')[];
  contractNature?: ('AUTHORIZATION' | 'SIGNING')[];
  contractStatus?: ContractStatus[];
  agentId?: string;
  start_date?: string;
  end_date?: string;
  isLocal?: boolean;
  isApproved?: boolean;
  isVisible?: boolean;
  public_view?: boolean;
  ticker?: boolean;
  hasNutrition?: boolean;
  scoutId?: string;
  staleCVs?: boolean;
  certificate_type?: string | string[];
  issuing_body?: string;
  level?: string | string[];
  source_type?: string | string[];
  certificate_name?: string;
  has_sponsorships?: boolean;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface SortParams {
  field: string;
  order: 'ascend' | 'descend';
}

// Admin Management Types
export interface AdminPermissions {
  canAddPlayers: boolean;
  canEditPlayers: boolean;
  canDeletePlayers: boolean;
  canAddAgents: boolean;
  canEditAgents: boolean;
  canDeleteAgents: boolean;
  canViewReports: boolean;
  canViewFinancials?: boolean;
  canAddDeals?: boolean;
  canEditDeals?: boolean;
  canDeleteDeals?: boolean;
  canManageNews?: boolean;
  canManageLanding?: boolean;
  canManageCVRequests?: boolean;
  canManageMeetings?: boolean;
  canManageMembers?: boolean;
  canManageSponsors?: boolean;
  canManageNutrition?: boolean;
  canManageFederations?: boolean;
  canManageClubs?: boolean;
  canManageScouts: boolean;
}

export interface Admin {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  permissions: AdminPermissions;
  isActive: boolean;
  isScout?: boolean;
  scoutedPlayersCount?: number;
  createdAt: string;
  createdBy: string; // Owner ID
  password?: string;
  user?: User;
}

// Financial Management Types
export interface FinancialRecord {
  id: string;
  type: 'income' | 'expense' | 'arrears';
  category: string;
  categoryAr?: string;
  amount: number;
  currency: string;
  description: string;
  descriptionAr?: string;
  date: string;
  related_to?: string;
  related_type?: 'player' | 'agent' | 'employee';
  created_by: string;
  createdAt: string;
}

export interface FinancialStats {
  totalIncome: number;
  totalExpense: number;
  totalArrears: number;
  netProfit: number;
  monthlyIncome: number;
  monthlyExpense: number;
  monthlyArrears: number;
  yearlyIncome: number;
  yearlyExpense: number;
  yearlyArrears: number;
  totalDeals: number;
  totalDealsAmount: number;
}

// Employee Management Types
export interface Employee {
  id: string;
  name: string;
  nameAr?: string;
  position: string;
  positionAr?: string;
  department: string;
  departmentAr?: string;
  salary: number;
  hireDate: string;
  phone?: string;
  email?: string;
  nationalId?: string;
  address?: string;
  isActive: boolean;
  contractStartDate?: string;
  contractEndDate?: string;
  contractFileUrl?: string;
  contractFile?: string;
  yearOfBirth?: number;
  nationality?: string;
  nationalityAr?: string;
  currency?: string;
  createdAt: string;
}

export interface Deal {
  id: number;
  playerId?: number;
  manualPlayerName?: string | null;
  manualPlayerNameAr?: string | null;
  manualPlayerRole?: string | null;
  manualPlayerSport?: string | null;
  fromClub: string | null;
  fromClubAr?: string | null;
  toClub: string | null;
  toClubAr?: string | null;
  dealDate: string | null;
  contractStartDate?: string | null;
  contractEndDate?: string | null;
  contractUrl?: string | null;
  gallery_image_urls?: string[] | null;
  amount: number | null;
  currency: string | null;
  type: string | null;
  notes: string | null;
  player?: Player;
  createdAt?: string;
  updatedAt?: string;
}

export interface Sponsor {
  id: number;
  name_en: string;
  name_ar: string;
  services_en?: string;
  services_ar?: string;
  logo_url: string;
  contract_url?: string;
  website_url?: string;
  type?: 'SPONSOR' | 'PARTNER';
  start_date?: string;
  end_date?: string;
  agreement_text?: string;
  agreement_text_ar?: string;
  sort_order: number;
  is_active: boolean;
  tier?: 'diamond' | 'gold' | 'silver' | 'partner' | 'legal';
  images?: SponsorImage[];
  discounts?: Discount[];
}

export interface SponsorImage {
  id: number;
  image_url: string;
  sort_order: number;
}

export interface Discount {
  id: number;
  title_en: string;
  title_ar: string;
  description_en?: string;
  description_ar?: string;
  code?: string;
  image_url?: string;
  gallery_image_urls?: string[];
  expiry_date?: string;
  is_active: boolean;
  sponsor_id?: number;
  sponsor?: {
    id: number;
    name_ar: string;
    name_en: string;
    logo_url: string;
  };
}

export interface Ad {
  id: number;
  title_en?: string;
  title_ar?: string;
  image_url: string;
  click_url?: string;
  type: 'BANNER' | 'POPUP';
  is_active: boolean;
  start_date?: string;
  end_date?: string;
}

export interface News {
  id: number;
  title_en: string;
  title_ar: string;
  content_en: string;
  content_ar: string;
  category_en?: string;
  category_ar?: string;
  main_image_url: string;
  gallery_image_urls?: string[];
  is_featured: boolean;
  is_active: boolean;
  published_at: string;
  created_at: string;
  updated_at: string;
}

export interface PlayerPhysicalReport {
  id: number;
  player_id: number;
  report_date: string;
  weight?: number;
  height?: number;
  fat_percentage?: number;
  muscle_mass?: number;
  fitness_level?: number;
  strengths?: string;
  strengths_ar?: string;
  development_points?: string;
  development_points_ar?: string;
  coach_notes?: string;
  coach_notes_ar?: string;
  health_status?: string;
  health_status_ar?: string;
  previous_injuries?: string;
  previous_injuries_ar?: string;
  target_goal?: string;
  target_goal_ar?: string;
  file_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PlayerProgressPhoto {
  id: number;
  player_id: number;
  report_id?: number;
  url: string;
  caption?: string;
  caption_ar?: string;
  photo_date: string;
  type: 'BEFORE' | 'AFTER' | 'MONTHLY' | 'OTHER';
}

export interface TrainingProgram {
  id: number;
  player_id: number;
  title_en: string;
  title_ar: string;
  description_en?: string;
  description_ar?: string;
  start_date: string;
  end_date?: string;
  schedule_json?: any;
  status: 'ACTIVE' | 'ARCHIVED';
}

export interface NutritionProgram {
  id: number;
  player_id: number;
  title_en: string;
  title_ar: string;
  daily_calories?: number;
  protein?: number;
  carbs?: number;
  fats?: number;
  meals_json?: any;
  supplements_en?: string;
  supplements_ar?: string;
  instructions_en?: string;
  instructions_ar?: string;
  status: 'ACTIVE' | 'ARCHIVED';
}

export interface Club {
  id: number;
  name: string;
  name_ar?: string;
  country?: string;
  logo_path?: string;
  logo_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Federation {
  id: number;
  sport_name: string;
  logo_path?: string;
  logo_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CoachCertificate {
  id: number;
  coach_id: number;
  certificate_name: string;
  certificate_type: string;
  issuing_body: string;
  year_obtained?: number;
  level: string;
  certificate_number?: string;
  source_type: string;
  certificate_file?: string;
  created_at?: string;
  updated_at?: string;
}

