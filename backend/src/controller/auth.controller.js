const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const sql = require('../config/db');

let cachedUserColumns = null;

const getUserColumns = async () => {
  if (cachedUserColumns) {
    return cachedUserColumns;
  }

  const cols = await sql`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'users' AND table_schema = 'public'`;
  cachedUserColumns = new Set(cols.map((c) => c.column_name));
  return cachedUserColumns;
};

const mapUserForResponse = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role || 'user',
  subscriptionStatus: user.subscription_status || 'inactive',
  subscriptionTier: user.subscription_tier || 'basic',
  charityId: user.charity_id || undefined,
  charityPercentage: Number(user.charity_percentage || 0),
  joinedAt: user.created_at || new Date().toISOString(),
});

exports.register = async (req, res) => {
  try {
    const { name, email, password, charityId } = req.body;

    const existing = await sql`SELECT id FROM users WHERE email = ${email}`;

    if (existing.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const columns = await getUserColumns();
    const insertColumns = ['name', 'email', 'password'];
    const insertValues = [name, email, hashedPassword];

    if (columns.has('charity_id')) {
      insertColumns.push('charity_id');
      insertValues.push(charityId || null);
    }

    if (columns.has('role')) {
      insertColumns.push('role');
      insertValues.push('user');
    }

    let inserted;

    if (columns.has('charity_id') && columns.has('role')) {
      inserted = await sql`
        INSERT INTO users (name, email, password, charity_id, role)
        VALUES (${name}, ${email}, ${hashedPassword}, ${charityId || null}, 'user')
        RETURNING id`;
    } else if (columns.has('charity_id')) {
      inserted = await sql`
        INSERT INTO users (name, email, password, charity_id)
        VALUES (${name}, ${email}, ${hashedPassword}, ${charityId || null})
        RETURNING id`;
    } else if (columns.has('role')) {
      inserted = await sql`
        INSERT INTO users (name, email, password, role)
        VALUES (${name}, ${email}, ${hashedPassword}, 'user')
        RETURNING id`;
    } else {
      inserted = await sql`
        INSERT INTO users (name, email, password)
        VALUES (${name}, ${email}, ${hashedPassword})
        RETURNING id`;
    }

    const newUserId = inserted[0]?.id;

    const newUsers = await sql`SELECT * FROM users WHERE id = ${newUserId}`;
    const newUser = newUsers[0] || {
      id: newUserId,
      name,
      email,
      role: 'user',
      charity_id: charityId || null,
      subscription_status: 'inactive',
      subscription_tier: 'basic',
      charity_percentage: 0,
      created_at: new Date().toISOString(),
    };

    const token = jwt.sign(
      { id: newUserId, role: newUser.role || 'user' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      data: {
        token,
        user: mapUserForResponse(newUser),
      },
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Error registering user', error: err?.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const users = await sql`SELECT * FROM users WHERE email = ${email}`;

    if (users.length === 0) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const user = users[0];

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      data: {
        token,
        user: mapUserForResponse(user),
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Error logging in', error: err?.message });
  }
};

exports.me = async (req, res) => {
  try {
    const users = await sql`SELECT * FROM users WHERE id = ${req.user.id}`;

    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      data: mapUserForResponse(users[0]),
    });
  } catch (err) {
    console.error('Profile error:', err);
    res.status(500).json({ message: 'Error fetching profile', error: err?.message });
  }
};

exports.logout = async (req, res) => {
  res.json({ message: 'Logged out' });
};