import { rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const sourceOnlyArtifacts = ["index.wasm", "index.wasm.br"].map((file) =>
  join(root, "dist", "client", "game", file),
);

await Promise.all(sourceOnlyArtifacts.map((file) => rm(file, { force: true })));
console.log("Removed source-only monolithic runtimes from the deploy artifact.");
