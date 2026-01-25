// netlify/functions/twitter.js

export async function getTwitterSignals() {
  const feeds = [
    "https://nitter.net/search/rss?f=tweets&q=missing+tool",
    "https://nitter.net/search/rss?f=tweets&q=wish+there+was"
  ];

  const results = [];

  for (const feed of feeds) {
    try {
      const res = await fetch(feed);
      if (!res.ok) continue;

      const text = await res.text();
      const matches = [...text.matchAll(/<title>(.*?)<\/title>/g)];

      matches.slice(0, 5).forEach(m => {
        results.push({
          type: "twitter",
          name: "X / Twitter",
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
  const signals = await getTwitterSignals();
  return Response.json(signals);
}
