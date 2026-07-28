import { getD1 } from "../../../../lib/runtime";

function currentWeek(now = new Date()) {
  const utcDay = now.getUTCDay() || 7;
  const startsAt = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - utcDay + 1) / 1000;
  const endsAt = startsAt + 7 * 24 * 60 * 60;
  const weekKey = new Date(startsAt * 1000).toISOString().slice(0, 10);
  const numericSeed = Number(weekKey.replaceAll("-", ""));
  const modifiers = ["transfer_limit", "critical_timer", "no_restart", "precision_route"];
  return {
    id: `weekly_${weekKey}`,
    level: numericSeed % 10 + 1,
    seed: numericSeed,
    modifier: modifiers[numericSeed % modifiers.length],
    startsAt,
    endsAt,
    rewardItemId: `weekly_badge_${weekKey}`,
  };
}

export async function GET() {
  try {
    const challenge = currentWeek();
    const db = getD1();
    await db.prepare(`
      INSERT OR IGNORE INTO weekly_challenges (id, level, seed, modifier, starts_at, ends_at, reward_item_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      challenge.id,
      challenge.level,
      challenge.seed,
      challenge.modifier,
      challenge.startsAt,
      challenge.endsAt,
      challenge.rewardItemId,
    ).run();
    const leaderboard = await db.prepare(`
      SELECT challenge_scores.time_ms, challenge_scores.transfer_count,
             users.display_name, users.photo_url
      FROM challenge_scores
      JOIN users ON users.id = challenge_scores.user_id
      WHERE challenge_scores.challenge_id = ?
      ORDER BY challenge_scores.time_ms ASC
      LIMIT 10
    `).bind(challenge.id).all();
    return Response.json({ challenge, leaderboard: leaderboard.results }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Could not load weekly challenge" }, { status: 500 });
  }
}
