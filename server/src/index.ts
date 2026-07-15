// ============================================================
// Qué Xu#$4!! — Bun Server Entry Point
// ============================================================

import { routeRest } from "./api/router";
import {
  handleOpen,
  handleClose,
  handleMessage,
  handleDrain,
  checkTransitions,
} from "./ws/handler";
import type { WsData } from "./ws/broadcaster";
import {
  GAME_DISPLAY_NAME,
  ROOM_INACTIVITY_TIMEOUT_MS,
  ROOM_SWEEP_INTERVAL_MS,
  DISCONNECT_GRACE_PERIOD_MS,
} from "@xuuuxi/shared";
import { roomManager } from "./game/RoomManager";
import { broadcastGameState, broadcastToRoom, getSocket } from "./ws/broadcaster";

// --- Server Tick Loop ---
setInterval(() => {
  const now = Date.now();
  for (const room of roomManager.getAllRooms()) {
    if (room.tick(now)) {
      broadcastGameState(room);
    }
  }
}, 1000);

// --- Stale Room / Ghost Player Sweep ---
setInterval(() => {
  const now = Date.now();

  for (const room of roomManager.getAllRooms()) {
    // End rooms that have had no activity for too long
    if (now - room.lastActivityAt > ROOM_INACTIVITY_TIMEOUT_MS) {
      broadcastToRoom(room, {
        type: "ROOM_DESTROYED",
        reason: "La sala se cerró automáticamente por inactividad.",
      });
      for (const [pid] of room.players) {
        const sock = getSocket(pid);
        if (sock) sock.data.roomCode = null;
      }
      roomManager.destroyRoom(room.code);
      console.log(`⏰ Room ${room.code} auto-closed after inactivity.`);
      continue;
    }

    // Remove players who've been disconnected past the grace period
    for (const [pid, player] of [...room.players]) {
      if (
        player.disconnectedAt !== null &&
        now - player.disconnectedAt > DISCONNECT_GRACE_PERIOD_MS
      ) {
        const playerName = player.name;
        const { hostMigrated, newHostId } = room.removePlayer(pid);

        if (room.players.size === 0) {
          roomManager.destroyRoom(room.code);
          console.log(`🗑️  Room ${room.code} destroyed — last player timed out.`);
          break;
        }

        broadcastToRoom(room, {
          type: "PLAYER_LEFT",
          playerId: pid,
          playerName,
          newHostId,
        });
        checkTransitions(room);
        broadcastGameState(room);
        console.log(`👻 Removed long-disconnected player "${playerName}" from room ${room.code}.`);
      }
    }
  }
}, ROOM_SWEEP_INTERVAL_MS);

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

  CREATE TABLE IF NOT EXISTS game_sessions (
    id TEXT PRIMARY KEY,
    room_code TEXT NOT NULL,
    judging_mode TEXT NOT NULL,
    win_condition TEXT NOT NULL,
    player_count INTEGER NOT NULL,
    total_rounds INTEGER NOT NULL,
    collection_ids TEXT NOT NULL,
    winner_name TEXT,
    started_at INTEGER NOT NULL,
    finished_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS game_session_players (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
    player_name TEXT NOT NULL,
    final_score INTEGER NOT NULL DEFAULT 0,
    is_winner INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS round_results (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
    round_number INTEGER NOT NULL,
    black_card_id TEXT NOT NULL,
    black_card_text TEXT NOT NULL,
    judging_mode TEXT NOT NULL,
    player_count INTEGER NOT NULL,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS round_submissions (
    id TEXT PRIMARY KEY,
    round_id TEXT NOT NULL REFERENCES round_results(id) ON DELETE CASCADE,
    player_name TEXT NOT NULL,
    white_card_ids TEXT NOT NULL,
    white_card_texts TEXT NOT NULL,
    votes_received INTEGER NOT NULL DEFAULT 0,
    is_winner INTEGER NOT NULL DEFAULT 0,
    was_czar_pick INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS card_combo_stats (
    id TEXT PRIMARY KEY,
    black_card_id TEXT NOT NULL,
    white_card_id TEXT NOT NULL,
    times_played_together INTEGER NOT NULL DEFAULT 0,
    times_won_together INTEGER NOT NULL DEFAULT 0,
    win_rate REAL NOT NULL DEFAULT 0,
    last_played_at INTEGER NOT NULL
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
    const { seed } = await import("./db/seed");
    await seed();
  }
}

// --- Start Server ---

const PORT = Number(process.env.PORT) || 3001;

const server = Bun.serve<WsData>({
  port: PORT,
  hostname: "0.0.0.0",

  // --- HTTP fetch handler ---
  async fetch(req, server) {
    const url = new URL(req.url);
    console.log(`[HTTP] ${req.method} ${url.pathname}`);

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

    // Serve static client files in production
    const publicDir = import.meta.dir + "/../../client/dist";
    const filePath = publicDir + (url.pathname === "/" ? "/index.html" : url.pathname);
    const file = Bun.file(filePath);
    
    if (await file.exists()) {
      return new Response(file);
    }
    
    // SPA fallback
    const indexFile = Bun.file(publicDir + "/index.html");
    if (await indexFile.exists()) {
      return new Response(indexFile);
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
