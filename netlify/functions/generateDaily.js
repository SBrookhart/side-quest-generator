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

// tolerate missing / malformed dates
function withinWindow(signal) {
  if (!signal.date) return true;
  const d = new Date(signal.date);
  if (isNaN(d.getTime())) return true;
  return d >= daysAgo(SIGNAL_WINDOW_DAYS);
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
 * Simple, explainable clustering:
 * overlap on uncommon keywords
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
    name:
      s.type === "twitter"
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

  /* ---------- reuse snapshot unless forced ---------- */
  if (!force) {
    const existing = await store.get("latest");
    if (existing) {
      return Response.json(JSON.parse(existing));
    }
  }

  /* ---------- ingest signals ---------- */
  let signals = [];

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

  /* ---------- rolling window (resilient) ---------- */
  signals = signals.filter(withinWindow);

  /* ---------- cluster + synthesize ---------- */
  const clusters = clusterSignals(signals);

  let ideas = clamp(
    clusters.map(synthesizeIdea),
    MAX_IDEAS
  );

  /* ---------- hard guarantee: always 5 ideas ---------- */
  let i = 0;
  while (ideas.length < MAX_IDEAS && signals[i]) {
    ideas.push(
      synthesizeIdea({
        signals: [signals[i]]
      })
    );
    i++;
  }

  /* ---------- absolute fallback (still live) ---------- */
  while (ideas.length < MAX_IDEAS) {
    ideas.push({
      title: "Unclaimed Builder Opportunity",
      murmur:
        "A persistent gap exists in the ecosystem, but it remains underexplored by dedicated builders.",
      quest:
        "Prototype a small, opinionated solution that tests whether this pain is real and recurring.",
      value:
        "Transforms weak but repeated signals into a concrete starting point.",
      difficulty: "Easy",
      sources: [
        {
          type: "github",
          name: "GitHub",
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
