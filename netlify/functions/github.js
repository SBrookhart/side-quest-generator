function deriveQuest(issue) {
  const text = `${issue.title} ${issue.body || ""}`.toLowerCase();

  if (text.includes("hard to") || text.includes("confusing")) {
    return "Build a simple interactive explainer that makes this concept obvious in under a minute.";
  }

  if (text.includes("see") || text.includes("visibility")) {
    return "Create a visual dashboard that surfaces this information without requiring setup.";
  }

  if (text.includes("track") || text.includes("monitor")) {
    return "Design a lightweight tracker that updates automatically and requires zero configuration.";
  }

  if (text.includes("people ask") || text.includes("repeatedly")) {
    return "Turn this repeated question into a one-page reference tool people can bookmark.";
  }

  return "Prototype a small, user-facing tool that demonstrates a clearer or more delightful approach.";
}

export async function handler() {
  const res = await fetch(
    "https://api.github.com/search/issues?q=state:open is:issue in:title,body&per_page=40",
    {
      headers: {
        "User-Agent": "tech-murmurs",
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`
      }
    }
  );

  const data = await res.json();

  const ideas = (data.items || [])
    .filter(i => !i.pull_request)
    .slice(0, 2)
    .map(i => ({
      title: i.title,
      problem:
        i.body?.slice(0, 220) ||
        "A recurring developer pain point was described.",
      quest: deriveQuest(i),
      difficulty: "Easy",
      tags: ["Vibe", "Frontend"],
      sources: [
        {
          type: "github",
          name: "GitHub",
          url: i.html_url
        }
      ]
    }));

  return {
    statusCode: 200,
    body: JSON.stringify(ideas)
  };
}
