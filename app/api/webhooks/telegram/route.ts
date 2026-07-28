import { hashLoginCode } from "../../../../lib/game-auth";
import { upsertTelegramUser } from "../../../../lib/game-db";
import { getCatalogItem } from "../../../../lib/catalog";
import { getD1, getSecret } from "../../../../lib/runtime";

type TelegramUser = {
  id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  language_code?: string;
};

type TelegramUpdate = {
  message?: {
    message_id: number;
    text?: string;
    from?: TelegramUser;
    chat?: { id: number };
    successful_payment?: {
      currency: string;
      total_amount: number;
      invoice_payload: string;
      telegram_payment_charge_id: string;
    };
  };
};

async function botCall(method: string, payload: Record<string, unknown>) {
  const token = getSecret("TELEGRAM_BOT_TOKEN");
  if (!token) throw new Error("Telegram bot is not configured");
  const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json() as { ok?: boolean; description?: string };
  if (!data.ok) throw new Error(data.description ?? `Telegram ${method} failed`);
}

export async function POST(request: Request) {
  try {
    const webhookSecret = getSecret("TELEGRAM_WEBHOOK_SECRET");
    if (webhookSecret && request.headers.get("x-telegram-bot-api-secret-token") !== webhookSecret) {
      return Response.json({ error: "Invalid webhook secret" }, { status: 401 });
    }
    const update = await request.json() as TelegramUpdate;
    const message = update.message;
    const from = message?.from;
    const chatId = message?.chat?.id;
    if (!message || !from || !chatId) return Response.json({ ok: true });

    const identity = {
      id: String(from.id),
      username: from.username?.slice(0, 64) ?? null,
      displayName: [from.first_name, from.last_name].filter(Boolean).join(" ").trim() || from.username || `Player ${String(from.id).slice(-4)}`,
      photoUrl: null,
      languageCode: from.language_code?.slice(0, 8) ?? null,
    };
    const user = await upsertTelegramUser(identity);
    const db = getD1();

    if (message.text?.startsWith("/start login_")) {
      const nonce = message.text.slice("/start login_".length).trim();
      const login = await db.prepare("SELECT nonce, expires_at, consumed_at FROM login_codes WHERE nonce = ? LIMIT 1")
        .bind(nonce).first<{ nonce: string; expires_at: number; consumed_at: number | null }>();
      if (!login || login.consumed_at || login.expires_at < Math.floor(Date.now() / 1000)) {
        await botCall("sendMessage", { chat_id: chatId, text: "Login havolasi eskirgan. Saytdan yangi kod so‘rang." });
        return Response.json({ ok: true });
      }
      const code = String(crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000).padStart(6, "0");
      const codeHash = await hashLoginCode(nonce, code);
      await db.prepare("UPDATE login_codes SET code_hash = ?, telegram_id = ? WHERE nonce = ?")
        .bind(codeHash, String(from.id), nonce).run();
      await botCall("sendMessage", {
        chat_id: chatId,
        text: `ONE CORE kirish kodi: ${code}\nKod 10 daqiqa amal qiladi. Uni hech kimga bermang.`,
      });
      return Response.json({ ok: true });
    }

    if (message.successful_payment) {
      const payment = message.successful_payment;
      const payload = JSON.parse(payment.invoice_payload) as { userId?: string; itemId?: string };
      const item = getCatalogItem(payload.itemId ?? "");
      if (!item || payload.userId !== user.id || payment.currency !== "XTR") {
        return Response.json({ error: "Invalid payment payload" }, { status: 400 });
      }
      await db.batch([
        db.prepare(`
          INSERT OR IGNORE INTO orders
            (id, user_id, provider, provider_charge_id, item_id, amount, currency, status)
          VALUES (?, ?, 'telegram_stars', ?, ?, ?, 'XTR', 'paid')
        `).bind(crypto.randomUUID(), user.id, payment.telegram_payment_charge_id, item.id, payment.total_amount),
        db.prepare(`
          INSERT INTO inventory (user_id, item_id, source, quantity)
          VALUES (?, ?, 'telegram_stars', 1)
          ON CONFLICT(user_id, item_id) DO UPDATE SET quantity = MAX(inventory.quantity, 1)
        `).bind(user.id, item.id),
      ]);
      await botCall("sendMessage", { chat_id: chatId, text: `${item.name} inventaringizga qo‘shildi. Rahmat!` });
      return Response.json({ ok: true });
    }

    if (message.text?.startsWith("/paysupport")) {
      await botCall("sendMessage", {
        chat_id: chatId,
        text: "To‘lov bo‘yicha yordam uchun invoice sanasi va xarid nomini shu chatga yuboring. Operator charge ID orqali tekshiradi va zarur bo‘lsa Telegram Stars refund qiladi.",
      });
      return Response.json({ ok: true });
    }

    const origin = new URL(request.url).origin;
    await botCall("sendMessage", {
      chat_id: chatId,
      text: "ONE CORE tayyor. Piko va Atlasni AESdan birga olib chiqing.",
      reply_markup: {
        inline_keyboard: [[{ text: "O‘YINNI OCHISH", web_app: { url: `${origin}/play` } }]],
      },
    });
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Telegram webhook failed" }, { status: 500 });
  }
}
