export async function handler() {
  const token = process.env.X_BEARER_TOKEN;
  if (!token) return { statusCode: 200, body: "[]" };

  const query =
    '"what does this do" OR "why is this so confusing" OR "wish there was" ' +
    '(tool OR repo OR project) -is:retweet -is:reply lang:en';

  const url =
    "https://api.twitter.com/2/tweets/search/recent" +
    `?query=${encodeURIComponent(query)}` +
    "&max_results=10&tweet.fields=created_at";

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const json = await res.json();

  const signals = (json.data || [])
    .filter(t =>
      t.text.length > 40 &&
      !/lol|lmao|wtf|bro|💀/i.test(t.text)
    )
    .map(t => ({
      type: "twitter",
      name: "X",
      url: `https://x.com/i/web/status/${t.id}`,
      text: t.text
    }));

  return {
    statusCode: 200,
    body: JSON.stringify(signals)
  };
}
