import { getStore } from "@netlify/blobs";
import { getGitHubSignals } from "./github.js";
import { getHackathonSignals } from "./hackathons.js";
import { getTwitterSignals } from "./twitter.js";
import { getRoadmapSignals } from "./roadmaps.js";

const MAX_IDEAS = 5;

async function generateIdeasWithAI(signals) {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    console.log("No OpenAI API key - using fallback");
    return generateFallbackIdeas();
  }

  const signalContext = signals.slice(0, 15).map(s => ({
    type: s.type,
    text: s.text?.slice(0, 250) || ""
  }));

  const prompt = `You're analyzing real developer pain points from GitHub issues, hackathons, and builder conversations:

${JSON.stringify(signalContext, null, 2)}

Generate 5 compelling, specific side-quest ideas. Make them HUMAN and CONVERSATIONAL.

CRITICAL: Return ONLY valid JSON, no markdown, no explanations. Format:

[
  {
    "title": "conversational question like 'Why Is This So Confusing?'",
    "murmur": "what's broken in 1-2 casual sentences",
    "quest": "what to build in 1-2 sentences",
    "worth": ["benefit 1 (3-8 words)", "benefit 2 (3-8 words)", "benefit 3 (3-8 words)"],
    "difficulty": "Easy|Medium|Hard"
  }
]

Make titles casual questions, not corporate. Each idea should feel different.`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.9,
        messages: [
          { role: "system", content: "You are a creative tech editor. Return only valid JSON." },
          { role: "user", content: prompt }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '[]';
    
    // Strip markdown if present
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    const ideas = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content);

    if (!Array.isArray(ideas) || ideas.length === 0) {
      throw new Error("No ideas generated");
    }

    // Add sources
    const sourcesByType = {};
    signals.forEach(s => {
      if (!sourcesByType[s.type]) sourcesByType[s.type] = s;
    });

    return ideas.map(idea => ({
      ...idea,
      sources: Object.values(sourcesByType).slice(0, 3).map(s => ({
        type: s.type,
        name: s.type === "github" ? "GitHub" : 
              s.type === "x" ? "X" :
              s.type === "hackathon" ? "Hackathons" :
              s.type === "roadmap" ? "Roadmaps" : "Source",
        url: s.url
      }))
    }));

  } catch (error) {
    console.error('AI generation failed:', error);
    return generateFallbackIdeas();
  }
}

function generateFallbackIdeas() {
  const ideas = [
    {
      title: "Why Can't I See What This Contract Does?",
      murmur: "Smart contracts get verified but reading raw code doesn't tell you what it actually does.",
      quest: "Build a tool that explains verified contracts in plain English—what they do, what events they emit, what you can call.",
      worth: [
        "No blockchain expertise needed",
        "Makes contracts accessible",
        "Great AI + web3 portfolio piece"
      ],
      difficulty: "Medium",
      sources: [
        { type: "github", name: "GitHub", url: "https://github.com/search?q=smart+contract+confusing" }
      ]
    },
    {
      title: "Where Did All My Testnet Tokens Go?",
      murmur: "Developers waste time hunting for working faucets that actually have tokens left.",
      quest: "Create a faucet directory showing which ones work, their rate limits, and let users request from multiple chains at once.",
      worth: [
        "Saves daily developer frustration",
        "Simple UI, immediate value",
        "Ships in a weekend"
      ],
      difficulty: "Easy",
      sources: [
        { type: "hackathon", name: "Hackathons", url: "https://devpost.com" }
      ]
    },
    {
      title: "Why Will This Cost Me $50?",
      murmur: "Users approve transactions without understanding if the gas fee is normal or insane.",
      quest: "Build an extension that translates gas into real-world comparisons—coffee, Netflix, or your typical transaction.",
      worth: [
        "Reduces transaction anxiety",
        "Makes gas understandable",
        "Light frontend, big impact"
      ],
      difficulty: "Easy",
      sources: [
        { type: "github", name: "GitHub", url: "https://github.com/search?q=gas+fee+expensive" }
      ]
    },
    {
      title: "Did My Transaction Go Through?",
      murmur: "Pending transactions create anxiety—you can't tell if it's stuck, failed, or just slow.",
      quest: "Create a tracker with clear status, estimated wait time, and what to do if it's actually stuck.",
      worth: [
        "Turns confusion into clarity",
        "Useful for every web3 user",
        "Simple data fetch + good UX"
      ],
      difficulty: "Medium",
      sources: [
        { type: "github", name: "GitHub", url: "https://github.com/search?q=pending+transaction" }
      ]
    },
    {
      title: "Where Are Past DAO Votes?",
      murmur: "Voting history gets buried across forums and Discord—impossible to see how delegates actually voted.",
      quest: "Build a vote tracker showing delegate history in one place—who voted how, participation rates, accountability.",
      worth: [
        "Makes DAOs transparent",
        "Holds delegates accountable",
        "Interesting data viz challenge"
      ],
      difficulty: "Hard",
      sources: [
        { type: "github", name: "GitHub", url: "https://github.com/search?q=dao+governance" }
      ]
    }
  ];

  return ideas.sort(() => Math.random() - 0.5).slice(0, MAX_IDEAS);
}

export const handler = async () => {
  const store = getStore({
    name: "tech-murmurs",
    siteID: process.env.NETLIFY_SITE_ID,
    token: process.env.NETLIFY_AUTH_TOKEN
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
      if (r.status === "fulfilled" && Array.isArray(r.value)) {
        signals.push(...r.value);
      }
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

  return {
    statusCode: 200,
    body: JSON.stringify(payload)
  };
};
