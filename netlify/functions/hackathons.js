// netlify/functions/hackathons.js

export async function getHackathonSignals() {
  const feeds = [
    "https://devpost.com/feed",
    "https://mlh.io/rss"
  ];

  const results = [];

  for (const feed of feeds) {
    try {
      const res = await fetch(feed);
      if (!res.ok) continue;

      const text = await res.text();

      // very lightweight RSS scan (intentional)
      const matches = [...text.matchAll(/<title><!\[CDATA\[(.*?)\]\]><\/title>/g)];

      matches.slice(0, 5).forEach(m => {
        results.push({
          type: "rss",
          name: "Hackathon",
          text: m[1],
          url: feed
        });
      });
    } catch {
      continue;
    }
  }

  return results;
}

export default async function handler() {
  const signals = await getHackathonSignals();
  return Response.json(signals);
}
