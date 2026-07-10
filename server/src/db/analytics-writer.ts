import { db } from "./index";
import {
  gameSessions,
  gameSessionPlayers,
  roundResults,
  roundSubmissions,
  cardComboStats,
} from "./analytics-schema";
import { eq, sql } from "drizzle-orm";
import type { GameState, GameSettings, RevealedSubmission } from "@xuuuxi/shared";

// Generate a random UUID
function uuid() {
  return crypto.randomUUID();
}

/**
 * Creates a new game session record when a game starts
 */
export async function createGameSession(
  roomCode: string,
  settings: GameSettings,
  playerCount: number
): Promise<string> {
  const sessionId = uuid();

  try {
    await db.insert(gameSessions).values({
      id: sessionId,
      roomCode,
      judgingMode: settings.judgingMode,
      winCondition: settings.winCondition,
      playerCount,
      totalRounds: settings.totalRounds,
      collectionIds: JSON.stringify(settings.collectionIds),
      startedAt: new Date(),
      finishedAt: null,
      winnerName: null,
    });
    return sessionId;
  } catch (error) {
    console.error("Failed to create game session:", error);
    return sessionId; // Return ID anyway to prevent crash, later inserts will fail silently
  }
}

/**
 * Records the outcome of a single round
 */
export async function recordRoundResult(
  sessionId: string,
  state: GameState,
  blackCardText: string,
  blackCardId: string
): Promise<void> {
  if (!sessionId) return;

  try {
    const roundId = uuid();
    const now = Date.now();

    // 1. Insert Round Result
    await db.insert(roundResults).values({
      id: roundId,
      sessionId,
      roundNumber: state.roundNumber,
      blackCardId: blackCardId,
      blackCardText: blackCardText,
      judgingMode: state.settings.judgingMode,
      playerCount: state.players.length,
      createdAt: new Date(now),
    });

    // 2. Insert Submissions
    for (const sub of state.revealedSubmissions) {
      await db.insert(roundSubmissions).values({
        id: uuid(),
        roundId,
        playerName: sub.playerName,
        whiteCardIds: JSON.stringify(sub.cards.map(c => c.id)),
        whiteCardTexts: JSON.stringify(sub.cards.map(c => c.text)),
        votesReceived: sub.votes,
        isWinner: sub.isWinner,
        wasCzarPick: state.settings.judgingMode === "CZAR" && sub.isWinner,
      });

      // 3. Update Combo Stats (only for single white card picks for simplicity now)
      if (sub.cards.length === 1) {
        const whiteCardId = sub.cards[0].id;
        await updateComboStats(blackCardId, whiteCardId, sub.isWinner, now);
      }
    }
  } catch (error) {
    console.error("Failed to record round result:", error);
  }
}

/**
 * Records the end of a game session and final player scores
 */
export async function recordGameComplete(
  sessionId: string,
  winnerName: string | null,
  scores: Record<string, number>,
  playerNames: Record<string, string>
): Promise<void> {
  if (!sessionId) return;

  try {
    // 1. Update Game Session
    await db.update(gameSessions)
      .set({
        finishedAt: new Date(),
        winnerName: winnerName,
      })
      .where(eq(gameSessions.id, sessionId));

    // 2. Insert Player Stats
    const playerInserts = Object.entries(scores).map(([playerId, score]) => ({
      id: uuid(),
      sessionId,
      playerName: playerNames[playerId] || "Unknown",
      finalScore: score,
      isWinner: playerNames[playerId] === winnerName,
    }));

    if (playerInserts.length > 0) {
      await db.insert(gameSessionPlayers).values(playerInserts);
    }
  } catch (error) {
    console.error("Failed to record game completion:", error);
  }
}

/**
 * Updates the materialized view/cache for card combinations
 */
async function updateComboStats(
  blackCardId: string,
  whiteCardId: string,
  isWinner: boolean,
  now: number
): Promise<void> {
  const comboId = `${blackCardId}_${whiteCardId}`;

  try {
    const existing = await db.query.cardComboStats.findFirst({
      where: eq(cardComboStats.id, comboId)
    });

    if (existing) {
      const timesPlayed = existing.timesPlayedTogether + 1;
      const timesWon = existing.timesWonTogether + (isWinner ? 1 : 0);
      const winRate = timesWon / timesPlayed;

      await db.update(cardComboStats)
        .set({
          timesPlayedTogether: timesPlayed,
          timesWonTogether: timesWon,
          winRate: winRate,
          lastPlayedAt: new Date(now),
        })
        .where(eq(cardComboStats.id, comboId));
    } else {
      await db.insert(cardComboStats).values({
        id: comboId,
        blackCardId,
        whiteCardId,
        timesPlayedTogether: 1,
        timesWonTogether: isWinner ? 1 : 0,
        winRate: isWinner ? 1 : 0,
        lastPlayedAt: new Date(now),
      });
    }
  } catch (error) {
    console.error("Failed to update combo stats:", error);
  }
}
