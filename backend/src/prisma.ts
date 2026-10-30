import { PrismaClient } from '@prisma/client';

const DEFAULT_DATABASE_URL = "mongodb+srv://forgeindiaconnecttech26_db_user:pt7VpOHGxvp720Tc@cluster0.pihka8o.mongodb.net/building_approval?retryWrites=true&w=majority";

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = DEFAULT_DATABASE_URL;
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || DEFAULT_DATABASE_URL
    }
  }
});

export default prisma;
