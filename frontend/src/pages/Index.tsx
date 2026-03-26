import { motion } from 'framer-motion';
import { ArrowRight, Trophy, Heart, TrendingUp, Shield, Users, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import heroBg from '@/assets/hero-bg.jpg';
import { statsService } from '@/services/statsService';
import { DashboardStats } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

const formatStatValue = (value: number, type: 'count' | 'money'): string => {
  if (type === 'count') {
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K+`;
    return `${value}+`;
  }
  if (type === 'money') {
    if (value >= 1000000) return `£${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `£${(value / 1000).toFixed(0)}K`;
    return `£${value}`;
  }
  return String(value);
};

const Index = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeSubscriptions: 0,
    totalRevenue: 0,
    totalPrizesAwarded: 0,
    charitiesFunded: 0,
    totalDraws: 0,
    jackpotPool: 0,
  });

  useEffect(() => {
    statsService.getPublicStats().then((res) => {
      setStats(res.data);
    });
  }, []);

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroBg} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-secondary/95 via-secondary/80 to-secondary/40" />
        </div>
        <div className="container relative z-10 mx-auto px-4 pt-20">
          <div className="max-w-2xl">
            <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
                <Zap className="h-3.5 w-3.5" /> Now with £125,000 Jackpot
              </span>
            </motion.div>
            <motion.h1 initial="hidden" animate="visible" variants={fadeUp} custom={1}
              className="mt-6 font-display text-5xl font-bold leading-tight tracking-tight text-secondary-foreground md:text-7xl">
              Play Golf.<br />
              <span className="text-gradient-hero">Win Big.</span><br />
              Give Back.
            </motion.h1>
            <motion.p initial="hidden" animate="visible" variants={fadeUp} custom={2}
              className="mt-6 max-w-lg text-lg text-secondary-foreground/70">
              Subscribe, submit your scores, and enter weekly draws with life-changing prizes — while funding the charities you care about.
            </motion.p>
            <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={3}
              className="mt-8 flex flex-wrap gap-4">
              <Button
                size="lg"
                onClick={() =>
                  isAuthenticated
                    ? navigate('/dashboard', { state: { tab: 'scores', openAddScore: true } })
                    : navigate('/register')
                }
                className="group"
              >
                {isAuthenticated ? 'Add Score' : 'Start Playing'}{' '}
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/charities')}
                className="border-secondary-foreground/20 text-black hover:bg-secondary-foreground/10">
                View Charities
              </Button>
            </motion.div>
            <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={4}
              className="mt-12 flex gap-8">
              {[
                { label: 'Active Players', value: formatStatValue(stats.totalUsers, 'count') },
                { label: 'Prizes Awarded', value: formatStatValue(stats.totalPrizesAwarded, 'money') },
                { label: 'Charity Funded', value: formatStatValue(stats.charitiesFunded, 'money') },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="font-display text-2xl font-bold text-secondary-foreground">{stat.value}</p>
                  <p className="text-sm text-secondary-foreground/50">{stat.label}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
            className="text-center">
            <h2 className="font-display text-4xl font-bold">How It Works</h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              Three simple steps to start winning prizes and supporting charities.
            </p>
          </motion.div>
          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {[
              { icon: Users, title: 'Subscribe', desc: 'Choose your plan and pick a charity to support. A portion of your subscription goes directly to your chosen cause.', step: '01' },
              { icon: TrendingUp, title: 'Submit Scores', desc: 'Enter your latest 5 golf scores. Our system uses your rolling average to determine your draw entries.', step: '02' },
              { icon: Trophy, title: 'Win & Give', desc: 'Match numbers in our weekly draws to win prizes. From 3-match bonuses to the jackpot — everyone benefits.', step: '03' },
            ].map((item, i) => (
              <motion.div key={item.step} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i + 1}
                className="group relative rounded-2xl border border-border bg-card p-8 shadow-card transition-all hover:shadow-elevated">
                <span className="font-display text-6xl font-bold text-muted/80">{item.step}</span>
                <div className="mt-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <item.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-4 font-display text-xl font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-muted/50 py-24">
        <div className="container mx-auto px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
            className="text-center">
            <h2 className="font-display text-4xl font-bold">Why GolfGive?</h2>
          </motion.div>
          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: Trophy, title: 'Weekly Draws', desc: 'Multiple chances to win every week with 3, 4, and 5-match prize tiers.' },
              { icon: Heart, title: 'Charity Impact', desc: 'Every subscription directly funds verified charities of your choice.' },
              { icon: Shield, title: 'Fair & Transparent', desc: 'Algorithmic and random draw modes ensure complete fairness.' },
              { icon: TrendingUp, title: 'Rolling Scores', desc: 'Only your latest 5 scores count — always reflecting your current form.' },
              { icon: Zap, title: 'Jackpot Rollover', desc: 'Unclaimed jackpots roll over, building to life-changing amounts.' },
              { icon: Users, title: 'Community', desc: 'Join thousands of golfers making a difference while they play.' },
            ].map((f, i) => (
              <motion.div key={f.title} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i * 0.5}
                className="flex gap-4 rounded-xl border border-border bg-card p-6 shadow-card">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-display font-semibold">{f.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
            className="relative overflow-hidden rounded-3xl bg-hero p-12 text-center md:p-20">
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 30% 50%, hsl(160 84% 39% / 0.3), transparent 50%)' }} />
            <div className="relative z-10">
              <h2 className="font-display text-4xl font-bold text-secondary-foreground md:text-5xl">
                Ready to Make Every Round Count?
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-secondary-foreground/60">
                Join GolfGive today and turn your passion for golf into prizes and purpose.
              </p>
              <Button
                size="lg"
                className="mt-8 group"
                onClick={() =>
                  isAuthenticated
                    ? navigate('/dashboard', { state: { tab: 'scores', openAddScore: true } })
                    : navigate('/register')
                }
              >
                {isAuthenticated ? 'Add Score' : 'Get Started Now'} <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
