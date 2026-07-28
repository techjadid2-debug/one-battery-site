import { getD1, getSecret } from "../../../../../lib/runtime";

export async function POST() {
  try {
    const botUsername = getSecret("TELEGRAM_BOT_USERNAME").replace(/^@/, "");
    if (!botUsername) return Response.json({ error: "Telegram bot is not configured" }, { status: 503 });
    const nonce = crypto.randomUUID().replaceAll("-", "");
    const expiresAt = Math.floor(Date.now() / 1000) + 600;
    await getD1().prepare(`
      INSERT INTO login_codes (nonce, code_hash, expires_at)
      VALUES (?, '', ?)
    `).bind(nonce, expiresAt).run();
    return Response.json({
      nonce,
      deepLink: `https://t.me/${botUsername}?start=login_${nonce}`,
      expiresAt,
    });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Could not start Telegram login" }, { status: 500 });
  }
}
