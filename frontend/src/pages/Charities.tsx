import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { charityService } from '@/services/charityService';
import { motion } from 'framer-motion';
import { Heart, Loader2 } from 'lucide-react';
import { Charity } from '@/types';
import { toast } from 'sonner';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.4 } }),
};

const Charities = () => {
  const navigate = useNavigate();
  const [charities, setCharities] = useState<Charity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    charityService.getAll()
      .then((res) => setCharities(res.data))
      .catch(() => toast.error('Failed to load charities'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-16">
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0} className="text-center">
          <h1 className="font-display text-4xl font-bold">Our Charities</h1>
          <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
            Every subscription supports the causes that matter most to you.
          </p>
        </motion.div>

        {loading ? (
          <div className="flex justify-center pt-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {charities.map((c, i) => (
              <motion.div key={c.id} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i + 1}
                className="rounded-2xl border border-border bg-card p-6 shadow-card transition-all hover:shadow-elevated">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <Heart className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-4 font-display text-xl font-semibold">{c.name}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{c.category}</p>
                <p className="mt-3 text-sm text-muted-foreground">{c.description}</p>
                <div className="mt-4 flex justify-between border-t border-border pt-4 text-sm">
                  <div>
                    <p className="font-display font-bold">£{c.totalRaised.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Raised</p>
                  </div>
                  <div className="text-right">
                    <p className="font-display font-bold">{c.contributorCount.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Contributors</p>
                  </div>
                </div>
                <Button 
                  onClick={() => navigate(`/donate/${c.id}`)} 
                  className="mt-4 w-full"
                >
                  <Heart className="mr-2 h-4 w-4" />
                  Donate Now
                </Button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default Charities;
