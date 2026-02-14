import { Player, Contract, ContractStatus, UserRole, User, Position, PreferredFoot, DealStatus } from '../types';

export const MOCK_USERS: User[] = [
  { id: '0', name: 'Owner', email: 'owner@ashkenani.com', role: UserRole.OWNER, avatar: 'https://i.pravatar.cc/150?u=owner', password: 'owner123' },
  { id: '1', name: 'Admin User', email: 'admin@ashkenani.com', role: UserRole.ADMIN, avatar: 'https://i.pravatar.cc/150?u=admin', password: 'admin123' },
  { id: '2', name: 'Agent Smith', email: 'agent@ashkenani.com', role: UserRole.AGENT, avatar: 'https://i.pravatar.cc/150?u=agent', password: 'agent123' },
];

export const MOCK_PLAYERS: Partial<Player>[] = [
  {
    id: 'p1',
    name: 'Kylian Mbappé',
    nationality: 'France',
    age: 25,
    position: Position.FORWARD,
    club: 'Real Madrid',
    marketValue: 180000000,
    preferredFoot: PreferredFoot.RIGHT,
    dealStatus: DealStatus.SIGNED,
    isVisible: true,
    agentId: '2'
  },
  {
    id: 'p2',
    name: 'Erling Haaland',
    nationality: 'Norway',
    age: 24,
    position: Position.FORWARD,
    club: 'Manchester City',
    marketValue: 180000000,
    preferredFoot: PreferredFoot.LEFT,
    dealStatus: DealStatus.SIGNED,
    isVisible: true,
    agentId: '2'
  },
  {
    id: 'p3',
    name: 'Jude Bellingham',
    nationality: 'England',
    age: 21,
    position: Position.MIDFIELDER,
    club: 'Real Madrid',
    marketValue: 180000000,
    preferredFoot: PreferredFoot.RIGHT,
    dealStatus: DealStatus.SIGNED,
    isVisible: true
  },
  {
    id: 'p4',
    name: 'Vinicius Junior',
    nationality: 'Brazil',
    age: 24,
    position: Position.FORWARD,
    club: 'Real Madrid',
    marketValue: 150000000,
    preferredFoot: PreferredFoot.RIGHT,
    dealStatus: DealStatus.SIGNED,
    isVisible: true
  },
  {
    id: 'p5',
    name: 'Bukayo Saka',
    nationality: 'England',
    age: 22,
    position: Position.FORWARD,
    club: 'Arsenal',
    marketValue: 130000000,
    preferredFoot: PreferredFoot.LEFT,
    dealStatus: DealStatus.SIGNED,
    isVisible: false // Hidden from public
  },
  {
    id: 'p6',
    name: 'Pedri',
    nationality: 'Spain',
    age: 21,
    position: Position.MIDFIELDER,
    club: 'Barcelona',
    marketValue: 80000000,
    preferredFoot: PreferredFoot.RIGHT,
    dealStatus: DealStatus.NEGOTIATION,
    isVisible: true
  },
  {
    id: 'p7',
    name: 'Lamine Yamal',
    nationality: 'Spain',
    age: 17,
    position: Position.FORWARD,
    club: 'Barcelona',
    marketValue: 90000000,
    preferredFoot: PreferredFoot.LEFT,
    dealStatus: DealStatus.SIGNED,
    isVisible: true
  }
];

export const MOCK_CONTRACTS: Contract[] = [
  {
    id: 'c1',
    playerId: 'p1',
    playerName: 'Kylian Mbappé',
    type: 'Professional',
    startDate: '2024-07-01',
    endDate: '2029-06-30',
    annualSalary: 30000000,
    agentId: '2',
    isVisible: false,
    status: ContractStatus.ACTIVE
  },
  {
    id: 'c2',
    playerId: 'p2',
    playerName: 'Erling Haaland',
    type: 'Professional',
    startDate: '2022-07-01',
    endDate: '2027-06-30',
    annualSalary: 25000000,
    agentId: '2',
    isVisible: false,
    status: ContractStatus.ACTIVE
  },
  {
    id: 'c3',
    playerId: 'p6',
    playerName: 'Pedri',
    type: 'Professional',
    startDate: '2021-07-01',
    endDate: '2024-12-30', // Expiring soon
    annualSalary: 9000000,
    agentId: '2',
    isVisible: false,
    status: ContractStatus.NEGOTIATION
  },
  {
    id: 'c4',
    playerId: 'p5',
    playerName: 'Bukayo Saka',
    type: 'Professional',
    startDate: '2023-05-23',
    endDate: '2027-06-30',
    annualSalary: 12000000,
    agentId: '2',
    isVisible: false,
    status: ContractStatus.ACTIVE
  }
];
