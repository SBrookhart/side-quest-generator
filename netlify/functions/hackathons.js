// netlify/functions/hackathons.js

export async function getHackathonSignals() {
  const today = new Date().toISOString().slice(0, 10);

  return [
    {
      type: "hackathon",
      text:
        "Hackathon teams repeatedly rebuild wallet authentication instead of focusing on core product ideas.",
      url: "https://example.com/hackathon/auth-friction",
      date: today
    },
    {
      type: "hackathon",
      text:
        "Builders struggle to prototype governance mechanics during hackathons due to lack of lightweight simulators.",
      url: "https://example.com/hackathon/governance-sim",
      date: today
    }
  ];
}

export async function handler() {
  const signals = await getHackathonSignals();
  return new Response(JSON.stringify(signals), {
    headers: { "Content-Type": "application/json" }
  });
}
