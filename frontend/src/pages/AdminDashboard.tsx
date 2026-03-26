import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { userService } from '@/services/userService';
import { charityService } from '@/services/charityService';
import { drawService } from '@/services/drawService';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Users, Trophy, Heart, BarChart3, CircleDollarSign, Settings, Check, X,
  Search, Eye, ShieldCheck, CreditCard, Shuffle, Calculator, Loader2, Trash2
} from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { User, Charity, Draw, DashboardStats } from '@/types';
import { toast } from 'sonner';

const fadeIn = { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (typeof error === 'object' && error !== null) {
    const maybeResponse = (error as { response?: { data?: { message?: string } } }).response;
    if (maybeResponse?.data?.message) {
      return maybeResponse.data.message;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
};

const AdminDashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const isAdmin = String(user?.role || '').trim().toLowerCase() === 'admin';
  const [activeTab, setActiveTab] = useState<'analytics' | 'users' | 'draws' | 'charities' | 'verification'>('analytics');
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [draws, setDraws] = useState<Draw[]>([]);
  const [charities, setCharities] = useState<Charity[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmittingCharity, setIsSubmittingCharity] = useState(false);
  const [isUpdatingCharity, setIsUpdatingCharity] = useState(false);
  const [isDeletingCharityId, setIsDeletingCharityId] = useState<string | null>(null);
  const [editingCharityId, setEditingCharityId] = useState<string | null>(null);
  const [newCharityName, setNewCharityName] = useState('');
  const [newCharityCategory, setNewCharityCategory] = useState('General');
  const [newCharityDescription, setNewCharityDescription] = useState('');
  const [editCharityName, setEditCharityName] = useState('');
  const [editCharityCategory, setEditCharityCategory] = useState('General');
  const [editCharityDescription, setEditCharityDescription] = useState('');

  const loadStats = async () => {
    try {
      const statsRes = await userService.getDashboardStats();
      setStats(statsRes.data);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to load analytics'));
    }
  };

  const loadUsers = async () => {
    try {
      const usersRes = await userService.getAllUsers();
      setAllUsers(usersRes.data);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to load users'));
    }
  };

  const loadDraws = async () => {
    try {
      const drawsRes = await drawService.getAll();
      setDraws(drawsRes.data);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to load draws'));
    }
  };

  const loadCharities = async () => {
    try {
      const charitiesRes = await charityService.getAll();
      setCharities(charitiesRes.data);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to load charities'));
    }
  };

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) {
      return;
    }

    setLoading(true);
    Promise.allSettled([loadStats(), loadUsers(), loadDraws(), loadCharities()])
      .finally(() => setLoading(false));
  }, [isAuthenticated, isAdmin]);

  if (!isAuthenticated || !isAdmin) return <Navigate to="/login" />;

  const filteredUsers = allUsers.filter(
    (u) => u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const pendingVerifications = draws.flatMap((d) => d.winners).filter((w) => w.verificationStatus === 'pending');

  const handleApprove = async (winnerId: string) => {
    try {
      await drawService.approveWinner(winnerId);
      await loadDraws();
      toast.success('Winner approved');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to approve winner'));
    }
  };

  const handleReject = async (winnerId: string) => {
    try {
      await drawService.rejectWinner(winnerId);
      await loadDraws();
      toast.success('Winner rejected');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to reject winner'));
    }
  };

  const handleRandomDraw = async () => {
    try {
      await drawService.triggerRandomDraw();
      await Promise.all([loadDraws(), loadStats()]);
      toast.success('Random draw triggered');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to trigger draw'));
    }
  };

  const handleAlgorithmicDraw = async () => {
    try {
      await drawService.triggerAlgorithmicDraw();
      await Promise.all([loadDraws(), loadStats()]);
      toast.success('Algorithmic draw triggered');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to trigger draw'));
    }
  };

  const handleAddCharity = async () => {
    const trimmedName = newCharityName.trim();
    const trimmedCategory = newCharityCategory.trim();
    const trimmedDescription = newCharityDescription.trim();

    if (!trimmedName) {
      toast.error('Charity name is required');
      return;
    }

    setIsSubmittingCharity(true);
    try {
      await charityService.createCharityAsAdmin({
        name: trimmedName,
        category: trimmedCategory || 'General',
        description: trimmedDescription,
      });

      setNewCharityName('');
      setNewCharityCategory('General');
      setNewCharityDescription('');
      await loadCharities();
      toast.success('Charity added successfully');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to add charity'));
    } finally {
      setIsSubmittingCharity(false);
    }
  };

  const startEditingCharity = (charity: Charity) => {
    setEditingCharityId(charity.id);
    setEditCharityName(charity.name);
    setEditCharityCategory(charity.category || 'General');
    setEditCharityDescription(charity.description || '');
  };

  const cancelEditingCharity = () => {
    setEditingCharityId(null);
    setEditCharityName('');
    setEditCharityCategory('General');
    setEditCharityDescription('');
  };

  const handleUpdateCharity = async () => {
    if (!editingCharityId) {
      return;
    }

    const trimmedName = editCharityName.trim();
    const trimmedCategory = editCharityCategory.trim();
    const trimmedDescription = editCharityDescription.trim();

    if (!trimmedName) {
      toast.error('Charity name is required');
      return;
    }

    setIsUpdatingCharity(true);
    try {
      await charityService.updateCharityAsAdmin(editingCharityId, {
        name: trimmedName,
        category: trimmedCategory || 'General',
        description: trimmedDescription,
      });

      await loadCharities();
      cancelEditingCharity();
      toast.success('Charity updated successfully');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to update charity'));
    } finally {
      setIsUpdatingCharity(false);
    }
  };

  const handleDeleteCharity = async (charityId: string) => {
    setIsDeletingCharityId(charityId);
    try {
      await charityService.deleteCharityAsAdmin(charityId);
      await loadCharities();
      if (editingCharityId === charityId) {
        cancelEditingCharity();
      }
      toast.success('Charity deleted successfully');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to delete charity'));
    } finally {
      setIsDeletingCharityId(null);
    }
  };

  const tabs = [
    { id: 'analytics' as const, label: 'Analytics', icon: BarChart3 },
    { id: 'users' as const, label: 'Users', icon: Users },
    { id: 'draws' as const, label: 'Draws', icon: Trophy },
    { id: 'charities' as const, label: 'Charities', icon: Heart },
    { id: 'verification' as const, label: 'Verification', icon: ShieldCheck, badge: pendingVerifications.length },
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
          <h1 className="font-display text-3xl font-bold">Admin Dashboard</h1>
          <p className="mt-1 text-muted-foreground">Manage your GolfGive platform</p>
        </motion.div>

        <div className="mt-6 flex gap-1 overflow-x-auto rounded-xl border border-border bg-muted/50 p-1">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
                activeTab === t.id ? 'bg-card text-foreground shadow-card' : 'text-muted-foreground hover:text-foreground'
              }`}>
              <t.icon className="h-4 w-4" /> {t.label}
              {t.badge ? <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">{t.badge}</span> : null}
            </button>
          ))}
        </div>

        {activeTab === 'analytics' && stats && (
          <motion.div initial="hidden" animate="visible" variants={fadeIn} className="mt-6 space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { icon: Users, label: 'Total Users', value: stats.totalUsers.toLocaleString() },
                { icon: CreditCard, label: 'Active Subscriptions', value: stats.activeSubscriptions.toLocaleString() },
                { icon: CircleDollarSign, label: 'Total Revenue', value: `£${stats.totalRevenue.toLocaleString()}` },
                { icon: Heart, label: 'Charities Funded', value: `£${stats.charitiesFunded.toLocaleString()}` },
                { icon: Trophy, label: 'Total Draws', value: stats.totalDraws.toString() },
                { icon: CircleDollarSign, label: 'Current Jackpot', value: `£${stats.jackpotPool.toLocaleString()}` },
              ].map((s) => (
                <div key={s.label} className="rounded-xl border border-border bg-card p-5 shadow-card">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                      <s.icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{s.label}</p>
                      <p className="font-display text-xl font-bold">{s.value}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-border bg-card p-6 shadow-card">
              <h3 className="font-display text-lg font-semibold">Revenue Overview</h3>
              <div className="mt-4 flex h-48 items-center justify-center rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Chart will be rendered when backend is connected</p>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'users' && (
          <motion.div initial="hidden" animate="visible" variants={fadeIn} className="mt-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search users..." className="pl-10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
              <Button size="sm" variant="outline" onClick={loadUsers}>Refresh</Button>
            </div>
            <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
              <div className="hidden sm:grid sm:grid-cols-5 gap-4 border-b border-border bg-muted/50 px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <span>User</span><span>Tier</span><span>Status</span><span>Charity</span><span>Actions</span>
              </div>
              {filteredUsers.map((u) => (
                <div key={u.id} className="grid gap-2 sm:grid-cols-5 sm:gap-4 items-center border-b border-border px-5 py-4 last:border-b-0">
                  <div>
                    <p className="font-medium">{u.name}</p>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                  </div>
                  <Badge variant="outline">{u.subscriptionTier}</Badge>
                  <Badge variant={u.subscriptionStatus === 'active' ? 'default' : u.subscriptionStatus === 'past_due' ? 'destructive' : 'outline'}>
                    {u.subscriptionStatus}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {charities.find((c) => c.id === u.charityId)?.name || '—'}
                  </span>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8"><Eye className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8"><Settings className="h-4 w-4" /></Button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === 'draws' && (
          <motion.div initial="hidden" animate="visible" variants={fadeIn} className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold">Draw Management</h2>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={handleRandomDraw}><Shuffle className="mr-1 h-4 w-4" /> Random Draw</Button>
                <Button size="sm" onClick={handleAlgorithmicDraw}><Calculator className="mr-1 h-4 w-4" /> Algorithmic Draw</Button>
              </div>
            </div>
            {draws.map((d) => (
              <div key={d.id} className="rounded-xl border border-border bg-card p-5 shadow-card">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-display text-lg font-semibold">{d.date}</p>
                      <Badge variant={d.status === 'upcoming' ? 'default' : 'outline'}>{d.status}</Badge>
                      <Badge variant="outline">{d.mode}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{d.participants.toLocaleString()} participants • {d.winners.length} winners</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Prize Pool</p>
                    <p className="font-display text-lg font-bold">£{d.prizePool.toLocaleString()}</p>
                  </div>
                </div>
                {d.winningNumbers.length > 0 && (
                  <div className="mt-3 flex gap-2">
                    {d.winningNumbers.map((n, i) => (
                      <div key={i} className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">{n}</div>
                    ))}
                  </div>
                )}
                {d.winners.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {d.winners.map((w) => (
                      <div key={w.id} className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-2">
                        <div>
                          <span className="font-medium">{w.userName}</span>
                          <span className="ml-2 text-sm text-muted-foreground">{w.matchCount}-match • £{w.prize.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={w.verificationStatus === 'approved' ? 'default' : w.verificationStatus === 'pending' ? 'outline' : 'destructive'}>
                            {w.verificationStatus}
                          </Badge>
                          <Badge variant="outline">{w.paymentStatus}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </motion.div>
        )}

        {activeTab === 'charities' && (
          <motion.div initial="hidden" animate="visible" variants={fadeIn} className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold">Charity Management</h2>
              <Button size="sm" variant="outline" onClick={loadCharities}>
                <Heart className="mr-1 h-4 w-4" /> Refresh
              </Button>
            </div>

            <div className="rounded-xl border border-border bg-card p-5 shadow-card space-y-3">
              <h3 className="font-display text-lg font-semibold">Add Charity</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  placeholder="Charity name"
                  value={newCharityName}
                  onChange={(e) => setNewCharityName(e.target.value)}
                />
                <Input
                  placeholder="Category (e.g. Health, Education)"
                  value={newCharityCategory}
                  onChange={(e) => setNewCharityCategory(e.target.value)}
                />
              </div>
              <textarea
                className="min-h-[88px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Short description"
                value={newCharityDescription}
                onChange={(e) => setNewCharityDescription(e.target.value)}
              />
              <div className="flex justify-end">
                <Button size="sm" onClick={handleAddCharity} disabled={isSubmittingCharity}>
                  {isSubmittingCharity ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Heart className="mr-1 h-4 w-4" />}
                  Create Charity
                </Button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {charities.map((c) => (
                <div key={c.id} className="rounded-xl border border-border bg-card p-5 shadow-card">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <span className="font-display font-bold text-primary">{c.name[0]}</span>
                      </div>
                      <div>
                        <p className="font-medium">{c.name}</p>
                        <p className="text-xs text-muted-foreground">{c.category}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEditingCharity(c)}>
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => handleDeleteCharity(c.id)}
                        disabled={isDeletingCharityId === c.id}
                      >
                        {isDeletingCharityId === c.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">{c.description}</p>
                  {editingCharityId === c.id && (
                    <div className="mt-3 space-y-2 rounded-lg border border-border bg-muted/30 p-3">
                      <Input value={editCharityName} onChange={(e) => setEditCharityName(e.target.value)} placeholder="Name" />
                      <Input value={editCharityCategory} onChange={(e) => setEditCharityCategory(e.target.value)} placeholder="Category" />
                      <textarea
                        className="min-h-[72px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={editCharityDescription}
                        onChange={(e) => setEditCharityDescription(e.target.value)}
                        placeholder="Description"
                      />
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={cancelEditingCharity}>
                          <X className="mr-1 h-4 w-4" /> Cancel
                        </Button>
                        <Button size="sm" onClick={handleUpdateCharity} disabled={isUpdatingCharity}>
                          {isUpdatingCharity ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Check className="mr-1 h-4 w-4" />}
                          Save
                        </Button>
                      </div>
                    </div>
                  )}
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div className="rounded-lg bg-muted/50 p-2 text-center">
                      <p className="font-display font-bold">£{c.totalRaised.toLocaleString()}</p>
                      <p className="text-[10px] text-muted-foreground">Total Raised</p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-2 text-center">
                      <p className="font-display font-bold">{c.contributorCount}</p>
                      <p className="text-[10px] text-muted-foreground">Contributors</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === 'verification' && (
          <motion.div initial="hidden" animate="visible" variants={fadeIn} className="mt-6 space-y-4">
            <h2 className="font-display text-xl font-semibold">Winner Verification</h2>
            {pendingVerifications.length === 0 ? (
              <div className="rounded-xl border border-border bg-card p-12 text-center shadow-card">
                <ShieldCheck className="mx-auto h-12 w-12 text-muted-foreground/30" />
                <p className="mt-4 text-muted-foreground">No pending verifications</p>
              </div>
            ) : (
              pendingVerifications.map((w) => (
                <div key={w.id} className="rounded-xl border border-warning/20 bg-warning/5 p-5 shadow-card">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{w.userName}</p>
                      <p className="text-sm text-muted-foreground">{w.matchCount}-match win • £{w.prize.toLocaleString()}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="border-destructive/30 text-destructive hover:bg-destructive/10" onClick={() => handleReject(w.id)}>
                        <X className="mr-1 h-4 w-4" /> Reject
                      </Button>
                      <Button size="sm" onClick={() => handleApprove(w.id)}>
                        <Check className="mr-1 h-4 w-4" /> Approve
                      </Button>
                    </div>
                  </div>
                  {w.proofUrl && (
                    <div className="mt-3">
                      <p className="text-xs text-muted-foreground">Proof uploaded</p>
                      <Button variant="outline" size="sm" className="mt-1"><Eye className="mr-1 h-4 w-4" /> View Proof</Button>
                    </div>
                  )}
                </div>
              ))
            )}

            <h3 className="font-display text-lg font-semibold pt-4">All Winners</h3>
            <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
              {draws.flatMap((d) => d.winners).map((w) => (
                <div key={w.id} className="flex items-center justify-between border-b border-border px-5 py-3 last:border-b-0">
                  <div>
                    <p className="font-medium">{w.userName}</p>
                    <p className="text-xs text-muted-foreground">{w.matchCount}-match • £{w.prize.toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={w.verificationStatus === 'approved' ? 'default' : w.verificationStatus === 'pending' ? 'outline' : 'destructive'}>
                      {w.verificationStatus}
                    </Badge>
                    <Badge variant={w.paymentStatus === 'paid' ? 'default' : 'outline'}>
                      {w.paymentStatus}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
