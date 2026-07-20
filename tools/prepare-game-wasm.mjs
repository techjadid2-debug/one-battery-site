import { brotliDecompressSync } from "node:zlib";
import { existsSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const compressedPath = join(root, "public", "game", "index.wasm.br");
const wasmPath = join(root, "public", "game", "index.wasm");

if (!existsSync(compressedPath)) {
  throw new Error(`Missing compressed Godot runtime: ${compressedPath}`);
}

const shouldWrite =
  !existsSync(wasmPath) || statSync(wasmPath).mtimeMs < statSync(compressedPath).mtimeMs;

if (shouldWrite) {
  const wasm = brotliDecompressSync(readFileSync(compressedPath));
  const validMagic =
    wasm.length > 4 &&
    wasm[0] === 0x00 &&
    wasm[1] === 0x61 &&
    wasm[2] === 0x73 &&
    wasm[3] === 0x6d;

  if (!validMagic) {
    throw new Error("Decompressed Godot runtime is not a valid WebAssembly module.");
  }

  writeFileSync(wasmPath, wasm);
  console.log(`Prepared Godot WebAssembly runtime (${wasm.length} bytes).`);
} else {
  console.log("Godot WebAssembly runtime is already prepared.");
}
