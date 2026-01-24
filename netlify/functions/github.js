export async function handler() {
  const STAFFING_PHRASES = [
    "looking for",
    "help wanted",
    "tester wanted",
    "please contact",
    "need contributors",
    "seeking volunteers"
  ];

  const GENERIC_TOOLING = [
    "tooling",
    "ecosystem",
    "support this release",
    "protocol changes",
    "new version",
    "v1.",
    "v2."
  ];

  const FRICTION_PHRASES = [
    "confusing",
    "unclear",
    "hard to",
    "difficult to",
    "does not work",
    "breaks",
    "fails",
    "cannot",
    "no way to",
    "missing",
    "incompatible",
    "unexpected",
    "workaround",
    "migration",
    "upgrade"
  ];

  try {
    // 🔑 NOTE: NO enhancement label
    const res = await fetch(
      "https://api.github.com/search/issues?q=state:open+(bug+OR+question)+in:title,body&per_page=40",
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

        if (STAFFING_PHRASES.some(p => text.includes(p))) return false;
        if (GENERIC_TOOLING.some(p => text.includes(p))) return false;

        // Require real friction
        return FRICTION_PHRASES.some(p => text.includes(p));
      })
      .map(issue => ({
        title: issue.title,
        origin: "GitHub issue",
        problem: issue.body?.slice(0, 280) || "A concrete source of friction was described.",
        quest:
          "Design a focused solution that reduces or eliminates this specific friction.",
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
