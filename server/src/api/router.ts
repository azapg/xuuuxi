// ============================================================
// REST API Router
// ============================================================

import {
  listCollections,
  getCollection,
  createCollection,
  updateCollection,
  deleteCollection,
  addCards,
  removeCard,
} from "./collections";

// CORS headers for local dev (Vite on :5173)
const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "http://localhost:5173",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function withCors(response: Response): Response {
  for (const [key, value] of Object.entries(CORS_HEADERS)) {
    response.headers.set(key, value);
  }
  return response;
}

/** Handle CORS preflight */
function handleOptions(): Response {
  return withCors(new Response(null, { status: 204 }));
}

/** Main REST router */
export async function routeRest(req: Request): Promise<Response> {
  // Handle preflight
  if (req.method === "OPTIONS") return handleOptions();

  const url = new URL(req.url);
  const path = url.pathname;
  const method = req.method;

  try {
    // --- /api/collections ---
    if (path === "/api/collections" && method === "GET") {
      return withCors(await listCollections(req));
    }

    if (path === "/api/collections" && method === "POST") {
      return withCors(await createCollection(req));
    }

    // --- /api/collections/:id ---
    const collectionMatch = path.match(/^\/api\/collections\/([^/]+)$/);
    if (collectionMatch) {
      const id = decodeURIComponent(collectionMatch[1]);

      if (method === "GET") return withCors(await getCollection(id));
      if (method === "PUT") return withCors(await updateCollection(id, req));
      if (method === "DELETE") return withCors(await deleteCollection(id));
    }

    // --- /api/collections/:id/cards ---
    const cardsMatch = path.match(/^\/api\/collections\/([^/]+)\/cards$/);
    if (cardsMatch && method === "POST") {
      const id = decodeURIComponent(cardsMatch[1]);
      return withCors(await addCards(id, req));
    }

    // --- /api/collections/:id/cards/:cardId ---
    const cardMatch = path.match(/^\/api\/collections\/([^/]+)\/cards\/([^/]+)$/);
    if (cardMatch && method === "DELETE") {
      const collectionId = decodeURIComponent(cardMatch[1]);
      const cardId = decodeURIComponent(cardMatch[2]);
      return withCors(await removeCard(collectionId, cardId));
    }

    // --- 404 ---
    return withCors(
      new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      })
    );
  } catch (err) {
    console.error("API Error:", err);
    return withCors(
      new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    );
  }
}
