import { getStore } from "@netlify/blobs";
import { getGithubSignals } from "./github.js";
import { getRoadmapSignals } from "./roadmaps.js";

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
  let mode = "live";

  /* ------------------------------------------
     STEP 1: GITHUB SIGNALS → IDEAS
  ------------------------------------------ */

  try {
    const githubSignals = await getGithubSignals();

    for (const signal of githubSignals.slice(0, 3)) {
      ideas.push({
        title: "A Tool Someone Clearly Needs",
        murmur: signal.text.slice(0, 280),
        quest: "Build a small tool or interface that directly addresses this pain point.",
        value: "Solves a real problem someone has already articulated publicly.",
        difficulty: "Medium",
        sources: [
          {
            type: "github",
            name: "GitHub Issue",
            url: signal.url
          }
        ]
      });
    }
  } catch {
    // silently fail
  }

  /* ------------------------------------------
     STEP 2: ROADMAPS → ONE CURATED IDEA MAX
  ------------------------------------------ */

  try {
    const roadmapSignals = await getRoadmapSignals();

    const highSignal = roadmapSignals.find(r =>
      /enable|breaking|fork|upgrade|migration/i.test(r.text)
    );

    if (highSignal) {
      ideas.push({
        title: "What Actually Changed?",
        murmur:
          "Protocol upgrades ship frequently, but most builders don’t understand what actually changed or why it matters.",
        quest:
          "Build a plain-English explainer that translates protocol release notes into practical implications.",
        value:
          "Helps builders adapt faster without reading thousands of words of release notes.",
        difficulty: "Easy",
        sources: [
          {
            type: "github",
            name: "Protocol Release",
            url: highSignal.url
          }
        ]
      });
    }
  } catch {
    // ignore roadmap failures
  }

  /* ------------------------------------------
     STEP 3: EDITORIAL FALLBACK (LOCKED)
  ------------------------------------------ */

  if (ideas.length < 5) {
    mode = "editorial";

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

  /* ------------------------------------------
     STEP 4: WRITE SNAPSHOT (LOCKED FORMAT)
  ------------------------------------------ */

  const snapshot = {
    date: today,
    mode,
    ideas: ideas.slice(0, 5)
  };

  await store.set("latest", JSON.stringify(snapshot));
  await store.set(`daily-${today}`, JSON.stringify(snapshot));

  return Response.json({
    status: "generated",
    date: today,
    count: snapshot.ideas.length,
    mode: snapshot.mode
  });
};
