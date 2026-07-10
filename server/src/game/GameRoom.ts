// ============================================================
// GameRoom — Core game state machine
// ============================================================

import type {
  BlackCard,
  WhiteCard,
  GamePhase,
  GameSettings,
  Player,
  PublicPlayer,
  AnonymousSubmission,
  RevealedSubmission,
  TradeState,
  GameState,
  ErrorCode,
} from "@xuuuxi/shared";
import { ErrorCodes, DEFAULT_GAME_SETTINGS } from "@xuuuxi/shared";
import { DeckManager } from "./DeckManager";

// ---- Internal Types ----

export interface InternalPlayer {
  id: string;
  name: string;
  score: number;
  hand: WhiteCard[];
  isHost: boolean;
  isJudge: boolean;
  isConnected: boolean;
  hasSubmitted: boolean;
  hasVoted: boolean;
}

export interface ActiveTrade {
  id: string;
  fromPlayerId: string;
  toPlayerId: string;
  fromCard: WhiteCard | null;
  toCard: WhiteCard | null;
  accepted: boolean;
}

interface Submission {
  submissionId: string;
  playerId: string;
  cards: WhiteCard[];
}

// ---- Error helper ----

export class GameError extends Error {
  constructor(public code: ErrorCode, message: string) {
    super(message);
    this.name = "GameError";
  }
}

// ---- Main Class ----

export class GameRoom {
  code: string;
  players: Map<string, InternalPlayer> = new Map();
  phase: GamePhase = "LOBBY";
  phaseEndsAt: number | null = null;
  settings: GameSettings;
  deck!: DeckManager;
  currentBlackCard: BlackCard | null = null;
  roundNumber: number = 0;
  judgeIndex: number = -1;
  trades: Map<string, ActiveTrade> = new Map();
  sessionId: string | null = null;

  // Internal — keyed by submissionId
  private submissions: Map<string, Submission> = new Map();
  // voterId → submissionId
  private votes: Map<string, string> = new Map();
  // last round result for getStateForPlayer during ROUND_RESULT
  private lastRevealedSubmissions: RevealedSubmission[] = [];

  // Cards to use for this game — loaded before game start
  private allBlackCards: BlackCard[] = [];
  private allWhiteCards: WhiteCard[] = [];

  constructor(code: string, settings?: Partial<GameSettings>) {
    this.code = code;
    this.settings = { ...DEFAULT_GAME_SETTINGS, ...settings };
  }

  // ============================================================
  // Player Management
  // ============================================================

  addPlayer(id: string, name: string, isHost: boolean): InternalPlayer {
    if (this.players.size >= this.settings.maxPlayers) {
      throw new GameError(ErrorCodes.ROOM_FULL, "Room is full.");
    }
    if (this.phase !== "LOBBY") {
      throw new GameError(ErrorCodes.GAME_ALREADY_STARTED, "Game already in progress.");
    }
    // Check name uniqueness
    for (const p of this.players.values()) {
      if (p.name.toLowerCase() === name.toLowerCase()) {
        throw new GameError(ErrorCodes.NAME_TAKEN, `Name "${name}" is already taken.`);
      }
    }

    const player: InternalPlayer = {
      id,
      name,
      score: 0,
      hand: [],
      isHost,
      isJudge: false,
      isConnected: true,
      hasSubmitted: false,
      hasVoted: false,
    };
    this.players.set(id, player);
    return player;
  }

  removePlayer(id: string): { hostMigrated: boolean; newHostId?: string } {
    const player = this.players.get(id);
    if (!player) return { hostMigrated: false };

    // Return their hand to the deck (if game in progress)
    if (this.phase !== "LOBBY" && this.deck) {
      this.deck.returnWhite(player.hand);
    }

    this.players.delete(id);

    // Cancel any active trades involving this player
    for (const [tradeId, trade] of this.trades) {
      if (trade.fromPlayerId === id || trade.toPlayerId === id) {
        this.trades.delete(tradeId);
      }
    }

    // Host migration
    let hostMigrated = false;
    let newHostId: string | undefined;
    if (player.isHost && this.players.size > 0) {
      const nextHost = this.players.values().next().value!;
      nextHost.isHost = true;
      hostMigrated = true;
      newHostId = nextHost.id;
    }

    return { hostMigrated, newHostId };
  }

  // ============================================================
  // Settings
  // ============================================================

  updateSettings(playerId: string, partial: Partial<GameSettings>): void {
    const player = this.players.get(playerId);
    if (!player?.isHost) {
      throw new GameError(ErrorCodes.NOT_HOST, "Only the host can update settings.");
    }
    if (this.phase !== "LOBBY") {
      throw new GameError(ErrorCodes.INVALID_PHASE, "Cannot change settings during a game.");
    }
    this.settings = { ...this.settings, ...partial };
  }

  // ============================================================
  // Game Start
  // ============================================================

  setCards(blacks: BlackCard[], whites: WhiteCard[]): void {
    this.allBlackCards = blacks;
    this.allWhiteCards = whites;
  }

  startGame(playerId: string): void {
    const player = this.players.get(playerId);
    if (!player?.isHost) {
      throw new GameError(ErrorCodes.NOT_HOST, "Only the host can start the game.");
    }
    if (this.players.size < this.settings.minPlayers) {
      throw new GameError(
        ErrorCodes.NOT_ENOUGH_PLAYERS,
        `Need at least ${this.settings.minPlayers} players.`
      );
    }
    if (this.allBlackCards.length === 0 || this.allWhiteCards.length === 0) {
      throw new GameError(ErrorCodes.INVALID_CARDS, "No cards loaded for this game.");
    }

    this.deck = new DeckManager(this.allBlackCards, this.allWhiteCards);

    // Deal initial hands
    for (const p of this.players.values()) {
      p.hand = this.deck.drawWhite(this.settings.handSize);
      p.score = 0;
    }

    this.roundNumber = 0;
    this.judgeIndex = -1;
    this.startRound();
  }

  // ============================================================
  // Round Flow
  // ============================================================

  startRound(): void {
    this.roundNumber++;
    this.phase = "PLAYING";
    this.phaseEndsAt = this.settings.submissionTimerSeconds > 0 
      ? Date.now() + this.settings.submissionTimerSeconds * 1000 
      : null;
    this.submissions.clear();
    this.votes.clear();
    this.lastRevealedSubmissions = [];

    // Rotate judge (for CZAR mode)
    const playerIds = [...this.players.keys()];
    if (this.settings.judgingMode === "CZAR") {
      this.judgeIndex = (this.judgeIndex + 1) % playerIds.length;
      // Reset judge flags
      for (const p of this.players.values()) {
        p.isJudge = false;
      }
      const judgeId = playerIds[this.judgeIndex];
      this.players.get(judgeId)!.isJudge = true;
    } else {
      // POPULAR_VOTE — no judge
      for (const p of this.players.values()) {
        p.isJudge = false;
      }
    }

    // Reset submission/vote flags
    for (const p of this.players.values()) {
      p.hasSubmitted = false;
      p.hasVoted = false;
    }

    // Draw black card
    this.currentBlackCard = this.deck.drawBlack();
  }

  // ============================================================
  // Card Submission
  // ============================================================

  submitCards(playerId: string, cardIds: string[]): void {
    if (this.phase !== "PLAYING") {
      throw new GameError(ErrorCodes.INVALID_PHASE, "Not in the submission phase.");
    }
    const player = this.players.get(playerId);
    if (!player) {
      throw new GameError(ErrorCodes.NOT_IN_ROOM, "Player not in room.");
    }
    if (player.isJudge && this.settings.judgingMode === "CZAR") {
      throw new GameError(ErrorCodes.NOT_YOUR_TURN, "The judge cannot submit cards.");
    }
    if (player.hasSubmitted) {
      throw new GameError(ErrorCodes.INVALID_CARDS, "Already submitted.");
    }

    const pick = this.currentBlackCard?.pick ?? 1;
    if (cardIds.length !== pick) {
      throw new GameError(ErrorCodes.INVALID_CARDS, `Must submit exactly ${pick} card(s).`);
    }

    // Validate cards are in hand
    const submittedCards: WhiteCard[] = [];
    for (const cid of cardIds) {
      const idx = player.hand.findIndex((c) => c.id === cid);
      if (idx === -1) {
        throw new GameError(ErrorCodes.INVALID_CARDS, `Card ${cid} not in your hand.`);
      }
      submittedCards.push(player.hand[idx]);
    }

    // Remove from hand
    player.hand = player.hand.filter((c) => !cardIds.includes(c.id));
    player.hasSubmitted = true;

    // Store with anonymous submission ID
    const submissionId = generateSubmissionId();
    this.submissions.set(submissionId, {
      submissionId,
      playerId,
      cards: submittedCards,
    });
  }

  /** Check if all required players have submitted */
  checkAllSubmitted(): boolean {
    for (const p of this.players.values()) {
      if (this.settings.judgingMode === "CZAR" && p.isJudge) continue;
      if (!p.hasSubmitted) return false;
    }
    return true;
  }

  /** Transition to JUDGING phase */
  transitionToJudging(): void {
    this.phase = "JUDGING";
    this.phaseEndsAt = this.settings.judgingTimerSeconds > 0
      ? Date.now() + this.settings.judgingTimerSeconds * 1000
      : null;
  }

  // ============================================================
  // Judging — CZAR Mode
  // ============================================================

  czarPick(playerId: string, submissionId: string): void {
    if (this.phase !== "JUDGING") {
      throw new GameError(ErrorCodes.INVALID_PHASE, "Not in judging phase.");
    }
    if (this.settings.judgingMode !== "CZAR") {
      throw new GameError(ErrorCodes.INVALID_PHASE, "Not in CZAR mode.");
    }
    const player = this.players.get(playerId);
    if (!player?.isJudge) {
      throw new GameError(ErrorCodes.NOT_YOUR_TURN, "Only the czar can pick.");
    }
    const submission = this.submissions.get(submissionId);
    if (!submission) {
      throw new GameError(ErrorCodes.INVALID_CARDS, "Invalid submission ID.");
    }
    // Resolve round with that winner
    this.resolveRound(submission.playerId);
  }

  // ============================================================
  // Judging — POPULAR_VOTE Mode
  // ============================================================

  vote(playerId: string, submissionId: string): void {
    if (this.phase !== "JUDGING") {
      throw new GameError(ErrorCodes.INVALID_PHASE, "Not in judging phase.");
    }
    if (this.settings.judgingMode !== "POPULAR_VOTE") {
      throw new GameError(ErrorCodes.INVALID_PHASE, "Not in POPULAR_VOTE mode.");
    }
    const player = this.players.get(playerId);
    if (!player) {
      throw new GameError(ErrorCodes.NOT_IN_ROOM, "Player not found.");
    }
    if (player.hasVoted) {
      throw new GameError(ErrorCodes.INVALID_CARDS, "Already voted.");
    }
    // Can't vote for your own
    const submission = this.submissions.get(submissionId);
    if (!submission) {
      throw new GameError(ErrorCodes.INVALID_CARDS, "Invalid submission ID.");
    }
    if (submission.playerId === playerId) {
      throw new GameError(ErrorCodes.INVALID_CARDS, "Cannot vote for your own submission.");
    }

    this.votes.set(playerId, submissionId);
    player.hasVoted = true;
  }

  /** Check if all voters have voted */
  checkAllVoted(): boolean {
    for (const p of this.players.values()) {
      if (!p.hasVoted) return false;
    }
    return true;
  }

  /** Resolve popular vote by counting */
  resolvePopularVote(): void {
    // Count votes per submission
    const voteCounts = new Map<string, number>();
    for (const subId of this.votes.values()) {
      voteCounts.set(subId, (voteCounts.get(subId) ?? 0) + 1);
    }

    // Find the submission with most votes (tie → first found wins)
    let maxVotes = 0;
    let winnerId = "";
    for (const [subId, count] of voteCounts) {
      if (count > maxVotes) {
        maxVotes = count;
        const sub = this.submissions.get(subId);
        if (sub) winnerId = sub.playerId;
      }
    }

    this.resolveRound(winnerId, voteCounts);
  }

  // ============================================================
  // Round Resolution
  // ============================================================

  private resolveRound(winnerId: string, voteCounts?: Map<string, number>): void {
    // Award point
    const winner = this.players.get(winnerId);
    if (winner) {
      winner.score++;
    }

    // Build revealed submissions
    this.lastRevealedSubmissions = [];
    for (const [subId, sub] of this.submissions) {
      const p = this.players.get(sub.playerId);
      this.lastRevealedSubmissions.push({
        submissionId: subId,
        cards: sub.cards,
        playerId: sub.playerId,
        playerName: p?.name ?? "Unknown",
        votes: voteCounts?.get(subId) ?? (sub.playerId === winnerId ? 1 : 0),
        isWinner: sub.playerId === winnerId,
      });
    }

    // Return submitted cards to discard
    for (const sub of this.submissions.values()) {
      this.deck.returnWhite(sub.cards);
    }

    // Replenish hands
    const pick = this.currentBlackCard?.pick ?? 1;
    for (const p of this.players.values()) {
      if (this.settings.judgingMode === "CZAR" && p.isJudge) continue;
      const newCards = this.deck.drawWhite(pick);
      p.hand.push(...newCards);
    }

    // Check win condition
    if (this.checkWinCondition()) {
      this.phase = "GAME_OVER";
      this.phaseEndsAt = null;
      return;
    }

    this.phase = "ROUND_RESULT";
    this.phaseEndsAt = null;
  }

  private checkWinCondition(): boolean {
    if (this.settings.winCondition === "POINTS") {
      for (const p of this.players.values()) {
        if (p.score >= this.settings.pointsToWin) return true;
      }
    } else if (this.settings.winCondition === "ROUNDS") {
      if (this.roundNumber >= this.settings.totalRounds) return true;
    }
    return false;
  }

  /** Should a discard phase happen after this round? */
  shouldDiscard(): boolean {
    if (this.settings.discardEveryNRounds <= 0) return false;
    return this.roundNumber % this.settings.discardEveryNRounds === 0;
  }

  /** Host/system calls NEXT_ROUND — advances to discard or next round */
  nextRound(): void {
    if (this.phase === "GAME_OVER") return;

    if (this.shouldDiscard()) {
      this.startDiscardPhase();
    } else {
      this.startRound();
    }
  }

  // ============================================================
  // Discard Phase
  // ============================================================

  startDiscardPhase(): void {
    this.phase = "DISCARD_PHASE";
    this.phaseEndsAt = this.settings.discardTimerSeconds > 0
      ? Date.now() + this.settings.discardTimerSeconds * 1000
      : null;
    // Reset hasSubmitted to track who has discarded
    for (const p of this.players.values()) {
      p.hasSubmitted = false;
    }
  }

  discardCards(playerId: string, cardIds: string[]): WhiteCard[] {
    if (this.phase !== "DISCARD_PHASE") {
      throw new GameError(ErrorCodes.INVALID_PHASE, "Not in discard phase.");
    }
    const player = this.players.get(playerId);
    if (!player) {
      throw new GameError(ErrorCodes.NOT_IN_ROOM, "Player not found.");
    }
    if (player.hasSubmitted) {
      throw new GameError(ErrorCodes.INVALID_CARDS, "Already discarded.");
    }
    if (cardIds.length > this.settings.maxDiscards) {
      throw new GameError(
        ErrorCodes.INVALID_CARDS,
        `Can discard at most ${this.settings.maxDiscards} cards.`
      );
    }

    // Validate and remove
    const discarded: WhiteCard[] = [];
    for (const cid of cardIds) {
      const idx = player.hand.findIndex((c) => c.id === cid);
      if (idx === -1) {
        throw new GameError(ErrorCodes.INVALID_CARDS, `Card ${cid} not in hand.`);
      }
      discarded.push(player.hand[idx]);
    }
    player.hand = player.hand.filter((c) => !cardIds.includes(c.id));
    this.deck.returnWhite(discarded);

    // Draw replacements
    const newCards = this.deck.drawWhite(discarded.length);
    player.hand.push(...newCards);
    player.hasSubmitted = true;

    return newCards;
  }

  /** Check if all players have discarded (or skipped) */
  checkAllDiscarded(): boolean {
    for (const p of this.players.values()) {
      if (!p.hasSubmitted) return false;
    }
    return true;
  }

  /** Skip discard for a player (they can choose 0 cards too) */
  skipDiscard(playerId: string): void {
    const player = this.players.get(playerId);
    if (player) player.hasSubmitted = true;
  }

  // ============================================================
  // Trading
  // ============================================================

  offerTrade(fromId: string, toId: string): ActiveTrade {
    if (!this.settings.tradesEnabled) {
      throw new GameError(ErrorCodes.TRADE_NOT_ALLOWED, "Trading is disabled.");
    }
    if (this.phase !== "PLAYING" && this.phase !== "ROUND_RESULT") {
      throw new GameError(ErrorCodes.INVALID_PHASE, "Cannot trade right now.");
    }
    const from = this.players.get(fromId);
    const to = this.players.get(toId);
    if (!from || !to) {
      throw new GameError(ErrorCodes.NOT_IN_ROOM, "Player not found.");
    }

    // Check no existing trade for these players
    for (const trade of this.trades.values()) {
      if (trade.fromPlayerId === fromId || trade.toPlayerId === fromId ||
          trade.fromPlayerId === toId || trade.toPlayerId === toId) {
        throw new GameError(ErrorCodes.TRADE_ALREADY_PENDING, "A trade is already pending.");
      }
    }

    const trade: ActiveTrade = {
      id: crypto.randomUUID(),
      fromPlayerId: fromId,
      toPlayerId: toId,
      fromCard: null,
      toCard: null,
      accepted: false,
    };
    this.trades.set(trade.id, trade);
    return trade;
  }

  respondToTrade(playerId: string, accept: boolean): { trade: ActiveTrade; tradeId: string } {
    const [tradeId, trade] = this.findTradeForPlayer(playerId, "to");
    if (accept) {
      trade.accepted = true;
    } else {
      this.trades.delete(tradeId);
    }
    return { trade, tradeId };
  }

  selectTradeCard(playerId: string, cardId: string): { trade: ActiveTrade; tradeId: string } {
    // Find trade where this player is a participant
    let foundId: string | null = null;
    let foundTrade: ActiveTrade | null = null;
    for (const [tid, t] of this.trades) {
      if (t.fromPlayerId === playerId || t.toPlayerId === playerId) {
        foundId = tid;
        foundTrade = t;
        break;
      }
    }
    if (!foundId || !foundTrade || !foundTrade.accepted) {
      throw new GameError(ErrorCodes.TRADE_NOT_ALLOWED, "No active trade.");
    }

    const player = this.players.get(playerId)!;
    const card = player.hand.find((c) => c.id === cardId);
    if (!card) {
      throw new GameError(ErrorCodes.INVALID_CARDS, "Card not in hand.");
    }

    if (foundTrade.fromPlayerId === playerId) {
      foundTrade.fromCard = card;
    } else {
      foundTrade.toCard = card;
    }

    return { trade: foundTrade, tradeId: foundId };
  }

  resolveTradeIfReady(tradeId: string): boolean {
    const trade = this.trades.get(tradeId);
    if (!trade || !trade.fromCard || !trade.toCard) return false;

    const from = this.players.get(trade.fromPlayerId)!;
    const to = this.players.get(trade.toPlayerId)!;

    // Swap cards in hands
    from.hand = from.hand.filter((c) => c.id !== trade.fromCard!.id);
    to.hand = to.hand.filter((c) => c.id !== trade.toCard!.id);
    from.hand.push(trade.toCard);
    to.hand.push(trade.fromCard);

    this.trades.delete(tradeId);
    return true;
  }

  cancelTrade(playerId: string): string | null {
    for (const [tradeId, trade] of this.trades) {
      if (trade.fromPlayerId === playerId || trade.toPlayerId === playerId) {
        this.trades.delete(tradeId);
        return tradeId;
      }
    }
    return null;
  }

  private findTradeForPlayer(
    playerId: string,
    role: "from" | "to"
  ): [string, ActiveTrade] {
    for (const [tid, t] of this.trades) {
      const matches =
        role === "from"
          ? t.fromPlayerId === playerId
          : t.toPlayerId === playerId;
      if (matches) return [tid, t];
    }
    throw new GameError(ErrorCodes.TRADE_NOT_ALLOWED, "No pending trade found.");
  }

  // ============================================================
  // State Projection (per-player view)
  // ============================================================

  getStateForPlayer(playerId: string): GameState {
    const me = this.players.get(playerId);
    if (!me) {
      throw new GameError(ErrorCodes.NOT_IN_ROOM, "Player not in room.");
    }

    // Build public player list
    const players: PublicPlayer[] = [...this.players.values()].map((p) => ({
      id: p.id,
      name: p.name,
      score: p.score,
      isHost: p.isHost,
      isJudge: p.isJudge,
      isConnected: p.isConnected,
      hasSubmitted: p.hasSubmitted,
      hasVoted: p.hasVoted,
    }));

    // Anonymous submissions (only during JUDGING)
    let submissions: AnonymousSubmission[] = [];
    if (this.phase === "JUDGING") {
      submissions = [...this.submissions.entries()].map(([subId, sub]) => ({
        submissionId: subId,
        cards: sub.cards,
      }));
      // Sort by submissionId (which is random) so order is stable but random
      submissions.sort((a, b) => a.submissionId.localeCompare(b.submissionId));
    }

    // Revealed submissions (during ROUND_RESULT or GAME_OVER)
    let revealedSubmissions: RevealedSubmission[] = [];
    if (this.phase === "ROUND_RESULT" || this.phase === "GAME_OVER") {
      revealedSubmissions = this.lastRevealedSubmissions;
    }

    // Trade state for this player
    let trade: TradeState | null = null;
    for (const t of this.trades.values()) {
      if (t.fromPlayerId === playerId || t.toPlayerId === playerId) {
        trade = {
          status: !t.accepted
            ? "PENDING_ACCEPTANCE"
            : t.fromCard && t.toCard
              ? "COMPLETE"
              : "SELECTING_CARDS",
          fromPlayerId: t.fromPlayerId,
          toPlayerId: t.toPlayerId,
          fromPlayerReady: t.fromCard !== null,
          toPlayerReady: t.toCard !== null,
        };
        break;
      }
    }

    const mePlayer: Player = {
      id: me.id,
      name: me.name,
      score: me.score,
      hand: me.hand,
      isHost: me.isHost,
      isJudge: me.isJudge,
      isConnected: me.isConnected,
      hasSubmitted: me.hasSubmitted,
      hasVoted: me.hasVoted,
    };

    return {
      roomCode: this.code,
      phase: this.phase,
      settings: this.settings,
      me: mePlayer,
      players,
      roundNumber: this.roundNumber,
      currentBlackCard: this.currentBlackCard,
      submissions,
      revealedSubmissions,
      trade,
      canDiscard: this.phase === "DISCARD_PHASE" && !me.hasSubmitted,
      cardsRemaining: this.deck ? this.deck.remainingWhite : 0,
      phaseEndsAt: this.phaseEndsAt,
    };
  }

  // ============================================================
  // Tick (Timer Evaluation)
  // ============================================================

  /** Evaluates timer logic. Returns true if state changed and needs broadcasting. */
  tick(now: number): boolean {
    if (this.phaseEndsAt === null || now < this.phaseEndsAt) {
      return false;
    }

    // Timer has expired, handle logic based on current phase
    if (this.phase === "PLAYING") {
      // Auto-skip anyone who hasn't submitted
      for (const p of this.players.values()) {
        if (this.settings.judgingMode === "CZAR" && p.isJudge) continue;
        if (!p.hasSubmitted) {
          p.hasSubmitted = true;
          // Note: we don't add to this.submissions so they get 0 cards
        }
      }

      if (this.submissions.size === 0) {
        // Nobody submitted, go to next round
        this.nextRound();
      } else if (this.submissions.size === 1) {
        // Only one submitted, they auto-win
        const onlySubmission = Array.from(this.submissions.values())[0];
        this.resolveRound(onlySubmission.playerId);
      } else {
        // Normal transition
        this.transitionToJudging();
      }
      return true;
    }

    if (this.phase === "JUDGING") {
      if (this.settings.judgingMode === "CZAR") {
        // Czar AFK, nobody wins, next round
        this.nextRound();
      } else {
        this.resolvePopularVote();
      }
      return true;
    }

    if (this.phase === "DISCARD_PHASE") {
      for (const p of this.players.values()) {
        if (!p.hasSubmitted) {
          this.skipDiscard(p.id);
        }
      }
      this.startRound();
      return true;
    }

    return false;
  }

  // ============================================================
  // Play Again
  // ============================================================

  playAgain(): void {
    this.phase = "LOBBY";
    this.phaseEndsAt = null;
    this.roundNumber = 0;
    this.judgeIndex = -1;
    this.currentBlackCard = null;
    this.submissions.clear();
    this.votes.clear();
    this.lastRevealedSubmissions = [];
    this.trades.clear();

    for (const p of this.players.values()) {
      p.score = 0;
      p.hand = [];
      p.isJudge = false;
      p.hasSubmitted = false;
      p.hasVoted = false;
    }
  }

  // ============================================================
  // Kick
  // ============================================================

  kickPlayer(hostId: string, targetId: string): void {
    const host = this.players.get(hostId);
    if (!host?.isHost) {
      throw new GameError(ErrorCodes.NOT_HOST, "Only the host can kick players.");
    }
    if (hostId === targetId) {
      throw new GameError(ErrorCodes.INVALID_CARDS, "Cannot kick yourself.");
    }
    if (!this.players.has(targetId)) {
      throw new GameError(ErrorCodes.NOT_IN_ROOM, "Player not in room.");
    }
    this.removePlayer(targetId);
  }

  // ============================================================
  // Helpers
  // ============================================================

  getWinner(): { id: string; name: string } | null {
    let best: InternalPlayer | null = null;
    for (const p of this.players.values()) {
      if (!best || p.score > best.score) best = p;
    }
    return best ? { id: best.id, name: best.name } : null;
  }

  getFinalScores(): Record<string, number> {
    const scores: Record<string, number> = {};
    for (const p of this.players.values()) {
      scores[p.id] = p.score;
    }
    return scores;
  }

  getAnonymousSubmissions(): AnonymousSubmission[] {
    const subs = [...this.submissions.entries()].map(([subId, sub]) => ({
      submissionId: subId,
      cards: sub.cards,
    }));
    subs.sort((a, b) => a.submissionId.localeCompare(b.submissionId));
    return subs;
  }
}

// ---- Utilities ----

function generateSubmissionId(): string {
  // Opaque ID that doesn't reveal player identity
  return `sub_${crypto.randomUUID().slice(0, 8)}`;
}

function fisherYatesShuffle<T>(arr: T[]): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}
