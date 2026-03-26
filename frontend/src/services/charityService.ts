import api from '@/lib/api';
import { Charity } from '@/types';
import { normalizeCharity } from '@/lib/normalizers';

type ApiRecord = Record<string, unknown>;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const getAllWithRetry = async () => {
  try {
    return await api.get<ApiRecord[]>('/charities');
  } catch (error) {
    // Render free instances can cold-start and time out on the first request.
    await sleep(1500);
    return api.get<ApiRecord[]>('/charities');
  }
};

export const charityService = {
  getAll: () =>
    getAllWithRetry().then((res) => ({
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
