const sql = require('../config/db');

exports.getDashboardStats = async () => {
  const safeNumberQuery = async (query, fieldName) => {
    try {
      const [row] = await query();
      const rawValue = row?.[fieldName] ?? row?.[fieldName.toLowerCase()];
      return Number(rawValue) || 0;
    } catch (error) {
      console.warn(`Stats query failed for ${fieldName}:`, error?.message || error);
      return 0;
    }
  };

  const [
    totalUsers,
    activeSubscriptions,
    totalRevenue,
    totalPrizesAwarded,
    totalDraws,
    charitiesFunded,
    jackpotPool,
  ] = await Promise.all([
    safeNumberQuery(() => sql`SELECT COUNT(*) as totalUsers FROM users`, 'totalUsers'),
    safeNumberQuery(() => sql`SELECT COUNT(*) as activeSubscriptions FROM subscriptions WHERE status='active'`, 'activeSubscriptions'),
    safeNumberQuery(() => sql`SELECT COALESCE(SUM(amount), 0) as totalRevenue FROM payments WHERE status='completed'`, 'totalRevenue'),
    safeNumberQuery(() => sql`SELECT COALESCE(SUM(prize), 0) as totalPrizesAwarded FROM winners`, 'totalPrizesAwarded'),
    safeNumberQuery(() => sql`SELECT COUNT(*) as totalDraws FROM draws`, 'totalDraws'),
    safeNumberQuery(() => sql`SELECT COALESCE(SUM(total_raised), 0) as charitiesFunded FROM charities`, 'charitiesFunded'),
    safeNumberQuery(() => sql`SELECT COALESCE(SUM(prize_pool), 0) as jackpotPool FROM draws WHERE status = 'upcoming'`, 'jackpotPool'),
  ]);

  return {
    totalUsers,
    activeSubscriptions,
    totalRevenue,
    totalPrizesAwarded,
    totalDraws,
    charitiesFunded,
    jackpotPool,
  };
};