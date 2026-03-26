import { Charity, Draw, Subscription, User, Winner } from '@/types';

type ApiRecord = Record<string, unknown>;

export const normalizeRole = (value: unknown): User['role'] => {
  const role = String(value || '').trim().toLowerCase();
  return role === 'admin' ? 'admin' : 'user';
};

export const normalizeUserSubscriptionStatus = (value: unknown): User['subscriptionStatus'] => {
  const status = String(value || '').trim().toLowerCase();
  if (status === 'active' || status === 'past_due' || status === 'cancelled') {
    return status;
  }
  return 'inactive';
};

export const normalizeUserSubscriptionTier = (value: unknown): User['subscriptionTier'] => {
  const tier = String(value || '').trim().toLowerCase();

  if (tier === 'premium' || tier === 'elite' || tier === 'basic') {
    return tier;
  }

  if (tier === 'monthly') {
    return 'premium';
  }

  if (tier === 'yearly') {
    return 'elite';
  }

  return 'basic';
};

export const normalizeSubscriptionPlan = (value: unknown): Subscription['plan'] => {
  const plan = String(value || '').trim().toLowerCase();
  return plan === 'yearly' ? 'yearly' : 'monthly';
};

export const normalizeSubscriptionStatus = (value: unknown): Subscription['status'] => {
  const status = String(value || '').trim().toLowerCase();
  if (status === 'active' || status === 'past_due') {
    return status;
  }
  return 'inactive';
};

export const normalizeUser = (user: ApiRecord): User => ({
  id: String(user.id),
  name: String(user.name || ''),
  email: String(user.email || ''),
  role: normalizeRole(user.role),
  subscriptionStatus: normalizeUserSubscriptionStatus(user.subscriptionStatus ?? user.subscription_status),
  subscriptionTier: normalizeUserSubscriptionTier(user.subscriptionTier ?? user.subscription_tier),
  charityId: user.charityId || user.charity_id ? String(user.charityId || user.charity_id) : undefined,
  charityPercentage: Number(user.charityPercentage || user.charity_percentage || 0),
  joinedAt: String(user.joinedAt || user.joined_at || user.created_at || new Date().toISOString()),
  avatarUrl: user.avatarUrl ? String(user.avatarUrl) : user.avatar_url ? String(user.avatar_url) : undefined,
});

const parseWinningNumbers = (value: unknown): number[] => {
  if (Array.isArray(value)) {
    return value.map((n) => Number(n)).filter((n) => !Number.isNaN(n));
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.map((n) => Number(n)).filter((n) => !Number.isNaN(n));
      }
    } catch {
      return [];
    }
  }

  return [];
};

const normalizeDrawStatus = (value: unknown): Draw['status'] => {
  const status = String(value || '').trim().toLowerCase();
  if (status === 'upcoming' || status === 'in_progress') {
    return status;
  }
  return 'completed';
};

const normalizeDrawMode = (value: unknown): Draw['mode'] => {
  const mode = String(value || '').trim().toLowerCase();
  return mode === 'algorithmic' ? 'algorithmic' : 'random';
};

const normalizeWinnerVerificationStatus = (value: unknown): Winner['verificationStatus'] => {
  const status = String(value || '').trim().toLowerCase();
  if (status === 'approved' || status === 'rejected') {
    return status;
  }
  return 'pending';
};

const normalizeWinnerPaymentStatus = (value: unknown): Winner['paymentStatus'] => {
  const status = String(value || '').trim().toLowerCase();
  if (status === 'paid' || status === 'processing') {
    return status;
  }
  return 'unpaid';
};

const normalizeMatchCount = (value: unknown): Winner['matchCount'] => {
  const parsed = Number(value);
  if (parsed === 4 || parsed === 5) {
    return parsed;
  }
  return 3;
};

export const normalizeWinner = (winner: ApiRecord): Winner => ({
  id: String(winner.id),
  userId: String(winner.userId || winner.user_id || ''),
  userName: String(winner.userName || winner.user_name || 'Unknown'),
  drawId: String(winner.drawId || winner.draw_id || ''),
  matchCount: normalizeMatchCount(winner.matchCount ?? winner.match_count),
  prize: Number(winner.prize || 0),
  verificationStatus: normalizeWinnerVerificationStatus(winner.verificationStatus ?? winner.verification_status),
  proofUrl: winner.proofUrl ? String(winner.proofUrl) : winner.proof_url ? String(winner.proof_url) : undefined,
  paymentStatus: normalizeWinnerPaymentStatus(winner.paymentStatus ?? winner.payment_status),
});

export const normalizeDraw = (draw: ApiRecord): Draw => ({
  id: String(draw.id),
  date: draw.date ? new Date(String(draw.date)).toLocaleDateString() : 'TBD',
  status: normalizeDrawStatus(draw.status),
  mode: normalizeDrawMode(draw.mode),
  winningNumbers: parseWinningNumbers(draw.winningNumbers ?? draw.winning_numbers),
  prizePool: Number(draw.prizePool || draw.prize_pool || 0),
  jackpot: Number(draw.jackpot || draw.prize_pool || 0),
  participants: Number(draw.participants || 0),
  winners: Array.isArray(draw.winners) ? draw.winners.map((winner) => normalizeWinner(winner as ApiRecord)) : [],
});

export const normalizeCharity = (charity: ApiRecord): Charity => ({
  id: String(charity.id),
  name: String(charity.name || ''),
  description: String(charity.description || ''),
  category: String(charity.category || ''),
  logoUrl: charity.logoUrl ? String(charity.logoUrl) : charity.logo_url ? String(charity.logo_url) : undefined,
  totalRaised: Number(charity.totalRaised || charity.total_raised || 0),
  contributorCount: Number(charity.contributorCount || charity.contributor_count || 0),
});