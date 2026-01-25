// netlify/functions/articles.js

export async function getArticleSignals() {
  const feeds = [
    "https://dev.to/feed",
    "https://hashnode.com/rss"
  ];

  const signals = [];

  for (const feed of feeds) {
    try {
      const res = await fetch(feed);
      if (!res.ok) continue;

      const text = await res.text();

      // Very lightweight extraction — no scraping, no parsing libs
      const matches = text.match(/<title>(.*?)<\/title>|<description>(.*?)<\/description>/gi) || [];

      for (const m of matches) {
        const cleaned = m
          .replace(/<\/?[^>]+(>|$)/g, "")
          .toLowerCase();

        if (
          cleaned.includes("hard to") ||
          cleaned.includes("missing") ||
          cleaned.includes("wish there was") ||
          cleaned.includes("no good way")
        ) {
          signals.push({
            type: "article",
            name: "Developer Essay",
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

// Required Netlify handler
export default async function handler() {
  try {
    const signals = await getArticleSignals();
    return Response.json(signals, { status: 200 });
  } catch {
    return Response.json(
      { error: "Article ingestion failed" },
      { status: 500 }
    );
  }
}
