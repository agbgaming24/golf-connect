export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  subscriptionStatus: 'active' | 'inactive' | 'cancelled' | 'past_due';
  subscriptionTier: 'basic' | 'premium' | 'elite';
  charityId?: string;
  charityPercentage: number;
  joinedAt: string;
  avatarUrl?: string;
}

export interface Score {
  id: string;
  userId: string;
  score: number;
  course: string;
  date: string;
  verified: boolean;
}

export interface Charity {
  id: string;
  name: string;
  description: string;
  category: string;
  logoUrl?: string;
  totalRaised: number;
  contributorCount: number;
}

export interface Draw {
  id: string;
  date: string;
  status: 'upcoming' | 'in_progress' | 'completed';
  mode: 'random' | 'algorithmic';
  winningNumbers: number[];
  prizePool: number;
  jackpot: number;
  participants: number;
  winners: Winner[];
}

export interface Winner {
  id: string;
  userId: string;
  userName: string;
  drawId: string;
  matchCount: 3 | 4 | 5;
  prize: number;
  verificationStatus: 'pending' | 'approved' | 'rejected';
  proofUrl?: string;
  paymentStatus: 'unpaid' | 'processing' | 'paid';
}

export interface Subscription {
  id: string;
  userId: string;
  plan: 'monthly' | 'yearly';
  status: 'active' | 'inactive' | 'past_due';
  renewalDate: string;
  charityId?: string;
  charityPercentage: number;
}

export interface DashboardStats {
  totalUsers: number;
  activeSubscriptions: number;
  totalRevenue: number;
  totalPrizesAwarded: number;
  charitiesFunded: number;
  totalDraws: number;
  jackpotPool: number;
}

export interface Payment {
  id: string;
  amount: number;
  type: 'subscription' | 'donation';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  charityId?: string;
  createdAt: string;
}
