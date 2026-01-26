// netlify/functions/generateDaily.js

import { getStore } from "@netlify/blobs";

import { getGitHubSignals } from "./github.js";
import { getHackathonSignals } from "./hackathons.js";
import { getTwitterSignals } from "./twitter.js";
import { getRoadmapSignals } from "./roadmaps.js";

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

function safeJson(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

/* ---------------- AI PROMPT ---------------- */

const SYSTEM_PROMPT = `
You are the editor of Tech Murmurs.

Tech Murmurs publishes daily “side quests” for indie builders and vibe-coders:
small, playful, buildable projects inspired by real but unfinished needs.

Your job is NOT to summarize inputs.
Your job is to extract latent opportunity.

You think like:
- an indie hacker
- a curious prototyper
- someone who enjoys clever tools and creative experiments

Avoid generic language.
Avoid startup clichés.
Avoid "there is an opportunity" phrasing.
Every idea should feel like something a single builder could ship in a week or two.
`;

function buildUserPrompt(signals) {
  const formattedSignals = signals.map(s => `- (${s.type}) ${s.text}`).join("\n");

  return `
Below is a set of real-world signals collected from GitHub issues,
hackathons, protocol updates, and public developer discourse.

Each signal represents friction, repetition, or unfinished work.

Signals:
${formattedSignals}

Your task:

1. Identify exactly 5 DISTINCT opportunity patterns across these signals.
   - Each pattern must be meaningfully different.
   - Do NOT repeat the same type of idea twice.

2. For each pattern, write ONE side quest using the format below.

Rules:
- Be concrete and specific.
- Do not restate the signals.
- Do not use generic phrases like “unclaimed opportunity”.
- Prefer playful, curious, builder-friendly language.

Format (repeat exactly 5 times):

Title:
Murmur:
Side Quest:
Why It’s Interesting:
Difficulty:
`;
}

/* ---------------- handler ---------------- */

export async function handler(req) {
  const store = getStore({
    name: "tech-murmurs",
    siteID: process.env.NETLIFY_SITE_ID,
    token: process.env.NETLIFY_AUTH_TOKEN
  });

  const force = new URL(req.url).searchParams.get("force") === "true";

  /* ---------- reuse snapshot unless forced ---------- */
  if (!force) {
    const cached = await store.get("latest");
    if (cached) {
      return safeJson(JSON.parse(cached));
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
  } catch (err) {
    console.error("Signal ingestion error:", err);
  }

  signals = signals.filter(withinWindow);

  if (!signals.length) {
    return safeJson({
      mode: "sample",
      ideas: []
    });
  }

  /* ---------- call OpenAI ---------- */
  let aiText;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        temperature: 0.8,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: buildUserPrompt(signals) }
        ]
      })
    });

    const json = await res.json();
    aiText = json.choices?.[0]?.message?.content;
  } catch (err) {
    console.error("OpenAI error:", err);
  }

  if (!aiText) {
    return safeJson({
      mode: "sample",
      ideas: []
    });
  }

  /* ---------- parse AI output ---------- */
  const ideas = [];
  const blocks = aiText.split(/\n(?=Title:)/);

  for (const block of blocks) {
    const title = block.match(/Title:\s*(.+)/)?.[1];
    const murmur = block.match(/Murmur:\s*(.+)/)?.[1];
    const quest = block.match(/Side Quest:\s*(.+)/)?.[1];
    const value = block.match(/Why It’s Interesting:\s*(.+)/)?.[1];
    const difficulty = block.match(/Difficulty:\s*(Easy|Medium|Hard)/)?.[1];

    if (title && murmur && quest && value && difficulty) {
      ideas.push({
        title,
        murmur,
        quest,
        value,
        difficulty,
        sources: signals.slice(0, 4).map(s => ({
          type: s.type,
          name:
            s.type === "twitter" ? "X" :
            s.type === "github" ? "GitHub" :
            s.type === "hackathon" ? "Hackathon" :
            "Roadmap",
          url: s.url
        }))
      );
    }
  }

  if (ideas.length !== MAX_IDEAS) {
    console.warn("AI output rejected — wrong idea count");
    return safeJson({ mode: "sample", ideas: [] });
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

  return safeJson(payload);
}
