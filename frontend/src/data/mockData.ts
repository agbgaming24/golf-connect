import { User, Score, Charity, Draw, Winner, DashboardStats } from '@/types';

export const mockUser: User = {
  id: '1',
  name: 'James Mitchell',
  email: 'james@example.com',
  role: 'user',
  subscriptionStatus: 'active',
  subscriptionTier: 'premium',
  charityId: '1',
  charityPercentage: 10,
  joinedAt: '2024-08-15',
};

export const mockAdmin: User = {
  id: '99',
  name: 'Admin User',
  email: 'admin@golfcharity.com',
  role: 'admin',
  subscriptionStatus: 'active',
  subscriptionTier: 'elite',
  charityPercentage: 0,
  joinedAt: '2024-01-01',
};

export const mockScores: Score[] = [
  { id: '1', userId: '1', score: 72, course: 'St Andrews', date: '2026-03-20', verified: true },
  { id: '2', userId: '1', score: 68, course: 'Pebble Beach', date: '2026-03-15', verified: true },
  { id: '3', userId: '1', score: 75, course: 'Augusta National', date: '2026-03-10', verified: false },
  { id: '4', userId: '1', score: 70, course: 'Royal Portrush', date: '2026-03-05', verified: true },
  { id: '5', userId: '1', score: 73, course: 'Carnoustie', date: '2026-02-28', verified: true },
];

export const mockCharities: Charity[] = [
  { id: '1', name: 'Youth Golf Foundation', description: 'Bringing golf to underserved communities and youth programs.', category: 'Youth & Education', totalRaised: 245000, contributorCount: 1850 },
  { id: '2', name: 'Green Fairways Initiative', description: 'Environmental conservation and sustainable golf course management.', category: 'Environment', totalRaised: 189000, contributorCount: 1200 },
  { id: '3', name: 'Veterans on the Green', description: 'Golf therapy and community for military veterans.', category: 'Veterans', totalRaised: 312000, contributorCount: 2100 },
  { id: '4', name: 'First Tee Program', description: 'Teaching life skills through golf to young people worldwide.', category: 'Youth & Education', totalRaised: 425000, contributorCount: 3400 },
  { id: '5', name: 'Accessible Golf Alliance', description: 'Making golf accessible for people with disabilities.', category: 'Accessibility', totalRaised: 156000, contributorCount: 980 },
];

export const mockDraws: Draw[] = [
  {
    id: '1', date: '2026-03-28', status: 'upcoming', mode: 'random',
    winningNumbers: [], prizePool: 50000, jackpot: 125000, participants: 4200, winners: [],
  },
  {
    id: '2', date: '2026-03-21', status: 'completed', mode: 'algorithmic',
    winningNumbers: [3, 12, 27, 35, 42], prizePool: 48000, jackpot: 100000, participants: 4100,
    winners: [
      { id: 'w1', userId: '1', userName: 'James Mitchell', drawId: '2', matchCount: 3, prize: 500, verificationStatus: 'approved', paymentStatus: 'paid' },
      { id: 'w2', userId: '5', userName: 'Sarah Chen', drawId: '2', matchCount: 4, prize: 5000, verificationStatus: 'pending', paymentStatus: 'unpaid' },
    ],
  },
  {
    id: '3', date: '2026-03-14', status: 'completed', mode: 'random',
    winningNumbers: [7, 19, 23, 31, 48], prizePool: 45000, jackpot: 75000, participants: 3900,
    winners: [
      { id: 'w3', userId: '12', userName: 'Tom Walker', drawId: '3', matchCount: 5, prize: 75000, verificationStatus: 'approved', paymentStatus: 'processing' },
    ],
  },
];

export const mockDashboardStats: DashboardStats = {
  totalUsers: 4500,
  activeSubscriptions: 4200,
  totalRevenue: 892000,
  totalPrizesAwarded: 625000,
  charitiesFunded: 267000,
  totalDraws: 52,
  jackpotPool: 125000,
};

export const mockAllUsers: User[] = [
  mockUser,
  { id: '2', name: 'Sarah Chen', email: 'sarah@example.com', role: 'user', subscriptionStatus: 'active', subscriptionTier: 'elite', charityId: '3', charityPercentage: 15, joinedAt: '2024-09-01' },
  { id: '3', name: 'Michael Brown', email: 'michael@example.com', role: 'user', subscriptionStatus: 'past_due', subscriptionTier: 'basic', charityId: '2', charityPercentage: 5, joinedAt: '2024-10-15' },
  { id: '4', name: 'Emily Davis', email: 'emily@example.com', role: 'user', subscriptionStatus: 'active', subscriptionTier: 'premium', charityId: '4', charityPercentage: 10, joinedAt: '2024-07-20' },
  { id: '5', name: 'Tom Walker', email: 'tom@example.com', role: 'user', subscriptionStatus: 'cancelled', subscriptionTier: 'basic', charityPercentage: 0, joinedAt: '2025-01-10' },
];
