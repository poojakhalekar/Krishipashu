#!/usr/bin/env node
/**
 * Production build script for Render.com deployment.
 * 1. Builds the Vite frontend
 * 2. Copies the output into api-server/dist/client
 * 3. Builds the API server with esbuild
 */
import { execSync } from "child_process";
import { cpSync, mkdirSync, rmSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.dirname(fileURLToPath(import.meta.url));

function run(cmd, cwd = root) {
  console.log(`\n> ${cmd}`);
  execSync(cmd, { cwd, stdio: "inherit" });
}

// 1. Build the frontend
console.log("\n=== Building Frontend ===");
run("pnpm --filter @workspace/krishipashu-web run build");

// 2. Build the API server
console.log("\n=== Building API Server ===");
run("pnpm --filter @workspace/api-server run build");

// 3. Copy frontend build output into api-server/dist/client
console.log("\n=== Copying frontend into API dist/client ===");
const srcDir = path.join(root, "artifacts", "krishipashu-web", "dist", "public");
const destDir = path.join(root, "artifacts", "api-server", "dist", "client");
rmSync(destDir, { recursive: true, force: true });
mkdirSync(destDir, { recursive: true });
cpSync(srcDir, destDir, { recursive: true });

console.log("\n✅ Production build complete!");
console.log("   Run: node artifacts/api-server/dist/index.mjs");
