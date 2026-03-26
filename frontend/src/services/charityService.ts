import api from '@/lib/api';
import { Charity } from '@/types';
import { normalizeCharity } from '@/lib/normalizers';

type ApiRecord = Record<string, unknown>;

export const charityService = {
  getAll: () =>
    api.get<ApiRecord[]>('/charities').then((res) => ({
      ...res,
      data: (res.data || []).map(normalizeCharity),
    })),

  getById: (id: string) =>
    api.get<ApiRecord>(`/charities/${id}`).then((res) => ({ ...res, data: normalizeCharity(res.data) })),

  switchCharity: (charityId: string) =>
    api.put('/users/me/charity', { charityId }),

  // Admin endpoints
  createCharityAsAdmin: (data: { name: string; description: string; category: string }) =>
    api.post('/admin/charities', data),

  updateCharityAsAdmin: (id: string, data: { name: string; description: string; category: string }) =>
    api.put(`/admin/charities/${id}`, data),

  deleteCharityAsAdmin: (id: string) =>
    api.delete(`/admin/charities/${id}`),
};
