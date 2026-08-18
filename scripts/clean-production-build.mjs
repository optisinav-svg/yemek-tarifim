import { existsSync, rmSync } from "node:fs";
import { resolve } from "node:path";

const projectRoot = resolve(new URL("..", import.meta.url).pathname);
const pathsToClean = [
  resolve(projectRoot, "dist"),
  resolve(projectRoot, "node_modules/react-native-css-interop/.cache"),
];

for (const targetPath of pathsToClean) {
  if (!existsSync(targetPath)) continue;
  rmSync(targetPath, { recursive: true, force: true });
  console.log(`[build] cleaned ${targetPath}`);
}
