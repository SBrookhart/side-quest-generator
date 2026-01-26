import { getStore } from "@netlify/blobs";
import { getGitHubSignals } from "./github.js";
import { getHackathonSignals } from "./hackathons.js";
import { getTwitterSignals } from "./twitter.js";
import { getRoadmapSignals } from "./roadmaps.js";

const MAX_IDEAS = 5;

const generateIdeasWithAI = async (signals) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  if (!apiKey) {
    console.log("No API key - using fallback ideas");
    return generateFallbackIdeas();
  }

  const signalContext = signals.slice(0, 15).map(s => ({
    type: s.type,
    text: s.text?.slice(0, 250) || "",
    url: s.url
  }));

  const prompt = `You're analyzing real developer pain points from GitHub issues, hackathons, and builder conversations:

${JSON.stringify(signalContext, null, 2)}

Generate 5 compelling, specific side-quest ideas. Make them HUMAN and CONVERSATIONAL.

STYLE GUIDELINES:
- Titles should be conversational questions or observations (like "Why Is Gas So Confusing?" or "Can Someone Explain This Contract?")
- Write like you're talking to a friend, not writing marketing copy
- Be specific about the actual problem, not generic
- Make it feel like something you'd actually want to build
- Each idea should feel different in tone and scope

For each idea:
1. title: A casual, human question or observation (NOT corporate-sounding)
2. murmur: What's broken or missing, in plain English (1-2 casual sentences)
3. quest: What to actually build (1-2 sentences, concrete)
4. worth: Array of 3 short reasons why it's worth building (each 3-8 words)
5. difficulty: Easy, Medium, or Hard

Make them DIVERSE: UX fixes, data problems, workflow gaps, missing tools, confusing experiences.

Return ONLY valid JSON:
[
  {
    "title": "string",
    "murmur": "string",
    "quest": "string",
    "worth": ["string", "string", "string"],
    "difficulty": "Easy|Medium|Hard"
  }
]

Examples of good titles:
- "Why Does This Transaction Cost So Much?"
- "Where Did My NFT Metadata Go?"
- "Can I Test This Without Losing Real Money?"
- "Why Can't I See What Changed?"

BAD titles (too generic):
- "Blockchain Analytics Tool"
- "Smart Contract Optimizer"
- "DeFi Dashboard Solution"`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 3000,
        messages: [{
          role: "user",
          content: prompt
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const textContent = data.content.find(c => c.type === 'text')?.text || '[]';
    
    const jsonMatch = textContent.match(/\[[\s\S]*\]/);
    const ideas = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

    if (ideas.length === 0) {
      throw new Error("No ideas generated");
    }

    const sourcesByType = {};
    signals.forEach(s => {
      if (!sourcesByType[s.type]) {
        sourcesByType[s.type] = s;
      }
    });

    return ideas.map(idea => ({
      ...idea,
      sources: Object.values(sourcesByType).slice(0, 3).map(s => ({
  type: s.type,
  name: s.type === "github" ? "GitHub" : 
        s.type === "twitter" ? "X" :
        s.type === "rss" ? "Hackathons" : "Source",
  url: s.url
}))
    }));

  } catch (error) {
    console.error('AI generation failed:', error);
    return generateFallbackIdeas();
  }
};

const generateFallbackIdeas = () => {
  const ideas = [
    {
      title: "Why Can't I See What This Contract Actually Does?",
      murmur: "Smart contracts get verified on explorers, but reading raw Solidity doesn't tell you what the contract actually does in practice.",
      quest: "Build a tool that takes a verified contract address and generates a plain-English explanation of its functions, events, and what it's designed to do.",
      worth: [
        "No blockchain expertise needed to use it",
        "Makes contract exploration accessible",
        "Great portfolio piece for AI + web3"
      ],
      difficulty: "Medium",
      sources: [
        { type: "github", name: "GitHub", url: "https://github.com" },
        { type: "twitter", name: "X", url: "https://x.com" }
      ]
    },
    {
      title: "Where Did All My Testnet Tokens Go?",
      murmur: "Developers constantly run out of testnet tokens and waste time hunting for working faucets across different chains.",
      quest: "Create a unified testnet faucet finder that shows which faucets are live, their rate limits, and lets you request tokens from multiple chains in one place.",
      worth: [
        "Solves a daily developer annoyance",
        "Simple UI, immediate value",
        "Easy to build and ship fast"
      ],
      difficulty: "Easy",
      sources: [
        { type: "github", name: "GitHub", url: "https://github.com" },
        { type: "rss", name: "Hackathons", url: "https://devpost.com" }
      ]
    },
    {
      title: "Why Is This Transaction Going to Cost Me $50?",
      murmur: "Users approve transactions without understanding gas fees because wallets show numbers without context or comparison.",
      quest: "Build a browser extension that translates gas fees into relatable comparisons—cup of coffee, streaming subscription, or your average transaction cost.",
      worth: [
        "Reduces transaction anxiety instantly",
        "Makes gas fees actually understandable",
        "Light frontend work, big UX impact"
      ],
      difficulty: "Easy",
      sources: [
        { type: "github", name: "GitHub", url: "https://github.com" },
        { type: "twitter", name: "X", url: "https://x.com" }
      ]
    },
    {
      title: "Did My Transaction Actually Go Through?",
      murmur: "Pending transactions create anxiety because you can't tell if something's stuck, failed, or just slow.",
      quest: "Create a transaction tracker that shows clear status updates, estimated wait times, and what to do if something's actually stuck.",
      worth: [
        "Turns confusion into clarity",
        "Useful for every web3 user",
        "Simple data fetching + good UX"
      ],
      difficulty: "Medium",
      sources: [
        { type: "github", name: "GitHub", url: "https://github.com" },
        { type: "twitter", name: "X", url: "https://x.com" }
      ]
    },
    {
      title: "Why Can't I Find Past Governance Votes?",
      murmur: "DAO voting history gets buried in forums and Discord threads, making it impossible to see how delegates actually voted on proposals.",
      quest: "Build a governance vote tracker that shows delegate voting history in one place—who voted, how they voted, participation rates.",
      worth: [
        "Makes DAOs more transparent",
        "Helps voters hold delegates accountable",
        "Interesting data visualization challenge"
      ],
      difficulty: "Hard",
      sources: [
        { type: "github", name: "GitHub", url: "https://github.com" },
        { type: "rss", name: "Hackathons", url: "https://devpost.com" }
      ]
    }
  ];

  return ideas.sort(() => Math.random() - 0.5).slice(0, MAX_IDEAS);
};

export default async () => {
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

  let signals = [];

  try {
    const results = await Promise.allSettled([
      getGitHubSignals(),
      getHackathonSignals(),
      getTwitterSignals(),
      getRoadmapSignals()
    ]);

    results.forEach(r => {
      if (r.status === "fulfilled") signals.push(...r.value);
    });
  } catch (e) {
    console.error("Signal gathering error:", e);
  }

  console.log(`Collected ${signals.length} signals`);

  const ideas = await generateIdeasWithAI(signals);

  while (ideas.length < MAX_IDEAS) {
    ideas.push(generateFallbackIdeas()[0]);
  }

  const today = new Date().toISOString().slice(0, 10);
  const payload = { 
    mode: signals.length > 0 ? "live" : "fallback",
    date: today, 
    ideas: ideas.slice(0, MAX_IDEAS)
  };

  await store.set("latest", JSON.stringify(payload));
  await store.set(`daily-${today}`, JSON.stringify(payload));

  return Response.json(payload);
};
