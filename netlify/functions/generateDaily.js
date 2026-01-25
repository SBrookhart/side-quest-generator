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

  let signals = [];
  let sources = new Set();

  try {
    const g = await getGithubSignals();
    if (g.length) {
      signals.push(...g);
      sources.add("github");
    }
  } catch {}

  try {
    const t = await getTwitterSignals();
    if (t.length) {
      signals.push(...t);
      sources.add("x");
    }
  } catch {}

  try {
    const h = await getHackathonSignals();
    if (h.length) {
      signals.push(...h);
      sources.add("hackathons");
    }
  } catch {}

  try {
    const r = await getRoadmapSignals();
    if (r.length) {
      signals.push(...r);
      sources.add("roadmaps");
    }
  } catch {}

  const ideas = synthesizeEditorialIdeas(signals);

  await store.set("latest", JSON.stringify(ideas));
  await store.set(`archive:${today}`, JSON.stringify(ideas));

  return Response.json({
    status: "published",
    mode: "editorial",
    signalsUsed: Array.from(sources)
  });
};

function synthesizeEditorialIdeas(signals) {
  return [
    {
      title: "The Market Has Feelings",
      murmur:
        "Crypto discourse swings emotionally, but sentiment is never captured coherently.",
      sideQuest:
        "Build a dashboard that translates social + on-chain activity into emotional states.",
      worthIt:
        "Emotion often leads markets before metrics do.",
      difficulty: "Easy",
      signals: signals.slice(0, 3)
    },
    {
      title: "Crypto Urban Legends",
      murmur:
        "The same myths resurface every cycle, slightly altered.",
      sideQuest:
        "Create a living archive of recurring crypto myths and where they came from.",
      worthIt:
        "Understanding narrative repetition prevents wasted effort.",
      difficulty: "Medium",
      signals: signals.slice(3, 6)
    },
    {
      title: "On-Chain Weather Channel",
      murmur:
        "People feel market conditions but lack shared metaphors.",
      sideQuest:
        "Translate on-chain metrics into simple weather-style signals.",
      worthIt:
        "Abstraction makes complex systems approachable.",
      difficulty: "Medium",
      signals: signals.slice(6, 9)
    },
    {
      title: "Build-A-Protocol",
      murmur:
        "Builders want to experiment without production risk.",
      sideQuest:
        "Create a sandbox for assembling hypothetical protocols.",
      worthIt:
        "Play accelerates learning.",
      difficulty: "Hard",
      signals: signals.slice(0, 2)
    },
    {
      title: "If Crypto Twitter Were a Person",
      murmur:
        "Collective behavior often resembles personality traits.",
      sideQuest:
        "Model crypto discourse as a single evolving character.",
      worthIt:
        "Patterns emerge when systems are personified.",
      difficulty: "Easy",
      signals: signals.slice(2, 5)
    }
  ];
}
