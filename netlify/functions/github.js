export async function handler() {
  const STAFFING = [
    "looking for",
    "help wanted",
    "tester",
    "please contact",
    "contributors",
    "seeking"
  ];

  const RELEASE_NOISE = [
    "release",
    "changelog",
    "version",
    "upgrade",
    "v1.",
    "v2."
  ];

  const HARD_FRICTION = [
    "does not work",
    "fails",
    "breaks",
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
    "confusing",
    "unclear",
    "unexpected",
    "problem",
    "issue"
  ];

  async function searchGitHub(query) {
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
    // ─────────────────────────────
    // QUERY 1: BUGS WITH DESCRIPTIVE TEXT
    // ─────────────────────────────
    let issues = await searchGitHub(
      "state:open label:bug in:title,body"
    );

    // ─────────────────────────────
    // QUERY 2: QUESTIONS / CONFUSION
    // ─────────────────────────────
    if (issues.length < 10) {
      const questions = await searchGitHub(
        "state:open label:question in:title,body"
      );
      issues = issues.concat(questions);
    }

    // ─────────────────────────────
    // FILTER + SCORE
    // ─────────────────────────────
    const ideas = issues
      .filter(issue => {
        const text = `${issue.title} ${issue.body || ""}`.toLowerCase();

        if (STAFFING.some(p => text.includes(p))) return false;
        if (RELEASE_NOISE.some(p => text.includes(p))) return false;

        return (
          HARD_FRICTION.some(p => text.includes(p)) ||
          SOFT_FRICTION.some(p => text.includes(p))
        );
      })
      .slice(0, 5)
      .map(issue => ({
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
      body: JSON.stringify(ideas)
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
}
