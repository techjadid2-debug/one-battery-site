import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const runtimePath = join(root, "public", "game", "index.js");
let source = readFileSync(runtimePath, "utf8");

if (!source.includes(".wasm.part${index}")) {
  const original = "loadPromise = preloader.loadPromise(`${loadPath}.wasm`, size, true);";
  const replacement = `const chunkSize = 20 * 1024 * 1024;
\t\t\tconst chunks = [0, 1].map(function (index) {
\t\t\t\tconst trackedSize = index === 0 ? Math.min(chunkSize, size) : Math.max(0, size - chunkSize);
\t\t\t\treturn preloader.loadPromise(\`${"${loadPath}"}.wasm.part\${index}\`, trackedSize);
\t\t\t});
\t\t\tloadPromise = Promise.all(chunks).then(function (buffers) {
\t\t\t\tconst total = buffers.reduce(function (sum, buffer) { return sum + buffer.byteLength; }, 0);
\t\t\t\tconst runtime = new Uint8Array(total);
\t\t\t\tlet offset = 0;
\t\t\t\tbuffers.forEach(function (buffer) {
\t\t\t\t\truntime.set(new Uint8Array(buffer), offset);
\t\t\t\t\toffset += buffer.byteLength;
\t\t\t\t});
\t\t\t\treturn new Response(runtime, { 'headers': [['content-type', 'application/wasm']] });
\t\t\t});`;
  if (!source.includes(original)) throw new Error("Godot runtime load hook was not found.");
  source = source.replace(original, replacement);
  writeFileSync(runtimePath, source);
  console.log("Patched Godot runtime for hosting-safe WebAssembly chunks.");
} else {
  console.log("Godot runtime chunk loader is already patched.");
}
