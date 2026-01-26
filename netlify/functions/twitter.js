// netlify/functions/twitter.js
// X (formerly Twitter) signal ingestion

const SEARCH_QUERIES = [
  "wish there was",
  "missing tool",
  "no good way to",
  "hard to build",
  "developers struggle",
  "any tool for",
  "why is it so hard"
];

const MAX_RESULTS = 15;

/* ---------- helpers ---------- */

function cleanText(text = "") {
  return text
    .replace(/https?:\/\/\S+/g, "") // remove links
    .replace(/#[^\s]+/g, "")        // remove hashtags
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 240);
}

function isHighSignal(text) {
  const lowered = text.toLowerCase();

  return (
    lowered.includes("wish") ||
    lowered.includes("missing") ||
    lowered.includes("no way") ||
    lowered.includes("hard to") ||
    lowered.includes("any tool") ||
    lowered.includes("does anyone")
  );
}

/* ---------- handler ---------- */

export default async function getTwitterSignals() {
  const bearer = process.env.X_BEARER_TOKEN;

  if (!bearer) {
    console.warn("X bearer token missing");
    return [];
  }

  const query = SEARCH_QUERIES.join(" OR ");

  const url =
    "https://api.twitter.com/2/tweets/search/recent" +
    `?query=${encodeURIComponent(query)}` +
    "&tweet.fields=created_at,lang" +
    "&max_results=10";

  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${bearer}`
      }
    });

    if (!res.ok) {
      console.error("X API failed:", res.status);
      return [];
    }

    const data = await res.json();

    if (!Array.isArray(data.data)) return [];

    return data.data
      .map(tweet => {
        if (tweet.lang !== "en") return null;

        const text = cleanText(tweet.text);
        if (text.length < 80) return null;
        if (!isHighSignal(text)) return null;

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
    console.error("X ingestion error:", err);
    return [];
  }
}
