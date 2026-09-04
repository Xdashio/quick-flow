import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "./backend/prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL ?? "postgresql://pos_user:pos_password@localhost:5432/pos_db",
  },
});
