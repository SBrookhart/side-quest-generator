// netlify/functions/generateDaily.js

import { getStore } from "@netlify/blobs";
import { getGithubSignals } from "./github.js";
import { getArticleSignals } from "./articles.js";

export default async (req) => {
  const siteID = process.env.NETLIFY_SITE_ID;
  const token = process.env.NETLIFY_AUTH_TOKEN;

  if (!siteID || !token) {
    return Response.json({ error: "Missing siteID or token" }, { status: 500 });
  }

  const store = getStore({
    name: "tech-murmurs",
    siteID,
    token
  });

  const today = new Date().toISOString().slice(0, 10);
  const force = new URL(req.url).searchParams.get("force") === "true";

  if (!force) {
    const existing = await store.get(`daily-${today}`);
    if (existing) {
      return Response.json({ status: "already-generated", date: today });
    }
  }

  // ---- Editorial backbone (locked) ----
  let ideas = [
    {
      title: "The Market Has Feelings",
      murmur: "Crypto discourse oscillates between euphoria and despair.",
      quest: "Build a real-time emotional dashboard of crypto Twitter.",
      value: "Provides intuition for narrative momentum without trading.",
      difficulty: "Easy",
      sources: [],
      mode: "editorial"
    },
    {
      title: "Crypto Urban Legends",
      murmur: "On-chain myths persist without attribution or provenance.",
      quest: "Create a living museum of crypto myths and memes.",
      value: "Preserves cultural memory and reduces misinformation.",
      difficulty: "Easy",
      sources: [],
      mode: "editorial"
    },
    {
      title: "If Crypto Twitter Were a Person",
      murmur: "Collective behavior often feels like a single personality.",
      quest: "Build an AI character powered by live crypto discourse.",
      value: "Turns sentiment into something legible and playful.",
      difficulty: "Medium",
      sources: [],
      mode: "editorial"
    },
    {
      title: "On-Chain Weather Channel",
      murmur: "Network conditions are unintuitive to non-technical users.",
      quest: "Visualize on-chain activity like a weather forecast.",
      value: "Improves comprehension without dashboards.",
      difficulty: "Medium",
      sources: [],
      mode: "editorial"
    },
    {
      title: "Build-A-Protocol Simulator",
      murmur: "Protocol design is opaque to newcomers.",
      quest: "Create a sandbox for simulating protocol tradeoffs.",
      value: "Lowers the barrier to systems thinking.",
      difficulty: "Hard",
      sources: [],
      mode: "editorial"
    }
  ];

  // ---- Controlled live augmentation ----
  try {
    const articleSignals = await getArticleSignals();
    const githubSignals = await getGithubSignals();

    if (articleSignals.length > 0) {
      ideas[0] = {
        ...ideas[0],
        sources: [
          ...articleSignals.slice(0, 1),
          ...githubSignals.slice(0, 1)
        ]
      };
    }
  } catch {
    // silent fail — editorial mode remains intact
  }

  const snapshot = {
    date: today,
    mode: "editorial",
    ideas
  };

  await store.set("latest", JSON.stringify(snapshot));
  await store.set(`daily-${today}`, JSON.stringify(snapshot));

  return Response.json({
    status: "generated",
    date: today,
    count: ideas.length,
    mode: "editorial"
  });
};
