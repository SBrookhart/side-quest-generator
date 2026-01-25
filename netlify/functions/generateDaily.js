import { getStore } from "@netlify/blobs";
import getGitHubSignals from "./github.js";
import getHackathonSignals from "./hackathons.js";
import getTwitterSignals from "./twitter.js";
import getRoadmapSignals from "./roadmaps.js";

const MAX_IDEAS = 5;
const SIGNAL_WINDOW_DAYS = 14;

/* ---------- helpers ---------- */

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function withinWindow(signal) {
  return new Date(signal.date) >= daysAgo(SIGNAL_WINDOW_DAYS);
}

function clamp(arr, n) {
  return arr.slice(0, n);
}

function inferDifficulty(sourceCount) {
  if (sourceCount >= 5) return "Hard";
  if (sourceCount >= 3) return "Medium";
  return "Easy";
}

/**
 * Very simple clustering heuristic:
 * group by overlapping keywords
 * (transparent + predictable on purpose)
 */
function clusterSignals(signals) {
  const clusters = [];

  for (const signal of signals) {
    let placed = false;

    for (const cluster of clusters) {
      if (
        cluster.keywords.some(k =>
          signal.text.toLowerCase().includes(k)
        )
      ) {
        cluster.signals.push(signal);
        placed = true;
        break;
      }
    }

    if (!placed) {
      const keywords = signal.text
        .toLowerCase()
        .split(/\W+/)
        .filter(w => w.length > 5)
        .slice(0, 5);

      clusters.push({
        keywords,
        signals: [signal]
      });
    }
  }

  return clusters;
}

function synthesizeIdea(cluster) {
  const sources = cluster.signals.map(s => ({
    type: s.type,
    name: s.type === "twitter"
      ? "X"
      : s.type === "github"
        ? "GitHub"
        : s.type === "rss"
          ? "RSS"
          : "Source",
    url: s.url
  }));

  return {
    title: "Unclaimed Builder Opportunity",
    murmur:
      "Multiple independent signals point to the same unresolved friction, but no clear owner has emerged.",
    quest:
      "Design a narrowly scoped tool or workflow that resolves this recurring pain without over-engineering.",
    value:
      "Converts ambient, repeated frustration into a concrete, shippable side project.",
    difficulty: inferDifficulty(sources.length),
    sources
  };
}

/* ---------- handler ---------- */

export default async function handler(request) {
  const store = getStore({
    name: "tech-murmurs",
    siteID: process.env.NETLIFY_SITE_ID,
    token: process.env.NETLIFY_AUTH_TOKEN
  });

  const force =
    new URL(request.url).searchParams.get("force") === "true";

  /* ---------- reuse existing snapshot unless forced ---------- */
  if (!force) {
    const existing = await store.get("latest");
    if (existing) {
      return Response.json(JSON.parse(existing));
    }
  }

  /* ---------- ingest signals ---------- */
  let signals = [];

  try {
    const results = await Promise.allSettled([
      getGitHubSignals(),
      getHackathonSignals(),
      getTwitterSignals(),
      getRoadmapSignals()
    ]);

    results.forEach(r => {
      if (r.status === "fulfilled" && Array.isArray(r.value)) {
        signals.push(...r.value);
      }
    });
  } catch (e) {
    console.error("Signal ingestion error:", e);
  }

  /* ---------- rolling window ---------- */
  signals = signals.filter(withinWindow);

  /* ---------- hard guarantee: never empty ---------- */
  if (!signals.length) {
    return Response.json({
      mode: "sample",
      ideas: []
    });
  }

  /* ---------- cluster then synthesize ---------- */
  const clusters = clusterSignals(signals);

  const ideas = clamp(
    clusters.map(synthesizeIdea),
    MAX_IDEAS
  );

  /* ---------- hard guarantee: always 5 ideas ---------- */
  while (ideas.length < MAX_IDEAS) {
    ideas.push({
      title: "Unclaimed Builder Opportunity",
      murmur:
        "Signals indicate an unresolved need that has not yet been claimed by a dedicated builder.",
      quest:
        "Explore a small, focused build that resolves this recurring friction.",
      value:
        "Turns repeated ambient pain into something concrete and shippable.",
      difficulty: "Easy",
      sources: [
        {
          type: "github",
          name: "Fallback Signal",
          url: "https://github.com"
        }
      ]
    });
  }

  /* ---------- persist snapshot ---------- */
  const today = new Date().toISOString().slice(0, 10);

  const payload = {
    mode: "live",
    date: today,
    ideas
  };

  await store.set("latest", JSON.stringify(payload));
  await store.set(`daily-${today}`, JSON.stringify(payload));

  return Response.json(payload);
}
