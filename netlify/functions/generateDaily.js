import { getStore } from "@netlify/blobs";

export default async () => {
  const siteID = process.env.NETLIFY_SITE_ID;
  const token = process.env.NETLIFY_API_TOKEN;

  if (!siteID || !token) {
    return Response.json({ error: "Missing siteID or token" }, { status: 500 });
  }

  const store = getStore({
    name: "tech-murmurs",
    siteID,
    token
  });

  const today = new Date().toISOString().slice(0, 10);
  const key = `daily/${today}`;

  const existing = await store.get(key);
  if (existing) {
    return Response.json({ status: "already-generated", date: today });
  }

  const snapshot = {
    date: today,
    mode: "sample",
    ideas: [
      {
        title: "Developer Narrative Layer",
        murmur:
          "Developers frequently encounter tools that explain what happened, but not why it happened or what to do next.",
        quest:
          "Build a lightweight narrative layer that translates raw error messages or documentation into clear, human explanations with suggested next steps.",
        worth: [
          "High empathy project with real DX impact",
          "Great way to practice language-first UX",
          "Easy to scope as a browser extension or CLI wrapper"
        ],
        signals: [
          {
            type: "github",
            url: "https://github.com/rust-lang/rust-analyzer/issues"
          },
          {
            type: "github",
            url: "https://github.com/coinbase"
          }
        ]
      }
    ]
  };

  await store.set(key, snapshot);
  await store.set("latest", snapshot);

  return Response.json({ status: "generated", date: today });
};
