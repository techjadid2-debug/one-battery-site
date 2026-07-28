import { readSession } from "../../../lib/game-auth";
import { getD1 } from "../../../lib/runtime";

const allowedEvents = new Set([
  "level-loaded", "level-started", "timer-started", "level-restarted", "level-completed",
  "level-failed", "terminal-activated", "checkpoint-saved", "checkpoint-restored",
  "challenge-opened", "referral-shared", "purchase-opened",
]);

function cookieValue(request: Request, name: string) {
  return (request.headers.get("cookie") ?? "").split(";").map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))?.slice(name.length + 1) ?? "";
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { event?: string; level?: number; payload?: Record<string, unknown> };
    const event = body.event?.trim() ?? "";
    if (!allowedEvents.has(event)) return Response.json({ error: "Unsupported event" }, { status: 400 });
    const session = await readSession(request);
    const existingAnonymousId = cookieValue(request, "one_core_anon");
    const anonymousId = existingAnonymousId || crypto.randomUUID();
    const payload = JSON.stringify(body.payload ?? {}).slice(0, 4000);
    await getD1().prepare(`
      INSERT INTO analytics_events (id, user_id, anonymous_id, event_name, level, payload)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      crypto.randomUUID(),
      session?.sub ?? null,
      session ? null : anonymousId,
      event,
      Number.isFinite(Number(body.level)) ? Number(body.level) : null,
      payload,
    ).run();
    const headers: Record<string, string> = { "cache-control": "no-store" };
    if (!existingAnonymousId && !session) {
      headers["set-cookie"] = `one_core_anon=${anonymousId}; Path=/; Secure; SameSite=Lax; Max-Age=2592000`;
    }
    return Response.json({ ok: true }, { headers });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Could not record event" }, { status: 500 });
  }
}
