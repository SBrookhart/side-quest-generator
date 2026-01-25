import { getStore } from "@netlify/blobs";
import { getGithubSignals } from "./github.js";
import { getTwitterSignals } from "./twitter.js";

/* ---------- Synthesizers ---------- */

function synthesizeGithubIdea(signal) {
  return {
    title: signal.title.slice(0, 80),

    murmur:
      "A developer surfaced a concrete pain point in an open-source issue that hasn’t been resolved upstream.",

    quest:
      "Build a lightweight abstraction, explainer, or helper tool that resolves the confusion described — without modifying the core project.",

    value:
      "Turns an isolated complaint into a reusable fix that saves future developers time and frustration.",

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

function synthesizeTwitterIdea(signal) {
  return {
    title: signal.text.slice(0, 60).replace(/\n/g, "") + "…",

    murmur:
      "A builder publicly articulated a missing tool or workflow — not as a roadmap, but as frustration.",

    quest:
      "Build a small, opinionated prototype that directly answers the unmet need expressed in the post.",

    value:
      "Captures intent before it hardens into products, thinkpieces, or VC decks.",

    difficulty: "Easy",

    sources: [
      {
        type: "twitter",
        name: "X Post",
        url: signal.url
      }
    ]
  };
}

/* ---------- Generator ---------- */

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

  if (!force) {
    const existing = await store.get(`daily-${today}`);
    if (existing) {
      return Response.json({
        status: "already-generated",
        date: today
      });
    }
  }

  /* ---------- Editorial Baseline ---------- */

  let ideas = [
    {
      title: "The Market Has Feelings",
      murmur:
        "Crypto discourse oscillates between euphoria and despair, but that emotional movement is rarely made legible.",
      quest:
        "Build a real-time emotional dashboard that translates crypto discourse into a simple mood index.",
      value:
        "Helps people sense narrative momentum without staring at prices.",
      difficulty: "Easy",
      sources: []
    },
    {
      title: "Crypto Urban Legends",
      murmur:
        "On-chain myths persist long after their origins are forgotten.",
      quest:
        "Create a living, annotated museum of crypto myths and memes.",
      value:
        "Preserves cultural memory while reducing misinformation.",
      difficulty: "Easy",
      sources: []
    },
    {
      title: "If Crypto Twitter Were a Person",
      murmur:
        "Collective behavior often feels like a single volatile personality.",
      quest:
        "Build an AI character powered by live crypto discourse.",
      value:
        "Turns chaotic sentiment into something legible and playful.",
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

  /* ---------- Controlled Augmentation ---------- */

  try {
    const githubSignals = await getGithubSignals();
    const strongGithub = githubSignals.find(
      s => (s.text || "").length > 300
    );

    if (strongGithub) {
      ideas.push(synthesizeGithubIdea(strongGithub));
    }
  } catch {}

  try {
    const twitterSignals = await getTwitterSignals();
    const strongTweet = twitterSignals.find(
      t => t.text.length > 80
    );

    if (strongTweet) {
      ideas.push(synthesizeTwitterIdea(strongTweet));
    }
  } catch {}

  /* ---------- Final Snapshot ---------- */

  const snapshot = {
    mode: "editorial",
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
}
