// ============================================================
// RoomManager — Manages all active game rooms
// ============================================================

import { GameRoom } from "./GameRoom";
import type { GameSettings } from "@xuuuxi/shared";
import { ROOM_CODE_CHARS, ROOM_CODE_LENGTH, MAX_ACTIVE_ROOMS } from "@xuuuxi/shared";

export class RoomManager {
  private rooms: Map<string, GameRoom> = new Map();

  /** Create a new room and add the host as first player */
  createRoom(
    hostId: string,
    hostName: string,
    settings?: Partial<GameSettings>
  ): { roomCode: string; room: GameRoom } {
    if (this.rooms.size >= MAX_ACTIVE_ROOMS) {
      throw new Error("Maximum number of active rooms reached.");
    }

    const roomCode = this.generateRoomCode();
    const room = new GameRoom(roomCode, settings);
    room.addPlayer(hostId, hostName, true);
    this.rooms.set(roomCode, room);

    console.log(`🏠 Room ${roomCode} created by "${hostName}" (${hostId})`);
    return { roomCode, room };
  }

  /** Join an existing room */
  joinRoom(code: string, playerId: string, playerName: string): GameRoom {
    const room = this.rooms.get(code.toUpperCase());
    if (!room) {
      throw new Error("Room not found.");
    }
    room.addPlayer(playerId, playerName, false);
    console.log(`👤 "${playerName}" (${playerId}) joined room ${code}`);
    return room;
  }

  /** Get a room by code */
  getRoom(code: string): GameRoom | undefined {
    return this.rooms.get(code.toUpperCase());
  }

  /** Find which room a player is currently in, if any */
  findRoomByPlayerId(playerId: string): GameRoom | undefined {
    for (const room of this.rooms.values()) {
      if (room.players.has(playerId)) {
        return room;
      }
    }
    return undefined;
  }

  /** Remove a player from their room, handle host migration, and destroy empty rooms */
  removePlayerFromRoom(
    code: string,
    playerId: string
  ): { destroyed: boolean; hostMigrated: boolean; newHostId?: string } {
    const room = this.rooms.get(code.toUpperCase());
    if (!room) return { destroyed: false, hostMigrated: false };

    const { hostMigrated, newHostId } = room.removePlayer(playerId);
    console.log(`👋 Player ${playerId} left room ${code}`);

    if (room.players.size === 0) {
      this.destroyRoom(code);
      return { destroyed: true, hostMigrated: false };
    }

    return { destroyed: false, hostMigrated, newHostId };
  }

  /** Destroy a room and free resources */
  destroyRoom(code: string): void {
    this.rooms.delete(code.toUpperCase());
    console.log(`🗑️  Room ${code} destroyed.`);
  }

  /** Generate a unique room code */
  private generateRoomCode(): string {
    const maxAttempts = 100;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      let code = "";
      for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
        code += ROOM_CODE_CHARS[Math.floor(Math.random() * ROOM_CODE_CHARS.length)];
      }
      if (!this.rooms.has(code)) return code;
    }
    throw new Error("Failed to generate a unique room code.");
  }

  /** Number of active rooms (for monitoring) */
  getRoomCount(): number {
    return this.rooms.size;
  }

  /** Get all rooms (for debugging) */
  getAllRooms(): Map<string, GameRoom> {
    return this.rooms;
  }
}

// Singleton instance
export const roomManager = new RoomManager();
