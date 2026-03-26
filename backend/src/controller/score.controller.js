const sql = require('../config/db');

let cachedScoreColumns = null;

const getScoreColumns = async () => {
  if (cachedScoreColumns) {
    return cachedScoreColumns;
  }

  const cols = await sql`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'scores' AND table_schema = 'public'`;
  cachedScoreColumns = new Set(cols.map((c) => c.column_name));
  return cachedScoreColumns;
};

const mapScore = (score) => ({
  id: score.id,
  user_id: score.user_id,
  score: score.score,
  course: score.course || 'Unknown Course',
  played_at: score.played_at,
  verified: score.verified || 0,
});

exports.getMyScores = async (req, res) => {
  try {
    const cols = await getScoreColumns();
    const selectFields = ['id', 'user_id', 'score', 'played_at'];
    if (cols.has('course')) selectFields.push('course');
    if (cols.has('verified')) selectFields.push('verified');

    let scores;
    if (cols.has('course') && cols.has('verified')) {
      scores = await sql`
        SELECT id, user_id, score, played_at, course, verified
        FROM scores
        WHERE user_id = ${req.user.id}
        ORDER BY played_at DESC`;
    } else if (cols.has('course')) {
      scores = await sql`
        SELECT id, user_id, score, played_at, course
        FROM scores
        WHERE user_id = ${req.user.id}
        ORDER BY played_at DESC`;
    } else if (cols.has('verified')) {
      scores = await sql`
        SELECT id, user_id, score, played_at, verified
        FROM scores
        WHERE user_id = ${req.user.id}
        ORDER BY played_at DESC`;
    } else {
      scores = await sql`
        SELECT id, user_id, score, played_at
        FROM scores
        WHERE user_id = ${req.user.id}
        ORDER BY played_at DESC`;
    }

    res.json({ data: scores.map(mapScore) });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching scores', error: err?.message });
  }
};

exports.addScore = async (req, res) => {
  try {
    const userId = req.user.id;
    const { score, course, played_at } = req.body;

    if (score < 1 || score > 45) {
      return res.status(400).json({ message: 'Invalid score' });
    }

    const existing = await sql`
      SELECT id FROM scores WHERE user_id = ${userId} ORDER BY played_at ASC`;

    if (existing.length >= 5) {
      await sql`DELETE FROM scores WHERE id = ${existing[0].id}`;
    }

    const playedAt = played_at || new Date();
    const cols = await getScoreColumns();
    let inserted;
    if (cols.has('course') && cols.has('verified')) {
      inserted = await sql`
        INSERT INTO scores (user_id, score, played_at, course, verified)
        VALUES (${userId}, ${score}, ${playedAt}, ${course || 'Unknown Course'}, 0)
        RETURNING id`;
    } else if (cols.has('course')) {
      inserted = await sql`
        INSERT INTO scores (user_id, score, played_at, course)
        VALUES (${userId}, ${score}, ${playedAt}, ${course || 'Unknown Course'})
        RETURNING id`;
    } else if (cols.has('verified')) {
      inserted = await sql`
        INSERT INTO scores (user_id, score, played_at, verified)
        VALUES (${userId}, ${score}, ${playedAt}, 0)
        RETURNING id`;
    } else {
      inserted = await sql`
        INSERT INTO scores (user_id, score, played_at)
        VALUES (${userId}, ${score}, ${playedAt})
        RETURNING id`;
    }

    res.json({
      data: mapScore({
        id: inserted[0]?.id,
        user_id: userId,
        score,
        course: course || 'Unknown Course',
        played_at: playedAt,
        verified: 0,
      }),
    });
  } catch (err) {
    res.status(500).json({ message: 'Error adding score', error: err?.message });
  }
};

exports.updateScore = async (req, res) => {
  try {
    const userId = req.user.id;
    const { score } = req.body;

    await sql`UPDATE scores SET score = ${score} WHERE id = ${req.params.id} AND user_id = ${userId}`;

    res.json({ message: 'Score updated' });
  } catch (err) {
    res.status(500).json({ message: 'Error updating score', error: err?.message });
  }
};

exports.deleteScore = async (req, res) => {
  try {
    const userId = req.user.id;

    await sql`DELETE FROM scores WHERE id = ${req.params.id} AND user_id = ${userId}`;

    res.json({ message: 'Score deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting score', error: err?.message });
  }
};