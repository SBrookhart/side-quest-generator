export async function handler() {
  const BAD_PHRASES = [
    "looking for",
    "help wanted",
    "tester wanted",
    "please contact",
    "need contributors",
    "seeking volunteers"
  ];

  const GOOD_PHRASES = [
    "no way to",
    "missing",
    "does not support",
    "cannot",
    "hard to",
    "would be useful if",
    "feature request",
    "support for"
  ];

  try {
    const res = await fetch(
      "https://api.github.com/search/issues?q=state:open+label:enhancement&per_page=20",
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

        // Filter out staffing / coordination noise
        if (BAD_PHRASES.some(p => text.includes(p))) return false;

        // Require at least one unmet-need signal
        return GOOD_PHRASES.some(p => text.includes(p));
      })
      .map(issue => ({
        title: issue.title,
        origin: "GitHub issue",
        problem: issue.body?.slice(0, 200) || "Unspecified limitation",
        quest: "Design and prototype a solution that addresses this missing capability.",
        audience: issue.repository_url.split("/").pop(),
        difficulty: "Medium",
        tags: ["Infra"],
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
