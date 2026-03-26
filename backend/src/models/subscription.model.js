const sql = require('../config/db');

exports.getUserSubscription = async (userId) => {
  const result = await sql`SELECT * FROM subscriptions WHERE user_id = ${userId}`;
  return result[0];
};

exports.createSubscription = async (data) => {
  const { user_id, plan, status, renewal_date, charity_id, charity_percentage } = data;

  const result = await sql`
    INSERT INTO subscriptions 
    (user_id, plan, status, renewal_date, charity_id, charity_percentage)
    VALUES (${user_id}, ${plan}, ${status}, ${renewal_date}, ${charity_id}, ${charity_percentage}) 
    RETURNING id`;

  return result[0]?.id;
};

exports.updateSubscriptionStatus = async (userId, status) => {
  await sql`UPDATE subscriptions SET status = ${status} WHERE user_id = ${userId}`;
};