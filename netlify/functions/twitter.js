// netlify/functions/twitter.js

const QUERY =
  '(missing OR "wish there was" OR "hard to" OR "no tool" OR frustrating) ' +
  '(build OR dev OR developer OR api OR infra OR tooling) -is:retweet';

const MAX_RESULTS = 30;

const NOISE = [
  "launch",
  "airdrop",
  "thread",
  "price",
  "🚀",
  "giveaway"
];

export default async function getTwitterSignals() {
  const token = process.env.TWITTER_BEARER_TOKEN;
  if (!token) return [];

  let res;

  try {
    res = await fetch(
      `https://api.twitter.com/2/tweets/search/recent?` +
        new URLSearchParams({
          query: QUERY,
          max_results: MAX_RESULTS,
          "tweet.fields": "created_at",
        }),
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
  } catch {
    return [];
  }

  if (!res.ok) return [];

  const json = await res.json();
  if (!json.data) return [];

  const signals = [];

  for (const tweet of json.data) {
    const text = tweet.text.toLowerCase();

    if (
      NOISE.some(w => text.includes(w)) ||
      text.length < 40
    ) {
      continue;
    }

    signals.push({
      type: "twitter",
      text: tweet.text
        .replace(/\s+/g, " ")
        .slice(0, 280)
        .trim(),
      url: `https://x.com/i/web/status/${tweet.id}`,
      date: new Date(tweet.created_at)
        .toISOString()
        .slice(0, 10)
    });
  }

  return signals;
}
