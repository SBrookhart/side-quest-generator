import { getStore } from "@netlify/blobs";

function generateIdeas(date) {
  return {
    date,
    mode: "editorial",
    ideas: Array.from({ length: 5 }).map((_, i) => ({
      title: `Unclaimed Builder Opportunity`,
      murmur:
        "Builders repeatedly circle the same unresolved friction without a clear owner.",
      quest:
        "Create a narrowly scoped tool or workflow that resolves this specific recurring pain.",
      value:
        "Turns ambient frustration into a concrete, shippable side project.",
      difficulty: ["Easy", "Medium", "Hard"][i % 3],
      sources: [
        {
          type: "github",
          name: "Seeded Archive",
          url: "https://github.com"
        }
      ]
    }))
  };
}

export default async function handler() {
  const store = getStore({
    name: "tech-murmurs",
    siteID: process.env.NETLIFY_SITE_ID,
    token: process.env.NETLIFY_AUTH_TOKEN
  });

  const days = ["2026-01-23", "2026-01-24"];

  for (const day of days) {
    await store.set(
      `daily-${day}`,
      JSON.stringify(generateIdeas(day))
    );
  }

  return Response.json({ seeded: days });
}
