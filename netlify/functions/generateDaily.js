import { getStore } from "@netlify/blobs";

export default async function handler() {
  try {
    const store = getStore("tech-murmurs");

    const today = new Date().toISOString().slice(0, 10);
    const key = `daily-${today}`;

    // If today's snapshot already exists, return it
    const existing = await store.get(key, { type: "json" });
    if (existing) {
      return new Response(JSON.stringify(existing), {
        headers: { "Content-Type": "application/json" }
      });
    }

    // --- LIVE INGESTION LOGIC (simplified placeholder) ---
    // Native fetch is available in Node 18 — no import required

    let ideas = [];

    try {
      const githubRes = await fetch("https://api.github.com/search/issues?q=label:help+wanted+state:open&per_page=5");
      const githubData = await githubRes.json();

      ideas = (githubData.items || []).slice(0, 5).map(issue => ({
        title: issue.title,
        murmur: issue.body?.slice(0, 200) || "Open issue indicating an unmet need.",
        quest: "Explore a lightweight solution or prototype.",
        value: "Addresses a clearly expressed builder pain point.",
        difficulty: "Medium",
        sources: [
          {
            type: "github",
            name: issue.repository_url.split("/").slice(-1)[0],
            url: issue.html_url
          }
        ]
      }));
    } catch (e) {
      // If live fetch fails, fall back to sample ideas
      ideas = [];
    }

    // --- SAMPLE DATA FALLBACK ---
    if (!ideas.length) {
      ideas = [
        {
          title: "The Market Has Feelings",
          murmur: "Crypto discourse oscillates between euphoria and despair, but no one tracks it coherently.",
          quest: "Build a real-time emotional dashboard of crypto Twitter.",
          value: "Turns narrative chaos into something legible without trading.",
          difficulty: "Easy",
          sources: []
        },
        {
          title: "Crypto Urban Legends",
          murmur: "On-chain myths persist without attribution or provenance.",
          quest: "Create a living museum of crypto myths and memes.",
          value: "Preserves cultural memory and reduces misinformation.",
          difficulty: "Easy",
          sources: []
        },
        {
          title: "If Crypto Twitter Were a Person",
          murmur: "Collective behavior often feels like a single personality.",
          quest: "Build an AI character powered by live crypto discourse.",
          value: "Turns sentiment into something playful and interpretable.",
          difficulty: "Medium",
          sources: []
        },
        {
          title: "On-Chain Weather Channel",
          murmur: "Network conditions are unintuitive to non-technical users.",
          quest: "Visualize on-chain activity like a weather forecast.",
          value: "Improves comprehension without dashboards.",
          difficulty: "Medium",
          sources: []
        },
        {
          title: "Build-A-Protocol Simulator",
          murmur: "Protocol design is opaque to newcomers.",
          quest: "Create a sandbox for simulating protocol tradeoffs.",
          value: "Lowers the barrier to systems thinking.",
          difficulty: "Hard",
          sources: []
        }
      ];
    }

    const snapshot = {
      date: today,
      mode: ideas.some(i => i.sources?.length) ? "editorial" : "sample",
      ideas
    };

    await store.set(key, snapshot);
    await store.set("latest", ideas);

    return new Response(JSON.stringify(ideas), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500 }
    );
  }
}
