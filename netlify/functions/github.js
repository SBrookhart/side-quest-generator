export async function handler() {
  const STAFFING = [
    "looking for",
    "help wanted",
    "tester",
    "please contact",
    "contributors"
  ];

  const GENERIC = [
    "tooling",
    "ecosystem",
    "release",
    "version",
    "upgrade"
  ];

  const FRICTION = [
    "confusing",
    "unclear",
    "hard to",
    "does not work",
    "fails",
    "breaks",
    "no way to",
    "missing",
    "cannot",
    "workaround"
  ];

  try {
    const res = await fetch(
      "https://api.github.com/search/issues?q=state:open+(bug+OR+question)+in:title,body&per_page=50",
      {
        headers: {
          "User-Agent": "tech-murmurs",
          "Accept": "application/vnd.github+json",
          "Authorization": `Bearer ${process.env.GITHUB_TOKEN}`
        }
      }
    );

    const data = await res.json();

    const ideas = data.items
      .filter(issue => {
        const text = `${issue.title} ${issue.body || ""}`.toLowerCase();

        if (STAFFING.some(p => text.includes(p))) return false;
        if (GENERIC.some(p => text.includes(p))) return false;

        return FRICTION.some(p => text.includes(p));
      })
      .slice(0, 8)
      .map(issue => ({
        title: issue.title,
        problem:
          issue.body?.slice(0, 240) ||
          "A concrete source of friction was described.",
        quest:
          "Design a focused solution that reduces or eliminates this friction.",
        audience: issue.repository_url.split("/").pop(),
        difficulty: "Medium",
        tags: ["Infra", "Research"],
        sources: [
          { type: "github", url: issue.html_url }
        ]
      }));

    return {
      statusCode: 200,
      body: JSON.stringify(ideas)
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
}
