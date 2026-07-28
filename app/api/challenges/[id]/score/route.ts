import { readSession } from "../../../../../lib/game-auth";
import { getD1 } from "../../../../../lib/runtime";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await readSession(request);
    if (!session) return Response.json({ error: "Telegram login required" }, { status: 401 });
    const { id } = await context.params;
    const body = await request.json() as { timeMs?: number; transferCount?: number; runProof?: string };
    const timeMs = Math.round(Number(body.timeMs));
    const transferCount = Math.round(Number(body.transferCount ?? 0));
    if (!Number.isFinite(timeMs) || timeMs < 1_000 || timeMs > 900_000 || transferCount < 0 || transferCount > 500) {
      return Response.json({ error: "Invalid challenge score" }, { status: 400 });
    }
    const db = getD1();
    const challenge = await db.prepare("SELECT id, starts_at, ends_at FROM weekly_challenges WHERE id = ? LIMIT 1")
      .bind(id).first<{ id: string; starts_at: number; ends_at: number }>();
    const now = Math.floor(Date.now() / 1000);
    if (!challenge || now < challenge.starts_at || now >= challenge.ends_at) {
      return Response.json({ error: "Challenge is not active" }, { status: 404 });
    }
    await db.prepare(`
      INSERT INTO challenge_scores (challenge_id, user_id, time_ms, transfer_count, run_proof, updated_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(challenge_id, user_id) DO UPDATE SET
        time_ms = MIN(challenge_scores.time_ms, excluded.time_ms),
        transfer_count = CASE
          WHEN excluded.time_ms < challenge_scores.time_ms THEN excluded.transfer_count
          ELSE challenge_scores.transfer_count
        END,
        run_proof = CASE
          WHEN excluded.time_ms < challenge_scores.time_ms THEN excluded.run_proof
          ELSE challenge_scores.run_proof
        END,
        updated_at = CURRENT_TIMESTAMP
    `).bind(id, session.sub, timeMs, transferCount, body.runProof?.slice(0, 500) ?? null).run();
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Could not save challenge score" }, { status: 500 });
  }
}
