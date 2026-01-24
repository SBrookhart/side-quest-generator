export async function handler() {
  const QUERY =
    '(build OR building OR "someone should" OR wish OR missing OR "no tool") ' +
    '-is:retweet -is:reply lang:en';

  try {
    const res = await fetch(
      "https://api.twitter.com/2/tweets/search/recent" +
        "?query=" + encodeURIComponent(QUERY) +
        "&max_results=10" +
        "&tweet.fields=text,author_id,created_at",
      {
        headers: {
          "Authorization": `Bearer ${process.env.X_BEARER_TOKEN}`
        }
      }
    );

    if (!res.ok) {
      return {
        statusCode: 200,
        body: JSON.stringify([])
      };
    }

    const data = await res.json();

    if (!data.data) {
      return {
        statusCode: 200,
        body: JSON.stringify([])
      };
    }

    const ideas = data.data
      .filter(t => {
        const text = t.text.toLowerCase();
        return (
          text.includes("wish") ||
          text.includes("missing") ||
          text.includes("no tool") ||
          text.includes("someone should")
        );
      })
      .slice(0, 2)
      .map(t => ({
        title: "Ambient builder signal",
        problem: t.text.slice(0, 240),
        quest:
          "Extract a concrete side project that addresses the unmet need implied by this post.",
        difficulty: "Easy",
        tags: ["Product"],
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

  } catch (err) {
    return {
      statusCode: 200,
      body: JSON.stringify([])
    };
  }
}
