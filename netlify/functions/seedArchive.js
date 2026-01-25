import { getStore } from "@netlify/blobs";

export default async () => {
  const siteID = process.env.NETLIFY_SITE_ID;
  const token = process.env.NETLIFY_AUTH_TOKEN;

  if (!siteID || !token) {
    return Response.json({ error: "Missing credentials" }, { status: 500 });
  }

  const store = getStore({
    name: "tech-murmurs",
    siteID,
    token
  });

  const seedDays = {
    "2026-01-23": {
      date: "2026-01-23",
      mode: "editorial",
      ideas: [
        {
          title: "The Market Has Feelings",
          murmur: "Crypto discourse oscillates between euphoria and despair, but no one tracks it coherently.",
          quest: "Build a real-time emotional dashboard of crypto Twitter.",
          value: "Turns narrative chaos into intuition without trading.",
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
          quest: "Build an AI character powered by crypto discourse.",
          value: "Makes sentiment legible and playful.",
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
      ]
    },

    "2026-01-24": {
      date: "2026-01-24",
      mode: "editorial",
      ideas: [
        {
          title: "Narrative Gravity Map",
          murmur: "Some ideas pull attention disproportionally.",
          quest: "Map narrative gravity across crypto discourse.",
          value: "Shows why some ideas stick.",
          difficulty: "Medium",
          sources: []
        },
        {
          title: "What Broke Overnight?",
          murmur: "Failures surface slowly and scattered.",
          quest: "Detect overnight breakage signals.",
          value: "Early warning for builders.",
          difficulty: "Easy",
          sources: []
        },
        {
          title: "DAO Decision Explainer",
          murmur: "Governance outcomes are hard to parse.",
          quest: "Translate proposals into outcomes.",
          value: "Reduces governance fatigue.",
          difficulty: "Easy",
          sources: []
        },
        {
          title: "Speculation vs Reality",
          murmur: "Rumors outpace facts.",
          quest: "Separate speculation from confirmed signals.",
          value: "Improves discourse quality.",
          difficulty: "Medium",
          sources: []
        },
        {
          title: "Protocol Changelog Digest",
          murmur: "Important updates are buried in releases.",
          quest: "Summarize breaking changes across protocols.",
          value: "Prevents surprises.",
          difficulty: "Hard",
          sources: []
        }
      ]
    }
  };

  for (const [day, payload] of Object.entries(seedDays)) {
    await store.set(`daily-${day}`, JSON.stringify(payload));
  }

  return Response.json({
    status: "seeded",
    days: Object.keys(seedDays)
  });
};
