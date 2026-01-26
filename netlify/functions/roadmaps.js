// netlify/functions/roadmaps.js
// Protocol roadmap + release pressure signals

const REPOS = [
  { owner: "ethereum", repo: "go-ethereum" },
  { owner: "solana-labs", repo: "solana" },
  { owner: "cosmos", repo: "cosmos-sdk" }
];

const MAX_RELEASES_PER_REPO = 3;

/* ---------- helpers ---------- */

function cleanText(text = "") {
  return text
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`[^`]*`/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 260);
}

function extractPressure(body = "") {
  const lowered = body.toLowerCase();

  if (
    lowered.includes("breaking") ||
    lowered.includes("deprecated") ||
    lowered.includes("migration") ||
    lowered.includes("upgrade required")
  ) {
    return "Developers are being forced to adapt to breaking or incompatible changes.";
  }

  if (
    lowered.includes("security") ||
    lowered.includes("vulnerability") ||
    lowered.includes("patch")
  ) {
    return "Security changes introduce new operational and monitoring burdens.";
  }

  if (
    lowered.includes("performance") ||
    lowered.includes("optimization") ||
    lowered.includes("throughput")
  ) {
    return "Performance changes alter assumptions developers rely on.";
  }

  return null;
}

/* ---------- handler ---------- */

export default async function getRoadmapSignals() {
  const signals = [];

  for (const { owner, repo } of REPOS) {
    const url = `https://api.github.com/repos/${owner}/${repo}/releases?per_page=${MAX_RELEASES_PER_REPO}`;

    try {
      const res = await fetch(url, {
        headers: {
          Accept: "application/vnd.github+json"
        }
      });

      if (!res.ok) continue;

      const releases = await res.json();
      if (!Array.isArray(releases)) continue;

      for (const release of releases) {
        if (!release.body) continue;

        const pressure = extractPressure(release.body);
        if (!pressure) continue;

        const text = cleanText(
          `Recent ${repo} release introduces new constraints: ${pressure}`
        );

        if (text.length < 80) continue;

        signals.push({
          type: "github",
          text,
          url: release.html_url,
          date: release.published_at
            ? release.published_at.slice(0, 10)
            : new Date().toISOString().slice(0, 10)
        });
      }
    } catch (err) {
      console.error("Roadmap ingestion failed:", err);
    }
  }

  return signals;
}
