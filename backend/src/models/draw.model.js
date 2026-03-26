const sql = require('../config/db');

const getWinnersForDraw = async (drawId) => {
  const winners = await sql`
    SELECT w.id, w.user_id, u.name as user_name, w.draw_id, w.match_count, w.prize,
           w.verification_status, w.proof_url, w.payment_status
    FROM winners w
    LEFT JOIN users u ON u.id = w.user_id
    WHERE w.draw_id = ${drawId}
    ORDER BY w.match_count DESC, w.prize DESC`;

  return winners.map((w) => ({
    id: String(w.id),
    userId: String(w.user_id),
    userName: w.user_name || 'Unknown',
    drawId: String(w.draw_id),
    matchCount: Number(w.match_count),
    prize: Number(w.prize || 0),
    verificationStatus: w.verification_status || 'pending',
    proofUrl: w.proof_url || undefined,
    paymentStatus: w.payment_status || 'pending',
  }));
};

const enrichDraw = async (draw) => {
  const entryCount = await sql`
    SELECT COUNT(*) as participants FROM draw_entries WHERE draw_id = ${draw.id}`;

  return {
    id: String(draw.id),
    date: draw.date,
    status: draw.status,
    mode: draw.mode,
    prize_pool: Number(draw.prize_pool || 0),
    winning_numbers: draw.winning_numbers,
    participants: Number(entryCount?.[0]?.participants || 0),
    winners: await getWinnersForDraw(draw.id),
  };
};

exports.getAllDraws = async () => {
  const draws = await sql`SELECT * FROM draws ORDER BY date DESC`;
  const enriched = [];
  for (const row of draws) {
    enriched.push(await enrichDraw(row));
  }
  return enriched;
};

exports.getDrawById = async (id) => {
  const result = await sql`SELECT * FROM draws WHERE id = ${id}`;
  if (!result[0]) {
    return null;
  }
  return enrichDraw(result[0]);
};

exports.createDraw = async (draw) => {
  const { date, mode, prize_pool, winning_numbers } = draw;
  const result = await sql`
    INSERT INTO draws (date, mode, prize_pool, winning_numbers) 
    VALUES (${date}, ${mode}, ${prize_pool}, ${JSON.stringify(winning_numbers)}) 
    RETURNING id`;
  return result[0]?.id;
};