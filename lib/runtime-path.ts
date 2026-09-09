import path from "node:path";

/** Directory containing the deployed application data. */
export function applicationRoot(): string {
  return process.env.APP_ROOT ?? process.env.INIT_CWD ?? process.env.PWD ?? process.cwd();
}

export function resolveApplicationPath(relativePath: string): string {
  return path.resolve(applicationRoot(), relativePath);
}