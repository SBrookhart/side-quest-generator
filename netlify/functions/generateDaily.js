// netlify/functions/generateDaily.js

import { getStore } from "@netlify/blobs";
import { getGitHubSignals } from "./github.js";
import { getHackathonSignals } from "./hackathons.js";
import { getTwitterSignals } from "./twitter.js";
import { getRoadmapSignals } from "./roadmaps.js";

/* -------------------- config -------------------- */

const MAX_IDEAS = 5;
const SIGNAL_WINDOW_DAYS = 14;
const OPENAI_MODEL = "gpt-4o-mini";

/* -------------------- helpers -------------------- */

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function withinWindow(signal) {
  if (!signal?.date) return false;
  return new Date(signal.date) >= daysAgo(SIGNAL_WINDOW_DAYS);
}

function uniqBy(arr, keyFn) {
  const seen = new Set();
  return arr.filter(item => {
    const key = keyFn(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Cluster by semantic overlap using simple keyword intersection.
 * Transparent, predictable, and debuggable by design.
 */
function clusterSignals(signals) {
  const clusters = [];

  for (const signal of signals) {
    const words = signal.text
      .toLowerCase()
      .split(/\W+/)
      .filter(w => w.length > 5)
      .slice(0, 6);

    let placed = false;

    for (const cluster of clusters) {
      const overlap = words.filter(w =>
        cluster.keywords.includes(w)
      );

      if (overlap.length >= 2) {
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

function inferDifficulty(sourceCount) {
  if (sourceCount >= 6) return "Hard";
  if (sourceCount >= 3) return "Medium";
  return "Easy";
}

/* -------------------- AI synthesis -------------------- */

async function synthesizeIdeasWithAI(clusters) {
  const prompt = `
You are Tech Murmurs.

Your job is to synthesize early builder signals into
FIVE distinct, vibe-coder-friendly side quests.

Rules:
- Do NOT summarize inputs.
- Extract the latent opportunity behind them.
- Each idea must feel buildable by 1–2 people.
- Match this exact structure for each idea:

Title:
Murmur (why this exists):
Side Quest (what to build):
For What It’s Worth (why it matters):

Tone:
- Calm, editorial, confident
- No hype, no buzzwords
- Curious, unfinished, invitational

Here are the clustered signals:
${clusters.map((c, i) => `
Cluster ${i + 1}:
${c.signals.map(s => `- ${s.text}`).join("\n")}
`).join("\n")}
`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      temperature: 0.6,
      messages: [
        { role: "system", content: "You generate concise, thoughtful product ideas." },
        { role: "user", content: prompt }
      ]
    })
  });

  if (!res.ok) {
    console.error("OpenAI error:", await res.text());
    return [];
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content || "";

  const blocks = text.split(/\n{2,}/).filter(b => b.includes("Title:"));

  return blocks.slice(0, MAX_IDEAS).map(block => {
    const get = label =>
      block.split(label)[1]?.split("\n")[0]?.trim() || "";

    return {
      title: get("Title:"),
      murmur: get("Murmur"),
      quest: get("Side Quest"),
      value: get("For What It’s Worth")
    };
  });
}

/* -------------------- handler -------------------- */

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

  signals = uniqBy(signals, s => s.url).filter(withinWindow);

  /* ---------- fail only if EVERYTHING failed ---------- */
  if (!signals.length) {
    return Response.json({
      mode: "sample",
      ideas: []
    });
  }

  /* ---------- cluster + synthesize ---------- */
  const clusters = clusterSignals(signals).slice(0, MAX_IDEAS);
  const aiIdeas = await synthesizeIdeasWithAI(clusters);

  /* ---------- attach sources + difficulty ---------- */
  const ideas = aiIdeas.map((idea, idx) => {
    const sources = uniqBy(
      clusters[idx]?.signals || [],
      s => s.url
    ).map(s => ({
      type: s.type,
      name:
        s.type === "github"
          ? "GitHub"
          : s.type === "twitter"
          ? "X"
          : s.type === "hackathon"
          ? "Hackathon"
          : "Roadmap",
      url: s.url
    }));

    return {
      ...idea,
      difficulty: inferDifficulty(sources.length),
      sources
    };
  });

  /* ---------- hard guarantee: always 5 ---------- */
  while (ideas.length < MAX_IDEAS) {
    ideas.push(ideas[ideas.length - 1]);
  }

  /* ---------- persist ---------- */
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
