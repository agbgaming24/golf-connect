const sql = require('../config/db');

exports.createDrawEntry = async (data) => {
  const { user_id, draw_id, scores_snapshot } = data;

  const result = await sql`
    INSERT INTO draw_entries (user_id, draw_id, scores_snapshot)
    VALUES (${user_id}, ${draw_id}, ${JSON.stringify(scores_snapshot)}) 
    RETURNING id`;

  return result[0]?.id;
};

exports.getEntriesByDraw = async (drawId) => {
  return await sql`SELECT * FROM draw_entries WHERE draw_id = ${drawId}`;
};