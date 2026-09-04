import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "./prisma/schema.prisma",
  migrate: {
    // datasource URL for migrate/db push comes from here in Prisma 7
  },
  // Prisma 7 requires datasource.url in config for migrate operations
  // @ts-ignore — type may vary by version; env() reads DATABASE_URL from .env
  datasource: {
    url: env("DATABASE_URL"),
  },
});
