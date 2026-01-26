// netlify/functions/generateDaily.js

import { getStore } from "@netlify/blobs";
import { getGitHubSignals } from "./github.js";
import { getHackathonSignals } from "./hackathons.js";
import { getTwitterSignals } from "./twitter.js";
import { getRoadmapSignals } from "./roadmaps.js";

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

function inferDifficulty(sourceCount) {
  if (sourceCount >= 5) return "Hard";
  if (sourceCount >= 3) return "Medium";
  return "Easy";
}

/* ---------- AI synthesis ---------- */

async function synthesizeIdeasWithAI(signals) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("Missing OPENAI_API_KEY");

  // Keep signals compact + anonymous
  const signalSummaries = signals.slice(0, 20).map(s => ({
    type: s.type,
    text: s.text.slice(0, 200)
  }));

  const prompt = `
You are an editorial product thinker writing daily side-quest ideas for builders.

Your job:
- Extract latent opportunities from the signals below
- DO NOT summarize or quote the signals
- Write original, thoughtful ideas
- Tone: calm, insightful, curious, builder-friendly
- Audience: solo builders, vibe coders, small teams

Rules:
- Produce EXACTLY ${MAX_IDEAS} distinct ideas
- Each idea must feel meaningfully different
- Avoid buzzwords, hype, or marketing language
- No references to GitHub, Twitter, issues, or releases

Return ONLY valid JSON in this exact shape:

{
  "ideas": [
    {
      "title": "...",
      "murmur": "...",
      "quest": "...",
      "value": "...",
      "difficulty": "Easy | Medium | Hard"
    }
  ]
}

Signals:
${JSON.stringify(signalSummaries, null, 2)}
`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.7,
      messages: [{ role: "user", content: prompt }]
    })
  });

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;

  if (!content) throw new Error("AI returned empty response");

  const parsed = JSON.parse(content);
  return parsed.ideas;
}

/* ---------- handler ---------- */

export const handler = async (request) => {
  try {
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
        return {
          statusCode: 200,
          body: existing
        };
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
      return {
        statusCode: 200,
        body: JSON.stringify({
          mode: "sample",
          ideas: []
        })
      };
    }

    /* ---------- AI synthesis ---------- */

    const aiIdeas = await synthesizeIdeasWithAI(signals);

    const ideas = aiIdeas.map(idea => ({
      ...idea,
      difficulty: idea.difficulty,
      sources: signals
        .slice(0, 5)
        .map(s => ({
          type: s.type,
          name:
            s.type === "twitter" ? "X" :
            s.type === "github" ? "GitHub" :
            s.type === "hackathon" ? "Hackathon" :
            "Roadmap",
          url: s.url
        }))
    }));

    const today = new Date().toISOString().slice(0, 10);

    const payload = {
      mode: "live",
      date: today,
      ideas
    };

    await store.set("latest", JSON.stringify(payload));
    await store.set(`daily-${today}`, JSON.stringify(payload));

    return {
      statusCode: 200,
      body: JSON.stringify(payload)
    };

  } catch (err) {
    console.error("generateDaily failed:", err);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Daily generation failed",
        details: err.message
      })
    };
  }
};
