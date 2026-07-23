// ============================================================
// @xuuuxi/shared — Barrel Export
// ============================================================

// Types
export type {
  BlackCard,
  WhiteCard,
  Collection,
  CollectionWithCards,
  CollectionSummary,
} from "./types/cards";

export type {
  GamePhase,
  JudgingMode,
  WinConditionType,
  GameSettings,
  Player,
  PublicPlayer,
  AnonymousSubmission,
  RevealedSubmission,
  TradeStatus,
  TradeState,
  GameState,
} from "./types/game";

export type {
  ClientMessage,
  ServerMessage,
  RoomSocialEvent,
  ErrorCode,
} from "./types/messages";

export { ErrorCodes } from "./types/messages";

// Schemas
export { ClientMessageSchema, GameSettingsSchema } from "./schemas/messages";
export type { ValidatedClientMessage } from "./schemas/messages";

// Constants
export {
  GAME_DISPLAY_NAME,
  GAME_CODENAME,
  ROOM_CODE_CHARS,
  ROOM_CODE_LENGTH,
  DEFAULT_GAME_SETTINGS,
  MAX_ACTIVE_ROOMS,
  EMPTY_ROOM_TIMEOUT_MS,
  DISCONNECT_GRACE_PERIOD_MS,
  ROOM_INACTIVITY_TIMEOUT_MS,
  ROOM_SWEEP_INTERVAL_MS,
  MIN_BLACK_CARDS,
  MIN_WHITE_CARDS_PER_PLAYER,
  WS_PING_INTERVAL_MS,
  WS_PONG_TIMEOUT_MS,
} from "./constants";
