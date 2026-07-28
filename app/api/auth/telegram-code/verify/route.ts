import { createSession, hashLoginCode, safeEqual, sessionCookie } from "../../../../../lib/game-auth";
import { getGameUser } from "../../../../../lib/game-db";
import { getD1 } from "../../../../../lib/runtime";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { nonce?: string; code?: string };
    const nonce = body.nonce?.trim() ?? "";
    const code = body.code?.trim() ?? "";
    if (!/^[a-f0-9]{32}$/i.test(nonce) || !/^\d{6}$/.test(code)) {
      return Response.json({ error: "Invalid login code" }, { status: 400 });
    }
    const db = getD1();
    const row = await db.prepare(`
      SELECT login_codes.code_hash, login_codes.telegram_id, login_codes.expires_at,
             login_codes.consumed_at, users.id AS user_id
      FROM login_codes
      LEFT JOIN users ON users.telegram_id = login_codes.telegram_id
      WHERE login_codes.nonce = ?
      LIMIT 1
    `).bind(nonce).first<Record<string, unknown>>();
    if (!row || !row.telegram_id || !row.user_id || Number(row.expires_at) < Math.floor(Date.now() / 1000) || row.consumed_at) {
      return Response.json({ error: "Login code expired or is not ready" }, { status: 401 });
    }
    const expected = await hashLoginCode(nonce, code);
    if (!safeEqual(expected, String(row.code_hash))) {
      return Response.json({ error: "Login code is incorrect" }, { status: 401 });
    }
    await db.prepare("UPDATE login_codes SET consumed_at = ? WHERE nonce = ?")
      .bind(Math.floor(Date.now() / 1000), nonce)
      .run();
    const user = await getGameUser(String(row.user_id));
    if (!user) return Response.json({ error: "Player account is unavailable" }, { status: 404 });
    const token = await createSession(user.id, user.telegramId);
    return Response.json(
      { user },
      { headers: { "set-cookie": sessionCookie(token), "cache-control": "no-store" } },
    );
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Telegram code verification failed" }, { status: 500 });
  }
}
