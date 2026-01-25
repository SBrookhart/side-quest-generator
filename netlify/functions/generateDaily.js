import { getStore } from "@netlify/blobs";

export default async function handler() {
  try {
    const store = getStore("tech-murmurs");

    const today = new Date().toISOString().slice(0, 10);
    const key = `daily-${today}`;

    // Return cached snapshot if it already exists
    const existing = await store.get(key, { type: "json" });
    if (existing) {
      return new Response(JSON.stringify(existing.ideas || existing), {
        headers: { "Content-Type": "application/json" }
      });
    }

    let ideas = [];

    // --- LIVE GITHUB INGESTION ---
    try {
      const res = await fetch(
        "https://api.github.com/search/issues?q=label:help+wanted+state:open&per_page=5",
        {
          headers: {
            "User-Agent": "Tech-Murmurs"
          }
        }
      );

      const json = await res.json();

      ideas = (json.items || []).slice(0, 5).map(issue => ({
        title: issue.title,
        murmur:
          issue.body?.slice(0, 220) ||
          "Builder describing an unmet need or missing capability.",
        quest: "Explore a lightweight prototype or proof of concept.",
        value: "Directly addresses a publicly expressed builder pain point.",
        difficulty: "Medium",
        sources: [
          {
            type: "github",
            name: issue.repository_url.split("/").slice(-1)[0],
            url: issue.html_url
          }
        ]
      }));
    } catch (err) {
      ideas = [];
    }

    // --- FALLBACK SAMPLE DATA ---
    if (!ideas.length) {
      ideas = [
        {
          title: "The Market Has Feelings",
          murmur:
            "Crypto discourse oscillates between euphoria and despair, but no one tracks it coherently.",
          quest: "Build a real-time emotional dashboard of crypto Twitter.",
          value:
            "Turns narrative chaos into something legible without trading.",
          difficulty: "Easy",
          sources: []
        },
        {
          title: "Crypto Urban Legends",
          murmur:
            "On-chain myths persist without attribution or provenance.",
          quest:
            "Create a living museum of crypto myths and memes.",
          value:
            "Preserves cultural memory and reduces misinformation.",
          difficulty: "Easy",
          sources: []
        },
        {
          title: "If Crypto Twitter Were a Person",
          murmur:
            "Collective behavior often feels like a single personality.",
          quest:
            "Build an AI character powered by live crypto discourse.",
          value:
            "Turns sentiment into something playful and interpretable.",
          difficulty: "Medium",
          sources: []
        },
        {
          title: "On-Chain Weather Channel",
          murmur:
            "Network conditions are unintuitive to non-technical users.",
          quest:
            "Visualize on-chain activity like a weather forecast.",
          value:
            "Improves comprehension without dashboards.",
          difficulty: "Medium",
          sources: []
        },
        {
          title: "Build-A-Protocol Simulator",
          murmur:
            "Protocol design is opaque to newcomers.",
          quest:
            "Create a sandbox for simulating protocol tradeoffs.",
          value:
            "Lowers the barrier to systems thinking.",
          difficulty: "Hard",
          sources: []
        }
      ];
    }

    const snapshot = {
      date: today,
      mode: ideas.some(i => i.sources?.length)
        ? "editorial"
        : "sample",
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
