// netlify/functions/generateDaily.js

const { getStore } = require("@netlify/blobs");

const { getGitHubSignals } = require("./github.js");
const { getHackathonSignals } = require("./hackathons.js");
const { getTwitterSignals } = require("./twitter.js");
const { getRoadmapSignals } = require("./roadmaps.js");

const MAX_IDEAS = 5;
const SIGNAL_WINDOW_DAYS = 14;

/* ---------------- utilities ---------------- */

function json(body, statusCode = 200) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  };
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function withinWindow(signal) {
  return new Date(signal.date) >= daysAgo(SIGNAL_WINDOW_DAYS);
}

/* ---------------- AI prompts ---------------- */

const SYSTEM_PROMPT =
  "You are the editor of Tech Murmurs.\n" +
  "Generate high-quality, creative side quests for indie builders.\n" +
  "Do NOT summarize sources.\n" +
  "Extract latent opportunity.\n" +
  "Each idea must feel distinct, buildable, and clever.";

function buildUserPrompt(signals) {
  let text = "Signals:\n";
  for (const s of signals) {
    text += "- (" + s.type + ") " + s.text + "\n";
  }

  text +=
    "\nGenerate exactly 5 ideas.\n" +
    "Format EXACTLY as:\n\n" +
    "Title:\nMurmur:\nSide Quest:\nWhy It’s Interesting:\nDifficulty:\n";

  return text;
}

/* ---------------- handler ---------------- */

exports.handler = async function handler(event) {
  const store = getStore({
    name: "tech-murmurs",
    siteID: process.env.NETLIFY_SITE_ID,
    token: process.env.NETLIFY_AUTH_TOKEN
  });

  const force =
    event.rawUrl &&
    event.rawUrl.indexOf("force=true") !== -1;

  if (!force) {
    const cached = await store.get("latest");
    if (cached) {
      return json(JSON.parse(cached));
    }
  }

  // ingest signals
  let signals = [];

  try {
    const results = await Promise.all([
      getGitHubSignals(),
      getHackathonSignals(),
      getTwitterSignals(),
      getRoadmapSignals()
    ]);

    for (const arr of results) {
      if (Array.isArray(arr)) {
        signals = signals.concat(arr);
      }
    }
  } catch (err) {
    console.error("Ingestion error:", err);
  }

  signals = signals.filter(withinWindow);

  if (signals.length === 0) {
    return json({ mode: "sample", ideas: [] });
  }

  // call OpenAI
  let aiText = null;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + process.env.OPENAI_API_KEY
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

    const data = await res.json();
    aiText =
      data &&
      data.choices &&
      data.choices[0] &&
      data.choices[0].message &&
      data.choices[0].message.content;
  } catch (err) {
    console.error("OpenAI error:", err);
  }

  if (!aiText) {
    return json({ mode: "sample", ideas: [] });
  }

  // parse ideas SAFELY
  const blocks = aiText.split("\nTitle:");
  const ideas = [];

  for (let i = 1; i < blocks.length; i++) {
    const block = "Title:" + blocks[i];

    function extract(label) {
      const start = block.indexOf(label + ":");
      if (start === -1) return null;
      const end = block.indexOf("\n", start + label.length + 1);
      if (end === -1) return block.slice(start + label.length + 1).trim();
      return block.slice(start + label.length + 1, end).trim();
    }

    const title = extract("Title");
    const murmur = extract("Murmur");
    const quest = extract("Side Quest");
    const value = extract("Why It’s Interesting");
    const difficulty = extract("Difficulty");

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
    return json({ mode: "sample", ideas: [] });
  }

  const today = new Date().toISOString().slice(0, 10);
  const payload = { mode: "live", date: today, ideas };

  await store.set("latest", JSON.stringify(payload));
  await store.set("daily-" + today, JSON.stringify(payload));

  return json(payload);
};
