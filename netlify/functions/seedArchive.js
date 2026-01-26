// netlify/functions/seedArchive.js

import { getStore } from "@netlify/blobs";

export async function handler() {
  const store = getStore({ name: "tech-murmurs" });

  const days = [
    {
      date: "2026-01-23",
      mode: "editorial",
      ideas: [
        {
          title: "The Market Has Feelings",
          murmur:
            "Crypto discourse swings wildly between euphoria and despair, but builders lack a way to track sentiment without trading.",
          quest:
            "Build a lightweight emotional dashboard that visualizes crypto sentiment without price data.",
          value:
            "Turns narrative chaos into intuition instead of speculation.",
          difficulty: "Easy",
          sources: [
            { type: "github", name: "GitHub", url: "https://github.com" }
          ]
        },
        {
          title: "Crypto Urban Legends",
          murmur:
            "Myths and half-truths persist on-chain with no clear origin or attribution.",
          quest:
            "Create a living archive of crypto myths, memes, and their provenance.",
          value:
            "Preserves cultural memory and reduces misinformation.",
          difficulty: "Easy",
          sources: [
            { type: "github", name: "GitHub", url: "https://github.com" }
          ]
        },
        {
          title: "If Crypto Twitter Were a Person",
          murmur:
            "Collective behavior often feels like a single personality, but it’s hard to articulate.",
          quest:
            "Build an AI persona that reflects the mood of crypto discourse.",
          value:
            "Makes abstract sentiment playful and interpretable.",
          difficulty: "Medium",
          sources: [
            { type: "x", name: "X", url: "https://x.com" }
          ]
        },
        {
          title: "On-Chain Weather Channel",
          murmur:
            "Network conditions are unintuitive for non-technical builders.",
          quest:
            "Visualize on-chain activity like a weather forecast.",
          value:
            "Improves comprehension without dashboards.",
          difficulty: "Medium",
          sources: [
            { type: "roadmap", name: "Protocol Updates", url: "https://github.com" }
          ]
        },
        {
          title: "Build-A-Protocol Simulator",
          murmur:
            "Protocol design tradeoffs are invisible to newcomers.",
          quest:
            "Create a sandbox for simulating protocol decisions.",
          value:
            "Lowers the barrier to systems thinking.",
          difficulty: "Hard",
          sources: [
            { type: "roadmap", name: "Protocol Roadmaps", url: "https://github.com" }
          ]
        }
      ]
    },
    {
      date: "2026-01-24",
      mode: "editorial",
      ideas: [
        {
          title: "Narrative Gravity Map",
          murmur:
            "Some ideas pull disproportionate attention without clear reasons.",
          quest:
            "Map narrative gravity across crypto discourse.",
          value:
            "Shows why some ideas stick.",
          difficulty: "Medium",
          sources: [
            { type: "x", name: "X", url: "https://x.com" }
          ]
        },
        {
          title: "What Broke Overnight?",
          murmur:
            "Failures surface slowly and across scattered channels.",
          quest:
            "Detect early signals of overnight breakage.",
          value:
            "Gives builders early warning.",
          difficulty: "Easy",
          sources: [
            { type: "github", name: "GitHub", url: "https://github.com" }
          ]
        },
        {
          title: "DAO Decision Explainer",
          murmur:
            "Governance outcomes are hard to parse for outsiders.",
          quest:
            "Translate DAO proposals into clear outcomes.",
          value:
            "Reduces governance fatigue.",
          difficulty: "Easy",
          sources: [
            { type: "github", name: "GitHub", url: "https://github.com" }
          ]
        },
        {
          title: "Speculation vs Reality",
          murmur:
            "Rumors outpace confirmed information.",
          quest:
            "Separate speculation from verified signals.",
          value:
            "Improves discourse quality.",
          difficulty: "Medium",
          sources: [
            { type: "x", name: "X", url: "https://x.com" }
          ]
        },
        {
          title: "Protocol Changelog Digest",
          murmur:
            "Important updates are buried in long release notes.",
          quest:
            "Summarize breaking protocol changes across ecosystems.",
          value:
            "Prevents surprises.",
          difficulty: "Hard",
          sources: [
            { type: "roadmap", name: "Releases", url: "https://github.com" }
          ]
        }
      ]
    }
  ];

  for (const day of days) {
    await store.set(`daily-${day.date}`, JSON.stringify(day));
  }

  return new Response(
    JSON.stringify({ status: "ok", seeded: days.map(d => d.date) }),
    { status: 200 }
  );
}
