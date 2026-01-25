// netlify/functions/hackathons.js

export async function getHackathonSignals() {
  const feeds = [
    "https://devpost.com/software/popular.rss"
  ];

  const signals = [];

  for (const feed of feeds) {
    try {
      const res = await fetch(feed);
      if (!res.ok) continue;

      const text = await res.text();

      const matches =
        text.match(/<title>(.*?)<\/title>|<description>(.*?)<\/description>/gi) || [];

      for (const m of matches) {
        const cleaned = m
          .replace(/<\/?[^>]+(>|$)/g, "")
          .toLowerCase();

        if (
          cleaned.includes("build") ||
          cleaned.includes("challenge") ||
          cleaned.includes("problem") ||
          cleaned.includes("idea")
        ) {
          signals.push({
            type: "hackathon",
            name: "Hackathon Prompt",
            text: cleaned.slice(0, 300),
            url: feed
          });
        }
      }
    } catch {
      continue;
    }
  }

  return signals.slice(0, 5);
}

// Netlify HTTP handler
export default async function handler() {
  try {
    const signals = await getHackathonSignals();
    return Response.json(signals, { status: 200 });
  } catch {
    return Response.json(
      { error: "Hackathon ingestion failed" },
      { status: 500 }
    );
  }
}
