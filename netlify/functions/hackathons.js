// netlify/functions/hackathons.js

/**
 * Hackathon signals are intentionally:
 * - prompt-driven
 * - future-oriented
 * - high-level but concrete
 *
 * These are NOT summaries.
 * They represent explicit invitations to build.
 */

/**
 * Named export used by generateDaily.js
 */
export async function fetchHackathonSignals() {
  const today = new Date().toISOString().slice(0, 10);

  // Curated, high-signal hackathon-style prompts.
  // This avoids fragile scraping and keeps Netlify costs low.
  const prompts = [
    {
      text:
        "Teams repeatedly struggle to prototype on-chain analytics during hackathons because existing tooling is too heavyweight to set up in a weekend.",
      url: "https://example.com/hackathon/onchain-analytics",
    },
    {
      text:
        "Builders want to experiment with governance mechanics at hackathons, but lack lightweight simulators that can be configured without deep protocol knowledge.",
      url: "https://example.com/hackathon/governance-sim",
    },
    {
      text:
        "Hackathon teams frequently rebuild the same authentication and wallet-connection flows instead of focusing on their core idea.",
      url: "https://example.com/hackathon/auth-friction",
    },
    {
      text:
        "Many hackathon projects fail to ship demos because deployment pipelines are too complex for short event timelines.",
      url: "https://example.com/hackathon/deployment-friction",
    },
    {
      text:
        "Builders want ways to showcase partially working prototypes during hackathons, but current demo tooling assumes production readiness.",
      url: "https://example.com/hackathon/demo-tools",
    },
  ];

  return prompts.map(p => ({
    type: "hackathon",
    text: p.text,
    url: p.url,
    date: today,
  }));
}

/**
 * HTTP handler so /.netlify/functions/hackathons works
 * (used for debugging + verification)
 */
export default async function handler() {
  try {
    const signals = await fetchHackathonSignals();
    return new Response(JSON.stringify(signals), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Hackathons ingestion failed:", err);
    return new Response(
      JSON.stringify({ error: "Hackathons ingestion failed" }),
      { status: 500 }
    );
  }
}
