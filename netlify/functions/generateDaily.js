import { getStore } from "@netlify/blobs";
import getGitHubSignals from "./github.js";
import getHackathonSignals from "./hackathons.js";
import getTwitterSignals from "./twitter.js";
import getRoadmapSignals from "./roadmaps.js";

const MAX_IDEAS = 5;
const WINDOW_DAYS = 14;

/* ---------------- helpers ---------------- */

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function withinWindow(s) {
  return new Date(s.date) >= daysAgo(WINDOW_DAYS);
}

function uniqBy(arr, keyFn) {
  const seen = new Set();
  return arr.filter(item => {
    const k = keyFn(item);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

function inferDifficulty(n) {
  if (n >= 5) return "Hard";
  if (n >= 3) return "Medium";
  return "Easy";
}

/**
 * Cluster by:
 * - source type
 * - repo / domain
 * - repeated topic words
 */
function clusterSignals(signals) {
  const clusters = [];

  for (const s of signals) {
    const domain = (() => {
      try {
        return new URL(s.url).hostname.replace("www.", "");
      } catch {
        return "unknown";
      }
    })();

    let cluster = clusters.find(c =>
      c.type === s.type &&
      c.domain === domain
    );

    if (!cluster) {
      cluster = {
        type: s.type,
        domain,
        signals: []
      };
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
      s.type === "twitter" ? "X" :
      s.type === "github" ? "GitHub" :
      s.type === "rss" ? "RSS" :
      "Source",
    url: s.url
  }));

  return {
    title: "Unclaimed Builder Opportunity",
    murmur:
      "Multiple independent builders are circling the same unresolved friction, but no focused solution has emerged yet.",
    quest:
      "Design a narrowly scoped tool or workflow that directly resolves this recurring pain without over-engineering.",
    value:
      "Transforms scattered, repeated frustration into a concrete side project someone can actually ship.",
    difficulty: inferDifficulty(sources.length),
    sources
  };
}

/* ---------------- handler ---------------- */

export default async function handler(request) {
  const store = getStore({
    name: "tech-murmurs",
    siteID: process.env.NETLIFY_SITE_ID,
    token: process.env.NETLIFY_AUTH_TOKEN
  });

  const force =
    new URL(request.url).searchParams.get("force") === "true";

  if (!force) {
    const cached = await store.get("latest");
    if (cached) {
      return Response.json(JSON.parse(cached));
    }
  }

  /* ---------- ingest ---------- */
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

  /* ---------- normalize ---------- */
  signals = signals
    .filter(withinWindow)
    .filter(s => s.text && s.url);

  signals = uniqBy(signals, s => `${s.type}:${s.url}`);

  if (!signals.length) {
    return Response.json({
      mode: "sample",
      ideas: []
    });
  }

  /* ---------- cluster + synthesize ---------- */
  const clusters = clusterSignals(signals);

  let ideas = clusters.map(synthesize);

  /* ---------- guarantee 5 ideas ---------- */
  while (ideas.length < MAX_IDEAS) {
    const seed = signals[Math.floor(Math.random() * signals.length)];
    ideas.push({
      title: "Unclaimed Builder Opportunity",
      murmur:
        "A recurring pain keeps surfacing in public discussions, but no clear owner has stepped in yet.",
      quest:
        "Build a minimal experiment to test whether this friction is worth deeper investment.",
      value:
        "Creates a low-risk entry point into a real, observed builder need.",
      difficulty: "Easy",
      sources: [{
        type: seed.type,
        name: seed.type === "twitter" ? "X" : "Source",
        url: seed.url
      }]
    });
  }

  ideas = ideas.slice(0, MAX_IDEAS);

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
