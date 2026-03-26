import api from '@/lib/api';
import { DashboardStats } from '@/types';

type ApiRecord = Record<string, unknown>;

const normalizeStats = (stats: ApiRecord): DashboardStats => ({
  totalUsers: Number(stats.totalUsers || 0),
  activeSubscriptions: Number(stats.activeSubscriptions || 0),
  totalRevenue: Number(stats.totalRevenue || 0),
  totalPrizesAwarded: Number(stats.totalPrizesAwarded || 0),
  charitiesFunded: Number(stats.charitiesFunded || 0),
  totalDraws: Number(stats.totalDraws || 0),
  jackpotPool: Number(stats.jackpotPool || 0),
});

export const statsService = {
  getPublicStats: () =>
    api
      .get<ApiRecord>('/users/stats')
      .then((res) => ({ ...res, data: normalizeStats(res.data) }))
      .catch(() => ({
        data: {
          totalUsers: 0,
          activeSubscriptions: 0,
          totalRevenue: 0,
          totalPrizesAwarded: 0,
          charitiesFunded: 0,
          totalDraws: 0,
          jackpotPool: 0,
        },
      })),
};
