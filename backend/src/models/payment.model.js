const sql = require('../config/db');

let cachedPaymentColumns = null;

const getPaymentColumns = async () => {
  if (cachedPaymentColumns) {
    return cachedPaymentColumns;
  }

  const cols = await sql`
    SELECT column_name FROM information_schema.columns 
    WHERE table_name = 'payments' AND table_schema = 'public'`;
  cachedPaymentColumns = new Set(cols.map((c) => c.column_name));
  return cachedPaymentColumns;
};

const hasPaymentColumn = async (columnName) => {
  const cols = await getPaymentColumns();
  return cols.has(columnName);
};

exports.createPayment = async (data) => {
  const { user_id, amount, type, status, stripe_payment_id, charity_id } = data;

  const cols = await getPaymentColumns();
  
  let query = `INSERT INTO payments (user_id, amount, type, status`;
  let valuesList = [user_id, amount, type, status];

  if (cols.has('stripe_payment_id')) {
    query += `, stripe_payment_id`;
    valuesList.push(stripe_payment_id || null);
  }

  if (cols.has('charity_id')) {
    query += `, charity_id`;
    valuesList.push(charity_id || null);
  }

  if (cols.has('created_at')) {
    query += `, created_at`;
  }

  query += `) VALUES `;
  
  const placeholderCount = valuesList.length;
  const placeholders = Array.from({length: placeholderCount}, (_, i) => `$${i + 1}`).join(', ');
  
  if (cols.has('created_at')) {
    query += `(${placeholders}, CURRENT_TIMESTAMP) RETURNING id`;
  } else {
    query += `(${placeholders}) RETURNING id`;
  }

  const result = await sql.unsafe(query, valuesList);
  return result[0]?.id;
};

exports.getUserPayments = async (userId) => {
  return await sql`SELECT * FROM payments WHERE user_id = ${userId} ORDER BY created_at DESC`;
};

exports.getPaymentByStripeId = async (stripePaymentId) => {
  const cols = await getPaymentColumns();
  if (!cols.has('stripe_payment_id')) {
    return null;
  }

  const result = await sql`SELECT * FROM payments WHERE stripe_payment_id = ${stripePaymentId}`;
  return result[0] || null;
};

exports.markCompleted = async ({ userId, stripePaymentId }) => {
  const cols = await getPaymentColumns();

  if (cols.has('stripe_payment_id')) {
    if (cols.has('completed_at')) {
      await sql`UPDATE payments SET status = 'completed', completed_at = CURRENT_TIMESTAMP WHERE stripe_payment_id = ${stripePaymentId}`;
      return;
    }

    await sql`UPDATE payments SET status = 'completed' WHERE stripe_payment_id = ${stripePaymentId}`;
    return;
  }

  await sql`
    UPDATE payments SET status = 'completed' 
    WHERE user_id = ${userId} AND status = 'pending' 
    AND id = (SELECT id FROM payments WHERE user_id = ${userId} AND status = 'pending' ORDER BY created_at DESC LIMIT 1)`;
};

exports.markStatusByStripeIdIfSupported = async ({ stripePaymentId, status }) => {
  const cols = await getPaymentColumns();
  if (!cols.has('stripe_payment_id')) {
    return false;
  }

  await sql`UPDATE payments SET status = ${status} WHERE stripe_payment_id = ${stripePaymentId}`;
  return true;
};

exports.hasPaymentColumn = hasPaymentColumn;