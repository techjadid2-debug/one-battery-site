import assert from "node:assert/strict";
import { access, readFile, stat } from "node:fs/promises";
import test from "node:test";

async function render(pathname = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${pathname}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${pathname}`, {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the ONE CORE campaign landing page", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>ONE CORE/);
  assert.match(html, /Two robots\. One core\. No one gets left behind\./);
  assert.match(html, /href="\/play"/);
  assert.match(html, /Reactor Wake/);
  assert.match(html, /The Final Latch/);
  assert.match(html, /one-core-trailer\.mp4/);
  assert.match(html, /QANDAY O‘YNALADI/);
  assert.match(html, /how-to-play\.mp4/);
});

test("server-renders the play gate and privacy policy", async () => {
  const [playResponse, privacyResponse] = await Promise.all([
    render("/play"),
    render("/privacy"),
  ]);

  assert.equal(playResponse.status, 200);
  assert.equal(privacyResponse.status, 200);

  const [play, privacy] = await Promise.all([
    playResponse.text(),
    privacyResponse.text(),
  ]);

  assert.match(play, /CAMPAIGN/);
  assert.match(play, /WEEKLY PROTOCOL/);
  assert.match(play, /TELEGRAM • CLOUD SAVE/);
  assert.match(privacy, /played as a guest/);
  assert.match(privacy, /Telegram Stars/);
});

test("ships the complete playable web payload", async () => {
  const root = new URL("../public/", import.meta.url);
  const required = [
    "game/index.html",
    "game/index.js",
    "game/index.pck",
    "game/index.wasm",
    "game/index.wasm.part0",
    "game/index.wasm.part1",
    "media/one-core-trailer.mp4",
    "og.png",
    "sw.js",
  ];

  await Promise.all(required.map((path) => access(new URL(path, root))));

  const [wasm, part0, part1, gameHtml, gameScript, playSource, serviceWorker] = await Promise.all([
    stat(new URL("game/index.wasm", root)),
    stat(new URL("game/index.wasm.part0", root)),
    stat(new URL("game/index.wasm.part1", root)),
    readFile(new URL("game/index.html", root), "utf8"),
    readFile(new URL("game/index.js", root), "utf8"),
    readFile(new URL("../app/play/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("sw.js", root), "utf8"),
  ]);

  assert.ok(wasm.size > 30_000_000);
  assert.equal(part0.size + part1.size, wasm.size);
  assert.ok(part0.size <= 25 * 1024 * 1024);
  assert.ok(part1.size <= 25 * 1024 * 1024);
  assert.match(gameHtml, /<title>ONE CORE<\/title>/);
  assert.match(gameHtml, /<base href="\/game\/">/);
  assert.match(gameHtml, /one-core:ready/);
  assert.match(gameHtml, /one-core:error/);
  assert.equal(new URL("index.js", "https://one-battery.vercel.app/game/").pathname, "/game/index.js");
  assert.match(gameScript, /wasm\.part\$\{index\}/);
  assert.match(playSource, /src=\{`\/game\/\?attempt=\$\{attempt\}\$\{challengeQuery\}`\}/);
  assert.match(playSource, /Yuklanmoqda/);
  assert.match(playSource, /telegram-mini-app/);
  assert.match(playSource, /level-completed/);
  assert.match(serviceWorker, /pathname\.startsWith\("\/game\/"\)/);
  assert.match(serviceWorker, /cache: "no-store"/);
});

test("ships the live-service API and D1 migration contracts", async () => {
  const root = new URL("../", import.meta.url);
  const [schema, migration, play, webhook, game] = await Promise.all([
    readFile(new URL("db/schema.ts", root), "utf8"),
    readFile(new URL("drizzle/0000_greedy_winter_soldier.sql", root), "utf8"),
    readFile(new URL("app/play/page.tsx", root), "utf8"),
    readFile(new URL("app/api/webhooks/telegram/route.ts", root), "utf8"),
    readFile(new URL("../scripts/game.gd", root), "utf8"),
  ]);
  assert.match(schema, /weeklyChallenges/);
  assert.match(schema, /challengeScores/);
  assert.match(schema, /referrals/);
  assert.match(schema, /inventory/);
  assert.match(migration, /CREATE TABLE `level_progress`/);
  assert.match(migration, /CREATE TABLE `weekly_challenges`/);
  assert.match(play, /level-completed/);
  assert.match(play, /referral-shared/);
  assert.match(game, /checkpoint-restored/);
  assert.match(webhook, /successful_payment/);
  assert.match(webhook, /\/paysupport/);
});
