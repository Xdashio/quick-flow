import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "./backend/prisma/schema.prisma",
  migrate: {
    seed: "ts-node ./backend/prisma/seed.ts",
  },
  datasource: {
    url: process.env.DATABASE_URL ?? "postgresql://pos_user:pos_password@localhost:5432/pos_db",
  },
});
