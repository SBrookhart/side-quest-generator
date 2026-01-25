// netlify/functions/generateDaily.js

import fetch from "node-fetch";

/**
 * Utility: today in YYYY-MM-DD
 */
function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Editorial fallback ideas (used ONLY when live ingestion fails)
 */
function sampleIdeas() {
  return [
    {
      title: "The Market Has Feelings",
      murmur: "Crypto discourse oscillates between euphoria and despair, but no one tracks it coherently.",
      quest: "Build a real-time emotional dashboard of crypto Twitter.",
      value: "Turns narrative chaos into something legible without trading.",
      difficulty: "Easy",
      sources: []
    },
    {
      title: "Crypto Urban Legends",
      murmur: "On-chain myths persist without attribution or provenance.",
      quest: "Create a living museum of crypto myths and memes.",
      value: "Preserves cultural memory and reduces misinformation.",
      difficulty: "Easy",
      sources: []
    },
    {
      title: "If Crypto Twitter Were a Person",
      murmur: "Collective behavior often feels like a single personality.",
      quest: "Build an AI character powered by live crypto discourse.",
      value: "Turns sentiment into something playful and interpretable.",
      difficulty: "Medium",
      sources: []
    },
    {
      title: "On-Chain Weather Channel",
      murmur: "Network conditions are unintuitive to non-technical users.",
      quest: "Visualize on-chain activity like a weather forecast.",
      value: "Improves comprehension without dashboards.",
      difficulty: "Medium",
      sources: []
    },
    {
      title: "Build-A-Protocol Simulator",
      murmur: "Protocol design is opaque to newcomers.",
      quest: "Create a sandbox for simulating protocol tradeoffs.",
      value: "Lowers the barrier to systems thinking.",
      difficulty: "Hard",
      sources: []
    }
  ];
}

/**
 * LIVE INGESTION — GitHub Issues as signal source
 * (Lightweight, transparent, heuristic-based)
 */
async function fetchGitHubSignals() {
  const token = process.env.GITHUB_TOKEN;

  if (!token) {
    throw new Error("Missing GITHUB_TOKEN");
  }

  const query = encodeURIComponent(
    'language:JavaScript "wish there was" OR "missing" OR "no tool for"'
  );

  const url = `https://api.github.com/search/issues?q=${query}&sort=updated&order=desc&per_page=5`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "User-Agent": "tech-murmurs"
    }
  });

  if (!res.ok) {
    throw new Error("GitHub API failed");
  }

  const data = await res.json();

  return data.items.map(item => ({
    title: item.title,
    murmur: item.body?.slice(0, 220) || "An unmet need surfaced in a public issue.",
    quest: "Explore a lightweight tool or feature to resolve this expressed gap.",
    value: "Addresses a real, publicly articulated builder friction.",
    difficulty: "Medium",
    sources: [
      {
        type: "github",
        name: item.repository_url.replace("https://api.github.com/repos/", ""),
        url: item.html_url
      }
    ]
  }));
}

/**
 * Main handler
 */
export async function handler() {
  const date = todayISO();
  let ideas = [];
  let mode = "editorial";

  try {
    const liveIdeas = await fetchGitHubSignals();

    if (liveIdeas.length) {
      ideas = liveIdeas;
      mode = "live";
    } else {
      ideas = sampleIdeas();
    }
  } catch (err) {
    ideas = sampleIdeas();
  }

  const payload = {
    date,
    mode,
    ideas
  };

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store"
    },
    body: JSON.stringify(payload, null, 2)
  };
}
