import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { neon } from "@neondatabase/serverless";
import pg from "pg";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const parsedUrl = new URL(databaseUrl);
const prefersPool =
  process.env.DATABASE_CLIENT === "pg" ||
  ["localhost", "127.0.0.1", "postgres"].includes(parsedUrl.hostname) ||
  ["postgres:", "postgresql:"].includes(parsedUrl.protocol);

let dbInstance;

if (prefersPool) {
  const { Pool } = pg;
  const pool = new Pool({ connectionString: databaseUrl });
  dbInstance = drizzlePg(pool);
} else {
  const sql = neon(databaseUrl);
  dbInstance = drizzleNeon(sql);
}

export const db = dbInstance;
