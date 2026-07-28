import { readSession } from "../../../../lib/game-auth";
import { getD1 } from "../../../../lib/runtime";

export async function POST(request: Request) {
  try {
    const session = await readSession(request);
    if (!session) return Response.json({ error: "Telegram login required" }, { status: 401 });
    const body = await request.json() as { code?: string };
    const code = body.code?.trim().toUpperCase() ?? "";
    if (!/^OC[A-Z0-9]{8}$/.test(code)) return Response.json({ error: "Invalid referral code" }, { status: 400 });
    const db = getD1();
    const inviter = await db.prepare("SELECT id FROM users WHERE referral_code = ? LIMIT 1")
      .bind(code).first<{ id: string }>();
    if (!inviter) return Response.json({ error: "Referral code not found" }, { status: 404 });
    if (inviter.id === session.sub) return Response.json({ error: "You cannot invite yourself" }, { status: 409 });
    const existing = await db.prepare("SELECT id FROM referrals WHERE invitee_user_id = ? LIMIT 1")
      .bind(session.sub).first();
    if (existing) return Response.json({ error: "Referral reward was already claimed" }, { status: 409 });
    await db.batch([
      db.prepare(`
        INSERT INTO referrals (id, inviter_user_id, invitee_user_id, status)
        VALUES (?, ?, ?, 'rewarded')
      `).bind(crypto.randomUUID(), inviter.id, session.sub),
      db.prepare(`
        INSERT INTO inventory (user_id, item_id, source, quantity)
        VALUES (?, 'referral_shard', 'referral_inviter', 1)
        ON CONFLICT(user_id, item_id) DO UPDATE SET quantity = inventory.quantity + 1
      `).bind(inviter.id),
      db.prepare(`
        INSERT INTO inventory (user_id, item_id, source, quantity)
        VALUES (?, 'referral_shard', 'referral_invitee', 1)
        ON CONFLICT(user_id, item_id) DO UPDATE SET quantity = inventory.quantity + 1
      `).bind(session.sub),
    ]);
    return Response.json({ ok: true, reward: { itemId: "referral_shard", quantity: 1 } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Could not claim referral" }, { status: 500 });
  }
}
