// netlify/functions/generateDaily.js

import { getStore } from "@netlify/blobs";

import { getGitHubSignals } from "./github.js";
import { getHackathonSignals } from "./hackathons.js";
import { getTwitterSignals } from "./twitter.js";
import { getRoadmapSignals } from "./roadmaps.js";

const MAX_IDEAS = 5;
const SIGNAL_WINDOW_DAYS = 14;

/* --------------------------------------------------
   Utilities
-------------------------------------------------- */

function todayISO() {
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
  if (sourceCount >= 6) return "Hard";
  if (sourceCount >= 3) return "Medium";
  return "Easy";
}

/* --------------------------------------------------
   Clustering (simple + explainable)
-------------------------------------------------- */

function extractKeywords(text = "") {
  return text
    .toLowerCase()
    .split(/\W+/)
    .filter(w => w.length > 5)
    .slice(0, 6);
}

function clusterSignals(signals) {
  const clusters = [];

  for (const signal of signals) {
    const keywords = extractKeywords(signal.text);

    let matched = false;

    for (const cluster of clusters) {
      if (cluster.keywords.some(k => keywords.includes(k))) {
        cluster.signals.push(signal);
        matched = true;
        break;
      }
    }

    if (!matched) {
      clusters.push({
        keywords,
        signals: [signal]
      });
    }
  }

  return clusters;
}

/* --------------------------------------------------
   AI synthesis (editorial, not summarization)
-------------------------------------------------- */

async function synthesizeIdeasWithAI(clusters) {
  if (!process.env.OPENAI_API_KEY) return null;

  const prompt = `
You are the editorial engine behind Tech Murmurs.

You must generate EXACTLY ${MAX_IDEAS} distinct ideas.

Each idea MUST include:
- title
- murmur (why this exists)
- quest (what to build)
- value (why it’s worth energy)

Rules:
- Do NOT summarize inputs
- Extract latent opportunity
- Be concrete and vibe-coder friendly
- Each idea must feel meaningfully different

Here are clustered signals (grouped by theme):

${clusters.map((c, i) => `
Cluster ${i + 1}:
${c.signals.map(s => `- ${s.text}`).join("\n")}
`).join("\n")}

Return JSON ONLY in this exact shape:
{
  "ideas": [
    {
      "title": "...",
      "murmur": "...",
      "quest": "...",
      "value": "..."
    }
  ]
}
`;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.6,
        messages: [
          { role: "system", content: "You are a precise product editor." },
          { role: "user", content: prompt }
        ]
      })
    });

    if (!res.ok) return null;

    const json = await res.json();
    const content = json?.choices?.[0]?.message?.content;
    if (!content) return null;

    const parsed = JSON.parse(content);
    if (!Array.isArray(parsed.ideas)) return null;

    return parsed.ideas.slice(0, MAX_IDEAS);
  } catch {
    return null;
  }
}

/* --------------------------------------------------
   Deterministic fallback (never breaks)
-------------------------------------------------- */

function fallbackIdeas(clusters) {
  const ideas = clusters.map(cluster => {
    const sources = cluster.signals.map(s => ({
      type: s.type,
      name:
        s.type === "github" ? "GitHub" :
        s.type === "hackathon" ? "Hackathon" :
        s.type === "roadmap" ? "Roadmap" :
        s.type === "twitter" ? "X" :
        "Source",
      url: s.url
    }));

    return {
      title: "Unclaimed Builder Opportunity",
      murmur:
        "Multiple independent signals point to the same unresolved friction, but no clear owner has emerged.",
      quest:
        "Build a narrowly scoped tool or workflow that removes this recurring pain without over-engineering.",
      value:
        "Turns repeated low-grade frustration into a concrete, shippable side project.",
      difficulty: inferDifficulty(sources.length),
      sources
    };
  });

  while (ideas.length < MAX_IDEAS) {
    ideas.push({
      title: "Unclaimed Builder Opportunity",
      murmur:
        "Signals suggest a persistent gap that has not yet been claimed by a dedicated builder.",
      quest:
        "Prototype a small, opinionated solution that tests whether this pain is real.",
      value:
        "Creates momentum from otherwise ambient builder frustration.",
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

  return ideas.slice(0, MAX_IDEAS);
}

/* --------------------------------------------------
   MAIN HANDLER (orchestration)
-------------------------------------------------- */

export async function handler(event) {
  const store = getStore({
    name: "tech-murmurs",
    siteID: process.env.NETLIFY_SITE_ID,
    token: process.env.NETLIFY_AUTH_TOKEN
  });

  const force = new URL(event.url).searchParams.get("force") === "true";

  // Reuse snapshot unless forced
  if (!force) {
    const existing = await store.get("latest");
    if (existing) {
      return new Response(existing, { headers: { "Content-Type": "application/json" } });
    }
  }

  // Ingest signals (independent + fault tolerant)
  const results = await Promise.allSettled([
    getGitHubSignals(),
    getHackathonSignals(),
    getTwitterSignals(),
    getRoadmapSignals()
  ]);

  let signals = [];
  results.forEach(r => {
    if (r.status === "fulfilled" && Array.isArray(r.value)) {
      signals.push(...r.value);
    }
  });

  signals = signals.filter(withinWindow);

  if (!signals.length) {
    return new Response(
      JSON.stringify({ mode: "sample", ideas: [] }),
      { headers: { "Content-Type": "application/json" } }
    );
  }

  const clusters = clusterSignals(signals);

  let ideas = await synthesizeIdeasWithAI(clusters);
  if (!ideas) ideas = fallbackIdeas(clusters);

  // Attach sources to AI ideas
  ideas = ideas.map((idea, i) => {
    const cluster = clusters[i % clusters.length];
    const sources = cluster.signals.map(s => ({
      type: s.type,
      name:
        s.type === "github" ? "GitHub" :
        s.type === "hackathon" ? "Hackathon" :
        s.type === "roadmap" ? "Roadmap" :
        s.type === "twitter" ? "X" :
        "Source",
      url: s.url
    }));

    return {
      ...idea,
      difficulty: inferDifficulty(sources.length),
      sources
    };
  });

  const payload = {
    mode: "live",
    date: todayISO(),
    ideas
  };

  await store.set("latest", JSON.stringify(payload));
  await store.set(`daily-${payload.date}`, JSON.stringify(payload));

  return new Response(
    JSON.stringify(payload),
    { headers: { "Content-Type": "application/json" } }
  );
}

export default handler;
