import { getStore } from "@netlify/blobs";
import generateDaily from "./generateDaily.js";

export default async function handler(req) {
  try {
    const store = getStore("tech-murmurs-archive");

    // Use UTC date to stay consistent
    const today = new Date().toISOString().slice(0, 10);
    const key = `daily-${today}`;

    // 1️⃣ Try to load today’s snapshot
    const existing = await store.get(key, { type: "json" });

    if (existing && Array.isArray(existing) && existing.length) {
      return json(existing);
    }

    // 2️⃣ No snapshot yet → generate live data
    const freshIdeas = await generateDaily();

    // Safety: if generation failed, fallback gracefully
    if (!Array.isArray(freshIdeas) || !freshIdeas.length) {
      return json([], 200);
    }

    // 3️⃣ Persist today’s snapshot
    await store.set(key, freshIdeas);

    return json(freshIdeas);
  } catch (err) {
    console.error("latest.js error:", err);
    return json([], 200);
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}
