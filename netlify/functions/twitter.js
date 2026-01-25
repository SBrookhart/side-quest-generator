export async function getTwitterSignals() {
  const token = process.env.TWITTER_BEARER_TOKEN;
  if (!token) return [];

  const res = await fetch(
    "https://api.twitter.com/2/tweets/search/recent?query=someone%20should%20build&max_results=10",
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  const data = await res.json();

  return (data.data || []).map(tweet => ({
    type: "x",
    name: "X / Twitter",
    url: `https://x.com/i/web/status/${tweet.id}`,
    text: tweet.text
  }));
}
