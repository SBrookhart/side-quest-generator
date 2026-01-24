export async function handler() {
  const VIBE_SIGNALS = [
    "visualize",
    "surface",
    "explore",
    "track",
    "map",
    "summarize",
    "show",
    "highlight",
    "dashboard",
    "idea",
    "concept",
    "tool"
  ];

  const HARD_TECH = [
    "compiler",
    "kernel",
    "thread",
    "memory",
    "race",
    "segfault",
    "dependency",
    "benchmark",
    "performance",
    "upgrade",
    "migration",
    "refactor"
  ];

  async function search(query) {
    const res = await fetch(
      "https://api.github.com/search/issues?q=" +
        encodeURIComponent(query) +
        "&per_page=50",
      {
        headers: {
          "User-Agent": "tech-murmurs",
          "Accept": "application/vnd.github+json",
          "Authorization": `Bearer ${process.env.GITHUB_TOKEN}`
        }
      }
    );
    const json = await res.json();
    return json.items || [];
  }

  const issues = await search("state:open is:issue in:title,body");

  const ideas = issues
    .filter(i => {
      if (i.pull_request) return false;
      const text = `${i.title} ${i.body || ""}`.toLowerCase();
      if (HARD_TECH.some(t => text.includes(t))) return false;
      return VIBE_SIGNALS.some(v => text.includes(v));
    })
    .slice(0, 2)
    .map(i => ({
      title: i.title,
      problem: i.body?.slice(0, 220) ||
        "An opportunity to build something lightweight and exploratory.",
      quest:
        "Build a small, creative tool that surfaces or visualizes this idea in an intuitive way.",
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
