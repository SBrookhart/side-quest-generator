// netlify/functions/twitter.js
// Purpose: Surface high-quality ambient signals from X to SUPPORT ideas,
// not generate them outright.

export async function handler() {
  const token = process.env.X_BEARER_TOKEN;

  // If no token, silently skip X as a source
  if (!token) {
    return {
      statusCode: 200,
      body: JSON.stringify([])
    };
  }

  // Carefully designed queries:
  // - confusion around existing tools
  // - explanation gaps
  // - visibility / discoverability pain
  // - excludes memes, retweets, replies
  const queries = [
    `"what does this do" (repo OR project OR tool) -is:retweet -is:reply lang:en`,
    `"hard to explain" (tool OR project OR library) -is:retweet -is:reply lang:en`,
    `"why is this so confusing" (software OR tool OR repo) -is:retweet -is:reply lang:en`,
    `"wish there was" (tool OR site OR app) -is:retweet -is:reply lang:en`
  ];

  const allSignals = [];

  for (const q of queries) {
    try {
      const url =
        "https://api.twitter.com/2/tweets/search/recent" +
        `?query=${encodeURIComponent(q)}` +
        "&max_results=10" +
        "&tweet.fields=created_at,public_metrics";

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!res.ok) continue;

      const json = await res.json();
      if (!json.data) continue;

      json.data.forEach(t => {
        // Filter out ultra-low-signal posts
        if (
          t.text.length < 40 ||
          t.text.length > 280 ||
          t.text.match(/lol|lmao|wtf|bro|💀/i)
        ) return;

        allSignals.push({
          text: t.text,
          url: `https://x.com/i/web/status/${t.id}`,
          metrics: t.public_metrics || {},
          created_at: t.created_at
        });
      });
    } catch {
      // Never break the pipeline because of X
      continue;
    }
  }

  // Deduplicate by text
  const uniqueSignals = [];
  const seen = new Set();

  for (const s of allSignals) {
    const key = s.text.slice(0, 80);
    if (!seen.has(key)) {
      seen.add(key);
      uniqueSignals.push(s);
    }
  }

  // Final shaping:
  // These are NOT ideas — they are receipts / language signals
  const output = uniqueSignals.slice(0, 5).map(s => ({
    source: "X",
    role: "supporting-signal",
    signal: s.text,
    url: s.url
  }));

  return {
    statusCode: 200,
    body: JSON.stringify(output)
  };
}
