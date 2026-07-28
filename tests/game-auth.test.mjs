import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";

globalThis.__ONE_CORE_TEST_ENV__ = {
  TELEGRAM_BOT_TOKEN: "123456:test-token",
  SESSION_SECRET: "test-session-secret-at-least-long",
};

const auth = await import("../lib/game-auth.ts");

function signedInitData(overrides = {}) {
  const authDate = String(overrides.authDate ?? Math.floor(Date.now() / 1000));
  const user = JSON.stringify({
    id: 99887766,
    first_name: "Piko",
    last_name: "Atlas",
    username: "onecore_player",
    language_code: "uz",
  });
  const fields = { auth_date: authDate, query_id: "test-query", user };
  const dataCheck = Object.entries(fields).sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`).join("\n");
  const secret = createHmac("sha256", "WebAppData").update(globalThis.__ONE_CORE_TEST_ENV__.TELEGRAM_BOT_TOKEN).digest();
  const hash = createHmac("sha256", secret).update(dataCheck).digest("hex");
  return new URLSearchParams({ ...fields, hash }).toString();
}

test("validates Telegram Mini App identity and rejects stale payloads", async () => {
  const identity = await auth.verifyTelegramInitData(signedInitData());
  assert.equal(identity.id, "99887766");
  assert.equal(identity.displayName, "Piko Atlas");
  assert.equal(identity.languageCode, "uz");

  await assert.rejects(
    () => auth.verifyTelegramInitData(signedInitData({ authDate: Math.floor(Date.now() / 1000) - 7200 })),
    /expired/,
  );
});

test("creates and verifies an HttpOnly signed player session", async () => {
  const token = await auth.createSession("user-1", "99887766");
  const cookie = auth.sessionCookie(token);
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /SameSite=Lax/);
  const session = await auth.readSession(new Request("https://example.test/api/me", { headers: { cookie } }));
  assert.equal(session?.sub, "user-1");
  assert.equal(session?.telegramId, "99887766");

  const tampered = token.slice(0, -1) + (token.endsWith("a") ? "b" : "a");
  const invalid = await auth.readSession(new Request("https://example.test/api/me", {
    headers: { cookie: `one_core_session=${tampered}` },
  }));
  assert.equal(invalid, null);
});
