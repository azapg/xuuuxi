// ============================================================
// Game State Types
// ============================================================

import type { BlackCard, WhiteCard } from "./cards";

// --- Enums ---

export type GamePhase =
  | "LOBBY"
  | "PLAYING"
  | "JUDGING"
  | "ROUND_RESULT"
  | "DISCARD_PHASE"
  | "GAME_OVER";

export type JudgingMode = "CZAR" | "POPULAR_VOTE";

export type WinConditionType = "POINTS" | "ROUNDS";

// --- Settings ---

/** All game settings — fully configurable, no hardcoded values */
export interface GameSettings {
  /** Number of white cards dealt to each player */
  handSize: number;
  /** "CZAR" = rotating judge picks winner, "POPULAR_VOTE" = everyone votes */
  judgingMode: JudgingMode;
  /** How the game ends */
  winCondition: WinConditionType;
  /** Points needed to win (if winCondition = "POINTS") */
  pointsToWin: number;
  /** Total rounds to play (if winCondition = "ROUNDS") */
  totalRounds: number;
  /** Every N rounds, trigger discard phase. 0 = disabled. */
  discardEveryNRounds: number;
  /** Max cards a player can discard during discard phase */
  maxDiscards: number;
  /** Allow 1:1 trades between players */
  tradesEnabled: boolean;
  /** Minimum players to start */
  minPlayers: number;
  /** Maximum players in the room */
  maxPlayers: number;
  /** Seconds for card submission phase. 0 = no timer. */
  submissionTimerSeconds: number;
  /** Seconds for judging phase. 0 = no timer. */
  judgingTimerSeconds: number;
  /** Seconds for discard phase. 0 = no timer. */
  discardTimerSeconds: number;
  /** IDs of collections to use in this game */
  collectionIds: string[];
  /** Custom black cards added for this specific game only */
  customBlackCards: { text: string; pick: number }[];
  /** Custom white cards added for this specific game only */
  customWhiteCards: { text: string }[];
}

// --- Player ---

export interface Player {
  id: string;
  name: string;
  score: number;
  /** Only visible to the player themselves */
  hand: WhiteCard[];
  isHost: boolean;
  isJudge: boolean;
  isConnected: boolean;
  hasSubmitted: boolean;
  hasVoted: boolean;
}

/** Player info visible to OTHER players (hand hidden) */
export interface PublicPlayer {
  id: string;
  name: string;
  score: number;
  isHost: boolean;
  isJudge: boolean;
  isConnected: boolean;
  hasSubmitted: boolean;
  hasVoted: boolean;
}

// --- Submissions ---

/** An anonymized submission during judging */
export interface AnonymousSubmission {
  /** Opaque ID for voting — NOT the player ID */
  submissionId: string;
  cards: WhiteCard[];
}

/** A revealed submission after judging */
export interface RevealedSubmission extends AnonymousSubmission {
  playerId: string;
  playerName: string;
  votes: number;
  isWinner: boolean;
}

// --- Trade ---

export type TradeStatus =
  | "IDLE"
  | "PENDING_OFFER"
  | "PENDING_ACCEPTANCE"
  | "SELECTING_CARDS"
  | "COMPLETE"
  | "REJECTED";

export interface TradeState {
  status: TradeStatus;
  /** Player who initiated the trade */
  fromPlayerId: string | null;
  /** Player who received the offer */
  toPlayerId: string | null;
  /** Whether fromPlayer has selected their card */
  fromPlayerReady: boolean;
  /** Whether toPlayer has selected their card */
  toPlayerReady: boolean;
}

// --- Game State (sent to client) ---

/** Full game state as seen by a specific player */
export interface GameState {
  roomCode: string;
  phase: GamePhase;
  settings: GameSettings;
  /** The viewing player's full info (with hand) */
  me: Player;
  /** All players' public info (hands hidden) */
  players: PublicPlayer[];
  roundNumber: number;
  /** Current black card in play */
  currentBlackCard: BlackCard | null;
  /** Anonymized submissions (during JUDGING phase) */
  submissions: AnonymousSubmission[];
  /** Revealed submissions (during ROUND_RESULT phase) */
  revealedSubmissions: RevealedSubmission[];
  /** Active trade state for this player, if any */
  trade: TradeState | null;
  /** Whether it's discard phase for this player */
  canDiscard: boolean;
  /** Cards remaining in draw pile */
  cardsRemaining: number;
}
