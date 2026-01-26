// netlify/functions/generateDaily.js

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

function dedupeSignals(signals) {
  const seen = new Set();
  return signals.filter(s => {
    if (seen.has(s.url)) return false;
    seen.add(s.url);
    return true;
  });
}

/* ---------- AI synthesis ---------- */

async function synthesizeIdeasWithAI(signals) {
  const prompt = `
You are the editor of "Tech Murmurs".

You are given raw, noisy signals from builders (GitHub issues, hackathon prompts, protocol updates, public posts).

Your job:
- Extract latent opportunity, NOT summarize inputs
- Combine multiple signals into a single idea when appropriate
- Write with a calm, thoughtful, builder-first tone
- Avoid hype, buzzwords, and obvious startup clichés
- Produce exactly FIVE distinct ideas

Each idea MUST include:
- title (short, intriguing, specific)
- murmur (why this exists — what friction is emerging)
- quest (what to build — small, scoped, explorable)
- value (why it’s worth someone’s time)
- difficulty (Easy | Medium | Hard)
- sources (2–5 sources drawn from the input list)

Rules:
- Every idea must have at least TWO sources
- Do not repeat the same idea phrased differently
- Do not mention "AI", "signals", or "data sources"
- Do not quote raw text verbatim
- Be concrete and opinionated

Return ONLY valid JSON in this shape:

{
  "ideas": [
    {
      "title": "",
      "murmur": "",
      "quest": "",
      "value": "",
      "difficulty": "",
      "sources": [
        { "type": "", "name": "", "url": "" }
      ]
    }
  ]
}

Here are the raw signals:
${JSON.stringify(signals, null, 2)}
`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      temperature: 0.4,
      messages: [
        { role: "system", content: "You are a careful product editor." },
        { role: "user", content: prompt }
      ]
    })
  });

  if (!res.ok) {
    throw new Error("OpenAI request failed");
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content;

  const parsed = JSON.parse(text);
  return parsed.ideas;
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

  /* ---------- reuse snapshot ---------- */
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

  signals = dedupeSignals(signals).filter(withinWindow);

  /* ---------- hard failure fallback ---------- */
  if (signals.length < 6) {
    return Response.json({
      mode: "sample",
      ideas: []
    });
  }

  /* ---------- AI synthesis ---------- */
  let ideas;
  try {
    ideas = await synthesizeIdeasWithAI(signals);
  } catch (err) {
    console.error("AI synthesis failed:", err);
    return Response.json({
      mode: "sample",
      ideas: []
    });
  }

  if (!Array.isArray(ideas) || ideas.length !== MAX_IDEAS) {
    return Response.json({
      mode: "sample",
      ideas: []
    });
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
