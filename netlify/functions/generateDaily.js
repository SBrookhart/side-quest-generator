import { getStore } from "@netlify/blobs";
import getGitHubSignals from "./github.js";
import getHackathonSignals from "./hackathons.js";
import getTwitterSignals from "./twitter.js";
import getRoadmapSignals from "./roadmaps.js";

const MAX_IDEAS = 5;
const SIGNAL_WINDOW_DAYS = 14;

/* ---------------- helpers ---------------- */

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function withinWindow(signal) {
  return signal?.date && new Date(signal.date) >= daysAgo(SIGNAL_WINDOW_DAYS);
}

function inferDifficulty(sourceCount) {
  if (sourceCount >= 6) return "Hard";
  if (sourceCount >= 3) return "Medium";
  return "Easy";
}

/**
 * Transparent clustering:
 * overlapping long keywords → same cluster
 */
function clusterSignals(signals) {
  const clusters = [];

  for (const signal of signals) {
    const text = signal.text.toLowerCase();

    let matched = clusters.find(c =>
      c.keywords.some(k => text.includes(k))
    );

    if (matched) {
      matched.signals.push(signal);
      continue;
    }

    const keywords = text
      .split(/\W+/)
      .filter(w => w.length > 6)
      .slice(0, 6);

    clusters.push({
      keywords,
      signals: [signal]
    });
  }

  return clusters;
}

/* ---------------- AI synthesis ---------------- */

async function synthesizeIdeaWithAI(cluster) {
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

  const prompt = `
You are an experienced product thinker.

Given the raw builder signals below, extract ONE concrete side-quest idea.

Rules:
- Do NOT summarize the inputs
- Do NOT repeat phrases from the inputs
- Infer the latent opportunity
- Be specific and buildable
- Output must feel like a fresh idea, not analysis

Signals:
${cluster.signals
  .map((s, i) => `${i + 1}. ${s.text}`)
  .join("\n")}

Return JSON with:
title
murmur
quest
value
`;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.7,
        messages: [
          { role: "system", content: "You synthesize early-stage product opportunities." },
          { role: "user", content: prompt }
        ]
      })
    });

    const json = await res.json();
    const content = json.choices?.[0]?.message?.content;

    const parsed = JSON.parse(content);

    return {
      ...parsed,
      difficulty: inferDifficulty(sources.length),
      sources
    };
  } catch (e) {
    console.error("AI synthesis failed:", e);

    // graceful fallback (still live, still valid)
    return {
      title: "Unclaimed Builder Opportunity",
      murmur:
        "Repeated signals suggest a gap that builders are circling but not yet owning.",
      quest:
        "Build a narrowly scoped tool that tests whether this friction is real and recurring.",
      value:
        "Turns weak but repeated signals into a concrete exploration.",
      difficulty: inferDifficulty(sources.length),
      sources
    };
  }
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

  signals = signals.filter(withinWindow);

  if (!signals.length) {
    return Response.json({
      mode: "sample",
      ideas: []
    });
  }

  /* ---------- cluster → synthesize ---------- */
  const clusters = clusterSignals(signals).slice(0, MAX_IDEAS);

  const ideas = [];
  for (const cluster of clusters) {
    ideas.push(await synthesizeIdeaWithAI(cluster));
  }

  /* ---------- hard guarantee: always 5 ---------- */
  while (ideas.length < MAX_IDEAS) {
    ideas.push({
      title: "Unclaimed Builder Opportunity",
      murmur:
        "Signals point to an unresolved need that has not yet been claimed.",
      quest:
        "Explore a small, opinionated build to test this latent opportunity.",
      value:
        "Creates momentum where there is currently ambiguity.",
      difficulty: "Easy",
      sources: ideas[0]?.sources || []
    });
  }

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
