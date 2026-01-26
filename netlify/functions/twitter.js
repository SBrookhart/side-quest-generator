// netlify/functions/twitter.js

/**
 * NOTE:
 * We intentionally keep this conservative.
 * If X API credentials are missing, we return an empty array
 * instead of crashing the function.
 */

const MAX_RESULTS = 10;

// Lightweight intent filter phrases
const INTENT_PATTERNS = [
  "wish there was",
  "missing",
  "no tool",
  "hard to",
  "doesn't exist",
  "still no way",
  "why is there no",
  "someone should build"
];

function cleanText(text = "") {
  return text
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 280);
}

function looksLikeBuilderIntent(text) {
  const lower = text.toLowerCase();
  return INTENT_PATTERNS.some(p => lower.includes(p));
}

/**
 * Named export used by generateDaily.js
 */
export async function fetchTwitterSignals() {
  const BEARER = process.env.X_BEARER_TOKEN;

  // Hard safety: never crash if token missing
  if (!BEARER) {
    console.warn("X_BEARER_TOKEN missing — skipping X signals");
    return [];
  }

  const query = `
    (${INTENT_PATTERNS.join(" OR ")})
    -is:retweet
    lang:en
  `;

  const url =
    "https://api.twitter.com/2/tweets/search/recent" +
    `?query=${encodeURIComponent(query)}` +
    "&tweet.fields=created_at" +
    `&max_results=${MAX_RESULTS}`;

  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${BEARER}`
      }
    });

    if (!res.ok) {
      console.error("X API error:", res.status);
      return [];
    }

    const data = await res.json();
    if (!Array.isArray(data.data)) return [];

    return data.data
      .map(tweet => {
        const text = cleanText(tweet.text);
        if (!looksLikeBuilderIntent(text)) return null;

        return {
          type: "x",
          text,
          url: `https://x.com/i/web/status/${tweet.id}`,
          date: tweet.created_at
            ? tweet.created_at.slice(0, 10)
            : new Date().toISOString().slice(0, 10)
        };
      })
      .filter(Boolean);
  } catch (err) {
    console.error("X fetch failed:", err);
    return [];
  }
}

/**
 * Netlify function handler
 * Allows hitting /.netlify/functions/twitter directly
 */
export default async function handler() {
  const signals = await fetchTwitterSignals();
  return Response.json(signals);
}
