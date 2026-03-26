const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const sql = require('../config/db');
const paymentModel = require('../models/payment.model');

const SUBSCRIPTION_PRICING = {
  monthly: 9.99,
  yearly: 99.99,
};

const getRenewalDate = (plan) => {
  const now = new Date();
  if (plan === 'yearly') {
    now.setFullYear(now.getFullYear() + 1);
  } else {
    now.setMonth(now.getMonth() + 1);
  }
  return now.toISOString().slice(0, 10);
};

const getLatestSubscription = async (userId) => {
  const rows = await sql`
    SELECT id, user_id, plan, status, renewal_date, charity_id, charity_percentage
    FROM subscriptions
    WHERE user_id = ${userId}
    ORDER BY id DESC
    LIMIT 1`;
  return rows[0] || null;
};

const hasPendingSubscriptionPayment = async (userId) => {
  const rows = await sql`
    SELECT id
    FROM payments
    WHERE user_id = ${userId} AND type = 'subscription' AND status = 'pending'
    ORDER BY id DESC
    LIMIT 1`;
  return rows.length > 0;
};

const upsertSubscriptionAfterPayment = async ({ userId, plan }) => {
  const renewalDate = getRenewalDate(plan);

  const latest = await sql`
    SELECT id, charity_id, charity_percentage FROM subscriptions
    WHERE user_id = ${userId} ORDER BY id DESC LIMIT 1`;

  const charityId = latest[0]?.charity_id || null;
  const charityPercentage = Number(latest[0]?.charity_percentage || 0);

  if (latest.length > 0) {
    await sql`
      UPDATE subscriptions
      SET plan = ${plan}, status = 'active', renewal_date = ${renewalDate},
          charity_id = ${charityId}, charity_percentage = ${charityPercentage}
      WHERE id = ${latest[0].id}`;
    return;
  }

  await sql`
    INSERT INTO subscriptions (user_id, plan, status, renewal_date, charity_id, charity_percentage)
    VALUES (${userId}, ${plan}, 'active', ${renewalDate}, ${charityId}, ${charityPercentage})`;
};

exports.createPaymentIntent = async (req, res) => {
  try {
    const { amount, charityId, type, plan } = req.body;
    const userId = req.user?.id;

    const paymentType = type || 'subscription';

    let finalAmount = Number(amount || 0);
    let subscriptionPlan = plan;

    if (paymentType === 'subscription') {
      subscriptionPlan = plan || 'monthly';
      if (!['monthly', 'yearly'].includes(subscriptionPlan)) {
        return res.status(400).json({ error: 'Invalid subscription plan' });
      }

      const latestSubscription = await getLatestSubscription(userId);
      if (latestSubscription?.status === 'active' && latestSubscription?.plan === subscriptionPlan) {
        return res.status(409).json({
          error: `You already have an active ${subscriptionPlan} subscription`,
        });
      }

      const pendingExists = await hasPendingSubscriptionPayment(userId);
      if (pendingExists) {
        return res.status(409).json({
          error: 'You already have a pending subscription payment. Complete it first.',
        });
      }

      finalAmount = SUBSCRIPTION_PRICING[subscriptionPlan];
    }

    if (!finalAmount || finalAmount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(finalAmount * 100),
      currency: 'gbp',
      metadata: {
        userId,
        charityId: charityId || 'none',
        type: paymentType,
        plan: subscriptionPlan || '',
      },
    });

    await paymentModel.createPayment({
      user_id: userId,
      amount: finalAmount,
      type: paymentType,
      status: 'pending',
      stripe_payment_id: paymentIntent.id,
      charity_id: charityId,
    });

    res.json({
      data: {
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        amount: finalAmount,
        currency: 'gbp',
        plan: subscriptionPlan || undefined,
      },
    });
  } catch (error) {
    console.error('Payment intent error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.confirmPayment = async (req, res) => {
  try {
    const { paymentIntentId } = req.body;
    const userId = req.user?.id;

    if (!paymentIntentId) {
      return res.status(400).json({ error: 'Payment intent ID required' });
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ error: 'Payment not successful' });
    }

    await paymentModel.markCompleted({ userId, stripePaymentId: paymentIntentId });

    if (paymentIntent.metadata.type === 'subscription') {
      const plan = ['monthly', 'yearly'].includes(paymentIntent.metadata.plan)
        ? paymentIntent.metadata.plan
        : 'monthly';
      await upsertSubscriptionAfterPayment({ userId, plan });
    }

    if (paymentIntent.metadata.charityId && paymentIntent.metadata.charityId !== 'none') {
      const amount = paymentIntent.amount / 100;
      await sql`
        UPDATE charities
        SET total_raised = total_raised + ${amount}, contributor_count = contributor_count + 1
        WHERE id = ${paymentIntent.metadata.charityId}`;
    }

    res.json({
      data: {
        status: 'success',
        message: 'Payment confirmed and processed',
        amount: paymentIntent.amount / 100,
      },
    });
  } catch (error) {
    console.error('Payment confirmation error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getMySubscription = async (req, res) => {
  try {
    const userId = req.user?.id;

    const s = await getLatestSubscription(userId);
    if (!s) {
      return res.json({ data: null });
    }

    res.json({
      data: {
        id: s.id,
        userId: s.user_id,
        plan: s.plan,
        status: s.status,
        renewalDate: s.renewal_date,
        charityId: s.charity_id,
        charityPercentage: Number(s.charity_percentage || 0),
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.pauseSubscription = async (req, res) => {
  try {
    const userId = req.user?.id;
    const latest = await getLatestSubscription(userId);

    if (!latest) {
      return res.status(404).json({ error: 'No subscription found' });
    }

    await sql`UPDATE subscriptions SET status = 'inactive' WHERE id = ${latest.id}`;
    res.json({ message: 'Subscription paused' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.cancelSubscription = async (req, res) => {
  try {
    const userId = req.user?.id;
    const latest = await getLatestSubscription(userId);

    if (!latest) {
      return res.status(404).json({ error: 'No subscription found' });
    }

    await sql`
      UPDATE subscriptions
      SET status = 'inactive', renewal_date = ${new Date().toISOString().slice(0, 10)}
      WHERE id = ${latest.id}`;
    res.json({ message: 'Subscription cancelled' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.resumeSubscription = async (req, res) => {
  try {
    const userId = req.user?.id;
    const latest = await getLatestSubscription(userId);

    if (!latest) {
      return res.status(404).json({ error: 'No subscription found' });
    }

    const plan = ['monthly', 'yearly'].includes(latest.plan) ? latest.plan : 'monthly';
    await sql`
      UPDATE subscriptions
      SET status = 'active', renewal_date = ${getRenewalDate(plan)}
      WHERE id = ${latest.id}`;
    res.json({ message: 'Subscription resumed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
exports.getPaymentHistory = async (req, res) => {
  try {
    const userId = req.user?.id;

    const payments = await paymentModel.getUserPayments(userId);

    res.json({
      data: payments.map((p) => ({
        id: p.id,
        amount: p.amount,
        type: p.type,
        status: p.status,
        charityId: p.charity_id,
        createdAt: p.created_at,
      })),
    });
  } catch (error) {
    console.error('Error fetching payment history:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  try {
    const event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);

    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        // Payment already handled in confirmPayment route
        console.log('Payment succeeded:', paymentIntent.id);
        break;

      case 'payment_intent.payment_failed': {
        const failedIntent = event.data.object;
        const updated = await paymentModel.markStatusByStripeIdIfSupported({
          stripePaymentId: failedIntent.id,
          status: 'failed',
        });
        if (!updated) {
          console.log('Payment failed event received; stripe_payment_id column missing, status update skipped');
        }
        console.log('Payment failed:', failedIntent.id);
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object;
        const updated = await paymentModel.markStatusByStripeIdIfSupported({
          stripePaymentId: charge.payment_intent,
          status: 'refunded',
        });
        if (!updated) {
          console.log('Refund event received; stripe_payment_id column missing, status update skipped');
        }
        console.log('Charge refunded:', charge.id);
        break;
      }

      default:
        console.log('Unhandled event type:', event.type);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({ error: error.message });
  }
};

exports.getPublishableKey = async (req, res) => {
  res.json({
    data: {
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    },
  });
};
