const sql = require('../config/db');

exports.getWinnersByDraw = async (drawId) => {
  return await sql`SELECT * FROM winners WHERE draw_id = ${drawId}`;
};

exports.updateWinnerStatus = async (id, status) => {
  await sql`UPDATE winners SET verification_status = ${status} WHERE id = ${id}`;
};