import { existsSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const wasmPath = join(root, "public", "game", "index.wasm");
const partPaths = [0, 1].map((index) =>
  join(root, "public", "game", `index.wasm.part${index}`),
);

for (const partPath of partPaths) {
  if (!existsSync(partPath)) {
    throw new Error(`Missing Godot runtime chunk: ${partPath}`);
  }
}

const shouldWrite =
  !existsSync(wasmPath) ||
  partPaths.some((partPath) => statSync(wasmPath).mtimeMs < statSync(partPath).mtimeMs);

if (shouldWrite) {
  const wasm = Buffer.concat(partPaths.map((partPath) => readFileSync(partPath)));
  const validMagic =
    wasm.length > 4 &&
    wasm[0] === 0x00 &&
    wasm[1] === 0x61 &&
    wasm[2] === 0x73 &&
    wasm[3] === 0x6d;

  if (!validMagic) {
    throw new Error("Reassembled Godot runtime is not a valid WebAssembly module.");
  }

  writeFileSync(wasmPath, wasm);
  console.log(`Prepared Godot WebAssembly runtime (${wasm.length} bytes).`);
} else {
  console.log("Godot WebAssembly runtime is already prepared.");
}
