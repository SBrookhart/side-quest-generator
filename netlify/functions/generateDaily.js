import { getStore } from "@netlify/blobs";
import getGitHubSignals from "./github.js";
import getHackathonSignals from "./hackathons.js";
import getTwitterSignals from "./twitter.js";
import getRoadmapSignals from "./roadmaps.js";

const MAX_IDEAS = 5;
const WINDOW_DAYS = 14;

/* ---------- helpers ---------- */

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function inferDifficulty(n) {
  if (n >= 4) return "Hard";
  if (n >= 2) return "Medium";
  return "Easy";
}

function clusterSignals(signals) {
  const clusters = [];

  for (const s of signals) {
    const key = s.text.toLowerCase().slice(0, 80);

    let cluster = clusters.find(c => c.key === key);
    if (!cluster) {
      cluster = { key, signals: [] };
      clusters.push(cluster);
    }
    cluster.signals.push(s);
  }

  return clusters;
}

function synthesize(cluster) {
  const sources = cluster.signals.map(s => ({
    type: s.type,
    name:
      s.type === "github" ? "GitHub" :
      s.type === "twitter" ? "X" :
      s.type === "rss" ? "RSS" :
      "Source",
    url: s.url
  }));

  return {
    title: "Unclaimed Builder Opportunity",
    murmur:
      "Multiple independent signals point to an unresolved workflow or missing primitive.",
    quest:
      "Build a narrowly scoped tool that resolves this specific friction without becoming a platform.",
    value:
      "Turns repeated, low-level frustration into a concrete side project someone can actually ship.",
    difficulty: inferDifficulty(sources.length),
    sources
  };
}

/* ---------- handler ---------- */

export default async function handler(req) {
  const store = getStore({
    name: "tech-murmurs",
    siteID: process.env.NETLIFY_SITE_ID,
    token: process.env.NETLIFY_AUTH_TOKEN
  });

  let signals = [];

  try {
    const results = await Promise.allSettled([
      getGitHubSignals(),
      getHackathonSignals(),
      getTwitterSignals(),
      getRoadmapSignals()
    ]);

    results.forEach(r => {
      if (r.status === "fulfilled") signals.push(...r.value);
    });
  } catch (e) {
    console.error(e);
  }

  const cutoff = daysAgo(WINDOW_DAYS);
  signals = signals.filter(s => new Date(s.date) >= cutoff);

  // 🚑 Absolute fallback: synthesize from any signal at all
  if (!signals.length) {
    signals = [{
      type: "github",
      text: "Repeated feature requests across repositories with no owner",
      url: "https://github.com",
      date: new Date().toISOString()
    }];
  }

  const clusters = clusterSignals(signals);
  const ideas = clusters.slice(0, MAX_IDEAS).map(synthesize);

  // 🔒 HARD GUARANTEE
  while (ideas.length < MAX_IDEAS) {
    ideas.push({
      title: "Unclaimed Builder Opportunity",
      murmur: "A recurring gap exists but no clear owner has emerged.",
      quest: "Prototype a small tool to test whether this pain is real.",
      value: "Creates clarity around whether a problem is worth solving.",
      difficulty: "Easy",
      sources: [{
        type: "github",
        name: "GitHub",
        url: "https://github.com"
      }]
    });
  }

  const today = new Date().toISOString().slice(0, 10);
  const payload = { mode: "live", date: today, ideas };

  await store.set("latest", JSON.stringify(payload));
  await store.set(`daily-${today}`, JSON.stringify(payload));

  return Response.json(payload);
}
