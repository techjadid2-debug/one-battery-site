import { readSession } from "../../../lib/game-auth";
import { getGameUser } from "../../../lib/game-db";
import { getD1, getSecret } from "../../../lib/runtime";

export async function GET(request: Request) {
  try {
    const session = await readSession(request);
    const botUsername = getSecret("TELEGRAM_BOT_USERNAME").replace(/^@/, "");
    if (!session) return Response.json({ user: null, progress: [], inventory: [], referralCount: 0, botUsername }, { headers: { "cache-control": "no-store" } });
    const user = await getGameUser(session.sub);
    if (!user) return Response.json({ user: null }, { status: 401 });
    const db = getD1();
    const [progress, inventory, referrals] = await Promise.all([
      db.prepare("SELECT level_id, completed, best_time_remaining_ms, attempts, failures FROM level_progress WHERE user_id = ? ORDER BY level_id")
        .bind(user.id).all(),
      db.prepare("SELECT item_id, source, quantity, acquired_at FROM inventory WHERE user_id = ? ORDER BY acquired_at DESC")
        .bind(user.id).all(),
      db.prepare("SELECT COUNT(*) AS total FROM referrals WHERE inviter_user_id = ?")
        .bind(user.id).first<{ total: number }>(),
    ]);
    return Response.json({
      user,
      progress: progress.results,
      inventory: inventory.results,
      referralCount: Number(referrals?.total ?? 0),
      botUsername,
    }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Could not load profile" }, { status: 500 });
  }
}
