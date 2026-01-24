export async function handler() {
  const STAFFING = [
    "looking for",
    "help wanted",
    "tester",
    "please contact",
    "contributors",
    "seeking"
  ];

  const HARD_FRICTION = [
    "does not work",
    "breaks",
    "fails",
    "cannot",
    "no way to",
    "missing",
    "incompatible",
    "workaround"
  ];

  const SOFT_FRICTION = [
    "how do i",
    "how can i",
    "is it possible",
    "question",
    "confusing",
    "unclear",
    "unexpected",
    "problem with",
    "issue with"
  ];

  const GENERIC_RELEASE = [
    "release",
    "version",
    "upgrade",
    "changelog",
    "v1.",
    "v2."
  ];

  async function fetchIssues(query) {
    const res = await fetch(
      `https://api.github.com/search/issues?q=${encodeURIComponent(query)}&per_page=50`,
      {
        headers: {
          "User-Agent": "tech-murmurs",
          "Accept": "application/vnd.github+json",
          "Authorization": `Bearer ${process.env.GITHUB_TOKEN}`
        }
      }
    );

    const json = await res.json();
    return Array.isArray(json.items) ? json.items : [];
  }

  try {
    // ─────────────────────────────
    // TIER 1: HARD FRICTION
    // ─────────────────────────────
    let issues = await fetchIssues(
      "state:open bug OR error OR failure"
    );

    let ideas = issues.filter(issue => {
      const text = `${issue.title} ${issue.body || ""}`.toLowerCase();
      if (STAFFING.some(p => text.includes(p))) return false;
      if (GENERIC_RELEASE.some(p => text.includes(p))) return false;
      return HARD_FRICTION.some(p => text.includes(p));
    });

    // ─────────────────────────────
    // TIER 2: SOFT FRICTION (QUESTIONS)
    // ─────────────────────────────
    if (ideas.length < 3) {
      const softIssues = await fetchIssues(
        "state:open question OR help OR how in:title,body"
      );

      const softIdeas = softIssues.filter(issue => {
        const text = `${issue.title} ${issue.body || ""}`.toLowerCase();
        if (STAFFING.some(p => text.includes(p))) return false;
        if (GENERIC_RELEASE.some(p => text.includes(p))) return false;
        return SOFT_FRICTION.some(p => text.includes(p));
      });

      ideas = ideas.concat(softIdeas);
    }

    // ─────────────────────────────
    // FINAL MAPPING (CAP AT 5)
    // ─────────────────────────────
    const finalIdeas = ideas.slice(0, 5).map(issue => ({
      title: issue.title,
      problem:
        issue.body?.slice(0, 260) ||
        "A concrete source of developer friction was described.",
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
      body: JSON.stringify(finalIdeas)
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
}
