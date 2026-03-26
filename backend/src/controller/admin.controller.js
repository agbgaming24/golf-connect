const sql = require('../config/db');
const drawService = require('../services/draw.service');
const drawModel = require('../models/draw.model');
const charityModel = require('../models/charity.model');

exports.getUsers = async (req, res) => {
  try {
    const rows = await sql`
      SELECT
        u.id, u.name, u.email, u.role, u.created_at,
        s.plan AS subscription_tier,
        s.status AS subscription_status,
        s.charity_id,
        s.charity_percentage
      FROM users u
      LEFT JOIN (
        SELECT s1.*
        FROM subscriptions s1
        INNER JOIN (
          SELECT user_id, MAX(id) AS max_id
          FROM subscriptions
          GROUP BY user_id
        ) latest ON latest.max_id = s1.id
      ) s ON s.user_id = u.id
      ORDER BY u.created_at DESC`;

    res.json({ data: rows });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching users', error: err?.message });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const rows = await sql`
      SELECT
        u.id, u.name, u.email, u.role, u.created_at,
        s.plan AS subscription_tier,
        s.status AS subscription_status,
        s.charity_id,
        s.charity_percentage
      FROM users u
      LEFT JOIN (
        SELECT s1.*
        FROM subscriptions s1
        INNER JOIN (
          SELECT user_id, MAX(id) AS max_id
          FROM subscriptions
          GROUP BY user_id
        ) latest ON latest.max_id = s1.id
      ) s ON s.user_id = u.id
      WHERE u.id = ${req.params.id}
      LIMIT 1`;

    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ data: rows[0] });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching user', error: err?.message });
  }
};

exports.updateUserProfile = async (req, res) => {
  try {
    const { name, email, role } = req.body;

    if (!name || !email) {
      return res.status(400).json({ message: 'name and email are required' });
    }

    if (role && !['user', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const result = await sql`
      UPDATE users
      SET name = ${name}, email = ${email}, role = COALESCE(${role || null}, role)
      WHERE id = ${req.params.id}
      RETURNING id`;

    if (result.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User updated' });
  } catch (err) {
    res.status(500).json({ message: 'Error updating user', error: err?.message });
  }
};

exports.updateUserScore = async (req, res) => {
  try {
    const { score, playedAt } = req.body;

    if (!Number.isInteger(Number(score)) || Number(score) < 1 || Number(score) > 45) {
      return res.status(400).json({ message: 'Score must be an integer between 1 and 45' });
    }

    const result = await sql`
      UPDATE scores
      SET score = ${Number(score)}, played_at = COALESCE(${playedAt || null}, played_at)
      WHERE id = ${req.params.scoreId} AND user_id = ${req.params.userId}
      RETURNING id`;

    if (result.length === 0) {
      return res.status(404).json({ message: 'Score not found for user' });
    }

    res.json({ message: 'Score updated' });
  } catch (err) {
    res.status(500).json({ message: 'Error updating user score', error: err?.message });
  }
};

exports.manageUserSubscription = async (req, res) => {
  try {
    const { plan, status, renewalDate, charityId, charityPercentage } = req.body;

    if (plan && !['monthly', 'yearly'].includes(plan)) {
      return res.status(400).json({ message: 'Plan must be monthly or yearly' });
    }

    if (status && !['active', 'inactive', 'past_due'].includes(status)) {
      return res.status(400).json({ message: 'Invalid subscription status' });
    }

    const subs = await sql`
      SELECT id FROM subscriptions WHERE user_id = ${req.params.id} ORDER BY id DESC LIMIT 1`;

    if (subs.length > 0) {
      await sql`
        UPDATE subscriptions
        SET plan = COALESCE(${plan || null}, plan),
            status = COALESCE(${status || null}, status),
            renewal_date = COALESCE(${renewalDate || null}, renewal_date),
            charity_id = COALESCE(${charityId || null}, charity_id),
            charity_percentage = COALESCE(${charityPercentage ?? null}, charity_percentage)
        WHERE id = ${subs[0].id}`;
      return res.json({ message: 'Subscription updated' });
    }

    await sql`
      INSERT INTO subscriptions (user_id, plan, status, renewal_date, charity_id, charity_percentage)
      VALUES (
        ${req.params.id},
        ${plan || 'monthly'},
        ${status || 'inactive'},
        ${renewalDate || null},
        ${charityId || null},
        ${charityPercentage ?? 0}
      )`;

    res.json({ message: 'Subscription created' });
  } catch (err) {
    res.status(500).json({ message: 'Error managing subscription', error: err?.message });
  }
};

exports.getDraws = async (req, res) => {
  try {
    const draws = await drawModel.getAllDraws();
    res.json({ data: draws });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching draws', error: err?.message });
  }
};

exports.runDraw = async (req, res) => {
  try {
    const mode = req.body?.mode === 'algorithmic' ? 'algorithmic' : 'random';
    const result = mode === 'algorithmic'
      ? await drawService.runAlgorithmicDraw()
      : await drawService.runRandomDraw();

    res.json({ data: result });
  } catch (err) {
    res.status(500).json({ message: 'Error running draw', error: err?.message });
  }
};

exports.runRandomDraw = async (req, res) => {
  try {
    const result = await drawService.runRandomDraw();
    res.json({ data: result });
  } catch (err) {
    res.status(500).json({ message: 'Error running random draw', error: err?.message });
  }
};

exports.runAlgorithmicDraw = async (req, res) => {
  try {
    const result = await drawService.runAlgorithmicDraw();
    res.json({ data: result });
  } catch (err) {
    res.status(500).json({ message: 'Error running algorithmic draw', error: err?.message });
  }
};

exports.simulateDraw = async (req, res) => {
  try {
    const mode = req.body?.mode === 'algorithmic' ? 'algorithmic' : 'random';
    const result = await drawService.simulateDraw(mode);
    res.json({ data: result });
  } catch (err) {
    res.status(500).json({ message: 'Error simulating draw', error: err?.message });
  }
};

exports.publishDrawResults = async (req, res) => {
  try {
    const result = await sql`
      UPDATE draws
      SET status = 'completed'
      WHERE id = ${req.params.id}
      RETURNING id`;

    if (result.length === 0) {
      return res.status(404).json({ message: 'Draw not found' });
    }

    res.json({ message: 'Draw results published' });
  } catch (err) {
    res.status(500).json({ message: 'Error publishing draw results', error: err?.message });
  }
};

exports.getCharities = async (req, res) => {
  try {
    const charities = await charityModel.getAllCharities();
    res.json({ data: charities });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching charities', error: err?.message });
  }
};

exports.createCharity = async (req, res) => {
  try {
    const { name, description, category } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Charity name is required' });
    }

    const id = await charityModel.createCharity({
      name,
      description: description || '',
      category: category || 'General',
    });

    res.status(201).json({ data: { id }, message: 'Charity created' });
  } catch (err) {
    res.status(500).json({ message: 'Error creating charity', error: err?.message });
  }
};

exports.updateCharity = async (req, res) => {
  try {
    const { name, description, category } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Charity name is required' });
    }

    const affected = await charityModel.updateCharity(req.params.id, {
      name,
      description: description || '',
      category: category || 'General',
    });

    if (affected === 0) {
      return res.status(404).json({ message: 'Charity not found' });
    }

    res.json({ message: 'Charity updated' });
  } catch (err) {
    res.status(500).json({ message: 'Error updating charity', error: err?.message });
  }
};

exports.deleteCharity = async (req, res) => {
  try {
    const affected = await charityModel.deleteCharity(req.params.id);

    if (affected === 0) {
      return res.status(404).json({ message: 'Charity not found' });
    }

    res.json({ message: 'Charity deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting charity', error: err?.message });
  }
};

exports.getWinners = async (req, res) => {
  try {
    const rows = await sql`
      SELECT w.id, w.user_id, u.name as user_name, w.draw_id, w.match_count,
             w.prize, w.verification_status, w.payment_status, w.proof_url,
             d.date as draw_date, d.mode as draw_mode
      FROM winners w
      LEFT JOIN users u ON u.id = w.user_id
      LEFT JOIN draws d ON d.id = w.draw_id
      ORDER BY d.date DESC, w.prize DESC`;

    res.json({ data: rows });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching winners', error: err?.message });
  }
};

exports.verifyWinnerSubmission = async (req, res) => {
  try {
    const status = req.body?.status;
    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ message: 'Invalid verification status' });
    }

    const result = await sql`
      UPDATE winners
      SET verification_status = ${status}
      WHERE id = ${req.params.id}
      RETURNING id`;

    if (result.length === 0) {
      return res.status(404).json({ message: 'Winner not found' });
    }

    res.json({ message: 'Winner verification updated' });
  } catch (err) {
    res.status(500).json({ message: 'Error updating verification', error: err?.message });
  }
};

exports.markPayoutCompleted = async (req, res) => {
  try {
    const result = await sql`
      UPDATE winners
      SET payment_status = 'paid'
      WHERE id = ${req.params.id}
      RETURNING id`;

    if (result.length === 0) {
      return res.status(404).json({ message: 'Winner not found' });
    }

    res.json({ message: 'Payout marked as completed' });
  } catch (err) {
    res.status(500).json({ message: 'Error updating payout status', error: err?.message });
  }
};

exports.getReportsOverview = async (req, res) => {
  try {
    const [users] = await sql`SELECT COUNT(*) as totalUsers FROM users`;
    const [prizePool] = await sql`SELECT COALESCE(SUM(prize_pool), 0) as totalPrizePool FROM draws`;
    const [charity] = await sql`SELECT COALESCE(SUM(total_raised), 0) as charityContributionTotals FROM charities`;
    const [draws] = await sql`
      SELECT
        COUNT(*) as totalDraws,
        SUM(CASE WHEN mode = 'random' THEN 1 ELSE 0 END) as randomDraws,
        SUM(CASE WHEN mode = 'algorithmic' THEN 1 ELSE 0 END) as algorithmicDraws,
        SUM(CASE WHEN status = 'upcoming' THEN 1 ELSE 0 END) as upcomingDraws,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completedDraws
      FROM draws`;

    res.json({
      data: {
        totalUsers: Number(users.totalUsers || 0),
        totalPrizePool: Number(prizePool.totalPrizePool || 0),
        charityContributionTotals: Number(charity.charityContributionTotals || 0),
        drawStatistics: {
          totalDraws: Number(draws.totalDraws || 0),
          randomDraws: Number(draws.randomDraws || 0),
          algorithmicDraws: Number(draws.algorithmicDraws || 0),
          upcomingDraws: Number(draws.upcomingDraws || 0),
          completedDraws: Number(draws.completedDraws || 0),
        },
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching reports overview', error: err?.message });
  }
};
