// netlify/functions/hackathons.js

const HACKATHON_FEEDS = [
  "https://devpost.com/software/popular.rss",
  "https://ethglobal.com/events/feed.xml"
];

const MAX_ITEMS_PER_FEED = 10;

/* ---------- helpers ---------- */

function cleanText(text = "") {
  return text
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`[^`]*`/g, "")
    .replace(/<\/?[^>]+(>|$)/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 280);
}

function extractPrompt(text) {
  const lowered = text.toLowerCase();

  // heuristic: only keep things that sound like problems
  if (
    lowered.includes("build") ||
    lowered.includes("tool") ||
    lowered.includes("platform") ||
    lowered.includes("developer") ||
    lowered.includes("infrastructure") ||
    lowered.includes("workflow")
  ) {
    return text;
  }

  return null;
}

/* ---------- handler ---------- */

export default async function getHackathonSignals() {
  const signals = [];

  for (const feedUrl of HACKATHON_FEEDS) {
    try {
      const res = await fetch(feedUrl);

      if (!res.ok) {
        console.error("Hackathon feed failed:", feedUrl);
        continue;
      }

      const xml = await res.text();
      const items = xml.split("<item>").slice(1, MAX_ITEMS_PER_FEED + 1);

      for (const raw of items) {
        const titleMatch = raw.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/);
        const descMatch = raw.match(
          /<description><!\[CDATA\[(.*?)\]\]><\/description>/
        );
        const linkMatch = raw.match(/<link>(.*?)<\/link>/);
        const dateMatch = raw.match(/<pubDate>(.*?)<\/pubDate>/);

        const rawText = cleanText(
          descMatch?.[1] || titleMatch?.[1] || ""
        );

        const prompt = extractPrompt(rawText);
        if (!prompt || prompt.length < 80) continue;

        signals.push({
          type: "rss",
          text: prompt,
          url: linkMatch?.[1] || feedUrl,
          date: dateMatch
            ? new Date(dateMatch[1]).toISOString().slice(0, 10)
            : new Date().toISOString().slice(0, 10)
        });
      }
    } catch (err) {
      console.error("Hackathon ingestion error:", err);
    }
  }

  return signals;
}
