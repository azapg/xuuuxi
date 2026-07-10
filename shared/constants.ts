// ============================================================
// Shared Constants & Default Configuration
// ============================================================

import type { GameSettings } from "./types/game";

/** Display name for the game */
export const GAME_DISPLAY_NAME = "¡Xuuuxi!";

/** Internal codename */
export const GAME_CODENAME = "xuuuxi";

// --- Room Codes ---

/** Characters used to generate room codes (no ambiguous chars like 0/O, 1/I) */
export const ROOM_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** Length of generated room codes */
export const ROOM_CODE_LENGTH = 6;

// --- Default Game Settings (CAH-inspired) ---

export const DEFAULT_GAME_SETTINGS: GameSettings = {
  handSize: 10,
  judgingMode: "CZAR",
  winCondition: "POINTS",
  pointsToWin: 7,
  totalRounds: 20,
  discardEveryNRounds: 5,
  maxDiscards: 3,
  tradesEnabled: true,
  minPlayers: 3,
  maxPlayers: 10,
  submissionTimerSeconds: 0,
  judgingTimerSeconds: 0,
  discardTimerSeconds: 0,
  collectionIds: [],
  customBlackCards: [],
  customWhiteCards: [],
};

// --- Limits ---

/** Max rooms that can exist simultaneously */
export const MAX_ACTIVE_ROOMS = 100;

/** How long an empty room persists before auto-destroy (ms) */
export const EMPTY_ROOM_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

/** How long a disconnected player stays before being removed (ms) */
export const DISCONNECT_GRACE_PERIOD_MS = 2 * 60 * 1000; // 2 minutes

/** Minimum black cards required to start a game */
export const MIN_BLACK_CARDS = 10;

/** Minimum white cards per player required to start */
export const MIN_WHITE_CARDS_PER_PLAYER = 15;

// --- WebSocket ---

/** Ping interval for keepalive (ms) */
export const WS_PING_INTERVAL_MS = 30_000;

/** Connection timeout if no pong received (ms) */
export const WS_PONG_TIMEOUT_MS = 10_000;
