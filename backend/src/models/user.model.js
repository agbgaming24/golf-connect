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

exports.getAllUsers = async () => {
  return await sql`
    SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC`;
};

exports.getUserById = async (id) => {
  const result = await sql`SELECT * FROM users WHERE id = ${id}`;
  return result[0];
};

exports.createUser = async (user) => {
  const { name, email, password } = user;
  const result = await sql`
    INSERT INTO users (name, email, password) 
    VALUES (${name}, ${email}, ${password}) 
    RETURNING id`;
  return result[0]?.id;
};

exports.updateUserCharity = async (userId, charityId) => {
  const userCols = await getUserColumns();

  if (userCols.has('charity_id')) {
    await sql`UPDATE users SET charity_id = ${charityId} WHERE id = ${userId}`;
    return;
  }

  const subs = await sql`
    SELECT id FROM subscriptions WHERE user_id = ${userId} ORDER BY id DESC LIMIT 1`;

  if (subs.length > 0) {
    await sql`UPDATE subscriptions SET charity_id = ${charityId} WHERE id = ${subs[0].id}`;
  }
};