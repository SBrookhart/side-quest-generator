// netlify/functions/roadmaps.js

export async function getRoadmapSignals() {
  return [
    {
      type: "roadmap",
      text:
        "A protocol security update introduces new implementation pressure for downstream tooling.",
      url: "https://github.com/ethereum/go-ethereum/releases/tag/v1.16.8",
      date: "2026-01-13"
    }
  ];
}

export async function handler() {
  const signals = await getRoadmapSignals();
  return new Response(JSON.stringify(signals), {
    headers: { "Content-Type": "application/json" }
  });
}
