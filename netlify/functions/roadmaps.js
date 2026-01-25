// netlify/functions/roadmaps.js

export async function getRoadmapSignals() {
  const repos = [
    "ethereum/go-ethereum",
    "solana-labs/solana",
    "cosmos/cosmos-sdk"
  ];

  const results = [];

  for (const repo of repos) {
    try {
      const url = `https://api.github.com/repos/${repo}/releases?per_page=3`;
      const res = await fetch(url, {
        headers: { Accept: "application/vnd.github+json" }
      });

      if (!res.ok) continue;

      const data = await res.json();

      data.forEach(rel => {
        results.push({
          type: "github",
          name: "Protocol Roadmap",
          text: rel.body || rel.name || "",
          url: rel.html_url
        });
      });
    } catch {
      continue;
    }
  }

  return results;
}

export default async function handler() {
  const signals = await getRoadmapSignals();
  return Response.json(signals);
}
