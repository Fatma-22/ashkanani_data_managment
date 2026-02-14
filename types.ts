

export enum UserRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  AGENT = 'AGENT',
  PUBLIC = 'PUBLIC'
}

export enum ProfileRole {
  PLAYER = 'Player',
  COACH = 'Coach'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  assignedPlayerIds?: string[]; // For agents
  password?: string; // For mock auth
}

export enum ContractStatus {
  ACTIVE = 'Active',
  PENDING = 'Pending',
  EXPIRED = 'Expired',
  NEGOTIATION = 'Negotiation'
}

export enum DealStatus {
  SIGNED = 'Signed',
  FREE_AGENT = 'Free Agent',
  TRANSFER_LISTED = 'Transfer Listed',
  NEGOTIATION = 'Negotiation'
}

export enum Position {
  GOALKEEPER = 'Goalkeeper',
  DEFENDER = 'Defender',
  MIDFIELDER = 'Midfielder',
  FORWARD = 'Forward'
}

export enum PreferredFoot {
  LEFT = 'Left',
  RIGHT = 'Right',
  BOTH = 'Both'
}

export enum Sport {
  // Team Sports
  FOOTBALL = 'Football',
  BASKETBALL = 'Basketball',
  VOLLEYBALL = 'Volleyball',
  HANDBALL = 'Handball',
  FUTSAL = 'Futsal',
  WATER_POLO = 'Water Polo',

  // Racket Sports
  TENNIS = 'Tennis',
  PADEL = 'Padel',
  SQUASH = 'Squash',
  TABLE_TENNIS = 'Table Tennis',
  BADMINTON = 'Badminton',

  // Combat Sports
  BOXING = 'Boxing',
  JUDO = 'Judo',
  KARATE = 'Karate',
  TAEKWONDO = 'Taekwondo',
  WRESTLING = 'Wrestling',
  FENCING = 'Fencing',

  // Water Sports
  SWIMMING = 'Swimming',
  DIVING = 'Diving',
  ROWING = 'Rowing',

  // Athletics & Gymnastics
  ATHLETICS = 'Athletics',
  GYMNASTICS = 'Gymnastics',

  // Target Sports
  SHOOTING = 'Shooting',
  ARCHERY = 'Archery',

  // Others
  EQUESTRIAN = 'Equestrian',
  CYCLING = 'Cycling',
  WEIGHTLIFTING = 'Weightlifting'
}

export interface Contract {
  id: string;
  playerId: string;
  playerName: string;
  playerNameAr?: string;
  agentId: string;
  type: 'Professional' | 'Youth' | 'Loan';
  startDate: string;
  endDate: string;
  annualSalary: number;
  signingBonus?: number;
  status: ContractStatus;
  fileUrl?: string;
  notes?: string;
  notesAr?: string;
  isVisible: boolean; // Public visibility
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

export interface Player {
  id: string;
  role: ProfileRole; // Player or Coach
  name: string;
  nameAr?: string; // Arabic name
  email?: string;
  sport: Sport;
  nationality: string;
  nationalityAr?: string;
  dateOfBirth: string;
  notes?: string;
  notesAr?: string;
  age: number;
  position: Position;
  club: string;
  clubAr?: string;
  clubLogo?: string;
  marketValue: number;
  preferredFoot: PreferredFoot;
  dealStatus: DealStatus;

  // Physical attributes
  height: number; // cm
  weight: number; // kg

  // Career info
  previousClubs: string[];
  jerseyNumber?: number;

  // Agent
  agentId?: string;
  agentName?: string;

  // Media
  photos: PlayerPhoto[];
  documents: PlayerDocument[];

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
  achievements?: string[];
  achievementsAr?: string[];
  bio?: string;
  bioAr?: string; // Arabic bio
  nationalId?: string; // National ID / Profile ID
  address?: string;
  phone?: string;

  // Visibility controls
  visibility: PlayerVisibility;
  isVisible: boolean; // Overall public visibility toggle

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

export interface DashboardStats {
  totalPlayers: number;
  activeContracts: number;
  expiringSoon: number; // Within 6 months
  totalMarketValue: number;
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
  position?: Position[];
  role?: ProfileRole[];
  ageMin?: number;
  ageMax?: number;
  marketValueMin?: number;
  marketValueMax?: number;
  dealStatus?: DealStatus[];
  club?: string[];
  preferredFoot?: PreferredFoot[];
  contractExpiryYear?: number[];
  contractStartYear?: number[];
  contractDuration?: ('1year' | 'moreThan1year')[];
  remainingDuration?: ('6months' | '1year' | '2years' | 'moreThan2years')[];
  contractType?: ('Professional' | 'Youth' | 'Loan')[];
  agentId?: string;
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
  canViewFinancials: boolean;
}

export interface Admin {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  permissions: AdminPermissions;
  isActive: boolean;
  createdAt: string;
  createdBy: string; // Owner ID
  password?: string; // For mock auth
}

// Financial Management Types
export interface FinancialRecord {
  id: string;
  type: 'income' | 'expense';
  category: string;
  categoryAr?: string;
  amount: number;
  currency: string;
  description: string;
  descriptionAr?: string;
  date: string;
  relatedTo?: string; // Player/Agent/Employee ID
  relatedToType?: 'player' | 'agent' | 'employee';
  createdBy: string;
  createdAt: string;
}

export interface FinancialStats {
  totalIncome: number;
  totalExpense: number;
  netProfit: number;
  monthlyIncome: number;
  monthlyExpense: number;
  yearlyIncome: number;
  yearlyExpense: number;
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
  createdAt: string;
}
