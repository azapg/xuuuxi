// ============================================================
// WebSocket Message Types (Client ↔ Server)
// ============================================================

import type { GameState, GameSettings, PublicPlayer, AnonymousSubmission, RevealedSubmission, TradeState } from "./game";
import type { WhiteCard, BlackCard, CollectionSummary } from "./cards";

// ============================================================
// Client → Server Messages
// ============================================================

export type ClientMessage =
  | { type: "CREATE_ROOM"; playerName: string; settings?: Partial<GameSettings> }
  | { type: "JOIN_ROOM"; roomCode: string; playerName: string }
  | { type: "UPDATE_SETTINGS"; settings: Partial<GameSettings> }
  | { type: "START_GAME" }
  | { type: "SUBMIT_CARDS"; cardIds: string[] }
  | { type: "VOTE"; submissionId: string }
  | { type: "CZAR_PICK"; submissionId: string }
  | { type: "NEXT_ROUND" }
  | { type: "DISCARD_CARDS"; cardIds: string[] }
  | { type: "OFFER_TRADE"; targetPlayerId: string }
  | { type: "TRADE_RESPONSE"; accept: boolean }
  | { type: "TRADE_SELECT_CARD"; cardId: string }
  | { type: "CANCEL_TRADE" }
  | { type: "KICK_PLAYER"; playerId: string }
  | { type: "LEAVE_ROOM" }
  | { type: "PLAY_AGAIN" }
  | { type: "PING" };

// ============================================================
// Server → Client Messages
// ============================================================

export type ServerMessage =
  | { type: "ROOM_CREATED"; roomCode: string; gameState: GameState }
  | { type: "ROOM_JOINED"; gameState: GameState }
  | { type: "GAME_STATE_UPDATE"; gameState: GameState }
  | { type: "PLAYER_JOINED"; player: PublicPlayer }
  | { type: "PLAYER_LEFT"; playerId: string; playerName: string; newHostId?: string }
  | { type: "SETTINGS_UPDATED"; settings: GameSettings }
  | { type: "GAME_STARTED"; gameState: GameState }
  | { type: "ROUND_STARTED"; roundNumber: number; blackCard: BlackCard; judgeId: string; hand: WhiteCard[] }
  | { type: "PLAYER_SUBMITTED"; playerId: string }
  | { type: "ALL_SUBMITTED"; submissions: AnonymousSubmission[] }
  | { type: "PLAYER_VOTED"; playerId: string }
  | { type: "ROUND_RESULT"; revealedSubmissions: RevealedSubmission[]; winnerId: string; winnerName: string; scores: Record<string, number> }
  | { type: "DISCARD_PHASE_STARTED" }
  | { type: "CARDS_DISCARDED"; newCards: WhiteCard[] }
  | { type: "TRADE_OFFERED"; fromPlayerId: string; fromPlayerName: string }
  | { type: "TRADE_ACCEPTED"; trade: TradeState }
  | { type: "TRADE_REJECTED"; byPlayerId: string }
  | { type: "TRADE_PARTNER_READY" }
  | { type: "TRADE_COMPLETE"; givenCardId: string; receivedCard: WhiteCard }
  | { type: "TRADE_CANCELLED"; reason: string }
  | { type: "GAME_OVER"; winnerId: string; winnerName: string; finalScores: Record<string, number>; revealedSubmissions: RevealedSubmission[] }
  | { type: "PLAYER_KICKED"; playerId: string; playerName: string }
  | { type: "YOU_WERE_KICKED" }
  | { type: "ROOM_DESTROYED"; reason: string }
  | { type: "ERROR"; code: string; message: string }
  | { type: "PONG" };

// ============================================================
// Error Codes
// ============================================================

export const ErrorCodes = {
  ROOM_NOT_FOUND: "ROOM_NOT_FOUND",
  ROOM_FULL: "ROOM_FULL",
  GAME_ALREADY_STARTED: "GAME_ALREADY_STARTED",
  NOT_HOST: "NOT_HOST",
  NOT_YOUR_TURN: "NOT_YOUR_TURN",
  INVALID_CARDS: "INVALID_CARDS",
  NOT_ENOUGH_PLAYERS: "NOT_ENOUGH_PLAYERS",
  NOT_IN_ROOM: "NOT_IN_ROOM",
  INVALID_PHASE: "INVALID_PHASE",
  TRADE_NOT_ALLOWED: "TRADE_NOT_ALLOWED",
  TRADE_ALREADY_PENDING: "TRADE_ALREADY_PENDING",
  NAME_TAKEN: "NAME_TAKEN",
  INVALID_MESSAGE: "INVALID_MESSAGE",
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];
