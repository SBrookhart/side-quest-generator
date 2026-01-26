// netlify/functions/generateDaily.js

const { getStore } = require("@netlify/blobs");

const { getGitHubSignals } = require("./github.js");
const { getHackathonSignals } = require("./hackathons.js");
const { getTwitterSignals } = require("./twitter.js");
const { getRoadmapSignals } = require("./roadmaps.js");

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

function json(body, statusCode = 200) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  };
}

/* ---------------- AI prompt ---------------- */

const SYSTEM_PROMPT = `
You are the editor of Tech Murmurs.

Tech Murmurs publishes daily side-quests for indie builders and vibe-coders.
Each idea should feel small, clever, and buildable by one person.

Do NOT summarize inputs.
Extract latent opportunity.
Avoid generic startup language.
Avoid repeating ideas.
`;

function buildUserPrompt(signals) {
  const formatted = signals
    .map(s => `- (${s.type}) ${s.text}`)
    .join("\n");

  return `
Below are real signals from developers, protocols, and hackathons.

${formatted}

Generate exactly 5 DISTINCT side quests.

Format exactly:

Title:
Murmur:
Side Quest:
Why It’s Interesting:
Difficulty:
`;
}

/* ---------------- handler ---------------- */

exports.handler = async function handler(event) {
  const store = getStore({
    name: "tech-murmurs",
    siteID: process.env.NETLIFY_SITE_ID,
    token: process.env.NETLIFY_AUTH_TOKEN
  });

  const force =
    new URL(event.rawUrl).searchParams.get("force") === "true";

  // reuse cached snapshot unless forced
  if (!force) {
    const cached = await store.get("latest");
    if (cached) {
      return json(JSON.parse(cached));
    }
  }

  // ingest signals
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
    console.error("Signal ingestion failed:", err);
  }

  signals = signals.filter(withinWindow);

  if (!signals.length) {
    return json({ mode: "sample", ideas: [] });
  }

  // call OpenAI
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

    const jsonRes = await res.json();
    aiText = jsonRes.choices?.[0]?.message?.content;
  } catch (err) {
    console.error("OpenAI error:", err);
  }

  if (!aiText) {
    return json({ mode: "sample", ideas: [] });
  }

  // parse AI output
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
    return json({ mode: "sample", ideas: [] });
  }

  const today = new Date().toISOString().slice(0, 10);
  const payload = { mode: "live", date: today, ideas };

  await store.set("latest", JSON.stringify(payload));
  await store.set(`daily-${today}`, JSON.stringify(payload));

  return json(payload);
};
