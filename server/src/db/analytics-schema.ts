import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

// --- Game Sessions ---
export const gameSessions = sqliteTable("game_sessions", {
  id: text("id").primaryKey(),
  roomCode: text("room_code").notNull(),
  judgingMode: text("judging_mode").notNull(), // "CZAR" | "POPULAR_VOTE"
  winCondition: text("win_condition").notNull(), // "POINTS" | "ROUNDS"
  playerCount: integer("player_count").notNull(),
  totalRounds: integer("total_rounds").notNull(),
  collectionIds: text("collection_ids", { mode: "json" }).notNull(), // array of strings
  winnerName: text("winner_name"),
  startedAt: integer("started_at", { mode: "timestamp_ms" }).notNull(),
  finishedAt: integer("finished_at", { mode: "timestamp_ms" }),
});

// --- Game Session Players ---
export const gameSessionPlayers = sqliteTable("game_session_players", {
  id: text("id").primaryKey(),
  sessionId: text("session_id")
    .notNull()
    .references(() => gameSessions.id, { onDelete: "cascade" }),
  playerName: text("player_name").notNull(),
  finalScore: integer("final_score").notNull().default(0),
  isWinner: integer("is_winner", { mode: "boolean" }).notNull().default(false),
});

// --- Round Results ---
export const roundResults = sqliteTable("round_results", {
  id: text("id").primaryKey(),
  sessionId: text("session_id")
    .notNull()
    .references(() => gameSessions.id, { onDelete: "cascade" }),
  roundNumber: integer("round_number").notNull(),
  blackCardId: text("black_card_id").notNull(), // Reference to black_cards, but not strictly enforced to allow custom cards
  blackCardText: text("black_card_text").notNull(),
  judgingMode: text("judging_mode").notNull(),
  playerCount: integer("player_count").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

// --- Round Submissions ---
export const roundSubmissions = sqliteTable("round_submissions", {
  id: text("id").primaryKey(),
  roundId: text("round_id")
    .notNull()
    .references(() => roundResults.id, { onDelete: "cascade" }),
  playerName: text("player_name").notNull(),
  whiteCardIds: text("white_card_ids", { mode: "json" }).notNull(), // array of strings
  whiteCardTexts: text("white_card_texts", { mode: "json" }).notNull(), // array of strings
  votesReceived: integer("votes_received").notNull().default(0),
  isWinner: integer("is_winner", { mode: "boolean" }).notNull().default(false),
  wasCzarPick: integer("was_czar_pick", { mode: "boolean" }).notNull().default(false),
});

// --- Card Combo Stats (Materialized View / Cache) ---
// We can update this periodically or on every game end
export const cardComboStats = sqliteTable("card_combo_stats", {
  id: text("id").primaryKey(), // e.g. blackCardId_whiteCardId
  blackCardId: text("black_card_id").notNull(),
  whiteCardId: text("white_card_id").notNull(),
  timesPlayedTogether: integer("times_played_together").notNull().default(0),
  timesWonTogether: integer("times_won_together").notNull().default(0),
  winRate: real("win_rate").notNull().default(0),
  lastPlayedAt: integer("last_played_at", { mode: "timestamp_ms" }).notNull(),
});
