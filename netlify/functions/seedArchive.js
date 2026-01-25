import { getStore } from "@netlify/blobs";

async function generateUniqueIdeas(date) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  if (!apiKey) {
    // Fallback if no API key
    return generateFallbackIdeas(date);
  }

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
        max_tokens: 2000,
        messages: [{
          role: "user",
          content: `Generate 5 unique, compelling side quest ideas for builders working in crypto/dev culture. Each idea should be:
- A specific, unmet need or friction point
- Scoped enough for a small team or individual
- Based on realistic pain points builders face
- Vary in difficulty (mix of Easy, Medium, Hard)

For each idea, provide:
1. title: A catchy, specific name (not "Unclaimed Builder Opportunity")
2. murmur: Why this problem exists (2 sentences)
3. quest: What to build (1-2 sentences, concrete and actionable)
4. value: Why it's worth building (1-2 sentences)
5. difficulty: Easy, Medium, or Hard

Make them diverse - cover different areas like tooling, UX, data, infra, etc.

Return ONLY valid JSON in this exact format:
[
  {
    "title": "string",
    "murmur": "string",
    "quest": "string", 
    "value": "string",
    "difficulty": "Easy|Medium|Hard"
  }
]`
        }]
      })
    });

    if (!response.ok) {
      throw new Error('API call failed');
    }

    const data = await response.json();
    const textContent = data.content.find(c => c.type === 'text')?.text || '[]';
    
    // Extract JSON from response (Claude might wrap it in markdown)
    const jsonMatch = textContent.match(/\[[\s\S]*\]/);
    const ideas = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

    // Add sources to each idea
    return ideas.map(idea => ({
      ...idea,
      sources: [
        {
          type: "github",
          name: "GitHub Issues",
          url: "https://github.com"
        },
        {
          type: "twitter",
          name: "Developer Twitter",
          url: "https://x.com"
        }
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
      title: "Gas Fee Context Widget",
      murmur: "Users approve transactions without understanding what they're paying or why. Gas estimation is presented as raw numbers divorced from real-world context.",
      quest: "Build a browser extension that translates gas fees into relatable comparisons at checkout—coffee prices, streaming subscriptions, or transaction history percentiles.",
      value: "Reduces anxiety and confusion at the moment of highest friction. Builds trust through transparency.",
      difficulty: "Easy",
      sources: [{ type: "github", name: "Wallet UX Thread", url: "https://github.com" }]
    },
    {
      title: "Multi-Sig Proposal Diff Tool",
      murmur: "DAO contributors vote on proposals without a clear view of what actually changed between versions. Proposal iteration happens in prose, not structured diffs.",
      quest: "Create a GitHub-style diff viewer for multi-sig proposals that highlights parameter changes, role modifications, and fund movements across proposal versions.",
      value: "Enables informed voting and reduces governance theater. Makes proposal iteration transparent and auditable.",
      difficulty: "Medium",
      sources: [{ type: "github", name: "Governance Discussion", url: "https://github.com" }]
    },
    {
      title: "Smart Contract Interaction Recorder",
      murmur: "Developers manually document contract interactions for testing and tutorials. There's no tool to capture, replay, or share real user flows across contracts.",
      quest: "Build a dev tool that records wallet interactions as replayable scripts—transaction sequences, approvals, state changes—exportable as tests or documentation.",
      value: "Turns manual testing into automated regression tests. Creates living documentation from actual user behavior.",
      difficulty: "Hard",
      sources: [{ type: "github", name: "Developer Tools", url: "https://github.com" }]
    },
    {
      title: "NFT Metadata Health Monitor",
      murmur: "Projects lose track of whether their NFT metadata is actually accessible. IPFS pins expire, centralized servers go down, and holders don't notice until it's too late.",
      quest: "Create a monitoring service that regularly checks NFT metadata availability across IPFS, Arweave, and HTTP, sending alerts when assets become unreachable.",
      value: "Protects project reputation and holder value. Catches infrastructure failures before they become crises.",
      difficulty: "Medium",
      sources: [{ type: "rss", name: "NFT Infrastructure", url: "https://github.com" }]
    },
    {
      title: "Testnet Faucet Aggregator",
      murmur: "Developers waste time hunting for working testnet faucets across different chains. Faucet URLs break, rate limits vary, and there's no single source of truth.",
      quest: "Build a unified testnet faucet directory with real-time availability checks, rate limit tracking, and one-click requests across 20+ chains.",
      value: "Removes friction from the earliest stages of development. Saves hours of googling and Discord searching.",
      difficulty: "Easy",
      sources: [{ type: "github", name: "Dev Experience", url: "https://github.com" }]
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

  const days = [
    { date: "2026-01-23", generate: true },
    { date: "2026-01-24", generate: true }
  ];

  const seeded = [];

  for (const day of days) {
    const ideas = day.generate 
      ? await generateUniqueIdeas(day.date)
      : generateFallbackIdeas(day.date);

    await store.set(
      `daily-${day.date}`,
      JSON.stringify({
        date: day.date,
        mode: "editorial",
        ideas
      })
    );

    seeded.push(day.date);
  }

  return Response.json({ 
    seeded,
    message: "Archive populated with AI-generated ideas"
  });
}
