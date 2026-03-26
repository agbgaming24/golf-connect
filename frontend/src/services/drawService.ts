import api from '@/lib/api';
import { Draw, Winner } from '@/types';
import { normalizeDraw } from '@/lib/normalizers';

type ApiRecord = Record<string, unknown>;

export const drawService = {
  getAll: () =>
    api.get<ApiRecord[]>('/draws').then((res) => ({
      ...res,
      data: (res.data || []).map(normalizeDraw),
    })),

  getById: (id: string) =>
    api.get<ApiRecord>(`/draws/${id}`).then((res) => ({ ...res, data: normalizeDraw(res.data) })),

  getMyWinnings: () =>
    api.get<Winner[]>('/draws/me/winnings'),

  // Admin endpoints
  triggerRandomDraw: () =>
    api.post<Draw>('/admin/draws/random'),

  triggerAlgorithmicDraw: () =>
    api.post<Draw>('/admin/draws/algorithmic'),

  simulateDraw: (mode: 'random' | 'algorithmic') =>
    api.post('/admin/draws/simulate', { mode }),

  publishDrawResults: (drawId: string) =>
    api.post(`/admin/draws/${drawId}/publish`),

  approveWinner: (winnerId: string) =>
    api.put(`/admin/winners/${winnerId}/approve`),

  rejectWinner: (winnerId: string) =>
    api.put(`/admin/winners/${winnerId}/reject`),

  getAllWinnersAsAdmin: () =>
    api.get('/admin/winners'),

  verifyWinnerAsAdmin: (winnerId: string, status: 'approved' | 'rejected' | 'pending') =>
    api.put(`/admin/winners/${winnerId}/verify`, { status }),

  markWinnerPayoutCompleted: (winnerId: string) =>
    api.put(`/admin/winners/${winnerId}/payout`),

  getAdminReportsOverview: () =>
    api.get('/admin/reports/overview'),
};
