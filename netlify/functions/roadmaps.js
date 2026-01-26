// netlify/functions/roadmaps.js

/**
 * 🔑 Named export for orchestration
 */
export async function getRoadmapSignals() {
  return [
    {
      type: "roadmap",
      text:
        "A security-related protocol update shifts best practices, creating new implementation pressure for downstream tools.",
      url: "https://github.com/ethereum/go-ethereum/releases/tag/v1.16.8",
      date: "2026-01-13"
    },
    {
      type: "roadmap",
      text:
        "Ongoing protocol evolution increases surface area and complexity for builders integrating with Solana.",
      url: "https://github.com/solana-labs/solana/releases/tag/v1.18.26",
      date: "2025-10-12"
    }
  ];
}

/**
 * HTTP endpoint
 */
export async function handler() {
  const signals = await getRoadmapSignals();
  return new Response(JSON.stringify(signals), {
    headers: { "Content-Type": "application/json" }
  });
}
