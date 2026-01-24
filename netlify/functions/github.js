function deriveQuest(issue) {
  const text = `${issue.title} ${issue.body || ""}`.toLowerCase();

  if (text.includes("visual") || text.includes("see")) {
    return "Build a visual interface that makes this problem obvious without reading documentation.";
  }

  if (text.includes("hard to") || text.includes("confusing")) {
    return "Create a tiny tool or demo that explains this in under one minute.";
  }

  if (text.includes("track") || text.includes("monitor")) {
    return "Design a simple tracker or dashboard that surfaces this information automatically.";
  }

  return "Turn this issue into a small, user-facing experiment that demonstrates a better approach.";
}

export async function handler() {
  const res = await fetch(
    "https://api.github.com/search/issues?q=state:open is:issue in:title,body&per_page=40",
    {
      headers: {
        "User-Agent": "tech-murmurs",
        "Accept": "application/vnd.github+json",
        "Authorization": `Bearer ${process.env.GITHUB_TOKEN}`
      }
    }
  );

  const data = await res.json();

  const ideas = (data.items || [])
    .filter(i => !i.pull_request)
    .slice(0, 2)
    .map(i => ({
      title: i.title,
      problem: i.body?.slice(0, 220) ||
        "A recurring developer pain point was described.",
      quest: deriveQuest(i),
      difficulty: "Easy",
      tags: ["Vibe", "Frontend"],
      sources: [
        {
          type: "github",
          url: i.html_url
        }
      ]
    }));

  return {
    statusCode: 200,
    body: JSON.stringify(ideas)
  };
}
