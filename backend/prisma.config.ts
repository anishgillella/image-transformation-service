// Prisma configuration
import "dotenv/config";
import path from "path";
import { defineConfig } from "prisma/config";

// SQLite database file path - relative to this config file
const dbPath = path.resolve(__dirname, "prisma/dev.db");

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: `file:${dbPath}`,
  },
});
