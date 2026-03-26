import api from '@/lib/api';
import { Payment } from '@/types';
import { normalizeSubscriptionPlan, normalizeSubscriptionStatus } from '@/lib/normalizers';

type ApiRecord = Record<string, unknown>;

const normalizePaymentType = (value: unknown): Payment['type'] => {
  const type = String(value || '').trim().toLowerCase();
  return type === 'donation' ? 'donation' : 'subscription';
};

const normalizePaymentStatus = (value: unknown): Payment['status'] => {
  const status = String(value || '').trim().toLowerCase();
  if (status === 'completed' || status === 'failed' || status === 'refunded') {
    return status;
  }
  return 'pending';
};

const normalizePayment = (payment: ApiRecord): Payment => ({
  id: String(payment.id),
  amount: Number(payment.amount || 0),
  type: normalizePaymentType(payment.type),
  status: normalizePaymentStatus(payment.status),
  charityId: payment.charityId || payment.charity_id ? String(payment.charityId || payment.charity_id) : undefined,
  createdAt: String(payment.createdAt || payment.created_at || new Date().toISOString()),
});

export const paymentService = {
  // Get Stripe publishable key
  getStripeConfig: () =>
    api
      .get<ApiRecord>('/payments/config')
      .then((res) => res.data)
      .catch(() => ({ publishableKey: '' })),

  // Create payment intent
  createPaymentIntent: (amount: number, charityId?: string, type?: string, plan?: 'monthly' | 'yearly') =>
    api.post<ApiRecord>('/payments/create-intent', {
      amount,
      charityId,
      type: type || 'subscription',
      plan,
    }),

  createSubscriptionIntent: (plan: 'monthly' | 'yearly') =>
    api.post<ApiRecord>('/payments/create-intent', {
      type: 'subscription',
      plan,
    }),

  // Confirm payment after client processes it
  confirmPayment: (paymentIntentId: string) =>
    api.post<ApiRecord>('/payments/confirm', {
      paymentIntentId,
    }),

  getMySubscription: () =>
    api.get<ApiRecord | null>('/payments/subscription/me').then((res) => {
      if (!res.data) {
        return { ...res, data: null };
      }
      return {
        ...res,
        data: {
          id: String(res.data.id),
          userId: String(res.data.userId),
          plan: normalizeSubscriptionPlan(res.data.plan),
          status: normalizeSubscriptionStatus(res.data.status),
          renewalDate: String(res.data.renewalDate),
          charityId: res.data.charityId ? String(res.data.charityId) : undefined,
          charityPercentage: Number(res.data.charityPercentage || 0),
        },
      };
    }),

  pauseSubscription: () =>
    api.post('/payments/subscription/pause'),

  cancelSubscription: () =>
    api.post('/payments/subscription/cancel'),

  resumeSubscription: () =>
    api.post('/payments/subscription/resume'),

  // Get payment history
  getPaymentHistory: () =>
    api.get<ApiRecord[]>('/payments/history').then((res) => ({
      ...res,
      data: (res.data || []).map(normalizePayment),
    })),
};
