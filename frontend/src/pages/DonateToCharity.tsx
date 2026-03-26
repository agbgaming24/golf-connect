import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { PaymentForm } from '@/components/PaymentForm';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { charityService } from '@/services/charityService';
import { Charity } from '@/types';
import { Heart, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
);

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const DonateToCharity = () => {
  const { charityId } = useParams<{ charityId: string }>();
  const [charity, setCharity] = useState<Charity | null>(null);
  const [loading, setLoading] = useState(true);
  const [donationAmount, setDonationAmount] = useState(25);
  const [customAmount, setCustomAmount] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  useEffect(() => {
    if (!charityId) return;

    charityService
      .getById(charityId)
      .then((res) => {
        setCharity(res.data);
      })
      .finally(() => setLoading(false));
  }, [charityId]);

  const quickAmounts = [10, 25, 50, 100];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!charity) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Charity not found</p>
      </div>
    );
  }

  if (paymentSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="text-center max-w-md"
        >
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <Heart className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="font-display text-2xl font-bold">Thank You!</h2>
          <p className="mt-2 text-muted-foreground">
            Your donation of £{donationAmount.toFixed(2)} to {charity.name} has been processed successfully.
          </p>
          <Button onClick={() => window.location.href = '/charities'} className="mt-6">
            View All Charities
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-transparent">
      <Navbar />

      <section className="container mx-auto px-4 py-24">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="text-center mb-12"
          >
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
              <Heart className="h-10 w-10 text-primary" />
            </div>
            <h1 className="font-display text-4xl font-bold">{charity.name}</h1>
            <p className="mt-4 text-muted-foreground">{charity.description}</p>
            <p className="mt-2 text-sm text-muted-foreground">{charity.category}</p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Donation Stats */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              custom={1}
              className="space-y-6"
            >
              <div className="rounded-xl border border-border bg-card p-6 shadow-card">
                <h3 className="font-display text-lg font-semibold mb-4">
                  Support {charity.name}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Choose a donation amount or enter your own:
                </p>

                <div className="space-y-3">
                  {/* Quick Amount Buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    {quickAmounts.map((amount) => (
                      <button
                        key={amount}
                        onClick={() => {
                          setDonationAmount(amount);
                          setCustomAmount(false);
                        }}
                        className={`py-3 px-4 rounded-lg font-medium transition-all ${
                          !customAmount && donationAmount === amount
                            ? 'bg-primary text-primary-foreground'
                            : 'border border-border bg-card hover:border-primary/30'
                        }`}
                      >
                        £{amount}
                      </button>
                    ))}
                  </div>

                  {/* Custom Amount */}
                  <div>
                    <input
                      type="number"
                      min="1"
                      max="10000"
                      value={customAmount ? donationAmount : ''}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        if (val > 0) {
                          setDonationAmount(val);
                          setCustomAmount(true);
                        }
                      }}
                      placeholder="Enter custom amount"
                      className="w-full px-4 py-3 rounded-lg border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>

              {/* Charity Impact */}
              <div className="rounded-xl border border-border bg-card p-6 shadow-card">
                <h4 className="font-display font-semibold mb-4">Charity Impact</h4>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Raised</span>
                    <span className="font-bold">
                      £{charity.totalRaised.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Contributors</span>
                    <span className="font-bold">
                      {charity.contributorCount.toLocaleString()}
                    </span>
                  </div>
                  {charity.contributorCount > 0 && (
                    <div className="flex justify-between text-sm pt-2 border-t border-border">
                      <span className="text-muted-foreground">Average Donation</span>
                      <span className="font-bold">
                        £
                        {(
                          charity.totalRaised / charity.contributorCount
                        ).toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Payment Form */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              custom={2}
            >
              <div className="rounded-xl border border-border bg-card p-8 shadow-card">
                <Elements stripe={stripePromise}>
                  <PaymentForm
                    amount={donationAmount}
                    charityId={charity.id}
                    charityName={charity.name}
                    onSuccess={() => setPaymentSuccess(true)}
                    onError={(error) => {
                      console.error('Payment error:', error);
                    }}
                  />
                </Elements>

                <div className="mt-6 pt-6 border-t border-border">
                  <p className="text-xs text-center text-muted-foreground">
                    Your donation helps {charity.name} achieve its mission. Thank you for
                    making a difference!
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default DonateToCharity;
