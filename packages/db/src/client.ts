import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-serverless";
import { Pool, neonConfig } from "@neondatabase/serverless";
import postgres from "postgres";
import ws from "ws";

import * as schema from "./schema/index.js";

export type Database = ReturnType<typeof createDb>;

export type DbTransaction = Parameters<
  Parameters<Database["transaction"]>[0]
>[0];

let _db: Database | null = null;

function isNeonUrl(url: string) {
  return url.includes("neon.tech") || url.includes("neon.database");
}

export function createDb(connectionString: string) {
  if (isNeonUrl(connectionString)) {
    neonConfig.webSocketConstructor = ws;
    const pool = new Pool({ connectionString });
    return drizzleNeon(pool, { schema });
  }

  const client = postgres(connectionString);
  return drizzlePostgres(client, { schema });
}

export function getDb(connectionString: string) {
  if (!_db) {
    _db = createDb(connectionString);
  }
  return _db;
}
