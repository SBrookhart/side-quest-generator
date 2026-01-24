export async function handler() {
  // Language that indicates coordination or vague obligation
  const GENERIC_PHRASES = [
    "tooling required",
    "ecosystem tooling",
    "supporting this release",
    "new protocol changes require",
    "build a tool for",
    "tool or visualization"
  ];

  // Language that indicates staffing or recruitment
  const STAFFING_PHRASES = [
    "looking for",
    "help wanted",
    "tester wanted",
    "please contact",
    "need contributors",
    "seeking volunteers"
  ];

  // Language that indicates *felt friction*
  const FRICTION_PHRASES = [
    "confusing",
    "unclear",
    "hard to",
    "difficult to",
    "does not work",
    "breaks when",
    "incompatible",
    "no way to",
    "missing support",
    "cannot",
    "fails to",
    "unexpected behavior",
    "workaround",
    "migration pain",
    "hard to migrate"
  ];

  try {
    const res = await fetch(
      "https://api.github.com/search/issues?q=state:open+label:enhancement&per_page=30",
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

        // Reject staffing & coordination
        if (STAFFING_PHRASES.some(p => text.includes(p))) return false;

        // Reject generic release/tooling boilerplate
        if (GENERIC_PHRASES.some(p => text.includes(p))) return false;

        // Require at least one sign of real friction
        return FRICTION_PHRASES.some(p => text.includes(p));
      })
      .map(issue => ({
        title: issue.title,
        origin: "GitHub issue",
        problem:
          issue.body?.slice(0, 240) ||
          "A concrete limitation or source of friction was identified.",
        quest:
          "Design a focused solution that reduces this specific source of friction.",
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
