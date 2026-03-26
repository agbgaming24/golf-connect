import { useState, useEffect } from 'react';
import {
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { paymentService } from '@/services/paymentService';

interface PaymentFormProps {
  amount: number;
  charityId?: string;
  charityName?: string;
  paymentType?: 'donation' | 'subscription';
  subscriptionPlan?: 'monthly' | 'yearly';
  onSuccess?: (paymentIntentId: string) => void;
  onError?: (error: string) => void;
}

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
};

export const PaymentForm = ({
  amount,
  charityId,
  charityName,
  paymentType,
  subscriptionPlan,
  onSuccess,
  onError,
}: PaymentFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentIntentId, setPaymentIntentId] = useState('');
  const [clientSecret, setClientSecret] = useState('');

  const baseElementStyle = {
    base: {
      fontSize: '16px',
      color: 'rgb(31, 41, 55)',
      '::placeholder': {
        color: 'rgb(107, 114, 128)',
      },
    },
    invalid: {
      color: 'rgb(239, 68, 68)',
    },
  };

  // Step 1: Create payment intent on mount
  useEffect(() => {
    const resolvedType = paymentType || (charityName ? 'donation' : 'subscription');
    const createIntent = async () => {
      try {
        const response = await paymentService.createPaymentIntent(
          amount,
          charityId,
          resolvedType,
          resolvedType === 'subscription' ? subscriptionPlan : undefined
        );
        setPaymentIntentId(String(response.data.paymentIntentId || ''));
        setClientSecret(String(response.data.clientSecret || ''));
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to create payment';
        setError(message);
        onError?.(message);
      }
    };
    createIntent();
  }, [amount, charityId, charityName, paymentType, subscriptionPlan]);

  // Step 2: Handle payment submission
  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      setError('Stripe not loaded');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const cardNumberElement = elements.getElement(CardNumberElement);

      if (!cardNumberElement) {
        throw new Error('Card element not found');
      }

      if (!clientSecret) {
        throw new Error('Payment session not ready. Please wait a moment and try again.');
      }

      // Confirm payment with card details
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: cardNumberElement,
            billing_details: { name: 'Customer' },
          },
        }
      );

      if (stripeError) {
        setError(stripeError.message || 'Payment failed');
        onError?.(stripeError.message || 'Payment failed');
        return;
      }

      if (paymentIntent?.status === 'succeeded') {
        // Step 3: Confirm payment on backend
        await paymentService.confirmPayment(paymentIntent.id);
        onSuccess?.(paymentIntent.id);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Payment processing failed';
      setError(message);
      onError?.(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.form
      onSubmit={handlePayment}
      initial="hidden"
      animate="visible"
      variants={fadeIn}
      className="space-y-4"
    >
      <div className="rounded-lg border border-border bg-card p-4 space-y-3">
        <label className="block text-sm font-medium">
          {charityName
            ? `Donate to ${charityName}`
            : subscriptionPlan
              ? `Subscription (${subscriptionPlan})`
              : 'Card Details'}
        </label>

        <div className="rounded-md border border-border bg-background px-3 py-2">
          <CardNumberElement options={{ style: baseElementStyle }} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-md border border-border bg-background px-3 py-2">
            <CardExpiryElement options={{ style: baseElementStyle }} />
          </div>
          <div className="rounded-md border border-border bg-background px-3 py-2">
            <CardCvcElement options={{ style: baseElementStyle }} />
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="bg-muted/50 rounded-lg p-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Total Amount</span>
          <span className="text-lg font-bold">£{amount.toFixed(2)}</span>
        </div>
      </div>

      <Button
        type="submit"
        disabled={loading || !stripe || !clientSecret}
        className="w-full"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : charityName ? (
          `Donate £${amount.toFixed(2)}`
        ) : subscriptionPlan ? (
          `Subscribe (${subscriptionPlan})`
        ) : (
          `Pay £${amount.toFixed(2)}`
        )}
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        Your payment information is processed securely by Stripe.
      </p>
    </motion.form>
  );
};
