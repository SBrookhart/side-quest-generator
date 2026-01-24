export async function handler() {
  const res = await fetch(
    "https://api.github.com/repos/ethereum/go-ethereum/releases?per_page=5"
  );

  const data = await res.json();

  const ideas = data.map(rel => ({
    title: `Tooling for ${rel.name}`,
    origin: "Protocol roadmap / release",
    problem: "New protocol changes require ecosystem tooling.",
    quest: "Build a small tool or visualization supporting this release.",
    audience: "Protocol developers",
    difficulty: "Hard",
    tags: ["Infra", "Research"],
    sources: [{
      type: "github",
      url: rel.html_url
    }]
  }));

  return {
    statusCode: 200,
    body: JSON.stringify(ideas)
  };
}
