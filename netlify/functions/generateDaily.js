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
        ? "Article"
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

function synthesizeIdea({
  title,
  murmur,
  quest,
  worth,
  signals,
  openEnded
}) {
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
     Fetch GitHub signals
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
     Fetch X signals
  --------------------------------------------------------- */

  let xSignals = [];
  try {
    const res = await fetch(
      `${SITE_BASE}/.netlify/functions/twitter`
    );
    const raw = await res.json();
    xSignals = raw.filter(
      r => r.text && FRICTION_REGEX.test(r.text)
    );
  } catch {
    xSignals = [];
  }

  /* ---------------------------------------------------------
     Synthesis
  --------------------------------------------------------- */

  const ideas = [];

  if (githubSignals.length >= 1 && xSignals.length >= 1) {
    ideas.push(
      synthesizeIdea({
        title: "The Internet Is Whispering About…",
        murmur:
          "Across builder conversations, people keep sensing shifts before they show up in metrics or roadmaps. These early signals surface as confusion, friction, or half-formed ideas — and then quietly disappear.",
        quest:
          "Build a daily snapshot that captures and names these background signals before they evaporate.",
        worth: [
          "Preserves early signals others overlook",
          "Clear daily scope without chasing trends",
          "Feels meaningful without needing precision"
        ],
        signals: [
          { type: "github", url: githubSignals[0].url },
          { type: "x", url: xSignals[0].url }
        ],
        openEnded: true
      })
    );
  }

  if (githubSignals.length >= 2 && xSignals.length >= 2) {
    ideas.push(
      synthesizeIdea({
        title: "Someone Should Build This",
        murmur:
          "People regularly articulate unmet needs in passing, without expecting anything to come of it. These moments reveal real white space — but vanish unless someone captures them.",
        quest:
          "Build a collector that surfaces explicit “someone should build…” moments and turns them into concrete side quests.",
        worth: [
          "Directly converts intent into action",
          "Strong sense of purpose with minimal scope",
          "Encourages experimentation over polish"
        ],
        signals: [
          { type: "github", url: githubSignals[1].url },
          { type: "x", url: xSignals[1].url }
        ],
        openEnded: false
      })
    );
  }

  /* ---------------------------------------------------------
     Live vs Sample Mode
  --------------------------------------------------------- */

  let mode = "sample";
  if (ideas.length >= 2) {
    mode = "live";
  }

  while (ideas.length < 5) {
    ideas.push(
      synthesizeIdea({
        title: "Recurring Questions That Won’t Go Away",
        murmur:
          "Some problems keep resurfacing because nothing has addressed them clearly or completely. Repetition itself becomes a signal.",
        quest:
          "Build a lightweight tracker that highlights ideas the internet keeps returning to over time.",
        worth: [
          "Turns repetition into signal",
          "Helps choose problems that actually matter",
          "Naturally improves as history accumulates"
        ],
        signals: [],
        openEnded: true
      })
    );
  }

  /* ---------------------------------------------------------
     Persist Snapshot
  --------------------------------------------------------- */

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
