import { getStore } from "@netlify/blobs";

async function generateUniqueIdeas(date) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  if (!apiKey) {
    return generateFallbackIdeas(date);
  }

  const prompt = `Generate 5 compelling, specific builder side-quest ideas. Make them HUMAN and CONVERSATIONAL.

STYLE RULES:
- Titles are casual questions or observations (like "Why Is This So Expensive?" not "Cost Optimization Tool")
- Write like talking to a friend over coffee
- Be specific about real pain points
- Make each idea feel different in tone and scope
- Sound authentic, not like marketing copy

For each idea:
1. title: Conversational question/observation
2. murmur: What's broken, in casual language (1-2 sentences)
3. quest: What to build (1-2 sentences, specific)
4. worth: Array of 3 short benefits (each 3-8 words)
5. difficulty: Easy, Medium, or Hard

Cover diverse areas: UX problems, missing tools, confusing workflows, data gaps, etc.

Return ONLY valid JSON:
[
  {
    "title": "string",
    "murmur": "string",
    "quest": "string",
    "worth": ["string", "string", "string"],
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
        max_tokens: 3000,
        messages: [{ role: "user", content: prompt }]
      })
    });

    if (!response.ok) throw new Error('API failed');

    const data = await response.json();
    const textContent = data.content.find(c => c.type === 'text')?.text || '[]';
    const jsonMatch = textContent.match(/\[[\s\S]*\]/);
    const ideas = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

    return ideas.map(idea => ({
      ...idea,
      sources: [
        { type: "github", name: "GitHub", url: "https://github.com" },
        { type: "twitter", name: "X", url: "https://x.com" }
      ]
    }));

  } catch (error) {
    console.error('AI generation failed:', error);
    return generateFallbackIdeas(date);
  }
}

function generateFallbackIdeas(date) {
  const ideas = [
    {
      title: "What Actually Changed in This Upgrade?",
      murmur: "Protocol upgrades ship without clear changelogs, leaving developers to discover breaking changes through failures.",
      quest: "Build a tool that diffs contract upgrades and shows what functions changed, what got removed, and what's new—in plain English.",
      worth: [
        "Prevents surprise failures",
        "Makes upgrades transparent",
        "Interesting technical challenge"
      ],
      difficulty: "Hard",
      sources: [{ type: "github", name: "GitHub", url: "https://github.com" }]
    },
    {
      title: "Why Don't These NFTs Load Anymore?",
      murmur: "NFT metadata disappears when IPFS pins expire or servers go down, but nobody notices until holders complain.",
      quest: "Create a monitoring service that checks NFT metadata availability across IPFS and HTTP, alerting when assets become unreachable.",
      worth: [
        "Protects project reputation",
        "Prevents holder complaints",
        "Simple monitoring + alerts"
      ],
      difficulty: "Medium",
      sources: [{ type: "github", name: "GitHub", url: "https://github.com" }]
    },
    {
      title: "Can I Actually Afford This Transaction?",
      murmur: "Users see gas estimates but don't know if they'll change or if they're getting ripped off compared to others.",
      quest: "Build a gas price explainer that shows historical trends, percentile rankings, and suggests better times to transact.",
      worth: [
        "Reduces transaction anxiety",
        "Saves users real money",
        "Clean data visualization"
      ],
      difficulty: "Easy",
      sources: [{ type: "twitter", name: "X", url: "https://x.com" }]
    },
    {
      title: "Where Are All the Working Faucets?",
      murmur: "Testnet faucet links break constantly and nobody maintains a current list of what actually works.",
      quest: "Create a live directory of testnet faucets with uptime monitoring, rate limit info, and one-click requesting.",
      worth: [
        "Saves hours of googling",
        "Helps new developers instantly",
        "Super fast to build"
      ],
      difficulty: "Easy",
      sources: [{ type: "github", name: "GitHub", url: "https://github.com" }]
    },
    {
      title: "Did This Proposal Actually Pass?",
      murmur: "DAO voting results get scattered across Snapshot, forums, and Discord without a single source of truth.",
      quest: "Build a unified DAO decision tracker that shows proposal status, vote counts, and execution status across platforms.",
      worth: [
        "Makes governance transparent",
        "Reduces voter confusion",
        "Useful data aggregation practice"
      ],
      difficulty: "Medium",
      sources: [{ type: "rss", name: "Hackathons", url: "https://devpost.com" }]
    }
  ];

  return ideas;
}

export default async function handler() {
  const store = getStore({
    name: "tech-murmurs",
    siteID: process.env.NETLIFY_SITE_ID,
    token: process.env.NETLIFY_AUTH_TOKEN
  });

  const days = ["2026-01-23", "2026-01-24"];
  const seeded = [];

  for (const day of days) {
    const ideas = await generateUniqueIdeas(day);

    await store.set(
      `daily-${day}`,
      JSON.stringify({ date: day, mode: "editorial", ideas })
    );

    seeded.push(day);
  }

  return Response.json({ seeded });
}
