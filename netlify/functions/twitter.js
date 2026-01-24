export async function handler() {
  const QUERY =
    '(visualize OR dashboard OR "someone should build" OR "wish there was" ' +
    'OR "it would be cool if" OR "i want a tool") ' +
    '-is:retweet -is:reply lang:en';

  try {
    const res = await fetch(
      "https://api.twitter.com/2/tweets/search/recent" +
        "?query=" + encodeURIComponent(QUERY) +
        "&max_results=10" +
        "&tweet.fields=text",
      {
        headers: {
          "Authorization": `Bearer ${process.env.X_BEARER_TOKEN}`
        }
      }
    );

    const data = await res.json();
    if (!data.data) return { statusCode: 200, body: "[]" };

    const ideas = data.data
      .slice(0, 2)
      .map(t => ({
        title: "Ambient builder idea",
        problem: t.text.slice(0, 240),
        quest:
          "Turn this idea into a playful, shippable micro-project using modern web tools.",
        difficulty: "Easy",
        tags: ["Vibe", "Creative"],
        sources: [
          {
            type: "twitter",
            url: `https://twitter.com/i/web/status/${t.id}`
          }
        ]
      }));

    return {
      statusCode: 200,
      body: JSON.stringify(ideas)
    };
  } catch {
    return {
      statusCode: 200,
      body: "[]"
    };
  }
}
