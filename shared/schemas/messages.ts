// ============================================================
// Zod Validation Schemas for WebSocket Messages
// ============================================================

import { z } from "zod";

// --- Settings Schema ---

export const GameSettingsSchema = z.object({
  handSize: z.number().int().min(3).max(20).optional(),
  judgingMode: z.enum(["CZAR", "POPULAR_VOTE"]).optional(),
  winCondition: z.enum(["POINTS", "ROUNDS"]).optional(),
  pointsToWin: z.number().int().min(1).max(50).optional(),
  totalRounds: z.number().int().min(1).max(100).optional(),
  discardEveryNRounds: z.number().int().min(0).max(20).optional(),
  maxDiscards: z.number().int().min(0).max(10).optional(),
  tradesEnabled: z.boolean().optional(),
  minPlayers: z.number().int().min(2).max(20).optional(),
  maxPlayers: z.number().int().min(2).max(20).optional(),
  submissionTimerSeconds: z.number().int().min(0).max(300).optional(),
  judgingTimerSeconds: z.number().int().min(0).max(300).optional(),
  collectionIds: z.array(z.string()).optional(),
});

// --- Client Message Schemas ---

export const ClientMessageSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("CREATE_ROOM"), playerName: z.string().min(1).max(20), settings: GameSettingsSchema.optional() }),
  z.object({ type: z.literal("JOIN_ROOM"), roomCode: z.string().length(6), playerName: z.string().min(1).max(20) }),
  z.object({ type: z.literal("UPDATE_SETTINGS"), settings: GameSettingsSchema }),
  z.object({ type: z.literal("START_GAME") }),
  z.object({ type: z.literal("SUBMIT_CARDS"), cardIds: z.array(z.string()).min(1).max(3) }),
  z.object({ type: z.literal("VOTE"), submissionId: z.string() }),
  z.object({ type: z.literal("CZAR_PICK"), submissionId: z.string() }),
  z.object({ type: z.literal("NEXT_ROUND") }),
  z.object({ type: z.literal("DISCARD_CARDS"), cardIds: z.array(z.string()).min(1).max(10) }),
  z.object({ type: z.literal("OFFER_TRADE"), targetPlayerId: z.string() }),
  z.object({ type: z.literal("TRADE_RESPONSE"), accept: z.boolean() }),
  z.object({ type: z.literal("TRADE_SELECT_CARD"), cardId: z.string() }),
  z.object({ type: z.literal("CANCEL_TRADE") }),
  z.object({ type: z.literal("KICK_PLAYER"), playerId: z.string() }),
  z.object({ type: z.literal("LEAVE_ROOM") }),
  z.object({ type: z.literal("PLAY_AGAIN") }),
  z.object({ type: z.literal("PING") }),
]);

export type ValidatedClientMessage = z.infer<typeof ClientMessageSchema>;
