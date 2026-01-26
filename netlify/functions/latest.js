// netlify/functions/latest.js
import { getStore } from "@netlify/blobs";

export async function handler() {
  const store = getStore({ name: "tech-murmurs" });
  const latest = await store.get("latest");

  if (!latest) {
    return new Response(JSON.stringify({ ideas: [] }), { status: 200 });
  }

  return new Response(latest, { status: 200 });
}
