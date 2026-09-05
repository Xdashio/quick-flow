import { defineConfig, env } from "prisma/config";
import path from "node:path";
import dotenv from "dotenv";

// prisma.config.ts is loaded directly by the Prisma CLI and does NOT
// auto-load .env the way schema-only projects do. Without this, migrate
// deploy/status/generate silently fall back to the hardcoded local default
// below, no matter what DATABASE_URL is set to in .env.
dotenv.config({ path: path.resolve(__dirname, ".env") });

export default defineConfig({
  schema: "./prisma/schema.prisma",
  migrate: {
    seed: "ts-node prisma/seed.ts",
  },
  // Prisma 7 requires datasource.url in config for migrate operations
  // @ts-ignore — type may vary by version; env() reads DATABASE_URL from .env
  datasource: {
    url: process.env.DATABASE_URL ?? "postgresql://pos_user:pos_password@localhost:5432/pos_db",
  },
});