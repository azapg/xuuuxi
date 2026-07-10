import { db } from "../db/index";
import {
  gameSessions,
  gameSessionPlayers,
  roundResults,
  roundSubmissions,
  cardComboStats,
  blackCards,
  whiteCards,
} from "../db/schema";
import { eq, desc, sql, inArray } from "drizzle-orm";

/**
 * Global overview statistics
 * GET /api/analytics/overview
 */
export async function getOverviewStats(req: Request): Promise<Response> {
  try {
    const totalSessions = await db.select({ count: sql<number>`count(*)` }).from(gameSessions);
    const totalRounds = await db.select({ count: sql<number>`count(*)` }).from(roundResults);
    const totalCardsPlayed = await db.select({ count: sql<number>`count(*)` }).from(roundSubmissions);

    return new Response(
      JSON.stringify({
        totalSessions: totalSessions[0]?.count || 0,
        totalRounds: totalRounds[0]?.count || 0,
        totalCardsPlayed: totalCardsPlayed[0]?.count || 0,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in getOverviewStats:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
  }
}

/**
 * Black Card Rankings
 * GET /api/analytics/cards/black/ranking
 */
export async function getBlackCardRanking(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get("limit") || "10");

    // We count how many times each black card was played in round_results
    const rankings = await db.select({
      id: roundResults.blackCardId,
      text: roundResults.blackCardText,
      timesPlayed: sql<number>`count(*)`,
    })
    .from(roundResults)
    .groupBy(roundResults.blackCardId, roundResults.blackCardText)
    .orderBy(desc(sql`count(*)`))
    .limit(limit);

    return new Response(JSON.stringify(rankings), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Error in getBlackCardRanking:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
  }
}

/**
 * White Card Rankings
 * GET /api/analytics/cards/white/ranking
 */
export async function getWhiteCardRanking(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const sortBy = url.searchParams.get("sort") || "timesPlayed"; // timesPlayed, winRate

    const stats = await db.select({
      id: cardComboStats.whiteCardId,
      text: whiteCards.text,
      timesPlayed: sql<number>`SUM(${cardComboStats.timesPlayedTogether})`,
      timesWon: sql<number>`SUM(${cardComboStats.timesWonTogether})`,
    })
    .from(cardComboStats)
    .innerJoin(whiteCards, eq(cardComboStats.whiteCardId, whiteCards.id))
    .groupBy(cardComboStats.whiteCardId, whiteCards.text);

    // Calculate winRate and sort in memory since it's safer than raw SQLite casts here
    const processed = stats.map(s => ({
      ...s,
      winRate: s.timesPlayed > 0 ? s.timesWon / s.timesPlayed : 0
    }));

    if (sortBy === "winRate") {
      processed.sort((a, b) => b.winRate - a.winRate || b.timesPlayed - a.timesPlayed);
    } else {
      processed.sort((a, b) => b.timesPlayed - a.timesPlayed || b.winRate - a.winRate);
    }

    const rows = processed.slice(0, limit);

    return new Response(JSON.stringify(rows), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Error in getWhiteCardRanking:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
  }
}

/**
 * Best Combos Leaderboard
 * GET /api/analytics/cards/combos
 */
export async function getBestCombos(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get("limit") || "10");

    const combos = await db.select({
      blackCardId: cardComboStats.blackCardId,
      whiteCardId: cardComboStats.whiteCardId,
      blackCardText: blackCards.text,
      whiteCardText: whiteCards.text,
      timesPlayed: cardComboStats.timesPlayedTogether,
      timesWon: cardComboStats.timesWonTogether,
      winRate: cardComboStats.winRate,
    })
    .from(cardComboStats)
    .innerJoin(blackCards, eq(cardComboStats.blackCardId, blackCards.id))
    .innerJoin(whiteCards, eq(cardComboStats.whiteCardId, whiteCards.id))
    .orderBy(desc(cardComboStats.timesWonTogether), desc(cardComboStats.winRate))
    .limit(limit);

    return new Response(JSON.stringify(combos), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Error in getBestCombos:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
  }
}

/**
 * Compare multiple cards side-by-side
 * POST /api/analytics/cards/compare
 * Body: { cardIds: string[], type: "black" | "white" }
 */
export async function compareCards(req: Request): Promise<Response> {
  try {
    const body = await req.json();
    const cardIds = body.cardIds as string[];
    const type = body.type as "black" | "white";

    if (!cardIds || !Array.isArray(cardIds) || cardIds.length === 0) {
      return new Response(JSON.stringify({ error: "No cardIds provided" }), { status: 400 });
    }

    if (type === "white") {
      // White cards comparison
      const stats = await db.select({
        id: cardComboStats.whiteCardId,
        text: whiteCards.text,
        timesPlayed: sql<number>`SUM(${cardComboStats.timesPlayedTogether})`,
        timesWon: sql<number>`SUM(${cardComboStats.timesWonTogether})`,
      })
      .from(cardComboStats)
      .innerJoin(whiteCards, eq(cardComboStats.whiteCardId, whiteCards.id))
      .where(inArray(cardComboStats.whiteCardId, cardIds))
      .groupBy(cardComboStats.whiteCardId, whiteCards.text);

      const results = stats.map(s => ({
        ...s,
        winRate: s.timesPlayed > 0 ? (s.timesWon / s.timesPlayed) * 100 : 0
      }));

      return new Response(JSON.stringify(results), { status: 200, headers: { "Content-Type": "application/json" } });
    } else {
      // Black cards comparison
      const stats = await db.select({
        id: roundResults.blackCardId,
        text: roundResults.blackCardText,
        timesPlayed: sql<number>`count(*)`,
      })
      .from(roundResults)
      .where(inArray(roundResults.blackCardId, cardIds))
      .groupBy(roundResults.blackCardId, roundResults.blackCardText);

      return new Response(JSON.stringify(stats), { status: 200, headers: { "Content-Type": "application/json" } });
    }
  } catch (error) {
    console.error("Error in compareCards:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
  }
}

/**
 * Game Sessions history
 * GET /api/analytics/sessions
 */
export async function getSessionsList(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const offset = parseInt(url.searchParams.get("offset") || "0");

    const sessions = await db.select()
      .from(gameSessions)
      .orderBy(desc(gameSessions.startedAt))
      .limit(limit)
      .offset(offset);

    return new Response(JSON.stringify(sessions), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Error in getSessionsList:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
  }
}

/**
 * Performance Chart Data
 * GET /api/analytics/charts/card-performance
 */
export async function getCardPerformanceChart(req: Request): Promise<Response> {
  try {
    const stats = await db.select({
      name: whiteCards.text,
      played: sql<number>`SUM(${cardComboStats.timesPlayedTogether})`,
      won: sql<number>`SUM(${cardComboStats.timesWonTogether})`,
    })
    .from(cardComboStats)
    .innerJoin(whiteCards, eq(cardComboStats.whiteCardId, whiteCards.id))
    .groupBy(cardComboStats.whiteCardId, whiteCards.text)
    .orderBy(desc(sql<number>`SUM(${cardComboStats.timesPlayedTogether})`))
    .limit(10);
    
    return new Response(JSON.stringify(stats), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Error in getCardPerformanceChart:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
  }
}
