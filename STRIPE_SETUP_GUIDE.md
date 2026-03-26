# Stripe Integration Setup Guide

## 1. Get Stripe API Keys

1. Go to https://dashboard.stripe.com/
2. Sign up or log in to your Stripe account
3. Go to **Developers > API Keys**
4. You'll see two keys:
   - **Publishable Key** (starts with `pk_`)
   - **Secret Key** (starts with `sk_`)

## 2. Set Environment Variables

### Backend (.env)
Create or update `.env` in the `backend/` directory:

```env
# Existing variables
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=golfgive

# Stripe variables
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_test_webhook_secret_here
```

### Frontend (.env.local)
Create or update `.env.local` in the `frontend/` directory:

```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
VITE_API_BASE_URL=http://localhost:5000/api
```

## 3. Database Schema Updates

You need to update your payments table to support Stripe fields. Run this SQL:

```sql
ALTER TABLE payments ADD COLUMN stripe_payment_id VARCHAR(255) UNIQUE;
ALTER TABLE payments ADD COLUMN charity_id INT;
ALTER TABLE payments ADD COLUMN completed_at TIMESTAMP NULL;
ALTER TABLE payments ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE payments ADD FOREIGN KEY (charity_id) REFERENCES charities(id);
```

## 4. Using Payment in Your App

### Option A: Charity Donation Page

Create a charity donation page that lets users donate to specific charities:

```tsx
import { useEffect, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { PaymentForm } from '@/components/PaymentForm';
import { charityService } from '@/services/charityService';
import { Charity } from '@/types';

const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
);

export const DonateToCharity = ({ charityId }: { charityId: string }) => {
  const [charity, setCharity] = useState<Charity | null>(null);
  const [donationAmount, setDonationAmount] = useState(25);

  useEffect(() => {
    charityService.getById(charityId).then((res) => {
      setCharity(res.data);
    });
  }, [charityId]);

  const handlePaymentSuccess = (paymentIntentId: string) => {
    alert(`Donation successful! Payment ID: ${paymentIntentId}`);
    // Update charity stats, redirect, etc.
  };

  if (!charity) return <div>Loading...</div>;

  return (
    <Elements stripe={stripePromise}>
      <div className="max-w-md mx-auto">
        <h2>Donate to {charity.name}</h2>
        <p>{charity.description}</p>
        
        <input
          type="number"
          value={donationAmount}
          onChange={(e) => setDonationAmount(Number(e.target.value))}
          placeholder="Amount (£)"
        />

        <PaymentForm
          amount={donationAmount}
          charityId={charity.id}
          charityName={charity.name}
          onSuccess={handlePaymentSuccess}
        />
      </div>
    </Elements>
  );
};
```

### Option B: Subscription Payment Component

Update your subscription signup flow:

```tsx
import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { PaymentForm } from '@/components/PaymentForm';

const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
);

const SubscriptionPlans = {
  basic: { name: 'Basic', price: 9.99 },
  premium: { name: 'Premium', price: 19.99 },
  elite: { name: 'Elite', price: 49.99 },
};

export const SubscriptionPayment = () => {
  const [selectedPlan, setSelectedPlan] = useState<'basic' | 'premium' | 'elite'>('premium');

  const handlePaymentSuccess = (paymentIntentId: string) => {
    console.log('Subscription payment successful:', paymentIntentId);
    // Create subscription in your system
    // Redirect to dashboard
  };

  return (
    <Elements stripe={stripePromise}>
      <div className="max-w-2xl mx-auto">
        <div className="grid grid-cols-3 gap-4 mb-8">
          {Object.entries(SubscriptionPlans).map(([key, plan]) => (
            <button
              key={key}
              onClick={() => setSelectedPlan(key as 'basic' | 'premium' | 'elite')}
              className={`p-4 border rounded-lg ${
                selectedPlan === key ? 'border-primary bg-primary/10' : 'border-border'
              }`}
            >
              <h3>{plan.name}</h3>
              <p className="text-2xl font-bold">£{plan.price}</p>
            </button>
          ))}
        </div>

        <PaymentForm
          amount={SubscriptionPlans[selectedPlan].price}
          onSuccess={handlePaymentSuccess}
        />
      </div>
    </Elements>
  );
};
```

## 5. Testing Stripe

### Test Card Numbers

Use these card numbers in test mode (no real charges):

- **Success**: 4242 4242 4242 4242
- **Declined**: 4000 0000 0000 0002
- **Requires Auth**: 4000 0025 0000 3155

Use any future expiry date and any 3-digit CVC.

### Test Webhook

For local development, use [Stripe CLI](https://stripe.com/docs/stripe-cli) to forward webhooks:

```bash
stripe listen --forward-to localhost:5000/api/payments/webhook
```

This gives you a webhook secret to add to `.env`.

## 6. Production Deployment

### Before Going Live:

1. Switch to **Live Keys** in Stripe dashboard (not test keys)
2. Update `.env` files with live keys:
   ```env
   STRIPE_SECRET_KEY=sk_live_your_live_secret_key
   STRIPE_PUBLISHABLE_KEY=pk_live_your_live_publishable_key
   ```

3. Add webhook endpoint in Stripe dashboard:
   - Go to **Developers > Webhooks**
   - Add endpoint: `https://yourdomain.com/api/payments/webhook`
   - Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`

4. Update webhook secret:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_live_your_webhook_secret
   ```

5. Ensure HTTPS is enabled on your domain
6. Test a real transaction with small amount
7. Review Stripe's compliance requirements for your jurisdiction

## 7. API Endpoints

Your app now has these payment endpoints:

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/payments/create-intent` | ✅ | Create payment intent |
| POST | `/api/payments/confirm` | ✅ | Confirm payment |
| GET | `/api/payments/history` | ✅ | Get user's payment history |
| GET | `/api/payments/config` | ❌ | Get Stripe public key |
| POST | `/api/payments/webhook` | ❌ | Stripe webhook handler |

## 8. Charity Donation Flow

1. User views charity details
2. User enters donation amount
3. Frontend creates Stripe PaymentIntent via POST `/api/payments/create-intent`
4. User fills card details in PaymentForm
5. Frontend confirms payment with Stripe
6. Backend confirms payment via POST `/api/payments/confirm`
7. Backend updates `charities.total_raised` and `charities.contributor_count`
8. Payment record stored in `payments` table

## 9. Troubleshooting

**"Stripe not loaded"**
- Check `VITE_STRIPE_PUBLISHABLE_KEY` is set
- Verify the key starts with `pk_`

**"Payment failed"**
- Check if using correct test cards
- Verify backend can reach Stripe API

**Webhook not working**
- Verify `STRIPE_WEBHOOK_SECRET` matches Stripe dashboard
- Check request body type is raw/binary (not JSON)

**Charity totals not updating**
- Verify database schema changes applied
- Check `confirmPayment` endpoint is called
- Review backend logs

## Next Steps

1. Set up test Stripe account
2. Add environment variables
3. Update database schema
4. Create donation page component
5. Test with Stripe test cards
6. Deploy to production when ready
