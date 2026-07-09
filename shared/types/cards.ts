// ============================================================
// Card & Collection Types
// ============================================================

/** A black (prompt) card that players respond to */
export interface BlackCard {
  id: string;
  text: string;
  /** How many white cards a player must submit (1, 2, or 3) */
  pick: number;
}

/** A white (response) card played by players */
export interface WhiteCard {
  id: string;
  text: string;
}

/** A themed set of cards that can be shared and combined */
export interface Collection {
  id: string;
  name: string;
  description: string;
  /** BCP-47 locale tag, e.g. "es-MX", "en-US" */
  locale: string;
  /** Whether this ships with the game as a default pack */
  isDefault: boolean;
  /** User ID of creator, null for built-in collections */
  createdBy: string | null;
  createdAt: number;
  updatedAt: number;
}

/** Collection with its cards loaded */
export interface CollectionWithCards extends Collection {
  blackCards: BlackCard[];
  whiteCards: WhiteCard[];
}

/** Summary info for listing collections (without full card data) */
export interface CollectionSummary extends Collection {
  blackCardCount: number;
  whiteCardCount: number;
}
