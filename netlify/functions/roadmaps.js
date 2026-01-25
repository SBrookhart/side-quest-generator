// netlify/functions/roadmaps.js
export async function getRoadmapSignals() {
  const repos = [
    "ethereum/go-ethereum",
    "solana-labs/solana",
    "cosmos/cosmos-sdk"
  ];

  const signals = [];

  for (const repo of repos) {
    try {
      const res = await fetch(
        `https://api.github.com/repos/${repo}/releases?per_page=2`,
        { headers: { Accept: "application/vnd.github+json" } }
      );

      if (!res.ok) continue;

      const data = await res.json();
      for (const rel of data) {
        signals.push({
          type: "github",
          text: rel.body || rel.name,
          url: rel.html_url,
          timestamp: rel.published_at
        });
      }
    } catch {}
  }

  return signals;
}

export default async function handler() {
  return Response.json(await getRoadmapSignals());
}
