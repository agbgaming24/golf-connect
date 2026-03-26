const sql = require('../config/db');

exports.getUserScores = async (userId) => {
  return await sql`SELECT * FROM scores WHERE user_id = ${userId} ORDER BY played_at DESC`;
};

exports.addScore = async (userId, score, played_at) => {
  const result = await sql`
    INSERT INTO scores (user_id, score, played_at) 
    VALUES (${userId}, ${score}, ${played_at}) 
    RETURNING id`;
  return result[0]?.id;
};

exports.deleteOldestScore = async (userId) => {
  await sql`
    DELETE FROM scores 
    WHERE user_id = ${userId} 
    AND id = (SELECT id FROM scores WHERE user_id = ${userId} ORDER BY played_at ASC LIMIT 1)`;
};