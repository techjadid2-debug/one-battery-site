import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const clientRoot = join(root, "dist", "client");
const outputRoot = join(root, "vercel-dist");
const vercelOutputRoot = join(root, ".vercel", "output");
const vercelStaticRoot = join(vercelOutputRoot, "static");
const vercelFuncRoot = join(vercelOutputRoot, "functions", "api", "[...path].func");

const serverIndexPath = join(root, "dist", "server", "index.js");

// Patch cloudflare:workers import in dist/server/index.js so it can run cleanly in standard Node.js
let serverContent = await readFile(serverIndexPath, "utf8");
if (serverContent.includes('import { env } from "cloudflare:workers";')) {
  serverContent = serverContent.replace(
    'import { env } from "cloudflare:workers";',
    'const env = globalThis.__CF_ENV__ || {};'
  );
  await writeFile(serverIndexPath, serverContent, "utf8");
  console.log("Patched dist/server/index.js for standalone Node.js execution.");
}

const workerUrl = pathToFileURL(serverIndexPath);
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
  writeRoute("/profile", "profile.html"),
  writeRoute("/privacy", "privacy.html"),
  writeRoute("/manifest.webmanifest", "manifest.webmanifest", "application/manifest+json"),
]);

// Prepare .vercel/output for Vercel Build Output API v3
await rm(vercelOutputRoot, { recursive: true, force: true });
await mkdir(vercelStaticRoot, { recursive: true });
await cp(outputRoot, vercelStaticRoot, { recursive: true });

// Create Vercel Serverless Function for API routes
await mkdir(vercelFuncRoot, { recursive: true });
await cp(join(root, "dist", "server"), join(vercelFuncRoot, "server"), { recursive: true });

// Package.json for ESM support in Vercel function
await writeFile(
  join(vercelFuncRoot, "package.json"),
  JSON.stringify({ type: "module" }, null, 2),
  "utf8"
);

// Function config
await writeFile(
  join(vercelFuncRoot, ".vc-config.json"),
  JSON.stringify(
    {
      runtime: "nodejs22.x",
      handler: "index.mjs",
      launcherType: "Nodejs",
      shouldAddHelpers: true,
    },
    null,
    2
  )
);

// Function entry point (Node.js Request/Response -> worker.fetch adapter)
const funcIndexContent = `import { pathToFileURL } from "node:url";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const serverBundleUrl = pathToFileURL(join(__dirname, "server", "index.js"));
const { default: worker } = await import(serverBundleUrl.href);

export default async function handler(req, res) {
  try {
    const protocol = req.headers["x-forwarded-proto"] || "https";
    const host = req.headers["x-forwarded-host"] || req.headers.host || "one-battery.vercel.app";
    const url = new URL(req.url, \`\${protocol}://\${host}\`);

    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (value !== undefined) {
        if (Array.isArray(value)) value.forEach((v) => headers.append(key, v));
        else headers.set(key, value);
      }
    }

    let body = undefined;
    if (req.method !== "GET" && req.method !== "HEAD") {
      const chunks = [];
      for await (const chunk of req) {
        chunks.push(chunk);
      }
      body = Buffer.concat(chunks);
    }

    const webRequest = new Request(url.toString(), {
      method: req.method,
      headers,
      body,
      duplex: "half",
    });

    const env = {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
      TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
      TELEGRAM_BOT_USERNAME: process.env.TELEGRAM_BOT_USERNAME,
      TELEGRAM_WEBHOOK_SECRET: process.env.TELEGRAM_WEBHOOK_SECRET,
      SESSION_SECRET: process.env.SESSION_SECRET,
    };

    const ctx = {
      waitUntil() {},
      passThroughOnException() {},
    };

    const response = await worker.fetch(webRequest, env, ctx);

    res.statusCode = response.status;
    for (const [key, value] of response.headers.entries()) {
      res.setHeader(key, value);
    }

    const resBody = Buffer.from(await response.arrayBuffer());
    res.end(resBody);
  } catch (err) {
    console.error("Vercel Serverless Function Error:", err);
    res.statusCode = 500;
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({ error: err instanceof Error ? err.message : "Internal error" }));
  }
}
`;
await writeFile(join(vercelFuncRoot, "index.mjs"), funcIndexContent, "utf8");

// Config.json for .vercel/output
const configJson = {
  version: 3,
  routes: [
    {
      src: "^/api(?:/(.*))?$",
      dest: "/api/[...path]",
    },
    {
      src: "^/(?:(.+)/)?index(?:\\.html)?/?$",
      headers: {
        Location: "/$1",
      },
      status: 308,
    },
    {
      src: "^/(.*)\\.html/?$",
      headers: {
        Location: "/$1",
      },
      status: 308,
    },
    {
      handle: "filesystem",
    },
    {
      handle: "error",
    },
    {
      status: 404,
      src: "^(?!/api).*$",
      dest: "/404",
    },
  ],
  overrides: {
    "game/index.html": { path: "game/index" },
    "index.html": { path: "index" },
    "play.html": { path: "play" },
    "profile.html": { path: "profile" },
    "privacy.html": { path: "privacy" },
  },
};
await writeFile(join(vercelOutputRoot, "config.json"), JSON.stringify(configJson, null, 2), "utf8");

console.log("Prepared Vercel output for static pages + API Serverless Function.");
