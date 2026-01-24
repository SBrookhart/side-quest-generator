function deriveQuestFromRoadmap(text) {
  if (text.includes("dashboard") || text.includes("visibility")) {
    return "Build a simple dashboard that lets non-technical users explore this roadmap visually.";
  }

  if (text.includes("users") || text.includes("community")) {
    return "Create a lightweight interface that translates this roadmap into plain English for users.";
  }

  return "Turn this roadmap item into a small visual or interactive preview of what’s coming.";
}

export async function handler() {
  // Static public roadmap sources for now (safe + reliable)
  const roadmaps = [
    {
      title: "Protocol roadmap mentions improved transparency",
      description:
        "Teams often publish roadmaps that are difficult for non-developers to understand or follow.",
      link: "https://ethereum.org/en/roadmap/"
    },
    {
      title: "Product roadmap hints at upcoming features",
      description:
        "Roadmaps signal future capabilities but rarely show what they’ll feel like to users.",
      link: "https://github.com/orgs/github/projects"
    }
  ];

  const ideas = roadmaps.map(r => ({
    title: r.title,
    problem: r.description,
    quest: deriveQuestFromRoadmap(r.description),
    difficulty: "Easy",
    tags: ["Vibe", "Product"],
    sources: [
      {
        type: "link",
        url: r.link
      }
    ]
  }));

  return {
    statusCode: 200,
    body: JSON.stringify(ideas.slice(0, 2))
  };
}
