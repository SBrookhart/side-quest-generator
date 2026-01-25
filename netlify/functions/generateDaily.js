import { getStore } from "@netlify/blobs";

/* ---------------------------------------------------------
   Configuration
--------------------------------------------------------- */

const SITE_BASE = "https://side-quest-generator.netlify.app";
const FRICTION_REGEX =
  /(someone should|wish there was|why is there no|hard to|confusing|unclear|missing|feels early|keep seeing people)/i;

/* ---------------------------------------------------------
   Helpers
--------------------------------------------------------- */

function classifyDifficulty({ sources, openEnded }) {
  if (openEnded && sources.length >= 3) return "Hard";
  if (sources.length >= 2) return "Medium";
  return "Easy";
}

function normalizeSignal(raw) {
  return {
    type: raw.type,
    name:
      raw.type === "github"
        ? "GitHub issue"
        : raw.type === "x"
        ? "X post"
        : raw.type === "article"
        ? "Blog essay"
        : "Hackathon prompt",
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

function synthesizeIdea({ title, murmur, quest, worth, signals, openEnded }) {
  const difficulty = classifyDifficulty({
    sources: signals,
    openEnded
  });

  return {
    title,
    difficulty,
    murmur,
    sideQuest: quest,
    worth,
    signals: signals.map(normalizeSignal)
  };
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
     Fetch GitHub signals (existing function)
  --------------------------------------------------------- */

  let githubSignals = [];
  try {
    const res = await fetch(
      `${SITE_BASE}/.netlify/functions/github`
    );
    const raw = await res.json();
    githubSignals = raw.filter(
      r => r.text && FRICTION_REGEX.test(r.text)
    );
  } catch {
    githubSignals = [];
  }

  /* ---------------------------------------------------------
     Synthesis (vibe-coder + purpose)
  --------------------------------------------------------- */

  const ideas = [];

  if (githubSignals.length >= 2) {
    ideas.push(
      synthesizeIdea({
        title: "The Internet Is Whispering About…",
        murmur:
          "Across builder conversations, people keep sensing shifts before they show up in metrics or headlines. These early signals are fragile and often disappear before anyone acts on them.",
        quest:
          "Build a small daily generator that captures and names the internet’s background thoughts before they evaporate.",
        worth: [
          "Preserves early signals before they harden",
          "Clear daily scope with room for interpretation",
          "Feels meaningful without needing to be precise"
        ],
        signals: githubSignals.slice(0, 2).map(s => ({
          type: "github",
          url: s.url
        })),
        openEnded: true
      })
    );
  }

  if (githubSignals.length >= 4) {
    ideas.push(
      synthesizeIdea({
        title: "Someone Should Build This",
        murmur:
          "All over public conversations, people casually name unmet needs and then move on. These ideas disappear even though they point to real white space.",
        quest:
          "Build a collector that captures and surfaces “someone should build…” moments before they vanish.",
        worth: [
          "Directly surfaces white space",
          "Minimal logic, strong sense of purpose",
          "Encourages remixing instead of perfection"
        ],
        signals: githubSignals.slice(2, 4).map(s => ({
          type: "github",
          url: s.url
        })),
        openEnded: false
      })
    );
  }

  /* ---------------------------------------------------------
     Fallback (Sample Mode)
  --------------------------------------------------------- */

  let mode = "sample";

  if (ideas.length >= 2) {
    mode = "live";
  }

  while (ideas.length < 5) {
    ideas.push(
      synthesizeIdea({
        title: "The Internet’s Collective Attention Span",
        murmur:
          "Some questions refuse to go away. They keep resurfacing because nothing has fully addressed them yet.",
        quest:
          "Build a tracker that highlights ideas the internet keeps returning to over time.",
        worth: [
          "Turns repetition into signal",
          "Helps choose problems that actually matter",
          "Naturally improves as time passes"
        ],
        signals: [],
        openEnded: true
      })
    );
  }

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
