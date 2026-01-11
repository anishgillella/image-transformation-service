// Prisma configuration
import dotenv from "dotenv";
import path from "path";
import { defineConfig } from "prisma/config";

// Load env from workspace root
dotenv.config({ path: path.resolve(__dirname, "../.env") });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Supabase PostgreSQL - uses connection pooler for main URL
    url: process.env.DATABASE_URL!,
    directUrl: process.env.DIRECT_URL,
  },
});
