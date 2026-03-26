const sql = require('../config/db');

const generateRandomNumbers = () => {
  const numbers = new Set();

  while (numbers.size < 5) {
    numbers.add(Math.floor(Math.random() * 45) + 1);
  }

  return Array.from(numbers);
};

const countMatches = (userScores, winningNumbers) => {
  return userScores.filter(num => winningNumbers.includes(num)).length;
};

const scoreToBallNumber = (score) => {
  const n = Number(score);
  if (Number.isNaN(n)) return null;
  return ((n % 45) + 45) % 45 + 1;
};

const generateAlgorithmicNumbers = async (conn) => {
  const scores = await conn`SELECT score FROM scores ORDER BY played_at DESC LIMIT 500`;

  const freq = new Map();
  for (const r of scores) {
    const ball = scoreToBallNumber(r.score);
    if (!ball) continue;
    freq.set(ball, (freq.get(ball) || 0) + 1);
  }

  const sorted = Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([ball]) => ball);

  const numbers = [];
  for (const ball of sorted) {
    if (!numbers.includes(ball)) {
      numbers.push(ball);
    }
    if (numbers.length === 5) break;
  }

  while (numbers.length < 5) {
    const randomBall = Math.floor(Math.random() * 45) + 1;
    if (!numbers.includes(randomBall)) numbers.push(randomBall);
  }

  return numbers;
};

const getEligibleParticipants = async (conn) => {
  const users = await conn`
    SELECT u.id
    FROM users u
    JOIN subscriptions s ON u.id = s.user_id
    WHERE s.status = 'active'`;

  const participants = [];
  for (const user of users) {
    const scores = await conn`
      SELECT score FROM scores WHERE user_id = ${user.id} ORDER BY played_at DESC LIMIT 5`;

    if (scores.length < 5) continue;

    participants.push({
      userId: user.id,
      scores: scores.map((s) => s.score),
    });
  }

  return participants;
};

const calculateWinners = (participants, winningNumbers, prizePool) => {
  const winnersMap = {
    5: [],
    4: [],
    3: [],
  };

  for (const participant of participants) {
    const matches = countMatches(participant.scores, winningNumbers);
    if (matches >= 3) {
      winnersMap[matches].push(participant.userId);
    }
  }

  const distribution = {
    5: 0.4,
    4: 0.35,
    3: 0.25,
  };

  const payoutByMatch = {
    5: 0,
    4: 0,
    3: 0,
  };

  for (const matchType of [5, 4, 3]) {
    const winners = winnersMap[matchType];
    if (winners.length === 0) continue;

    const totalShare = prizePool * distribution[matchType];
    payoutByMatch[matchType] = totalShare / winners.length;
  }

  return { winnersMap, payoutByMatch };
};

const runDrawInternal = async (mode, options = {}) => {
  const isSimulation = options.simulation === true;
  const prizePool = Number(options.prizePool || 1000);

  try {
    const winningNumbers = mode === 'algorithmic'
      ? await generateAlgorithmicNumbers(sql)
      : generateRandomNumbers();

    const participants = await getEligibleParticipants(sql);
    const { winnersMap, payoutByMatch } = calculateWinners(participants, winningNumbers, prizePool);

    let drawId = null;

    if (!isSimulation) {
      // Use transaction with postgres library
      const transaction = new Promise(async (resolve, reject) => {
        try {
          // Start transaction using the sql transaction method if available, otherwise use raw sql
          const drawResult = await sql`
            INSERT INTO draws (date, status, mode, prize_pool, winning_numbers)
            VALUES (${new Date()}, 'completed', ${mode}, ${prizePool}, ${JSON.stringify(winningNumbers)})
            RETURNING id`;

          drawId = drawResult[0]?.id;

          for (const participant of participants) {
            await sql`
              INSERT INTO draw_entries (user_id, draw_id, scores_snapshot)
              VALUES (${participant.userId}, ${drawId}, ${JSON.stringify(participant.scores)})`;
          }

          for (const matchType of [5, 4, 3]) {
            const winners = winnersMap[matchType];
            if (winners.length === 0) continue;

            for (const userId of winners) {
              await sql`
                INSERT INTO winners
                (user_id, draw_id, match_count, prize, verification_status, payment_status)
                VALUES (${userId}, ${drawId}, ${matchType}, ${payoutByMatch[matchType]}, 'pending', 'pending')`;
            }
          }
          resolve();
        } catch (err) {
          reject(err);
        }
      });

      await transaction;
    }

    return {
      drawId,
      mode,
      simulated: isSimulation,
      winningNumbers,
      participants: participants.length,
      winners: winnersMap,
      payoutByMatch,
      prizePool,
    };
  } catch (err) {
    throw err;
  }
};

exports.runRandomDraw = async () => {
  return runDrawInternal('random');
};

exports.runAlgorithmicDraw = async () => {
  return runDrawInternal('algorithmic');
};

exports.simulateDraw = async (mode = 'random') => {
  return runDrawInternal(mode, { simulation: true });
};
