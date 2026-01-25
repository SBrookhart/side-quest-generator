import { getStore } from "@netlify/blobs";

export default async (req) => {
  const siteID = process.env.NETLIFY_SITE_ID;
  const token = process.env.NETLIFY_AUTH_TOKEN;

  if (!siteID || !token) {
    return Response.json(
      { error: "Missing siteID or token" },
      { status: 500 }
    );
  }

  const store = getStore({
    name: "tech-murmurs",
    siteID,
    token
  });

  const today = new Date().toISOString().slice(0, 10);
  const force = new URL(req.url).searchParams.get("force") === "true";

  if (!force) {
    const existing = await store.get(`daily-${today}`);
    if (existing) {
      return Response.json({
        status: "already-generated",
        date: today
      });
    }
  }

  let ideas = [];

  /*
    LIVE INGESTION WILL BE RE-ENABLED LATER.
    For now, we ensure editorial fallback data
    matches the EXACT shape the UI expects.
  */

  ideas = [
    {
      title: "The Market Has Feelings",
      murmur:
        "Crypto discourse oscillates between euphoria and despair, but no one tracks it coherently.",
      quest:
        "Build a real-time emotional dashboard of crypto Twitter.",
      value:
        "Turns narrative chaos into something legible without trading.",
      difficulty: "Easy",
      sources: [
        {
          type: "twitter",
          name: "Crypto Twitter",
          url: "https://x.com/search?q=crypto"
        }
      ]
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
      sources: [
        {
          type: "github",
          name: "GitHub Discussions",
          url: "https://github.com/topics/cryptocurrency"
        }
      ]
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
      sources: [
        {
          type: "twitter",
          name: "Public X Threads",
          url: "https://x.com/search?q=web3"
        }
      ]
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
      sources: [
        {
          type: "rss",
          name: "Protocol Releases",
          url: "https://github.com/ethereum/go-ethereum/releases"
        }
      ]
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
      sources: [
        {
          type: "github",
          name: "Protocol Repos",
          url: "https://github.com/ethereum"
        }
      ]
    }
  ];

  const payload = {
    date: today,
    mode: "editorial",
    ideas
  };

  await store.set("latest", JSON.stringify(payload));
  await store.set(`daily-${today}`, JSON.stringify(payload));

  return Response.json({
    status: "generated",
    date: today,
    count: ideas.length,
    mode: "editorial"
  });
};
