import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import path from 'path';

// SQLite database file path
const dbPath = path.resolve(__dirname, '../../prisma/dev.db');

// Create Prisma adapter with the file URL
const adapter = new PrismaLibSql({
  url: `file:${dbPath}`,
});

// Create a single instance of PrismaClient with the adapter
const prisma = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Handle graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export { prisma };
export default prisma;
