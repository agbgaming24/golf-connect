import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { charityService } from '@/services/charityService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trophy, Loader2, Check } from 'lucide-react';
import { Charity } from '@/types';
import { toast } from 'sonner';

type ErrorWithResponse = {
  response?: {
    data?: {
      message?: string;
    };
  };
};

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedCharity, setSelectedCharity] = useState('');
  const [charities, setCharities] = useState<Charity[]>([]);
  const [charitiesLoading, setCharitiesLoading] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const { register, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (step === 2 && charities.length === 0) {
      setCharitiesLoading(true);
      charityService.getAll()
        .then((res) => setCharities(res.data))
        .catch(() => toast.error('Failed to load charities'))
        .finally(() => setCharitiesLoading(false));
    }
  }, [step, charities.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      setStep(2);
      return;
    }
    try {
      await register(name, email, password, selectedCharity);
      navigate('/dashboard');
    } catch (err: unknown) {
      const message = (err as ErrorWithResponse)?.response?.data?.message || 'Registration failed. Please try again.';
      toast.error(message);
    }
  };

  return (
    <div className="flex min-h-screen">
      <div className="hidden w-1/2 bg-hero lg:flex lg:items-center lg:justify-center">
        <div className="max-w-md px-8 text-center">
          <Trophy className="mx-auto h-16 w-16 text-primary" />
          <h2 className="mt-6 font-display text-4xl font-bold text-secondary-foreground">Join GolfGive</h2>
          <p className="mt-4 text-secondary-foreground/60">Create your account, choose a charity, and start playing for prizes that make a difference.</p>
        </div>
      </div>
      <div className="flex flex-1 items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <Link to="/" className="mb-8 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Trophy className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-bold">GolfGive</span>
          </Link>

          <div className="mb-6 flex gap-2">
            <div className={`h-1 flex-1 rounded-full ${step >= 1 ? 'bg-primary' : 'bg-muted'}`} />
            <div className={`h-1 flex-1 rounded-full ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
          </div>

          {step === 1 ? (
            <>
              <h1 className="font-display text-2xl font-bold">Create Account</h1>
              <p className="mt-1 text-sm text-muted-foreground">Step 1: Your details</p>
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" placeholder="John Smith" value={name} onChange={(e) => setName(e.target.value)} required className="mt-1.5" />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1.5" />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required className="mt-1.5" />
                </div>
                <Button type="submit" className="w-full">Continue</Button>
              </form>
            </>
          ) : (
            <>
              <h1 className="font-display text-2xl font-bold">Choose a Charity</h1>
              <p className="mt-1 text-sm text-muted-foreground">Step 2: Select where your contribution goes</p>
              <form onSubmit={handleSubmit} className="mt-6 space-y-3">
                {charitiesLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  charities.map((c) => (
                    <button
                      type="button"
                      key={c.id}
                      onClick={() => setSelectedCharity(c.id)}
                      className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-all ${
                        selectedCharity === c.id ? 'border-primary bg-primary/5 shadow-card' : 'border-border hover:border-primary/30'
                      }`}
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        {selectedCharity === c.id ? (
                          <Check className="h-5 w-5 text-primary" />
                        ) : (
                          <span className="font-display text-sm font-bold text-primary">{c.name[0]}</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{c.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{c.category}</p>
                      </div>
                    </button>
                  ))
                )}
                <div className="flex gap-2 pt-2">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setStep(1)}>Back</Button>
                  <Button type="submit" className="flex-1" disabled={!selectedCharity || isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Create Account
                  </Button>
                </div>
              </form>
            </>
          )}

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-primary hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
