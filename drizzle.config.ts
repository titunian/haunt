import type { Config } from "drizzle-kit";

export default {
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.POSTGRES_URL ?? process.env.POSTGRES_URL_NON_POOLING ?? "",
  },
  casing: "snake_case",
} satisfies Config;
