// ============================================================
// Broadcaster — Send personalized state to each player
// ============================================================

import type { Server, ServerWebSocket } from "bun";
import type { ServerMessage } from "@xuuuxi/shared";
import type { GameRoom } from "../game/GameRoom";

export interface WsData {
  playerId: string;
  roomCode: string | null;
}

// Player ID → WebSocket mapping for direct messaging
const playerSockets = new Map<string, ServerWebSocket<WsData>>();

/** Register a socket when a player connects */
export function registerSocket(playerId: string, ws: ServerWebSocket<WsData>): void {
  playerSockets.set(playerId, ws);
}

/** Unregister a socket when a player disconnects */
export function unregisterSocket(playerId: string): void {
  playerSockets.delete(playerId);
}

/** Get the socket for a specific player */
export function getSocket(playerId: string): ServerWebSocket<WsData> | undefined {
  return playerSockets.get(playerId);
}

/**
 * Broadcast personalized game state to every connected player in a room.
 * Each player gets their own view (with their private hand, hidden others' cards).
 */
export function broadcastGameState(room: GameRoom): void {
  for (const [playerId] of room.players) {
    const ws = playerSockets.get(playerId);
    if (!ws) continue;

    try {
      const state = room.getStateForPlayer(playerId);
      const msg: ServerMessage = { type: "GAME_STATE_UPDATE", gameState: state };
      ws.send(JSON.stringify(msg));
    } catch {
      // Player might have been removed between iteration and send
    }
  }
}

/**
 * Send the same message to all connected players in a room.
 */
export function broadcastToRoom(room: GameRoom, message: ServerMessage): void {
  const raw = JSON.stringify(message);
  for (const [playerId] of room.players) {
    const ws = playerSockets.get(playerId);
    if (ws) {
      try {
        ws.send(raw);
      } catch {
        // ignore send errors
      }
    }
  }
}

/**
 * Send a message to a specific player by ID.
 */
export function sendToPlayer(playerId: string, message: ServerMessage): void {
  const ws = playerSockets.get(playerId);
  if (ws) {
    try {
      ws.send(JSON.stringify(message));
    } catch {
      // ignore
    }
  }
}

/** Get the count of connected sockets (monitoring) */
export function getConnectedCount(): number {
  return playerSockets.size;
}
