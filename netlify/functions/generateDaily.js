import { getStore } from "@netlify/blobs";

/* ---------------------------------------------------------
   Configuration
--------------------------------------------------------- */

const SITE_BASE = "https://side-quest-generator.netlify.app";

const STRONG_SIGNAL_REGEX =
  /(someone should|wish there was|why is there no|feels like nobody|hard to|confusing|missing|keeps coming up)/i;

/* ---------------------------------------------------------
   Helpers
--------------------------------------------------------- */

function classifyDifficulty(index) {
  if (index <= 1) return "Easy";
  if (index <= 3) return "Medium";
  return "Hard";
}

function normalizeSignal(raw) {
  return {
    type: raw.type,
    name:
      raw.type === "github"
        ? "GitHub Issue"
        : raw.type === "x"
        ? "X Post"
        : raw.type === "article"
        ? "Article"
        : "Hackathon Prompt",
    icon:
      raw.type === "github"
        ? "github"
        : raw.type === "x"
        ? "twitter"
        : raw.type === "article"
        ? "file-text"
        : "trophy",
    url: raw.url
  };
}

/* ---------------------------------------------------------
   Editorial Idea Templates
--------------------------------------------------------- */

function editorialTemplates(signals) {
  return [
    {
      title: "The Market Has Feelings",
      murmur:
        "People consistently react emotionally to market movement before rational explanations surface. These emotional signals are visible in conversation, but never captured coherently.",
      sideQuest:
        "Build a lightweight emotional dashboard that translates live crypto conversation into a simple daily mood report.",
      worth: [
        "Surfaces sentiment before narratives harden",
        "Useful without pretending to predict markets",
        "Turns noise into atmosphere"
      ],
      signals,
    },
    {
      title: "Someone Should Build This",
      murmur:
        "Explicit unmet needs surface regularly in passing comments, often without follow-up. These moments reveal genuine white space that quietly disappears.",
      sideQuest:
        "Build a collector that captures and curates explicit “someone should build…” moments into actionable side quests.",
      worth: [
        "Directly converts intent into action",
        "Strong sense of purpose with minimal scope",
        "Feels human, not institutional"
      ],
      signals,
    },
    {
      title: "Crypto Urban Legends",
      murmur:
        "Certain ideas persist long after they stop being true, passed down as cultural inheritance. Newcomers absorb myths without knowing their origin.",
      sideQuest:
        "Build a living archive of recurring crypto myths, showing where they came from and how they evolved.",
      worth: [
        "Makes cultural baggage visible",
        "Improves ecosystem literacy",
        "Fun without being trivial"
      ],
      signals,
    },
    {
      title: "On-Chain Weather Channel",
      murmur:
        "People experience on-chain conditions intuitively—calm, congestion, turbulence—but those states are never described in human terms.",
      sideQuest:
        "Build a metaphor-driven interface that frames on-chain conditions like a weather report.",
      worth: [
        "Reduces cognitive load",
        "Makes infrastructure legible",
        "Invites curiosity instead of fear"
      ],
      signals,
    },
    {
      title: "If Crypto Twitter Were a Person",
      murmur:
        "Collective discourse behaves like a single personality, cycling through optimism, cynicism, and obsession. Nobody ever zooms out.",
      sideQuest:
        "Build an evolving character that reflects the collective personality of crypto conversation over time.",
      worth: [
        "Encourages reflection over reaction",
        "Turns patterns into narrative",
        "More insight than analytics"
      ],
      signals,
    }
  ];
}

/* ---------------------------------------------------------
   Main
--------------------------------------------------------- */

export default async (request) => {
  const siteID =
    process.env.NETLIFY_SITE_ID || process.env.SITE_ID;
  const token =
    process.env.NETLIFY_AUTH_TOKEN || process.env.NETLIFY_API_TOKEN;

  if (!siteID || !token) {
    return Response.json(
      { error: "Missing siteID or token" },
      { status: 500 }
    );
  }

  const store = getStore({
    name: "tech-murmurs",
    siteID,
    token
  });

  const today = new Date().toISOString().slice(0, 10);
  const key = `daily/${today}`;

  const url = new URL(request.url);
  const force = url.searchParams.get("force") === "true";

  const existing = await store.get(key);
  if (existing && !force) {
    return Response.json({
      status: "already-generated",
      date: today
    });
  }

  /* ---------------------------------------------------------
     Fetch live signals
  --------------------------------------------------------- */

  let signals = [];

  try {
    const gh = await fetch(`${SITE_BASE}/.netlify/functions/github`);
    const ghRaw = await gh.json();
    signals.push(
      ...ghRaw.filter(r => r.text && STRONG_SIGNAL_REGEX.test(r.text))
        .slice(0, 3)
        .map(r => ({ type: "github", url: r.url }))
    );
  } catch {}

  try {
    const x = await fetch(`${SITE_BASE}/.netlify/functions/twitter`);
    const xRaw = await x.json();
    signals.push(
      ...xRaw.filter(r => r.text && STRONG_SIGNAL_REGEX.test(r.text))
        .slice(0, 3)
        .map(r => ({ type: "x", url: r.url }))
    );
  } catch {}

  const normalizedSignals = signals.map(normalizeSignal);

  const ideas = editorialTemplates(normalizedSignals)
    .map((idea, i) => ({
      ...idea,
      difficulty: classifyDifficulty(i),
      signals: normalizedSignals.slice(0, 2)
    }));

  const mode = normalizedSignals.length >= 2 ? "live" : "sample";

  const snapshot = {
    date: today,
    mode,
    ideas
  };

  await store.set(key, JSON.stringify(snapshot));
  await store.set("latest", JSON.stringify(snapshot));

  return Response.json({
    status: force ? "regenerated" : "generated",
    date: today,
    mode
  });
};
