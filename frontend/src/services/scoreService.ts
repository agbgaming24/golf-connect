import api from '@/lib/api';
import { Score } from '@/types';

type ApiRecord = Record<string, unknown>;

const normalizeScore = (score: ApiRecord): Score => ({
  id: String(score.id),
  userId: String(score.userId || score.user_id),
  score: Number(score.score),
  course: String(score.course || 'Unknown Course'),
  date: String(score.date || score.played_at || new Date().toISOString()),
  verified: Boolean(score.verified),
});

export interface CreateScoreRequest {
  score: number;
  course: string;
}

export interface UpdateScoreRequest {
  score: number;
}

export const scoreService = {
  getMyScores: () =>
    api.get<ApiRecord[]>('/scores/me').then((res) => ({
      ...res,
      data: (res.data || []).map(normalizeScore),
    })),

  createScore: (data: CreateScoreRequest) =>
    api.post<ApiRecord>('/scores', data).then((res) => ({ ...res, data: normalizeScore(res.data) })),

  updateScore: (id: string, data: UpdateScoreRequest) =>
    api.put<Score>(`/scores/${id}`, data),

  deleteScore: (id: string) =>
    api.delete(`/scores/${id}`),
};
