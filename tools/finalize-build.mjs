import { rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const sourceOnlyArtifact = join(root, "dist", "client", "game", "index.wasm.br");

await rm(sourceOnlyArtifact, { force: true });
console.log("Removed source-only compressed runtime from the deploy artifact.");
