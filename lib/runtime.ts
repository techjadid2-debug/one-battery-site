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

const inMemoryStore = {
  users: new Map<string, Record<string, unknown>>(),
  rooms: new Map<string, Record<string, unknown>>(),
  inventory: new Map<string, Record<string, unknown>>(),
  progress: new Map<string, Record<string, unknown>>(),
  referrals: new Map<string, Record<string, unknown>>(),
};

function createMemoryD1(): D1Database {
  return {
    prepare(query: string) {
      let boundArgs: unknown[] = [];
      const stmt = {
        bind(...args: unknown[]) {
          boundArgs = args;
          return stmt;
        },
        async first<T = Record<string, unknown>>(): Promise<T | null> {
          const q = query.toLowerCase();
          if (q.includes("from users") && q.includes("telegram_id =")) {
            const tgId = String(boundArgs[0]);
            for (const u of inMemoryStore.users.values()) {
              if (String(u.telegram_id) === tgId) return u as T;
            }
            return null;
          }
          if (q.includes("from users") && q.includes("id =")) {
            const uid = String(boundArgs[0]);
            return (inMemoryStore.users.get(uid) as T) ?? null;
          }
          if (q.includes("select count(*) as total from referrals")) {
            const uid = String(boundArgs[0]);
            let count = 0;
            for (const r of inMemoryStore.referrals.values()) {
              if (String(r.inviter_user_id) === uid) count++;
            }
            return { total: count } as T;
          }
          return null;
        },
        async all<T = Record<string, unknown>>(): Promise<{ results: T[] }> {
          const q = query.toLowerCase();
          if (q.includes("from level_progress")) {
            const uid = String(boundArgs[0]);
            const results: T[] = [];
            for (const p of inMemoryStore.progress.values()) {
              if (String(p.user_id) === uid) results.push(p as T);
            }
            return { results };
          }
          if (q.includes("from inventory")) {
            const uid = String(boundArgs[0]);
            const results: T[] = [];
            for (const item of inMemoryStore.inventory.values()) {
              if (String(item.user_id) === uid) results.push(item as T);
            }
            return { results };
          }
          return { results: [] };
        },
        async run() {
          const q = query.toLowerCase();
          if (q.includes("insert into users")) {
            // boundArgs: id, telegram_id, username, display_name, photo_url, locale, referral_code
            const userObj: Record<string, unknown> = {
              id: boundArgs[0],
              telegram_id: boundArgs[1],
              username: boundArgs[2],
              display_name: boundArgs[3],
              photo_url: boundArgs[4],
              locale: boundArgs[5],
              referral_code: boundArgs[6],
              created_at: new Date().toISOString(),
            };
            inMemoryStore.users.set(String(boundArgs[0]), userObj);
          } else if (q.includes("update users")) {
            // boundArgs: username, displayName, photoUrl, locale, existing.id
            const uid = String(boundArgs[4]);
            const existing = inMemoryStore.users.get(uid) ?? {};
            existing.username = boundArgs[0];
            existing.display_name = boundArgs[1];
            existing.photo_url = boundArgs[2];
            existing.locale = boundArgs[3];
            inMemoryStore.users.set(uid, existing);
          } else if (q.includes("insert into coop_rooms")) {
            const roomObj: Record<string, unknown> = {
              id: boundArgs[0],
              chat_id: boundArgs[1],
              host_user_id: boundArgs[2],
              status: "waiting",
            };
            inMemoryStore.rooms.set(String(boundArgs[0]), roomObj);
          }
          return { success: true };
        },
      };
      return stmt as unknown as D1PreparedStatement;
    },
    async batch(statements: D1PreparedStatement[]) {
      for (const s of statements) {
        await s.run();
      }
      return [];
    },
    async exec() {
      return { count: 0, duration: 0 };
    },
    dump() {
      return Promise.resolve(new ArrayBuffer(0));
    },
  } as D1Database;
}

let fallbackD1Instance: D1Database | null = null;

export function getD1(): D1Database {
  try {
    const db = bindings()?.DB;
    if (db) return db;
  } catch {
    // ignore
  }
  if (!fallbackD1Instance) {
    fallbackD1Instance = createMemoryD1();
  }
  return fallbackD1Instance;
}

export function getOptionalD1(): D1Database | null {
  try {
    return bindings()?.DB ?? fallbackD1Instance ?? null;
  } catch {
    return fallbackD1Instance;
  }
}

export function getSecret(name: Exclude<keyof RuntimeBindings, "DB">) {
  try {
    const b = bindings();
    if (b && b[name]) return b[name]!.trim();
  } catch {
    // ignore
  }
  if (typeof process !== "undefined" && process.env && process.env[name]) {
    return String(process.env[name]).trim();
  }
  return "";
}
