export async function handler() {
  const res = await fetch(
    "https://api.twitter.com/2/tweets/search/recent?query=developer%20build%20feature",
    {
     headers: {
        "Authorization": `Bearer ${process.env.TWITTER_BEARER_TOKEN}`
      }
    }
  );

  const data = await res.json();

  const ideas = data.data.slice(0, 5).map(tweet => ({
    title: "Unbuilt idea from dev Twitter",
    origin: "Developer post on X",
    problem: tweet.text,
    quest: "Turn this expressed need into a minimal build.",
    audience: "Builders",
    difficulty: "Medium",
    tags: ["Product"],
    sources: [{
      type: "twitter",
      url: `https://x.com/i/web/status/${tweet.id}`
    }]
  }));

  return {
    statusCode: 200,
    body: JSON.stringify(ideas)
  };
}
