import { getStore } from "@netlify/blobs";
import { getGithubSignals } from "./github.js";

/**
 * Convert a GitHub signal into a Tech Murmurs side quest
 * Editorial framing, vibe-coder friendly, non-destructive
 */
function synthesizeGithubIdea(signal) {
  return {
    title: signal.title.slice(0, 80),

    murmur:
      "A recurring developer pain point surfaced in an open-source issue, suggesting friction that hasn’t been resolved upstream.",

    quest:
      "Build a lightweight, human-friendly layer that addresses the core confusion or missing abstraction described in the issue — without requiring changes to the upstream project.",

    value:
      "Turns an isolated developer complaint into a reusable pattern or tool that lowers friction for others encountering the same problem.",

    difficulty: "Medium",

    sources: [
      {
        type: "github",
        name: "GitHub Issue",
        url: signal.url
      }
    ]
  };
}

export default async function generateDaily(req) {
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
  const force =
    new URL(req.url).searchParams.get("force") === "true";

  // Prevent duplicate generation unless forced
  if (!force) {
    const existing = await store.get(`daily-${today}`);
    if (existing) {
      return Response.json({
        status: "already-generated",
        date: today
      });
    }
  }

  /**
   * 1. Editorial baseline (ALWAYS present)
   */
  const editorialIdeas = [
    {
      title: "The Market Has Feelings",
      murmur:
        "Crypto discourse oscillates between euphoria and despair, but that emotional movement is rarely made legible.",
      quest:
        "Build a real-time emotional dashboard that translates crypto discourse into a simple, human-readable mood index.",
      value:
        "Helps builders and observers sense narrative momentum without trading or staring at price charts.",
      difficulty: "Easy",
      sources: []
    },
    {
      title: "Crypto Urban Legends",
      murmur:
        "On-chain myths and memes persist long after their origins are forgotten or misattributed.",
      quest:
        "Create a living, annotated museum of crypto myths, memes, and lore with sources and timelines.",
      value:
        "Preserves cultural memory while reducing misinformation and folklore drift.",
      difficulty: "Easy",
      sources: []
    },
    {
      title: "If Crypto Twitter Were a Person",
      murmur:
        "Collective behavior on crypto Twitter often feels like a single, volatile personality.",
      quest:
        "Build an AI character that embodies crypto Twitter’s collective voice using live discourse.",
      value:
        "Turns chaotic sentiment into something legible, playful, and introspective.",
      difficulty: "Medium",
      sources: []
    },
    {
      title: "On-Chain Weather Channel",
      murmur:
        "Network conditions are difficult for non-technical users to intuit in real time.",
      quest:
        "Visualize on-chain activity like a weather forecast — congestion, calm, storms, and pressure fronts.",
      value:
        "Improves comprehension of network conditions without dashboards or jargon.",
      difficulty: "Medium",
      sources: []
    },
    {
      title: "Build-A-Protocol Simulator",
      murmur:
        "Protocol design is opaque and intimidating to newcomers.",
      quest:
        "Create a sandbox that lets users simulate protocol tradeoffs and design decisions visually.",
      value:
        "Lowers the barrier to systems thinking and protocol literacy.",
      difficulty: "Hard",
      sources: []
    }
  ];

  /**
   * 2. Controlled GitHub augmentation (OPTION B)
   * Append at most ONE synthesized GitHub idea
   */
  try {
    const githubSignals = await getGithubSignals();

    if (githubSignals.length > 0) {
      const bestSignal = githubSignals[0];
      const githubIdea = synthesizeGithubIdea(bestSignal);
      editorialIdeas.push(githubIdea);
    }
  } catch (err) {
    // Silent failure — editorial mode remains intact
  }

  /**
   * 3. Final snapshot (HARD CAP at 5)
   */
  const snapshot = {
    mode: "editorial",
    ideas: editorialIdeas.slice(0, 5)
  };

  await store.set("latest", JSON.stringify(snapshot));
  await store.set(`daily-${today}`, JSON.stringify(snapshot));

  return Response.json({
    status: "generated",
    date: today,
    count: snapshot.ideas.length,
    mode: snapshot.mode
  });
}
