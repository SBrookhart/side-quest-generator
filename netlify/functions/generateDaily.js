import { getStore } from "@netlify/blobs";

/* ---------------------------------------------------------
   Helpers
--------------------------------------------------------- */

const FRICTION_REGEX =
  /(hard to|harder to|confusing|unclear|wish there was|missing|difficult to|doesn't explain|no way to)/i;

function classifySignal(text) {
  if (/error|message|exception|trace|fail/i.test(text)) return "feedback";
  if (/doc|documentation|readme|guide/i.test(text)) return "comprehension";
  if (/setup|install|config|start/i.test(text)) return "setup";
  return "other";
}

function clusterSignals(signals) {
  const clusters = {};

  for (const s of signals) {
    const bucket = classifySignal(s.text);
    if (!clusters[bucket]) clusters[bucket] = [];
    clusters[bucket].push(s);
  }

  return clusters;
}

function synthesizeIdea(cluster, signals) {
  if (cluster === "comprehension") {
    return {
      title: "Flow-First Documentation Companion",
      murmur:
        "Developers repeatedly report that documentation is technically complete but cognitively overwhelming, making it hard to understand how systems actually flow end-to-end.",
      quest:
        "Build a companion tool that reframes existing documentation as a clear step-by-step flow, emphasizing sequence, dependencies, and decision points instead of dense prose.",
      worth: [
        "High empathy project with visible UX impact",
        "Great practice in information design and summarization",
        "Easy to scope as a browser extension or docs overlay"
      ]
    };
  }

  if (cluster === "feedback") {
    return {
      title: "Plain-English Error Translator",
      murmur:
        "Across developer tools, error messages often state what failed without explaining why it failed or what to do next, leaving users stuck.",
      quest:
        "Build a lightweight translator that converts raw error messages into plain-English explanations with likely causes and suggested next steps.",
      worth: [
        "Helps builders get unstuck faster",
        "Strong DX improvement with low technical surface area",
        "Ideal for a CLI wrapper or dev-tool demo"
      ]
    };
  }

  if (cluster === "setup") {
    return {
      title: "First-Run Setup Guide Generator",
      murmur:
        "Many tools assume prior context during setup, causing new users to struggle with configuration and first-run errors.",
      quest:
        "Build a setup assistant that detects common misconfigurations and generates a personalized first-run checklist for new users.",
      worth: [
        "Great beginner-friendly project",
        "Teaches practical UX thinking for developers",
        "Easy to prototype with static rules first"
      ]
    };
  }

  return null;
}

/* ---------------------------------------------------------
   Main Function
--------------------------------------------------------- */

export default async (request) => {
  const siteID =
    process.env.NETLIFY_SITE_ID || process.env.SITE_ID;
  const token =
    process.env.NETLIFY_AUTH_TOKEN || process.env.NETLIFY_API_TOKEN;

  if (!siteID || !token) {
    return Response.json({ error: "Missing credentials" }, { status: 500 });
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
     Fetch live GitHub signals
  --------------------------------------------------------- */

  let rawSignals = [];
  try {
    const res = await fetch(
      "https://side-quest-generator.netlify.app/.netlify/functions/github"
    );
    rawSignals = await res.json();
  } catch {
    rawSignals = [];
  }

  /* ---------------------------------------------------------
     Filter for high-signal friction
  --------------------------------------------------------- */

  const filtered = rawSignals.filter(
    s =>
      typeof s.text === "string" &&
      FRICTION_REGEX.test(s.text)
  );

  /* ---------------------------------------------------------
     Cluster signals into human patterns
  --------------------------------------------------------- */

  const clusters = clusterSignals(filtered);

  /* ---------------------------------------------------------
     Synthesize ideas (max 5)
  --------------------------------------------------------- */

  const ideas = [];

  for (const [cluster, signals] of Object.entries(clusters)) {
    if (signals.length < 2) continue;

    const base = synthesizeIdea(cluster, signals);
    if (!base) continue;

    ideas.push({
      ...base,
      signals: signals.slice(0, 3).map(s => ({
        type: "github",
        url: s.url
      }))
    });

    if (ideas.length === 5) break;
  }

  /* ---------------------------------------------------------
     Fallback if live signals insufficient
  --------------------------------------------------------- */

  const mode = ideas.length >= 3 ? "live" : "sample";

  while (ideas.length < 5) {
    ideas.push({
      title: "Developer Narrative Layer",
      murmur:
        "Developers frequently encounter tools that explain what happened without explaining why or what to do next.",
      quest:
        "Build a narrative layer that translates raw system output into human-readable explanations and guidance.",
      worth: [
        "High-leverage DX improvement",
        "Great language + UX practice",
        "Easy to scope as a demo project"
      ],
      signals: []
    });
  }

  const snapshot = {
    date: today,
    mode,
    ideas
  };

  /* ---------------------------------------------------------
     Persist snapshot
  --------------------------------------------------------- */

  await store.set(key, JSON.stringify(snapshot));
  await store.set("latest", JSON.stringify(snapshot));

  return Response.json({
    status: force ? "regenerated" : "generated",
    date: today,
    mode
  });
};
