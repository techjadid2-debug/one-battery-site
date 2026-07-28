import { readSession } from "../../../../../lib/game-auth";
import { getCatalogItem } from "../../../../../lib/catalog";
import { getSecret } from "../../../../../lib/runtime";

export async function POST(request: Request) {
  try {
    const session = await readSession(request);
    if (!session) return Response.json({ error: "Telegram login required" }, { status: 401 });
    const body = await request.json() as { itemId?: string };
    const item = getCatalogItem(body.itemId?.trim() ?? "");
    if (!item) return Response.json({ error: "Catalog item not found" }, { status: 404 });
    const botToken = getSecret("TELEGRAM_BOT_TOKEN");
    if (!botToken) return Response.json({ error: "Telegram payments are not configured" }, { status: 503 });
    const invoicePayload = JSON.stringify({ userId: session.sub, itemId: item.id });
    const telegramResponse = await fetch(`https://api.telegram.org/bot${botToken}/createInvoiceLink`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title: item.name,
        description: `ONE CORE ${item.type}`,
        payload: invoicePayload,
        currency: "XTR",
        prices: [{ label: item.name, amount: item.stars }],
      }),
    });
    const telegram = await telegramResponse.json() as { ok?: boolean; result?: string; description?: string };
    if (!telegram.ok || !telegram.result) {
      return Response.json({ error: telegram.description ?? "Telegram invoice failed" }, { status: 502 });
    }
    return Response.json({ invoiceUrl: telegram.result });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Could not create invoice" }, { status: 500 });
  }
}
