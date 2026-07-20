import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const gameRoot = join(root, "public", "game");
const wasm = readFileSync(join(gameRoot, "index.wasm"));
const chunkSize = 20 * 1024 * 1024;
const parts = [wasm.subarray(0, chunkSize), wasm.subarray(chunkSize)];

if (parts.some((part) => part.length === 0 || part.length > 25 * 1024 * 1024)) {
  throw new Error("Godot runtime chunks must be between 1 byte and 25 MiB.");
}

parts.forEach((part, index) => {
  writeFileSync(join(gameRoot, `index.wasm.part${index}`), part);
});

console.log(`Split Godot runtime into ${parts.map((part) => part.length).join(" + ")} bytes.`);
