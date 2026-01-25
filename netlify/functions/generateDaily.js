import { getStore } from "@netlify/blobs";
import { getGithubSignals } from "./github.js";
import { getHackathonSignals } from "./hackathons.js";
import { getTwitterSignals } from "./twitter.js";
import { getRoadmapSignals } from "./roadmaps.js";

const WINDOW_DAYS = 14;

function normalize(text) {
  return text
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function inferTheme(text) {
  if (/monitor|observe|debug/.test(text)) return "observability";
  if (/missing|wish|hard to|no tool/.test(text)) return "tooling gap";
  if (/upgrade|release|breaking/.test(text)) return "protocol churn";
  if (/governance|vote|dao/.test(text)) return "governance";
  return "developer friction";
}

function inferDifficulty(count) {
  if (count <= 2) return "Easy";
  if (count <= 4) return "Medium";
  return "Hard";
}

export default async function handler() {
  const siteID = process.env.NETLIFY_SITE_ID;
  const token = process.env.NETLIFY_AUTH_TOKEN;
  const store = getStore({ name: "tech-murmurs", siteID, token });

  const today = new Date().toISOString().slice(0, 10);
  const cutoff =
    Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000;

  // 1️⃣ Collect rolling signals
  let signals = [
    ...(await getGithubSignals()),
    ...(await getHackathonSignals()),
    ...(await getTwitterSignals()),
    ...(await getRoadmapSignals())
  ].filter(
    s => new Date(s.timestamp).getTime() >= cutoff
  );

  // Hard fallback: never empty
  if (!signals.length) {
    signals = [
      {
        type: "github",
        text: "Builders repeatedly mention missing tooling.",
        url: "https://github.com",
        timestamp: new Date().toISOString()
      }
    ];
  }

  // 2️⃣ Cluster
  const clusters = {};
  for (const s of signals) {
    const theme = inferTheme(normalize(s.text));
    if (!clusters[theme]) clusters[theme] = [];
    clusters[theme].push(s);
  }

  // 3️⃣ Pick top 5 clusters
  let selected = Object.values(clusters)
    .sort((a, b) => b.length - a.length)
    .slice(0, 5);

  // Ensure exactly 5
  while (selected.length < 5) {
    selected.push(selected[0]);
  }

  // 4️⃣ Synthesize ideas
  const ideas = selected.map(cluster => ({
    title: "Unclaimed Builder Opportunity",
    murmur:
      "Multiple independent signals point to a recurring friction that builders keep encountering.",
    quest:
      "Design a small, focused tool or workflow that directly reduces this repeated pain.",
    value:
      "Turns scattered frustration into a concrete, shippable side quest.",
    difficulty: inferDifficulty(cluster.length),
    sources: cluster.map(s => ({
      type: s.type,
      name:
        s.type === "github"
          ? "GitHub"
          : s.type === "rss"
          ? "Hackathon"
          : "X",
      url: s.url
    }))
  }));

  const snapshot = {
    date: today,
    mode: "live",
    ideas
  };

  await store.set("latest", JSON.stringify(snapshot));
  await store.set(`daily-${today}`, JSON.stringify(snapshot));

  return Response.json(snapshot);
}
