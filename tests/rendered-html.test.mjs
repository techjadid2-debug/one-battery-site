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

  assert.match(play, /START \/ BOSHLASH/);
  assert.match(play, /LANDSCAPE RECOMMENDED/);
  assert.match(play, /KEYBOARD • TOUCH • GAMEPAD/);
  assert.match(privacy, /does not require an account/);
  assert.match(privacy, /no advertising, third-party trackers/);
});

test("ships the complete playable web payload", async () => {
  const root = new URL("../public/", import.meta.url);
  const required = [
    "game/index.html",
    "game/index.js",
    "game/index.pck",
    "game/index.wasm",
    "game/index.wasm.br",
    "media/one-core-trailer.mp4",
    "og.png",
    "sw.js",
  ];

  await Promise.all(required.map((path) => access(new URL(path, root))));

  const [wasm, compressed, gameHtml] = await Promise.all([
    stat(new URL("game/index.wasm", root)),
    stat(new URL("game/index.wasm.br", root)),
    readFile(new URL("game/index.html", root), "utf8"),
  ]);

  assert.ok(wasm.size > 30_000_000);
  assert.ok(compressed.size < wasm.size);
  assert.match(gameHtml, /<title>ONE CORE<\/title>/);
});
