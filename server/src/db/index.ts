// ============================================================
// Drizzle Client — bun:sqlite
// ============================================================

import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import * as schema from "./schema";

// DATABASE_PATH should point at a mounted persistent volume in production
// (e.g. "/data/sqlite.db" on Railway) — without it, the DB lives on the
// container's ephemeral filesystem and is wiped on every deploy.
const DB_PATH = process.env.DATABASE_PATH || "sqlite.db";
mkdirSync(dirname(DB_PATH), { recursive: true });

const sqlite = new Database(DB_PATH, { create: true });

// Enable WAL mode for better concurrent read/write performance
sqlite.exec("PRAGMA journal_mode = WAL;");
sqlite.exec("PRAGMA foreign_keys = ON;");

export const db = drizzle(sqlite, { schema });
export { sqlite };
