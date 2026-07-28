import { readSession } from "../../../lib/game-auth";
import { getD1 } from "../../../lib/runtime";

const levelIds = [
  "reactor_wake", "dead_weight", "no_one_left_behind", "shield_cycle", "cable_maze",
  "core_relay", "magnetic_crane", "cooling_failure", "blackout_protocol", "the_final_latch",
] as const;

export async function PUT(request: Request) {
  try {
    const session = await readSession(request);
    if (!session) return Response.json({ error: "Telegram login required for cloud progress" }, { status: 401 });
    const body = await request.json() as {
      event?: string;
      level?: number;
      levelId?: string;
      timeRemaining?: number;
    };
    const level = Number(body.level);
    const levelId = body.levelId && levelIds.includes(body.levelId as typeof levelIds[number])
      ? body.levelId
      : levelIds[level - 1];
    if (!levelId || level < 1 || level > 10) return Response.json({ error: "Invalid level" }, { status: 400 });
    const completed = body.event === "level-completed" ? 1 : 0;
    const attempt = body.event === "level-started" ? 1 : 0;
    const failure = body.event === "level-failed" ? 1 : 0;
    const bestMs = completed ? Math.max(0, Math.min(900_000, Math.round(Number(body.timeRemaining ?? 0) * 1000))) : 0;
    await getD1().prepare(`
      INSERT INTO level_progress (user_id, level_id, completed, best_time_remaining_ms, attempts, failures, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(user_id, level_id) DO UPDATE SET
        completed = MAX(level_progress.completed, excluded.completed),
        best_time_remaining_ms = MAX(level_progress.best_time_remaining_ms, excluded.best_time_remaining_ms),
        attempts = level_progress.attempts + excluded.attempts,
        failures = level_progress.failures + excluded.failures,
        updated_at = CURRENT_TIMESTAMP
    `).bind(session.sub, levelId, completed, bestMs, attempt, failure).run();
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Could not save progress" }, { status: 500 });
  }
}
