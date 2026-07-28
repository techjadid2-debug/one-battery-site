import { getSecret } from "./runtime";

const SESSION_COOKIE = "one_core_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;

export type GameSession = {
  sub: string;
  telegramId: string;
  exp: number;
};

export type TelegramIdentity = {
  id: string;
  username: string | null;
  displayName: string;
  photoUrl: string | null;
  languageCode: string | null;
};

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function toBase64Url(value: string) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/g, "");
}

function fromBase64Url(value: string) {
  const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
  const binary = atob(normalized + "=".repeat((4 - normalized.length % 4) % 4));
  return new TextDecoder().decode(Uint8Array.from(binary, (char) => char.charCodeAt(0)));
}

async function hmacBytes(key: string | Uint8Array, value: string) {
  const keyBytes = typeof key === "string" ? new TextEncoder().encode(key) : key;
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return new Uint8Array(await crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(value)));
}

function constantTimeEqual(left: string, right: string) {
  if (left.length !== right.length) return false;
  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) {
    mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return mismatch === 0;
}

export async function verifyTelegramInitData(raw: string, maxAgeSeconds = 3600): Promise<TelegramIdentity> {
  const botToken = getSecret("TELEGRAM_BOT_TOKEN");
  if (!botToken) throw new Error("Telegram bot is not configured");
  const params = new URLSearchParams(raw);
  const receivedHash = params.get("hash") ?? "";
  const authDate = Number(params.get("auth_date") ?? 0);
  const userJson = params.get("user") ?? "";
  if (!receivedHash || !authDate || !userJson) throw new Error("Telegram login payload is incomplete");
  const now = Math.floor(Date.now() / 1000);
  if (authDate > now + 60 || now - authDate > maxAgeSeconds) throw new Error("Telegram login payload expired");

  const dataCheckString = Array.from(params.entries())
    .filter(([key]) => key !== "hash" && key !== "signature")
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");
  const secretKey = await hmacBytes("WebAppData", botToken);
  const calculatedHash = bytesToHex(await hmacBytes(secretKey, dataCheckString));
  if (!constantTimeEqual(calculatedHash, receivedHash.toLowerCase())) {
    throw new Error("Telegram login signature is invalid");
  }

  const user = JSON.parse(userJson) as {
    id?: number | string;
    username?: string;
    first_name?: string;
    last_name?: string;
    photo_url?: string;
    language_code?: string;
  };
  if (!user.id) throw new Error("Telegram user id is missing");
  const displayName = [user.first_name, user.last_name].filter(Boolean).join(" ").trim()
    || user.username
    || `Player ${String(user.id).slice(-4)}`;
  return {
    id: String(user.id),
    username: user.username?.slice(0, 64) ?? null,
    displayName: displayName.slice(0, 96),
    photoUrl: user.photo_url?.slice(0, 500) ?? null,
    languageCode: user.language_code?.slice(0, 8) ?? null,
  };
}

function sessionSecret() {
  const secret = getSecret("SESSION_SECRET") || getSecret("TELEGRAM_BOT_TOKEN");
  if (!secret) throw new Error("Session signing is not configured");
  return secret;
}

export async function createSession(userId: string, telegramId: string) {
  const payload: GameSession = {
    sub: userId,
    telegramId,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  };
  const encoded = toBase64Url(JSON.stringify(payload));
  const signature = bytesToHex(await hmacBytes(sessionSecret(), encoded));
  return `${encoded}.${signature}`;
}

export async function readSession(request: Request): Promise<GameSession | null> {
  const cookie = request.headers.get("cookie") ?? "";
  const token = cookie.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${SESSION_COOKIE}=`))?.slice(SESSION_COOKIE.length + 1);
  if (!token) return null;
  const [encoded, receivedSignature] = token.split(".");
  if (!encoded || !receivedSignature) return null;
  const calculatedSignature = bytesToHex(await hmacBytes(sessionSecret(), encoded));
  if (!constantTimeEqual(calculatedSignature, receivedSignature)) return null;
  try {
    const session = JSON.parse(fromBase64Url(encoded)) as GameSession;
    if (!session.sub || !session.telegramId || session.exp <= Math.floor(Date.now() / 1000)) return null;
    return session;
  } catch {
    return null;
  }
}

export function sessionCookie(token: string) {
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_TTL_SECONDS}`;
}

export async function hashLoginCode(nonce: string, code: string) {
  return bytesToHex(await hmacBytes(sessionSecret(), `${nonce}:${code}`));
}

export function safeEqual(left: string, right: string) {
  return constantTimeEqual(left, right);
}
