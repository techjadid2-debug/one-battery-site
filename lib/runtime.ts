import { env } from "cloudflare:workers";

type RuntimeBindings = {
  DB?: D1Database;
  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_BOT_USERNAME?: string;
  TELEGRAM_WEBHOOK_SECRET?: string;
  SESSION_SECRET?: string;
};

function bindings() {
  return env as unknown as RuntimeBindings;
}

export function getD1() {
  const db = bindings().DB;
  if (!db) throw new Error("D1 binding DB is unavailable");
  return db;
}

export function getOptionalD1() {
  return bindings().DB ?? null;
}

export function getSecret(name: Exclude<keyof RuntimeBindings, "DB">) {
  return bindings()[name]?.trim() ?? "";
}
