import { defineConfig } from "drizzle-kit";
import path from "path";
import fs from "fs";

function loadEnvFile(...paths: string[]) {
  for (const envPath of paths) {
    try {
      const content = fs.readFileSync(envPath, "utf-8");
      for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eqIdx = trimmed.indexOf("=");
        if (eqIdx === -1) continue;
        const key = trimmed.slice(0, eqIdx).trim();
        const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
        if (key && !process.env[key]) process.env[key] = val;
      }
      return envPath;
    } catch {
      // file not found, try next
    }
  }
  return null;
}

// Try .env in lib/db, then api-server, then project root
loadEnvFile(
  path.join(__dirname, ".env"),
  path.join(__dirname, "../../artifacts/api-server/.env"),
  path.join(__dirname, "../../.env"),
);

if (!process.env.DATABASE_URL) {
  throw new Error(
    "\n\nDATABASE_URL is not set.\n" +
    "Create a file called  .env  inside the  lib/db  folder with:\n\n" +
    "  DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/krishipashu\n\n" +
    "Then run the db:push command again.\n"
  );
}

export default defineConfig({
  schema: "./src/schema",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
