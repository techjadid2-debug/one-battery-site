import { getD1 } from "./runtime";
import type { TelegramIdentity } from "./game-auth";

export type GameUser = {
  id: string;
  telegramId: string;
  username: string | null;
  displayName: string;
  photoUrl: string | null;
  locale: string;
  referralCode: string;
};

function mapUser(row: Record<string, unknown>): GameUser {
  return {
    id: String(row.id),
    telegramId: String(row.telegram_id),
    username: row.username ? String(row.username) : null,
    displayName: String(row.display_name),
    photoUrl: row.photo_url ? String(row.photo_url) : null,
    locale: String(row.locale ?? "uz"),
    referralCode: String(row.referral_code),
  };
}

export async function upsertTelegramUser(identity: TelegramIdentity) {
  const db = getD1();
  const existing = await db.prepare("SELECT * FROM users WHERE telegram_id = ? LIMIT 1")
    .bind(identity.id)
    .first<Record<string, unknown>>();
  if (existing) {
    await db.prepare(`
      UPDATE users
      SET username = ?, display_name = ?, photo_url = ?, locale = ?, last_seen_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(identity.username, identity.displayName, identity.photoUrl, identity.languageCode === "uz" ? "uz" : "en", existing.id).run();
    return mapUser({ ...existing, username: identity.username, display_name: identity.displayName, photo_url: identity.photoUrl });
  }

  const id = crypto.randomUUID();
  const referralCode = `OC${crypto.randomUUID().replaceAll("-", "").slice(0, 8).toUpperCase()}`;
  await db.prepare(`
    INSERT INTO users (id, telegram_id, username, display_name, photo_url, locale, referral_code)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(id, identity.id, identity.username, identity.displayName, identity.photoUrl, identity.languageCode === "uz" ? "uz" : "en", referralCode).run();
  return {
    id,
    telegramId: identity.id,
    username: identity.username,
    displayName: identity.displayName,
    photoUrl: identity.photoUrl,
    locale: identity.languageCode === "uz" ? "uz" : "en",
    referralCode,
  } satisfies GameUser;
}

export async function getGameUser(userId: string) {
  const row = await getD1().prepare("SELECT * FROM users WHERE id = ? LIMIT 1")
    .bind(userId)
    .first<Record<string, unknown>>();
  return row ? mapUser(row) : null;
}
