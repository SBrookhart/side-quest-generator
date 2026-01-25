import { getStore } from "@netlify/blobs";

// IMPORT DEFAULT EXPORTS (THIS IS THE KEY FIX)
import getGithubSignals from "./github.js";
import getTwitterSignals from "./twitter.js";
import getHackathonSignals from "./hackathon.js";
import getRoadmapSignals from "./roadmaps.js";

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

  // ---------- Ingest live signals (best effort) ----------
  let signals = [];
  let signalSources = new Set();

  try {
    const github = await getGithubSignals();
    if (Array.isArray(github) && github.length) {
      signals.push(...github);
      signalSources.add("github");
    }
  } catch {}

  try {
    const twitter = await getTwitterSignals();
    if (Array.isArray(twitter) && twitter.length) {
      signals.push(...twitter);
      signalSources.add("x");
    }
  } catch {}

  try {
    const hacks = await getHackathonSignals();
    if (Array.isArray(hacks) && hacks.length) {
      signals.push(...hacks);
      signalSources.add("hackathons");
    }
  } catch {}

  try {
    const roadmaps = await getRoadmapSignals();
    if (Array.isArray(roadmaps) && roadmaps.length) {
      signals.push(...roadmaps);
      signalSources.add("roadmaps");
    }
  } catch {}

  // ---------- Editorial-first synthesis (ALWAYS RUNS) ----------
  const ideas = synthesizeEditorialIdeas(signals);

  await store.set("latest", JSON.stringify(ideas));
  await store.set(`archive:${today}`, JSON.stringify(ideas));

  return Response.json({
    status: "published",
    mode: "editorial",
    date: today,
    signalsUsed: Array.from(signalSources)
  });
};

// ---------------------------------------------------------

function synthesizeEditorialIdeas(signals) {
  return [
    {
      title: "The Market Has Feelings",
      murmur:
        "Crypto conversations swing wildly between euphoria and despair, but emotional momentum is never tracked explicitly.",
      sideQuest:
        "Build a lightweight dashboard that visualizes emotional shifts in crypto discourse over time.",
      worthIt:
        "Understanding emotional context helps builders know when people are receptive, not just what they’re saying.",
      difficulty: "Easy",
      signals: pickSignals(signals, ["x", "articles"])
    },
    {
      title: "Crypto Urban Legends",
      murmur:
        "The same half-true crypto myths resurface every cycle, slightly mutated.",
      sideQuest:
        "Create a living archive of recurring crypto myths, where they originated, and how they evolved.",
      worthIt:
        "Mapping narrative repetition helps builders avoid solving imaginary problems.",
      difficulty: "Medium",
      signals: pickSignals(signals, ["x", "github"])
    },
    {
      title: "On-Chain Weather Channel",
      murmur:
        "Users intuitively feel market ‘weather’ but lack shared language to describe conditions.",
      sideQuest:
        "Translate on-chain and social activity into simple, human-readable weather metaphors.",
      worthIt:
        "Abstraction lowers intimidation and invites non-technical users into complex systems.",
      difficulty: "Medium",
      signals: pickSignals(signals, ["github", "x"])
    },
    {
      title: "Build-A-Protocol",
      murmur:
        "Many builders want to experiment with protocol design without committing to production code.",
      sideQuest:
        "Create a sandbox that lets users assemble hypothetical protocols from modular components.",
      worthIt:
        "Playgrounds accelerate learning without the cost of failure.",
      difficulty: "Hard",
      signals: pickSignals(signals, ["hackathons", "roadmaps"])
    },
    {
      title: "If Crypto Twitter Were a Person",
      murmur:
        "Collective online behavior often mirrors personality traits.",
      sideQuest:
        "Model crypto discourse as a single evolving character with moods and quirks.",
      worthIt:
        "Personification reveals patterns that raw analytics hide.",
      difficulty: "Easy",
      signals: pickSignals(signals, ["x"])
    }
  ];
}

function pickSignals(signals, preferredTypes) {
  return signals
    .filter(s => preferredTypes.includes(s.type))
    .slice(0, 3);
}
