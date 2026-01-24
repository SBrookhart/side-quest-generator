function deriveQuestFromText(text) {
  const lower = text.toLowerCase();

  if (lower.includes("wish") || lower.includes("why isn't there")) {
    return "Build a lightweight web app that solves this exact annoyance in the simplest possible way.";
  }

  if (lower.includes("track") || lower.includes("keep track")) {
    return "Create a small tracker or dashboard that makes this easy to see at a glance.";
  }

  if (lower.includes("see") || lower.includes("visual")) {
    return "Design a visual interface that makes this information intuitive and delightful.";
  }

  if (lower.includes("confusing") || lower.includes("hard to understand")) {
    return "Build an explainer or interactive demo that makes this concept obvious in under 60 seconds.";
  }

  return "Turn this observation into a playful, shippable micro-project using modern web tools.";
}

export async function handler() {
  const QUERY =
    '(wish OR "why is it" OR "why isn’t" OR annoying OR confusing OR "hard to" OR "i keep") ' +
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
    if (!data.data) {
      return { statusCode: 200, body: JSON.stringify([]) };
    }

    const ideas = data.data
      .slice(0, 2)
      .map(t => ({
        title: "Ambient builder frustration",
        problem: t.text.slice(0, 240),
        quest: deriveQuestFromText(t.text),
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
  } catch (err) {
    return {
      statusCode: 200,
      body: JSON.stringify([])
    };
  }
}
