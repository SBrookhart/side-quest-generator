// netlify/functions/hackathons.js
export async function getHackathonSignals() {
  const FEED =
    "https://devpost.com/hackathons.rss";

  try {
    const res = await fetch(FEED);
    if (!res.ok) return [];

    const text = await res.text();
    const items = [...text.matchAll(/<item>([\s\S]*?)<\/item>/g)];

    return items.slice(0, 5).map(raw => {
      const title =
        raw[1].match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] || "";
      const link =
        raw[1].match(/<link>(.*?)<\/link>/)?.[1] || "";

      return {
        type: "rss",
        text: title,
        url: link,
        timestamp: new Date().toISOString()
      };
    });
  } catch {
    return [];
  }
}

export default async function handler() {
  return Response.json(await getHackathonSignals());
}
