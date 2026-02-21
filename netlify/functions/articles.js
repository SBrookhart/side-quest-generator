// netlify/functions/articles.js

const FEEDS = [
  { url: "https://dev.to/feed", source: "dev.to", type: "rss" },
  { url: "https://hashnode.com/rss", source: "hashnode", type: "rss" }
];

const MAX_PER_FEED = 6;

function extractItems(xml) {
  const items = [];
  const itemBlocks = xml.match(/<item>([\s\S]*?)<\/item>/gi) || [];

  for (const block of itemBlocks) {
    // Title: handle both CDATA and plain
    const titleMatch = block.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/i)
      || block.match(/<title>([\s\S]*?)<\/title>/i);
    const title = (titleMatch?.[1] || '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();

    // Link: prefer <link>, fall back to <guid> if it looks like a URL
    const linkMatch = block.match(/<link>(https?:\/\/[^\s<]+)<\/link>/i)
      || block.match(/<guid[^>]*>(https?:\/\/[^\s<]+)<\/guid>/i);
    const url = (linkMatch?.[1] || '').trim();

    if (title.length > 15 && url.startsWith('http')) {
      items.push({ title, url });
    }
  }

  return items.slice(0, MAX_PER_FEED);
}

export async function getArticleSignals() {
  const signals = [];

  for (const feed of FEEDS) {
    try {
      const res = await fetch(feed.url, {
        signal: AbortSignal.timeout(8000),
        headers: { 'User-Agent': 'TechMurmurs/1.0 (+https://techmurmurs.com)' }
      });
      if (!res.ok) continue;

      const xml = await res.text();
      const items = extractItems(xml);

      for (const item of items) {
        signals.push({
          type: feed.type,
          source: feed.source,
          name: item.title.slice(0, 100),
          text: item.title,
          url: item.url
        });
      }
    } catch {
      continue;
    }
  }

  return signals;
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
