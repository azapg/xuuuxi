// ============================================================
// REST API — Collection CRUD handlers
// ============================================================

import { db } from "../db/index";
import { collections, blackCards, whiteCards } from "../db/schema";
import { eq, and, sql } from "drizzle-orm";
import type { BlackCard, WhiteCard, CollectionSummary, CollectionWithCards } from "@xuuuxi/shared";

// ---- Helper to build JSON responses ----

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function error(message: string, status = 400): Response {
  return json({ error: message }, status);
}

// ============================================================
// GET /api/collections
// ============================================================

export async function listCollections(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const locale = url.searchParams.get("locale");
  const isDefault = url.searchParams.get("default");

  // Build conditions
  let rows: any[];

  if (locale && isDefault === "true") {
    rows = await db
      .select()
      .from(collections)
      .where(and(eq(collections.locale, locale), eq(collections.isDefault, true)));
  } else if (locale) {
    rows = await db.select().from(collections).where(eq(collections.locale, locale));
  } else if (isDefault === "true") {
    rows = await db.select().from(collections).where(eq(collections.isDefault, true));
  } else {
    rows = await db.select().from(collections);
  }

  // Add card counts
  const summaries: CollectionSummary[] = await Promise.all(
    rows.map(async (c: any) => {
      const [blackCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(blackCards)
        .where(eq(blackCards.collectionId, c.id));
      const [whiteCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(whiteCards)
        .where(eq(whiteCards.collectionId, c.id));

      return {
        id: c.id,
        name: c.name,
        description: c.description,
        locale: c.locale,
        isDefault: c.isDefault,
        createdBy: c.createdBy,
        createdAt: c.createdAt instanceof Date ? c.createdAt.getTime() : c.createdAt,
        updatedAt: c.updatedAt instanceof Date ? c.updatedAt.getTime() : c.updatedAt,
        blackCardCount: blackCount.count,
        whiteCardCount: whiteCount.count,
      };
    })
  );

  return json(summaries);
}

// ============================================================
// GET /api/collections/:id
// ============================================================

export async function getCollection(id: string): Promise<Response> {
  const row = await db.query.collections.findFirst({
    where: eq(collections.id, id),
  });

  if (!row) return error("Collection not found.", 404);

  const blacks = await db
    .select({ id: blackCards.id, text: blackCards.text, pick: blackCards.pick })
    .from(blackCards)
    .where(eq(blackCards.collectionId, id));

  const whites = await db
    .select({ id: whiteCards.id, text: whiteCards.text })
    .from(whiteCards)
    .where(eq(whiteCards.collectionId, id));

  const result: CollectionWithCards = {
    id: row.id,
    name: row.name,
    description: row.description,
    locale: row.locale,
    isDefault: row.isDefault,
    createdBy: row.createdBy,
    createdAt: row.createdAt instanceof Date ? row.createdAt.getTime() : (row.createdAt as unknown as number),
    updatedAt: row.updatedAt instanceof Date ? row.updatedAt.getTime() : (row.updatedAt as unknown as number),
    blackCards: blacks,
    whiteCards: whites,
  };

  return json(result);
}

// ============================================================
// POST /api/collections
// ============================================================

export async function createCollection(req: Request): Promise<Response> {
  const body = await req.json();
  const { name, description, locale, isDefault, createdBy } = body;

  if (!name || typeof name !== "string") {
    return error("Name is required.");
  }

  const now = new Date();
  const id = crypto.randomUUID();

  await db.insert(collections).values({
    id,
    name,
    description: description ?? "",
    locale: locale ?? "es-419",
    isDefault: isDefault ?? false,
    createdBy: createdBy ?? null,
    createdAt: now,
    updatedAt: now,
  });

  return json({ id, name }, 201);
}

// ============================================================
// PUT /api/collections/:id
// ============================================================

export async function updateCollection(id: string, req: Request): Promise<Response> {
  const body = await req.json();

  const existing = await db.query.collections.findFirst({
    where: eq(collections.id, id),
  });
  if (!existing) return error("Collection not found.", 404);

  await db
    .update(collections)
    .set({
      name: body.name ?? existing.name,
      description: body.description ?? existing.description,
      locale: body.locale ?? existing.locale,
      isDefault: body.isDefault ?? existing.isDefault,
      updatedAt: new Date(),
    })
    .where(eq(collections.id, id));

  return json({ id, updated: true });
}

// ============================================================
// DELETE /api/collections/:id
// ============================================================

export async function deleteCollection(id: string): Promise<Response> {
  const existing = await db.query.collections.findFirst({
    where: eq(collections.id, id),
  });
  if (!existing) return error("Collection not found.", 404);

  await db.delete(collections).where(eq(collections.id, id));
  return json({ id, deleted: true });
}

// ============================================================
// POST /api/collections/:id/cards
// ============================================================

export async function addCards(collectionId: string, req: Request): Promise<Response> {
  const existing = await db.query.collections.findFirst({
    where: eq(collections.id, collectionId),
  });
  if (!existing) return error("Collection not found.", 404);

  const body = await req.json();
  const addedBlack: string[] = [];
  const addedWhite: string[] = [];

  if (body.black && Array.isArray(body.black)) {
    const values = body.black.map((c: { text: string; pick?: number }) => ({
      id: crypto.randomUUID(),
      collectionId,
      text: c.text,
      pick: c.pick ?? 1,
    }));
    await db.insert(blackCards).values(values);
    addedBlack.push(...values.map((v: { id: string }) => v.id));
  }

  if (body.white && Array.isArray(body.white)) {
    const values = body.white.map((c: { text: string }) => ({
      id: crypto.randomUUID(),
      collectionId,
      text: c.text,
    }));
    await db.insert(whiteCards).values(values);
    addedWhite.push(...values.map((v: { id: string }) => v.id));
  }

  await db
    .update(collections)
    .set({ updatedAt: new Date() })
    .where(eq(collections.id, collectionId));

  return json({ addedBlack: addedBlack.length, addedWhite: addedWhite.length }, 201);
}

// ============================================================
// DELETE /api/collections/:id/cards/:cardId
// ============================================================

export async function removeCard(collectionId: string, cardId: string): Promise<Response> {
  // Try to delete from black cards first
  const blackResult = await db
    .delete(blackCards)
    .where(and(eq(blackCards.id, cardId), eq(blackCards.collectionId, collectionId)));

  // Try white cards
  const whiteResult = await db
    .delete(whiteCards)
    .where(and(eq(whiteCards.id, cardId), eq(whiteCards.collectionId, collectionId)));

  await db
    .update(collections)
    .set({ updatedAt: new Date() })
    .where(eq(collections.id, collectionId));

  return json({ deleted: true });
}
