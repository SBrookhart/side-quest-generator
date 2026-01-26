// netlify/functions/hackathons.js

/**
 * 🔑 Named export for orchestration
 */
export async function getHackathonSignals() {
  const today = new Date().toISOString().slice(0, 10);

  return [
    {
      type: "hackathon",
      text:
        "Teams repeatedly struggle to prototype on-chain analytics during hackathons because existing tooling is too heavyweight for a weekend build.",
      url: "https://example.com/hackathon/onchain-analytics",
      date: today
    },
    {
      type: "hackathon",
      text:
        "Hackathon teams rebuild wallet auth flows instead of focusing on their core idea.",
      url: "https://example.com/hackathon/auth-friction",
      date: today
    },
    {
      type: "hackathon",
      text:
        "Builders want to experiment with governance mechanics but lack lightweight simulators.",
      url: "https://example.com/hackathon/governance-sim",
      date: today
    }
  ];
}

/**
 * HTTP endpoint
 */
export async function handler() {
  const signals = await getHackathonSignals();
  return new Response(JSON.stringify(signals), {
    headers: { "Content-Type": "application/json" }
  });
}
