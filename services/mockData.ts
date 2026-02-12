import { Player, Contract, ContractStatus, UserRole, User } from '../types';

export const MOCK_USERS: User[] = [
  { id: '1', name: 'Admin User', role: UserRole.ADMIN, avatar: 'https://i.pravatar.cc/150?u=admin' },
  { id: '2', name: 'Agent Smith', role: UserRole.AGENT, avatar: 'https://i.pravatar.cc/150?u=agent' },
];

export const MOCK_PLAYERS: Player[] = [
  {
    id: 'p1',
    name: 'Kylian Mbappé',
    nationality: 'France',
    age: 25,
    position: 'Forward',
    club: 'Real Madrid',
    marketValue: 180000000,
    preferredFoot: 'Right',
    dealStatus: 'Signed',
    photoUrl: 'https://picsum.photos/400/400?random=1',
    isVisible: true,
    agentId: '2'
  },
  {
    id: 'p2',
    name: 'Erling Haaland',
    nationality: 'Norway',
    age: 24,
    position: 'Forward',
    club: 'Manchester City',
    marketValue: 180000000,
    preferredFoot: 'Left',
    dealStatus: 'Signed',
    photoUrl: 'https://picsum.photos/400/400?random=2',
    isVisible: true,
    agentId: '2'
  },
  {
    id: 'p3',
    name: 'Jude Bellingham',
    nationality: 'England',
    age: 21,
    position: 'Midfielder',
    club: 'Real Madrid',
    marketValue: 180000000,
    preferredFoot: 'Right',
    dealStatus: 'Signed',
    photoUrl: 'https://picsum.photos/400/400?random=3',
    isVisible: true
  },
  {
    id: 'p4',
    name: 'Vinicius Junior',
    nationality: 'Brazil',
    age: 24,
    position: 'Forward',
    club: 'Real Madrid',
    marketValue: 150000000,
    preferredFoot: 'Right',
    dealStatus: 'Signed',
    photoUrl: 'https://picsum.photos/400/400?random=4',
    isVisible: true
  },
  {
    id: 'p5',
    name: 'Bukayo Saka',
    nationality: 'England',
    age: 22,
    position: 'Forward',
    club: 'Arsenal',
    marketValue: 130000000,
    preferredFoot: 'Left',
    dealStatus: 'Signed',
    photoUrl: 'https://picsum.photos/400/400?random=5',
    isVisible: false // Hidden from public
  },
  {
    id: 'p6',
    name: 'Pedri',
    nationality: 'Spain',
    age: 21,
    position: 'Midfielder',
    club: 'Barcelona',
    marketValue: 80000000,
    preferredFoot: 'Right',
    dealStatus: 'Negotiation',
    photoUrl: 'https://picsum.photos/400/400?random=6',
    isVisible: true
  },
  {
    id: 'p7',
    name: 'Lamine Yamal',
    nationality: 'Spain',
    age: 17,
    position: 'Forward',
    club: 'Barcelona',
    marketValue: 90000000,
    preferredFoot: 'Left',
    dealStatus: 'Signed',
    photoUrl: 'https://picsum.photos/400/400?random=7',
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
    value: 30000000,
    status: ContractStatus.ACTIVE
  },
  {
    id: 'c2',
    playerId: 'p2',
    playerName: 'Erling Haaland',
    type: 'Professional',
    startDate: '2022-07-01',
    endDate: '2027-06-30',
    value: 25000000,
    status: ContractStatus.ACTIVE
  },
  {
    id: 'c3',
    playerId: 'p6',
    playerName: 'Pedri',
    type: 'Professional',
    startDate: '2021-07-01',
    endDate: '2024-12-30', // Expiring soon
    value: 9000000,
    status: ContractStatus.NEGOTIATION
  },
  {
    id: 'c4',
    playerId: 'p5',
    playerName: 'Bukayo Saka',
    type: 'Professional',
    startDate: '2023-05-23',
    endDate: '2027-06-30',
    value: 12000000,
    status: ContractStatus.ACTIVE
  }
];
