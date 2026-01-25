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

  // Prevent accidental regeneration unless forced
  if (!force) {
    const existing = await store.get(`daily-${today}`);
    if (existing) {
      return Response.json({
        status: "already-generated",
        date: today
      });
    }
  }

  // ----------------------------
  // EDITORIAL FALLBACK IDEAS
  // ----------------------------
  const ideas = [
    {
      title: "The Market Has Feelings",
      murmur:
        "Crypto discourse oscillates between euphoria and despair without a shared emotional baseline.",
      quest:
        "Build a real-time emotional dashboard that translates crypto discourse into intuitive mood states.",
      value:
        "Gives builders narrative awareness without turning sentiment into trading signals.",
      difficulty: "Easy",
      sources: [
        {
          name: "X / Crypto Twitter",
          type: "twitter",
          url: "https://x.com/search?q=crypto%20sentiment"
        }
      ]
    },
    {
      title: "Crypto Urban Legends",
      murmur:
        "On-chain myths persist long after their origins are forgotten or misattributed.",
      quest:
        "Create a living, explorable archive of crypto myths, memes, and their true origins.",
      value:
        "Preserves cultural memory while reducing misinformation and repeated confusion.",
      difficulty: "Easy",
      sources: [
        {
          name: "Community Lore",
          type: "rss",
          url: "https://medium.com/tag/crypto"
        }
      ]
    },
    {
      title: "If Crypto Twitter Were a Person",
      murmur:
        "Collective crypto behavior often feels like a single, emotionally reactive personality.",
      quest:
        "Build an AI character that embodies crypto Twitter’s evolving persona.",
      value:
        "Turns chaotic discourse into something legible, playful, and self-reflective.",
      difficulty: "Medium",
      sources: [
        {
          name: "X / Crypto Twitter",
          type: "twitter",
          url: "https://x.com/search?q=crypto"
        }
      ]
    },
    {
      title: "On-Chain Weather Channel",
      murmur:
        "Network conditions are invisible to non-technical users until something breaks.",
      quest:
        "Visualize on-chain conditions like a weather forecast: congestion, volatility, calm.",
      value:
        "Improves intuition without dashboards or raw metrics.",
      difficulty: "Medium",
      sources: [
        {
          name: "GitHub Issues",
          type: "github",
          url: "https://github.com/ethereum"
        }
      ]
    },
    {
      title: "Build-A-Protocol Simulator",
      murmur:
        "Protocol design discussions assume systems intuition that most newcomers lack.",
      quest:
        "Create a sandbox that lets users experiment with protocol tradeoffs visually.",
      value:
        "Lowers the barrier to systems thinking and protocol literacy.",
      difficulty: "Hard",
      sources: [
        {
          name: "Protocol Docs",
          type: "github",
          url: "https://github.com/solana-labs/solana"
        }
      ]
    }
  ];

  // ----------------------------
  // SNAPSHOT (CRITICAL FIX)
  // ----------------------------
  const snapshot = {
    mode: "editorial",
    ideas
  };

  // Write snapshot
  await store.set("latest", JSON.stringify(snapshot));
  await store.set(`daily-${today}`, JSON.stringify(snapshot));

  return Response.json({
    status: "generated",
    date: today,
    count: ideas.length,
    mode: "editorial"
  });
};
