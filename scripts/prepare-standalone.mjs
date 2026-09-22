import { access, cp } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = fileURLToPath(new URL("../", import.meta.url));
const buildDir = path.join(root, process.env.PLAYWRIGHT_TEST ? ".next-playwright" : ".next");
const standaloneDir = path.join(buildDir, "standalone");

// Standalone output omits these assets unless a deployment copies them explicitly.
await access(path.join(standaloneDir, "server.js"));
await cp(path.join(root, "public"), path.join(standaloneDir, "public"), { recursive: true });
await cp(path.join(buildDir, "static"), path.join(standaloneDir, path.basename(buildDir), "static"), { recursive: true });
console.log("Standalone public and static assets prepared.");
