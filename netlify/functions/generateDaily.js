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

  const prompt = `You're brainstorming creative side projects for indie builders and vibe coders.

Based on these signals from the wild:
${JSON.stringify(signalContext, null, 2)}

Generate 5 playful, buildable ideas. Think: weekend experiments, creative tools, "wouldn't it be cool if..." vibes.

TONE GUIDELINES:
- Playful > serious
- Experimental > enterprise
- "I wonder..." > "The market needs..."
- Curious > corporate
- Solo builder scale, not startup scale

Each idea should be one of these types:
- Type A (40%): Thoughtful indie hacker / solo builder prompt
- Type B (20%): Early-stage product opportunity  
- Type C (40%): Creative experiment / playful tool

TITLES: Make them curious and human
Good: "What If Vibes Had a Leaderboard?"
Good: "Can I Turn My Tweets Into a Game?"
Bad: "Social Media Analytics Dashboard"
Bad: "Engagement Optimization Tool"

Return ONLY valid JSON:

[
  {
    "title": "curious question or playful observation",
    "murmur": "why this would be interesting (1-2 sentences, casual)",
    "quest": "what you'd actually build (1-2 sentences, specific but not intimidating)",
    "worth": ["reason 1 (3-8 words)", "reason 2 (3-8 words)", "reason 3 (3-8 words)"],
    "difficulty": "Easy|Medium|Hard"
  }
]

Make them feel like side quests, not jobs.`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 1.0,
        messages: [
          { role: "system", content: "You're a creative tech editor for indie builders and vibe coders. Return only valid JSON." },
          { role: "user", content: prompt }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '[]';
    
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
      title: "What If My GitHub Was a Trading Card?",
      murmur: "Your repos are just sitting there. What if they were collectible cards with stats, rarity, and vibes?",
      quest: "Turn GitHub profiles into trading card games—repos as cards, commits as XP, let people trade and battle with their open source work.",
      worth: [
        "Gamifies open source in a fun way",
        "Portfolio meets Pokemon vibes",
        "Weekend build with public APIs"
      ],
      difficulty: "Medium",
      sources: [
        { type: "github", name: "GitHub", url: "https://github.com" }
      ]
    },
    {
      title: "Can I Garden My Habits?",
      murmur: "Habit trackers are boring spreadsheets. What if your habits grew into a virtual garden instead?",
      quest: "Build a habit tracker where each habit is a plant—water it daily by doing the habit, watch it grow, let it wither if you forget.",
      worth: [
        "Makes habits actually cute",
        "No pressure, just growth",
        "Perfect for a cozy side project"
      ],
      difficulty: "Easy",
      sources: [
        { type: "hackathon", name: "Hackathons", url: "https://devpost.com" }
      ]
    },
    {
      title: "What Would My Tweets Look Like as a Zine?",
      murmur: "Your tweets are ephemeral chaos. What if you could turn a month of tweets into a printable indie zine?",
      quest: "Create a tool that pulls your tweets and auto-generates a print-ready zine layout—add doodles, pick fonts, export PDF.",
      worth: [
        "Turns tweets into physical artifacts",
        "Great creative coding project",
        "Weirdly satisfying output"
      ],
      difficulty: "Medium",
      sources: [
        { type: "github", name: "GitHub", url: "https://github.com" }
      ]
    },
    {
      title: "Can I Vibe Check My Folder Names?",
      murmur: "Your file system is a mess of 'untitled-final-REAL-v3' chaos. What if something roasted your naming choices?",
      quest: "Build a CLI tool that analyzes your messy folder structure and gently roasts your file naming habits with suggestions.",
      worth: [
        "Funny and actually useful",
        "Ships in an afternoon",
        "Everyone's file system is chaos"
      ],
      difficulty: "Easy",
      sources: [
        { type: "github", name: "GitHub", url: "https://github.com/search?q=file+organization" }
      ]
    },
    {
      title: "What If Errors Were Postcards?",
      murmur: "Console errors are ugly and stressful. What if they were beautifully designed postcards you could collect?",
      quest: "Make a dev tool that turns error messages into aesthetic postcards—save them, share them, make debugging less painful.",
      worth: [
        "Makes debugging feel creative",
        "Great portfolio piece energy",
        "People would actually use this"
      ],
      difficulty: "Easy",
      sources: [
        { type: "github", name: "GitHub", url: "https://github.com/search?q=error+message" }
      ]
    },
    {
      title: "Can I See My Year as a Mixtape?",
      murmur: "Year-in-review wrapped things are everywhere. But what if your data became an actual playable mixtape?",
      quest: "Build a year-in-review tool that turns your activity (commits, tweets, plays) into a visual mixtape with track listings.",
      worth: [
        "Wrapped vibes but weirder",
        "Fun data visualization challenge",
        "People love year-end summaries"
      ],
      difficulty: "Medium",
      sources: [
        { type: "hackathon", name: "Hackathons", url: "https://devpost.com" }
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
