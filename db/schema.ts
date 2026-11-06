import { sql } from "drizzle-orm";
import { index, integer, primaryKey, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  telegramId: text("telegram_id").notNull().unique(),
  username: text("username"),
  displayName: text("display_name").notNull(),
  photoUrl: text("photo_url"),
  locale: text("locale").notNull().default("uz"),
  referralCode: text("referral_code").notNull().unique(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  lastSeenAt: text("last_seen_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const loginCodes = sqliteTable("login_codes", {
  nonce: text("nonce").primaryKey(),
  codeHash: text("code_hash").notNull(),
  telegramId: text("telegram_id"),
  expiresAt: integer("expires_at").notNull(),
  consumedAt: integer("consumed_at"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("login_codes_expires_idx").on(table.expiresAt)]);

export const levelProgress = sqliteTable("level_progress", {
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  levelId: text("level_id").notNull(),
  completed: integer("completed", { mode: "boolean" }).notNull().default(false),
  bestTimeRemainingMs: integer("best_time_remaining_ms").notNull().default(0),
  attempts: integer("attempts").notNull().default(0),
  failures: integer("failures").notNull().default(0),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  primaryKey({ columns: [table.userId, table.levelId] }),
  index("level_progress_user_idx").on(table.userId),
]);

export const weeklyChallenges = sqliteTable("weekly_challenges", {
  id: text("id").primaryKey(),
  level: integer("level").notNull(),
  seed: integer("seed").notNull(),
  modifier: text("modifier").notNull(),
  startsAt: integer("starts_at").notNull(),
  endsAt: integer("ends_at").notNull(),
  rewardItemId: text("reward_item_id").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("weekly_challenges_window_idx").on(table.startsAt, table.endsAt)]);

export const challengeScores = sqliteTable("challenge_scores", {
  challengeId: text("challenge_id").notNull().references(() => weeklyChallenges.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  timeMs: integer("time_ms").notNull(),
  transferCount: integer("transfer_count").notNull().default(0),
  runProof: text("run_proof"),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  primaryKey({ columns: [table.challengeId, table.userId] }),
  index("challenge_scores_rank_idx").on(table.challengeId, table.timeMs),
]);

export const referrals = sqliteTable("referrals", {
  id: text("id").primaryKey(),
  inviterUserId: text("inviter_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  inviteeUserId: text("invitee_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("rewarded"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  uniqueIndex("referrals_invitee_unique").on(table.inviteeUserId),
  index("referrals_inviter_idx").on(table.inviterUserId),
]);

export const inventory = sqliteTable("inventory", {
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  itemId: text("item_id").notNull(),
  source: text("source").notNull(),
  quantity: integer("quantity").notNull().default(1),
  acquiredAt: text("acquired_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [primaryKey({ columns: [table.userId, table.itemId] })]);

export const orders = sqliteTable("orders", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  provider: text("provider").notNull(),
  providerChargeId: text("provider_charge_id").notNull().unique(),
  itemId: text("item_id").notNull(),
  amount: integer("amount").notNull(),
  currency: text("currency").notNull(),
  status: text("status").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const analyticsEvents = sqliteTable("analytics_events", {
  id: text("id").primaryKey(),
  userId: text("user_id"),
  anonymousId: text("anonymous_id"),
  eventName: text("event_name").notNull(),
  level: integer("level"),
  payload: text("payload").notNull().default("{}"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("analytics_events_name_idx").on(table.eventName, table.createdAt),
  index("analytics_events_user_idx").on(table.userId),
]);

export const coopRooms = sqliteTable("coop_rooms", {
  id: text("id").primaryKey(),
  chatId: text("chat_id").notNull(),
  hostUserId: text("host_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  guestUserId: text("guest_user_id").references(() => users.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("waiting"),
  level: integer("level").notNull().default(1),
  bestTimeRemainingMs: integer("best_time_remaining_ms").notNull().default(0),
  batteriesCollected: integer("batteries_collected").notNull().default(0),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("coop_rooms_chat_idx").on(table.chatId),
  index("coop_rooms_host_idx").on(table.hostUserId),
]);

