import { getGithubSignals } from "./github.js";
import { getHackathonSignals } from "./hackathons.js";
import { getTwitterSignals } from "./twitter.js";
import { getRoadmapSignals } from "./roadmaps.js";

/**
 * Utility: safe call wrapper so one source failing
 * never collapses the whole daily run.
 */
async function safe(fn, label) {
  try {
    const res = await fn();
    return Array.isArray(res) ? res : [];
  } catch (e) {
    console.error(`❌ ${label} failed`, e.message);
    return [];
  }
}

/**
 * Difficulty inference based on language + source gravity
 */
function inferDifficulty(text = "", sources = []) {
  const t = text.toLowerCase();

  if (
    t.includes("protocol") ||
    t.includes("consensus") ||
    t.includes("infrastructure") ||
    sources.some(s => s.name === "Protocol Roadmap")
  ) {
    return "Hard";
  }

  if (
    t.includes("dashboard") ||
    t.includes("visualize") ||
    t.includes("index") ||
    t.includes("tool")
  ) {
    return "Medium";
  }

  return "Easy";
}

/**
 * Group related signals into one side quest
 */
function synthesizeIdeas(signals) {
  const buckets = {};

  signals.forEach(sig => {
    if (!sig.text) return;

    // naive clustering key
    const key =
      sig.text
        .toLowerCase()
        .replace(/[^a-z0-9 ]/g, "")
        .split(" ")
        .slice(0, 4)
        .join(" ") || "misc";

    if (!buckets[key]) buckets[key] = [];
    buckets[key].push(sig);
  });

  return Object.values(buckets).slice(0, 5).map(group => {
    const combinedText = group.map(g => g.text).join(" ");

    const sources = group.map(g => ({
      type: g.type,      // github | twitter | rss
      name: g.name,
      url: g.url
    }));

    return {
      title: group[0].title || "Unclaimed Builder Opportunity",
      murmur: group[0].text.slice(0, 160),
      quest: "Explore a small, focused build that resolves this recurring friction.",
      value: "Turns repeated ambient pain into something concrete and shippable.",
      difficulty: inferDifficulty(combinedText, sources),
      sources
    };
  });
}

export default async function handler() {
  // ⛑ rate-limit hardening via isolation
  const [github, hackathons, twitter, roadmaps] = await Promise.all([
    safe(getGithubSignals, "GitHub"),
    safe(getHackathonSignals, "Hackathons"),
    safe(getTwitterSignals, "Twitter/X"),
    safe(getRoadmapSignals, "Roadmaps")
  ]);

  const signals = [
    ...github,
    ...hackathons,
    ...twitter,
    ...roadmaps
  ];

  // If EVERYTHING failed → explicit sample mode
  if (!signals.length) {
    return Response.json({
      mode: "sample",
      ideas: []
    });
  }

  const ideas = synthesizeIdeas(signals);

  return Response.json({
    mode: "live",
    ideas
  });
}
