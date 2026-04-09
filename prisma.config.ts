import { config } from "dotenv";
import { defineConfig } from "prisma/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

config();

export default defineConfig({
  schema: "./prisma/schema.prisma",
  datasource: {
    url: process.env.DIRECT_URL ?? "",
  },
  migrations: {
    seed: "ts-node --project tsconfig.seed.json prisma/seed.ts",
  },
  migrate: {
    async adapter(env) {
      const pool = new Pool({ connectionString: env["DIRECT_URL"] });
      return new PrismaPg(pool);
    },
  },
});
