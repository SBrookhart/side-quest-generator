// netlify/functions/hackathons.js

export async function getHackathonSignals() {
  const today = new Date().toISOString().slice(0, 10);

  return [
    {
      type: "hackathon",
      text: "Teams struggle to prototype on-chain analytics during hackathons because existing tools are too heavy to set up in a weekend.",
      url: "https://example.com/hackathon/onchain-analytics",
      date: today
    },
    {
      type: "hackathon",
      text: "Builders want to experiment with governance mechanics but lack lightweight simulators that don't require protocol expertise.",
      url: "https://example.com/hackathon/governance",
      date: today
    },
    {
      type: "hackathon",
      text: "Hackathon teams repeatedly rebuild wallet and auth flows instead of focusing on their core idea.",
      url: "https://example.com/hackathon/auth",
      date: today
    }
  ];
}

export async function handler() {
  const signals = await getHackathonSignals();
  return new Response(JSON.stringify(signals), { status: 200 });
}
