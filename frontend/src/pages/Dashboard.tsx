import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { scoreService } from '@/services/scoreService';
import { charityService } from '@/services/charityService';
import { drawService } from '@/services/drawService';
import { paymentService } from '@/services/paymentService';
import { PaymentForm } from '@/components/PaymentForm';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Trophy, TrendingUp, Heart, Calendar, CreditCard, Plus, Edit2, Check, X,
  Star, Clock, CircleDollarSign, Target, Loader2
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Navigate, useLocation } from 'react-router-dom';
import { Score, Charity, Draw, Payment } from '@/types';
import { toast } from 'sonner';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const fadeIn = { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

const StatCard = ({ icon: Icon, label, value, accent }: { icon: LucideIcon; label: string; value: string; accent?: boolean }) => (
  <div className={`rounded-xl border border-border p-5 shadow-card ${accent ? 'bg-primary/5 border-primary/20' : 'bg-card'}`}>
    <div className="flex items-center gap-3">
      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${accent ? 'bg-primary/20' : 'bg-muted'}`}>
        <Icon className={`h-5 w-5 ${accent ? 'text-primary' : 'text-muted-foreground'}`} />
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="font-display text-xl font-bold">{value}</p>
      </div>
    </div>
  </div>
);

const Dashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const isAdmin = String(user?.role || '').trim().toLowerCase() === 'admin';
  const location = useLocation();
  const [scores, setScores] = useState<Score[]>([]);
  const [charities, setCharities] = useState<Charity[]>([]);
  const [draws, setDraws] = useState<Draw[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editScore, setEditScore] = useState('');
  const [showAddScore, setShowAddScore] = useState(false);
  const [newScore, setNewScore] = useState({ score: '', course: '' });
  const [activeTab, setActiveTab] = useState<'overview' | 'scores' | 'draws' | 'payments' | 'charity'>('overview');
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');
  const [showSubscriptionCheckout, setShowSubscriptionCheckout] = useState(false);
  const [subscription, setSubscription] = useState<{
    id: string;
    userId: string;
    plan: 'monthly' | 'yearly';
    status: 'active' | 'inactive' | 'past_due';
    renewalDate: string;
    charityId?: string;
    charityPercentage: number;
  } | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    setLoading(true);
    Promise.all([
      scoreService.getMyScores(),
      charityService.getAll(),
      drawService.getAll(),
      paymentService.getPaymentHistory(),
      paymentService.getMySubscription(),
    ])
      .then(([scoresRes, charitiesRes, drawsRes, paymentsRes, subscriptionRes]) => {
        setScores(scoresRes.data);
        setCharities(charitiesRes.data);
        setDraws(drawsRes.data);
        setPayments(paymentsRes.data);
        setSubscription(subscriptionRes.data);
      })
      .catch(() => toast.error('Failed to load dashboard data'))
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  useEffect(() => {
    const state = location.state as { tab?: string; openAddScore?: boolean } | null;
    if (!state) {
      return;
    }

    if (state.tab === 'scores') {
      setActiveTab('scores');
    }

    if (state.openAddScore) {
      setShowAddScore(true);
    }
  }, [location.state]);

  if (!isAuthenticated) return <Navigate to="/login" />;
  if (isAdmin) return <Navigate to="/admin" replace />;

  const userCharity = charities.find((c) => c.id === user?.charityId);
  const avgScore = scores.length ? (scores.reduce((a, s) => a + s.score, 0) / scores.length).toFixed(1) : '—';
  const userWinnings = draws.flatMap((d) => d.winners).filter((w) => w.userId === user?.id);
  const totalWinnings = userWinnings.reduce((a, w) => a + w.prize, 0);
  const nextDraw = draws.find((d) => d.status === 'upcoming');
  const sameActivePlanSelected = subscription?.status === 'active' && subscription?.plan === selectedPlan;

  const handleAddScore = async () => {
    if (!newScore.score || !newScore.course) return;
    try {
      const res = await scoreService.createScore({
        score: parseInt(newScore.score),
        course: newScore.course,
      });
      setScores((prev) => [res.data, ...prev].slice(0, 5));
      setNewScore({ score: '', course: '' });
      setShowAddScore(false);
      toast.success('Score added!');
    } catch {
      toast.error('Failed to add score');
    }
  };

  const handleEditSave = async (id: string) => {
    try {
      await scoreService.updateScore(id, { score: parseInt(editScore) });
      setScores(scores.map((s) => (s.id === id ? { ...s, score: parseInt(editScore) } : s)));
      setEditingId(null);
      toast.success('Score updated!');
    } catch {
      toast.error('Failed to update score');
    }
  };

  const handleSwitchCharity = async (charityId: string) => {
    try {
      await charityService.switchCharity(charityId);
      toast.success('Charity switched!');
    } catch {
      toast.error('Failed to switch charity');
    }
  };

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: Target },
    { id: 'scores' as const, label: 'Scores', icon: TrendingUp },
    { id: 'draws' as const, label: 'Draws', icon: Trophy },
    { id: 'payments' as const, label: 'Payments', icon: CreditCard },
    { id: 'charity' as const, label: 'Charity', icon: Heart },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center pt-40">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-12">
        <motion.div initial="hidden" animate="visible" variants={fadeIn}>
          <h1 className="font-display text-3xl font-bold">Welcome back, {user?.name?.split(' ')[0]}</h1>
          <p className="mt-1 text-muted-foreground">Here's your GolfGive dashboard</p>
        </motion.div>

        <div className="mt-6 flex gap-1 overflow-x-auto rounded-xl border border-border bg-muted/50 p-1">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
                activeTab === t.id ? 'bg-card text-foreground shadow-card' : 'text-muted-foreground hover:text-foreground'
              }`}>
              <t.icon className="h-4 w-4" /> {t.label}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <motion.div initial="hidden" animate="visible" variants={fadeIn} className="mt-6 space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard icon={CreditCard} label="Subscription" value={user?.subscriptionTier?.toUpperCase() || '—'} accent />
              <StatCard icon={TrendingUp} label="Avg Score" value={avgScore} />
              <StatCard icon={Trophy} label="Total Winnings" value={`£${totalWinnings.toLocaleString()}`} />
              <StatCard icon={Heart} label="Charity" value={userCharity?.name || 'None'} />
            </div>

            {nextDraw && (
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-6 shadow-card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-primary">Next Draw</p>
                    <p className="font-display text-2xl font-bold">{nextDraw.date}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{nextDraw.participants.toLocaleString()} participants • £{nextDraw.jackpot.toLocaleString()} jackpot</p>
                  </div>
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary animate-pulse-glow">
                    <Trophy className="h-7 w-7 text-primary-foreground" />
                  </div>
                </div>
              </div>
            )}

            <div className="rounded-xl border border-border bg-card p-6 shadow-card">
              <h3 className="font-display text-lg font-semibold">Latest Scores</h3>
              <div className="mt-4 space-y-3">
                {scores.slice(0, 3).map((s) => (
                  <div key={s.id} className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3">
                    <div>
                      <p className="font-medium">{s.course}</p>
                      <p className="text-xs text-muted-foreground">{s.date}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-display text-lg font-bold">{s.score}</span>
                      {s.verified && <Check className="h-4 w-4 text-primary" />}
                    </div>
                  </div>
                ))}
                {scores.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No scores yet</p>}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'scores' && (
          <motion.div initial="hidden" animate="visible" variants={fadeIn} className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold">Rolling Scores (Latest 5)</h2>
              <Button size="sm" onClick={() => setShowAddScore(!showAddScore)}>
                <Plus className="mr-1 h-4 w-4" /> Add Score
              </Button>
            </div>

            {showAddScore && (
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label>Score</Label>
                    <Input type="number" min={1} max={200} step={1} placeholder="72" value={newScore.score} onChange={(e) => setNewScore({ ...newScore, score: e.target.value })} className="mt-1" />
                  </div>
                  <div>
                    <Label>Course</Label>
                    <Input placeholder="St Andrews" value={newScore.course} onChange={(e) => setNewScore({ ...newScore, course: e.target.value })} className="mt-1" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleAddScore}>Submit</Button>
                  <Button size="sm" variant="outline" onClick={() => setShowAddScore(false)}>Cancel</Button>
                </div>
              </div>
            )}

            <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
              {scores.map((s) => (
                <div key={s.id} className="flex items-center justify-between border-b border-border px-5 py-4 last:border-b-0">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted font-display font-bold">{s.score}</div>
                    <div>
                      <p className="font-medium">{s.course}</p>
                      <p className="text-xs text-muted-foreground">{s.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {s.verified ? (
                      <Badge variant="outline" className="border-primary/30 text-primary"><Check className="mr-1 h-3 w-3" /> Verified</Badge>
                    ) : (
                      <Badge variant="outline" className="border-warning/30 text-warning"><Clock className="mr-1 h-3 w-3" /> Pending</Badge>
                    )}
                    {editingId === s.id ? (
                      <div className="flex items-center gap-1">
                        <Input className="w-16 h-8" value={editScore} onChange={(e) => setEditScore(e.target.value)} type="number" min={1} max={200} step={1} />
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleEditSave(s.id)}><Check className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingId(null)}><X className="h-4 w-4" /></Button>
                      </div>
                    ) : (
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setEditingId(s.id); setEditScore(s.score.toString()); }}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              {scores.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No scores yet. Add your first score!</p>}
            </div>
            {scores.length > 0 && (
              <p className="text-center text-sm text-muted-foreground">Average: <span className="font-semibold">{avgScore}</span> • Only latest 5 scores are used for draws</p>
            )}
          </motion.div>
        )}

        {activeTab === 'draws' && (
          <motion.div initial="hidden" animate="visible" variants={fadeIn} className="mt-6 space-y-4">
            <h2 className="font-display text-xl font-semibold">Draw History</h2>
            {draws.map((d) => (
              <div key={d.id} className="rounded-xl border border-border bg-card p-5 shadow-card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                      d.status === 'upcoming' ? 'bg-primary/10' : d.status === 'completed' ? 'bg-muted' : 'bg-warning/10'
                    }`}>
                      {d.status === 'upcoming' ? <Calendar className="h-5 w-5 text-primary" /> : <Trophy className="h-5 w-5 text-muted-foreground" />}
                    </div>
                    <div>
                      <p className="font-medium">{d.date}</p>
                      <p className="text-xs text-muted-foreground">{d.participants.toLocaleString()} participants • {d.mode} mode</p>
                    </div>
                  </div>
                  <Badge variant={d.status === 'upcoming' ? 'default' : 'outline'}>{d.status}</Badge>
                </div>
                {d.winningNumbers.length > 0 && (
                  <div className="mt-4 flex gap-2">
                    {d.winningNumbers.map((n, i) => (
                      <div key={i} className="flex h-10 w-10 items-center justify-center rounded-full bg-primary font-display font-bold text-primary-foreground">{n}</div>
                    ))}
                  </div>
                )}
                {d.winners.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {d.winners.filter((w) => w.userId === user?.id).map((w) => (
                      <div key={w.id} className="flex items-center justify-between rounded-lg bg-primary/5 px-4 py-2">
                        <div className="flex items-center gap-2">
                          <Star className="h-4 w-4 text-accent" />
                          <span className="text-sm font-medium">{w.matchCount}-Match Winner!</span>
                        </div>
                        <span className="font-display font-bold text-primary">£{w.prize.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-3 flex gap-4 text-sm text-muted-foreground">
                  <span>Prize Pool: £{d.prizePool.toLocaleString()}</span>
                  <span>Jackpot: £{d.jackpot.toLocaleString()}</span>
                </div>
              </div>
            ))}
            {draws.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No draws yet</p>}
          </motion.div>
        )}

        {activeTab === 'payments' && (
          <motion.div initial="hidden" animate="visible" variants={fadeIn} className="mt-6 space-y-6">
            <div className="rounded-xl border border-border bg-card p-6 shadow-card">
              <h2 className="font-display text-xl font-semibold mb-4">Subscription Plan</h2>

              <div className="grid gap-4 md:grid-cols-2">
                <button
                  onClick={() => setSelectedPlan('monthly')}
                  className={`rounded-xl border p-4 text-left transition-all ${
                    selectedPlan === 'monthly'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/30'
                  }`}
                >
                  <p className="font-display text-lg font-bold">Monthly</p>
                  <p className="text-sm text-muted-foreground">£9.99 / month</p>
                </button>

                <button
                  onClick={() => setSelectedPlan('yearly')}
                  className={`rounded-xl border p-4 text-left transition-all ${
                    selectedPlan === 'yearly'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/30'
                  }`}
                >
                  <p className="font-display text-lg font-bold">Yearly</p>
                  <p className="text-sm text-muted-foreground">£99.99 / year</p>
                </button>
              </div>

              {subscription ? (
                <div className="mt-4 rounded-lg border border-border bg-muted/40 p-4 text-sm">
                  <p>
                    Current: <span className="font-semibold capitalize">{subscription.plan}</span> ({subscription.status})
                  </p>
                  <p className="text-muted-foreground">
                    Renewal date: {new Date(subscription.renewalDate).toLocaleDateString('en-GB')}
                  </p>
                </div>
              ) : (
                <p className="mt-4 text-sm text-muted-foreground">No active subscription yet.</p>
              )}

              <div className="mt-4">
                <Button
                  onClick={() => setShowSubscriptionCheckout((v) => !v)}
                  disabled={sameActivePlanSelected}
                >
                  {sameActivePlanSelected
                    ? `Already Active (${selectedPlan})`
                    : showSubscriptionCheckout
                      ? 'Hide Checkout'
                      : `Subscribe (${selectedPlan})`}
                </Button>
              </div>

              {subscription && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {subscription.status === 'active' ? (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          try {
                            await paymentService.pauseSubscription();
                            const subscriptionRes = await paymentService.getMySubscription();
                            setSubscription(subscriptionRes.data);
                            toast.success('Subscription paused');
                          } catch {
                            toast.error('Failed to pause subscription');
                          }
                        }}
                      >
                        Pause
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={async () => {
                          try {
                            await paymentService.cancelSubscription();
                            const subscriptionRes = await paymentService.getMySubscription();
                            setSubscription(subscriptionRes.data);
                            setShowSubscriptionCheckout(false);
                            toast.success('Subscription cancelled');
                          } catch {
                            toast.error('Failed to cancel subscription');
                          }
                        }}
                      >
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      onClick={async () => {
                        try {
                          await paymentService.resumeSubscription();
                          const subscriptionRes = await paymentService.getMySubscription();
                          setSubscription(subscriptionRes.data);
                          toast.success('Subscription resumed');
                        } catch {
                          toast.error('Failed to resume subscription');
                        }
                      }}
                    >
                      Resume
                    </Button>
                  )}
                </div>
              )}

              {showSubscriptionCheckout && (
                <div className="mt-6 rounded-xl border border-border p-4">
                  <Elements stripe={stripePromise}>
                    <PaymentForm
                      amount={selectedPlan === 'yearly' ? 99.99 : 9.99}
                      paymentType="subscription"
                      subscriptionPlan={selectedPlan}
                      onSuccess={async () => {
                        toast.success('Subscription payment successful');
                        const subscriptionRes = await paymentService.getMySubscription();
                        setSubscription(subscriptionRes.data);
                        const paymentsRes = await paymentService.getPaymentHistory();
                        setPayments(paymentsRes.data);
                        setShowSubscriptionCheckout(false);
                      }}
                      onError={(message) => {
                        toast.error(message || 'Subscription failed');
                      }}
                    />
                  </Elements>
                </div>
              )}
            </div>

            <div className="rounded-xl border border-border bg-card p-6 shadow-card">
              <h2 className="font-display text-xl font-semibold mb-4">Payment History</h2>
              
              {payments.length === 0 ? (
                <div className="text-center py-8">
                  <CircleDollarSign className="mx-auto h-12 w-12 text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground">No payments yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {payments.map((p) => (
                    <div key={p.id} className="flex items-center justify-between border-b border-border pb-3 last:border-b-0">
                      <div className="flex items-center gap-4">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                          p.type === 'donation' ? 'bg-pink-100' : 'bg-blue-100'
                        }`}>
                          {p.type === 'donation' ? (
                            <Heart className={`h-5 w-5 ${p.type === 'donation' ? 'text-pink-600' : 'text-blue-600'}`} />
                          ) : (
                            <CreditCard className="h-5 w-5 text-blue-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium capitalize">{p.type}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(p.createdAt).toLocaleDateString('en-GB', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-display font-bold">£{p.amount.toFixed(2)}</p>
                        <Badge variant={p.status === 'completed' ? 'default' : p.status === 'failed' ? 'destructive' : 'outline'} className="text-xs mt-1">
                          {p.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {payments.length > 0 && (
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-border bg-card p-5 shadow-card">
                  <p className="text-sm text-muted-foreground mb-1">Total Donations</p>
                  <p className="font-display text-2xl font-bold">
                    £{payments
                      .filter((p) => p.type === 'donation' && p.status === 'completed')
                      .reduce((a, p) => a + p.amount, 0)
                      .toFixed(2)}
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-card p-5 shadow-card">
                  <p className="text-sm text-muted-foreground mb-1">Total Paid</p>
                  <p className="font-display text-2xl font-bold">
                    £{payments
                      .filter((p) => p.status === 'completed')
                      .reduce((a, p) => a + p.amount, 0)
                      .toFixed(2)}
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-card p-5 shadow-card">
                  <p className="text-sm text-muted-foreground mb-1">Transaction Count</p>
                  <p className="font-display text-2xl font-bold">{payments.filter((p) => p.status === 'completed').length}</p>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'charity' && (
          <motion.div initial="hidden" animate="visible" variants={fadeIn} className="mt-6 space-y-6">
            {userCharity && (
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-6 shadow-card">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/20">
                    <Heart className="h-7 w-7 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Your Charity</p>
                    <h3 className="font-display text-xl font-bold">{userCharity.name}</h3>
                    <p className="text-sm text-muted-foreground">{userCharity.category} • {user?.charityPercentage}% of subscription</p>
                  </div>
                </div>
                <p className="mt-4 text-sm text-muted-foreground">{userCharity.description}</p>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div className="rounded-lg bg-card p-3 text-center">
                    <p className="font-display text-lg font-bold">£{userCharity.totalRaised.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Total Raised</p>
                  </div>
                  <div className="rounded-lg bg-card p-3 text-center">
                    <p className="font-display text-lg font-bold">{userCharity.contributorCount.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Contributors</p>
                  </div>
                </div>
              </div>
            )}

            <h3 className="font-display text-lg font-semibold">All Charities</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {charities.map((c) => (
                <div key={c.id} className={`rounded-xl border p-5 shadow-card transition-all ${
                  c.id === user?.charityId ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-primary/30'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <span className="font-display font-bold text-primary">{c.name[0]}</span>
                    </div>
                    <div>
                      <p className="font-medium">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.category}</p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">{c.description}</p>
                  <div className="mt-3 flex justify-between text-xs text-muted-foreground">
                    <span>£{c.totalRaised.toLocaleString()} raised</span>
                    <span>{c.contributorCount} contributors</span>
                  </div>
                  {c.id !== user?.charityId && (
                    <Button variant="outline" size="sm" className="mt-3 w-full" onClick={() => handleSwitchCharity(c.id)}>Switch to This Charity</Button>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
