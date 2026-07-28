import { createSession, sessionCookie, verifyTelegramInitData } from "../../../../lib/game-auth";
import { upsertTelegramUser } from "../../../../lib/game-db";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { initData?: string };
    const initData = body.initData?.trim() ?? "";
    if (!initData || initData.length > 16_000) {
      return Response.json({ error: "initData is required" }, { status: 400 });
    }
    const identity = await verifyTelegramInitData(initData);
    const user = await upsertTelegramUser(identity);
    const token = await createSession(user.id, user.telegramId);
    return Response.json(
      { user },
      { headers: { "set-cookie": sessionCookie(token), "cache-control": "no-store" } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Telegram login failed";
    const status = message.includes("configured") || message.includes("D1") ? 503 : 401;
    return Response.json({ error: message }, { status });
  }
}
