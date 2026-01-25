// netlify/functions/roadmaps.js

// ----- Helper used by generateDaily.js -----
export async function getRoadmapSignals() {
  // Using GitHub Releases as a proxy for protocol roadmaps
  const repos = [
    "ethereum/go-ethereum",
    "solana-labs/solana",
    "polygonlabs/polygon-pos",
    "cosmos/cosmos-sdk"
  ];

  let results = [];

  for (const repo of repos) {
    try {
      const res = await fetch(
        `https://api.github.com/repos/${repo}/releases?per_page=3`,
        {
          headers: {
            Accept: "application/vnd.github+json"
          }
        }
      );

      if (!res.ok) continue;

      const releases = await res.json();

      for (const rel of releases) {
        if (!rel.body) continue;

        results.push({
          type: "roadmap",
          name: "Protocol Release",
          title: `${repo} – ${rel.name || "Release"}`,
          text: rel.body,
          url: rel.html_url
        });
      }
    } catch {
      // Ignore individual repo failures
      continue;
    }
  }

  return results;
}

// ----- HTTP handler required by Netlify -----
export default async function handler() {
  try {
    const signals = await getRoadmapSignals();
    return Response.json(signals, { status: 200 });
  } catch (err) {
    return Response.json(
      { error: "Roadmap ingestion failed" },
      { status: 500 }
    );
  }
}
