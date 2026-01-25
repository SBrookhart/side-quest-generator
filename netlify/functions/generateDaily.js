import { getStore } from "@netlify/blobs";

export default async (req) => {
  const siteID = process.env.NETLIFY_SITE_ID;
  const token = process.env.NETLIFY_AUTH_TOKEN;

  if (!siteID || !token) {
    return Response.json({ error: "Missing siteID or token" }, { status: 500 });
  }

  const store = getStore({
    name: "tech-murmurs",
    siteID,
    token
  });

  const today = new Date().toISOString().slice(0,10);
  const force = new URL(req.url).searchParams.get("force") === "true";

  if (!force) {
    const existing = await store.get(`daily-${today}`);
    if (existing) {
      return Response.json({ status:"already-generated", date:today });
    }
  }

  let ideas = [];

  try {
    // Placeholder for live ingestion synthesis
    ideas = [];
  } catch {
    ideas = [];
  }

  if (ideas.length < 5) {
    ideas = [
      {
        title:"The Market Has Feelings",
        murmur:"Crypto discourse oscillates between euphoria and despair.",
        sideQuest:"Build a real-time emotional dashboard of crypto Twitter.",
        worthIt:"Provides intuition for narrative momentum without trading.",
        difficulty:"Easy",
        mode:"editorial"
      },
      {
        title:"Crypto Urban Legends",
        murmur:"On-chain myths persist without attribution or provenance.",
        sideQuest:"Create a living museum of crypto myths and memes.",
        worthIt:"Preserves cultural memory and reduces misinformation.",
        difficulty:"Easy",
        mode:"editorial"
      },
      {
        title:"If Crypto Twitter Were a Person",
        murmur:"Collective behavior often feels like a single personality.",
        sideQuest:"Build an AI character powered by live crypto discourse.",
        worthIt:"Turns sentiment into something legible and playful.",
        difficulty:"Medium",
        mode:"editorial"
      },
      {
        title:"On-Chain Weather Channel",
        murmur:"Network conditions are unintuitive to non-technical users.",
        sideQuest:"Visualize on-chain activity like a weather forecast.",
        worthIt:"Improves comprehension without dashboards.",
        difficulty:"Medium",
        mode:"editorial"
      },
      {
        title:"Build-A-Protocol Simulator",
        murmur:"Protocol design is opaque to newcomers.",
        sideQuest:"Create a sandbox for simulating protocol tradeoffs.",
        worthIt:"Lowers the barrier to systems thinking.",
        difficulty:"Hard",
        mode:"editorial"
      }
    ];
  }

  await store.set("latest", JSON.stringify(ideas));
  await store.set(`daily-${today}`, JSON.stringify(ideas));

  return Response.json({
    status:"generated",
    date:today,
    count:ideas.length,
    mode:"editorial"
  });
};
