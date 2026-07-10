// ============================================================
// Drizzle SQLite Schema
// ============================================================

import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

// --- Collections ---

export const collections = sqliteTable("collections", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  locale: text("locale").notNull().default("es-419"),
  isDefault: integer("is_default", { mode: "boolean" }).notNull().default(false),
  createdBy: text("created_by"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

// --- Black Cards (prompts) ---

export const blackCards = sqliteTable("black_cards", {
  id: text("id").primaryKey(),
  collectionId: text("collection_id")
    .notNull()
    .references(() => collections.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
  pick: integer("pick").notNull().default(1),
});

// --- White Cards (responses) ---

export const whiteCards = sqliteTable("white_cards", {
  id: text("id").primaryKey(),
  collectionId: text("collection_id")
    .notNull()
    .references(() => collections.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
});

// --- Games ---

export const games = sqliteTable("games", {
  id: text("id").primaryKey(),
  roomCode: text("room_code").notNull(),
  status: text("status").notNull().default("active"),
  settings: text("settings", { mode: "json" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  finishedAt: integer("finished_at", { mode: "timestamp_ms" }),
});

// --- Game Players ---

export const gamePlayers = sqliteTable("game_players", {
  id: text("id").primaryKey(),
  gameId: text("game_id")
    .notNull()
    .references(() => games.id, { onDelete: "cascade" }),
  playerName: text("player_name").notNull(),
  score: integer("score").notNull().default(0),
  isHost: integer("is_host", { mode: "boolean" }).notNull().default(false),
});

export * from "./analytics-schema";
