import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const standaloneDir = join(root, ".next", "standalone");

if (!existsSync(standaloneDir)) {
  throw new Error("Next standalone output was not found. Is output: 'standalone' enabled?");
}

function copyDirectory(from, to) {
  if (!existsSync(from)) {
    return;
  }

  rmSync(to, { recursive: true, force: true });
  cpSync(from, to, { recursive: true });
}

copyDirectory(join(root, "public"), join(standaloneDir, "public"));

const standaloneNextDir = join(standaloneDir, ".next");
mkdirSync(standaloneNextDir, { recursive: true });
copyDirectory(join(root, ".next", "static"), join(standaloneNextDir, "static"));