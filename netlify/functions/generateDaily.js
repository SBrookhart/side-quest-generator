import { getStore } from "@netlify/blobs";
import { getGithubSignals } from "./github.js";
import { getTwitterSignals } from "./twitter.js";
import { getHackathonSignals } from "./hackathon.js";
import { getRoadmapSignals } from "./roadmaps.js";

export default async () => {
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

  const today = new Date().toISOString().slice(0, 10);

  // --- Attempt live signal ingestion (best effort) ---
  let signals = [];
  let signalSources = [];

  try {
    const github = await getGithubSignals();
    if (github.length) {
      signals.push(...github);
      signalSources.push("github");
    }
  } catch {}

  try {
    const twitter = await getTwitterSignals();
    if (twitter.length) {
      signals.push(...twitter);
      signalSources.push("x");
    }
  } catch {}

  try {
    const hacks = await getHackathonSignals();
    if (hacks.length) {
      signals.push(...hacks);
      signalSources.push("hackathons");
    }
  } catch {}

  try {
    const roadmaps = await getRoadmapSignals();
    if (roadmaps.length) {
      signals.push(...roadmaps);
      signalSources.push("roadmaps");
    }
  } catch {}

  // --- Editorial synthesis (ALWAYS RUNS) ---
  const ideas = synthesizeEditorialIdeas(signals);

  const payload = {
    date: today,
    mode: "editorial",
    signalsUsed: [...new Set(signalSources)],
    ideas
  };

  await store.set("latest", JSON.stringify(ideas));
  await store.set(`archive:${today}`, JSON.stringify(ideas));

  return Response.json({
    status: "published",
    mode: "editorial",
    date: today,
    signalsUsed: payload.signalsUsed
  });
};

// -----------------------------

function synthesizeEditorialIdeas(signals) {
  // This is intentionally editorial-first.
  // Signals inspire ideas, they do not gate them.

  const baseIdeas = [
    {
      title: "The Market Has Feelings",
      murmur: "Crypto conversations oscillate wildly between euphoria and despair, but no one tracks emotional momentum explicitly.",
      sideQuest: "Build a lightweight dashboard that visualizes emotional shifts in crypto discourse over time.",
      worthIt: "Emotional context helps builders and creators understand *when* people are receptive, not just *what* they say.",
      difficulty: "Easy",
      signals: pickSignals(signals, ["x", "articles"])
    },
    {
      title: "Crypto Urban Legends",
      murmur: "The same myths and half-truths about crypto resurface every cycle, slightly mutated.",
      sideQuest: "Create a living archive of recurring crypto myths, where they originated, and how they evolved.",
      worthIt: "Understanding narrative repetition helps builders avoid solving imaginary problems.",
      difficulty: "Medium",
      signals: pickSignals(signals, ["x", "github"])
    },
    {
      title: "On-Chain Weather Channel",
      murmur: "Users feel market ‘weather’ intuitively but lack shared language to describe conditions.",
      sideQuest: "Translate on-chain and social activity into simple weather metaphors.",
      worthIt: "Abstraction lowers intimidation and invites non-technical users into complex systems.",
      difficulty: "Medium",
      signals: pickSignals(signals, ["github", "x"])
    },
    {
      title: "Build-A-Protocol",
      murmur: "Many builders want to experiment with protocol design without committing to production code.",
      sideQuest: "Create a sandbox that lets users assemble hypothetical protocols from modular components.",
      worthIt: "Playgrounds accelerate learning without the cost of failure.",
      difficulty: "Hard",
      signals: pickSignals(signals, ["hackathons", "roadmaps"])
    },
    {
      title: "If Crypto Twitter Were a Person",
      murmur: "Collective behavior online often mirrors personality traits.",
      sideQuest: "Model crypto discourse as a single evolving character with moods and quirks.",
      worthIt: "Personification reveals patterns that raw analytics hide.",
      difficulty: "Easy",
      signals: pickSignals(signals, ["x"])
    }
  ];

  return baseIdeas;
}

function pickSignals(signals, preferredTypes) {
  return signals
    .filter(s => preferredTypes.includes(s.type))
    .slice(0, 3);
}
