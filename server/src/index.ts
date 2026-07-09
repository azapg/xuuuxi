// ============================================================
// Qué Xu#$4!! — Bun Server Entry Point
// ============================================================

import { routeRest } from "./api/router";
import {
  handleOpen,
  handleClose,
  handleMessage,
  handleDrain,
} from "./ws/handler";
import type { WsData } from "./ws/broadcaster";
import { GAME_DISPLAY_NAME } from "@xuuuxi/shared";

// --- Initialize DB tables (Drizzle push equivalent at runtime) ---
import { sqlite } from "./db/index";

// Create tables if they don't exist (lightweight migration for dev)
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS collections (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    locale TEXT NOT NULL DEFAULT 'es-419',
    is_default INTEGER NOT NULL DEFAULT 0,
    created_by TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS black_cards (
    id TEXT PRIMARY KEY,
    collection_id TEXT NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    pick INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS white_cards (
    id TEXT PRIMARY KEY,
    collection_id TEXT NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
    text TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS games (
    id TEXT PRIMARY KEY,
    room_code TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    settings TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    finished_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS game_players (
    id TEXT PRIMARY KEY,
    game_id TEXT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    player_name TEXT NOT NULL,
    score INTEGER NOT NULL DEFAULT 0,
    is_host INTEGER NOT NULL DEFAULT 0
  );
`);

// --- Auto-seed if no collections exist ---
import { db } from "./db/index";
import { collections } from "./db/schema";

async function autoSeed(): Promise<void> {
  const existing = await db.select().from(collections).limit(1);
  if (existing.length === 0) {
    console.log("📦 No collections found, running seed...");
    // Dynamic import to run the seed script
    await import("./db/seed");
  }
}

// --- Start Server ---

const PORT = Number(process.env.PORT) || 3001;

const server = Bun.serve<WsData>({
  port: PORT,

  // --- HTTP fetch handler ---
  async fetch(req, server) {
    const url = new URL(req.url);

    // WebSocket upgrade
    if (url.pathname === "/ws") {
      const playerId = url.searchParams.get("playerId") || crypto.randomUUID();

      const success = server.upgrade(req, {
        data: {
          playerId,
          roomCode: null,
        } satisfies WsData,
      });

      if (success) return undefined;
      return new Response("WebSocket upgrade failed", { status: 400 });
    }

    // REST API
    if (url.pathname.startsWith("/api/")) {
      return routeRest(req);
    }

    // Health check
    if (url.pathname === "/health") {
      return new Response(
        JSON.stringify({
          status: "ok",
          game: GAME_DISPLAY_NAME,
          uptime: process.uptime(),
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response("Not Found", { status: 404 });
  },

  // --- WebSocket handlers ---
  websocket: {
    open(ws) {
      handleOpen(ws);
    },
    async message(ws, message) {
      await handleMessage(ws, message as string);
    },
    close(ws) {
      handleClose(ws);
    },
    drain(ws) {
      handleDrain(ws);
    },
    // Increase limits for game state payloads
    maxPayloadLength: 1024 * 1024, // 1MB
    idleTimeout: 120, // 2 minutes
  },
});

// Run auto-seed then print startup
autoSeed()
  .then(() => {
    console.log(`
╔══════════════════════════════════════════════╗
║                                              ║
║   🎴  ${GAME_DISPLAY_NAME} Server             ║
║                                              ║
║   HTTP:  http://localhost:${PORT}              ║
║   WS:    ws://localhost:${PORT}/ws             ║
║                                              ║
╚══════════════════════════════════════════════╝
`);
  })
  .catch((err) => {
    console.error("Failed to auto-seed:", err);
  });

export { server };
