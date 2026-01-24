export async function handler() {
  const res = await fetch(
    "https://api.github.com/search/issues?q=label:help+wanted+state:open&per_page=5",
    {
      headers: {
        "Accept": "application/vnd.github+json"
      }
    }
  );

  const data = await res.json();

  const ideas = data.items.map(issue => ({
    title: issue.title,
    origin: "GitHub issue",
    problem: issue.body?.slice(0, 180) || "Missing feature or unmet developer need.",
    quest: "Build a focused solution addressing this open issue.",
    audience: issue.repository_url.split("/").slice(-1)[0],
    difficulty: "Medium",
    tags: ["Infra"],
    sources: [{
      type: "github",
      url: issue.html_url
    }]
  }));

  return {
    statusCode: 200,
    body: JSON.stringify(ideas)
  };
}
