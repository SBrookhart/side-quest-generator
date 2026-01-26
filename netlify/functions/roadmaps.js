// netlify/functions/roadmaps.js

const REPOS = [
  "ethereum/go-ethereum",
  "solana-labs/solana",
  "cosmos/cosmos-sdk",
  "polygon-edge/polygon-edge"
];

const KEYWORDS = [
  "breaking",
  "deprecated",
  "migration",
  "manual",
  "workaround",
  "removed",
  "upgrade required",
  "security fix",
  "action required"
];

const MAX_PER_REPO = 3;

export default async function getRoadmapSignals() {
  const signals = [];

  for (const repo of REPOS) {
    let res;

    try {
      res = await fetch(
        `https://api.github.com/repos/${repo}/releases`,
        {
          headers: {
            "User-Agent": "tech-murmurs"
          }
        }
      );
    } catch {
      continue;
    }

    if (!res.ok) continue;

    let releases;
    try {
      releases = await res.json();
    } catch {
      continue;
    }

    if (!Array.isArray(releases)) continue;

    let used = 0;

    for (const r of releases) {
      if (used >= MAX_PER_REPO) break;
      if (!r.body) continue;

      const body = r.body.toLowerCase();

      if (!KEYWORDS.some(k => body.includes(k))) continue;

      signals.push({
        type: "github",
        text: r.body
          .replace(/\s+/g, " ")
          .slice(0, 300)
          .trim(),
        url: r.html_url,
        date: r.published_at
          ? r.published_at.slice(0, 10)
          : new Date().toISOString().slice(0, 10)
      });

      used++;
    }
  }

  return signals;
}
