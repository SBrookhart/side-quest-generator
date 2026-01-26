// netlify/functions/roadmaps.js

/**
 * Roadmaps = protocol change pressure
 * Not "what shipped", but "what builders now have to deal with"
 */

const REPOS = [
  {
    name: "Ethereum Geth",
    url: "https://api.github.com/repos/ethereum/go-ethereum/releases"
  },
  {
    name: "Solana",
    url: "https://api.github.com/repos/solana-labs/solana/releases"
  },
  {
    name: "Cosmos SDK",
    url: "https://api.github.com/repos/cosmos/cosmos-sdk/releases"
  }
];

function cleanText(text = "") {
  return text
    .replace(/```[\s\S]*?```/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 280);
}

function summarizeRelease(repoName, body = "") {
  const lower = body.toLowerCase();

  if (
    lower.includes("breaking") ||
    lower.includes("deprecated") ||
    lower.includes("migration")
  ) {
    return `A protocol change introduces breaking or migration-heavy updates that builders must now adapt to.`;
  }

  if (
    lower.includes("security") ||
    lower.includes("vulnerability")
  ) {
    return `A security-related update shifts best practices, creating new implementation pressure for downstream tools.`;
  }

  if (
    lower.includes("performance") ||
    lower.includes("optimization")
  ) {
    return `Performance changes alter assumptions, forcing builders to rethink monitoring or tuning workflows.`;
  }

  return `Ongoing protocol evolution increases surface area and complexity for builders integrating with ${repoName}.`;
}

/**
 * Named export for generateDaily.js
 */
export async function fetchRoadmapSignals() {
  const signals = [];

  for (const repo of REPOS) {
    try {
      const res = await fetch(repo.url, {
        headers: {
          Accept: "application/vnd.github+json"
        }
      });

      if (!res.ok) continue;

      const releases = await res.json();
      if (!Array.isArray(releases)) continue;

      releases.slice(0, 2).forEach(rel => {
        const summary = summarizeRelease(
          repo.name,
          rel.body || ""
        );

        signals.push({
          type: "roadmap",
          text: summary,
          url: rel.html_url,
          date: rel.published_at
            ? rel.published_at.slice(0, 10)
            : new Date().toISOString().slice(0, 10)
        });
      });
    } catch (err) {
      console.error("Roadmap fetch failed:", repo.name, err);
    }
  }

  return signals;
}

/**
 * Netlify endpoint support
 */
export default async function handler() {
  const signals = await fetchRoadmapSignals();
  return Response.json(signals);
}
