// netlify/functions/roadmaps.js

export async function fetchRoadmapSignals() {
  try {
    const repos = [
      "ethereum/go-ethereum",
      "solana-labs/solana",
      "cosmos/cosmos-sdk"
    ];

    const signals = [];

    for (const repo of repos) {
      const res = await fetch(
        `https://api.github.com/repos/${repo}/releases`,
        { headers: { Accept: "application/vnd.github+json" } }
      );

      if (!res.ok) continue;

      const releases = await res.json();
      if (!Array.isArray(releases)) continue;

      releases.slice(0, 2).forEach(r => {
        signals.push({
          type: "github",
          text: `Protocol release: ${r.name || r.tag_name}`,
          url: r.html_url,
          date: r.published_at
            ? r.published_at.slice(0, 10)
            : new Date().toISOString().slice(0, 10)
        });
      });
    }

    return signals;
  } catch (err) {
    console.error("Roadmaps error:", err);
    return [];
  }
}
