import { getStore } from "@netlify/blobs";

function makeIdeas(seedLabel) {
  return Array.from({ length: 5 }).map((_, i) => ({
    title: `Unclaimed Builder Opportunity`,
    murmur:
      "Public builder activity hints at an unresolved problem that hasn’t yet attracted a focused solution.",
    quest:
      "Prototype a small, opinionated tool to explore whether this need is real and recurring.",
    value:
      "Turns early, ambient intent into a concrete starting point.",
    difficulty: ["Easy", "Medium", "Hard"][i % 3],
    sources: [
      {
        type: "github",
        name: seedLabel,
        url: "https://github.com"
      }
    ]
  }));
}

export default async function handler() {
  const store = getStore({
    name: "tech-murmurs",
    siteID: process.env.NETLIFY_SITE_ID,
    token: process.env.NETLIFY_AUTH_TOKEN
  });

  await store.set(
    "daily-2026-01-23",
    JSON.stringify({
      date: "2026-01-23",
      mode: "editorial",
      ideas: makeIdeas("Seed 01-23")
    })
  );

  await store.set(
    "daily-2026-01-24",
    JSON.stringify({
      date: "2026-01-24",
      mode: "editorial",
      ideas: makeIdeas("Seed 01-24")
    })
  );

  return Response.json({ status: "archive seeded" });
}
