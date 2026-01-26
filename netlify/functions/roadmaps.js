// netlify/functions/roadmaps.js

export async function getRoadmapSignals() {
  return [
    {
      type: "roadmap",
      text: "Recent Ethereum client updates introduce security-driven changes that downstream tooling must now adapt to.",
      url: "https://github.com/ethereum/go-ethereum/releases",
      date: "2026-01-13"
    },
    {
      type: "roadmap",
      text: "Ongoing Solana protocol evolution continues to increase integration complexity for application developers.",
      url: "https://github.com/solana-labs/solana/releases",
      date: "2025-12-12"
    }
  ];
}

export async function handler() {
  const signals = await getRoadmapSignals();
  return new Response(JSON.stringify(signals), { status: 200 });
}
