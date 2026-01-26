// netlify/functions/hackathons.js

const FEEDS = [
  "https://devpost.com/hackathons.rss"
];

const NOISE_WORDS = [
  "prize",
  "cash",
  "reward",
  "sponsored",
  "winners",
  "apply now"
];

export default async function getHackathonSignals() {
  const signals = [];

  for (const feedUrl of FEEDS) {
    let res;
    try {
      res = await fetch(feedUrl);
    } catch {
      continue;
    }

    if (!res.ok) continue;

    const xml = await res.text();

    const items = xml.split("<item>").slice(1);

    for (const item of items) {
      const title =
        item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] || "";

      const description =
        item.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/)?.[1] ||
        "";

      const link =
        item.match(/<link>(.*?)<\/link>/)?.[1] || "";

      const pubDate =
        item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || "";

      const text = `${title} ${description}`.toLowerCase();

      if (
        !text ||
        NOISE_WORDS.some(w => text.includes(w))
      ) {
        continue;
      }

      signals.push({
        type: "rss",
        text: description
          .replace(/<[^>]+>/g, "")
          .replace(/\s+/g, " ")
          .slice(0, 280)
          .trim(),
        url: link,
        date: pubDate
          ? new Date(pubDate).toISOString().slice(0, 10)
          : new Date().toISOString().slice(0, 10)
      });
    }
  }

  return signals;
}
