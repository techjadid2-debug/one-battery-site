import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const clientRoot = join(root, "dist", "client");
const outputRoot = join(root, "vercel-dist");
const workerUrl = pathToFileURL(join(root, "dist", "server", "index.js"));
workerUrl.searchParams.set("static", Date.now().toString());

await rm(outputRoot, { recursive: true, force: true });
await mkdir(outputRoot, { recursive: true });
await cp(clientRoot, outputRoot, { recursive: true });

const { default: worker } = await import(workerUrl.href);
const env = {
  ASSETS: {
    fetch: async () => new Response("Not found", { status: 404 }),
  },
};
const context = {
  waitUntil() {},
  passThroughOnException() {},
};

async function writeRoute(pathname, target, accept = "text/html") {
  const response = await worker.fetch(
    new Request(`https://one-battery.vercel.app${pathname}`, {
      headers: { accept },
    }),
    env,
    context,
  );

  if (!response.ok) {
    throw new Error(`Failed to prerender ${pathname}: ${response.status}`);
  }

  const body = Buffer.from(await response.arrayBuffer());
  const output = accept === "text/html"
    ? body.toString("utf8").replaceAll("http://localhost:3000", "https://one-battery.vercel.app")
    : body;
  await writeFile(join(outputRoot, target), output);
}

await Promise.all([
  writeRoute("/", "index.html"),
  writeRoute("/play", "play.html"),
  writeRoute("/privacy", "privacy.html"),
  writeRoute("/manifest.webmanifest", "manifest.webmanifest", "application/manifest+json"),
]);

console.log("Prepared Vercel static output for /, /play, /privacy, and the web manifest.");
