// ============================================================
// WebSocket Message Handler
// ============================================================

import type { ServerWebSocket } from "bun";
import { ClientMessageSchema, ErrorCodes } from "@xuuuxi/shared";
import type { ServerMessage, BlackCard, WhiteCard } from "@xuuuxi/shared";
import { roomManager } from "../game/RoomManager";
import { GameError } from "../game/GameRoom";
import type { GameRoom } from "../game/GameRoom";
import {
  broadcastGameState,
  broadcastToRoom,
  sendToPlayer,
  registerSocket,
  unregisterSocket,
  type WsData,
} from "./broadcaster";
import { db } from "../db/index";
import { blackCards, whiteCards } from "../db/schema";
import { eq, inArray } from "drizzle-orm";

// ---- WebSocket lifecycle ----

export function handleOpen(ws: ServerWebSocket<WsData>): void {
  const { playerId } = ws.data;
  registerSocket(playerId, ws);
  console.log(`🔌 WS open: ${playerId}`);
}

export function handleClose(ws: ServerWebSocket<WsData>): void {
  const { playerId, roomCode } = ws.data;
  unregisterSocket(playerId);
  console.log(`❌ WS close: ${playerId}`);

  if (roomCode) {
    // Mark player as disconnected but don't remove immediately
    const room = roomManager.getRoom(roomCode);
    if (room) {
      const player = room.players.get(playerId);
      if (player) {
        player.isConnected = false;
        broadcastGameState(room);
      }
    }
  }
}

export function handleDrain(ws: ServerWebSocket<WsData>): void {
  // Backpressure relief — nothing special needed
}

export async function handleMessage(
  ws: ServerWebSocket<WsData>,
  raw: string | Buffer
): Promise<void> {
  const text = typeof raw === "string" ? raw : raw.toString();

  // Parse JSON
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    sendError(ws, ErrorCodes.INVALID_MESSAGE, "Invalid JSON.");
    return;
  }

  // Validate with Zod
  const result = ClientMessageSchema.safeParse(json);
  if (!result.success) {
    sendError(ws, ErrorCodes.INVALID_MESSAGE, result.error.issues[0]?.message ?? "Invalid message.");
    return;
  }

  const msg = result.data;

  try {
    switch (msg.type) {
      case "PING":
        ws.send(JSON.stringify({ type: "PONG" } satisfies ServerMessage));
        break;

      case "CREATE_ROOM":
        await handleCreateRoom(ws, msg.playerName, msg.settings);
        break;

      case "JOIN_ROOM":
        await handleJoinRoom(ws, msg.roomCode, msg.playerName);
        break;

      case "UPDATE_SETTINGS":
        handleUpdateSettings(ws, msg.settings);
        break;

      case "START_GAME":
        await handleStartGame(ws);
        break;

      case "SUBMIT_CARDS":
        handleSubmitCards(ws, msg.cardIds);
        break;

      case "CZAR_PICK":
        handleCzarPick(ws, msg.submissionId);
        break;

      case "VOTE":
        handleVote(ws, msg.submissionId);
        break;

      case "NEXT_ROUND":
        handleNextRound(ws);
        break;

      case "DISCARD_CARDS":
        handleDiscardCards(ws, msg.cardIds);
        break;

      case "OFFER_TRADE":
        handleOfferTrade(ws, msg.targetPlayerId);
        break;

      case "TRADE_RESPONSE":
        handleTradeResponse(ws, msg.accept);
        break;

      case "TRADE_SELECT_CARD":
        handleTradeSelectCard(ws, msg.cardId);
        break;

      case "CANCEL_TRADE":
        handleCancelTrade(ws);
        break;

      case "KICK_PLAYER":
        handleKickPlayer(ws, msg.playerId);
        break;

      case "LEAVE_ROOM":
        handleLeaveRoom(ws);
        break;

      case "PLAY_AGAIN":
        handlePlayAgain(ws);
        break;
    }
  } catch (err) {
    if (err instanceof GameError) {
      sendError(ws, err.code, err.message);
    } else {
      console.error("Unhandled error:", err);
      sendError(ws, ErrorCodes.INVALID_MESSAGE, "Internal server error.");
    }
  }
}

// ============================================================
// Handler implementations
// ============================================================

async function handleCreateRoom(
  ws: ServerWebSocket<WsData>,
  playerName: string,
  settings?: Record<string, unknown>
): Promise<void> {
  const { playerId } = ws.data;
  const { roomCode, room } = roomManager.createRoom(playerId, playerName, settings as any);
  ws.data.roomCode = roomCode;

  const state = room.getStateForPlayer(playerId);
  sendToPlayer(playerId, { type: "ROOM_CREATED", roomCode, gameState: state });
}

async function handleJoinRoom(
  ws: ServerWebSocket<WsData>,
  roomCode: string,
  playerName: string
): Promise<void> {
  const { playerId } = ws.data;
  const room = roomManager.joinRoom(roomCode, playerId, playerName);
  ws.data.roomCode = roomCode.toUpperCase();

  // Notify the joining player
  const state = room.getStateForPlayer(playerId);
  sendToPlayer(playerId, { type: "ROOM_JOINED", gameState: state });

  // Notify everyone else
  const player = room.players.get(playerId)!;
  for (const [pid] of room.players) {
    if (pid !== playerId) {
      sendToPlayer(pid, {
        type: "PLAYER_JOINED",
        player: {
          id: player.id,
          name: player.name,
          score: player.score,
          isHost: player.isHost,
          isJudge: player.isJudge,
          isConnected: player.isConnected,
          hasSubmitted: player.hasSubmitted,
          hasVoted: player.hasVoted,
        },
      });
    }
  }

  // Full state update for everyone
  broadcastGameState(room);
}

function handleUpdateSettings(
  ws: ServerWebSocket<WsData>,
  settings: Record<string, unknown>
): void {
  const room = getPlayerRoom(ws);
  room.updateSettings(ws.data.playerId, settings as any);

  broadcastToRoom(room, { type: "SETTINGS_UPDATED", settings: room.settings });
}

async function handleStartGame(ws: ServerWebSocket<WsData>): Promise<void> {
  const room = getPlayerRoom(ws);

  // Load cards from selected collections (or default)
  const collectionIds = room.settings.collectionIds;
  let blacks: BlackCard[];
  let whites: WhiteCard[];

  if (collectionIds.length > 0) {
    blacks = await db
      .select({ id: blackCards.id, text: blackCards.text, pick: blackCards.pick })
      .from(blackCards)
      .where(inArray(blackCards.collectionId, collectionIds));
    whites = await db
      .select({ id: whiteCards.id, text: whiteCards.text })
      .from(whiteCards)
      .where(inArray(whiteCards.collectionId, collectionIds));
  } else {
    // Use all available cards
    blacks = await db
      .select({ id: blackCards.id, text: blackCards.text, pick: blackCards.pick })
      .from(blackCards);
    whites = await db
      .select({ id: whiteCards.id, text: whiteCards.text })
      .from(whiteCards);
  }

  // Append temporary custom cards from settings
  if (room.settings.customBlackCards?.length) {
    blacks.push(
      ...room.settings.customBlackCards.map((c) => ({
        id: `custom-black-${crypto.randomUUID()}`,
        text: c.text,
        pick: c.pick,
      }))
    );
  }
  if (room.settings.customWhiteCards?.length) {
    whites.push(
      ...room.settings.customWhiteCards.map((c) => ({
        id: `custom-white-${crypto.randomUUID()}`,
        text: c.text,
      }))
    );
  }

  room.setCards(blacks, whites);
  room.startGame(ws.data.playerId);

  console.log(`🎮 Game started in room ${room.code} — Round ${room.roundNumber}`);

  // Send full state to each player (they get their own hand)
  broadcastGameState(room);
}

function handleSubmitCards(ws: ServerWebSocket<WsData>, cardIds: string[]): void {
  const room = getPlayerRoom(ws);
  room.submitCards(ws.data.playerId, cardIds);

  // Notify everyone that this player submitted
  broadcastToRoom(room, { type: "PLAYER_SUBMITTED", playerId: ws.data.playerId });

  // Check if all have submitted
  if (room.checkAllSubmitted()) {
    room.transitionToJudging();
    const subs = room.getAnonymousSubmissions();
    broadcastToRoom(room, { type: "ALL_SUBMITTED", submissions: subs });
    broadcastGameState(room);
    console.log(`📝 All submitted in room ${room.code} — moving to judging`);
  }
}

function handleCzarPick(ws: ServerWebSocket<WsData>, submissionId: string): void {
  const room = getPlayerRoom(ws);
  room.czarPick(ws.data.playerId, submissionId);

  sendRoundResultOrGameOver(room);
}

function handleVote(ws: ServerWebSocket<WsData>, submissionId: string): void {
  const room = getPlayerRoom(ws);
  room.vote(ws.data.playerId, submissionId);

  broadcastToRoom(room, { type: "PLAYER_VOTED", playerId: ws.data.playerId });

  if (room.checkAllVoted()) {
    room.resolvePopularVote();
    sendRoundResultOrGameOver(room);
    console.log(`🗳️  Votes tallied in room ${room.code}`);
  }
}

function sendRoundResultOrGameOver(room: GameRoom): void {
  const winner = room.getWinner();
  const scores = room.getFinalScores();

  if (room.phase === "GAME_OVER") {
    broadcastToRoom(room, {
      type: "GAME_OVER",
      winnerId: winner?.id ?? "",
      winnerName: winner?.name ?? "",
      finalScores: scores,
      revealedSubmissions: [],
    });
    console.log(`🏆 Game over in room ${room.code} — winner: ${winner?.name}`);
  }

  // Always broadcast full state (includes ROUND_RESULT or GAME_OVER phase data)
  broadcastGameState(room);
}

function handleNextRound(ws: ServerWebSocket<WsData>): void {
  const room = getPlayerRoom(ws);

  if (room.phase !== "ROUND_RESULT") {
    throw new GameError(ErrorCodes.INVALID_PHASE, "Cannot advance round now.");
  }

  room.nextRound();

  if (room.phase === "DISCARD_PHASE") {
    broadcastToRoom(room, { type: "DISCARD_PHASE_STARTED" });
  }

  broadcastGameState(room);
  console.log(`🔄 Room ${room.code} → Round ${room.roundNumber}, phase: ${room.phase}`);
}

function handleDiscardCards(ws: ServerWebSocket<WsData>, cardIds: string[]): void {
  const room = getPlayerRoom(ws);
  const newCards = room.discardCards(ws.data.playerId, cardIds);

  sendToPlayer(ws.data.playerId, { type: "CARDS_DISCARDED", newCards });

  // If everyone has discarded, move to next round
  if (room.checkAllDiscarded()) {
    room.startRound();
    broadcastGameState(room);
    console.log(`♻️  All discards done in room ${room.code}, starting round ${room.roundNumber}`);
  }
}

function handleOfferTrade(ws: ServerWebSocket<WsData>, targetPlayerId: string): void {
  const room = getPlayerRoom(ws);
  const trade = room.offerTrade(ws.data.playerId, targetPlayerId);
  const from = room.players.get(ws.data.playerId)!;

  sendToPlayer(targetPlayerId, {
    type: "TRADE_OFFERED",
    fromPlayerId: ws.data.playerId,
    fromPlayerName: from.name,
  });
}

function handleTradeResponse(ws: ServerWebSocket<WsData>, accept: boolean): void {
  const room = getPlayerRoom(ws);
  const { trade, tradeId } = room.respondToTrade(ws.data.playerId, accept);

  if (accept) {
    sendToPlayer(trade.fromPlayerId, { type: "TRADE_ACCEPTED", trade: tradeToState(trade) });
    sendToPlayer(trade.toPlayerId, { type: "TRADE_ACCEPTED", trade: tradeToState(trade) });
  } else {
    sendToPlayer(trade.fromPlayerId, { type: "TRADE_REJECTED", byPlayerId: ws.data.playerId });
  }
}

function handleTradeSelectCard(ws: ServerWebSocket<WsData>, cardId: string): void {
  const room = getPlayerRoom(ws);
  const { trade, tradeId } = room.selectTradeCard(ws.data.playerId, cardId);

  // Notify partner that this side is ready
  const partnerId =
    trade.fromPlayerId === ws.data.playerId ? trade.toPlayerId : trade.fromPlayerId;
  sendToPlayer(partnerId, { type: "TRADE_PARTNER_READY" });

  // Try to resolve
  if (room.resolveTradeIfReady(tradeId)) {
    // Trade complete — notify both sides
    sendToPlayer(trade.fromPlayerId, {
      type: "TRADE_COMPLETE",
      givenCardId: trade.fromCard!.id,
      receivedCard: trade.toCard!,
    });
    sendToPlayer(trade.toPlayerId, {
      type: "TRADE_COMPLETE",
      givenCardId: trade.toCard!.id,
      receivedCard: trade.fromCard!,
    });

    // State update so both see updated hands
    broadcastGameState(room);
  }
}

function handleCancelTrade(ws: ServerWebSocket<WsData>): void {
  const room = getPlayerRoom(ws);
  const tradeId = room.cancelTrade(ws.data.playerId);
  if (tradeId) {
    broadcastToRoom(room, { type: "TRADE_CANCELLED", reason: "Trade cancelled by player." });
  }
}

function handleKickPlayer(ws: ServerWebSocket<WsData>, targetPlayerId: string): void {
  const room = getPlayerRoom(ws);
  const target = room.players.get(targetPlayerId);
  const targetName = target?.name ?? "Unknown";

  room.kickPlayer(ws.data.playerId, targetPlayerId);

  // Notify the kicked player
  sendToPlayer(targetPlayerId, { type: "YOU_WERE_KICKED" });

  // Notify the room
  broadcastToRoom(room, {
    type: "PLAYER_KICKED",
    playerId: targetPlayerId,
    playerName: targetName,
  });

  checkTransitions(room);
  broadcastGameState(room);
}

function handleLeaveRoom(ws: ServerWebSocket<WsData>): void {
  const { playerId, roomCode } = ws.data;
  if (!roomCode) return;

  const room = roomManager.getRoom(roomCode);
  const playerName = room?.players.get(playerId)?.name ?? "Unknown";

  const { destroyed, hostMigrated, newHostId } = roomManager.removePlayerFromRoom(
    roomCode,
    playerId
  );
  ws.data.roomCode = null;

  if (!destroyed && room) {
    broadcastToRoom(room, {
      type: "PLAYER_LEFT",
      playerId,
      playerName,
      newHostId,
    });
    checkTransitions(room);
    broadcastGameState(room);
  }
}

function handlePlayAgain(ws: ServerWebSocket<WsData>): void {
  const room = getPlayerRoom(ws);
  room.playAgain();
  broadcastGameState(room);
  console.log(`🔁 Room ${room.code} reset to lobby for new game.`);
}

// ============================================================
// Helpers
// ============================================================

function checkTransitions(room: GameRoom): void {
  if (room.phase === "PLAYING" && room.checkAllSubmitted()) {
    room.transitionToJudging();
    const subs = room.getAnonymousSubmissions();
    broadcastToRoom(room, { type: "ALL_SUBMITTED", submissions: subs });
    console.log(`📝 All submitted in room ${room.code} (after leave/kick) — moving to judging`);
  } else if (room.phase === "JUDGING" && room.settings.judgingMode === "POPULAR_VOTE" && room.checkAllVoted()) {
    room.resolvePopularVote();
    sendRoundResultOrGameOver(room);
    console.log(`🗳️  Votes tallied in room ${room.code} (after leave/kick)`);
  } else if (room.phase === "DISCARD_PHASE" && room.checkAllDiscarded()) {
    room.startRound();
    console.log(`♻️  All discards done in room ${room.code} (after leave/kick), starting round ${room.roundNumber}`);
  }
}

function getPlayerRoom(ws: ServerWebSocket<WsData>): GameRoom {
  const { roomCode } = ws.data;
  if (!roomCode) {
    throw new GameError(ErrorCodes.NOT_IN_ROOM, "Not in a room.");
  }
  const room = roomManager.getRoom(roomCode);
  if (!room) {
    throw new GameError(ErrorCodes.ROOM_NOT_FOUND, "Room not found.");
  }
  return room;
}

function sendError(ws: ServerWebSocket<WsData>, code: string, message: string): void {
  const msg: ServerMessage = { type: "ERROR", code, message };
  ws.send(JSON.stringify(msg));
}

function tradeToState(trade: import("../game/GameRoom").ActiveTrade): import("@xuuuxi/shared").TradeState {
  return {
    status: trade.accepted ? "SELECTING_CARDS" : "PENDING_ACCEPTANCE",
    fromPlayerId: trade.fromPlayerId,
    toPlayerId: trade.toPlayerId,
    fromPlayerReady: trade.fromCard !== null,
    toPlayerReady: trade.toCard !== null,
  };
}
