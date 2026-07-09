// ============================================================
// DeckManager — Card draw-pile management for a single game
// ============================================================

import type { BlackCard, WhiteCard } from "@xuuuxi/shared";

export class DeckManager {
  private blackPile: BlackCard[];
  private whitePile: WhiteCard[];
  private whiteDiscard: WhiteCard[] = [];

  constructor(blacks: BlackCard[], whites: WhiteCard[]) {
    this.blackPile = [...blacks];
    this.whitePile = [...whites];
    this.shuffle();
  }

  /** Fisher-Yates shuffle both piles */
  shuffle(): void {
    fisherYates(this.blackPile);
    fisherYates(this.whitePile);
  }

  /** Draw one black card from the pile */
  drawBlack(): BlackCard {
    if (this.blackPile.length === 0) {
      throw new Error("No black cards remaining — game should have ended.");
    }
    return this.blackPile.pop()!;
  }

  /** Draw N white cards from the pile */
  drawWhite(count: number): WhiteCard[] {
    // If not enough in the draw pile, reshuffle discards back in
    if (this.whitePile.length < count) {
      this.reshuffleWhiteDiscard();
    }

    // If still not enough after reshuffle, draw whatever remains
    const toDraw = Math.min(count, this.whitePile.length);
    const drawn: WhiteCard[] = [];
    for (let i = 0; i < toDraw; i++) {
      drawn.push(this.whitePile.pop()!);
    }
    return drawn;
  }

  /** Return white cards to the discard pile (end of round / discards) */
  returnWhite(cards: WhiteCard[]): void {
    this.whiteDiscard.push(...cards);
  }

  /** Reshuffle the discard pile into the draw pile */
  private reshuffleWhiteDiscard(): void {
    if (this.whiteDiscard.length === 0) return;
    this.whitePile.push(...this.whiteDiscard);
    this.whiteDiscard = [];
    fisherYates(this.whitePile);
  }

  get remainingBlack(): number {
    return this.blackPile.length;
  }

  get remainingWhite(): number {
    return this.whitePile.length + this.whiteDiscard.length;
  }
}

/** In-place Fisher-Yates shuffle */
function fisherYates<T>(arr: T[]): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}
