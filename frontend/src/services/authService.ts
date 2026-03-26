import api from '@/lib/api';
import { User } from '@/types';
import { normalizeUser } from '@/lib/normalizers';

type ApiRecord = Record<string, unknown>;

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  charityId?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export const authService = {
  login: (data: LoginRequest) =>
    api.post<{ token: string; user: ApiRecord }>('/auth/login', data).then((res) => ({
      ...res,
      data: {
        token: res.data.token,
        user: normalizeUser(res.data.user),
      },
    })),

  register: (data: RegisterRequest) =>
    api.post<{ token: string; user: ApiRecord }>('/auth/register', data).then((res) => ({
      ...res,
      data: {
        token: res.data.token,
        user: normalizeUser(res.data.user),
      },
    })),

  logout: () =>
    api.post('/auth/logout'),

  getProfile: () =>
    api.get<ApiRecord>('/auth/me').then((res) => ({ ...res, data: normalizeUser(res.data) })),
};
