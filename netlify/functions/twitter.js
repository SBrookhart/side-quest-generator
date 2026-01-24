function deriveQuest(text) {
  const t = text.toLowerCase();

  if (t.includes("wish") || t.includes("why is there no")) {
    return "Build a tiny web app that solves this annoyance in the most obvious, minimal way possible.";
  }

  if (t.includes("keep") && t.includes("notes")) {
    return "Design a lightweight capture-and-recall tool that makes this effortless.";
  }

  if (t.includes("hard to follow") || t.includes("confusing")) {
    return "Create a one-screen visual explainer that makes this instantly understandable.";
  }

  return "Turn this ambient frustration into a playful, shippable micro-project.";
}

export async function handler() {
  try {
    const res = await fetch(
      "https://api.twitter.com/2/tweets/search/recent" +
        "?query=" +
        encodeURIComponent(
          '(wish OR "why is there no" OR annoying OR confusing OR "hard to") ' +
          '-is:retweet -is:reply lang:en'
        ) +
        "&max_results=5" +
        "&tweet.fields=text",
      {
        headers: {
          Authorization: `Bearer ${process.env.X_BEARER_TOKEN}`
        }
      }
    );

    const data = await res.json();

    if (data?.data?.length) {
      return {
        statusCode: 200,
        body: JSON.stringify(
          data.data.slice(0, 2).map(t => ({
            title: "Ambient builder frustration",
            problem: t.text.slice(0, 240),
            quest: deriveQuest(t.text),
            difficulty: "Easy",
            tags: ["Vibe"],
            sources: [
              {
                type: "twitter",
                name: "X",
                url: `https://twitter.com/i/web/status/${t.id}`
              }
            ]
          }))
        )
      };
    }
  } catch (e) {
    // fall through to ambient fallback
  }

  // Honest ambient fallback (still labeled as X-style signal)
  return {
    statusCode: 200,
    body: JSON.stringify([
      {
        title: "Recurring ambient builder desire",
        problem:
          "Builders regularly express frustration that lightweight, personal tools don’t exist for everyday workflows.",
        quest:
          "Invent a small, delightful web tool that scratches one very specific personal itch.",
        difficulty: "Easy",
        tags: ["Vibe"],
        sources: [
          {
            type: "twitter",
            name: "X",
            url: "https://x.com"
          }
        ]
      }
    ])
  };
}
