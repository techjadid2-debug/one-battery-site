import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const htmlPath = join(root, "public", "game", "index.html");
let html = readFileSync(htmlPath, "utf8");

if (!html.includes('<base href="/game/">')) {
  html = html.replace('<meta charset="utf-8">', '<meta charset="utf-8">\n\t\t<base href="/game/">');
}

if (!html.includes("type: 'one-core:error'")) {
  html = html.replace(
    "\t\tconsole.error(err);\n\t\tif (err instanceof Error)",
    "\t\tconsole.error(err);\n\t\twindow.parent.postMessage({ type: 'one-core:error', message: err instanceof Error ? err.message : String(err) }, '*');\n\t\tif (err instanceof Error)",
  );
}

if (!html.includes("current: 1, total: 100")) {
  html = html.replace(
    "\t\tsetStatusMode('progress');\n\t\tengine.startGame({",
    "\t\tsetStatusMode('progress');\n\t\twindow.parent.postMessage({ type: 'one-core:loading', current: 1, total: 100 }, '*');\n\t\tengine.startGame({",
  );
}

if (!html.includes("current: current, total: total")) {
  html = html.replace(
    "\t\t\t'onProgress': function (current, total) {\n",
    "\t\t\t'onProgress': function (current, total) {\n\t\t\t\twindow.parent.postMessage({ type: 'one-core:loading', current: current, total: total }, '*');\n",
  );
}

if (!html.includes("type: 'one-core:ready'")) {
  html = html.replace(
    "\t\t\tsetStatusMode('hidden');\n\t\t}, displayFailureNotice);",
    "\t\t\tsetStatusMode('hidden');\n\t\t\twindow.parent.postMessage({ type: 'one-core:ready' }, '*');\n\t\t}, displayFailureNotice);",
  );
}

writeFileSync(htmlPath, html);
console.log("Patched Godot HTML with stable /game/ base and loader bridge.");
