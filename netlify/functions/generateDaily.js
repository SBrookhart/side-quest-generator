import { getStore } from "@netlify/blobs";
import { getGitHubSignals } from "./github.js";
import { getHackathonSignals } from "./hackathons.js";
import { getTwitterSignals } from "./twitter.js";
import { getRoadmapSignals } from "./roadmaps.js";

const MAX_IDEAS = 5;

async function generateIdeasWithAI(signals) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  if (!apiKey) {
    console.log("No API key - using fallback ideas");
    return generateFallbackIdeas();
  }

  // Prepare context from signals
  const signalContext = signals.slice(0, 10).map(s => ({
    type: s.type,
    text: s.text?.slice(0, 200) || "",
    url: s.url
  }));

  const prompt = `You are analyzing real signals from the developer ecosystem. Based on these actual signals from GitHub issues, hackathons, and developer discussions:

${JSON.stringify(signalContext, null, 2)}

Generate 5 unique, compelling side quest ideas for builders. Each should:
- Address a real pain point suggested by the signals above
- Be specific and actionable (not generic)
- Vary in scope and difficulty
- Feel fresh and authentic to current builder needs

For each idea, provide:
1. title: A specific, catchy name (NOT "Unclaimed Builder Opportunity")
2. murmur: Why this friction exists (2 sentences, reference real context)
3. quest: What to build (1-2 sentences, concrete and scoped)
4. value: Why it's worth building (1-2 sentences)
5. difficulty: Easy, Medium, or Hard

Make them diverse across: tooling, UX, infrastructure, data, workflows, etc.

Return ONLY valid JSON in this exact format:
[
  {
    "title": "string",
    "murmur": "string",
    "quest": "string",
    "value": "string",
    "difficulty": "Easy|Medium|Hard"
  }
]`;

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
        max_tokens: 2500,
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
    
    // Extract JSON from response
    const jsonMatch = textContent.match(/\[[\s\S]*\]/);
    const ideas = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

    if (ideas.length === 0) {
      throw new Error("No ideas generated");
    }

    // Map signals to sources for attribution
    const sourcesByType = {};
    signals.forEach(s => {
      if (!sourcesByType[s.type]) {
        sourcesByType[s.type] = s;
      }
    });

    // Add sources to each idea
    return ideas.map(idea => ({
      ...idea,
      sources: Object.values(sourcesByType).slice(0, 3).map(s => ({
        type: s.type,
        name: s.type === "github" ? "GitHub Issues" : 
              s.type === "twitter" ? "Developer Twitter" :
              s.type === "rss" ? "Hackathon Feed" : "Source",
        url: s.url
      }))
    }));

  } catch (error) {
    console.error('AI generation failed:', error);
    return generateFallbackIdeas();
  }
}

function generateFallbackIdeas() {
  // Diverse fallback ideas
  const fallbacks = [
    {
      title: "Transaction Anxiety Reducer",
      murmur: "Users panic at the moment of signing because gas fees and outcomes feel unpredictable. Wallets show numbers without context or reassurance.",
      quest: "Build a browser extension that provides contextual transaction previews—gas fee comparisons, risk scores, and what will actually change on-chain.",
      value: "Reduces fear and abandoned transactions. Builds confidence through clarity.",
      difficulty: "Medium",
      sources: [{ type: "github", name: "Wallet UX Issues", url: "https://github.com" }]
    },
    {
      title: "Cross-Chain Event Aggregator",
      murmur: "Developers manually check multiple block explorers to track events across chains. There's no unified timeline for multi-chain applications.",
      quest: "Create a developer dashboard that aggregates events from multiple chains into a single timeline, with filtering, search, and webhook support.",
      value: "Saves hours of manual block explorer checking. Makes multi-chain debugging bearable.",
      difficulty: "Hard",
      sources: [{ type: "github", name: "Dev Tools", url: "https://github.com" }]
    },
    {
      title: "Smart Contract Changelog Generator",
      murmur: "Protocol upgrades happen without clear communication of what changed. Users and developers discover breaking changes through failures.",
      quest: "Build a tool that diffs smart contract bytecode and generates human-readable changelogs highlighting new functions, removed features, and parameter changes.",
      value: "Prevents surprise failures. Creates transparency in upgrade processes.",
      difficulty: "Hard",
      sources: [{ type: "github", name: "Protocol Governance", url: "https://github.com" }]
    },
    {
      title: "Testnet Fund Recycler",
      murmur: "Testnet tokens sit idle in abandoned wallets while new developers struggle to get enough for testing. Faucets rate-limit aggressively.",
      quest: "Create a service that detects inactive testnet wallets and automatically recycles their tokens back to a community faucet with higher limits.",
      value: "Improves testnet token availability. Reduces friction for new developers.",
      difficulty: "Medium",
      sources: [{ type: "github", name: "Developer Experience", url: "https://github.com" }]
    },
    {
      title: "DAO Proposal Impact Simulator",
      murmur: "Voters approve proposals without understanding their actual impact on treasury, permissions, or protocol behavior.",
      quest: "Build a simulation tool that runs DAO proposals against a fork of current state and shows predicted outcomes—fund flows, permission changes, risk analysis.",
      value: "Enables informed voting. Prevents catastrophic governance mistakes.",
      difficulty: "Hard",
      sources: [{ type: "rss", name: "Governance Discussion", url: "https://github.com" }]
    }
  ];

  // Randomize and return 5
  return fallbacks
    .sort(() => Math.random() - 0.5)
    .slice(0, MAX_IDEAS);
}

/* ---------- handler ---------- */

export default async function handler(req) {
  const store = getStore({
    name: "tech-murmurs",
    siteID: process.env.NETLIFY_SITE_ID,
    token: process.env.NETLIFY_AUTH_TOKEN
  });

  let signals = [];

  // Gather signals from all sources
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

  // Generate ideas using AI based on signals
  const ideas = await generateIdeasWithAI(signals);

  // Ensure we have exactly MAX_IDEAS
  while (ideas.length < MAX_IDEAS) {
    ideas.push(generateFallbackIdeas()[0]);
  }

  const today = new Date().toISOString().slice(0, 10);
  const payload = { 
    mode: signals.length > 0 ? "live" : "fallback",
    date: today, 
    ideas: ideas.slice(0, MAX_IDEAS)
  };

  // Save to blob storage
  await store.set("latest", JSON.stringify(payload));
  await store.set(`daily-${today}`, JSON.stringify(payload));

  return Response.json(payload);
}
