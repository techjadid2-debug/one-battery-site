import { createSession, hashLoginCode } from "../../../../lib/game-auth";
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

type TelegramChat = {
  id: number;
  type?: "private" | "group" | "supergroup" | "channel";
  title?: string;
};

type TelegramUpdate = {
  message?: {
    message_id: number;
    text?: string;
    from?: TelegramUser;
    chat?: TelegramChat;
    new_chat_members?: TelegramUser[];
    successful_payment?: {
      currency: string;
      total_amount: number;
      invoice_payload: string;
      telegram_payment_charge_id: string;
    };
  };
  my_chat_member?: {
    chat: TelegramChat;
    from: TelegramUser;
    new_chat_member?: {
      status: string;
      user: TelegramUser;
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
    const origin = new URL(request.url).origin;

    // Handle bot being added to a Telegram group or supergroup
    if (update.my_chat_member) {
      const chat = update.my_chat_member.chat;
      const status = update.my_chat_member.new_chat_member?.status;
      if (["group", "supergroup"].includes(chat.type ?? "") && (status === "member" || status === "administrator")) {
        await botCall("sendMessage", {
          chat_id: chat.id,
          text: `⚡ ONE CORE — Guruh Hamkorlik Missiyasiga Xush Kelibsiz!\n\nPiko va Atlasni avariyaga uchragan AESdan birgalikda olib chiqing!\n\n🎮 2-O‘yinchi Co-op Rejimi:\n- Ikkala robotda alohida batareya bor, lekin quvvati sarflanadi (drain)!\n- Xaritadagi neon batareyalarni terib boring.\n- Bir-biringizga yaqin kelib quvvat ulashishingiz mumkin!\n\n🕹 Buyruqlar:\n/coop yoki /play — Guruhda yangi 2 kishilik o‘yin xonasi ochish\n/solo — Yakkaxon o‘yin (1 Core)\n/help — Qoidalar va boshqaruv`,
          reply_markup: {
            inline_keyboard: [
              [
                { text: "⚡ GURUHDA O‘YIN BOSHLASH (CO-OP)", web_app: { url: `${origin}/play?mode=coop&chat=${chat.id}` } },
              ],
            ],
          },
        });
        return Response.json({ ok: true });
      }
    }

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
    const isGroup = ["group", "supergroup"].includes(message.chat?.type ?? "") || chatId < 0;

    const userSessionToken = await createSession(user.id, user.telegramId);

    // Handle group commands: /coop, /play, /team, /game
    if (isGroup && (message.text?.startsWith("/coop") || message.text?.startsWith("/play") || message.text?.startsWith("/team") || message.text?.startsWith("/game"))) {
      const roomId = `${Math.abs(chatId)}_${Date.now().toString(36).slice(-4)}`;
      try {
        await db.prepare(`
          INSERT INTO coop_rooms (id, chat_id, host_user_id, status)
          VALUES (?, ?, ?, 'waiting')
        `).bind(roomId, String(chatId), user.id).run();
      } catch {
        // Fallback gracefully if database table not yet synced
      }

      await botCall("sendMessage", {
        chat_id: chatId,
        text: `🚨 ONE CORE: 2-O‘YINCHI GURUH MISSİYASI!\n\n👨‍🚀 Tashkilotchi: ${identity.displayName}\n🔑 Xona: #${roomId}\n\n🔋 Qoida: Har bir robotning o‘z batareyasi bor, harakatlanganda quvvat kamayadi! Bosqichlardagi yashil batareyalarni tering va bir-biringizga quvvat ulashing.\n\n👇 Rolingizni tanlab o‘yinga qo‘shiling:`,
        reply_markup: {
          inline_keyboard: [
            [
              { text: "⚡ 1-O‘YINCHI: PIKO (Yengil / Chaqqon)", web_app: { url: `${origin}/play?mode=coop&player=1&room=${roomId}&chat=${chatId}&auth=${userSessionToken}` } },
            ],
            [
              { text: "🤝 2-O‘YINCHI: ATLAS (Og‘ir / Kuchli)", web_app: { url: `${origin}/play?mode=coop&player=2&room=${roomId}&chat=${chatId}&auth=${userSessionToken}` } },
            ],
            [
              { text: "👤 MENING PROFILIM", web_app: { url: `${origin}/profile?auth=${userSessionToken}` } },
            ],
          ],
        },
      });
      return Response.json({ ok: true });
    }

    if (message.text?.startsWith("/help")) {
      await botCall("sendMessage", {
        chat_id: chatId,
        text: `🎮 ONE CORE Boshqaruvi va Rejimlari:\n\n1) SOLO (Yakkaxon: 1 Yadro):\n- Faqat yadro egasi harakatlana oladi.\n- "E" orqali yadroni Piko va Atlas o‘rtasida uzatasiz.\n\n2) 2-PLAYER CO-OP (Guruh / 2 Batareya):\n- P1 (Piko) va P2 (Atlas) bir vaqtda harakatlanadi!\n- Har birining o‘z batareyasi bor, harakatlanganda quvvati sarflanadi.\n- Xaritadagi neon batareyalarni terib quvvatni to‘ldiring.\n- Zaryad tugab qolsa, sherigingiz kelib quvvat ulashishi (jumpstart) mumkin!`,
      });
      return Response.json({ ok: true });
    }

    if (message.text?.startsWith("/profile")) {
      const playerHandle = identity.username ? `@${identity.username}` : identity.displayName;
      await botCall("sendMessage", {
        chat_id: chatId,
        parse_mode: "HTML",
        text: `👤 <b>ONE CORE O‘yinchi Profili</b>\n\nNomi: <b>${identity.displayName}</b>\nUsername: <b>${playerHandle}</b>\nID: <code>${from.id}</code>\n🔋 Zaryad: <b>100% [TO‘LIQ]</b>\n\nQuyidagi tugma orqali to‘liq statistikangiz va inventaringizni ko‘ring:`,
        reply_markup: {
          inline_keyboard: [
            [
              { text: "👤 PROFIL SAHIFASINI OCHISH", web_app: { url: `${origin}/profile?auth=${userSessionToken}` } },
            ],
            [
              { text: "⚡ O‘YINGA KIRISH", web_app: { url: `${origin}/play?auth=${userSessionToken}` } },
            ],
          ],
        },
      });
      return Response.json({ ok: true });
    }

    if (message.text?.startsWith("/start login_")) {
      // Legacy code support, but also provide direct auto-login link!
      const nonce = message.text.slice("/start login_".length).trim();
      const login = await db.prepare("SELECT nonce, expires_at, consumed_at FROM login_codes WHERE nonce = ? LIMIT 1")
        .bind(nonce).first<{ nonce: string; expires_at: number; consumed_at: number | null }>();
      if (login && !login.consumed_at && login.expires_at >= Math.floor(Date.now() / 1000)) {
        const code = String(crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000).padStart(6, "0");
        const codeHash = await hashLoginCode(nonce, code);
        await db.prepare("UPDATE login_codes SET code_hash = ?, telegram_id = ? WHERE nonce = ?")
          .bind(codeHash, String(from.id), nonce).run();
      }
      await botCall("sendMessage", {
        chat_id: chatId,
        parse_mode: "HTML",
        text: `⚡ <b>AVTOMATIK KIBERNETIK TIZIMGA ULANDINGIZ!</b>\n\n👤 O‘yinchi: <b>${identity.username ? "@" + identity.username : identity.displayName}</b>\n\nKod kiritishingiz shart emas, to‘g‘ridan-to‘g‘ri kirish tugmasini bosing:`,
        reply_markup: {
          inline_keyboard: [
            [
              { text: "⚡ AVTO-KIRISH (KODSIZ)", web_app: { url: `${origin}/play?auth=${userSessionToken}` } },
            ],
            [
              { text: "👤 PROFIL SAHIFASI", web_app: { url: `${origin}/profile?auth=${userSessionToken}` } },
            ],
          ],
        },
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

    // Default /start or private message -> Auto-register and provide instant token link & profile
    const playerHandle = identity.username ? `@${identity.username}` : identity.displayName;
    const browserPlayUrl = `${origin}/api/auth/session?auth=${userSessionToken}&next=/play`;
    const welcomeText = `⚡ <b>ONE CORE: KIBERNETIK TIZIMGA XUSH KELIBSIZ!</b>

👤 <b>O‘yinchi:</b> ${playerHandle}
🆔 <b>Telegram ID:</b> <code>${from.id}</code>
🔋 <b>Yadro Quvvati:</b> 100% [TO‘LIQ TAYYOR]
🛡 <b>Rutba:</b> Kibernetik Pioner (Rank 1)
⚙️ <b>Kirish holati:</b> Avtomatik Token Ulandi ✅

🎮 <b>Qurilmangizga mos qulay usulni tanlang:</b>
• 📱 <b>Telefonda:</b> Mini App orqali o‘ynang (telefonni yotiq/landscape holatda tuting)
• 🖥 <b>Kompyuterda:</b> Katta monitor va qulay klaviatura bilan o‘ynash uchun brauzerda oching!`;

    await botCall("sendMessage", {
      chat_id: chatId,
      parse_mode: "HTML",
      text: welcomeText,
      reply_markup: {
        inline_keyboard: [
          [
            { text: "📱 TELEFONDA O‘YNASH (MINI APP)", web_app: { url: `${origin}/play?auth=${userSessionToken}` } },
          ],
          [
            { text: "🖥 KOMPYUTERDA KATTA EKRANDA O‘YNASH ↗", url: browserPlayUrl },
          ],
          [
            { text: "👤 PROFIL VA STATISTIKA", web_app: { url: `${origin}/profile?auth=${userSessionToken}` } },
            { text: "👥 2-O‘YINCHI (CO-OP)", web_app: { url: `${origin}/play?mode=coop&auth=${userSessionToken}` } },
          ],
        ],
      },
    });
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Telegram webhook failed" }, { status: 500 });
  }
}

