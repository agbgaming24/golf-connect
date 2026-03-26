import api from '@/lib/api';
import { User, DashboardStats } from '@/types';
import { normalizeUser } from '@/lib/normalizers';

type ApiRecord = Record<string, unknown>;

export const userService = {
  // Admin endpoints
  getAllUsers: (search?: string) =>
    api.get<ApiRecord[]>('/admin/users', { params: { search } }).then((res) => ({
      ...res,
      data: (res.data || []).map(normalizeUser),
    })),

  updateUserProfile: (id: string, data: { name: string; email: string; role?: 'user' | 'admin' }) =>
    api.put(`/admin/users/${id}`, data),

  updateUserScoreAsAdmin: (userId: string, scoreId: string, data: { score: number; playedAt?: string }) =>
    api.put(`/admin/users/${userId}/scores/${scoreId}`, data),

  updateUserSubscriptionAsAdmin: (
    id: string,
    data: {
      plan?: 'monthly' | 'yearly';
      status?: 'active' | 'inactive' | 'past_due';
      renewalDate?: string;
      charityId?: string;
      charityPercentage?: number;
    }
  ) => api.put(`/admin/users/${id}/subscription`, data),

  getUserById: (id: string) =>
    api.get<ApiRecord>(`/admin/users/${id}`).then((res) => ({ ...res, data: normalizeUser(res.data) })),

  getDashboardStats: () =>
    api.get<DashboardStats>('/users/stats'),
};
