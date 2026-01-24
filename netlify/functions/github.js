export async function handler() {
  const BOT_MARKERS = ["[bot]", "dependabot"];

  const STAFFING = [
    "looking for",
    "help wanted",
    "tester",
    "please contact",
    "contributors",
    "seeking"
  ];

  const MAINTENANCE = [
    "bump ",
    "upgrade ",
    "chore:",
    "typo",
    "spelling",
    "docs:",
    "refactor"
  ];

  const FRICTION = [
    "does not work",
    "fails",
    "breaks",
    "cannot",
    "no way to",
    "missing",
    "confusing",
    "unclear",
    "unexpected",
    "problem",
    "issue"
  ];

  async function search(query) {
    const url =
      "https://api.github.com/search/issues?q=" +
      encodeURIComponent(query) +
      "&per_page=50";

    const res = await fetch(url, {
      headers: {
        "User-Agent": "tech-murmurs",
        "Accept": "application/vnd.github+json",
        "Authorization": `Bearer ${process.env.GITHUB_TOKEN}`
      }
    });

    const json = await res.json();
    return Array.isArray(json.items) ? json.items : [];
  }

  try {
    // Broad search: open issues with real text
    const rawIssues = await search(
      "state:open is:issue in:title,body"
    );

    const ideas = rawIssues
      .filter(issue => {
        const text = `${issue.title} ${issue.body || ""}`.toLowerCase();

        // Exclude PRs explicitly
        if (issue.pull_request) return false;

        // Exclude bots
        if (BOT_MARKERS.some(b => issue.user?.login?.toLowerCase().includes(b))) {
          return false;
        }

        // Exclude staffing posts
        if (STAFFING.some(p => text.includes(p))) return false;

        // Exclude maintenance / dependency noise
        if (MAINTENANCE.some(p => text.startsWith(p))) return false;

        // Require friction signal
        return FRICTION.some(p => text.includes(p));
      })
      .slice(0, 5)
      .map(issue => ({
        title: issue.title,
        problem:
          issue.body?.slice(0, 260) ||
          "A concrete source of unmet developer need was described.",
        quest:
          "Design and prototype a focused solution that reduces or removes this friction.",
        audience: issue.repository_url.split("/").pop(),
        difficulty: "Medium",
        tags: ["Infra", "Research"],
        sources: [
          {
            type: "github",
            url: issue.html_url
          }
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
