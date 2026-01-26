// netlify/functions/generateDaily.js

import { getStore } from "@netlify/blobs";

import { fetchGitHubSignals } from "./github.js";
import { fetchHackathonSignals } from "./hackathons.js";
import { fetchTwitterSignals } from "./twitter.js";
import { fetchRoadmapSignals } from "./roadmaps.js";

const MAX_IDEAS = 5;
const SIGNAL_WINDOW_DAYS = 14;

/* ---------------- helpers ---------------- */

function isoToday() {
  return new Date().toISOString().slice(0, 10);
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function withinWindow(signal) {
  if (!signal?.date) return false;
  return new Date(signal.date) >= daysAgo(SIGNAL_WINDOW_DAYS);
}

function inferDifficulty(sourceCount) {
  if (sourceCount >= 5) return "Hard";
  if (sourceCount >= 3) return "Medium";
  return "Easy";
}

/**
 * Simple, transparent clustering:
 * - Group signals that share ≥1 long keyword
 * - Deterministic, explainable, debuggable
 */
function clusterSignals(signals) {
  const clusters = [];

  for (const signal of signals) {
    const words = signal.text
      .toLowerCase()
      .split(/\W+/)
      .filter(w => w.length > 6)
      .slice(0, 6);

    let placed = false;

    for (const cluster of clusters) {
      if (cluster.keywords.some(k => words.includes(k))) {
        cluster.signals.push(signal);
        placed = true;
        break;
      }
    }

    if (!placed) {
      clusters.push({
        keywords: words,
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
      s.type === "github" ? "GitHub" :
      s.type === "twitter" ? "X" :
      s.type === "rss" ? "RSS" :
      "Source",
    url: s.url
  }));

  return {
    title: "Unclaimed Builder Opportunity",
    murmur:
      "Multiple independent signals point to the same unresolved friction, but no clear owner has emerged.",
    quest:
      "Design a narrowly scoped tool or workflow that resolves this recurring pain without over-engineering.",
    value:
      "Converts repeated, ambient frustration into a concrete, shippable side project.",
    difficulty: inferDifficulty(sources.length),
    sources
  };
}

/* ---------------- handler ---------------- */

export default async function handler(request) {
  try {
    const store = getStore({
      name: "tech-murmurs",
      siteID: process.env.NETLIFY_SITE_ID,
      token: process.env.NETLIFY_AUTH_TOKEN
    });

    const force =
      new URL(request.url).searchParams.get("force") === "true";

    // Reuse existing snapshot unless forced
    if (!force) {
      const existing = await store.get("latest");
      if (existing) {
        return new Response(existing, {
          headers: { "Content-Type": "application/json" }
        });
      }
    }

    /* -------- ingest signals -------- */

    let signals = [];

    const results = await Promise.allSettled([
      fetchGitHubSignals(),
      fetchHackathonSignals(),
      fetchTwitterSignals(),
      fetchRoadmapSignals()
    ]);

    for (const r of results) {
      if (r.status === "fulfilled" && Array.isArray(r.value)) {
        signals.push(...r.value);
      }
    }

    // Rolling window
    signals = signals.filter(withinWindow);

    // If absolutely nothing usable, return sample mode (but valid JSON)
    if (!signals.length) {
      const emptyPayload = {
        mode: "sample",
        ideas: []
      };

      return new Response(JSON.stringify(emptyPayload), {
        headers: { "Content-Type": "application/json" }
      });
    }

    /* -------- cluster → synthesize -------- */

    const clusters = clusterSignals(signals);

    let ideas = clusters
      .map(synthesizeIdea)
      .slice(0, MAX_IDEAS);

    // Hard guarantee: always 5 cards
    while (ideas.length < MAX_IDEAS) {
      ideas.push({
        title: "Unclaimed Builder Opportunity",
        murmur:
          "Signals indicate a recurring but underexplored need that has not yet been claimed.",
        quest:
          "Prototype a small, opinionated solution to test whether this pain is real and repeatable.",
        value:
          "Turns weak but persistent signals into a concrete starting point.",
        difficulty: "Easy",
        sources: [
          {
            type: "github",
            name: "Fallback",
            url: "https://github.com"
          }
        ]
      });
    }

    /* -------- persist snapshot -------- */

    const today = isoToday();

    const payload = {
      mode: "live",
      date: today,
      ideas
    };

    await store.set("latest", JSON.stringify(payload));
    await store.set(`daily-${today}`, JSON.stringify(payload));

    return new Response(JSON.stringify(payload), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    console.error("generateDaily fatal error:", err);

    return new Response(
      JSON.stringify({
        mode: "sample",
        ideas: []
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}
