// netlify/functions/twitter.js

export async function getTwitterSignals() {
  const token =
    process.env.TWITTER_BEARER_TOKEN ||
    process.env.X_BEARER_TOKEN;

  if (!token) {
    return [];
  }

  // Strong “someone should build” / unmet-need energy
  const query = [
    '"someone should build"',
    '"wish there was"',
    '"why isn’t there"',
    '"missing tool"',
    '"there should be a"',
    '"no good way to"'
  ].join(" OR ");

  const url =
    "https://api.twitter.com/2/tweets/search/recent?" +
    new URLSearchParams({
      query,
      "tweet.fields": "author_id,created_at,public_metrics",
      expansions: "author_id",
      "user.fields": "username",
      max_results: "10"
    }).toString();

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!res.ok) {
    return [];
  }

  const data = await res.json();
  if (!data.data || !data.includes?.users) {
    return [];
  }

  const users = Object.fromEntries(
    data.includes.users.map(u => [u.id, u])
  );

  return data.data.map(tweet => ({
    type: "twitter",
    name: "X Post",
    text: tweet.text,
    url: `https://x.com/${users[tweet.author_id]?.username}/status/${tweet.id}`
  }));
}

// ----- HTTP handler (for manual testing) -----
export default async function handler() {
  try {
    const signals = await getTwitterSignals();
    return Response.json(signals, { status: 200 });
  } catch {
    return Response.json(
      { error: "Twitter ingestion failed" },
      { status: 500 }
    );
  }
}
