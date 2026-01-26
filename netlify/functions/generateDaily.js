import { getStore } from "@netlify/blobs";
import getGitHubSignals from "./github.js";
import getHackathonSignals from "./hackathons.js";
import getTwitterSignals from "./twitter.js";
import getRoadmapSignals from "./roadmaps.js";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const MAX_IDEAS = 5;
const SIGNAL_WINDOW_DAYS = 14;

/* ---------------- helpers ---------------- */

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function withinWindow(signal) {
  return new Date(signal.date) >= daysAgo(SIGNAL_WINDOW_DAYS);
}

function inferDifficulty(sourceCount) {
  if (sourceCount >= 5) return "Hard";
  if (sourceCount >= 3) return "Medium";
  return "Easy";
}

/* ---------------- clustering ---------------- */

/**
 * Deterministic, explainable clustering:
 * signals are grouped if they share meaningful keywords
 */
function clusterSignals(signals) {
  const clusters = [];

  for (const signal of signals) {
    const text = signal.text.toLowerCase();

    let matched = false;

    for (const cluster of clusters) {
      if (cluster.keywords.some(k => text.includes(k))) {
        cluster.signals.push(signal);
        matched = true;
        break;
      }
    }

    if (!matched) {
      const keywords = text
        .split(/\W+/)
        .filter(w => w.length > 6)
        .slice(0, 6);

      clusters.push({
        keywords,
        signals: [signal]
      });
    }
  }

  return clusters;
}

/* ---------------- AI synthesis ---------------- */

async function synthesizeIdeas(clusters) {
  const ideas = [];

  for (const cluster of clusters.slice(0, MAX_IDEAS)) {
    const sources = cluster.signals.map(s => ({
      type: s.type === "twitter" ? "x" : s.type,
      name:
        s.type === "twitter"
          ? "X"
          : s.type === "github"
          ? "GitHub"
          : "Source",
      url: s.url
    }));

    const prompt = `
You are generating a single "side quest" idea for an indie builder.

Inputs are multiple raw signals that all point to the same unresolved friction.

DO NOT summarize the inputs.
DO NOT mention platforms or sources.
DO invent a concrete, buildable opportunity.

Return JSON with:
title (short, intriguing)
murmur (why this exists)
quest (what to build)
value (why it’s worth doing)

Signals:
${cluster.signals.map(s => `- ${s.text}`).join("\n")}
`;

    let completion;

    try {
      completion = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${OPENAI_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7
          })
        }
      );
    } catch {
      continue;
    }

    if (!completion.ok) continue;

    let data;
    try {
      data = await completion.json();
    } catch {
      continue;
    }

    let parsed;
    try {
      parsed = JSON.parse(data.choices[0].message.content);
    } catch {
      continue;
    }

    ideas.push({
      ...parsed,
      difficulty: inferDifficulty(sources.length),
      sources
    });
  }

  return ideas;
}

/* ---------------- archive seeding ---------------- */

function seedIdeas(date) {
  return {
    date,
    mode: "editorial",
    ideas: Array.from({ length: 5 }).map(() => ({
      title: "The Market Has Feelings",
      murmur:
        "Builders keep reacting emotionally to the same recurring problems, but no tooling captures that pattern.",
      quest:
        "Build a lightweight signal reader that surfaces emotional volatility in developer discourse.",
      value:
        "Turns ambient frustration into a navigable map of opportunity.",
      difficulty: "Easy",
      sources: [
        {
          type: "github",
          name: "GitHub",
          url: "https://github.com"
        }
      ]
    }))
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

  const today = new Date().toISOString().slice(0, 10);

  if (!force) {
    const existing = await store.get("latest");
    if (existing) {
      return Response.json(JSON.parse(existing));
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

  signals = signals.filter(withinWindow);

  /* ---------- seed archive if missing ---------- */

  const seedDates = ["2026-01-23", "2026-01-24"];

  for (const d of seedDates) {
    const key = `daily-${d}`;
    const exists = await store.get(key);
    if (!exists) {
      await store.set(key, JSON.stringify(seedIdeas(d)));
    }
  }

  if (!signals.length) {
    const payload = { mode: "sample", ideas: [] };
    await store.set("latest", JSON.stringify(payload));
    return Response.json(payload);
  }

  /* ---------- cluster + synthesize ---------- */

  const clusters = clusterSignals(signals);

  let ideas = await synthesizeIdeas(clusters);

  /* ---------- enforce exactly 5 ---------- */

  ideas = ideas.filter(i => i.sources && i.sources.length);

  while (ideas.length < MAX_IDEAS && clusters.length) {
    const c = clusters[ideas.length % clusters.length];
    ideas.push({
      title: "Unclaimed Builder Opportunity",
      murmur:
        "Multiple signals suggest an unresolved need, but no focused solution exists.",
      quest:
        "Build a narrowly scoped tool that removes this recurring friction.",
      value:
        "Converts repeated low-grade pain into a shippable side project.",
      difficulty: "Easy",
      sources: c.signals.map(s => ({
        type: s.type === "twitter" ? "x" : s.type,
        name: s.type === "twitter" ? "X" : "Source",
        url: s.url
      }))
    });
  }

  ideas = ideas.slice(0, MAX_IDEAS);

  const payload = {
    mode: "live",
    date: today,
    ideas
  };

  await store.set("latest", JSON.stringify(payload));
  await store.set(`daily-${today}`, JSON.stringify(payload));

  return Response.json(payload);
}
